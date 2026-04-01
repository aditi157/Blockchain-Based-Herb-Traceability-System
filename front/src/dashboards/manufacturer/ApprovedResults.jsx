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

  // 🔥 RESET STATE WHEN NEW RECORD SELECTED
  const handleSelect = (r) => {
    setSelected(r)
    setLabValidation(null)
    setBatchName("")
    setHerbUsedQuantity("")
    setFinalProductQuantity("")
    setExpiryDate("")
  }

  const handleValidateLab = async () => {
    const r = selected

    if (!r?.lab?.publicKey) {
      console.error("Missing lab data", r)
      return
    }

    setValidatingLab(true)
    setLabValidation(null)

    try {
      const dbRes = await fetch(
        `http://localhost:5000/api/lab/${r.id}/validate`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      const dbData = await dbRes.json()

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

      setLabValidation({
        valid: allValid,
        dbValid: dbData.dbValid,
        backendSignatureValid: dbData.signatureValid,
        hashMatch,
        signatureValid,
        storedHash: r.hash,
        computedHash,
        signer: r.lab.orgCode,
        timestamp: r.canonicalTimestamp
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

      // 🔥 reload + close
      setSelected(null)
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
            <th>Remaining</th> {/* ✅ FIXED POSITION */}
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

              {/* ✅ CORRECT COLUMN */}
              <td>{r.remainingQuantity} g</td>

              <td>
                <button
                  className="btn-secondary"
                  onClick={() => handleSelect(r)}
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

            {/* LEFT */}
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
                <label>Remaining Quantity</label>
                <span>{selected.remainingQuantity} g</span>
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
                    <code>{labValidation.storedHash}</code>
                  </div>

                  <div className="validation-row">
                    <label>Recomputed Hash</label>
                    <code>{labValidation.computedHash}</code>
                  </div>

                  <div className="validation-row">
                    <label>DB Integrity</label>
                    <span className={labValidation.dbValid ? "ok" : "fail"}>
                      {labValidation.dbValid ? "VALID ✔" : "INVALID ✖"}
                    </span>
                  </div>

                  <div className="validation-row">
                    <label>Transit Hash</label>
                    <span className={labValidation.hashMatch ? "ok" : "fail"}>
                      {labValidation.hashMatch ? "MATCH ✔" : "MISMATCH ✖"}
                    </span>
                  </div>

                  <div className="validation-row">
                    <label>Signature</label>
                    <span className={labValidation.signatureValid ? "ok" : "fail"}>
                      {labValidation.signatureValid ? "VALID ✔" : "INVALID ✖"}
                    </span>
                  </div>

                  <div className="validation-final">
                    {labValidation.valid
                      ? "Record Verified & Untampered"
                      : "Integrity Compromised"}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT */}
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

              {Number(herbUsedQuantity) > selected.remainingQuantity && (
                <p style={{ color: "red", fontSize: "12px" }}>
                  Exceeds available quantity
                </p>
              )}

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
                  Number(herbUsedQuantity) > selected.remainingQuantity ||
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