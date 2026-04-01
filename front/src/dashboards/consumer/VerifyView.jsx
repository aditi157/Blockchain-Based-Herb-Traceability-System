const VerifyView = ({ record, onClose }) => {
  if (!record) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}>✕</button>

        <h2>Complete Batch Trace</h2>

        <div className="trace-container">

          {/* COLLECTION */}
          <div className="trace-card">
            <h3>Collection Details</h3>
            <p><strong>Herb:</strong> {record.collection.herbName}</p>
            <p><strong>Quantity:</strong> {record.collection.quantity} kg</p>
            <p><strong>Farmer:</strong> {record.collection.farmer?.orgCode}</p>
            <p><strong>Location:</strong> {record.collection.location}</p>
          </div>

          {/* LAB */}
          <div className="trace-card">
            <h3>Lab Result</h3>
            <p><strong>Lab:</strong> {record.lab.lab?.orgCode}</p>
            <p>
              <strong>Result:</strong>{" "}
              <span className={`pill ${record.lab.result.toLowerCase()}`}>
                {record.lab.result}
              </span>
            </p>
            <p><strong>Remarks:</strong> {record.lab.remarks}</p>
          </div>

          {/* MANUFACTURING */}
          <div className="trace-card">
            <h3>Manufacturing</h3>
            <p><strong>Batch:</strong> {record.batch.batchCode}</p>
            <p><strong>Product:</strong> {record.batch.productName}</p>
            <p><strong>Manufacturer:</strong> {record.batch.manufacturer?.orgCode}</p>
            <p>
              <strong>Expiry:</strong>{" "}
              {new Date(record.batch.expiryDate).toLocaleDateString()}
            </p>
          </div>

        </div>

      </div>
    </div>
  )
}

export default VerifyView
