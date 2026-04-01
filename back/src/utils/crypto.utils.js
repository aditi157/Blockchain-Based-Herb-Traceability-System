import crypto from "crypto"

/* ============================
   SHA256 HASH
============================ */
export const generateHash = (data) => {
  return crypto.createHash("sha256").update(data).digest("hex")
}

/* ============================
   SIGN HASH (ECDSA P-256)
============================ */
// export const signHash = (privateKey, hash) => {
//   const sign = crypto.createSign("SHA256")
//   sign.update(hash)
//   sign.end()
//   return sign.sign(privateKey, "hex")
// }

export const signData = (privateKey, data) => {
  const sign = crypto.createSign("SHA256")
  sign.update(data)              // 🔥 SIGN CANONICAL, NOT HASH
  sign.end()
  return sign.sign(privateKey, "hex")
}

/* ============================
   COLLECTION CANONICAL BUILDER
============================ */
export const buildCollectionCanonical = ({
  collectionId,
  herbName,
  quantity,
  farmerCode,
  assignedLabId,
  location,
  timestamp
}) => {
  return (
    `collectionId:${collectionId}|` +
    `herbName:${herbName}|` +
    `quantity:${String(quantity)}|` +
    `farmerCode:${farmerCode}|` +
    `assignedLabId:${assignedLabId || ""}|` +
    `location:${location || ""}|` +
    `timestamp:${timestamp}`
  )
}

/* ============================
   LAB RESULT CANONICAL BUILDER
============================ */
export const buildLabResultCanonical = ({
  labResultId,
  collectionId,
  labCode,
  result,
  remarks,
  assignedMfgId,
  timestamp
}) => {
  return (
    `labResultId:${labResultId}|` +
    `collectionId:${collectionId}|` +
    `labCode:${labCode}|` +
    `result:${result}|` +
    `remarks:${remarks || ""}|` +
    `assignedMfgId:${assignedMfgId || ""}|` +
    `timestamp:${timestamp}`
  )
}

// Canonical builder for Manufacturing Batch
export const buildManufacturingCanonical = ({
  batchId,
  batchName,
  labResultId,
  manufacturerId,
  herbUsedQuantity,
  finalProductQuantity,
  expiryDate,
  timestamp
}) => {
  return (
    `batchId:${batchId}|` +
    `batchName:${batchName}|` +
    `labResultId:${labResultId}|` +
    `manufacturerId:${manufacturerId}|` +
    `herbUsedQuantity:${herbUsedQuantity}|` +
    `finalProductQuantity:${finalProductQuantity}|` +
    `expiryDate:${expiryDate}|` +
    `timestamp:${timestamp}`
  )
}

// export const verifySignature = (publicKey, hash, signature) => {
//   const verify = crypto.createVerify("SHA256")
//   verify.update(hash)
//   verify.end()
//   return verify.verify(publicKey, signature, "hex")
// }


export const verifySignature = (publicKey, data, signature) => {
  console.log("\n----- VERIFY FUNCTION -----")
  console.log("Data received for verify:")
  console.log(data)

  console.log("\nSignature:")
  console.log(signature)

  console.log("\nPublic Key:")
  console.log(publicKey)

  const verify = crypto.createVerify("SHA256")
  verify.update(data)
  verify.end()

  const result = verify.verify(publicKey, signature, "hex")

  console.log("\nVerification Result:", result)
  console.log("---------------------------\n")

  return result
}