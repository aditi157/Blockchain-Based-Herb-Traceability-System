import { useEffect, useState } from "react"
import {
  generateHash,
  verifySignature,
  buildCollectionCanonical
} from "../../utils/crypto"

const PastTests = () => {
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState("")
  const [validation, setValidation] = useState(null)
  const [validating, setValidating] = useState(false)

  const token = localStorage.getItem("token")

  const load = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/lab/results", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to fetch")
        return
      }

      setResults(data)
    } catch (err) {
      console.error(err)
      setError("Server error")
    }
  }

  useEffect(() => {
    load()
  }, [])

 const handleValidateFarmer = async () => {
  const c = selected?.collection

  if (!c || !c.farmer || !c.farmer.publicKey) {
    console.error("Missing validation data:", selected)
    return
  }

  setValidating(true)
  setValidation(null)

  try {
    // 🔴 BACKEND VALIDATION (DB integrity)
    const dbRes = await fetch(
      `http://localhost:5000/api/collections/${c.id}/validate`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    const dbData = await dbRes.json()

    // 🔵 FRONTEND VALIDATION (transit integrity)
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

    const allValid =
      dbData.valid &&
      hashMatch &&
      signatureValid

    setValidation({
      valid: allValid,

      // 🔴 BACKEND
      dbValid: dbData.dbValid,
      backendSignatureValid: dbData.signatureValid,

      // 🔵 FRONTEND
      hashMatch,
      signatureValid,

      // 📊 DATA
      storedHash: c.hash,
      computedHash,
      signer: c.farmer.orgCode,
      timestamp: c.canonicalTimestamp,

      reason: !dbData.valid
        ? "Database integrity failed"
        : !hashMatch
        ? "Transit hash mismatch"
        : !signatureValid
        ? "Signature invalid"
        : null
    })

  } catch (err) {
    console.error("Validation error:", err)
    setValidation({ valid: false })
  } finally {
    setValidating(false)
  }
}

  return (
    <div className="records-section">
      <h2>Past Tests</h2>

      {error && <p className="error-text">{error}</p>}

      {results.length === 0 && !error && (
        <p className="muted-text">No past lab results yet.</p>
      )}

      <table className="records-table">
        <thead>
          <tr>
            <th>Collection ID</th>
            <th>Herb</th>
            <th>Result</th>
            <th>Created At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id}>
              <td>{r.collectionId}</td>
              <td>{r.collection?.herbName}</td>
              <td>
                <span className={`pill ${r.result === "PASS" ? "pass active" : "fail active"}`}>
                  {r.result}
                </span>
              </td>
              <td>{new Date(r.createdAt).toLocaleString()}</td>
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

      {/* ✅ SAFE MODAL RENDER */}
      {selected?.collection && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div
            className="modal-inspection"
            onClick={(e) => e.stopPropagation()}
          >

            {/* LEFT */}
            <div className="inspection-left">
              <h3>Collection Inspection</h3>

              <div className="info-block">
                <label>Collection ID</label>
                <span>{selected.collectionId}</span>
              </div>

              <div className="info-block">
                <label>Herb</label>
                <span>{selected.collection?.herbName}</span>
              </div>

              <div className="info-block">
                <label>Quantity</label>
                <span>{selected.collection?.quantity} g</span>
              </div>

              <div className="info-block">
                <label>Farmer</label>
                <span>{selected.collection?.farmer?.name || "—"}</span>
              </div>

              <div className="info-block">
                <label>Farmer ID</label>
                <span>{selected.collection?.farmer?.orgCode || "—"}</span>
              </div>

              <div className="info-block">
                <label>Location</label>
                <span>{selected.collection?.location || "—"}</span>
              </div>

              <button
                className="ghost-btn"
                onClick={handleValidateFarmer}
                disabled={validating}
              >
                {validating ? "Validating..." : "Validate Farmer Signature"}
              </button>

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
              <div className="decision-header">
                <h3>Lab Result</h3>
                <button
                  className="close-btn"
                  onClick={() => setSelected(null)}
                >
                  ✕
                </button>
              </div>

              <div className="decision-toggle">
                <span className={`pill ${selected.result === "PASS" ? "pass active" : "fail active"}`}>
                  {selected.result}
                </span>
              </div>

              <div className="info-block">
                <label>Remarks</label>
                <span>{selected.remarks || "—"}</span>
              </div>

              <div className="info-block">
                <label>Assigned Manufacturer</label>
                <span>{selected.assignedMfg?.orgCode || "—"}</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default PastTests