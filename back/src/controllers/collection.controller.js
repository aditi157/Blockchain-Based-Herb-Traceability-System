// import crypto from "crypto"
// import prisma from "../config/db.js"
// import {
//   generateHash,
//   signHash,
//   verifySignature,
//   buildCollectionCanonical
// } from "../utils/crypto.utils.js"



// export const createCollection = async (req, res) => {
//   try {
//     const farmerId = req.user.id
//     const farmerCode = req.user.orgCode

//     const { herbName, quantity, assignedLabId, location } = req.body

//     // Get farmer (for private key)
//     const farmer = await prisma.organization.findUnique({
//       where: { id: farmerId }
//     })

//     if (!farmer) {
//       return res.status(404).json({ error: "Farmer not found" })
//     }

//     const collectionId = crypto.randomUUID()

//     // 🔒 Always generate timestamp on backend
//     const timestamp = new Date().toISOString()

//     const canonicalData = buildCollectionCanonical({
//       collectionId,
//       herbName,
//       quantity,
//       farmerCode,            // ✅ use orgCode instead of UUID
//       assignedLabId,
//       location,
//       timestamp
//     })

//     const hash = generateHash(canonicalData)

//     const signature = signHash(farmer.privateKey, hash)

//     const collection = await prisma.collection.create({
//       data: {
//         id: collectionId,
//         herbName,
//         quantity: Number(quantity),
//         location,            // ✅ store location
//         canonicalData,
//         hash,
//         signature,
//         farmerId,
//         assignedLabId
//       }
//     })

//     res.status(201).json(collection)

//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: "Server error" })
//   }
// }


// export const getMyCollections = async (req, res) => {
//   try {
//     const collections = await prisma.collection.findMany({
//       where: { farmerId: req.user.id },
//       orderBy: { createdAt: "desc" }
//     })
//     res.json(collections)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: "Server error" })
//   }
// }


// export const getAssignedCollectionsForLab = async (req, res) => {
//   try {
//     const labCode = req.user.orgCode

//     const collections = await prisma.collection.findMany({
//       where: {
//         assignedLabId: labCode
//       },
//       include: {
//         farmer: {
//           select: {
//             name: true,
//             orgCode: true
//           }
//         }
//       },
//       orderBy: { createdAt: "desc" }
//     })

//     // Manually filter those that already have lab results
//     const filtered = await Promise.all(
//       collections.map(async (collection) => {
//         const existing = await prisma.labResult.findFirst({
//           where: { collectionId: collection.id }
//         })
//         return existing ? null : collection
//       })
//     )

//     res.json(filtered.filter(Boolean))

//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: "Server error" })
//   }
// }

// // export const validateFarmerSignature = async (req, res) => {
// //   try {
// //     const { id } = req.params

// //     const collection = await prisma.collection.findUnique({
// //       where: { id },
// //       include: { farmer: true }
// //     })

// //     if (!collection) {
// //       return res.status(404).json({ error: "Collection not found" })
// //     }

// //     // 1️⃣ Recompute hash from stored canonical
// //     const recomputedHash = generateHash(collection.canonicalData)

// //     if (recomputedHash !== collection.hash) {
// //       return res.json({
// //         valid: false,
// //         reason: "Hash mismatch — data tampered"
// //       })
// //     }

// //     // 2️⃣ Verify signature
// //     const validSignature = verifySignature(
// //       collection.farmer.publicKey,
// //       collection.hash,
// //       collection.signature
// //     )

// //     if (!validSignature) {
// //       return res.json({
// //         valid: false,
// //         reason: "Signature invalid"
// //       })
// //     }

// //     res.json({
// //       valid: true,
// //       message: "Farmer signature verified successfully"
// //     })

// //   } catch (err) {
// //     console.error(err)
// //     res.status(500).json({ error: "Server error" })
// //   }
// // }

// export const validateFarmerSignature = async (req, res) => {
//   try {
//     const { id } = req.params

//     const collection = await prisma.collection.findUnique({
//       where: { id },
//       include: { farmer: true }
//     })

//     if (!collection) {
//       return res.status(404).json({ error: "Collection not found" })
//     }

//     // 🔥 Rebuild canonical from CURRENT DB fields
//     const rebuiltCanonical = buildCollectionCanonical({
//       collectionId: collection.id,
//       herbName: collection.herbName,
//       quantity: collection.quantity,
//       farmerCode: collection.farmer.orgCode,   // IMPORTANT: orgCode
//       assignedLabId: collection.assignedLabId,
//       location: collection.location,
//       timestamp: collection.createdAt.toISOString() // MUST match creation format
//     })

//     // 🔒 Recompute hash from rebuilt canonical
//     const rebuiltHash = generateHash(rebuiltCanonical)

//     // 🚨 Compare hashes first
//     if (rebuiltHash !== collection.hash) {
//       return res.json({
//         valid: false,
//         reason: "Hash mismatch — data tampered"
//       })
//     }

//     // 🔐 Verify signature using PUBLIC KEY and rebuilt hash
//     const validSignature = verifySignature(
//       collection.farmer.publicKey,
//       rebuiltHash,
//       collection.signature
//     )

//     if (!validSignature) {
//       return res.json({
//         valid: false,
//         reason: "Signature invalid"
//       })
//     }

//     return res.json({
//       valid: true,
//       message: "Farmer signature verified successfully"
//     })

//   } catch (err) {
//     console.error(err)
//     return res.status(500).json({ error: "Server error" })
//   }
// }


import crypto from "crypto"
import prisma from "../config/db.js"
import {
  generateHash,
  signData,
  verifySignature,
  buildCollectionCanonical
} from "../utils/crypto.utils.js"


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

    const hash = generateHash(canonicalData)
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
        assignedLabId
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

    // ✅ Rebuild canonical from actual DB field values + stored canonicalTimestamp.
    // If herbName (or any other field) was tampered in the DB, the rebuilt canonical
    // will differ from what was originally signed, and the hash will not match.
    const rebuiltCanonical = buildCollectionCanonical({
      collectionId: collection.id,
      herbName:     collection.herbName,
      quantity:     collection.quantity,
      farmerCode:   collection.farmer.orgCode,
      assignedLabId: collection.assignedLabId,
      location:     collection.location,
      timestamp:    collection.canonicalTimestamp // ✅ exact original string, not createdAt
    })

    const rebuiltHash = generateHash(rebuiltCanonical)

    // Step 1 — hash check: does the data in the DB match what was originally committed?
    if (rebuiltHash !== collection.hash) {
      return res.json({
        valid: false,
        reason: "Hash mismatch — DB data has been tampered"
      })
    }

    // Step 2 — signature check: was this hash signed by the farmer's private key?
    // We use collection.canonicalData here because the signature was created from
    // that exact byte sequence. Since rebuiltHash === collection.hash, we know the
    // data is intact, so verifying against the stored hash is valid.
    const signatureValid = verifySignature(
      collection.farmer.publicKey,
      rebuiltCanonical,
      collection.signature
    )

    console.log("Signature Valid:", signatureValid)

    console.log("----- BACKEND VALIDATION -----")
console.log("Stored Canonical:", collection.canonicalData)
console.log("Rebuilt Canonical:", rebuiltCanonical)
console.log("Stored Hash:", collection.hash)
console.log("Rebuilt Hash:", rebuiltHash)
console.log("--------------------------------")

console.log("\n===== SIGNATURE DEBUG (BACKEND) =====")

console.log("Rebuilt Canonical:")
console.log(rebuiltCanonical)

console.log("\nStored Canonical:")
console.log(collection.canonicalData)

console.log("\nCanonical MATCH:", rebuiltCanonical === collection.canonicalData)

console.log("\nHash Used:")
console.log(collection.hash)

console.log("\nSignature:")
console.log(collection.signature)

console.log("\nPublic Key:")
console.log(collection.farmer.publicKey)

console.log("====================================\n")


    if (!signatureValid) {
      return res.json({
        valid: false,
        reason: "Signature invalid — hash may have been forged"
      })
    }

    return res.json({
      valid: true,
      message: "Farmer signature verified successfully"
    })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Server error" })
  }
  
}
