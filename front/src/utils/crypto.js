// export async function generateHash(data) {
//   const encoder = new TextEncoder()
//   const buffer = encoder.encode(data)

//   const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)

//   const hashArray = Array.from(new Uint8Array(hashBuffer))
//   return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
// }


// herbtrace/front/src/utils/cryptoUtils.js
//
// Browser-compatible crypto using the Web Crypto API (window.crypto.subtle).
// These functions mirror the backend crypto.utils.js exactly so both sides
// produce identical canonical strings and hashes.

// ─────────────────────────────────────────────
// CANONICAL BUILDERS
// Must stay byte-for-byte identical to the backend builders in crypto.utils.js
// ─────────────────────────────────────────────

export const buildCollectionCanonical = ({
  collectionId,
  herbName,
  quantity,
  farmerCode,
  assignedLabId,
  location,
  timestamp,
}) =>
  `collectionId:${collectionId}|` +
  `herbName:${herbName}|` +
  `quantity:${String(quantity)}|` +
  `farmerCode:${farmerCode}|` +
  `assignedLabId:${assignedLabId || ""}|` +
  `location:${location || ""}|` +
  `timestamp:${timestamp}`

export const buildLabResultCanonical = ({
  labResultId,
  collectionId,
  labCode,
  result,
  remarks,
  assignedMfgId,
  timestamp,
}) =>
  `labResultId:${labResultId}|` +
  `collectionId:${collectionId}|` +
  `labCode:${labCode}|` +
  `result:${result}|` +
  `remarks:${remarks || ""}|` +
  `assignedMfgId:${assignedMfgId || ""}|` +
  `timestamp:${timestamp}`

export const buildManufacturingCanonical = ({
  batchId,
  batchName,
  labResultId,
  manufacturerId,
  herbUsedQuantity,
  finalProductQuantity,
  expiryDate,
  timestamp,
}) =>
  `batchId:${batchId}|` +
  `batchName:${batchName}|` +
  `labResultId:${labResultId}|` +
  `manufacturerId:${manufacturerId}|` +
  `herbUsedQuantity:${herbUsedQuantity}|` +
  `finalProductQuantity:${finalProductQuantity}|` +
  `expiryDate:${expiryDate}|` +
  `timestamp:${timestamp}`


// ─────────────────────────────────────────────
// SHA-256 HASH
// Returns a hex string, matching Node's crypto.createHash("sha256").digest("hex")
// ─────────────────────────────────────────────

export const generateHash = async (data) => {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}


// ─────────────────────────────────────────────
// ECDSA SIGNATURE VERIFICATION (P-256)
// Verifies a hex-encoded DER signature against a PEM public key.
// Matches Node's crypto.createVerify("SHA256").verify(publicKey, signature, "hex")
// ─────────────────────────────────────────────

// Helper: convert PEM string to ArrayBuffer (strips headers + base64 decodes)
const pemToArrayBuffer = (pem) => {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s+/g, "")
  const binary = atob(b64)
  const buf = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i)
  }
  return buf
}

// Helper: convert hex string to Uint8Array
const hexToUint8Array = (hex) => {
  const bytes = []
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i+2), 16))
  }
  return new Uint8Array(bytes)
}

// export const verifySignature = async (publicKeyPem, data, signatureHex) => {
//   try {
//     const keyBuffer = pemToArrayBuffer(publicKeyPem)

//     const cryptoKey = await window.crypto.subtle.importKey(
//       "spki",
//       keyBuffer,
//       { name: "ECDSA", namedCurve: "P-256" },
//       false,
//       ["verify"]
//     )

//     // The signature from Node is DER-encoded hex. SubtleCrypto expects raw (r||s) format.
//     // We need to convert DER → raw for the Web Crypto API.
//     const derBytes = hexToUint8Array(signatureHex)
//     const rawSignature = derToRaw(derBytes)

//     // SubtleCrypto verifies against the original data, not the hash.
//     // The backend signed the hash string itself (not the raw data), so we sign the hash string.
//     const encoder = new TextEncoder()
//     const dataBuffer = encoder.encode()

//     const valid = await window.crypto.subtle.verify(
//       { name: "ECDSA", hash: { name: "SHA-256" } },
//       cryptoKey,
//       rawSignature,
//       dataBuffer
//     )

//     return valid
//   } catch (err) {
//     console.error("Signature verification error:", err)
//     return false
//   }
// }


export const verifySignature = async (publicKeyPem, data, signatureHex) => {
  try {
    const keyBuffer = pemToArrayBuffer(publicKeyPem)

    const cryptoKey = await window.crypto.subtle.importKey(
      "spki",
      keyBuffer,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    )

    // Convert DER → raw (r || s)
    const derBytes = hexToUint8Array(signatureHex)
    const rawSignature = derToRaw(derBytes)

    // ✅ FIX: use actual canonical data
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)

    const valid = await window.crypto.subtle.verify(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      cryptoKey,
      rawSignature,
      dataBuffer
    )

    console.log("FRONTEND VERIFY RESULT:", valid)

    return valid
  } catch (err) {
    console.error("Signature verification error:", err)
    return false
  }
}




// Convert DER-encoded ECDSA signature to raw r||s format (64 bytes for P-256)
const derToRaw = (der) => {
  // DER format: 0x30 [total-len] 0x02 [r-len] [r] 0x02 [s-len] [s]
  let offset = 2 // skip 0x30 and total length
  offset++ // skip 0x02 (r tag)
  const rLen = der[offset++]
  // r may be padded with a leading 0x00 if high bit set
  const rStart = rLen === 33 ? offset + 1 : offset
  const r = der.slice(rStart, rStart + 32)
  offset += rLen
  offset++ // skip 0x02 (s tag)
  const sLen = der[offset++]
  const sStart = sLen === 33 ? offset + 1 : offset
  const s = der.slice(sStart, sStart + 32)

  const raw = new Uint8Array(64)
  raw.set(r, 0)
  raw.set(s, 32)
  return raw
}
