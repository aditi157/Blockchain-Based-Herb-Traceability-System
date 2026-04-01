import { useState, useEffect } from "react"
import VerifyView from "./VerifyView"

const SavedRecords = ({ setCurrentRecord }) => {
  const [records, setRecords] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem("savedRecords")
    setRecords(stored ? JSON.parse(stored) : [])
  }, [])

  return (
    <div className="records-section">
      <h2>Saved Records</h2>

      {records.length === 0 && (
        <p className="muted-text">No saved records yet.</p>
      )}

      <div className="cards-grid">
        {records.map((r, index) => (
          <div
            key={index}
            className="record-card"
            onClick={() => setSelected(r)}
          >
            <h3>{r.customName || "Untitled Record"}</h3>
            <p><strong>Batch:</strong> {r.data.batch.batchCode}</p>
            <p>
              <strong>Saved:</strong>{" "}
              {new Date(r.savedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {selected && (
        <VerifyView
          record={selected.data}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

export default SavedRecords
