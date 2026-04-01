import { useEffect, useState } from "react"

const MyCollections = () => {
  const [collections, setCollections] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:5000/api/collections/mine", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to fetch"); return }
      setCollections(data)
    } catch (err) {
      console.error(err)
      setError("Server error")
    }
  }

  // ✅ STATUS LOGIC
  const getStatus = (c) => {
  if (!c.assignedLabId) return "COLLECTED"

  if (!c.labResults || c.labResults.length === 0) {
    return "ASSIGNED"
  }

  return "TESTED"
}

  return (
    <div className="records-section">
      <h2>My Collections</h2>

      {error && <p className="error-text">{error}</p>}

      {collections.length === 0 && !error && (
        <p className="muted-text">No collections yet.</p>
      )}

      <table className="records-table">
        <thead>
          <tr>
            <th>Herb</th>
            <th>Quantity</th>
            <th>Assigned Lab</th>
            <th>Status</th> {/* ✅ NEW */}
            <th>Location</th>
            <th>Created At</th>
          </tr>
        </thead>

        <tbody>
          {collections.map((c) => (
            <tr
              key={c.id}
              onClick={() => setSelected(c)}
              style={{ cursor: "pointer" }}
            >
              <td>{c.herbName}</td>
              <td>{c.quantity} kg</td>
              <td>{c.assignedLabId || "—"}</td>

              {/* ✅ STATUS COLUMN */}
              <td>
                <span className={`pill ${
                  getStatus(c) === "TESTED"
                    ? "pass active"
                    : getStatus(c) === "ASSIGNED"
                    ? "pending active"
                    : "muted"
                }`}>
                  {getStatus(c)}
                </span>
              </td>

              <td>{c.location || "—"}</td>
              <td>{new Date(c.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL (unchanged) */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Collection Details</h2>

            <div className="modal-section">
              <h3>Basic Information</h3>
              <ul>
                <li><strong>Herb:</strong> {selected.herbName}</li>
                <li><strong>Quantity:</strong> {selected.quantity} kg</li>
                <li><strong>Assigned Lab:</strong> {selected.assignedLabId || "—"}</li>
                <li><strong>Status:</strong> {getStatus(selected)}</li>
                <li><strong>Location:</strong> {selected.location || "—"}</li>
                <li><strong>Created At:</strong> {new Date(selected.createdAt).toLocaleString()}</li>
              </ul>
            </div>

            <button className="modal-close" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyCollections