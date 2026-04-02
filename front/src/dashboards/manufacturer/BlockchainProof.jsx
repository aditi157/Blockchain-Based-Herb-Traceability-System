import { useEffect, useState } from "react"

const BlockchainProof = () => {
  const [batches, setBatches] = useState([])

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token")

      const res = await fetch("http://localhost:5000/api/manufacturer/batches", {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      setBatches(data)
    }

    load()
  }, [])

  return (
    <div className="records-section">
      <h2>Blockchain Proof</h2>

      {batches.map((b, i) => (
        <div key={b.id} className="block-card">
          <h3>Block #{i + 1}</h3>

          <div><strong>Batch:</strong> {b.batchCode}</div>
          <div><strong>Hash:</strong> {b.hash}</div>
          <div><strong>Timestamp:</strong> {b.canonicalTimestamp}</div>

          <div>
            <strong>Previous Hash:</strong>{" "}
            {i > 0 ? batches[i - 1].hash : "GENESIS"}
          </div>
        </div>
      ))}
    </div>
  )
}

export default BlockchainProof