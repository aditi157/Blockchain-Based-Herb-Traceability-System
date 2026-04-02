import { useEffect, useState } from "react"
import {
  generateHash,
  verifySignature,
  buildCollectionCanonical
} from "../../utils/crypto"

const AssignedCollections = () => {
  const [collections, setCollections] = useState([])
  const [error, setError] = useState("")
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [decision, setDecision] = useState(null)
  const [remarks, setRemarks] = useState("")
  const [assignedMfg, setAssignedMfg] = useState("")
  const [validationResult, setValidationResult] = useState(null)
  const [validating, setValidating] = useState(false)

  const token = localStorage.getItem("token")

  const load = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/collections/assigned", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to fetch"); return }
      setCollections(data)
    } catch (err) {
      console.error(err)
      setError("Server error")
    }
  }

  useEffect(() => { load() }, [])

  const handleValidateFarmer = async () => {
    setValidating(true)
    setValidationResult(null)

    try {
      const c = selectedCollection

      // ── Backend check: validates against actual DB field values ──
      const dbRes = await fetch(
        `http://localhost:5000/api/collections/${c.id}/validate`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const dbData = await dbRes.json()

      // ── Frontend (transit) check: validates fields as received from API ──
      // If anything was altered between the server and this browser, this will catch it.
      const canonical = buildCollectionCanonical({
        collectionId:  c.id,
        herbName:      c.herbName,
        quantity:      c.quantity,
        farmerCode:    c.farmer.orgCode,
        assignedLabId: c.assignedLabId,
        location:      c.location,
        timestamp:     c.canonicalTimestamp
      })

      const computedHash = await generateHash(canonical)
      const transitHashMatch = computedHash === c.hash

      let transitSigValid = false
      if (transitHashMatch) {
        transitSigValid = await verifySignature(c.farmer.publicKey, canonical, c.signature)
      }

      const allValid =
        dbData.valid &&
        transitHashMatch &&
        transitSigValid

      setValidationResult({
  valid: allValid,
  dbValid: dbData.valid,
  dbReason: dbData.reason,
  transitHashMatch,
  transitSigValid,

  // ✅ ADD THESE (THIS IS THE FIX)
  storedHash: c.hash,
  computedHash,
  signer: c.farmer.orgCode,
  timestamp: c.canonicalTimestamp,

  reason: !dbData.valid
    ? dbData.reason
    : !transitHashMatch
    ? "Hash mismatch in transit — data may have been altered"
    : !transitSigValid
    ? "Signature invalid in transit"
    : null
})

console.log("DB Result:", dbData)
console.log("Transit Hash Match:", transitHashMatch)
console.log("Transit Signature Valid:", transitSigValid)
      

    } catch (err) {
      console.error(err)
      setValidationResult({ valid: false, reason: "Server error during validation" })
    } finally {
      setValidating(false)
    }
  }

  const handleSubmitLabResult = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/lab/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          collectionId: selectedCollection.id,
          result: decision,
          remarks,
          assignedMfgId: assignedMfg
        })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "Failed to submit result")
        return
      }

      setSelectedCollection(null)
      load()

    } catch (err) {
      console.error(err)
      alert("Server error")
    }
  }

  return (
    <div className="records-section">
      <h2>Incoming Samples</h2>

      {error && <p className="error-text">{error}</p>}

      {collections.length === 0 && !error && (
        <p className="muted-text">No collections assigned to your lab yet.</p>
      )}

      <table className="records-table">
        <thead>
          <tr>
            <th>Herb</th>
            <th>Quantity</th>
            <th>Farmer ID</th>
            <th>Assigned Lab</th>
            <th>Location</th>
            <th>Created At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {collections.map((c) => (
            <tr key={c.id}>
              <td>{c.herbName}</td>
              <td>{c.quantity} g</td>
              <td>{c.farmer?.orgCode || "—"}</td>
              <td>{c.assignedLabId || "—"}</td>
              <td>{c.location || "—"}</td>
              <td>{new Date(c.createdAt).toLocaleString()}</td>
              <td>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSelectedCollection(c)
                    setDecision(null)
                    setRemarks("")
                    setAssignedMfg("")
                    setValidationResult(null)
                  }}
                >
                  Add Result
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedCollection && (
        <div className="modal-backdrop" onClick={() => setSelectedCollection(null)}>
          <div className="modal-inspection" onClick={(e) => e.stopPropagation()}>

            {/* LEFT PANEL */}
            <div className="inspection-left">
              <h3>Collection Inspection</h3>

              <div className="info-block">
                <label>Collection ID</label>
                <span>{selectedCollection.id}</span>
              </div>
              <div className="info-block">
                <label>Herb</label>
                <span>{selectedCollection.herbName}</span>
              </div>
              <div className="info-block">
                <label>Quantity</label>
                <span>{selectedCollection.quantity} g</span>
              </div>
              <div className="info-block">
                <label>Farmer</label>
                <span>{selectedCollection.farmer?.name}</span>
              </div>
              <div className="info-block">
                <label>Farmer ID</label>
                <span>{selectedCollection.farmer?.orgCode}</span>
              </div>
              <div className="info-block">
                <label>Assigned Lab</label>
                <span>{selectedCollection.assignedLabId}</span>
              </div>
              <div className="info-block">
                <label>Created At</label>
                <span>{new Date(selectedCollection.createdAt).toLocaleString()}</span>
              </div>

              <button
                className="btn-secondary"
                style={{ width: "100%", marginTop: "12px" }}
                onClick={handleValidateFarmer}
                disabled={validating}
              >
                {validating ? "Validating..." : "Validate Farmer Signature"}
              </button>

              {validationResult && (
                <div className={`validation-panel ${validationResult.valid ? "success" : "fail"}`}>

  <h4>Verification Report</h4>

  <div className="validation-row">
    <label>Stored Hash</label>
    <details>
  <summary style={{ cursor: "pointer", color: "#16a34a" }}>
    Show Hash
  </summary>
  <code>{validationResult.storedHash}</code>
</details>
  </div>

  <div className="validation-row">
    <label>Recomputed Hash</label>
    <details>
  <summary style={{ cursor: "pointer", color: "#16a34a" }}>
    Show Hash
  </summary>
  <code>{validationResult.computedHash}</code>
</details>
  </div>

  <div className="validation-row">
    <label>DB Integrity</label>
    <span className={validationResult.dbValid ? "ok" : "fail"}>
      {validationResult.dbValid ? "VALID " : "INVALID "}
    </span>
  </div>

  <div className="validation-row">
    <label>Transit Hash</label>
    <span className={validationResult.transitHashMatch ? "ok" : "fail"}>
      {validationResult.transitHashMatch ? "MATCH " : "MISMATCH "}
    </span>
  </div>

  <div className="validation-row">
    <label>Transit Signature</label>
    <span className={validationResult.transitSigValid ? "ok" : "fail"}>
      {validationResult.transitSigValid ? "VALID " : "INVALID "}
    </span>
  </div>

  <div className="validation-row">
    <label>Signed By</label>
    <span>{validationResult.signer}</span>
  </div>

  <div className="validation-row">
    <label>Timestamp</label>
    <span>{validationResult.timestamp}</span>
  </div>

  <div className="validation-final">
    {validationResult.valid
      ? "Record Verified & Untampered"
      : "Integrity Compromised"}
  </div>

  

</div>
              )}
            </div>

            {/* RIGHT PANEL */}
            <div className="inspection-right">
              <div className="decision-header">
                <h3>Lab Decision</h3>
                <button className="close-btn" onClick={() => setSelectedCollection(null)}>✕</button>
              </div>

              <div className="decision-toggle">
                <button
                  className={`pill pass ${decision === "PASS" ? "active" : ""}`}
                  onClick={() => setDecision("PASS")}
                >
                  PASS
                </button>
                <button
                  className={`pill fail ${decision === "FAIL" ? "active" : ""}`}
                  onClick={() => setDecision("FAIL")}
                >
                  FAIL
                </button>
              </div>

              <textarea
                placeholder="Remarks (optional)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />

              <input
                type="text"
                placeholder="Assign Manufacturer ID (optional)"
                value={assignedMfg}
                onChange={(e) => setAssignedMfg(e.target.value)}
              />

              <button
                className="submit-btn"
                disabled={!decision}
                onClick={handleSubmitLabResult}
              >
                Submit Lab Result
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default AssignedCollections