import React from "react";

const ValidationResultModal = ({ validation, title, onClose }) => {
  if (!validation) return null;

  const {
    storedHash,
    computedHash,
    hashMatch,
    signatureValid,
    error,
  } = validation;

  const isValid = hashMatch && signatureValid;

  return (
    <div className="modal-backdrop">
      <div className="validation-modal">

        <div className="validation-header">
          <h3>{title}</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="validation-body">

          <h2 style={{ color: isValid ? "green" : "red" }}>
            {isValid ? "✓ VALID SIGNATURE" : "✗ INVALID SIGNATURE"}
          </h2>

          {!isValid && (
            <p>
              Data integrity check failed — may have been altered
            </p>
          )}

          <div className="validation-row">
            <strong>Hash Match:</strong>{" "}
            {hashMatch ? "✓ Passed" : "✗ Failed"}
          </div>

          <div className="validation-row">
            <strong>Signature Valid:</strong>{" "}
            {signatureValid ? "✓ Passed" : "✗ Failed"}
          </div>

          <div className="validation-row">
            <strong>Stored Hash:</strong>
            <div className="hash-box">
              {storedHash || "N/A"}
            </div>
          </div>

          <div className="validation-row">
            <strong>Computed Hash:</strong>
            <div className="hash-box">
              {computedHash || "N/A"}
            </div>
          </div>

          {error && (
            <div style={{ color: "red", marginTop: "10px" }}>
              Error: {error}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ValidationResultModal;
