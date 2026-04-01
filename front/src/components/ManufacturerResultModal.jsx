import React, { useState } from "react";
import { verifySignature } from "../utils/crypto.utils";
import { generateHash } from "../utils/hashUtils";
import ValidationResultModal from "./ValidationResultModal";

const ManufacturerResultModal = ({ result, onClose }) => {
  const collection = result?.collection;

  const [farmerValidation, setFarmerValidation] = useState(null);
  const [labValidation, setLabValidation] = useState(null);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [isValidatingFarmer, setIsValidatingFarmer] = useState(false);
  const [isValidatingLab, setIsValidatingLab] = useState(false);

  if (!result || !collection) return null;

  // ===============================
  // FARMER VALIDATION
  // ===============================
  // const validateFarmerSignature = async () => {
  //   setIsValidatingFarmer(true);

  //   try {
  //     const computedHash = await generateHash(collection.canonicalData);

  //     const hashMatch = computedHash === collection.hash;

  //     const signatureValid = await verifySignature(
  //       collection.farmer.publicKey,
  //       collection.hash,
  //       collection.signature
  //     );

  //     setFarmerValidation({
  //       stored: collection.hash,
  //       computed: computedHash,
  //       hashMatch,
  //       signatureValid,
  //     });
  //   } catch (error) {
  //     setFarmerValidation({
  //       stored: collection.hash || "N/A",
  //       computed: "Error",
  //       hashMatch: false,
  //       signatureValid: false,
  //       error: error.message,
  //     });
  //   } finally {
  //     setIsValidatingFarmer(false);
  //     setShowFarmerModal(true);
  //   }
  // };

const validateFarmerSignature = async () => {
  setIsValidatingFarmer(true)

  try {
    const canonical = buildCollectionCanonical({
      collectionId: collection.id,
      herbName: collection.herbName,
      quantity: collection.quantity,
      farmerCode: collection.farmer.orgCode,
      assignedLabId: collection.assignedLabId,
      location: collection.location,
      timestamp: collection.canonicalTimestamp
    })

    const computedHash = await generateHash(canonical)
    const hashMatch = computedHash === collection.hash

    let signatureValid = false
    if (hashMatch) {
      signatureValid = await verifySignature(
        collection.farmer.publicKey,
        canonical,   // ✅ FIXED
        collection.signature
      )
    }

    setFarmerValidation({
      stored: collection.hash,
      computed: computedHash,
      hashMatch,
      signatureValid,
    })
  } catch (error) {
    setFarmerValidation({
      stored: collection.hash || "N/A",
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
  // const validateLabSignature = async () => {
  //   setIsValidatingLab(true);

  //   try {
  //     const computedHash = await generateHash(result.canonicalData);

  //     const hashMatch = computedHash === result.resultHash;

  //     const signatureValid = await verifySignature(
  //       result.lab.publicKey,
  //       result.resultHash,
  //       result.resultSignature
  //     );

  //     setLabValidation({
  //       stored: result.resultHash,
  //       computed: computedHash,
  //       hashMatch,
  //       signatureValid,
  //     });
  //   } catch (error) {
  //     setLabValidation({
  //       stored: result.resultHash || "N/A",
  //       computed: "Error",
  //       hashMatch: false,
  //       signatureValid: false,
  //       error: error.message,
  //     });
  //   } finally {
  //     setIsValidatingLab(false);
  //     setShowLabModal(true);
  //   }
  // };

const validateLabSignature = async () => {
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
        canonical,   // ✅ FIXED
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

          {/* LEFT: COLLECTION INFO */}
          <div className="inspection-left">
            <h3>Collection Details</h3>

            <div className="info-block">
              <label>Collection ID</label>
              <span>{collection.collectionId}</span>
            </div>

            <div className="info-block">
              <label>Herb</label>
              <span>{collection.herbName}</span>
            </div>

            <div className="info-block">
              <label>Quantity</label>
              <span>{collection.quantity} kg</span>
            </div>

            <div className="info-block">
              <label>Farmer</label>
              <span>{collection.farmerOrgName}</span>
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

          {/* RIGHT: LAB RESULT + ACTION */}
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
              <span>{result.labOrgCode}</span>
            </div>

            <div className="info-block">
              <label>Remarks</label>
              <span>{result.remarks || "—"}</span>
            </div>

            <hr />

            <button
              className="btn-secondary"
              onClick={validateLabSignature}
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
  );
};

export default ManufacturerResultModal;

