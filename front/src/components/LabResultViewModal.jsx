import React, { useState } from "react";
import ValidationResultModal from "./ValidationResultModal";

const LabResultViewModal = ({ result, onClose }) => {
  const collection = result?.collection;

  const [validation, setValidation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  if (!result || !collection) return null;

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
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="modal-backdrop">
        <div className="modal-inspection">

          <div className="inspection-left">
            <h3>Collection Details</h3>

            <div className="info-block">
              <label>ID</label>
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
              onClick={validateFarmerSignature}
              disabled={isValidating}
            >
              {isValidating ? "Validating..." : "Validate Farmer Signature"}
            </button>
          </div>

        </div>
      </div>

      {showModal && (
        <ValidationResultModal
          validation={validation}
          title="Farmer Signature Validation"
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default LabResultViewModal;

