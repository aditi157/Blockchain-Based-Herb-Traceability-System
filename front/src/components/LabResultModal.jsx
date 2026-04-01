import React, { useState } from "react";
import ValidationResultModal from "./ValidationResultModal";

const LabResultModal = ({ collection, onClose, onSubmit }) => {
  const [result, setResult] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [manufacturerId, setManufacturerId] = useState("");
  const [validation, setValidation] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  if (!collection) return null;

  const validateFarmerSignature = async () => {
    setIsValidating(true);
    try {
      const res = await fetch(
        `/api/collections/${collection.collectionId}/validate`
      );
      const data = await res.json();
      setValidation(data);
    } catch (err) {
      setValidation({
        hashMatch: false,
        signatureValid: false,
        error: "Validation failed",
      });
    } finally {
      setIsValidating(false);
      setShowValidationModal(true);
    }
  };

  return (
    <>
      <div className="modal-backdrop">
        <div className="modal-inspection">

          <div className="inspection-left">
            <h3>Collection Inspection</h3>

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

            <hr />

            <button
              className="btn-secondary"
              onClick={validateFarmerSignature}
              disabled={isValidating}
            >
              {isValidating ? "Validating..." : "Validate Farmer Signature"}
            </button>
          </div>

          <div className="inspection-right">
            <button className="close-btn" onClick={onClose}>✕</button>

            <textarea
              placeholder="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            <button
              disabled={!result}
              onClick={() =>
                onSubmit({
                  collectionId: collection.collectionId,
                  result,
                  remarks,
                  assignedManufacturerId: manufacturerId,
                })
              }
            >
              Submit
            </button>
          </div>

        </div>
      </div>

      {showValidationModal && (
        <ValidationResultModal
          validation={validation}
          title="Farmer Signature Validation"
          onClose={() => setShowValidationModal(false)}
        />
      )}
    </>
  );
};

export default LabResultModal;
