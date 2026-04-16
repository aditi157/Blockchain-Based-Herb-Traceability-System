import { anchorHash } from "../services/blockchain.js";
import prisma from "../config/db.js"
import crypto from "crypto"
import {
  generateHash,
  signData,
  verifySignature,
  buildLabResultCanonical
} from "../utils/crypto.utils.js"


export const createLabResult = async (req, res) => {
  try {
    const labId = req.user.id
    const labCode = req.user.orgCode  // ✅ use orgCode, not UUID

    const { collectionId, result, remarks, assignedMfgId } = req.body

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId }
    })

    if (!collection) {
      return res.status(404).json({ error: "Collection not found" })
    }

    // Resolve manufacturer orgCode → UUID if provided
    let manufacturerUUID = null
    if (assignedMfgId) {
      const manufacturer = await prisma.organization.findUnique({
        where: { orgCode: assignedMfgId }
      })
      if (!manufacturer) {
        return res.status(400).json({ error: "Manufacturer not found" })
      }
      manufacturerUUID = manufacturer.id
    }

    const labResultId = crypto.randomUUID()

    // ✅ Generate timestamp — stored separately so verification can rebuild exactly
    const timestamp = new Date().toISOString()

    // ✅ Use the shared canonical builder — same function used on frontend for transit check
    const canonicalData = buildLabResultCanonical({
      labResultId,
      collectionId,
      labCode,          // orgCode, not UUID
      result,
      remarks,
      assignedMfgId: manufacturerUUID,
      timestamp
    })

    const hash = generateHash(canonicalData)
    
// 🔥 DEBUG
console.log("ANCHORING LAB:", labResultId, hash);

anchorHash(labResultId, hash)
  .then(async (tx) => {
    console.log("LAB TX:", tx);

    await prisma.labResult.update({
      where: { id: labResultId },
      data: { txHash: tx }
    });
  })
  .catch((err) => {
    console.error("LAB BLOCKCHAIN FAILED:", err);
  });



    const lab = await prisma.organization.findUnique({ where: { id: labId } })
    const signature = signData(lab.privateKey, canonicalData)

    const labResult = await prisma.labResult.create({
      data: {
        id: labResultId,
        collectionId,
        result,
        remarks,
        canonicalData,
        canonicalTimestamp: timestamp, // ✅ stored for exact rebuild during verification
        hash,
        signature,
        labId,
        assignedMfgId: manufacturerUUID,
        blockchainHash: hash,
        txHash: null 
      }
    })

    res.status(201).json(labResult)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}




export const getPastTests = async (req, res) => {
  try {
    const results = await prisma.labResult.findMany({
      where: { labId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        collection: {
          include: {
            farmer: {
              select: {
                name: true,
                orgCode: true,
                publicKey: true
              }
            }
          }
        },
        assignedMfg: true
      }
    })

    res.json(results)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}

export const getResultsForFarmer = async (req, res) => {
  try {
    const farmerId = req.user.id

    const results = await prisma.labResult.findMany({
      where: {
        collection: { farmerId }
      },
      include: {
        collection: true,
        assignedMfg: true,
        lab: true
      },
      orderBy: { createdAt: "desc" }
    })

    res.json(results)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}
export const validateLabResult = async (req, res) => {
  try {
    const { id } = req.params

    const labResult = await prisma.labResult.findUnique({
      where: { id },
      include: {
        lab: true
      }
    })

    if (!labResult) {
      return res.status(404).json({ error: "Lab result not found" })
    }

    const rebuiltCanonical = buildLabResultCanonical({
      labResultId: labResult.id,
      collectionId: labResult.collectionId,
      labCode: labResult.lab.orgCode,
      result: labResult.result,
      remarks: labResult.remarks,
      assignedMfgId: labResult.assignedMfgId,
      timestamp: labResult.canonicalTimestamp
    })

    const rebuiltHash = generateHash(rebuiltCanonical)

    const canonicalMatch = rebuiltCanonical === labResult.canonicalData
    const hashMatch = rebuiltHash === labResult.hash

    const signatureValid = verifySignature(
      labResult.lab.publicKey,
      rebuiltCanonical,
      labResult.signature
    )

    return res.json({
      valid: hashMatch && signatureValid,
      dbValid: hashMatch,
      signatureValid,
      canonicalMatch,
      storedHash: labResult.hash,
      recomputedHash: rebuiltHash,
      signer: labResult.lab.orgCode,
      timestamp: labResult.canonicalTimestamp,
      txHash: labResult.txHash,
      etherscan: labResult.txHash
        ? `https://sepolia.etherscan.io/tx/${labResult.txHash}`
        : null
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}
