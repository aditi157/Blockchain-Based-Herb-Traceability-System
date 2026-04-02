const AuditTrail = ({ batches }) => {
  return (
    <div className="records-section">
      <h2>Audit Trail</h2>

      {batches.map((b) => (
        <div key={b.id} className="timeline-card">
          <h3>{b.batchCode}</h3>

          <ul>
            <li>🌿 Farmer collected herb</li>
            <li>🧪 Lab tested → PASS</li>
            <li>🏭 Batch created</li>
            <li>🔐 Hash generated</li>
            <li>📦 QR issued</li>
          </ul>
        </div>
      ))}
    </div>
  )
}

export default AuditTrail