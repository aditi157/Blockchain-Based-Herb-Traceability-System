import { useEffect, useState } from "react"

const ApprovedResults = () => {
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)

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

              <button className="ghost-btn">
                Validate Lab Signature
              </button>
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
