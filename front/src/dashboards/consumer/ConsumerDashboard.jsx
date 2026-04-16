import { useState } from "react"
import { useEffect } from "react"
import Sidebar from "../../components/Sidebar"
import SavedRecords from "./SavedRecords"
import {
  generateHash,
  verifySignature,
  buildCollectionCanonical,
  buildLabResultCanonical,
  buildManufacturingCanonical
} from "../../utils/crypto"
import jsQR from "jsqr"



const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState("verify")
  const [batchCode, setBatchCode] = useState("")
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  const [validating, setValidating] = useState("")
  const [validationResults, setValidationResults] = useState({})
  const [tamperTransit, setTamperTransit] = useState(false)


  const handleQRUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      const code = jsQR(imageData.data, canvas.width, canvas.height)

      if (code) {
        const scannedBatchCode = code.data

        // ✅ SET STATE
        setBatchCode(scannedBatchCode)

        // ✅ AUTO FETCH (important)
        fetchBatchWithCode(scannedBatchCode)
      } else {
        alert("QR not detected")
      }
    }
  }


  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("organization")
    window.location.href = "/login"
  }

  const [savedRecords, setSavedRecords] = useState(() => {
    const stored = localStorage.getItem("savedRecords")
    return stored ? JSON.parse(stored) : []
  })

  const handleSaveRecord = () => {
    if (!data) return
    const recordName = prompt("Enter a name for this record:")
    if (!recordName) return
    const newRecord = {
      id: Date.now(),
      name: recordName,
      batchCode: data.batchCode,
      dateSaved: new Date().toISOString(),
      data
    }
    const updated = [...savedRecords, newRecord]
    setSavedRecords(updated)
    localStorage.setItem("savedRecords", JSON.stringify(updated))
    alert("Record saved successfully!")
  }

  // const fetchBatch = async () => {
  //   try {
  //     setError("")
  //     setData(null)
  //     setValidationResults({})

  //     const res = await fetch(`http://localhost:5000/api/customer/batch/${batchCode}`)
  //     const result = await res.json()

  //     if (!res.ok) {
  //       setError(result.error || "Batch not found")
  //       return
  //     }

  //     setData(result)
  //   } catch (err) {
  //     console.error(err)
  //     setError("Server error")
  //   }
  // }




const fetchBatchWithCode = async (code) => {
  try {
    setError("")
    setData(null)
    setValidationResults({})

    const res = await fetch(`http://localhost:5000/api/customer/batch/${code}`)
    const result = await res.json()

    if (!res.ok) {
      setError(result.error || "Batch not found")
      return
    }

    setData(result)
  } catch (err) {
    console.error(err)
    setError("Server error")
  }
}

const fetchBatch = async () => fetchBatchWithCode(batchCode)


  // ✅ FIXED VARIABLE MAPPING
  const batch = data
  const lab = data?.labResult
  const collection = lab?.collection
  const farmer = collection?.farmer
  const manufacturer = data?.manufacturer

  // ================= FRONTEND VALIDATION =================

  const validateFarmerFrontend = async () => {
    if (!collection || !farmer) return { hashMatch: false, signatureValid: false }

    const canonical = buildCollectionCanonical({
      collectionId:  collection.id,
      herbName:      collection.herbName,
      quantity:      collection.quantity,
      farmerCode:    farmer.orgCode,
      assignedLabId: collection.assignedLabId,
      location:      collection.location,
      timestamp:     collection.canonicalTimestamp
    })

    const computedHash = await generateHash(canonical)
    const hashMatch = computedHash === collection.hash

    let signatureValid = false
    if (hashMatch) {
      signatureValid = await verifySignature(farmer.publicKey, canonical, collection.signature)
    }

    return { hashMatch, signatureValid }
  }

  const validateLabFrontend = async () => {
    if (!lab) return { hashMatch: false, signatureValid: false }

    const canonical = buildLabResultCanonical({
      labResultId:   lab.id,
      collectionId:  lab.collectionId,
      labCode:       lab.lab?.orgCode,
      result:        lab.result,
      remarks:       lab.remarks,
      assignedMfgId: lab.assignedMfgId,
      timestamp:     lab.canonicalTimestamp
    })

    const computedHash = await generateHash(canonical)
    const hashMatch = computedHash === lab.hash

    let signatureValid = false
    if (hashMatch) {
      signatureValid = await verifySignature(lab.lab?.publicKey, canonical, lab.signature)
    }

    return { hashMatch, signatureValid }
  }

  const validateManufacturerFrontend = async () => {
    if (!batch || !manufacturer) return { hashMatch: false, signatureValid: false }

    const canonical = buildManufacturingCanonical({
      batchId:              batch.id,
      batchName:            batch.batchName,
      labResultId:          batch.labResultId,
      manufacturerId:       batch.manufacturerId,
      herbUsedQuantity:     String(batch.herbUsedQuantity),
      finalProductQuantity: String(batch.finalProductQuantity),
      expiryDate:           new Date(batch.expiryDate).toISOString(),
      timestamp:            batch.canonicalTimestamp
    })

    const computedHash = await generateHash(canonical)
    const hashMatch = computedHash === batch.hash

    let signatureValid = false
    if (hashMatch) {
      signatureValid = await verifySignature(manufacturer.publicKey, canonical, batch.signature)
    }

    return { hashMatch, signatureValid }
  }

  // ================= VALIDATION =================

  const runValidation = async (actor) => {
    setValidating(actor)

    try {
      const endpointMap = {
        Farmer: "validate-farmer",
        Lab: "validate-lab",
        Manufacturer: "validate-manufacturer"
      }

      const dbRes = await fetch(
        `http://localhost:5000/api/customer/${endpointMap[actor]}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchCode })
        }
      )

      let dbResult = {}

const contentType = dbRes.headers.get("content-type")

if (contentType && contentType.includes("application/json")) {
  dbResult = await dbRes.json()
} else {
  const text = await dbRes.text()

  console.error("Non-JSON response:", text)

  dbResult = {
    error: "Server did not return JSON",
    raw: text
  }
}

      const frontendMap = {
        Farmer: validateFarmerFrontend,
        Lab: validateLabFrontend,
        Manufacturer: validateManufacturerFrontend
      }

      const transitResult = await frontendMap[actor]()

      setValidationResults(prev => ({
        ...prev,
        [actor]: {
          db: dbResult,
          transit: transitResult
        }
      }))

    } catch (err) {
      console.error(err)
    } finally {
      setValidating("")
    }
  }

  // const ValidationBadge = ({ label, result }) => {
  //   if (!result) return null

  //   const dbOk = result.db?.hashMatch && result.db?.signatureValid
  //   const transitOk = result.transit?.hashMatch && result.transit?.signatureValid

  //   return (
  //     <div style={{ marginTop: "10px", fontSize: "13px", background: "#f8f9fa", padding: "10px", borderRadius: "8px" }}>
  //       <strong>{label}</strong>

  //       <div>
  //         DB: Hash {result.db?.hashMatch ? "✓" : "✗"} · Sig {result.db?.signatureValid ? "✓" : "✗"}
  //       </div>

  //       <div>
  //         Transit: Hash {result.transit?.hashMatch ? "✓" : "✗"} · Sig {result.transit?.signatureValid ? "✓" : "✗"}
  //       </div>

  //       <div style={{ fontWeight: "bold", color: dbOk && transitOk ? "green" : "red" }}>
  //         {dbOk && transitOk ? " Verified" : "Failed"}
  //       </div>
  //     </div>
  //   )
  // }

//   const ValidationBadge = ({ label, result }) => {
//   if (!result) return null

//   const db = result.db || {}
//   const transit = result.transit || {}

//   const dbOk = db.hashMatch && db.signatureValid
//   const panelClass = `validation-panel ${dbOk ? "success" : "fail"}`

//   return (
//     <div className={panelClass}>
//       <h4>{label} Verification</h4>

//       {/* STORED HASH */}
//       <div className="validation-row">
//         <label>Stored Hash</label>
//         <code>{db.storedHash || "—"}</code>
//       </div>

//       {/* RECOMPUTED HASH */}
//       <div className="validation-row">
//         <label>Recomputed Hash</label>
//         <code>{db.computedHash || "—"}</code>
//       </div>

//       {/* HASH MATCH */}
//       <div className="validation-row">
//         <label>DB Integrity</label>
//         <span className={db.hashMatch ? "ok" : "fail"}>
//           {db.hashMatch ? "MATCH " : "MISMATCH "}
//         </span>
//       </div>

//       {/* SIGNATURE */}
//       <div className="validation-row">
//         <label>Signature</label>
//         <span className={db.signatureValid ? "ok" : "fail"}>
//           {db.signatureValid ? "VALID (ECDSA P-256) " : "INVALID "}
//         </span>
//       </div>

//       {/* SIGNER */}
//       <div className="validation-row">
//   <label>Signed By</label>
//   <span>{label}</span>
// </div>

//       {/* FINAL */}
//       <div className="validation-final">
//         {dbOk
//           ? " Record Verified & Untampered"
//           : "Integrity Compromised"}
//       </div>
//     </div>
//   )
// }


// const ValidationBadge = ({ label, result }) => {
//   if (!result) return null

//   const db = result.db || {}
//   const dbOk = db.hashMatch && db.signatureValid && db.blockchainValid

//   return (
//     <div className={`validation-panel ${dbOk ? "success" : "fail"}`}>
//       <h4>{label} Verification</h4>

//       <div className="validation-row">
//         <label>Stored Hash</label>
//         <code>{db.storedHash || "—"}</code>
//       </div>

//       <div className="validation-row">
//         <label>Recomputed Hash</label>
//         <code>{db.computedHash || "—"}</code>
//       </div>

//       <div className="validation-row">
//         <label>DB Integrity</label>
//         <span className={db.hashMatch ? "ok" : "fail"}>
//           {db.hashMatch ? "MATCH " : "MISMATCH "}
//         </span>
//       </div>

//       <div className="validation-row">
//         <label>Signature</label>
//         <span className={db.signatureValid ? "ok" : "fail"}>
//           {db.signatureValid ? "VALID " : "INVALID "}
//         </span>
//       </div>

//       <div className="validation-row">
//         <label>Blockchain</label>
//         <span className={db.blockchainValid ? "ok" : "fail"}>
//           {db.blockchainValid ? "VERIFIED ON-CHAIN " : "NOT ANCHORED "}
//         </span>
//       </div>

//       {db.etherscan && (
//         <a href={db.etherscan} target="_blank">
//           🔗 View on Blockchain
//         </a>
//       )}

//       <div className="validation-final">
//         {dbOk
//           ? " Fully Verified (DB + Signature + Blockchain)"
//           : " Verification Failed"}
//       </div>
//     </div>
//   )
// }

const ValidationBadge = ({ label, result }) => {
  if (!result) return null;

  const db = result.db || {};

  // ✅ IGNORE blockchain for now
  const dbOk = db.hashMatch && db.signatureValid;

  return (
    <div className={`validation-panel ${dbOk ? "success" : "fail"}`}>
      <h4>{label} Verification</h4>

      <div className="validation-row">
        <label>Stored Hash</label>
        <code>{db.storedHash || "—"}</code>
      </div>

      <div className="validation-row">
        <label>Recomputed Hash</label>
        <code>{db.computedHash || "—"}</code>
      </div>

      <div className="validation-row">
        <label>DB Integrity</label>
        <span className={db.hashMatch ? "ok" : "fail"}>
          {db.hashMatch ? "MATCH " : "MISMATCH "}
        </span>
      </div>

      <div className="validation-row">
        <label>Signature</label>
        <span className={db.signatureValid ? "ok" : "fail"}>
          {db.signatureValid ? "VALID " : "INVALID "}
        </span>
      </div>

      {/* 🔥 TEMP: Blockchain shown but NOT affecting status */}
      <div className="validation-row">
        <label>Blockchain</label>
        <span className={db.blockchainValid ? "ok" : "warn"}>
          {db.blockchainValid ? "ANCHORED " : "CHECK ETHERSCAN "}
        </span>
      </div>

      {/* 🔗 ETHERSCAN BUTTON */}
      {db.etherscan && (
        <a
          href={db.etherscan}
          target="_blank"
          rel="noopener noreferrer"
          className="etherscan-btn"
        >
          🔗 View on Blockchain
        </a>
      )}

      {/* ✅ FINAL STATUS (NO blockchain dependency) */}
      <div className="validation-final">
        {dbOk
          ? " Verified (Data + Signature)"
          : " Integrity Compromised"}
      </div>
    </div>
  );
};

console.log("DB OBJECT:", validationResults.Manufacturer?.db);

return (
    <div className="dashboard-layout">
      <Sidebar role="Consumer" activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <div className="dashboard-content">
        {activeTab === "verify" && (
          <div className="records-section">
            <h2>Product Traceability</h2>

            <div className="search-bar">
              <input
                type="text"
                placeholder="Enter Batch Code"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
              />
              <input type="file" accept="image/*" onChange={handleQRUpload} />
              <button className="btn-secondary" onClick={fetchBatch}>
                Verify Batch
              </button>
            </div>
            
            {error && <p className="error-text">{error}</p>}

            {data && (
              <div className="trace-layout">

                {/* FARMER */}
                <div className="verification-block">
                  <h3>Farmer Data</h3>
                  <div>Herb Name: {collection?.herbName}</div>
                  <div>Quantity: {collection?.quantity} g</div>
                  <div>Location of Collection: {collection?.location}</div>
                  <div>Collection Time: {collection?.canonicalTimestamp}</div>
                  <div>Collection ID: {collection?.id}</div>
                </div>

                {/* LAB */}
                <div className="verification-block">
                  <h3>Lab Result</h3>
                  <div>Result: {lab?.result}</div>
                  <div>Remarks: {lab?.remarks}</div>
                </div>

                {/* MANUFACTURER */}
                <div className="verification-block">
                  <h3>Manufacturing</h3>
                  <div>Batch Name: {batch?.batchName}</div>
                  <div>Expiry Date: {batch?.expiryDate}</div>
                </div>

                {/* VALIDATION */}
                <div className="trace-actions">

  {/* FARMER */}
  <div className="validation-group">
    <button className="btn-secondary" onClick={() => runValidation("Farmer")}>
      Validate Farmer
    </button>
    <ValidationBadge label="Farmer" result={validationResults["Farmer"]} />
  </div>

  {/* LAB */}
  <div className="validation-group">
    <button className="btn-secondary" onClick={() => runValidation("Lab")}>
      Validate Lab
    </button>
    <ValidationBadge label="Lab" result={validationResults["Lab"]} />
  </div>

  {/* MANUFACTURER */}
  <div className="validation-group">
    <button className="btn-secondary" onClick={() => runValidation("Manufacturer")}>
      Validate Manufacturer
    </button>
    <ValidationBadge label="Manufacturer" result={validationResults["Manufacturer"]} />
  </div>

</div>

              </div>
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <SavedRecords savedRecords={savedRecords} />
        )}
      </div>
    </div>
  )
}

export default CustomerDashboard