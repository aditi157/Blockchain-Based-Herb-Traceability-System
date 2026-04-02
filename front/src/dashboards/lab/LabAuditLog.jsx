const LabAuditLog = ({ results }) => {
  return (
    <div className="records-section">
      <h2>Audit Log</h2>

      {results.map((r) => (
        <div key={r.id} className="timeline-card">
          <h3>{r.id}</h3>

          <ul>
            <li>📥 Sample received</li>
            <li>🧪 Tested</li>
            <li>✍️ Result signed</li>
            <li>📤 Sent to manufacturer</li>
          </ul>
        </div>
      ))}
    </div>
  )
}

export default LabAuditLog