import { useEffect, useState } from "react"

const ManufacturingRecords = () => {
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [error, setError] = useState("")

  const token = localStorage.getItem("token")

  const load = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/manufacturer/batches",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to fetch")
        return
      }

      setBatches(data)

    } catch (err) {
      console.error(err)
      setError("Server error")
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="records-section">
      <h2>Manufacturing Records</h2>

      {error && <p className="error-text">{error}</p>}

      {batches.length === 0 && !error && (
        <p className="muted-text">No batches created yet.</p>
      )}

      <table className="records-table">
        <thead>
          <tr>
            <th>Batch Code</th>
            <th>Batch Name</th>
            <th>Herb</th>
            <th>Final Qty (g)</th>
            <th>Expiry</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((b) => (
            <tr key={b.id}>
              <td>{b.batchCode}</td>
              <td>{b.batchName}</td>
              <td>{b.labResult.collection.herbName}</td>
              <td>{b.finalProductQuantity} g</td>
              <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
              <td>
                <button
                  className="btn-secondary"
                  onClick={() => setSelectedBatch(b)}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedBatch && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedBatch(null)}
        >
          <div
            className="modal-inspection"
            onClick={(e) => e.stopPropagation()}
          >

            {/* LEFT SIDE — FARM + LAB */}
            <div className="inspection-left">
              <h3>Upstream Trace</h3>

              <div className="info-block">
                <label>Herb</label>
                <span>{selectedBatch.labResult.collection.herbName}</span>
              </div>

              <div className="info-block">
                <label>Farmer</label>
                <span>{selectedBatch.labResult.collection.farmer.name}</span>
              </div>

              <div className="info-block">
                <label>Farmer ID</label>
                <span>{selectedBatch.labResult.collection.farmer.orgCode}</span>
              </div>

              <div className="info-block">
                <label>Original Quantity</label>
                <span>{selectedBatch.labResult.collection.quantity} g</span>
              </div>

              <div className="info-block">
                <label>Lab</label>
                <span>{selectedBatch.labResult.lab.name}</span>
              </div>

              <div className="info-block">
                <label>Lab ID</label>
                <span>{selectedBatch.labResult.lab.orgCode}</span>
              </div>

              <div className="info-block">
                <label>Lab Result</label>
                <span>{selectedBatch.labResult.result}</span>
              </div>

              <div className="info-block">
                <label>Remarks</label>
                <span>{selectedBatch.labResult.remarks || "—"}</span>
              </div>
            </div>

            {/* RIGHT SIDE — BATCH INFO */}
            <div className="inspection-right">

              <div className="decision-header">
                <h3>Batch Details</h3>
                <button
                  className="close-btn"
                  onClick={() => setSelectedBatch(null)}
                >
                  ✕
                </button>
              </div>

              <div className="info-block">
                <label>Batch Code</label>
                <span>{selectedBatch.batchCode}</span>
              </div>

              <div className="info-block">
                <label>Batch Name</label>
                <span>{selectedBatch.batchName}</span>
              </div>

              <div className="info-block">
                <label>Herb Used</label>
                <span>{selectedBatch.herbUsedQuantity} g</span>
              </div>

              <div className="info-block">
                <label>Final Product Quantity</label>
                <span>{selectedBatch.finalProductQuantity} g</span>
              </div>

              <div className="info-block">
                <label>Expiry Date</label>
                <span>
                  {new Date(selectedBatch.expiryDate).toLocaleDateString()}
                </span>
              </div>

              <div className="info-block">
                <label>Created At</label>
                <span>
                  {new Date(selectedBatch.createdAt).toLocaleString()}
                </span>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManufacturingRecords
