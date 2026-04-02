### herbtrace

### 

### 

### 

### herbtrace/back/prisma/schema.prisma:



generator client {

&#x20; provider = "prisma-client-js"

}



datasource db {

&#x20; provider = "mysql"

&#x20; url      = env("DATABASE\_URL")

}



model Organization {

&#x20; id         String   @id @default(uuid())

&#x20; orgCode    String   @unique

&#x20; name       String

&#x20; email      String   @unique

&#x20; password   String

&#x20; role       Role

&#x20; publicKey  String   @db.LongText

&#x20; privateKey String   @db.LongText

&#x20; createdAt  DateTime @default(now())



&#x20; collections        Collection\[] @relation("FarmerCollections")

&#x20; labResults         LabResult\[]  @relation("LabResults")

&#x20; assignedLabResults LabResult\[]  @relation("ManufacturerAssignments")



&#x20; manufacturedBatches ManufacturingBatch\[] // ✅ ADD THIS

}



model Collection {

&#x20; id            String   @id @default(uuid())

&#x20; herbName      String

&#x20; quantity      Int

&#x20; location      String?

&#x20; canonicalData String   @db.LongText

&#x20; hash          String

&#x20; signature     String   @db.LongText

&#x20; farmerId      String

&#x20; assignedLabId String?

&#x20; createdAt     DateTime @default(now())



&#x20; farmer     Organization @relation("FarmerCollections", fields: \[farmerId], references: \[id])

&#x20; labResults LabResult\[] // ✅ relation side

}



model LabResult {

&#x20; id            String   @id @default(uuid())

&#x20; collectionId  String

&#x20; result        String

&#x20; remarks       String?  @db.LongText

&#x20; canonicalData String   @db.LongText

&#x20; hash          String

&#x20; signature     String   @db.LongText

&#x20; labId         String

&#x20; assignedMfgId String?

&#x20; createdAt     DateTime @default(now())



&#x20; collection Collection @relation(fields: \[collectionId], references: \[id]) // 🔥 THIS LINE



&#x20; lab                  Organization         @relation("LabResults", fields: \[labId], references: \[id])

&#x20; assignedMfg          Organization?        @relation("ManufacturerAssignments", fields: \[assignedMfgId], references: \[id])

&#x20; manufacturingBatches ManufacturingBatch\[]

}



model ManufacturingBatch {

&#x20; id                    String   @id @default(uuid())

&#x20; batchCode             String   @unique

&#x20; batchName             String?      // ← temporary optional

&#x20; herbUsedQuantity      Int?         // ← temporary optional

&#x20; finalProductQuantity  Int?         // ← temporary optional

&#x20; expiryDate            DateTime?    // ← temporary optional

&#x20; canonicalData         String   @db.LongText

&#x20; hash                  String

&#x20; signature             String   @db.LongText

&#x20; manufacturerId        String

&#x20; labResultId           String

&#x20; createdAt             DateTime @default(now())



&#x20; manufacturer Organization @relation(fields: \[manufacturerId], references: \[id])

&#x20; labResult    LabResult    @relation(fields: \[labResultId], references: \[id])

}





enum Role {

&#x20; FARMER

&#x20; LAB

&#x20; MANUFACTURER

&#x20; CONSUMER

}







### herbtrace/back/src/config/db.js:



import { PrismaClient } from "@prisma/client"



const prisma = new PrismaClient()



export default prisma







### herbtrace/back/src/controllers/auth.controller.js:



import bcrypt from "bcrypt"

import jwt from "jsonwebtoken"

import crypto from "crypto"

import prisma from "../config/db.js"



function generateKeyPair() {

&#x20; return crypto.generateKeyPairSync("ec", {

&#x20;   namedCurve: "P-256",

&#x20;   publicKeyEncoding:  { type: "spki",  format: "pem" },

&#x20;   privateKeyEncoding: { type: "pkcs8", format: "pem" },

&#x20; })

}



async function generateOrgCode(role) {

&#x20; const prefixMap = {

&#x20;   FARMER:       "FARM",

&#x20;   LAB:          "LAB",

&#x20;   MANUFACTURER: "MFG",

&#x20;   CONSUMER:     "CONS",

&#x20; }

&#x20; const prefix = prefixMap\[role]

&#x20; if (!prefix) throw new Error("Invalid role")



&#x20; const count = await prisma.organization.count({ where: { role } })

&#x20; return `${prefix}-${String(count + 1).padStart(3, "0")}`

}



// Role values the frontend sends → enum values in DB

const ROLE\_MAP = {

&#x20; farmer:       "FARMER",

&#x20; laboratory:   "LAB",

&#x20; manufacturer: "MANUFACTURER",

&#x20; consumer:     "CONSUMER",

&#x20; // already-correct values pass through

&#x20; FARMER:       "FARMER",

&#x20; LAB:          "LAB",

&#x20; MANUFACTURER: "MANUFACTURER",

&#x20; CONSUMER:     "CONSUMER",

}



export const register = async (req, res) => {

&#x20; const { name, email, password, role } = req.body



&#x20; const normalizedRole = ROLE\_MAP\[role?.toLowerCase()] || ROLE\_MAP\[role]



&#x20; if (!normalizedRole) {

&#x20;   return res.status(400).json({ message: `Invalid role: ${role}` })

&#x20; }



&#x20; try {

&#x20;   const existing = await prisma.organization.findUnique({ where: { email } })

&#x20;   if (existing) return res.status(400).json({ message: "Email already exists" })



&#x20;   const hashedPassword = await bcrypt.hash(password, 10)

&#x20;   const { publicKey, privateKey } = generateKeyPair()

&#x20;   const orgCode = await generateOrgCode(normalizedRole)



&#x20;   await prisma.organization.create({

&#x20;     data: { orgCode, name, email, password: hashedPassword, role: normalizedRole, publicKey, privateKey }

&#x20;   })



&#x20;   res.status(201).json({ message: "Registered successfully", orgCode })

&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   res.status(500).json({ message: "Server error" })

&#x20; }

}



export const login = async (req, res) => {

&#x20; const { email, password } = req.body



&#x20; try {

&#x20;   const user = await prisma.organization.findUnique({ where: { email } })

&#x20;   if (!user) return res.status(400).json({ message: "Invalid credentials" })



&#x20;   const valid = await bcrypt.compare(password, user.password)

&#x20;   if (!valid) return res.status(400).json({ message: "Invalid credentials" })



&#x20;   const token = jwt.sign(

&#x20;     { id: user.id, role: user.role },

&#x20;     process.env.JWT\_SECRET,

&#x20;     { expiresIn: "1d" }

&#x20;   )



&#x20;   res.json({ token, role: user.role, orgCode: user.orgCode })

&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   res.status(500).json({ message: "Server error" })

&#x20; }

}



### herbtrace/back/src/controllers/collection.controller.js:



import crypto from "crypto"

import prisma from "../config/db.js"

import {

&#x20; generateHash,

&#x20; signHash,

&#x20; verifySignature,

&#x20; buildCollectionCanonical

} from "../utils/crypto.utils.js"







export const createCollection = async (req, res) => {

&#x20; try {

&#x20;   const farmerId = req.user.id

&#x20;   const farmerCode = req.user.orgCode



&#x20;   const { herbName, quantity, assignedLabId, location } = req.body



&#x20;   // Get farmer (for private key)

&#x20;   const farmer = await prisma.organization.findUnique({

&#x20;     where: { id: farmerId }

&#x20;   })



&#x20;   if (!farmer) {

&#x20;     return res.status(404).json({ error: "Farmer not found" })

&#x20;   }



&#x20;   const collectionId = crypto.randomUUID()



&#x20;   // 🔒 Always generate timestamp on backend

&#x20;   const timestamp = new Date().toISOString()



&#x20;   const canonicalData = buildCollectionCanonical({

&#x20;     collectionId,

&#x20;     herbName,

&#x20;     quantity,

&#x20;     farmerCode,            // ✅ use orgCode instead of UUID

&#x20;     assignedLabId,

&#x20;     location,

&#x20;     timestamp

&#x20;   })



&#x20;   const hash = generateHash(canonicalData)



&#x20;   const signature = signHash(farmer.privateKey, hash)



&#x20;   const collection = await prisma.collection.create({

&#x20;     data: {

&#x20;       id: collectionId,

&#x20;       herbName,

&#x20;       quantity: Number(quantity),

&#x20;       location,            // ✅ store location

&#x20;       canonicalData,

&#x20;       hash,

&#x20;       signature,

&#x20;       farmerId,

&#x20;       assignedLabId

&#x20;     }

&#x20;   })



&#x20;   res.status(201).json(collection)



&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   res.status(500).json({ error: "Server error" })

&#x20; }

}





export const getMyCollections = async (req, res) => {

&#x20; try {

&#x20;   const collections = await prisma.collection.findMany({

&#x20;     where: { farmerId: req.user.id },

&#x20;     orderBy: { createdAt: "desc" }

&#x20;   })

&#x20;   res.json(collections)

&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   res.status(500).json({ error: "Server error" })

&#x20; }

}





export const getAssignedCollectionsForLab = async (req, res) => {

&#x20; try {

&#x20;   const labCode = req.user.orgCode



&#x20;   const collections = await prisma.collection.findMany({

&#x20;     where: {

&#x20;       assignedLabId: labCode

&#x20;     },

&#x20;     include: {

&#x20;       farmer: {

&#x20;         select: {

&#x20;           name: true,

&#x20;           orgCode: true

&#x20;         }

&#x20;       }

&#x20;     },

&#x20;     orderBy: { createdAt: "desc" }

&#x20;   })



&#x20;   // Manually filter those that already have lab results

&#x20;   const filtered = await Promise.all(

&#x20;     collections.map(async (collection) => {

&#x20;       const existing = await prisma.labResult.findFirst({

&#x20;         where: { collectionId: collection.id }

&#x20;       })

&#x20;       return existing ? null : collection

&#x20;     })

&#x20;   )



&#x20;   res.json(filtered.filter(Boolean))



&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   res.status(500).json({ error: "Server error" })

&#x20; }

}



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



//     // 1️⃣ Recompute hash from stored canonical

//     const recomputedHash = generateHash(collection.canonicalData)



//     if (recomputedHash !== collection.hash) {

//       return res.json({

//         valid: false,

//         reason: "Hash mismatch — data tampered"

//       })

//     }



//     // 2️⃣ Verify signature

//     const validSignature = verifySignature(

//       collection.farmer.publicKey,

//       collection.hash,

//       collection.signature

//     )



//     if (!validSignature) {

//       return res.json({

//         valid: false,

//         reason: "Signature invalid"

//       })

//     }



//     res.json({

//       valid: true,

//       message: "Farmer signature verified successfully"

//     })



//   } catch (err) {

//     console.error(err)

//     res.status(500).json({ error: "Server error" })

//   }

// }



export const validateFarmerSignature = async (req, res) => {

&#x20; try {

&#x20;   const { id } = req.params



&#x20;   const collection = await prisma.collection.findUnique({

&#x20;     where: { id },

&#x20;     include: { farmer: true }

&#x20;   })



&#x20;   if (!collection) {

&#x20;     return res.status(404).json({ error: "Collection not found" })

&#x20;   }



&#x20;   // 🔥 Rebuild canonical from CURRENT DB fields

&#x20;   const rebuiltCanonical = buildCollectionCanonical({

&#x20;     collectionId: collection.id,

&#x20;     herbName: collection.herbName,

&#x20;     quantity: collection.quantity,

&#x20;     farmerCode: collection.farmer.orgCode,   // IMPORTANT: orgCode

&#x20;     assignedLabId: collection.assignedLabId,

&#x20;     location: collection.location,

&#x20;     timestamp: collection.createdAt.toISOString() // MUST match creation format

&#x20;   })



&#x20;   // 🔒 Recompute hash from rebuilt canonical

&#x20;   const rebuiltHash = generateHash(rebuiltCanonical)



&#x20;   // 🚨 Compare hashes first

&#x20;   if (rebuiltHash !== collection.hash) {

&#x20;     return res.json({

&#x20;       valid: false,

&#x20;       reason: "Hash mismatch — data tampered"

&#x20;     })

&#x20;   }



&#x20;   // 🔐 Verify signature using PUBLIC KEY and rebuilt hash

&#x20;   const validSignature = verifySignature(

&#x20;     collection.farmer.publicKey,

&#x20;     rebuiltHash,

&#x20;     collection.signature

&#x20;   )



&#x20;   if (!validSignature) {

&#x20;     return res.json({

&#x20;       valid: false,

&#x20;       reason: "Signature invalid"

&#x20;     })

&#x20;   }



&#x20;   return res.json({

&#x20;     valid: true,

&#x20;     message: "Farmer signature verified successfully"

&#x20;   })



&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   return res.status(500).json({ error: "Server error" })

&#x20; }

}





### herbtrace/back/src/controllers/customer.controller.js:



import prisma from "../config/db.js"

import {

&#x20; generateHash,

&#x20; buildCollectionCanonical,

&#x20; verifySignature

} from "../utils/crypto.utils.js"



export const validateFarmer = async (req, res) => {

&#x20; try {

&#x20;   const { batchCode } = req.body



&#x20;   const batch = await prisma.manufacturingBatch.findUnique({

&#x20;     where: { batchCode },

&#x20;     include: {

&#x20;       labResult: {

&#x20;         include: {

&#x20;           collection: {

&#x20;             include: { farmer: true }

&#x20;           }

&#x20;         }

&#x20;       }

&#x20;     }

&#x20;   })



&#x20;   if (!batch) {

&#x20;     return res.status(404).json({ error: "Batch not found" })

&#x20;   }



&#x20;   const collection = batch.labResult.collection

&#x20;   const farmer = collection.farmer



&#x20;   // 🔁 REBUILD CANONICAL EXACTLY

&#x20;   const recomputedCanonical = buildCollectionCanonical({

&#x20;     collectionId: collection.id,

&#x20;     herbName: collection.herbName,

&#x20;     quantity: collection.quantity,

&#x20;     farmerId: collection.farmerId,

&#x20;     assignedLabId: collection.assignedLabId,

&#x20;     location: collection.location,

&#x20;     timestamp: collection.createdAt.toISOString()

&#x20;   })



&#x20;   const recomputedHash = generateHash(recomputedCanonical)



&#x20;   const hashMatch = recomputedHash === collection.hash



&#x20;   const signatureValid = verifySignature(

&#x20;     farmer.publicKey,

&#x20;     collection.hash,

&#x20;     collection.signature

&#x20;   )



&#x20;   res.json({

&#x20;     hashMatch,

&#x20;     signatureValid

&#x20;   })



&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   res.status(500).json({ error: "Server error" })

&#x20; }

}



export const getBatchTrace = async (req, res) => {

&#x20; try {

&#x20;   const { batchCode } = req.params



&#x20;   const batch = await prisma.manufacturingBatch.findUnique({

&#x20;     where: { batchCode },

&#x20;     include: {

&#x20;       manufacturer: true,

&#x20;       labResult: {

&#x20;         include: {

&#x20;           lab: true,

&#x20;           collection: {

&#x20;             include: {

&#x20;               farmer: true

&#x20;             }

&#x20;           }

&#x20;         }

&#x20;       }

&#x20;     }

&#x20;   })



&#x20;   if (!batch) {

&#x20;     return res.status(404).json({ error: "Batch not found" })

&#x20;   }



&#x20;   res.json(batch)



&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   res.status(500).json({ error: "Server error" })

&#x20; }

}





### herbtrace/back/src/controllers/lab.controller.js:



import prisma from "../config/db.js"

import crypto from "crypto"

import {

&#x20; generateHash,

&#x20; signHash

} from "../utils/crypto.utils.js"



// ==========================

// CREATE LAB RESULT

// ==========================

export const createLabResult = async (req, res) => {

&#x20; try {

&#x20;   const labId = req.user.id

&#x20;   const { collectionId, result, remarks, assignedMfgId } = req.body



&#x20;   // 1️⃣ Get collection

&#x20;   const collection = await prisma.collection.findUnique({

&#x20;     where: { id: collectionId }

&#x20;   })



&#x20;   if (!collection) {

&#x20;     return res.status(404).json({ error: "Collection not found" })

&#x20;   }



&#x20;   // 2️⃣ Resolve manufacturer UUID (if provided)

&#x20;   let manufacturerUUID = null



&#x20;   if (assignedMfgId) {

&#x20;     const manufacturer = await prisma.organization.findUnique({

&#x20;       where: { orgCode: assignedMfgId }

&#x20;     })



&#x20;     if (!manufacturer) {

&#x20;       return res.status(400).json({ error: "Manufacturer not found" })

&#x20;     }



&#x20;     manufacturerUUID = manufacturer.id

&#x20;   }



&#x20;   // 3️⃣ Build canonical string (DO NOT CHANGE ORDER EVER)

&#x20;   const canonicalData =

&#x20;     `collectionId:${collectionId}|` +

&#x20;     `labId:${labId}|` +

&#x20;     `result:${result}|` +

&#x20;     `remarks:${remarks || ""}|` +

&#x20;     `assignedMfgId:${manufacturerUUID || ""}`



&#x20;   const hash = generateHash(canonicalData)



&#x20;   const lab = await prisma.organization.findUnique({

&#x20;     where: { id: labId }

&#x20;   })



&#x20;   const signature = signHash(lab.privateKey, hash)



&#x20;   // 4️⃣ Store result

&#x20;   const labResult = await prisma.labResult.create({

&#x20;     data: {

&#x20;       collectionId,

&#x20;       result,

&#x20;       remarks,

&#x20;       canonicalData,

&#x20;       hash,

&#x20;       signature,

&#x20;       labId,

&#x20;       assignedMfgId: manufacturerUUID

&#x20;     }

&#x20;   })



&#x20;   res.status(201).json(labResult)



&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   res.status(500).json({ error: "Server error" })

&#x20; }

}





export const getPastTests = async (req, res) => {

&#x20; try {

&#x20;   const results = await prisma.labResult.findMany({

&#x20;     where: { labId: req.user.id },

&#x20;     orderBy: { createdAt: "desc" },

&#x20;     include: {

&#x20;       collection: {

&#x20;         include: {

&#x20;           farmer: true

&#x20;         }

&#x20;       },

&#x20;       assignedMfg: true

&#x20;     }

&#x20;   })



&#x20;   res.json(results)



&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   res.status(500).json({ error: "Server error" })

&#x20; }

}


export const getResultsForFarmer = async (req, res) => {
  try {
    const farmerId = req.user.id

    const results = await prisma.labResult.findMany({
      where: {
        collection: {
          farmerId: farmerId
        }
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


### herbtrace/back/src/controllers/manufacturer.controller.js:



import crypto from "crypto"

import prisma from "../config/db.js"

import {

&#x20; generateHash,

&#x20; signHash,

&#x20; buildManufacturingCanonical

} from "../utils/crypto.utils.js"



/\*

&#x20; APPROVED LAB RESULTS

\*/

export const getApprovedResults = async (req, res) => {

&#x20; try {

&#x20;   const manufacturerId = req.user.id



&#x20;   const results = await prisma.labResult.findMany({

&#x20;     where: {

&#x20;       assignedMfgId: manufacturerId,

&#x20;       result: "PASS"

&#x20;     },

&#x20;     include: {

&#x20;       lab: true,

&#x20;       collection: {

&#x20;         include: {

&#x20;           farmer: true

&#x20;         }

&#x20;       }

&#x20;     },

&#x20;     orderBy: { createdAt: "desc" }

&#x20;   })



&#x20;   res.json(results)



&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   res.status(500).json({ error: "Server error" })

&#x20; }

}



/\*

&#x20; CREATE MANUFACTURING BATCH

\*/

export const createBatch = async (req, res) => {

&#x20; try {

&#x20;   const manufacturerId = req.user.id



&#x20;   // ✅ FIX: destructure properly

&#x20;   const {

&#x20;     labResultId,

&#x20;     batchName,

&#x20;     herbUsedQuantity,

&#x20;     finalProductQuantity,

&#x20;     expiryDate

&#x20;   } = req.body



&#x20;   if (

&#x20;     !labResultId ||

&#x20;     !batchName ||

&#x20;     !herbUsedQuantity ||

&#x20;     !finalProductQuantity ||

&#x20;     !expiryDate

&#x20;   ) {

&#x20;     return res.status(400).json({ error: "Missing required fields" })

&#x20;   }



&#x20;   const manufacturer = await prisma.organization.findUnique({

&#x20;     where: { id: manufacturerId }

&#x20;   })



&#x20;   if (!manufacturer) {

&#x20;     return res.status(404).json({ error: "Manufacturer not found" })

&#x20;   }



&#x20;   // 🔎 Get lab result + collection

&#x20;   const labResult = await prisma.labResult.findUnique({

&#x20;     where: { id: labResultId },

&#x20;     include: {

&#x20;       collection: true

&#x20;     }

&#x20;   })



&#x20;   if (!labResult) {

&#x20;     return res.status(404).json({ error: "Lab result not found" })

&#x20;   }



&#x20;   // 🔎 Calculate already used quantity

&#x20;   const existingBatches = await prisma.manufacturingBatch.findMany({

&#x20;     where: { labResultId }

&#x20;   })



&#x20;   const totalUsed = existingBatches.reduce(

&#x20;     (sum, b) => sum + b.herbUsedQuantity,

&#x20;     0

&#x20;   )



&#x20;   if (totalUsed + Number(herbUsedQuantity) > labResult.collection.quantity) {

&#x20;     return res.status(400).json({

&#x20;       error: "Not enough remaining herb quantity"

&#x20;     })

&#x20;   }



&#x20;   // Generate sequential BATCH-XXX

&#x20;   const count = await prisma.manufacturingBatch.count()

&#x20;   const batchCode = `BATCH-${String(count + 1).padStart(3, "0")}`



&#x20;   const batchId = crypto.randomUUID()

&#x20;   const timestamp = new Date().toISOString()



&#x20;   // 🔐 Canonical structure

&#x20;   const canonicalData = buildManufacturingCanonical({

&#x20;     batchId,

&#x20;     batchName,

&#x20;     labResultId,

&#x20;     manufacturerId,

&#x20;     herbUsedQuantity: String(herbUsedQuantity),

&#x20;     finalProductQuantity: String(finalProductQuantity),

&#x20;     expiryDate: new Date(expiryDate).toISOString(),

&#x20;     timestamp

&#x20;   })



&#x20;   const hash = generateHash(canonicalData)

&#x20;   const signature = signHash(manufacturer.privateKey, hash)



&#x20;   const batch = await prisma.manufacturingBatch.create({

&#x20;     data: {

&#x20;       id: batchId,

&#x20;       batchCode,

&#x20;       batchName,

&#x20;       herbUsedQuantity: Number(herbUsedQuantity),

&#x20;       finalProductQuantity: Number(finalProductQuantity),

&#x20;       expiryDate: new Date(expiryDate),

&#x20;       canonicalData,

&#x20;       hash,

&#x20;       signature,

&#x20;       manufacturerId,

&#x20;       labResultId

&#x20;     }

&#x20;   })



&#x20;   res.status(201).json(batch)



&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   res.status(500).json({ error: "Server error" })

&#x20; }

}





export const getMyBatches = async (req, res) => {

&#x20; try {

&#x20;   const manufacturerId = req.user.id



&#x20;   const batches = await prisma.manufacturingBatch.findMany({

&#x20;     where: { manufacturerId },

&#x20;     include: {

&#x20;       labResult: {

&#x20;         include: {

&#x20;           lab: true,

&#x20;           collection: {

&#x20;             include: {

&#x20;               farmer: true

&#x20;             }

&#x20;           }

&#x20;         }

&#x20;       }

&#x20;     },

&#x20;     orderBy: { createdAt: "desc" }

&#x20;   })



&#x20;   res.json(batches)



&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   res.status(500).json({ error: "Server error" })

&#x20; }

}





### herbtrace/back/src/controllers/org.controller.js:



import prisma from "../config/db.js";



/\*\*

&#x20;\* Get organization by ID (returns public key only)

&#x20;\*/

export const getOrganizationById = async (req, res) => {

&#x20; try {

&#x20;   const { id } = req.params;



&#x20;   const org = await prisma.organization.findUnique({

&#x20;     where: { id },

&#x20;     select: {

&#x20;       id: true,

&#x20;       orgCode: true,

&#x20;       role: true,

&#x20;       name: true,

&#x20;       email: true,

&#x20;       publicKey: true,

&#x20;       createdAt: true,

&#x20;       // Do NOT return privateKey

&#x20;     },

&#x20;   });



&#x20;   if (!org) {

&#x20;     return res.status(404).json({

&#x20;       message: "Organization not found",

&#x20;     });

&#x20;   }



&#x20;   return res.json(org);

&#x20; } catch (err) {

&#x20;   console.error("GET ORGANIZATION ERROR:", err);

&#x20;   return res.status(500).json({

&#x20;     message: "Failed to fetch organization",

&#x20;   });

&#x20; }

};





### herbtrace/back/src/middleware/auth.js:



export { requireAuth, requireRole } from './auth.middleware.js'





### herbtrace/back/src/middleware/auth.middleware.js:



import jwt from "jsonwebtoken"

import prisma from "../config/db.js"



export const requireAuth = async (req, res, next) => {

&#x20; try {

&#x20;   const authHeader = req.headers.authorization



&#x20;   if (!authHeader || !authHeader.startsWith("Bearer ")) {

&#x20;     return res.status(401).json({ error: "Unauthorized" })

&#x20;   }



&#x20;   const token = authHeader.split(" ")\[1]



&#x20;   const decoded = jwt.verify(token, process.env.JWT\_SECRET)



&#x20;   // Our login uses { id, role }

&#x20;   if (!decoded.id) {

&#x20;     return res.status(401).json({ error: "Invalid token payload" })

&#x20;   }



&#x20;   const org = await prisma.organization.findUnique({

&#x20;     where: { id: decoded.id }

&#x20;   })



&#x20;   if (!org) {

&#x20;     return res.status(401).json({ error: "Organization not found" })

&#x20;   }



&#x20;   // Attach clean user object

&#x20;   req.user = {

&#x20; id: org.id,

&#x20; role: org.role,

&#x20; publicKey: org.publicKey,

&#x20; privateKey: org.privateKey,

&#x20; orgCode: org.orgCode

}





&#x20;   next()



&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   return res.status(401).json({ error: "Unauthorized" })

&#x20; }

}





export const requireRole = (role) => {

&#x20; return (req, res, next) => {

&#x20;   if (!req.user || req.user.role !== role) {

&#x20;     return res.status(403).json({ error: 'Forbidden' })

&#x20;   }

&#x20;   next()

&#x20; }

}





### herbtrace/back/src/routes/auth.routes.js:



import express from "express"

import { register, login } from "../controllers/auth.controller.js"



const router = express.Router()



router.post("/register", register)

router.post("/login", login)



export default router





### herbtrace/back/src/routes/collection.routes.js:



import express from "express"

import {

&#x20; createCollection,

&#x20; getMyCollections,

&#x20; validateFarmerSignature 

} from "../controllers/collection.controller.js"

import { requireAuth, requireRole } from "../middleware/auth.js"

import { getAssignedCollectionsForLab } from "../controllers/collection.controller.js"



const router = express.Router()



// Farmer creates collection

router.post(

&#x20; "/",

&#x20; requireAuth,

&#x20; requireRole("FARMER"),

&#x20; createCollection

)



// Farmer views own collections

router.get(

&#x20; "/mine",

&#x20; requireAuth,

&#x20; requireRole("FARMER"),

&#x20; getMyCollections

)



router.get(

&#x20; "/assigned",

&#x20; requireAuth,

&#x20; requireRole("LAB"),

&#x20; getAssignedCollectionsForLab

)



router.get(

&#x20; "/:id/validate",

&#x20; requireAuth,

&#x20; validateFarmerSignature

)





export default router





### herbtrace/back/src/routes/customer.routes.js:

### 

import express from "express"

import { getBatchTrace } from "../controllers/customer.controller.js"



const router = express.Router()



router.get("/batch/:batchCode", getBatchTrace)



export default router





### herbtrace/back/src/routes/lab.routes.js:

### 

import express from "express"

import { requireAuth, requireRole } from "../middleware/auth.middleware.js"

import {

&#x20; createLabResult,

&#x20; getPastTests.

&#x20; getResultsForFarmer

} from "../controllers/lab.controller.js"



const router = express.Router()



// Create lab result

router.post(

&#x20; "/results",

&#x20; requireAuth,

&#x20; requireRole("LAB"),

&#x20; createLabResult

)



// Get past tests

router.get(

&#x20; "/results",

&#x20; requireAuth,

&#x20; requireRole("LAB"),

&#x20; getPastTests

)

router.get(
  "/farmer",
  requireAuth,
  requireRole("FARMER"),
  getResultsForFarmer
)


export default router







### herbtrace/back/src/routes/manufacturer.routes.js:

### 

import express from "express"

import {

&#x20; getApprovedResults,

&#x20; createBatch,

&#x20; getMyBatches

} from "../controllers/manufacturer.controller.js"

import { requireAuth, requireRole } from "../middleware/auth.js"



const router = express.Router()



router.get("/approved", requireAuth, requireRole("MANUFACTURER"), getApprovedResults)

router.post("/batch", requireAuth, requireRole("MANUFACTURER"), createBatch)

router.get("/batches", requireAuth, requireRole("MANUFACTURER"), getMyBatches)



export default router







### herbtrace/back/src/routes/org.routes.js:



import express from "express";

import { getOrganizationById } from "../controllers/org.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";



const router = express.Router();



// Get organization by ID (authenticated users only)

router.get("/:id", authenticate, getOrganizationById);



export default router;







### herbtrace/back/src/utils/crypto.utils.js:

### 

import crypto from "crypto"



/\* ============================

&#x20;  SHA256 HASH

============================ \*/

export const generateHash = (data) => {

&#x20; return crypto.createHash("sha256").update(data).digest("hex")

}



/\* ============================

&#x20;  SIGN HASH (ECDSA P-256)

============================ \*/

export const signHash = (privateKey, hash) => {

&#x20; const sign = crypto.createSign("SHA256")

&#x20; sign.update(hash)

&#x20; sign.end()

&#x20; return sign.sign(privateKey, "hex")

}



/\* ============================

&#x20;  COLLECTION CANONICAL BUILDER

============================ \*/

export const buildCollectionCanonical = ({

&#x20; collectionId,

&#x20; herbName,

&#x20; quantity,

&#x20; farmerCode,

&#x20; assignedLabId,

&#x20; location,

&#x20; timestamp

}) => {

&#x20; return (

&#x20;   `collectionId:${collectionId}|` +

&#x20;   `herbName:${herbName}|` +

&#x20;   `quantity:${String(quantity)}|` +

&#x20;   `farmerCode:${farmerCode}|` +

&#x20;   `assignedLabId:${assignedLabId || ""}|` +

&#x20;   `location:${location || ""}|` +

&#x20;   `timestamp:${timestamp}`

&#x20; )

}



/\* ============================

&#x20;  LAB RESULT CANONICAL BUILDER

============================ \*/

export const buildLabResultCanonical = ({

&#x20; labResultId,

&#x20; collectionId,

&#x20; labCode,

&#x20; result,

&#x20; remarks,

&#x20; assignedMfgId,

&#x20; timestamp

}) => {

&#x20; return (

&#x20;   `labResultId:${labResultId}|` +

&#x20;   `collectionId:${collectionId}|` +

&#x20;   `labCode:${labCode}|` +

&#x20;   `result:${result}|` +

&#x20;   `remarks:${remarks || ""}|` +

&#x20;   `assignedMfgId:${assignedMfgId || ""}|` +

&#x20;   `timestamp:${timestamp}`

&#x20; )

}



// Canonical builder for Manufacturing Batch

export const buildManufacturingCanonical = ({

&#x20; batchId,

&#x20; batchName,

&#x20; labResultId,

&#x20; manufacturerId,

&#x20; herbUsedQuantity,

&#x20; finalProductQuantity,

&#x20; expiryDate,

&#x20; timestamp

}) => {

&#x20; return (

&#x20;   `batchId:${batchId}|` +

&#x20;   `batchName:${batchName}|` +

&#x20;   `labResultId:${labResultId}|` +

&#x20;   `manufacturerId:${manufacturerId}|` +

&#x20;   `herbUsedQuantity:${herbUsedQuantity}|` +

&#x20;   `finalProductQuantity:${finalProductQuantity}|` +

&#x20;   `expiryDate:${expiryDate}|` +

&#x20;   `timestamp:${timestamp}`

&#x20; )

}



export const verifySignature = (publicKey, hash, signature) => {

&#x20; const verify = crypto.createVerify("SHA256")

&#x20; verify.update(hash)

&#x20; verify.end()

&#x20; return verify.verify(publicKey, signature, "hex")

}







### herbtrace/back/src/app.js:



import express from "express"

import cors from "cors"

import authRoutes from "./routes/auth.routes.js"

import collectionRoutes from "./routes/collection.routes.js"

import labRoutes from "./routes/lab.routes.js"

import manufacturerRoutes from "./routes/manufacturer.routes.js"

import customerRoutes from "./routes/customer.routes.js"





const app = express()



app.use(cors({

&#x20; origin: "http://localhost:5173",

&#x20; credentials: true

}))



app.use(express.json())



// Routes MUST come after app initialization

app.use("/api/collections", collectionRoutes)

app.use("/api/lab", labRoutes)

app.use("/api/auth", authRoutes)

app.use("/api/manufacturer", manufacturerRoutes)

app.use("/api/customer", customerRoutes)





// Health check

app.get("/health", (req, res) => {

&#x20; res.json({ status: "Backend running" })

})



export default app







### herbtrace/back/src/server.js:



import "dotenv/config"

import app from "./app.js"



const PORT = process.env.PORT || 5000



app.listen(PORT, () => {

&#x20; console.log(`Server running on port ${PORT}`)

})



### 

### 

### 

### 

### 

### 

### herbtrace/front/src/App.jsx:

import { Routes, Route, Navigate } from "react-router-dom"



import LandingPage from "./pages/LandingPage"

import LoginPage from "./pages/LoginPage"

import RegisterPage from "./pages/RegisterPage"



// Dashboards — MATCHING YOUR ACTUAL FOLDERS

import FarmerDashboard from "./dashboards/farmer/FarmerDashboard"

import LabDashboard from "./dashboards/lab/LabDashboard"

import ManufacturerDashboard from "./dashboards/manufacturer/ManufacturerDashboard"

import ConsumerDashboard from "./dashboards/consumer/ConsumerDashboard"



const App = () => {

&#x20; return (

&#x20;   <Routes>

&#x20;     {/\* Public pages \*/}

&#x20;     <Route path="/" element={<LandingPage />} />

&#x20;     <Route path="/login" element={<LoginPage />} />

&#x20;     <Route path="/register" element={<RegisterPage />} />



&#x20;     {/\* Role dashboards \*/}

&#x20;     <Route path="/farmer" element={<FarmerDashboard />} />

&#x20;     <Route path="/lab" element={<LabDashboard />} />

&#x20;     <Route path="/manufacturer" element={<ManufacturerDashboard />} />

&#x20;     <Route path="/consumer" element={<ConsumerDashboard />} />



&#x20;     {/\* Fallback \*/}

&#x20;     <Route path="\*" element={<Navigate to="/login" replace />} />

&#x20;   </Routes>

&#x20; )

}



export default App



### 

### herbtrace/front/src/App.css:

\#root {

&#x20; max-width: 1280px;

&#x20; margin: 0 auto;

&#x20; padding: 2rem;

&#x20; text-align: center;

}



.logo {

&#x20; height: 6em;

&#x20; padding: 1.5em;

&#x20; will-change: filter;

&#x20; transition: filter 300ms;

}

.logo:hover {

&#x20; filter: drop-shadow(0 0 2em #646cffaa);

}

.logo.react:hover {

&#x20; filter: drop-shadow(0 0 2em #61dafbaa);

}



@keyframes logo-spin {

&#x20; from {

&#x20;   transform: rotate(0deg);

&#x20; }

&#x20; to {

&#x20;   transform: rotate(360deg);

&#x20; }

}



@media (prefers-reduced-motion: no-preference) {

&#x20; a:nth-of-type(2) .logo {

&#x20;   animation: logo-spin infinite 20s linear;

&#x20; }

}



.card {

&#x20; padding: 2em;

}



.read-the-docs {

&#x20; color: #888;

}



### 

### herbtrace/front/src/index.css:

/\* Reset \*/

\* {

&#x20; margin: 0;

&#x20; padding: 0;

&#x20; box-sizing: border-box;

&#x20; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

}



body {

&#x20; background-color: #ffffff;

&#x20; color: #2f4f2f;

}



/\* Page layout \*/

.app-container {

&#x20; min-height: 100vh;

&#x20; display: flex;

&#x20; flex-direction: column;

&#x20; align-items: center;

&#x20; justify-content: center;

&#x20; padding: 40px;

}



/\* Heading \*/

.title {

&#x20; font-size: 2.5rem;

&#x20; color: #2e7d32;

&#x20; margin-bottom: 10px;

}



.subtitle {

&#x20; font-size: 1.1rem;

&#x20; color: #4f6f52;

&#x20; margin-bottom: 40px;

&#x20; text-align: center;

&#x20; max-width: 600px;

}



/\* Cards container \*/

.card-container {

&#x20; display: flex;

&#x20; gap: 30px;

&#x20; flex-wrap: wrap;

&#x20; justify-content: center;

}



/\* Login form styling \*/

.login-form {

&#x20; width: 320px;

&#x20; display: flex;

&#x20; flex-direction: column;

&#x20; gap: 15px;

}



.login-form input {

&#x20; padding: 12px;

&#x20; border-radius: 8px;

&#x20; border: 1px solid #cfcfcf;

&#x20; font-size: 0.95rem;

}



.login-form input:focus {

&#x20; outline: none;

&#x20; border-color: #2e7d32;

}



.login-form button {

&#x20; padding: 12px;

&#x20; border-radius: 8px;

&#x20; border: none;

&#x20; background-color: #2e7d32;

&#x20; color: white;

&#x20; font-size: 1rem;

&#x20; cursor: pointer;

}



.login-form button:hover {

&#x20; background-color: #256428;

}



/\* Error message styling \*/

.error-text {

&#x20; color: #c62828;

&#x20; font-size: 0.9rem;

&#x20; text-align: center;

}



/\* Dashboard form \*/

.dashboard-form {

&#x20; width: 360px;

&#x20; display: flex;

&#x20; flex-direction: column;

&#x20; gap: 15px;

&#x20; margin-bottom: 40px;

}



.dashboard-form input {

&#x20; padding: 12px;

&#x20; border-radius: 8px;

&#x20; border: 1px solid #cfcfcf;

&#x20; font-size: 0.95rem;

}



.dashboard-form input:focus {

&#x20; outline: none;

&#x20; border-color: #2e7d32;

}



.dashboard-form button {

&#x20; padding: 12px;

&#x20; border-radius: 8px;

&#x20; border: none;

&#x20; background-color: #2e7d32;

&#x20; color: white;

&#x20; font-size: 1rem;

&#x20; cursor: pointer;

}



.dashboard-form button:hover {

&#x20; background-color: #256428;

}



/\* Records section \*/

.records-section {

&#x20; width: 100%;

&#x20; max-width: 600px;

}



.records-section h2 {

&#x20; color: #2e7d32;

&#x20; margin-bottom: 15px;

}



/\* Individual record card \*/

.record-card {

&#x20; background-color: #ffffff;

&#x20; border: 1px solid #e0e0e0;

&#x20; border-radius: 12px;

&#x20; padding: 15px;

&#x20; margin-bottom: 15px;

&#x20; box-shadow: 0px 6px 12px rgba(46, 125, 50, 0.15);

}





/\* Dashboard layout \*/

.dashboard-layout {

&#x20; display: flex;

}



/\* Main content area \*/

.dashboard-content {

&#x20; flex: 1;

&#x20; padding: 40px;

}



/\* Filter input \*/

.filter-input {

&#x20; width: 250px;

&#x20; padding: 10px;

&#x20; margin-bottom: 20px;

&#x20; border-radius: 8px;

&#x20; border: 1px solid #cfcfcf;

}



.filter-input:focus {

&#x20; outline: none;

&#x20; border-color: #2e7d32;

}



/\*table\*/

.records-table {

&#x20; width: 100%;

&#x20; border-collapse: collapse;

&#x20; margin-top: 20px;

}



.records-table th,

.records-table td {

&#x20; border: 1px solid #e0e0e0;

&#x20; padding: 12px;

&#x20; text-align: left;

}



.records-table th {

&#x20; background-color: #e8f5e9;

&#x20; color: #2e7d32;

}



.records-table tr:hover {

&#x20; background-color: #f1f8f4;

}



/\* ===== FORCE MODAL TO ESCAPE DASHBOARD LAYOUT ===== \*/

.modal-overlay {

&#x20; position: fixed;

&#x20; top: 0;

&#x20; left: 0;



&#x20; width: 100vw;

&#x20; height: 100vh;



&#x20; background: rgba(0, 0, 0, 0.5);



&#x20; display: flex;

&#x20; align-items: center;

&#x20; justify-content: center;



&#x20; z-index: 9999; /\* 🔑 THIS IS CRITICAL \*/

}



.modal-card {

&#x20; background: #ffffff;

&#x20; padding: 24px;

&#x20; border-radius: 10px;



&#x20; width: 90%;

&#x20; max-width: 600px;



&#x20; box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);

}



.dashboard-layout {

&#x20; position: relative;

&#x20; overflow: hidden;

}



.dashboard-layout {

&#x20; overflow: visible !important;

}



/\* ===== Provenance Modal (Polished) ===== \*/

.modal-overlay {

&#x20; position: fixed;

&#x20; top: 0;

&#x20; left: 0;

&#x20; width: 100vw;

&#x20; height: 100vh;

&#x20; background: rgba(0, 0, 0, 0.55);

&#x20; display: flex;

&#x20; align-items: center;

&#x20; justify-content: center;

&#x20; z-index: 9999;

}



.modal-card {

&#x20; background: #ffffff;

&#x20; padding: 28px;

&#x20; border-radius: 12px;

&#x20; width: 92%;

&#x20; max-width: 650px;

&#x20; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);

}



.modal-card h2 {

&#x20; margin-bottom: 20px;

&#x20; color: #1b5e20; /\* dark green \*/

&#x20; text-align: center;

}



.modal-section {

&#x20; background: #f6fbf7;

&#x20; border-left: 5px solid #4caf50;

&#x20; padding: 14px 16px;

&#x20; margin-bottom: 16px;

&#x20; border-radius: 6px;

}



.modal-section h3 {

&#x20; margin-bottom: 8px;

&#x20; color: #2e7d32;

}



.modal-section ul {

&#x20; list-style: none;

&#x20; padding: 0;

&#x20; margin: 0;

}



.modal-section li {

&#x20; margin-bottom: 6px;

&#x20; font-size: 0.95rem;

}



.modal-close {

&#x20; display: block;

&#x20; margin: 20px auto 0;

&#x20; padding: 8px 18px;

&#x20; background: #4caf50;

&#x20; color: white;

&#x20; border: none;

&#x20; border-radius: 6px;

&#x20; cursor: pointer;

}



.modal-close:hover {

&#x20; background: #388e3c;

}



/\* ===== Modal Input Polish ===== \*/

.modal-card input {

&#x20; width: 100%;

&#x20; padding: 10px 12px;

&#x20; margin-bottom: 12px;



&#x20; font-size: 0.95rem;

&#x20; border-radius: 6px;

&#x20; border: 1.5px solid #cfd8dc;



&#x20; outline: none;

&#x20; transition: border-color 0.2s ease, box-shadow 0.2s ease;

}



.modal-card input:focus {

&#x20; border-color: #4caf50;

&#x20; box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.15);

}



/\* Slightly different look for action buttons inside modal \*/

.modal-card button\[type="submit"] {

&#x20; width: 100%;

&#x20; padding: 10px;

&#x20; margin-top: 6px;



&#x20; background: #4caf50;

&#x20; color: white;

&#x20; border: none;

&#x20; border-radius: 6px;



&#x20; font-size: 1rem;

&#x20; cursor: pointer;

}



.modal-card button\[type="submit"]:hover {

&#x20; background: #388e3c;

}



/\* =========================

&#x20;  AUTH PAGES (LOGIN / REGISTER)

&#x20;  ========================= \*/



.auth-container {

&#x20; max-width: 420px;

&#x20; margin: 80px auto;

&#x20; padding: 30px;

&#x20; background: #ffffff;

&#x20; border-radius: 10px;

&#x20; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);

&#x20; text-align: center;

}



.auth-container h2 {

&#x20; margin-bottom: 20px;

&#x20; color: #2c3e50;

}



.auth-container form {

&#x20; display: flex;

&#x20; flex-direction: column;

&#x20; gap: 14px;

}



.auth-container input,

.auth-container select {

&#x20; padding: 12px;

&#x20; border-radius: 6px;

&#x20; border: 1px solid #ccc;

&#x20; font-size: 14px;

}



.auth-container input:focus,

.auth-container select:focus {

&#x20; outline: none;

&#x20; border-color: #2e7d32;

}



.auth-container button {

&#x20; padding: 12px;

&#x20; background-color: #2e7d32;

&#x20; color: white;

&#x20; border: none;

&#x20; border-radius: 6px;

&#x20; font-size: 15px;

&#x20; cursor: pointer;

&#x20; transition: background 0.2s ease;

}



.auth-container button:hover {

&#x20; background-color: #256428;

}



.auth-container .error {

&#x20; color: #c62828;

&#x20; font-size: 14px;

}



.auth-container .success {

&#x20; color: #2e7d32;

&#x20; font-size: 14px;

}





.modal-backdrop {

&#x20; position: fixed;

&#x20; inset: 0;

&#x20; background: rgba(15, 23, 42, 0.55);

&#x20; display: flex;

&#x20; align-items: center;

&#x20; justify-content: center;

&#x20; z-index: 1000;

}



.modal-inspection {

&#x20; width: 900px;

&#x20; max-height: 85vh;

&#x20; background: #ffffff;

&#x20; border-radius: 16px;

&#x20; display: grid;

&#x20; grid-template-columns: 1.1fr 1fr;

&#x20; overflow: hidden;

&#x20; box-shadow: 0 25px 60px rgba(0,0,0,0.25);

}





/\* LEFT \*/

.inspection-left {

&#x20; padding: 28px;

&#x20; background: #ffffff;

&#x20; border-right: 1px solid #e5e7eb;

}



.inspection-right {

&#x20; padding: 28px;

&#x20; display: flex;

&#x20; flex-direction: column;

&#x20; overflow-y: auto;

}





.inspection-left h3 {

&#x20; margin-bottom: 18px;

}



.info-block {

&#x20; margin-bottom: 12px;

}



.info-block label {

&#x20; display: block;

&#x20; font-size: 12px;

&#x20; color: #64748b;

}



.info-block span {

&#x20; font-size: 15px;

&#x20; font-weight: 500;

}



.ghost-btn {

&#x20; margin-top: 20px;

&#x20; background: transparent;

&#x20; border: 1px dashed #94a3b8;

&#x20; padding: 8px;

&#x20; border-radius: 6px;

&#x20; width: 100%;

&#x20; cursor: not-allowed;

}



/\* RIGHT \*/

.inspection-right {

&#x20; padding: 28px;

&#x20; display: flex;

&#x20; flex-direction: column;

}



.decision-header {

&#x20; display: flex;

&#x20; justify-content: space-between;

&#x20; align-items: center;

}



.close-btn {

&#x20; background: none;

&#x20; border: none;

&#x20; font-size: 18px;

&#x20; cursor: pointer;

}



.decision-toggle {

&#x20; display: flex;

&#x20; gap: 12px;

&#x20; margin: 20px 0;

}



.pill {

&#x20; flex: 1;

&#x20; padding: 10px;

&#x20; border-radius: 999px;

&#x20; border: 1px solid #cbd5f5;

&#x20; cursor: pointer;

&#x20; font-weight: 600;

}



.pill.pass { color: #16a34a; }

.pill.fail { color: #dc2626; }



.pill.pass.active {

&#x20; background: #16a34a;

&#x20; color: #fff;

}



.pill.fail.active {

&#x20; background: #dc2626;

&#x20; color: #fff;

}



.pill.active {

&#x20; background: currentColor;

&#x20; color: #fff;

}



textarea,

input {

&#x20; margin-bottom: 12px;

&#x20; padding: 10px;

&#x20; border-radius: 8px;

&#x20; border: 1px solid #cbd5e1;

&#x20; font-size: 14px;

}



.submit-btn {

&#x20; margin-top: auto;

&#x20; padding: 12px;

&#x20; background: #16a34a;

&#x20; color: #fff;

&#x20; border: none;

&#x20; border-radius: 10px;

&#x20; font-size: 15px;

&#x20; font-weight: 600;

&#x20; cursor: pointer;

}



.submit-btn:hover {

&#x20; background: #15803d;

}



.submit-btn:disabled {

&#x20; opacity: 0.5;

&#x20; cursor: not-allowed;

}



/\* RESULT BADGE (READ-ONLY VIEW) \*/

.result-badge {

&#x20; align-self: flex-start;

&#x20; padding: 8px 18px;

&#x20; border-radius: 999px;

&#x20; font-weight: 700;

&#x20; font-size: 14px;

&#x20; letter-spacing: 0.5px;

&#x20; margin-bottom: 18px;

}



.result-badge.pass {

&#x20; background: #dcfce7;   /\* soft green \*/

&#x20; color: #166534;

&#x20; border: 1px solid #86efac;

}



.result-badge.fail {

&#x20; background: #fee2e2;   /\* soft red \*/

&#x20; color: #991b1b;

&#x20; border: 1px solid #fca5a5;

}



.btn-secondary {

&#x20; background: #2e7d32;

&#x20; color: #fff;

&#x20; border: none;

&#x20; padding: 10px;

&#x20; border-radius: 6px;

&#x20; cursor: pointer;

}



/\* Validation Modal Styles \*/

.validation-modal {

&#x20; background: white;

&#x20; border-radius: 12px;

&#x20; padding: 2rem;

&#x20; max-width: 600px;

&#x20; width: 90%;

&#x20; max-height: 90vh;

&#x20; overflow-y: auto;

&#x20; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);

&#x20; animation: slideUp 0.3s ease-out;

}



@keyframes slideUp {

&#x20; from {

&#x20;   opacity: 0;

&#x20;   transform: translateY(30px);

&#x20; }

&#x20; to {

&#x20;   opacity: 1;

&#x20;   transform: translateY(0);

&#x20; }

}



.validation-header {

&#x20; display: flex;

&#x20; justify-content: space-between;

&#x20; align-items: center;

&#x20; margin-bottom: 1.5rem;

&#x20; padding-bottom: 1rem;

&#x20; border-bottom: 2px solid #e0e0e0;

}



.validation-header h3 {

&#x20; margin: 0;

&#x20; font-size: 1.4rem;

&#x20; color: #333;

}



.validation-result {

&#x20; text-align: center;

&#x20; padding: 2rem;

&#x20; margin: 1.5rem 0;

&#x20; border-radius: 8px;

&#x20; transition: all 0.3s ease;

}



.validation-result.valid {

&#x20; background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);

&#x20; border: 2px solid #28a745;

}



.validation-result.invalid {

&#x20; background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);

&#x20; border: 2px solid #dc3545;

}



.validation-icon {

&#x20; font-size: 4rem;

&#x20; font-weight: bold;

&#x20; margin-bottom: 1rem;

&#x20; animation: popIn 0.4s ease-out;

}



@keyframes popIn {

&#x20; 0% {

&#x20;   transform: scale(0);

&#x20; }

&#x20; 50% {

&#x20;   transform: scale(1.1);

&#x20; }

&#x20; 100% {

&#x20;   transform: scale(1);

&#x20; }

}



.validation-result.valid .validation-icon {

&#x20; color: #28a745;

}



.validation-result.invalid .validation-icon {

&#x20; color: #dc3545;

}



.validation-result h2 {

&#x20; margin: 0 0 0.5rem 0;

&#x20; font-size: 1.8rem;

&#x20; font-weight: 700;

}



.validation-result.valid h2 {

&#x20; color: #155724;

}



.validation-result.invalid h2 {

&#x20; color: #721c24;

}



.validation-message {

&#x20; margin: 0;

&#x20; font-size: 1rem;

&#x20; color: #666;

}



.validation-details {

&#x20; background: #f8f9fa;

&#x20; border-radius: 8px;

&#x20; padding: 1.5rem;

&#x20; margin: 1.5rem 0;

}



.detail-row {

&#x20; display: flex;

&#x20; justify-content: space-between;

&#x20; align-items: center;

&#x20; padding: 0.8rem 0;

&#x20; border-bottom: 1px solid #e0e0e0;

}



.detail-row:last-of-type {

&#x20; border-bottom: none;

}



.detail-label {

&#x20; font-weight: 600;

&#x20; color: #555;

}



.detail-value {

&#x20; font-weight: 600;

&#x20; padding: 0.3rem 0.8rem;

&#x20; border-radius: 4px;

}



.detail-value.success {

&#x20; color: #28a745;

&#x20; background: #d4edda;

}



.detail-value.error {

&#x20; color: #dc3545;

&#x20; background: #f8d7da;

}



.hash-comparison {

&#x20; margin-top: 1.5rem;

&#x20; padding-top: 1rem;

&#x20; border-top: 1px solid #dee2e6;

}



.hash-block {

&#x20; margin-bottom: 1rem;

}



.hash-block:last-child {

&#x20; margin-bottom: 0;

}



.hash-block label {

&#x20; display: block;

&#x20; font-size: 0.9rem;

&#x20; font-weight: 600;

&#x20; color: #555;

&#x20; margin-bottom: 0.4rem;

}



.hash-block code {

&#x20; display: block;

&#x20; background: white;

&#x20; padding: 0.8rem;

&#x20; border-radius: 4px;

&#x20; border: 1px solid #dee2e6;

&#x20; font-size: 0.75rem;

&#x20; font-family: 'Courier New', monospace;

&#x20; color: #333;

&#x20; word-break: break-all;

&#x20; line-height: 1.4;

}



.error-message {

&#x20; background: #fff3cd;

&#x20; border: 1px solid #ffc107;

&#x20; border-radius: 4px;

&#x20; padding: 1rem;

&#x20; margin-top: 1rem;

&#x20; color: #856404;

}



.error-message strong {

&#x20; display: block;

&#x20; margin-bottom: 0.3rem;

}



.validation-modal .btn-primary {

&#x20; width: 100%;

&#x20; margin-top: 1.5rem;

&#x20; padding: 0.9rem;

&#x20; font-size: 1rem;

&#x20; font-weight: 600;

&#x20; background: #007bff;

&#x20; color: white;

&#x20; border: none;

&#x20; border-radius: 6px;

&#x20; cursor: pointer;

&#x20; transition: background 0.2s ease;

}



.validation-modal .btn-primary:hover {

&#x20; background: #0056b3;

}



/\* Responsive design \*/

@media (max-width: 768px) {

&#x20; .validation-modal {

&#x20;   padding: 1.5rem;

&#x20;   max-width: 95%;

&#x20; }



&#x20; .validation-header h3 {

&#x20;   font-size: 1.2rem;

&#x20; }



&#x20; .validation-result h2 {

&#x20;   font-size: 1.5rem;

&#x20; }



&#x20; .validation-icon {

&#x20;   font-size: 3rem;

&#x20; }



&#x20; .hash-block code {

&#x20;   font-size: 0.7rem;

&#x20; }

}



.trace-layout {

&#x20; display: grid;

&#x20; grid-template-columns: repeat(3, 1fr);

&#x20; gap: 24px;

&#x20; margin-top: 32px;

}



.trace-card {

&#x20; background: white;

&#x20; padding: 20px;

&#x20; border-radius: 12px;

&#x20; box-shadow: 0 4px 18px rgba(0,0,0,0.06);

}



.trace-card h3 {

&#x20; margin-bottom: 16px;

&#x20; border-bottom: 1px solid #eee;

&#x20; padding-bottom: 8px;

}



.trace-actions {

&#x20; grid-column: span 3;

&#x20; margin-top: 24px;

&#x20; background: #f9fafb;

&#x20; padding: 20px;

&#x20; border-radius: 12px;

&#x20; display: flex;

&#x20; gap: 16px;

&#x20; justify-content: center;

}



.pill {

&#x20; display: inline-flex;

&#x20; align-items: center;

&#x20; justify-content: center;

&#x20; padding: 6px 14px;

&#x20; border-radius: 999px;

&#x20; font-weight: 600;

&#x20; font-size: 13px;

&#x20; width: fit-content;

}



.pill.pass {

&#x20; background-color: #2e7d32;

&#x20; color: white;

}



.pill.fail {

&#x20; background-color: #c62828;

&#x20; color: white;

}



.modal-large {

&#x20; width: 80%;

&#x20; max-width: 1000px;

&#x20; max-height: 90vh;

&#x20; overflow-y: auto;

&#x20; background: white;

&#x20; padding: 30px;

&#x20; border-radius: 16px;

}



.btn-danger {

&#x20; background: #c62828;

&#x20; color: white;

&#x20; padding: 8px 14px;

&#x20; border-radius: 6px;

&#x20; border: none;

}



.cards-grid {

&#x20; display: grid;

&#x20; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));

&#x20; gap: 20px;

&#x20; margin-top: 20px;

}



.record-card {

&#x20; background: white;

&#x20; padding: 18px;

&#x20; border-radius: 12px;

&#x20; box-shadow: 0 4px 12px rgba(0,0,0,0.08);

&#x20; cursor: pointer;

&#x20; transition: 0.2s;

}



.record-card:hover {

&#x20; transform: translateY(-4px);

}



.modal-large {

&#x20; background: white;

&#x20; width: 85%;

&#x20; max-width: 900px;

&#x20; border-radius: 16px;

&#x20; padding: 30px;

&#x20; position: relative;

}



.trace-container {

&#x20; display: flex;

&#x20; gap: 20px;

&#x20; margin-top: 20px;

}



.trace-card {

&#x20; flex: 1;

&#x20; background: #f8f9fa;

&#x20; padding: 18px;

&#x20; border-radius: 12px;

}



### 

### herbtrace/front/src/main.jsx:

import React from 'react'

import ReactDOM from 'react-dom/client'

import { BrowserRouter } from 'react-router-dom'

import App from './App'

import './index.css'



/\*

&#x20; BrowserRouter enables page navigation (routing)

&#x20; across the app without reloading the page

\*/

ReactDOM.createRoot(document.getElementById('root')).render(

&#x20; <React.StrictMode>

&#x20;   <BrowserRouter>

&#x20;     <App />

&#x20;   </BrowserRouter>

&#x20; </React.StrictMode>

)





### 

### herbtrace/front/src/components/LabResultModal.jsx:

import React, { useState } from "react";

import ValidationResultModal from "./ValidationResultModal";



const LabResultModal = ({ collection, onClose, onSubmit }) => {

&#x20; const \[result, setResult] = useState(null);

&#x20; const \[remarks, setRemarks] = useState("");

&#x20; const \[manufacturerId, setManufacturerId] = useState("");

&#x20; const \[validation, setValidation] = useState(null);

&#x20; const \[showValidationModal, setShowValidationModal] = useState(false);

&#x20; const \[isValidating, setIsValidating] = useState(false);



&#x20; if (!collection) return null;



&#x20; const validateFarmerSignature = async () => {

&#x20;   setIsValidating(true);

&#x20;   try {

&#x20;     const res = await fetch(

&#x20;       `/api/collections/${collection.collectionId}/validate`

&#x20;     );

&#x20;     const data = await res.json();

&#x20;     setValidation(data);

&#x20;   } catch (err) {

&#x20;     setValidation({

&#x20;       hashMatch: false,

&#x20;       signatureValid: false,

&#x20;       error: "Validation failed",

&#x20;     });

&#x20;   } finally {

&#x20;     setIsValidating(false);

&#x20;     setShowValidationModal(true);

&#x20;   }

&#x20; };



&#x20; return (

&#x20;   <>

&#x20;     <div className="modal-backdrop">

&#x20;       <div className="modal-inspection">



&#x20;         <div className="inspection-left">

&#x20;           <h3>Collection Inspection</h3>



&#x20;           <div className="info-block">

&#x20;             <label>Collection ID</label>

&#x20;             <span>{collection.collectionId}</span>

&#x20;           </div>

&#x20;           <div className="info-block">

&#x20;             <label>Herb</label>

&#x20;             <span>{collection.herbName}</span>

&#x20;           </div>

&#x20;           <div className="info-block">

&#x20;             <label>Quantity</label>

&#x20;             <span>{collection.quantity} kg</span>

&#x20;           </div>



&#x20;           <hr />



&#x20;           <button

&#x20;             className="btn-secondary"

&#x20;             onClick={validateFarmerSignature}

&#x20;             disabled={isValidating}

&#x20;           >

&#x20;             {isValidating ? "Validating..." : "Validate Farmer Signature"}

&#x20;           </button>

&#x20;         </div>



&#x20;         <div className="inspection-right">

&#x20;           <button className="close-btn" onClick={onClose}>✕</button>



&#x20;           <textarea

&#x20;             placeholder="Remarks"

&#x20;             value={remarks}

&#x20;             onChange={(e) => setRemarks(e.target.value)}

&#x20;           />



&#x20;           <button

&#x20;             disabled={!result}

&#x20;             onClick={() =>

&#x20;               onSubmit({

&#x20;                 collectionId: collection.collectionId,

&#x20;                 result,

&#x20;                 remarks,

&#x20;                 assignedManufacturerId: manufacturerId,

&#x20;               })

&#x20;             }

&#x20;           >

&#x20;             Submit

&#x20;           </button>

&#x20;         </div>



&#x20;       </div>

&#x20;     </div>



&#x20;     {showValidationModal \&\& (

&#x20;       <ValidationResultModal

&#x20;         validation={validation}

&#x20;         title="Farmer Signature Validation"

&#x20;         onClose={() => setShowValidationModal(false)}

&#x20;       />

&#x20;     )}

&#x20;   </>

&#x20; );

};



export default LabResultModal;



### 

### herbtrace/front/src/components/LabResultViewModal.jsx:

import React, { useState } from "react";

import ValidationResultModal from "./ValidationResultModal";



const LabResultViewModal = ({ result, onClose }) => {

&#x20; const collection = result?.collection;



&#x20; const \[validation, setValidation] = useState(null);

&#x20; const \[showModal, setShowModal] = useState(false);

&#x20; const \[isValidating, setIsValidating] = useState(false);



&#x20; if (!result || !collection) return null;



&#x20; const validateFarmerSignature = async () => {

&#x20;   setIsValidating(true);

&#x20;   try {

&#x20;     const res = await fetch(

&#x20;       `/api/collections/${collection.collectionId}/validate`

&#x20;     );

&#x20;     const data = await res.json();

&#x20;     setValidation(data);

&#x20;   } catch (err) {

&#x20;     setValidation({

&#x20;       hashMatch: false,

&#x20;       signatureValid: false,

&#x20;       error: "Validation failed",

&#x20;     });

&#x20;   } finally {

&#x20;     setIsValidating(false);

&#x20;     setShowModal(true);

&#x20;   }

&#x20; };



&#x20; return (

&#x20;   <>

&#x20;     <div className="modal-backdrop">

&#x20;       <div className="modal-inspection">



&#x20;         <div className="inspection-left">

&#x20;           <h3>Collection Details</h3>



&#x20;           <div className="info-block">

&#x20;             <label>ID</label>

&#x20;             <span>{collection.collectionId}</span>

&#x20;           </div>



&#x20;           <div className="info-block">

&#x20;             <label>Herb</label>

&#x20;             <span>{collection.herbName}</span>

&#x20;           </div>



&#x20;           <div className="info-block">

&#x20;             <label>Quantity</label>

&#x20;             <span>{collection.quantity} kg</span>

&#x20;           </div>



&#x20;           <hr />



&#x20;           <button

&#x20;             onClick={validateFarmerSignature}

&#x20;             disabled={isValidating}

&#x20;           >

&#x20;             {isValidating ? "Validating..." : "Validate Farmer Signature"}

&#x20;           </button>

&#x20;         </div>



&#x20;       </div>

&#x20;     </div>



&#x20;     {showModal \&\& (

&#x20;       <ValidationResultModal

&#x20;         validation={validation}

&#x20;         title="Farmer Signature Validation"

&#x20;         onClose={() => setShowModal(false)}

&#x20;       />

&#x20;     )}

&#x20;   </>

&#x20; );

};



export default LabResultViewModal;



### 

### herbtrace/front/src/components/ManufacturerResultModal.jsx:

import React, { useState } from "react";

import { verifySignature } from "../utils/cryptoUtils";

import { generateHash } from "../utils/hashUtils";

import ValidationResultModal from "./ValidationResultModal";



const ManufacturerResultModal = ({ result, onClose }) => {

&#x20; const collection = result?.collection;



&#x20; const \[farmerValidation, setFarmerValidation] = useState(null);

&#x20; const \[labValidation, setLabValidation] = useState(null);

&#x20; const \[showFarmerModal, setShowFarmerModal] = useState(false);

&#x20; const \[showLabModal, setShowLabModal] = useState(false);

&#x20; const \[isValidatingFarmer, setIsValidatingFarmer] = useState(false);

&#x20; const \[isValidatingLab, setIsValidatingLab] = useState(false);



&#x20; if (!result || !collection) return null;



&#x20; // ===============================

&#x20; // FARMER VALIDATION

&#x20; // ===============================

&#x20; const validateFarmerSignature = async () => {

&#x20;   setIsValidatingFarmer(true);



&#x20;   try {

&#x20;     const computedHash = await generateHash(collection.canonicalData);



&#x20;     const hashMatch = computedHash === collection.hash;



&#x20;     const signatureValid = await verifySignature(

&#x20;       collection.farmer.publicKey,

&#x20;       collection.hash,

&#x20;       collection.signature

&#x20;     );



&#x20;     setFarmerValidation({

&#x20;       stored: collection.hash,

&#x20;       computed: computedHash,

&#x20;       hashMatch,

&#x20;       signatureValid,

&#x20;     });

&#x20;   } catch (error) {

&#x20;     setFarmerValidation({

&#x20;       stored: collection.hash || "N/A",

&#x20;       computed: "Error",

&#x20;       hashMatch: false,

&#x20;       signatureValid: false,

&#x20;       error: error.message,

&#x20;     });

&#x20;   } finally {

&#x20;     setIsValidatingFarmer(false);

&#x20;     setShowFarmerModal(true);

&#x20;   }

&#x20; };



&#x20; // ===============================

&#x20; // LAB VALIDATION

&#x20; // ===============================

&#x20; const validateLabSignature = async () => {

&#x20;   setIsValidatingLab(true);



&#x20;   try {

&#x20;     const computedHash = await generateHash(result.canonicalData);



&#x20;     const hashMatch = computedHash === result.resultHash;



&#x20;     const signatureValid = await verifySignature(

&#x20;       result.lab.publicKey,

&#x20;       result.resultHash,

&#x20;       result.resultSignature

&#x20;     );



&#x20;     setLabValidation({

&#x20;       stored: result.resultHash,

&#x20;       computed: computedHash,

&#x20;       hashMatch,

&#x20;       signatureValid,

&#x20;     });

&#x20;   } catch (error) {

&#x20;     setLabValidation({

&#x20;       stored: result.resultHash || "N/A",

&#x20;       computed: "Error",

&#x20;       hashMatch: false,

&#x20;       signatureValid: false,

&#x20;       error: error.message,

&#x20;     });

&#x20;   } finally {

&#x20;     setIsValidatingLab(false);

&#x20;     setShowLabModal(true);

&#x20;   }

&#x20; };



&#x20; return (

&#x20;   <>

&#x20;     <div className="modal-backdrop">

&#x20;       <div className="modal-inspection">



&#x20;         {/\* LEFT: COLLECTION INFO \*/}

&#x20;         <div className="inspection-left">

&#x20;           <h3>Collection Details</h3>



&#x20;           <div className="info-block">

&#x20;             <label>Collection ID</label>

&#x20;             <span>{collection.collectionId}</span>

&#x20;           </div>



&#x20;           <div className="info-block">

&#x20;             <label>Herb</label>

&#x20;             <span>{collection.herbName}</span>

&#x20;           </div>



&#x20;           <div className="info-block">

&#x20;             <label>Quantity</label>

&#x20;             <span>{collection.quantity} kg</span>

&#x20;           </div>



&#x20;           <div className="info-block">

&#x20;             <label>Farmer</label>

&#x20;             <span>{collection.farmerOrgName}</span>

&#x20;           </div>



&#x20;           <hr />



&#x20;           <button

&#x20;             className="btn-secondary"

&#x20;             onClick={validateFarmerSignature}

&#x20;             disabled={isValidatingFarmer}

&#x20;           >

&#x20;             {isValidatingFarmer ? "Validating..." : "Validate Farmer Signature"}

&#x20;           </button>

&#x20;         </div>



&#x20;         {/\* RIGHT: LAB RESULT + ACTION \*/}

&#x20;         <div className="inspection-right">

&#x20;           <div className="decision-header">

&#x20;             <h4>Lab Result</h4>

&#x20;             <button className="close-btn" onClick={onClose}>✕</button>

&#x20;           </div>



&#x20;           <div className={`result-badge ${result.result === "PASS" ? "pass" : "fail"}`}>

&#x20;             {result.result}

&#x20;           </div>



&#x20;           <div className="info-block">

&#x20;             <label>Lab</label>

&#x20;             <span>{result.labOrgCode}</span>

&#x20;           </div>



&#x20;           <div className="info-block">

&#x20;             <label>Remarks</label>

&#x20;             <span>{result.remarks || "—"}</span>

&#x20;           </div>



&#x20;           <hr />



&#x20;           <button

&#x20;             className="btn-secondary"

&#x20;             onClick={validateLabSignature}

&#x20;             disabled={isValidatingLab}

&#x20;           >

&#x20;             {isValidatingLab ? "Validating..." : "Validate Lab Signature"}

&#x20;           </button>



&#x20;           <hr />



&#x20;           <h4>Manufacturer Action</h4>



&#x20;           <button

&#x20;             className="submit-btn"

&#x20;             onClick={() => alert("Create Batch (coming next)")}

&#x20;           >

&#x20;             Create Batch

&#x20;           </button>

&#x20;         </div>



&#x20;       </div>

&#x20;     </div>



&#x20;     {showFarmerModal \&\& (

&#x20;       <ValidationResultModal

&#x20;         validation={farmerValidation}

&#x20;         title="Farmer Signature Validation"

&#x20;         onClose={() => setShowFarmerModal(false)}

&#x20;       />

&#x20;     )}



&#x20;     {showLabModal \&\& (

&#x20;       <ValidationResultModal

&#x20;         validation={labValidation}

&#x20;         title="Lab Signature Validation"

&#x20;         onClose={() => setShowLabModal(false)}

&#x20;       />

&#x20;     )}

&#x20;   </>

&#x20; );

};



export default ManufacturerResultModal;



### 

### herbtrace/front/src/components/ProtectedRoute.jsx:

import React from 'react'

import { Navigate } from 'react-router-dom'



/\*

&#x20; ProtectedRoute:

&#x20; - Checks if user is logged in

&#x20; - Redirects to login if not authenticated

\*/

const ProtectedRoute = ({ children }) => {

&#x20; const user = localStorage.getItem('loggedInUser')



&#x20; if (!user) {

&#x20;   return <Navigate to="/login" replace />

&#x20; }



&#x20; return children

}



export default ProtectedRoute



### 

### herbtrace/front/src/components/RoleCard.css:

.role-card {

&#x20; background-color: #ffffff;

&#x20; border-radius: 16px;

&#x20; padding: 30px;

&#x20; width: 260px;

&#x20; text-align: center;

&#x20; cursor: pointer;



&#x20; border: 1px solid #e0e0e0;



&#x20; transition: transform 0.3s ease, box-shadow 0.3s ease;

}



.role-card h3 {

&#x20; color: #2e7d32;

&#x20; margin-bottom: 12px;

&#x20; font-size: 1.3rem;

}



.role-card p {

&#x20; color: #4f6f52;

&#x20; font-size: 0.95rem;

&#x20; line-height: 1.4;

}



/\* Hover effect \*/

.role-card:hover {

&#x20; transform: scale(1.05);

&#x20; box-shadow: 0px 12px 25px rgba(46, 125, 50, 0.35);

}



### 

### herbtrace/front/src/components/RoleCard.jsx:

import React from 'react'

import './RoleCard.css'



/\*

&#x20; RoleCard:

&#x20; - Reusable card component

&#x20; - Receives title, description, and click handler

\*/

const RoleCard = ({ title, description, onClick }) => {

&#x20; return (

&#x20;   <div className="role-card" onClick={onClick}>

&#x20;     {/\* Role name \*/}

&#x20;     <h3>{title}</h3>



&#x20;     {/\* Short explanation of role \*/}

&#x20;     <p>{description}</p>

&#x20;   </div>

&#x20; )

}



export default RoleCard



### 

### herbtrace/front/src/components/Sidebar.css:

/\* Sidebar container \*/

.sidebar {

&#x20; width: 220px;

&#x20; min-height: 100vh;

&#x20; background-color: #f4faf5;

&#x20; border-right: 1px solid #e0e0e0;

&#x20; padding: 25px;

}



/\* App title \*/

.sidebar-title {

&#x20; color: #2e7d32;

&#x20; font-size: 1.5rem;

&#x20; margin-bottom: 30px;

}



/\* Menu list \*/

.sidebar-menu {

&#x20; list-style: none;

}



.sidebar-menu li {

&#x20; padding: 12px 10px;

&#x20; margin-bottom: 10px;

&#x20; border-radius: 8px;

&#x20; cursor: pointer;

&#x20; color: #2f4f2f;

}



/\* Active / hover states \*/

.sidebar-menu li.active,

.sidebar-menu li:hover {

&#x20; background-color: #2e7d32;

&#x20; color: white;

}



.sidebar-menu li.logout {

&#x20; margin-top: 30px;

&#x20; background-color: #fbe9e7;

&#x20; color: #c62828;

}



.sidebar-menu li.logout:hover {

&#x20; background-color: #c62828;

&#x20; color: white;

}



### 

### herbtrace/front/src/components/Sidebar.jsx:

import React from "react"

import "./Sidebar.css"



const sidebarConfig = {

&#x20; Farmer: \[

&#x20;   { key: "new", label: "New Collection" },

&#x20;   { key: "collections", label: "My Collections" },

&#x20;   { key: "results", label: "Lab Results" },

&#x20;   { key: "proof", label: "Proof \& Audit" }

&#x20; ],



&#x20; Laboratory: \[

&#x20;   { key: "incoming", label: "Incoming Samples" },

&#x20;   { key: "test", label: "Past Tests" },

&#x20;   { key: "certs", label: "Issued Certificates" },

&#x20;   { key: "audit", label: "Audit Log" }

&#x20; ],



&#x20; Manufacturer: \[

&#x20;   { key: "approved", label: "Approved Batches" },

&#x20;   { key: "manufacture", label: "Manufacturing Records" },

&#x20;   { key: "blockchain", label: "Blockchain Proof" },

&#x20;   { key: "audit", label: "Audit Trail" }

&#x20; ],



&#x20; Consumer: \[

&#x20; { key: "verify", label: "Verify Product" },

&#x20; { key: "saved", label: "Saved Records" }

]



}



const Sidebar = ({ role, activeTab, setActiveTab, onLogout }) => {

&#x20; const tabs = sidebarConfig\[role] || \[]



&#x20; return (

&#x20;   <div className="sidebar">

&#x20;     <h2 className="sidebar-title">HerbTrace</h2>



&#x20;     <ul className="sidebar-menu">

&#x20;       {tabs.map(tab => (

&#x20;         <li

&#x20;           key={tab.key}

&#x20;           className={activeTab === tab.key ? "active" : ""}

&#x20;           onClick={() => setActiveTab(tab.key)}

&#x20;         >

&#x20;           {tab.label}

&#x20;         </li>

&#x20;       ))}



&#x20;       <li className="logout" onClick={onLogout}>

&#x20;         Logout

&#x20;       </li>

&#x20;     </ul>

&#x20;   </div>

&#x20; )

}



export default Sidebar



### 

### herbtrace/front/src/components/ValidationResultModal.jsx:

import React from "react";



const ValidationResultModal = ({ validation, title, onClose }) => {

&#x20; if (!validation) return null;



&#x20; const {

&#x20;   storedHash,

&#x20;   computedHash,

&#x20;   hashMatch,

&#x20;   signatureValid,

&#x20;   error,

&#x20; } = validation;



&#x20; const isValid = hashMatch \&\& signatureValid;



&#x20; return (

&#x20;   <div className="modal-backdrop">

&#x20;     <div className="validation-modal">



&#x20;       <div className="validation-header">

&#x20;         <h3>{title}</h3>

&#x20;         <button onClick={onClose}>✕</button>

&#x20;       </div>



&#x20;       <div className="validation-body">



&#x20;         <h2 style={{ color: isValid ? "green" : "red" }}>

&#x20;           {isValid ? "✓ VALID SIGNATURE" : "✗ INVALID SIGNATURE"}

&#x20;         </h2>



&#x20;         {!isValid \&\& (

&#x20;           <p>

&#x20;             Data integrity check failed — may have been altered

&#x20;           </p>

&#x20;         )}



&#x20;         <div className="validation-row">

&#x20;           <strong>Hash Match:</strong>{" "}

&#x20;           {hashMatch ? "✓ Passed" : "✗ Failed"}

&#x20;         </div>



&#x20;         <div className="validation-row">

&#x20;           <strong>Signature Valid:</strong>{" "}

&#x20;           {signatureValid ? "✓ Passed" : "✗ Failed"}

&#x20;         </div>



&#x20;         <div className="validation-row">

&#x20;           <strong>Stored Hash:</strong>

&#x20;           <div className="hash-box">

&#x20;             {storedHash || "N/A"}

&#x20;           </div>

&#x20;         </div>



&#x20;         <div className="validation-row">

&#x20;           <strong>Computed Hash:</strong>

&#x20;           <div className="hash-box">

&#x20;             {computedHash || "N/A"}

&#x20;           </div>

&#x20;         </div>



&#x20;         {error \&\& (

&#x20;           <div style={{ color: "red", marginTop: "10px" }}>

&#x20;             Error: {error}

&#x20;           </div>

&#x20;         )}



&#x20;       </div>

&#x20;     </div>

&#x20;   </div>

&#x20; );

};



export default ValidationResultModal;



### 

### herbtrace/front/src/pages/LandingPage.jsx:

import React from 'react'

import { useNavigate } from 'react-router-dom'

import RoleCard from '../components/RoleCard'



/\*

&#x20; LandingPage:

&#x20; - Shows role selection cards

&#x20; - Redirects user to login page with selected role

\*/

const LandingPage = () => {

&#x20; const navigate = useNavigate()



&#x20; // Function called when a role card is clicked

&#x20; const handleRoleSelect = (role) => {

&#x20;   // Navigate to login page and pass role as state

&#x20;   navigate('/login', { state: { role } })

&#x20; }



&#x20; return (

&#x20;   <div className="app-container">

&#x20;     {/\* Main title \*/}

&#x20;     <h1 className="title">HerbTrace</h1>



&#x20;     {/\* Subtitle \*/}

&#x20;     <p className="subtitle">

&#x20;       Securely track the journey of Ayurvedic herbs from collection to consumption

&#x20;       using blockchain and cryptography.

&#x20;     </p>



&#x20;     {/\* Container holding all role cards \*/}

&#x20;     <div className="card-container">

&#x20;       <RoleCard

&#x20;         title="Farmer / Collector"

&#x20;         description="Record herb collection details and geographic origin."

&#x20;         onClick={() => handleRoleSelect('Farmer')}

&#x20;       />



&#x20;       <RoleCard

&#x20;         title="Laboratory"

&#x20;         description="Upload quality test results and verification reports."

&#x20;         onClick={() => handleRoleSelect('Laboratory')}

&#x20;       />



&#x20;       <RoleCard

&#x20;         title="Manufacturer"

&#x20;         description="Create product batches and generate QR codes."

&#x20;         onClick={() => handleRoleSelect('Manufacturer')}

&#x20;       />



&#x20;       <RoleCard

&#x20;         title="Consumer"

&#x20;         description="Verify product authenticity and provenance."

&#x20;         onClick={() => handleRoleSelect('Consumer')}

&#x20;       />

&#x20;     </div>

&#x20;   </div>

&#x20; )

}



export default LandingPage



### 

### herbtrace/front/src/pages/LoginPage.jsx:

import { useState } from "react"

import { useNavigate } from "react-router-dom"



const LoginPage = () => {

&#x20; const navigate = useNavigate()



&#x20; const \[email, setEmail] = useState("")

&#x20; const \[password, setPassword] = useState("")

&#x20; const \[error, setError] = useState("")



&#x20; const handleLogin = async () => {

&#x20; setError("")



&#x20; try {

&#x20;   const res = await fetch("http://localhost:5000/api/auth/login", {

&#x20;     method: "POST",

&#x20;     headers: { "Content-Type": "application/json" },

&#x20;     body: JSON.stringify({ email, password })

&#x20;   })



&#x20;   const data = await res.json()



&#x20;   if (!res.ok) {

&#x20;     setError(data.message || "Login failed")

&#x20;     return

&#x20;   }



&#x20;   // Store token

&#x20;   localStorage.setItem("token", data.token)



&#x20;   // Store role directly

&#x20;   localStorage.setItem("role", data.role)



&#x20;   const role = data.role



&#x20;   if (role === "FARMER") navigate("/farmer")

&#x20;   else if (role === "LAB") navigate("/lab")

&#x20;   else if (role === "MANUFACTURER") navigate("/manufacturer")

&#x20;   else if (role === "CONSUMER") navigate("/consumer")

&#x20;   else setError("Unknown role")



&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   setError("Server error")

&#x20; }

}





&#x20; return (

&#x20;   <div className="auth-container">

&#x20;     <h2>Login</h2>



&#x20;     <input

&#x20;       type="email"

&#x20;       placeholder="Email"

&#x20;       value={email}

&#x20;       onChange={e => setEmail(e.target.value)}

&#x20;     />



&#x20;     <input

&#x20;       type="password"

&#x20;       placeholder="Password"

&#x20;       value={password}

&#x20;       onChange={e => setPassword(e.target.value)}

&#x20;     />

&#x20;     <p></p>

&#x20;     <button onClick={handleLogin}>Login</button>



&#x20;     {error \&\& <p className="error">{error}</p>}



&#x20;     <p style={{ marginTop: "16px", fontSize: "14px" }}>

&#x20;       Don’t have an account?{" "}

&#x20;       <span

&#x20;         style={{ color: "#2e7d32", cursor: "pointer", fontWeight: "500" }}

&#x20;         onClick={() => navigate("/register")}

&#x20;       >

&#x20;         Register instead

&#x20;       </span>

&#x20;     </p>

&#x20;   </div>

&#x20; )

}



export default LoginPage



### 

### herbtrace/front/src/pages/RegisterPage.jsx:

import { useState } from "react"

import { useNavigate } from "react-router-dom"



const RegisterPage = () => {

&#x20; const navigate = useNavigate()



&#x20; const \[role, setRole] = useState("FARMER")

&#x20; const \[name, setName] = useState("")

&#x20; const \[email, setEmail] = useState("")

&#x20; const \[password, setPassword] = useState("")

&#x20; const \[error, setError] = useState("")

&#x20; const \[success, setSuccess] = useState("")



&#x20; const handleRegister = async () => {

&#x20;   setError("")

&#x20;   setSuccess("")



&#x20;   try {

&#x20;     const res = await fetch("http://localhost:5000/api/auth/register", {

&#x20;       method: "POST",

&#x20;       headers: { "Content-Type": "application/json" },

&#x20;       body: JSON.stringify({ role, name, email, password })

&#x20;     })



&#x20;     const data = await res.json()



&#x20;     if (!res.ok) {

&#x20;       setError(data.message || "Registration failed")

&#x20;       return

&#x20;     }



&#x20;     setSuccess(`Registered successfully! Your org code: ${data.orgCode}`)

&#x20;     setTimeout(() => navigate("/login"), 2000)

&#x20;   } catch (err) {

&#x20;     console.error(err)

&#x20;     setError("Server error")

&#x20;   }

&#x20; }



&#x20; return (

&#x20;   <div className="auth-container">

&#x20;     <h2>Register</h2>



&#x20;     <select value={role} onChange={e => setRole(e.target.value)}>

&#x20;       <option value="FARMER">Farmer</option>

&#x20;       <option value="LAB">Laboratory</option>

&#x20;       <option value="MANUFACTURER">Manufacturer</option>

&#x20;       <option value="CONSUMER">Consumer</option>

&#x20;     </select>



&#x20;     <input

&#x20;       placeholder="Organization Name"

&#x20;       value={name}

&#x20;       onChange={e => setName(e.target.value)}

&#x20;     />



&#x20;     <input

&#x20;       type="email"

&#x20;       placeholder="Email"

&#x20;       value={email}

&#x20;       onChange={e => setEmail(e.target.value)}

&#x20;     />



&#x20;     <input

&#x20;       type="password"

&#x20;       placeholder="Password"

&#x20;       value={password}

&#x20;       onChange={e => setPassword(e.target.value)}

&#x20;     />



&#x20;     <button onClick={handleRegister}>Register</button>



&#x20;     {error   \&\& <p className="error">{error}</p>}

&#x20;     {success \&\& <p className="success">{success}</p>}



&#x20;     <p style={{ marginTop: "16px", fontSize: "14px" }}>

&#x20;       Already registered?{" "}

&#x20;       <span

&#x20;         style={{ color: "#2e7d32", cursor: "pointer", fontWeight: "500" }}

&#x20;         onClick={() => navigate("/login")}

&#x20;       >

&#x20;         Log in instead

&#x20;       </span>

&#x20;     </p>

&#x20;   </div>

&#x20; )

}



export default RegisterPage

### 

### herbtrace/front/src/dashboards/consumer/ConsumerDashboard.jsx:

import { useState } from "react"

import Sidebar from "../../components/Sidebar"

import SavedRecords from "./SavedRecords"

import VerifyView from "./VerifyView"





const CustomerDashboard = () => {

&#x20; const \[activeTab, setActiveTab] = useState("verify")

&#x20; const \[batchCode, setBatchCode] = useState("")

&#x20; const \[data, setData] = useState(null)

&#x20; const \[error, setError] = useState("")



&#x20; const handleLogout = () => {

&#x20;   localStorage.removeItem("token")

&#x20;   localStorage.removeItem("organization")

&#x20;   window.location.href = "/login"

&#x20; }



&#x20; const \[savedRecords, setSavedRecords] = useState(() => {

&#x20; const stored = localStorage.getItem("savedRecords")

&#x20; return stored ? JSON.parse(stored) : \[]

})



const handleSaveRecord = () => {

&#x20; if (!data) return



&#x20; const recordName = prompt("Enter a name for this record:")

&#x20; if (!recordName) return



&#x20; const newRecord = {

&#x20;   id: Date.now(),

&#x20;   name: recordName,

&#x20;   batchCode: data.batchCode,

&#x20;   dateSaved: new Date().toISOString(),

&#x20;   data

&#x20; }



&#x20; const updated = \[...savedRecords, newRecord]

&#x20; setSavedRecords(updated)

&#x20; localStorage.setItem("savedRecords", JSON.stringify(updated))



&#x20; alert("Record saved successfully!")

}



&#x20; const fetchBatch = async () => {

&#x20;   try {

&#x20;     setError("")

&#x20;     setData(null)



&#x20;     const res = await fetch(

&#x20;       `http://localhost:5000/api/customer/batch/${batchCode}`

&#x20;     )



&#x20;     const result = await res.json()



&#x20;     if (!res.ok) {

&#x20;       setError(result.error || "Batch not found")

&#x20;       return

&#x20;     }



&#x20;     setData(result)



&#x20;   } catch (err) {

&#x20;     console.error(err)

&#x20;     setError("Server error")

&#x20;   }

&#x20; }



&#x20; return (

&#x20;   <div className="dashboard-layout">



&#x20;     <Sidebar

&#x20;       role="Consumer"

&#x20;       activeTab={activeTab}

&#x20;       setActiveTab={setActiveTab}

&#x20;       onLogout={handleLogout}

&#x20;     />



&#x20;     <div className="dashboard-content">



&#x20;       {activeTab === "verify" \&\& (

&#x20;         <div className="records-section">

&#x20;           <h2>Product Traceability</h2>



&#x20;           {/\* SEARCH \*/}

&#x20;           <div className="search-bar">

&#x20;             <input

&#x20;               type="text"

&#x20;               placeholder="Enter Batch Code (e.g. BATCH-001)"

&#x20;               value={batchCode}

&#x20;               onChange={(e) => setBatchCode(e.target.value)}

&#x20;             />

&#x20;             <button className="btn-secondary" onClick={fetchBatch}>

&#x20;               Verify Batch

&#x20;             </button>

&#x20;           </div>



&#x20;           {error \&\& <p className="error-text">{error}</p>}



&#x20;           {data \&\& (

&#x20;             <div className="trace-layout">



&#x20;               {/\* FARMER \*/}

&#x20;               <div className="trace-card">

&#x20;                 <h3>Farmer</h3>

&#x20;                 <div className="info-block">

&#x20;                   <label>Name</label>

&#x20;                   <span>{data.labResult.collection.farmer.name}</span>

&#x20;                 </div>

&#x20;                 <div className="info-block">

&#x20;                   <label>Farmer ID</label>

&#x20;                   <span>{data.labResult.collection.farmer.orgCode}</span>

&#x20;                 </div>

&#x20;                 <div className="info-block">

&#x20;                   <label>Location</label>

&#x20;                   <span>{data.labResult.collection.location}</span>

&#x20;                 </div>

&#x20;                 <div className="info-block">

&#x20;                   <label>Herb</label>

&#x20;                   <span>{data.labResult.collection.herbName}</span>

&#x20;                 </div>

&#x20;                 <div className="info-block">

&#x20;                   <label>Quantity</label>

&#x20;                   <span>{data.labResult.collection.quantity} kg</span>

&#x20;                 </div>

&#x20;               </div>



&#x20;               {/\* LAB \*/}

&#x20;               <div className="trace-card">

&#x20;                 <h3>Laboratory</h3>

&#x20;                 <div className="info-block">

&#x20;                   <label>Lab</label>

&#x20;                   <span>{data.labResult.lab.name}</span>

&#x20;                 </div>

&#x20;                 <div className="info-block">

&#x20;                   <label>Lab ID</label>

&#x20;                   <span>{data.labResult.lab.orgCode}</span>

&#x20;                 </div>

&#x20;                 <div className="info-block">

&#x20;                   <label>Result</label>

&#x20;                   <span className={`pill ${data.labResult.result === "PASS" ? "pass active" : "fail active"}`}>

&#x20;                     {data.labResult.result}

&#x20;                   </span>

&#x20;                 </div>

&#x20;                 <div className="info-block">

&#x20;                   <label>Remarks</label>

&#x20;                   <span>{data.labResult.remarks || "—"}</span>

&#x20;                 </div>

&#x20;               </div>



&#x20;               {/\* MANUFACTURER \*/}

&#x20;               <div className="trace-card">

&#x20;                 <h3>Manufacturer</h3>

&#x20;                 <div className="info-block">

&#x20;                   <label>Name</label>

&#x20;                   <span>{data.manufacturer.name}</span>

&#x20;                 </div>

&#x20;                 <div className="info-block">

&#x20;                   <label>Manufacturer ID</label>

&#x20;                   <span>{data.manufacturer.orgCode}</span>

&#x20;                 </div>

&#x20;                 <div className="info-block">

&#x20;                   <label>Batch Name</label>

&#x20;                   <span>{data.batchName}</span>

&#x20;                 </div>

&#x20;                 <div className="info-block">

&#x20;                   <label>Final Product</label>

&#x20;                   <span>{data.finalProductQuantity} g</span>

&#x20;                 </div>

&#x20;                 <div className="info-block">

&#x20;                   <label>Expiry</label>

&#x20;                   <span>

&#x20;                     {new Date(data.expiryDate).toLocaleDateString()}

&#x20;                   </span>

&#x20;                 </div>

&#x20;               </div>



&#x20;               {/\* VALIDATION BUTTONS \*/}

&#x20;               <div className="trace-actions">

&#x20;                 <h3>Integrity Verification</h3>



&#x20;                 <button

&#x20; className="btn-secondary"

&#x20; onClick={async () => {

&#x20;   const res = await fetch(

&#x20;     "http://localhost:5000/api/customer/validate/farmer",

&#x20;     {

&#x20;       method: "POST",

&#x20;       headers: { "Content-Type": "application/json" },

&#x20;       body: JSON.stringify({ batchCode: data.batchCode })

&#x20;     }

&#x20;   )



&#x20;   const result = await res.json()



&#x20;   alert(

&#x20;     `Hash Match: ${result.hashMatch}\\nSignature Valid: ${result.signatureValid}`

&#x20;   )

&#x20; }}

>

&#x20; Validate Farmer Records

</button>





&#x20;                 <button className="btn-secondary">

&#x20;                   Validate Lab Records

&#x20;                 </button>



&#x20;                 <button className="btn-secondary">

&#x20;                   Validate Manufacturer Records

&#x20;                 </button>

&#x20;                 <button className="btn-secondary" onClick={handleSaveRecord}>

&#x20;                   Save Record

&#x20;                 </button>



&#x20;               </div>



&#x20;             </div>

&#x20;           )}



&#x20;         </div>

&#x20;       )}

&#x20;       



&#x20;     </div>

&#x20;   </div>

&#x20; )

}



export default CustomerDashboard





### 

### herbtrace/front/src/dashboards/consumer/SavedRecords.jsx:

import { useState, useEffect } from "react"

import VerifyView from "./VerifyView"



const SavedRecords = ({ setCurrentRecord }) => {

&#x20; const \[records, setRecords] = useState(\[])

&#x20; const \[selected, setSelected] = useState(null)



&#x20; useEffect(() => {

&#x20;   const stored = localStorage.getItem("savedRecords")

&#x20;   setRecords(stored ? JSON.parse(stored) : \[])

&#x20; }, \[])



&#x20; return (

&#x20;   <div className="records-section">

&#x20;     <h2>Saved Records</h2>



&#x20;     {records.length === 0 \&\& (

&#x20;       <p className="muted-text">No saved records yet.</p>

&#x20;     )}



&#x20;     <div className="cards-grid">

&#x20;       {records.map((r, index) => (

&#x20;         <div

&#x20;           key={index}

&#x20;           className="record-card"

&#x20;           onClick={() => setSelected(r)}

&#x20;         >

&#x20;           <h3>{r.customName || "Untitled Record"}</h3>

&#x20;           <p><strong>Batch:</strong> {r.data.batch.batchCode}</p>

&#x20;           <p>

&#x20;             <strong>Saved:</strong>{" "}

&#x20;             {new Date(r.savedAt).toLocaleDateString()}

&#x20;           </p>

&#x20;         </div>

&#x20;       ))}

&#x20;     </div>



&#x20;     {selected \&\& (

&#x20;       <VerifyView

&#x20;         record={selected.data}

&#x20;         onClose={() => setSelected(null)}

&#x20;       />

&#x20;     )}

&#x20;   </div>

&#x20; )

}



export default SavedRecords



### 

### herbtrace/front/src/dashboards/consumer/VerifyView.jsx:

const VerifyView = ({ record, onClose }) => {

&#x20; if (!record) return null



&#x20; return (

&#x20;   <div className="modal-backdrop" onClick={onClose}>

&#x20;     <div

&#x20;       className="modal-large"

&#x20;       onClick={(e) => e.stopPropagation()}

&#x20;     >

&#x20;       <button className="close-btn" onClick={onClose}>✕</button>



&#x20;       <h2>Complete Batch Trace</h2>



&#x20;       <div className="trace-container">



&#x20;         {/\* COLLECTION \*/}

&#x20;         <div className="trace-card">

&#x20;           <h3>Collection Details</h3>

&#x20;           <p><strong>Herb:</strong> {record.collection.herbName}</p>

&#x20;           <p><strong>Quantity:</strong> {record.collection.quantity} kg</p>

&#x20;           <p><strong>Farmer:</strong> {record.collection.farmer?.orgCode}</p>

&#x20;           <p><strong>Location:</strong> {record.collection.location}</p>

&#x20;         </div>



&#x20;         {/\* LAB \*/}

&#x20;         <div className="trace-card">

&#x20;           <h3>Lab Result</h3>

&#x20;           <p><strong>Lab:</strong> {record.lab.lab?.orgCode}</p>

&#x20;           <p>

&#x20;             <strong>Result:</strong>{" "}

&#x20;             <span className={`pill ${record.lab.result.toLowerCase()}`}>

&#x20;               {record.lab.result}

&#x20;             </span>

&#x20;           </p>

&#x20;           <p><strong>Remarks:</strong> {record.lab.remarks}</p>

&#x20;         </div>



&#x20;         {/\* MANUFACTURING \*/}

&#x20;         <div className="trace-card">

&#x20;           <h3>Manufacturing</h3>

&#x20;           <p><strong>Batch:</strong> {record.batch.batchCode}</p>

&#x20;           <p><strong>Product:</strong> {record.batch.productName}</p>

&#x20;           <p><strong>Manufacturer:</strong> {record.batch.manufacturer?.orgCode}</p>

&#x20;           <p>

&#x20;             <strong>Expiry:</strong>{" "}

&#x20;             {new Date(record.batch.expiryDate).toLocaleDateString()}

&#x20;           </p>

&#x20;         </div>



&#x20;       </div>



&#x20;     </div>

&#x20;   </div>

&#x20; )

}



export default VerifyView



### 

### herbtrace/front/src/dashboards/farmer/FarmerDashboard.jsx:

import { useState } from "react"

import Sidebar from "../../components/Sidebar"

import NewCollection from "./NewCollection"

import MyCollections from "./MyCollections"

import LabResults from "./LabResults"

import ProofAudit from "./ProofAudit"



function FarmerDashboard() {

&#x20; const \[activeTab, setActiveTab] = useState("new")



&#x20; const handleLogout = () => {

&#x20;   localStorage.removeItem("token")

&#x20;   window.location.href = "/login"

&#x20; }



&#x20; return (

&#x20;   <div className="dashboard-layout">

&#x20;     <Sidebar

&#x20;       role="Farmer"

&#x20;       activeTab={activeTab}

&#x20;       setActiveTab={setActiveTab}

&#x20;       onLogout={handleLogout}

&#x20;     />



&#x20;     <div className="dashboard-content">

&#x20;       {activeTab === "new" \&\& <NewCollection />}

&#x20;       {activeTab === "collections" \&\& <MyCollections />}

&#x20;       {activeTab === "results" \&\& <LabResults />}

&#x20;       {activeTab === "proof" \&\& <ProofAudit />}

&#x20;     </div>

&#x20;   </div>

&#x20; )

}



export default FarmerDashboard



### 

### herbtrace/front/src/dashboards/farmer/LabResults.jsx:

import { useEffect, useState } from "react";



function LabResults() {

&#x20; const \[results, setResults] = useState(\[]);

&#x20; const \[error, setError] = useState("");



&#x20; useEffect(() => {

&#x20;   const fetchResults = async () => {

&#x20;     try {

&#x20;       const token = localStorage.getItem("token");



&#x20;       const response = await fetch(

&#x20;         "http://localhost:5000/api/lab/farmer",

&#x20;         {

&#x20;           headers: {

&#x20;             Authorization: `Bearer ${token}`,

&#x20;           },

&#x20;         }

&#x20;       );



&#x20;       const data = await response.json();



&#x20;       if (response.ok) {

&#x20;         setResults(data);

&#x20;       } else {

&#x20;         setError(data.message || "Failed to fetch lab results");

&#x20;       }

&#x20;     } catch {

&#x20;       setError("Server error");

&#x20;     }

&#x20;   };



&#x20;   fetchResults();

&#x20; }, \[]);



&#x20; return (

&#x20;   <div className="records-section">

&#x20;     <h2>Lab Results</h2>



&#x20;     {error \&\& <p className="error-text">{error}</p>}



&#x20;     <table className="records-table">

&#x20;       <thead>

&#x20;         <tr>

&#x20;           <th>Collection ID</th>

&#x20;           <th>Result</th>

&#x20;           <th>Status</th>

&#x20;         </tr>

&#x20;       </thead>

&#x20;       <tbody>

&#x20;         {results.map((r) => (

&#x20;           <tr key={r.id}>

&#x20;             <td>{r.collectionId}</td>

&#x20;             <td>{r.result}</td>

&#x20;             <td>{r.status}</td>

&#x20;           </tr>

&#x20;         ))}

&#x20;       </tbody>

&#x20;     </table>

&#x20;   </div>

&#x20; );

}



export default LabResults;



### 

### herbtrace/front/src/dashboards/farmer/MyCollections.jsx:

import { useEffect, useState } from "react"



const MyCollections = () => {

&#x20; const \[collections, setCollections] = useState(\[])

&#x20; const \[selected, setSelected] = useState(null)

&#x20; const \[error, setError] = useState("")



&#x20; useEffect(() => {

&#x20;   fetchCollections()

&#x20; }, \[])



&#x20; const fetchCollections = async () => {

&#x20;   try {

&#x20;     const token = localStorage.getItem("token")

&#x20;     const res = await fetch("http://localhost:5000/api/collections/mine", {

&#x20;       headers: { Authorization: `Bearer ${token}` }

&#x20;     })

&#x20;     const data = await res.json()

&#x20;     if (!res.ok) { setError(data.error || "Failed to fetch"); return }

&#x20;     setCollections(data)

&#x20;   } catch (err) {

&#x20;     console.error(err)

&#x20;     setError("Server error")

&#x20;   }

&#x20; }



&#x20; return (

&#x20;   <div className="records-section">

&#x20;     <h2>My Collections</h2>



&#x20;     {error \&\& <p className="error-text">{error}</p>}



&#x20;     {collections.length === 0 \&\& !error \&\& (

&#x20;       <p className="muted-text">No collections yet.</p>

&#x20;     )}



&#x20;     <table className="records-table">

&#x20;       <thead>

&#x20;         <tr>

&#x20;           <th>Herb</th>

&#x20;           <th>Quantity</th>

&#x20;           <th>Farmer ID</th>

&#x20;           <th>Assigned Lab</th>

&#x20;           <th>Location</th>

&#x20;           <th>Created At</th>

&#x20;         </tr>

&#x20;       </thead>

&#x20;       <tbody>

&#x20;         {collections.map((c) => (

&#x20;           <tr key={c.id} onClick={() => setSelected(c)} style={{ cursor: "pointer" }}>

&#x20;             <td>{c.herbName}</td>

&#x20;             <td>{c.quantity} kg</td>

&#x20;             <td>{c.farmer?.orgCode || "—"}</td>

&#x20;             <td>{c.assignedLabId || "—"}</td>

&#x20;             <td>{c.location || "—"}</td>

&#x20;             <td>{new Date(c.createdAt).toLocaleString()}</td>

&#x20;           </tr>

&#x20;         ))}

&#x20;       </tbody>

&#x20;     </table>



&#x20;     {selected \&\& (

&#x20;       <div className="modal-overlay" onClick={() => setSelected(null)}>

&#x20;         <div className="modal-card" onClick={(e) => e.stopPropagation()}>

&#x20;           <h2>Collection Details</h2>



&#x20;           <div className="modal-section">

&#x20;             <h3>Basic Information</h3>

&#x20;             <ul>

&#x20;               <li><strong>Herb:</strong> {selected.herbName}</li>

&#x20;               <li><strong>Quantity:</strong> {selected.quantity} kg</li>

&#x20;               <li><strong>Farmer ID:</strong> {selected.farmer?.orgCode || "—"}</li>

&#x20;               <li><strong>Assigned Lab:</strong> {selected.assignedLabId || "—"}</li>

&#x20;               <li><strong>Location:</strong> {selected.location || "—"}</li>

&#x20;               <li><strong>Created At:</strong> {new Date(selected.createdAt).toLocaleString()}</li>

&#x20;             </ul>

&#x20;           </div>



&#x20;           {/\* <div className="modal-section">

&#x20;             <h3>Blockchain Integrity</h3>

&#x20;             <ul>

&#x20;               <li><strong>Hash:</strong></li>

&#x20;               <code>{selected.hash}</code>

&#x20;               <li style={{ marginTop: "10px" }}><strong>Signature:</strong></li>

&#x20;               <code>{selected.signature}</code>

&#x20;             </ul>

&#x20;           </div>



&#x20;           <div className="modal-section">

&#x20;             <h3>Canonical Data</h3>

&#x20;             <code>{selected.canonicalData}</code>

&#x20;           </div> \*/}



&#x20;           <button className="modal-close" onClick={() => setSelected(null)}>

&#x20;             Close

&#x20;           </button>

&#x20;         </div>

&#x20;       </div>

&#x20;     )}

&#x20;   </div>

&#x20; )

}



export default MyCollections

### 

### herbtrace/front/src/dashboards/farmer/NewCollection.jsx:

import { useState, useEffect } from "react"



function NewCollection() {

&#x20; const \[herbName, setHerbName] = useState("")

&#x20; const \[quantity, setQuantity] = useState("")

&#x20; const \[assignedLabId, setAssignedLabId] = useState("")

&#x20; const \[location, setLocation] = useState("")

&#x20; const \[timestamp, setTimestamp] = useState("")

&#x20; const \[message, setMessage] = useState("")



&#x20; useEffect(() => {

&#x20;   // Set timestamp automatically

&#x20;   const now = new Date().toISOString()

&#x20;   setTimestamp(now)



&#x20;   // Get browser location

&#x20;   if (navigator.geolocation) {

&#x20;     navigator.geolocation.getCurrentPosition(

&#x20;       (position) => {

&#x20;         const coords = `${position.coords.latitude}, ${position.coords.longitude}`

&#x20;         setLocation(coords)

&#x20;       },

&#x20;       () => {

&#x20;         setLocation("Location unavailable")

&#x20;       }

&#x20;     )

&#x20;   } else {

&#x20;     setLocation("Geolocation not supported")

&#x20;   }

&#x20; }, \[])



&#x20; const handleSubmit = async (e) => {

&#x20;   e.preventDefault()



&#x20;   const token = localStorage.getItem("token")



&#x20;   const response = await fetch("http://localhost:5000/api/collections", {

&#x20;     method: "POST",

&#x20;     headers: {

&#x20;       "Content-Type": "application/json",

&#x20;       Authorization: `Bearer ${token}`,

&#x20;     },

&#x20;     body: JSON.stringify({

&#x20;       herbName,

&#x20;       quantity: Number(quantity),

&#x20;       assignedLabId,

&#x20;       location,

&#x20;       timestamp

&#x20;     }),

&#x20;   })



&#x20;   const data = await response.json()



&#x20;   if (response.ok) {

&#x20;     setMessage("Collection submitted successfully!")

&#x20;     setHerbName("")

&#x20;     setQuantity("")

&#x20;     setAssignedLabId("")

&#x20;   } else {

&#x20;     setMessage(data.message || "Error submitting collection")

&#x20;   }

&#x20; }



&#x20; return (

&#x20;   <div className="records-section">

&#x20;     <h2>New Collection</h2>



&#x20;     <form className="dashboard-form" onSubmit={handleSubmit}>

&#x20;       <input

&#x20;         type="text"

&#x20;         placeholder="Herb Name"

&#x20;         value={herbName}

&#x20;         onChange={(e) => setHerbName(e.target.value)}

&#x20;         required

&#x20;       />



&#x20;       <input

&#x20;         type="number"

&#x20;         placeholder="Quantity"

&#x20;         value={quantity}

&#x20;         onChange={(e) => setQuantity(e.target.value)}

&#x20;         required

&#x20;       />



&#x20;       <input

&#x20;         type="text"

&#x20;         placeholder="Assigned Lab ID"

&#x20;         value={assignedLabId}

&#x20;         onChange={(e) => setAssignedLabId(e.target.value)}

&#x20;         required

&#x20;       />



&#x20;       {/\* Immutable Timestamp \*/}

&#x20;       <input

&#x20;         type="text"

&#x20;         value={timestamp}

&#x20;         readOnly

&#x20;       />



&#x20;       {/\* Immutable Location \*/}

&#x20;       <input

&#x20;         type="text"

&#x20;         value={location}

&#x20;         readOnly

&#x20;       />



&#x20;       <button type="submit">Submit Collection</button>

&#x20;     </form>



&#x20;     {message \&\& <p>{message}</p>}

&#x20;   </div>

&#x20; )

}



export default NewCollection



### 

### herbtrace/front/src/dashboards/farmer/ProofAudit.jsx:

import { useState } from "react";



function ProofAudit() {

&#x20; const \[collectionId, setCollectionId] = useState("");

&#x20; const \[result, setResult] = useState(null);

&#x20; const \[error, setError] = useState("");



&#x20; const handleCheck = async () => {

&#x20;   try {

&#x20;     const token = localStorage.getItem("token");



&#x20;     const response = await fetch(

&#x20;       `http://localhost:5000/api/proof/${collectionId}`,

&#x20;       {

&#x20;         headers: {

&#x20;           Authorization: `Bearer ${token}`,

&#x20;         },

&#x20;       }

&#x20;     );



&#x20;     const data = await response.json();



&#x20;     if (!response.ok) {

&#x20;       setError(data.message || "Verification failed");

&#x20;       setResult(null);

&#x20;       return;

&#x20;     }



&#x20;     setResult(data);

&#x20;     setError("");

&#x20;   } catch (err) {

&#x20;     setError("Server error");

&#x20;     setResult(null);

&#x20;   }

&#x20; };



&#x20; return (

&#x20;   <div className="card">

&#x20;     <h2>Proof Audit</h2>



&#x20;     <input

&#x20;       type="text"

&#x20;       placeholder="Enter Collection ID"

&#x20;       value={collectionId}

&#x20;       onChange={(e) => setCollectionId(e.target.value)}

&#x20;     />



&#x20;     <button onClick={handleCheck}>Verify</button>



&#x20;     {error \&\& <p>{error}</p>}



&#x20;     {result \&\& (

&#x20;       <div>

&#x20;         <p>Hash: {result.hash}</p>

&#x20;         <p>Signature Valid: {result.valid ? "Yes" : "No"}</p>

&#x20;       </div>

&#x20;     )}

&#x20;   </div>

&#x20; );

}



export default ProofAudit;



### 

### herbtrace/front/src/dashboards/lab/AssignedCollections.jsx:

import { useEffect, useState } from "react"

import LabResultModal from "../../components/LabResultModal"



const AssignedCollections = () => {

&#x20; const \[collections, setCollections] = useState(\[])

&#x20; const \[error, setError] = useState("")

&#x20; const \[selectedCollection, setSelectedCollection] = useState(null)

&#x20; const \[decision, setDecision] = useState(null)

&#x20; const \[remarks, setRemarks] = useState("")

&#x20; const \[assignedMfg, setAssignedMfg] = useState("")

const \[validationResult, setValidationResult] = useState(null)

const \[validating, setValidating] = useState(false)



&#x20; const token = localStorage.getItem("token")



&#x20; const load = async () => {

&#x20;   try {

&#x20;     const res = await fetch("http://localhost:5000/api/collections/assigned", {

&#x20;       headers: { Authorization: `Bearer ${token}` },

&#x20;       cache: "no-store"

&#x20;     })

&#x20;     const data = await res.json()

&#x20;     if (!res.ok) { setError(data.error || "Failed to fetch"); return }

&#x20;     setCollections(data)

&#x20;   } catch (err) {

&#x20;     console.error(err)

&#x20;     setError("Server error")

&#x20;   }

&#x20; }



&#x20; useEffect(() => { load() }, \[])



const handleValidateFarmer = async () => {

&#x20; try {

&#x20;   setValidating(true)

&#x20;   setValidationResult(null)



&#x20;   const res = await fetch(

&#x20;     `http://localhost:5000/api/collections/${selectedCollection.id}/validate`,

&#x20;     {

&#x20;       headers: {

&#x20;         Authorization: `Bearer ${token}`

&#x20;       }

&#x20;     }

&#x20;   )



&#x20;   const data = await res.json()



&#x20;   if (!res.ok) {

&#x20;     setValidationResult({

&#x20;       valid: false,

&#x20;       reason: data.error || "Validation failed"

&#x20;     })

&#x20;     return

&#x20;   }



&#x20;   setValidationResult(data)



&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   setValidationResult({

&#x20;     valid: false,

&#x20;     reason: "Server error"

&#x20;   })

&#x20; } finally {

&#x20;   setValidating(false)

&#x20; }

}



&#x20; const handleSubmitLabResult = async () => {

&#x20; try {

&#x20; 

&#x20;   const res = await fetch("http://localhost:5000/api/lab/results", {

&#x20; method: "POST",

&#x20; headers: {

&#x20;   "Content-Type": "application/json",

&#x20;   Authorization: `Bearer ${token}`

&#x20; },

&#x20; body: JSON.stringify({

&#x20;   collectionId: selectedCollection.id,

&#x20;   result: decision,          // PASS or FAIL

&#x20;   remarks,

&#x20;   assignedMfgId: assignedMfg

&#x20; })

})





&#x20;   const data = await res.json()



&#x20;   if (!res.ok) {

&#x20;     alert(data.error || "Failed to submit result")

&#x20;     return

&#x20;   }



&#x20;   // Close modal after success

&#x20;   setSelectedCollection(null)



&#x20;   // Refresh list

&#x20;   load()



&#x20; } catch (err) {

&#x20;   console.error(err)

&#x20;   alert("Server error")

&#x20; }

}







&#x20; return (

&#x20;   <div className="records-section">

&#x20;     <h2>Incoming Samples</h2>



&#x20;     {error \&\& <p className="error-text">{error}</p>}



&#x20;     {collections.length === 0 \&\& !error \&\& (

&#x20;       <p className="muted-text">No collections assigned to your lab yet.</p>

&#x20;     )}



&#x20;     <table className="records-table">

&#x20;       <thead>

&#x20;         <tr>

&#x20;           <th>Herb</th>

&#x20;           <th>Quantity</th>

&#x20;           <th>Farmer ID</th>

&#x20;           <th>Assigned Lab</th>

&#x20;           <th>Location</th>

&#x20;           <th>Created At</th>

&#x20;           <th>Action</th>

&#x20;         </tr>

&#x20;       </thead>

&#x20;       <tbody>

&#x20;         {collections.map((c) => (

&#x20;           <tr key={c.id}>

&#x20;             <td>{c.herbName}</td>

&#x20;             <td>{c.quantity} kg</td>

&#x20;             <td>{c.farmer?.orgCode || "—"}</td>

&#x20;             <td>{c.assignedLabId || "—"}</td>

&#x20;             <td>{c.location || "—"}</td>

&#x20;             <td>{new Date(c.createdAt).toLocaleString()}</td>

&#x20;             <td>

&#x20;               <button

&#x20; className="btn-secondary"

&#x20; onClick={() => {

&#x20;   setSelectedCollection(c)

&#x20;   setDecision(null)

&#x20;   setRemarks("")

&#x20;   setAssignedMfg("")

&#x20; }}

>



&#x20;                 Add Result

&#x20;               </button>

&#x20;             </td>

&#x20;           </tr>

&#x20;         ))}

&#x20;       </tbody>

&#x20;     </table>



&#x20;     {selectedCollection \&\& (

&#x20; <div className="modal-backdrop" onClick={() => setSelectedCollection(null)}>

&#x20;   <div

&#x20;     className="modal-inspection"

&#x20;     onClick={(e) => e.stopPropagation()}

&#x20;   >



&#x20;     {/\* LEFT PANEL \*/}

&#x20;     <div className="inspection-left">

&#x20;       <h3>Collection Inspection</h3>



&#x20;       <div className="info-block">

&#x20;         <label>Collection ID</label>

&#x20;         <span>{selectedCollection.id}</span>

&#x20;       </div>



&#x20;       <div className="info-block">

&#x20;         <label>Herb</label>

&#x20;         <span>{selectedCollection.herbName}</span>

&#x20;       </div>



&#x20;       <div className="info-block">

&#x20;         <label>Quantity</label>

&#x20;         <span>{selectedCollection.quantity} kg</span>

&#x20;       </div>



&#x20;       <div className="info-block">

&#x20;         <label>Farmer</label>

&#x20;         <span>{selectedCollection.farmer?.name}</span>

&#x20;       </div>



&#x20;       <div className="info-block">

&#x20;         <label>Farmer ID</label>

&#x20;         <span>{selectedCollection.farmer?.orgCode}</span>

&#x20;       </div>



&#x20;       <div className="info-block">

&#x20;         <label>Assigned Lab</label>

&#x20;         <span>{selectedCollection.assignedLabId}</span>

&#x20;       </div>



&#x20;       <div className="info-block">

&#x20;         <label>Created At</label>

&#x20;         <span>

&#x20;           {new Date(selectedCollection.createdAt).toLocaleString()}

&#x20;         </span>

&#x20;       </div>



&#x20;       <button

&#x20; className="ghost-btn"

&#x20; onClick={handleValidateFarmer}

>

&#x20; {validating ? "Validating..." : "Validate Farmer Signature"}

</button>

{validationResult \&\& (

&#x20; <div

&#x20;   className={`validation-result ${

&#x20;     validationResult.valid ? "valid" : "invalid"

&#x20;   }`}

&#x20; >

&#x20;   <div className="validation-icon">

&#x20;     {validationResult.valid ? "" : ""}

&#x20;   </div>



&#x20;   <h2>

&#x20;     {validationResult.valid ? "Record Valid" : "Record Compromised"}

&#x20;   </h2>



&#x20;   {!validationResult.valid \&\& (

&#x20;     <p className="validation-message">

&#x20;       {validationResult.reason}

&#x20;     </p>

&#x20;   )}

&#x20; </div>

)}





&#x20;     </div>



&#x20;     {/\* RIGHT PANEL \*/}

&#x20;     <div className="inspection-right">



&#x20;       <div className="decision-header">

&#x20;         <h3>Lab Decision</h3>

&#x20;         <button

&#x20;           className="close-btn"

&#x20;           onClick={() => setSelectedCollection(null)}

&#x20;         >

&#x20;           ✕

&#x20;         </button>

&#x20;       </div>



&#x20;       <div className="decision-toggle">

&#x20;         <button

&#x20;           className={`pill pass ${decision === "PASS" ? "active" : ""}`}

&#x20;           onClick={() => setDecision("PASS")}

&#x20;         >

&#x20;           PASS

&#x20;         </button>



&#x20;         <button

&#x20;           className={`pill fail ${decision === "FAIL" ? "active" : ""}`}

&#x20;           onClick={() => setDecision("FAIL")}

&#x20;         >

&#x20;           FAIL

&#x20;         </button>

&#x20;       </div>



&#x20;       <textarea

&#x20;         placeholder="Remarks (optional)"

&#x20;         value={remarks}

&#x20;         onChange={(e) => setRemarks(e.target.value)}

&#x20;       />



&#x20;       <input

&#x20;         type="text"

&#x20;         placeholder="Assign Manufacturer ID (optional)"

&#x20;         value={assignedMfg}

&#x20;         onChange={(e) => setAssignedMfg(e.target.value)}

&#x20;       />



&#x20;       <button

&#x20;         className="submit-btn"

&#x20;         disabled={!decision}

&#x20;         onClick={handleSubmitLabResult}

&#x20;       >

&#x20;         Submit Lab Result

&#x20;       </button>



&#x20;     </div>

&#x20;   </div>

&#x20; </div>

)}



&#x20;   </div>

&#x20; )

}



export default AssignedCollections

### 

### herbtrace/front/src/dashboards/lab/LabDashboard.jsx:

import React, { useState } from "react"

import Sidebar from "../../components/Sidebar"

import AssignedCollections from "./AssignedCollections"; 

import PastTests from "./PastTests";



const LabDashboard = () => {

&#x20; const \[activeTab, setActiveTab] = useState("incoming")



&#x20; const handleLogout = () => {

&#x20;   localStorage.clear()

&#x20;   window.location.href = "/"

&#x20; }



&#x20; const renderContent = () => {

&#x20;   switch (activeTab) {

&#x20;     case "incoming":

&#x20;       return <AssignedCollections />

&#x20;     case "test":

&#x20;       return <PastTests />

&#x20;     case "certs":

&#x20;       return <h2>Issued Certificates</h2>

&#x20;     case "audit":

&#x20;       return <h2>Audit Log</h2>

&#x20;     default:

&#x20;       return null

&#x20;   }

&#x20; }



&#x20; return (

&#x20;   <div className="dashboard-layout">

&#x20;     <Sidebar

&#x20;       role="Laboratory"

&#x20;       activeTab={activeTab}

&#x20;       setActiveTab={setActiveTab}

&#x20;       onLogout={handleLogout}

&#x20;     />

&#x20;     <div className="dashboard-content">

&#x20;       {renderContent()}

&#x20;     </div>

&#x20;   </div>

&#x20; )

}



export default LabDashboard



### 

### herbtrace/front/src/dashboards/lab/PastTests.jsx:

import { useEffect, useState } from "react"



const PastTests = () => {

&#x20; const \[results, setResults] = useState(\[])

&#x20; const \[selected, setSelected] = useState(null)

&#x20; const \[error, setError] = useState("")



&#x20; const token = localStorage.getItem("token")



&#x20; const load = async () => {

&#x20;   try {

&#x20;     const res = await fetch("http://localhost:5000/api/lab/results", {

&#x20;       headers: { Authorization: `Bearer ${token}` },

&#x20;       cache: "no-store"

&#x20;     })



&#x20;     const data = await res.json()



&#x20;     if (!res.ok) {

&#x20;       setError(data.error || "Failed to fetch")

&#x20;       return

&#x20;     }



&#x20;     setResults(data)



&#x20;   } catch (err) {

&#x20;     console.error(err)

&#x20;     setError("Server error")

&#x20;   }

&#x20; }



&#x20; useEffect(() => {

&#x20;   load()

&#x20; }, \[])



&#x20; return (

&#x20;   <div className="records-section">

&#x20;     <h2>Past Tests</h2>



&#x20;     {error \&\& <p className="error-text">{error}</p>}



&#x20;     {results.length === 0 \&\& !error \&\& (

&#x20;       <p className="muted-text">No past lab results yet.</p>

&#x20;     )}



&#x20;     <table className="records-table">

&#x20;       <thead>

&#x20;         <tr>

&#x20;           <th>Collection ID</th>

&#x20;           <th>Herb</th>

&#x20;           <th>Result</th>

&#x20;           <th>Created At</th>

&#x20;           <th>Action</th>

&#x20;         </tr>

&#x20;       </thead>

&#x20;       <tbody>

&#x20;         {results.map((r) => (

&#x20;           <tr key={r.id}>

&#x20;             <td>{r.collectionId}</td>

&#x20;             <td>{r.collection?.herbName}</td>

&#x20;             <td>

&#x20;               <span className={`pill ${r.result === "PASS" ? "pass active" : "fail active"}`}>

&#x20;                 {r.result}

&#x20;               </span>

&#x20;             </td>

&#x20;             <td>{new Date(r.createdAt).toLocaleString()}</td>

&#x20;             <td>

&#x20;               <button

&#x20;                 className="btn-secondary"

&#x20;                 onClick={() => setSelected(r)}

&#x20;               >

&#x20;                 View Details

&#x20;               </button>

&#x20;             </td>

&#x20;           </tr>

&#x20;         ))}

&#x20;       </tbody>

&#x20;     </table>



&#x20;     {selected \&\& (

&#x20;       <div className="modal-backdrop" onClick={() => setSelected(null)}>

&#x20;         <div

&#x20;           className="modal-inspection"

&#x20;           onClick={(e) => e.stopPropagation()}

&#x20;         >



&#x20;           {/\* LEFT PANEL - COLLECTION \*/}

&#x20;           <div className="inspection-left">

&#x20;             <h3>Collection Inspection</h3>



&#x20;             <div className="info-block">

&#x20;               <label>Collection ID</label>

&#x20;               <span>{selected.collectionId}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Herb</label>

&#x20;               <span>{selected.collection?.herbName}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Quantity</label>

&#x20;               <span>{selected.collection?.quantity} kg</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Farmer</label>

&#x20;               <span>{selected.collection?.farmer?.name}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Farmer ID</label>

&#x20;               <span>{selected.collection?.farmer?.orgCode}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Location</label>

&#x20;               <span>{selected.collection?.location || "—"}</span>

&#x20;             </div>



&#x20;             <button className="ghost-btn">

&#x20;               Validate Farmer Signature

&#x20;             </button>

&#x20;           </div>



&#x20;           {/\* RIGHT PANEL - LAB RESULT \*/}

&#x20;           <div className="inspection-right">



&#x20;             <div className="decision-header">

&#x20;               <h3>Lab Result</h3>

&#x20;               <button

&#x20;                 className="close-btn"

&#x20;                 onClick={() => setSelected(null)}

&#x20;               >

&#x20;                 ✕

&#x20;               </button>

&#x20;             </div>



&#x20;             <div className="decision-toggle">

&#x20;               <span

&#x20;                 className={`pill ${selected.result === "PASS" ? "pass active" : "fail active"}`}

&#x20;               >

&#x20;                 {selected.result}

&#x20;               </span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Remarks</label>

&#x20;               <span>{selected.remarks || "—"}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Assigned Manufacturer</label>

&#x20;               <span>

&#x20;                 {selected.assignedMfg?.orgCode || "—"}

&#x20;               </span>

&#x20;             </div>



&#x20;           </div>

&#x20;         </div>

&#x20;       </div>

&#x20;     )}

&#x20;   </div>

&#x20; )

}



export default PastTests



### 

### herbtrace/front/src/dashboards/manufacturer/AppovedResults.jsx:

import { useEffect, useState } from "react"



const ApprovedResults = () => {

&#x20; const \[results, setResults] = useState(\[])

&#x20; const \[selected, setSelected] = useState(null)



&#x20; const \[batchName, setBatchName] = useState("")

&#x20; const \[herbUsedQuantity, setHerbUsedQuantity] = useState("")

&#x20; const \[finalProductQuantity, setFinalProductQuantity] = useState("")

&#x20; const \[expiryDate, setExpiryDate] = useState("")



&#x20; const token = localStorage.getItem("token")



&#x20; const load = async () => {

&#x20;   const res = await fetch("http://localhost:5000/api/manufacturer/approved", {

&#x20;     headers: { Authorization: `Bearer ${token}` }

&#x20;   })

&#x20;   const data = await res.json()

&#x20;   setResults(data)

&#x20; }



&#x20; useEffect(() => { load() }, \[])



&#x20; const handleCreateBatch = async () => {

&#x20;   try {

&#x20;     const res = await fetch("http://localhost:5000/api/manufacturer/batch", {

&#x20;       method: "POST",

&#x20;       headers: {

&#x20;         "Content-Type": "application/json",

&#x20;         Authorization: `Bearer ${token}`

&#x20;       },

&#x20;       body: JSON.stringify({

&#x20;         labResultId: selected.id,

&#x20;         batchName,

&#x20;         herbUsedQuantity: Number(herbUsedQuantity),

&#x20;         finalProductQuantity: Number(finalProductQuantity),

&#x20;         expiryDate

&#x20;       })

&#x20;     })



&#x20;     const data = await res.json()



&#x20;     if (!res.ok) {

&#x20;       alert(data.error || "Failed to create batch")

&#x20;       return

&#x20;     }



&#x20;     // Reset + close

&#x20;     setSelected(null)

&#x20;     setBatchName("")

&#x20;     setHerbUsedQuantity("")

&#x20;     setFinalProductQuantity("")

&#x20;     setExpiryDate("")

&#x20;     load()



&#x20;   } catch (err) {

&#x20;     console.error(err)

&#x20;     alert("Server error")

&#x20;   }

&#x20; }



&#x20; return (

&#x20;   <div className="records-section">

&#x20;     <h2>Approved Lab Results</h2>



&#x20;     <table className="records-table">

&#x20;       <thead>

&#x20;         <tr>

&#x20;           <th>Herb</th>

&#x20;           <th>Farmer</th>

&#x20;           <th>Lab</th>

&#x20;           <th>Decision</th>

&#x20;           <th>Action</th>

&#x20;         </tr>

&#x20;       </thead>

&#x20;       <tbody>

&#x20;         {results.map(r => (

&#x20;           <tr key={r.id}>

&#x20;             <td>{r.collection?.herbName}</td>

&#x20;             <td>{r.collection?.farmer?.orgCode}</td>

&#x20;             <td>{r.lab?.orgCode}</td>

&#x20;             <td>{r.result}</td>

&#x20;             <td>

&#x20;               <button

&#x20;                 className="btn-secondary"

&#x20;                 onClick={() => setSelected(r)}

&#x20;               >

&#x20;                 Create Batch

&#x20;               </button>

&#x20;             </td>

&#x20;           </tr>

&#x20;         ))}

&#x20;       </tbody>

&#x20;     </table>



&#x20;     {selected \&\& (

&#x20;       <div className="modal-backdrop" onClick={() => setSelected(null)}>

&#x20;         <div

&#x20;           className="modal-inspection"

&#x20;           onClick={(e) => e.stopPropagation()}

&#x20;         >



&#x20;           {/\* LEFT PANEL \*/}

&#x20;           <div className="inspection-left">

&#x20;             <h3>Lab Result Details</h3>



&#x20;             <div className="info-block">

&#x20;               <label>Herb</label>

&#x20;               <span>{selected.collection?.herbName}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Original Quantity</label>

&#x20;               <span>{selected.collection?.quantity} g</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Farmer ID</label>

&#x20;               <span>{selected.collection?.farmer?.orgCode}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Lab ID</label>

&#x20;               <span>{selected.lab?.orgCode}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Result</label>

&#x20;               <span>{selected.result}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Remarks</label>

&#x20;               <span>{selected.remarks || "—"}</span>

&#x20;             </div>



&#x20;             <button className="ghost-btn">

&#x20;               Validate Lab Signature

&#x20;             </button>

&#x20;           </div>



&#x20;           {/\* RIGHT PANEL \*/}

&#x20;           <div className="inspection-right">



&#x20;             <div className="decision-header">

&#x20;               <h3>Create Manufacturing Batch</h3>

&#x20;               <button

&#x20;                 className="close-btn"

&#x20;                 onClick={() => setSelected(null)}

&#x20;               >

&#x20;                 ✕

&#x20;               </button>

&#x20;             </div>



&#x20;             <input

&#x20;               type="text"

&#x20;               placeholder="Batch Name"

&#x20;               value={batchName}

&#x20;               onChange={(e) => setBatchName(e.target.value)}

&#x20;             />



&#x20;             <input

&#x20;               type="number"

&#x20;               placeholder="Herb Used (grams)"

&#x20;               value={herbUsedQuantity}

&#x20;               onChange={(e) => setHerbUsedQuantity(e.target.value)}

&#x20;             />



&#x20;             <input

&#x20;               type="number"

&#x20;               placeholder="Final Product Quantity (grams)"

&#x20;               value={finalProductQuantity}

&#x20;               onChange={(e) => setFinalProductQuantity(e.target.value)}

&#x20;             />



&#x20;             <input

&#x20;               type="date"

&#x20;               value={expiryDate}

&#x20;               onChange={(e) => setExpiryDate(e.target.value)}

&#x20;             />



&#x20;             <button

&#x20;               className="submit-btn"

&#x20;               disabled={

&#x20;                 !batchName ||

&#x20;                 !herbUsedQuantity ||

&#x20;                 !finalProductQuantity ||

&#x20;                 !expiryDate

&#x20;               }

&#x20;               onClick={handleCreateBatch}

&#x20;             >

&#x20;               Create Batch

&#x20;             </button>



&#x20;           </div>

&#x20;         </div>

&#x20;       </div>

&#x20;     )}

&#x20;   </div>

&#x20; )

}



export default ApprovedResults



### 

### herbtrace/front/src/dashboards/manufacturer/ManufacturerDashboard.jsx:

import { useState } from "react"

import Sidebar from "../../components/Sidebar"

import ApprovedResults from "./ApprovedResults"

import MyBatches from "./MyBatches"



function ManufacturerDashboard() {

&#x20; const \[activeTab, setActiveTab] = useState("approved")



&#x20; const handleLogout = () => {

&#x20;   localStorage.removeItem("token")

&#x20;   localStorage.removeItem("organization")

&#x20;   window.location.href = "/login"

&#x20; }



&#x20; return (

&#x20;   <div className="dashboard-layout">

&#x20;     <Sidebar

&#x20;       role="Manufacturer"

&#x20;       activeTab={activeTab}

&#x20;       setActiveTab={setActiveTab}

&#x20;       onLogout={handleLogout}

&#x20;     />



&#x20;     <div className="dashboard-content">

&#x20;       {activeTab === "approved" \&\& <ApprovedResults />}

&#x20;       {activeTab === "manufacture" \&\& <MyBatches />}

&#x20;     </div>

&#x20;   </div>

&#x20; )

}



export default ManufacturerDashboard



### 

### herbtrace/front/src/dashboards/manufacturer/MyBatches.jsx:

import { useEffect, useState } from "react"



const ManufacturingRecords = () => {

&#x20; const \[batches, setBatches] = useState(\[])

&#x20; const \[selectedBatch, setSelectedBatch] = useState(null)

&#x20; const \[error, setError] = useState("")



&#x20; const token = localStorage.getItem("token")



&#x20; const load = async () => {

&#x20;   try {

&#x20;     const res = await fetch(

&#x20;       "http://localhost:5000/api/manufacturer/batches",

&#x20;       {

&#x20;         headers: { Authorization: `Bearer ${token}` }

&#x20;       }

&#x20;     )



&#x20;     const data = await res.json()

&#x20;     if (!res.ok) {

&#x20;       setError(data.error || "Failed to fetch")

&#x20;       return

&#x20;     }



&#x20;     setBatches(data)



&#x20;   } catch (err) {

&#x20;     console.error(err)

&#x20;     setError("Server error")

&#x20;   }

&#x20; }



&#x20; useEffect(() => { load() }, \[])



&#x20; return (

&#x20;   <div className="records-section">

&#x20;     <h2>Manufacturing Records</h2>



&#x20;     {error \&\& <p className="error-text">{error}</p>}



&#x20;     {batches.length === 0 \&\& !error \&\& (

&#x20;       <p className="muted-text">No batches created yet.</p>

&#x20;     )}



&#x20;     <table className="records-table">

&#x20;       <thead>

&#x20;         <tr>

&#x20;           <th>Batch Code</th>

&#x20;           <th>Batch Name</th>

&#x20;           <th>Herb</th>

&#x20;           <th>Final Qty (g)</th>

&#x20;           <th>Expiry</th>

&#x20;           <th>Action</th>

&#x20;         </tr>

&#x20;       </thead>

&#x20;       <tbody>

&#x20;         {batches.map((b) => (

&#x20;           <tr key={b.id}>

&#x20;             <td>{b.batchCode}</td>

&#x20;             <td>{b.batchName}</td>

&#x20;             <td>{b.labResult.collection.herbName}</td>

&#x20;             <td>{b.finalProductQuantity} g</td>

&#x20;             <td>{new Date(b.expiryDate).toLocaleDateString()}</td>

&#x20;             <td>

&#x20;               <button

&#x20;                 className="btn-secondary"

&#x20;                 onClick={() => setSelectedBatch(b)}

&#x20;               >

&#x20;                 View Details

&#x20;               </button>

&#x20;             </td>

&#x20;           </tr>

&#x20;         ))}

&#x20;       </tbody>

&#x20;     </table>



&#x20;     {selectedBatch \&\& (

&#x20;       <div

&#x20;         className="modal-backdrop"

&#x20;         onClick={() => setSelectedBatch(null)}

&#x20;       >

&#x20;         <div

&#x20;           className="modal-inspection"

&#x20;           onClick={(e) => e.stopPropagation()}

&#x20;         >



&#x20;           {/\* LEFT SIDE — FARM + LAB \*/}

&#x20;           <div className="inspection-left">

&#x20;             <h3>Upstream Trace</h3>



&#x20;             <div className="info-block">

&#x20;               <label>Herb</label>

&#x20;               <span>{selectedBatch.labResult.collection.herbName}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Farmer</label>

&#x20;               <span>{selectedBatch.labResult.collection.farmer.name}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Farmer ID</label>

&#x20;               <span>{selectedBatch.labResult.collection.farmer.orgCode}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Original Quantity</label>

&#x20;               <span>{selectedBatch.labResult.collection.quantity} kg</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Lab</label>

&#x20;               <span>{selectedBatch.labResult.lab.name}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Lab ID</label>

&#x20;               <span>{selectedBatch.labResult.lab.orgCode}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Lab Result</label>

&#x20;               <span>{selectedBatch.labResult.result}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Remarks</label>

&#x20;               <span>{selectedBatch.labResult.remarks || "—"}</span>

&#x20;             </div>

&#x20;           </div>



&#x20;           {/\* RIGHT SIDE — BATCH INFO \*/}

&#x20;           <div className="inspection-right">



&#x20;             <div className="decision-header">

&#x20;               <h3>Batch Details</h3>

&#x20;               <button

&#x20;                 className="close-btn"

&#x20;                 onClick={() => setSelectedBatch(null)}

&#x20;               >

&#x20;                 ✕

&#x20;               </button>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Batch Code</label>

&#x20;               <span>{selectedBatch.batchCode}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Batch Name</label>

&#x20;               <span>{selectedBatch.batchName}</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Herb Used</label>

&#x20;               <span>{selectedBatch.herbUsedQuantity} g</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Final Product Quantity</label>

&#x20;               <span>{selectedBatch.finalProductQuantity} g</span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Expiry Date</label>

&#x20;               <span>

&#x20;                 {new Date(selectedBatch.expiryDate).toLocaleDateString()}

&#x20;               </span>

&#x20;             </div>



&#x20;             <div className="info-block">

&#x20;               <label>Created At</label>

&#x20;               <span>

&#x20;                 {new Date(selectedBatch.createdAt).toLocaleString()}

&#x20;               </span>

&#x20;             </div>



&#x20;           </div>

&#x20;         </div>

&#x20;       </div>

&#x20;     )}

&#x20;   </div>

&#x20; )

}



export default ManufacturingRecords





