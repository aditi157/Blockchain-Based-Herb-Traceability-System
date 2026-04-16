import crypto from "crypto"
import prisma from "../config/db.js"
import {
  generateHash,
  signData,
  verifySignature,
  buildCollectionCanonical
} from "../utils/crypto.utils.js"
import { anchorHash } from "../services/blockchain.js";

export const createCollection = async (req, res) => {
  try {
    const farmerId = req.user.id
    const farmerCode = req.user.orgCode

    const { herbName, quantity, assignedLabId, location } = req.body

    const farmer = await prisma.organization.findUnique({
      where: { id: farmerId }
    })

    

    if (!farmer) {
      return res.status(404).json({ error: "Farmer not found" })
    }

    const collectionId = crypto.randomUUID()

    // ✅ Generate timestamp on backend — this exact string is stored and reused for verification
    const timestamp = new Date().toISOString()

    const canonicalData = buildCollectionCanonical({
      collectionId,
      herbName,
      quantity,
      farmerCode,
      assignedLabId,
      location,
      timestamp
    })

    let txHash = null;
    const hash = generateHash(canonicalData);

// ✅ NON-BLOCKING blockchain call
anchorHash(collectionId, hash)
  .then(async (tx) => {
    console.log("Blockchain TX:", tx);

    await prisma.collection.update({
      where: { id: collectionId },
      data: { txHash: tx }
    });
  })
  .catch((err) => {
    console.error("Blockchain failed:", err);
  });


    //const signature = signHash(farmer.privateKey, hash)
    const signature = signData(farmer.privateKey, canonicalData)


    const collection = await prisma.collection.create({
      data: {
        id: collectionId,
        herbName,
        quantity: Number(quantity),
        location,
        canonicalData,
        canonicalTimestamp: timestamp, // ✅ stored separately for exact rebuild
        hash,
        signature,
        farmerId,
        assignedLabId,
        blockchainHash: hash,
txHash: null,
      }
    })
    res.status(201).json(collection)

    console.log("\n===== SIGNING DEBUG =====")

console.log("Canonical Data (SIGNED):")
console.log(canonicalData)

console.log("\nGenerated Hash:")
console.log(hash)

console.log("\nSignature Created:")
console.log(signature)

console.log("========================\n")

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}


export const getMyCollections = async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
  where: { farmerId: req.user.id },
  include: {
    labResults: true   // 🔥 ADD THIS
  },
  orderBy: { createdAt: "desc" }
})
    res.json(collections)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}


export const getAssignedCollectionsForLab = async (req, res) => {
  try {
    const labCode = req.user.orgCode

    const collections = await prisma.collection.findMany({
  where: { assignedLabId: labCode },
  include: {
    farmer: {
      select: { 
        name: true, 
        orgCode: true,
        publicKey: true   // 🔥 ADD THIS
      }
    }
  },
  orderBy: { createdAt: "desc" }
})

    const filtered = await Promise.all(
      collections.map(async (collection) => {
        const existing = await prisma.labResult.findFirst({
          where: { collectionId: collection.id }
        })
        return existing ? null : collection
      })
    )

    res.json(filtered.filter(Boolean))

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}


export const validateFarmerSignature = async (req, res) => {
  try {
    const { id } = req.params

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: { farmer: true }
    })

    if (!collection) {
      return res.status(404).json({ error: "Collection not found" })
    }

    const rebuiltCanonical = buildCollectionCanonical({
      collectionId: collection.id,
      herbName: collection.herbName,
      quantity: collection.quantity,
      farmerCode: collection.farmer.orgCode,
      assignedLabId: collection.assignedLabId,
      location: collection.location,
      timestamp: collection.canonicalTimestamp
    })

    const rebuiltHash = generateHash(rebuiltCanonical)

    const canonicalMatch = rebuiltCanonical === collection.canonicalData
    const hashMatch = rebuiltHash === collection.hash

    const signatureValid = verifySignature(
      collection.farmer.publicKey,
      rebuiltCanonical,
      collection.signature
    )

    return res.json({
      valid: hashMatch && signatureValid,
      hashMatch,
      signatureValid,
      canonicalMatch,
      storedHash: collection.hash,
      recomputedHash: rebuiltHash,
      signer: collection.farmer.orgCode,
      timestamp: collection.canonicalTimestamp,
      txHash: collection.txHash,
      etherscan: collection.txHash
        ? `https://sepolia.etherscan.io/tx/${collection.txHash}`
        : null
    })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Server error" })
  }
}