import { useEffect, useState } from "react"
import {
  generateHash,
  verifySignature,
  buildCollectionCanonical,
  buildLabResultCanonical
} from "../../utils/crypto"

function LabResults() {
  const [results, setResults] = useState([])
  const [error, setError] = useState("")
  const [selected, setSelected] = useState(null)
  const [validation, setValidation] = useState(null)
  const [validating, setValidating] = useState(false)

  const token = localStorage.getItem("token")

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/lab/farmer",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()

        if (response.ok) {
          setResults(data)
        } else {
          setError(data.message || "Failed to fetch lab results")
        }
      } catch {
        setError("Server error")
      }
    }

    fetchResults()
  }, [])

  // ✅ VALIDATION FUNCTION (FULL SYSTEM)
  const handleValidate = async () => {
  const r = selected

  if (!r || !r.lab || !r.lab.publicKey) {
    console.error("Missing lab data:", r)
    return
  }

  setValidating(true)
  setValidation(null)

  try {
    // 🔴 BACKEND VALIDATION (LAB)
    const dbRes = await fetch(
      `http://localhost:5000/api/lab/${r.id}/validate`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    const dbData = await dbRes.json()

    // 🔵 FRONTEND VALIDATION (LAB RESULT)
    const canonical = buildLabResultCanonical({
      labResultId: r.id,
      collectionId: r.collectionId,
      labCode: r.lab.orgCode,
      result: r.result,
      remarks: r.remarks,
      assignedMfgId: r.assignedMfgId,
      timestamp: r.canonicalTimestamp
    })

    const computedHash = await generateHash(canonical)
    const hashMatch = computedHash === r.hash

    let signatureValid = false
    if (hashMatch) {
      signatureValid = await verifySignature(
        r.lab.publicKey,
        canonical,
        r.signature
      )
    }

    const allValid =
      dbData.valid &&
      hashMatch &&
      signatureValid

    setValidation({
      valid: allValid,

      // backend
      dbValid: dbData.dbValid,
      backendSignatureValid: dbData.signatureValid,

      // frontend
      hashMatch,
      signatureValid,

      // data
      storedHash: r.hash,
      computedHash,
      signer: r.lab.orgCode,
      timestamp: r.canonicalTimestamp
    })

  } catch (err) {
    console.error(err)
    setValidation({ valid: false })
  } finally {
    setValidating(false)
  }
}

  return (
    <div className="records-section">
      <h2>Lab Results</h2>

      {error && <p className="error-text">{error}</p>}

      <table className="records-table">
        <thead>
          <tr>
            <th>Collection ID</th>
            <th>Result</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id}>
              <td>{r.collectionId}</td>
              <td>{r.result}</td>
              <td>{r.status}</td>
              <td>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSelected(r)
                    setValidation(null)
                  }}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL */}
      {selected?.collection && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div
            className="modal-inspection"
            onClick={(e) => e.stopPropagation()}
          >

            {/* LEFT */}
            <div className="inspection-left">
              <h3>Collection Details</h3>

              <div className="info-block">
                <label>Herb</label>
                <span>{selected.collection.herbName}</span>
              </div>

              <div className="info-block">
                <label>Quantity</label>
                <span>{selected.collection.quantity} g</span>
              </div>

              <div className="info-block">
                <label>Farmer</label>
                <span>{selected.collection.farmer?.orgCode}</span>
              </div>

              <div className="info-block">
                <label>Location</label>
                <span>{selected.collection.location || "—"}</span>
              </div>

              <button
                className="btn-secondary"
                onClick={handleValidate}
                disabled={validating}
              >
                {validating ? "Validating..." : "Validate Lab Signature"}
              </button>

              {/* VALIDATION PANEL */}
              {validation && (
                <div className={`validation-panel ${validation.valid ? "success" : "fail"}`}>

                  <h4>Verification Report</h4>

                  <div className="validation-row">
                    <label>Stored Hash</label>
                    <details>
                      <summary style={{ cursor: "pointer", color: "#16a34a" }}>
                        Show Hash
                      </summary>
                      <code>{validation.storedHash}</code>
                    </details>
                  </div>

                  <div className="validation-row">
                    <label>Recomputed Hash</label>
                    <details>
                      <summary style={{ cursor: "pointer", color: "#16a34a" }}>
                        Show Hash
                      </summary>
                      <code>{validation.computedHash}</code>
                    </details>
                  </div>

                  <div className="validation-row">
                    <label>DB Integrity</label>
                    <span className={validation.dbValid ? "ok" : "fail"}>
                      {validation.dbValid ? "VALID " : "INVALID "}
                    </span>
                  </div>

                  <div className="validation-row">
                    <label>Backend Signature</label>
                    <span className={validation.backendSignatureValid ? "ok" : "fail"}>
                      {validation.backendSignatureValid ? "VALID " : "INVALID "}
                    </span>
                  </div>

                  <div className="validation-row">
                    <label>Transit Hash</label>
                    <span className={validation.hashMatch ? "ok" : "fail"}>
                      {validation.hashMatch ? "MATCH " : "MISMATCH "}
                    </span>
                  </div>

                  <div className="validation-row">
                    <label>Transit Signature</label>
                    <span className={validation.signatureValid ? "ok" : "fail"}>
                      {validation.signatureValid ? "VALID " : "INVALID "}
                    </span>
                  </div>

                  <div className="validation-row">
                    <label>Signed By</label>
                    <span>{validation.signer}</span>
                  </div>

                  <div className="validation-row">
                    <label>Timestamp</label>
                    <span>{validation.timestamp}</span>
                  </div>

                  <div className="validation-final">
                    {validation.valid
                      ? "Record Verified & Untampered"
                      : "Integrity Compromised"}
                  </div>

                </div>
              )}

            </div>

            {/* RIGHT */}
            <div className="inspection-right">
              <h3>Lab Result</h3>

              <div className="info-block">
                <label>Result</label>
                <span>{selected.result}</span>
              </div>

              <div className="info-block">
                <label>Status</label>
                <span>{selected.status}</span>
              </div>

              <div className="info-block">
                <label>Remarks</label>
                <span>{selected.remarks || "—"}</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default LabResults