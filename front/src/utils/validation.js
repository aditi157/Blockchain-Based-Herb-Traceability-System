import { generateHash, buildCollectionCanonical } from "./crypto"

export const validateCollectionClient = (data) => {
  const canonical = buildCollectionCanonical({
    collectionId: data.id,
    herbName: data.herbName,
    quantity: data.quantity,
    farmerCode: data.farmer.orgCode,
    assignedLabId: data.assignedLabId,
    location: data.location,
    timestamp: data.signedTimestamp
  })

  const computedHash = generateHash(canonical)

  return {
    hashMatch: computedHash === data.hash,
    computedHash
  }
}