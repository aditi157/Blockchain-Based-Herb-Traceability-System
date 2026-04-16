import prisma from "../config/db.js"
import {
  generateHash,
  verifySignature,
  buildCollectionCanonical,
  buildLabResultCanonical,
  buildManufacturingCanonical
} from "../utils/crypto.utils.js"


// ================= FARMER =================
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

    const rebuiltCanonical = buildCollectionCanonical({
      collectionId:  collection.id,
      herbName:      collection.herbName,
      quantity:      collection.quantity,
      farmerCode:    farmer.orgCode,
      assignedLabId: collection.assignedLabId,
      location:      collection.location,
      timestamp:     collection.canonicalTimestamp
    })

    const rebuiltHash = generateHash(rebuiltCanonical)
    const hashMatch = rebuiltHash === collection.hash

    let signatureValid = false
    if (hashMatch) {
      signatureValid = verifySignature(
        farmer.publicKey,
        collection.canonicalData,
        collection.signature
      )
    }

    res.json({
      hashMatch,
      signatureValid,
      storedHash: collection.hash,
      computedHash: rebuiltHash,
      canonicalData: collection.canonicalData
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}


// ================= LAB =================
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

    const rebuiltCanonical = buildLabResultCanonical({
      labResultId:   labResult.id,
      collectionId:  labResult.collectionId,
      labCode:       lab.orgCode,
      result:        labResult.result,
      remarks:       labResult.remarks,
      assignedMfgId: labResult.assignedMfgId,
      timestamp:     labResult.canonicalTimestamp
    })

    const rebuiltHash = generateHash(rebuiltCanonical)
    const hashMatch = rebuiltHash === labResult.hash

    let signatureValid = false
    if (hashMatch) {
      signatureValid = verifySignature(
        lab.publicKey,
        labResult.canonicalData,
        labResult.signature
      )
    }

    res.json({
      hashMatch,
      signatureValid,
      storedHash: labResult.hash,
      computedHash: rebuiltHash,
      canonicalData: labResult.canonicalData,
      txHash: batch.txHash,
  etherscan: batch.txHash
    ? `https://sepolia.etherscan.io/tx/${batch.txHash}`
    : null
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}


// ================= MANUFACTURER =================
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

    const rebuiltCanonical = buildManufacturingCanonical({
      batchId:              batch.id,
      batchName:            batch.batchName,
      labResultId:          batch.labResultId,
      manufacturerId:       batch.manufacturerId,
      herbUsedQuantity:     String(batch.herbUsedQuantity),
      finalProductQuantity: String(batch.finalProductQuantity),
      expiryDate:           new Date(batch.expiryDate).toISOString(),
      timestamp:            batch.canonicalTimestamp
    })

    const rebuiltHash = generateHash(rebuiltCanonical)
    const hashMatch = rebuiltHash === batch.hash

    let signatureValid = false
    if (hashMatch) {
      signatureValid = verifySignature(
        batch.manufacturer.publicKey,
        batch.canonicalData,
        batch.signature
      )
    }

    res.json({
      hashMatch,
      signatureValid,
      storedHash: batch.hash,
      computedHash: rebuiltHash,
      canonicalData: batch.canonicalData,
      txHash: batch.txHash,
  etherscan: batch.txHash
    ? `https://sepolia.etherscan.io/tx/${batch.txHash}`
    : null
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}


// ================= TRACE =================
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

export const getTraceByCollection = async (req, res) => {
  try {
    const { collectionId } = req.params

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        farmer: true,
        labResults: {
          include: { lab: true }
        }
      }
    })

    if (!collection) {
      return res.status(404).json({ error: "Collection not found" })
    }

    res.json(collection)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
}