import React, { useState } from "react"
import {
  verifySignature,
  buildCollectionCanonical,
  buildLabResultCanonical,
  generateHash
} from "../utils/crypto"
import ValidationResultModal from "./ValidationResultModal"

const ManufacturerResultModal = ({ result, onClose }) => {
  const collection = result?.collection

  const [farmerValidation, setFarmerValidation] = useState(null)
  const [labValidation, setLabValidation] = useState(null)
  const [showFarmerModal, setShowFarmerModal] = useState(false)
  const [showLabModal, setShowLabModal] = useState(false)
  const [isValidatingFarmer, setIsValidatingFarmer] = useState(false)
  const [isValidatingLab, setIsValidatingLab] = useState(false)

  if (!result || !collection) return null

  // ===============================
  // FARMER VALIDATION
  // ===============================
  const validateFarmerSignature = async () => {
    const c = collection

    if (!c?.farmer?.publicKey) {
      console.error("Missing farmer data", c)
      return
    }

    setIsValidatingFarmer(true)

    try {
      const canonical = buildCollectionCanonical({
        collectionId: c.id,
        herbName: c.herbName,
        quantity: c.quantity,
        farmerCode: c.farmer.orgCode,
        assignedLabId: c.assignedLabId,
        location: c.location,
        timestamp: c.canonicalTimestamp
      })

      const computedHash = await generateHash(canonical)
      const hashMatch = computedHash === c.hash

      let signatureValid = false
      if (hashMatch) {
        signatureValid = await verifySignature(
          c.farmer.publicKey,
          canonical,
          c.signature
        )
      }

      setFarmerValidation({
        stored: c.hash,
        computed: computedHash,
        hashMatch,
        signatureValid,
      })
    } catch (error) {
      console.error("Farmer validation error:", error)
      setFarmerValidation({
        stored: c.hash || "N/A",
        computed: "Error",
        hashMatch: false,
        signatureValid: false,
        error: error.message,
      })
    } finally {
      setIsValidatingFarmer(false)
      setShowFarmerModal(true)
    }
  }

  // ===============================
  // LAB VALIDATION
  // ===============================
  const validateLabSignature = async () => {
    if (!result?.lab?.publicKey) {
      console.error("Missing lab data", result)
      return
    }

    setIsValidatingLab(true)

    try {
      const canonical = buildLabResultCanonical({
        labResultId: result.id,
        collectionId: result.collectionId,
        labCode: result.lab.orgCode,
        result: result.result,
        remarks: result.remarks,
        assignedMfgId: result.assignedMfgId,
        timestamp: result.canonicalTimestamp
      })

      const computedHash = await generateHash(canonical)
      const hashMatch = computedHash === result.hash

      let signatureValid = false
      if (hashMatch) {
        signatureValid = await verifySignature(
          result.lab.publicKey,
          canonical,
          result.signature
        )
      }

      setLabValidation({
        stored: result.hash,
        computed: computedHash,
        hashMatch,
        signatureValid,
      })
    } catch (error) {
      console.error("Lab validation error:", error)
      setLabValidation({
        stored: result.hash || "N/A",
        computed: "Error",
        hashMatch: false,
        signatureValid: false,
        error: error.message,
      })
    } finally {
      setIsValidatingLab(false)
      setShowLabModal(true)
    }
  }

  return (
    <>
      <div className="modal-backdrop">
        <div className="modal-inspection">

          {/* LEFT */}
          <div className="inspection-left">
            <h3>Collection Details</h3>

            <div className="info-block">
              <label>Collection ID</label>
              <span>{collection.id}</span>
            </div>

            <div className="info-block">
              <label>Herb</label>
              <span>{collection.herbName}</span>
            </div>

            <div className="info-block">
              <label>Quantity</label>
              <span>{collection.quantity} g</span>
            </div>

            <div className="info-block">
              <label>Farmer</label>
              <span>{collection.farmer?.name || "—"}</span>
            </div>

            <hr />

            <button
              className="btn-secondary"
              onClick={validateFarmerSignature}
              disabled={isValidatingFarmer}
            >
              {isValidatingFarmer ? "Validating..." : "Validate Farmer Signature"}
            </button>
          </div>

          {/* RIGHT */}
          <div className="inspection-right">
            <div className="decision-header">
              <h4>Lab Result</h4>
              <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className={`result-badge ${result.result === "PASS" ? "pass" : "fail"}`}>
              {result.result}
            </div>

            <div className="info-block">
              <label>Lab</label>
              <span>{result.lab?.orgCode || "—"}</span>
            </div>

            <div className="info-block">
              <label>Remarks</label>
              <span>{result.remarks || "—"}</span>
            </div>

            <hr />

            <button
              className="btn-secondary"
              onClick={() => {
    console.log("LAB BUTTON CLICKED")
    validateLabSignature()
  }}
              disabled={isValidatingLab}
            >
              {isValidatingLab ? "Validating..." : "Validate Lab Signature"}
            </button>

            <hr />

            <h4>Manufacturer Action</h4>

            <button
              className="submit-btn"
              onClick={() => alert("Create Batch (coming next)")}
            >
              Create Batch
            </button>
          </div>

        </div>
      </div>

      {showFarmerModal && (
        <ValidationResultModal
          validation={farmerValidation}
          title="Farmer Signature Validation"
          onClose={() => setShowFarmerModal(false)}
        />
      )}

      {showLabModal && (
        <ValidationResultModal
          validation={labValidation}
          title="Lab Signature Validation"
          onClose={() => setShowLabModal(false)}
        />
      )}
    </>
  )
}

export default ManufacturerResultModal