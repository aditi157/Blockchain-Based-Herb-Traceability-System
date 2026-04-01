// import prisma from "../config/db.js"
// import {
//   generateHash,
//   buildCollectionCanonical,
//   verifySignature
// } from "../utils/crypto.utils.js"

// // export const validateFarmer = async (req, res) => {
// //   try {
// //     const { batchCode } = req.body

// //     const batch = await prisma.manufacturingBatch.findUnique({
// //       where: { batchCode },
// //       include: {
// //         labResult: {
// //           include: {
// //             collection: {
// //               include: { farmer: true }
// //             }
// //           }
// //         }
// //       }
// //     })

// //     if (!batch) {
// //       return res.status(404).json({ error: "Batch not found" })
// //     }

// //     const collection = batch.labResult.collection
// //     const farmer = collection.farmer

// //     // 🔁 REBUILD CANONICAL EXACTLY
// //     const recomputedCanonical = buildCollectionCanonical({
// //       collectionId: collection.id,
// //       herbName: collection.herbName,
// //       quantity: collection.quantity,
// //       farmerId: collection.farmerId,
// //       assignedLabId: collection.assignedLabId,
// //       location: collection.location,
// //       timestamp: collection.createdAt.toISOString()
// //     })

// //     const recomputedHash = generateHash(recomputedCanonical)

// //     const hashMatch = recomputedHash === collection.hash

// //     const signatureValid = verifySignature(
// //       farmer.publicKey,
// //       collection.hash,
// //       collection.signature
// //     )

// //     res.json({
// //       hashMatch,
// //       signatureValid
// //     })

// //   } catch (err) {
// //     console.error(err)
// //     res.status(500).json({ error: "Server error" })
// //   }
// // }

// export const validateFarmer = async (req, res) => {
//   try {
//     const { batchCode } = req.body

//     const batch = await prisma.manufacturingBatch.findUnique({
//       where: { batchCode },
//       include: {
//         labResult: {
//           include: {
//             collection: {
//               include: { farmer: true }
//             }
//           }
//         }
//       }
//     })

//     if (!batch) {
//       return res.status(404).json({ error: "Batch not found" })
//     }

//     const collection = batch.labResult.collection
//     const farmer = collection.farmer

//     // ✅ FIXED canonical rebuild
//     const rebuiltCanonical = buildCollectionCanonical({
//       collectionId: collection.id,
//       herbName: collection.herbName,
//       quantity: collection.quantity,
//       farmerCode: farmer.orgCode,
//       assignedLabId: collection.assignedLabId,
//       location: collection.location,
//       timestamp: collection.signedTimestamp
//     })

//     const rebuiltHash = generateHash(rebuiltCanonical)

//     const hashMatch = rebuiltHash === collection.hash

//     const signatureValid = verifySignature(
//       farmer.publicKey,
//       collection.hash,
//       collection.signature
//     )

//     res.json({
//       hashMatch,
//       signatureValid,
//       storedHash: collection.hash,
//       computedHash: rebuiltHash
//     })

//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: "Server error" })
//   }
// }


// export const getBatchTrace = async (req, res) => {
//   try {
//     const { batchCode } = req.params

//     const batch = await prisma.manufacturingBatch.findUnique({
//       where: { batchCode },
//       include: {
//         manufacturer: true,
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
//       }
//     })

//     if (!batch) {
//       return res.status(404).json({ error: "Batch not found" })
//     }

//     res.json(batch)

//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: "Server error" })
//   }
// }


import prisma from "../config/db.js"
import {
  generateHash,
  verifySignature,
  buildCollectionCanonical,
  buildLabResultCanonical,
  buildManufacturingCanonical
} from "../utils/crypto.utils.js"


export const validateFarmer = async (req, res) => {
  try {
    const { batchCode } = req.body

    const batch = await prisma.manufacturingBatch.findUnique({
      where: { batchCode },
      include: {
        labResult: {
          include: {
            collection: {
              include: { farmer: true }
            }
          }
        }
      }
    })

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" })
    }

    const collection = batch.labResult.collection
    const farmer = collection.farmer

    // ✅ Rebuild from actual DB field values + stored canonicalTimestamp
    // farmerCode (orgCode) is used — matching what createCollection stored
    const rebuiltCanonical = buildCollectionCanonical({
      collectionId:  collection.id,
      herbName:      collection.herbName,
      quantity:      collection.quantity,
      farmerCode:    farmer.orgCode,          // ✅ orgCode not UUID
      assignedLabId: collection.assignedLabId,
      location:      collection.location,
      timestamp:     collection.canonicalTimestamp  // ✅ not createdAt
    })

    const rebuiltHash = generateHash(rebuiltCanonical)
    const hashMatch = rebuiltHash === collection.hash

    const signatureValid = verifySignature(
      farmer.publicKey,
      collection.hash,
      collection.signature
    )

    res.json({ hashMatch, signatureValid })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}


export const validateLab = async (req, res) => {
  try {
    const { batchCode } = req.body

    const batch = await prisma.manufacturingBatch.findUnique({
      where: { batchCode },
      include: {
        labResult: {
          include: { lab: true }
        }
      }
    })

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" })
    }

    const labResult = batch.labResult
    const lab = labResult.lab

    // ✅ Rebuild from actual DB field values + stored canonicalTimestamp
    const rebuiltCanonical = buildLabResultCanonical({
      labResultId:   labResult.id,
      collectionId:  labResult.collectionId,
      labCode:       lab.orgCode,             // ✅ orgCode not UUID
      result:        labResult.result,
      remarks:       labResult.remarks,
      assignedMfgId: labResult.assignedMfgId,
      timestamp:     labResult.canonicalTimestamp  // ✅ not createdAt
    })

    const rebuiltHash = generateHash(rebuiltCanonical)
    const hashMatch = rebuiltHash === labResult.hash

    const signatureValid = verifySignature(
      lab.publicKey,
      labResult.hash,
      labResult.signature
    )

    res.json({ hashMatch, signatureValid })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}


export const validateManufacturer = async (req, res) => {
  try {
    const { batchCode } = req.body

    const batch = await prisma.manufacturingBatch.findUnique({
      where: { batchCode },
      include: { manufacturer: true }
    })

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" })
    }

    // ✅ Rebuild from actual DB field values + stored canonicalTimestamp
    const rebuiltCanonical = buildManufacturingCanonical({
      batchId:              batch.id,
      batchName:            batch.batchName,
      labResultId:          batch.labResultId,
      manufacturerId:       batch.manufacturerId,
      herbUsedQuantity:     String(batch.herbUsedQuantity),
      finalProductQuantity: String(batch.finalProductQuantity),
      expiryDate:           new Date(batch.expiryDate).toISOString(),
      timestamp:            batch.canonicalTimestamp  // ✅ not createdAt
    })

    const rebuiltHash = generateHash(rebuiltCanonical)
    const hashMatch = rebuiltHash === batch.hash

    const signatureValid = verifySignature(
      batch.manufacturer.publicKey,
      batch.hash,
      batch.signature
    )

    res.json({ hashMatch, signatureValid })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}


export const getBatchTrace = async (req, res) => {
  try {
    const { batchCode } = req.params

    const batch = await prisma.manufacturingBatch.findUnique({
      where: { batchCode },
      include: {
        manufacturer: true,
        labResult: {
          include: {
            lab: true,
            collection: {
              include: { farmer: true }
            }
          }
        }
      }
    })

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" })
    }

    res.json(batch)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}
