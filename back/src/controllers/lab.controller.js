// import prisma from "../config/db.js"
// import crypto from "crypto"
// import {
//   generateHash,
//   signHash
// } from "../utils/crypto.utils.js"

// // ==========================
// // CREATE LAB RESULT
// // ==========================
// export const createLabResult = async (req, res) => {
//   try {
//     const labId = req.user.id
//     const { collectionId, result, remarks, assignedMfgId } = req.body

//     // 1️⃣ Get collection
//     const collection = await prisma.collection.findUnique({
//       where: { id: collectionId }
//     })

//     if (!collection) {
//       return res.status(404).json({ error: "Collection not found" })
//     }

//     // 2️⃣ Resolve manufacturer UUID (if provided)
//     let manufacturerUUID = null

//     if (assignedMfgId) {
//       const manufacturer = await prisma.organization.findUnique({
//         where: { orgCode: assignedMfgId }
//       })

//       if (!manufacturer) {
//         return res.status(400).json({ error: "Manufacturer not found" })
//       }

//       manufacturerUUID = manufacturer.id
//     }

//     // 3️⃣ Build canonical string (DO NOT CHANGE ORDER EVER)
//     const canonicalData =
//       `collectionId:${collectionId}|` +
//       `labId:${labId}|` +
//       `result:${result}|` +
//       `remarks:${remarks || ""}|` +
//       `assignedMfgId:${manufacturerUUID || ""}`

//     const hash = generateHash(canonicalData)

//     const lab = await prisma.organization.findUnique({
//       where: { id: labId }
//     })

//     const signature = signHash(lab.privateKey, hash)

//     // 4️⃣ Store result
//     const labResult = await prisma.labResult.create({
//       data: {
//         collectionId,
//         result,
//         remarks,
//         canonicalData,
//         hash,
//         signature,
//         labId,
//         assignedMfgId: manufacturerUUID
//       }
//     })

//     res.status(201).json(labResult)

//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: "Server error" })
//   }
// }


// export const getPastTests = async (req, res) => {
//   try {
//     const results = await prisma.labResult.findMany({
//       where: { labId: req.user.id },
//       orderBy: { createdAt: "desc" },
//       include: {
//         collection: {
//           include: {
//             farmer: true
//           }
//         },
//         assignedMfg: true
//       }
//     })

//     res.json(results)

//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: "Server error" })
//   }
// }

// export const getResultsForFarmer = async (req, res) => {
//   try {
//     const farmerId = req.user.id

//     const results = await prisma.labResult.findMany({
//       where: {
//         collection: {
//           farmerId: farmerId
//         }
//       },
//       include: {
//         collection: true,
//         assignedMfg: true,
//         lab: true
//       },
//       orderBy: { createdAt: "desc" }
//     })

//     res.json(results)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: "Server error" })
//   }
// }


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
        assignedMfgId: manufacturerUUID
      }
    })

    res.status(201).json(labResult)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}


// export const getPastTests = async (req, res) => {
//   try {
//     const results = await prisma.labResult.findMany({
//       where: { labId: req.user.id },
//       orderBy: { createdAt: "desc" },
//       include: {
//         collection: {
//           include: { farmer: true }
//         },
//         assignedMfg: true
//       }
//     })
//     res.json(results)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: "Server error" })
//   }
// }

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
