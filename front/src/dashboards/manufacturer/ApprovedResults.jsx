import { useEffect, useState } from "react"
import {
  generateHash,
  verifySignature,
  buildLabResultCanonical
} from "../../utils/crypto"

const ApprovedResults = () => {
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
const [labValidation, setLabValidation] = useState(null)
const [validatingLab, setValidatingLab] = useState(false)
  const [batchName, setBatchName] = useState("")
  const [herbUsedQuantity, setHerbUsedQuantity] = useState("")
  const [finalProductQuantity, setFinalProductQuantity] = useState("")
  const [expiryDate, setExpiryDate] = useState("")

  const token = localStorage.getItem("token")

  const load = async () => {
    const res = await fetch("http://localhost:5000/api/manufacturer/approved", {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setResults(data)
  }

  useEffect(() => { load() }, [])

  const handleValidateLab = async () => {
  const r = selected

  if (!r?.lab?.publicKey) {
    console.error("Missing lab data", r)
    return
  }

  setValidatingLab(true)
  //setLabValidation(null)


  try {
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

    setLabValidation({
  storedHash: r.hash,
  computedHash,
  hashMatch,
  signatureValid,
  signer: r.lab.orgCode,
  timestamp: r.canonicalTimestamp,
  valid: hashMatch && signatureValid
})

  } catch (err) {
    console.error("Lab validation error:", err)
    setLabValidation({ valid: false })
  } finally {
    setValidatingLab(false)
  }
}

  const handleCreateBatch = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/manufacturer/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          labResultId: selected.id,
          batchName,
          herbUsedQuantity: Number(herbUsedQuantity),
          finalProductQuantity: Number(finalProductQuantity),
          expiryDate
        })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "Failed to create batch")
        return
      }

      // Reset + close
      setSelected(null)
      setBatchName("")
      setHerbUsedQuantity("")
      setFinalProductQuantity("")
      setExpiryDate("")
      load()

    } catch (err) {
      console.error(err)
      alert("Server error")
    }
  }

  return (
    <div className="records-section">
      <h2>Approved Lab Results</h2>

      <table className="records-table">
        <thead>
          <tr>
            <th>Herb</th>
            <th>Farmer</th>
            <th>Lab</th>
            <th>Decision</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.id}>
              <td>{r.collection?.herbName}</td>
              <td>{r.collection?.farmer?.orgCode}</td>
              <td>{r.lab?.orgCode}</td>
              <td>{r.result}</td>
              <td>
                <button
                  className="btn-secondary"
                  onClick={() => setSelected(r)}
                >
                  Create Batch
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div
            className="modal-inspection"
            onClick={(e) => e.stopPropagation()}
          >

            {/* LEFT PANEL */}
            <div className="inspection-left">
              <h3>Lab Result Details</h3>

              <div className="info-block">
                <label>Herb</label>
                <span>{selected.collection?.herbName}</span>
              </div>

              <div className="info-block">
                <label>Original Quantity</label>
                <span>{selected.collection?.quantity} g</span>
              </div>

              <div className="info-block">
                <label>Farmer ID</label>
                <span>{selected.collection?.farmer?.orgCode}</span>
              </div>

              <div className="info-block">
                <label>Lab ID</label>
                <span>{selected.lab?.orgCode}</span>
              </div>

              <div className="info-block">
                <label>Result</label>
                <span>{selected.result}</span>
              </div>

              <div className="info-block">
                <label>Remarks</label>
                <span>{selected.remarks || "—"}</span>
              </div>

              <button
  className="ghost-btn"
  onClick={handleValidateLab}
  disabled={validatingLab}
>
  {validatingLab ? "Validating..." : "Validate Lab Signature"}
</button>

{labValidation && (
  <div className={`validation-panel ${labValidation.valid ? "success" : "fail"}`}>
  <h4>Verification Report</h4>
  

  <div className="validation-row">
    <label>Stored Hash</label>
    <details>
  <summary style={{ cursor: "pointer", color: "#16a34a" }}>
    Show Hash
  </summary>
  <code>{labValidation.storedHash}</code>
</details>
  </div>

  <div className="validation-row">
    <label>Recomputed Hash</label>
    <details>
  <summary style={{ cursor: "pointer", color: "#16a34a" }}>
    Show Hash
  </summary>
  <code>{labValidation.computedHash}</code>
</details>
  </div>

  <div className="validation-row">
    <label>Hash Integrity</label>
    <span className={labValidation.hashMatch ? "ok" : "fail"}>
      {labValidation.hashMatch ? "MATCH " : "MISMATCH "}
    </span>
  </div>

  <div className="validation-row">
    <label>Signature</label>
    <span className={labValidation.signatureValid ? "ok" : "fail"}>
      {labValidation.signatureValid
        ? "VALID (ECDSA P-256) "
        : "INVALID "}
    </span>
  </div>

  <div className="validation-row">
    <label>Signed By</label>
    <span>{labValidation.signer}</span>
  </div>

  <div className="validation-row">
    <label>Timestamp</label>
    <span>{labValidation.timestamp}</span>
  </div>

  <div className="validation-final">
    {labValidation.valid
      ? "Record Verified & Untampered"
      : "Integrity Compromised"}
  </div>
</div>
)}
            </div>

            {/* RIGHT PANEL */}
            <div className="inspection-right">

              <div className="decision-header">
                <h3>Create Manufacturing Batch</h3>
                <button
                  className="close-btn"
                  onClick={() => setSelected(null)}
                >
                  ✕
                </button>
              </div>

              <input
                type="text"
                placeholder="Batch Name"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
              />

              <input
                type="number"
                placeholder="Herb Used (grams)"
                value={herbUsedQuantity}
                onChange={(e) => setHerbUsedQuantity(e.target.value)}
              />

              <input
                type="number"
                placeholder="Final Product Quantity (grams)"
                value={finalProductQuantity}
                onChange={(e) => setFinalProductQuantity(e.target.value)}
              />

              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />

              <button
                className="submit-btn"
                disabled={
                  !batchName ||
                  !herbUsedQuantity ||
                  !finalProductQuantity ||
                  !expiryDate
                }
                onClick={handleCreateBatch}
              >
                Create Batch
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApprovedResults
