// import crypto from "crypto"
// import prisma from "../config/db.js"
// import {
//   generateHash,
//   signHash,
//   buildManufacturingCanonical
// } from "../utils/crypto.utils.js"

// /*
//   APPROVED LAB RESULTS
// */
// export const getApprovedResults = async (req, res) => {
//   try {
//     const manufacturerId = req.user.id

//     const results = await prisma.labResult.findMany({
//       where: {
//         assignedMfgId: manufacturerId,
//         result: "PASS"
//       },
//       include: {
//         lab: true,
//         collection: {
//           include: {
//             farmer: true
//           }
//         }
//       },
//       orderBy: { createdAt: "desc" }
//     })

//     res.json(results)

//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: "Server error" })
//   }
// }

// /*
//   CREATE MANUFACTURING BATCH
// */
// export const createBatch = async (req, res) => {
//   try {
//     const manufacturerId = req.user.id

//     // ✅ FIX: destructure properly
//     const {
//       labResultId,
//       batchName,
//       herbUsedQuantity,
//       finalProductQuantity,
//       expiryDate
//     } = req.body

//     if (
//       !labResultId ||
//       !batchName ||
//       !herbUsedQuantity ||
//       !finalProductQuantity ||
//       !expiryDate
//     ) {
//       return res.status(400).json({ error: "Missing required fields" })
//     }

//     const manufacturer = await prisma.organization.findUnique({
//       where: { id: manufacturerId }
//     })

//     if (!manufacturer) {
//       return res.status(404).json({ error: "Manufacturer not found" })
//     }

//     // 🔎 Get lab result + collection
//     const labResult = await prisma.labResult.findUnique({
//       where: { id: labResultId },
//       include: {
//         collection: true
//       }
//     })

//     if (!labResult) {
//       return res.status(404).json({ error: "Lab result not found" })
//     }

//     // 🔎 Calculate already used quantity
//     const existingBatches = await prisma.manufacturingBatch.findMany({
//       where: { labResultId }
//     })

//     const totalUsed = existingBatches.reduce(
//       (sum, b) => sum + b.herbUsedQuantity,
//       0
//     )

//     if (totalUsed + Number(herbUsedQuantity) > labResult.collection.quantity) {
//       return res.status(400).json({
//         error: "Not enough remaining herb quantity"
//       })
//     }

//     // Generate sequential BATCH-XXX
//     const count = await prisma.manufacturingBatch.count()
//     const batchCode = `BATCH-${String(count + 1).padStart(3, "0")}`

//     const batchId = crypto.randomUUID()
//     const timestamp = new Date().toISOString()

//     // 🔐 Canonical structure
//     const canonicalData = buildManufacturingCanonical({
//       batchId,
//       batchName,
//       labResultId,
//       manufacturerId,
//       herbUsedQuantity: String(herbUsedQuantity),
//       finalProductQuantity: String(finalProductQuantity),
//       expiryDate: new Date(expiryDate).toISOString(),
//       timestamp
//     })

//     const hash = generateHash(canonicalData)
//     const signature = signHash(manufacturer.privateKey, hash)

//     const batch = await prisma.manufacturingBatch.create({
//       data: {
//         id: batchId,
//         batchCode,
//         batchName,
//         herbUsedQuantity: Number(herbUsedQuantity),
//         finalProductQuantity: Number(finalProductQuantity),
//         expiryDate: new Date(expiryDate),
//         canonicalData,
//         hash,
//         signature,
//         manufacturerId,
//         labResultId
//       }
//     })

//     res.status(201).json(batch)

//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: "Server error" })
//   }
// }


// export const getMyBatches = async (req, res) => {
//   try {
//     const manufacturerId = req.user.id

//     const batches = await prisma.manufacturingBatch.findMany({
//       where: { manufacturerId },
//       include: {
//         labResult: {
//           include: {
//             lab: true,
//             collection: {
//               include: {
//                 farmer: true
//               }
//             }
//           }
//         }
//       },
//       orderBy: { createdAt: "desc" }
//     })

//     res.json(batches)

//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: "Server error" })
//   }
// }


import crypto from "crypto"
import prisma from "../config/db.js"
import {
  generateHash,
  signData,
  buildManufacturingCanonical
} from "../utils/crypto.utils.js"


export const getApprovedResults = async (req, res) => {
  try {
    const manufacturerId = req.user.id

    const results = await prisma.labResult.findMany({
      where: {
        assignedMfgId: manufacturerId,
        result: "PASS"
      },
      include: {
        lab: true,
        collection: {
          include: { farmer: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    res.json(results)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}


export const createBatch = async (req, res) => {
  try {
    const manufacturerId = req.user.id

    const {
      labResultId,
      batchName,
      herbUsedQuantity,
      finalProductQuantity,
      expiryDate
    } = req.body

    if (!labResultId || !batchName || !herbUsedQuantity || !finalProductQuantity || !expiryDate) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const manufacturer = await prisma.organization.findUnique({
      where: { id: manufacturerId }
    })

    if (!manufacturer) {
      return res.status(404).json({ error: "Manufacturer not found" })
    }

    const labResult = await prisma.labResult.findUnique({
      where: { id: labResultId },
      include: { collection: true }
    })

    if (!labResult) {
      return res.status(404).json({ error: "Lab result not found" })
    }

    const existingBatches = await prisma.manufacturingBatch.findMany({
      where: { labResultId }
    })

    const totalUsed = existingBatches.reduce((sum, b) => sum + b.herbUsedQuantity, 0)

    if (totalUsed + Number(herbUsedQuantity) > labResult.collection.quantity) {
      return res.status(400).json({ error: "Not enough remaining herb quantity" })
    }

    const count = await prisma.manufacturingBatch.count()
    const batchCode = `BATCH-${String(count + 1).padStart(3, "0")}`

    const batchId = crypto.randomUUID()

    // ✅ Generate timestamp — stored separately so verification can rebuild exactly
    const timestamp = new Date().toISOString()
    const expiryIso = new Date(expiryDate).toISOString()

    const canonicalData = buildManufacturingCanonical({
      batchId,
      batchName,
      labResultId,
      manufacturerId,
      herbUsedQuantity: String(herbUsedQuantity),
      finalProductQuantity: String(finalProductQuantity),
      expiryDate: expiryIso,
      timestamp
    })

    const hash = generateHash(canonicalData)
    const signature = signData(manufacturer.privateKey, canonicalData)

    const batch = await prisma.manufacturingBatch.create({
      data: {
        id: batchId,
        batchCode,
        batchName,
        herbUsedQuantity: Number(herbUsedQuantity),
        finalProductQuantity: Number(finalProductQuantity),
        expiryDate: new Date(expiryDate),
        canonicalData,
        canonicalTimestamp: timestamp, // ✅ stored for exact rebuild during verification
        hash,
        signature,
        manufacturerId,
        labResultId
      }
    })

    res.status(201).json(batch)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}


export const getMyBatches = async (req, res) => {
  try {
    const manufacturerId = req.user.id

    const batches = await prisma.manufacturingBatch.findMany({
      where: { manufacturerId },
      include: {
        labResult: {
          include: {
            lab: true,
            collection: {
              include: { farmer: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    res.json(batches)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}
