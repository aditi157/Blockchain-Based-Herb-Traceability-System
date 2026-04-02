import { useEffect, useState } from "react"

const Certificates = () => {
  const [results, setResults] = useState([])

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token")

      const res = await fetch("http://localhost:5000/api/lab/results", {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      setResults(data)
    }

    load()
  }, [])

  const downloadCertificate = (r) => {
    const content = `
Lab Certificate

Herb: ${r.collection.herbName}
Result: ${r.result}
Lab: ${r.lab.name}
Timestamp: ${r.canonicalTimestamp}
    `

    const blob = new Blob([content], { type: "text/plain" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `Certificate_${r.id}.txt`
    link.click()
  }

  return (
    <div className="records-section">
      <h2>Issued Certificates</h2>

      {results.map((r) => (
        <div key={r.id} className="certificate-card">
          <h3>{r.collection.herbName}</h3>
          <p>Result: {r.result}</p>

          <button onClick={() => downloadCertificate(r)}>
            Download Certificate
          </button>
        </div>
      ))}
    </div>
  )
}

export default Certificates