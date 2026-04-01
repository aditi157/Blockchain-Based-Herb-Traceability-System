// import { useState } from "react"
// import Sidebar from "../../components/Sidebar"
// import SavedRecords from "./SavedRecords"
// import VerifyView from "./VerifyView"



// const CustomerDashboard = () => {
//   const [activeTab, setActiveTab] = useState("verify")
//   const [batchCode, setBatchCode] = useState("")
//   const [data, setData] = useState(null)
//   const [error, setError] = useState("")

//   const handleLogout = () => {
//     localStorage.removeItem("token")
//     localStorage.removeItem("organization")
//     window.location.href = "/login"
//   }

//   const [savedRecords, setSavedRecords] = useState(() => {
//   const stored = localStorage.getItem("savedRecords")
//   return stored ? JSON.parse(stored) : []
// })

// const handleSaveRecord = () => {
//   if (!data) return

//   const recordName = prompt("Enter a name for this record:")
//   if (!recordName) return

//   const newRecord = {
//     id: Date.now(),
//     name: recordName,
//     batchCode: data.batchCode,
//     dateSaved: new Date().toISOString(),
//     data
//   }

//   const updated = [...savedRecords, newRecord]
//   setSavedRecords(updated)
//   localStorage.setItem("savedRecords", JSON.stringify(updated))

//   alert("Record saved successfully!")
// }

//   const fetchBatch = async () => {
//     try {
//       setError("")
//       setData(null)

//       const res = await fetch(
//         `http://localhost:5000/api/customer/batch/${batchCode}`
//       )

//       const result = await res.json()

//       if (!res.ok) {
//         setError(result.error || "Batch not found")
//         return
//       }

//       setData(result)

//     } catch (err) {
//       console.error(err)
//       setError("Server error")
//     }
//   }

//   return (
//     <div className="dashboard-layout">

//       <Sidebar
//         role="Consumer"
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         onLogout={handleLogout}
//       />

//       <div className="dashboard-content">

//         {activeTab === "verify" && (
//           <div className="records-section">
//             <h2>Product Traceability</h2>

//             {/* SEARCH */}
//             <div className="search-bar">
//               <input
//                 type="text"
//                 placeholder="Enter Batch Code (e.g. BATCH-001)"
//                 value={batchCode}
//                 onChange={(e) => setBatchCode(e.target.value)}
//               />
//               <button className="btn-secondary" onClick={fetchBatch}>
//                 Verify Batch
//               </button>
//             </div>

//             {error && <p className="error-text">{error}</p>}

//             {data && (
//               <div className="trace-layout">

//                 {/* FARMER */}
//                 <div className="trace-card">
//                   <h3>Farmer</h3>
//                   <div className="info-block">
//                     <label>Name</label>
//                     <span>{data.labResult.collection.farmer.name}</span>
//                   </div>
//                   <div className="info-block">
//                     <label>Farmer ID</label>
//                     <span>{data.labResult.collection.farmer.orgCode}</span>
//                   </div>
//                   <div className="info-block">
//                     <label>Location</label>
//                     <span>{data.labResult.collection.location}</span>
//                   </div>
//                   <div className="info-block">
//                     <label>Herb</label>
//                     <span>{data.labResult.collection.herbName}</span>
//                   </div>
//                   <div className="info-block">
//                     <label>Quantity</label>
//                     <span>{data.labResult.collection.quantity} kg</span>
//                   </div>
//                 </div>

//                 {/* LAB */}
//                 <div className="trace-card">
//                   <h3>Laboratory</h3>
//                   <div className="info-block">
//                     <label>Lab</label>
//                     <span>{data.labResult.lab.name}</span>
//                   </div>
//                   <div className="info-block">
//                     <label>Lab ID</label>
//                     <span>{data.labResult.lab.orgCode}</span>
//                   </div>
//                   <div className="info-block">
//                     <label>Result</label>
//                     <span className={`pill ${data.labResult.result === "PASS" ? "pass active" : "fail active"}`}>
//                       {data.labResult.result}
//                     </span>
//                   </div>
//                   <div className="info-block">
//                     <label>Remarks</label>
//                     <span>{data.labResult.remarks || "—"}</span>
//                   </div>
//                 </div>

//                 {/* MANUFACTURER */}
//                 <div className="trace-card">
//                   <h3>Manufacturer</h3>
//                   <div className="info-block">
//                     <label>Name</label>
//                     <span>{data.manufacturer.name}</span>
//                   </div>
//                   <div className="info-block">
//                     <label>Manufacturer ID</label>
//                     <span>{data.manufacturer.orgCode}</span>
//                   </div>
//                   <div className="info-block">
//                     <label>Batch Name</label>
//                     <span>{data.batchName}</span>
//                   </div>
//                   <div className="info-block">
//                     <label>Final Product</label>
//                     <span>{data.finalProductQuantity} g</span>
//                   </div>
//                   <div className="info-block">
//                     <label>Expiry</label>
//                     <span>
//                       {new Date(data.expiryDate).toLocaleDateString()}
//                     </span>
//                   </div>
//                 </div>

//                 {/* VALIDATION BUTTONS */}
//                 <div className="trace-actions">
//                   <h3>Integrity Verification</h3>

//                   <button
//   className="btn-secondary"
//   onClick={async () => {
//     const res = await fetch(
//       "http://localhost:5000/api/customer/validate/farmer",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ batchCode: data.batchCode })
//       }
//     )

//     const result = await res.json()

//     alert(
//       `Hash Match: ${result.hashMatch}\nSignature Valid: ${result.signatureValid}`
//     )
//   }}
// >
//   Validate Farmer Records
// </button>


//                   <button className="btn-secondary">
//                     Validate Lab Records
//                   </button>

//                   <button className="btn-secondary">
//                     Validate Manufacturer Records
//                   </button>
//                   <button className="btn-secondary" onClick={handleSaveRecord}>
//                     Save Record
//                   </button>

//                 </div>

//               </div>
//             )}

//           </div>
//         )}
        

//       </div>
//     </div>
//   )
// }

// export default CustomerDashboard


import { useState } from "react"
import Sidebar from "../../components/Sidebar"
import SavedRecords from "./SavedRecords"
import {
  generateHash,
  verifySignature,
  buildCollectionCanonical,
  buildLabResultCanonical,
  buildManufacturingCanonical
} from "../../utils/crypto"

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState("verify")
  const [batchCode, setBatchCode] = useState("")
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  const [validating, setValidating] = useState("")
  const [validationResults, setValidationResults] = useState({})

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

  const fetchBatch = async () => {
    try {
      setError("")
      setData(null)
      setValidationResults({})

      const res = await fetch(`http://localhost:5000/api/customer/batch/${batchCode}`)
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

  // ─────────────────────────────────────────────────────────────
  // FRONTEND TRANSIT VALIDATION
  // These rebuild the canonical from the fields received in the API
  // response and recompute the hash. If anything was altered in
  // transit between the server and this browser, the hash won't match.
  // The backend DB validation (via POST /validate/*) checks DB integrity.
  // Both checks together give full coverage.
  // ─────────────────────────────────────────────────────────────

  const validateFarmerFrontend = async () => {
    const collection = data.labResult.collection
    const farmer = collection.farmer

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

    return { hashMatch, signatureValid, actor: "Farmer" }
  }

  const validateLabFrontend = async () => {
    const labResult = data.labResult
    const lab = labResult.lab

    const canonical = buildLabResultCanonical({
      labResultId:   labResult.id,
      collectionId:  labResult.collectionId,
      labCode:       lab.orgCode,
      result:        labResult.result,
      remarks:       labResult.remarks,
      assignedMfgId: labResult.assignedMfgId,
      timestamp:     labResult.canonicalTimestamp
    })

    const computedHash = await generateHash(canonical)
    const hashMatch = computedHash === labResult.hash

    let signatureValid = false
    if (hashMatch) {
      signatureValid = await verifySignature(lab.publicKey, canonical, labResult.signature)
    }

    return { hashMatch, signatureValid, actor: "Lab" }
  }

  const validateManufacturerFrontend = async () => {
    const mfg = data.manufacturer

    const canonical = buildManufacturingCanonical({
      batchId:              data.id,
      batchName:            data.batchName,
      labResultId:          data.labResultId,
      manufacturerId:       data.manufacturerId,
      herbUsedQuantity:     String(data.herbUsedQuantity),
      finalProductQuantity: String(data.finalProductQuantity),
      expiryDate:           new Date(data.expiryDate).toISOString(),
      timestamp:            data.canonicalTimestamp
    })

    const computedHash = await generateHash(canonical)
    const hashMatch = computedHash === data.hash

    let signatureValid = false
    if (hashMatch) {
      signatureValid = await verifySignature(mfg.publicKey, canonical, data.signature)
    }

    return { hashMatch, signatureValid, actor: "Manufacturer" }
  }

  // Run both DB check (backend) and transit check (frontend) together
  const runValidation = async (actor) => {
    setValidating(actor)
    try {
      // Backend: validates against DB fields — catches DB tampering
      const endpointMap = {
        Farmer:       "farmer",
        Lab:          "lab",
        Manufacturer: "manufacturer"
      }

      const dbRes = await fetch(
        `http://localhost:5000/api/customer/validate/${endpointMap[actor]}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchCode: data.batchCode })
        }
      )
      const dbResult = await dbRes.json()

      // Frontend: validates against received API fields — catches transit tampering
      const frontendValidatorMap = {
        Farmer:       validateFarmerFrontend,
        Lab:          validateLabFrontend,
        Manufacturer: validateManufacturerFrontend
      }
      const transitResult = await frontendValidatorMap[actor]()

      setValidationResults((prev) => ({
        ...prev,
        [actor]: {
          db:      { hashMatch: dbResult.hashMatch,      signatureValid: dbResult.signatureValid },
          transit: { hashMatch: transitResult.hashMatch, signatureValid: transitResult.signatureValid }
        }
      }))

    } catch (err) {
      console.error(err)
      setValidationResults((prev) => ({
        ...prev,
        [actor]: { error: "Validation failed" }
      }))
    } finally {
      setValidating("")
    }
  }

  const ValidationBadge = ({ label, result }) => {
    if (!result) return null
    if (result.error) return <p style={{ color: "orange" }}>{result.error}</p>

    const dbOk      = result.db?.hashMatch && result.db?.signatureValid
    const transitOk = result.transit?.hashMatch && result.transit?.signatureValid

    return (
      <div style={{ marginTop: "10px", fontSize: "13px", background: "#f8f9fa", padding: "10px", borderRadius: "8px" }}>
        <strong>{label}</strong>
        <div style={{ marginTop: "6px" }}>
          <span style={{ color: "#555" }}>DB integrity: </span>
          <span style={{ color: result.db?.hashMatch ? "green" : "red" }}>
            Hash {result.db?.hashMatch ? "✓" : "✗"}
          </span>
          {" · "}
          <span style={{ color: result.db?.signatureValid ? "green" : "red" }}>
            Sig {result.db?.signatureValid ? "✓" : "✗"}
          </span>
        </div>
        <div>
          <span style={{ color: "#555" }}>Transit integrity: </span>
          <span style={{ color: result.transit?.hashMatch ? "green" : "red" }}>
            Hash {result.transit?.hashMatch ? "✓" : "✗"}
          </span>
          {" · "}
          <span style={{ color: result.transit?.signatureValid ? "green" : "red" }}>
            Sig {result.transit?.signatureValid ? "✓" : "✗"}
          </span>
        </div>
        <div style={{ marginTop: "4px", fontWeight: "bold", color: dbOk && transitOk ? "green" : "red" }}>
          {dbOk && transitOk ? "✔ Record Verified" : "✖ Integrity Check Failed"}
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        role="Consumer"
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <div className="dashboard-content">
        {activeTab === "verify" && (
          <div className="records-section">
            <h2>Product Traceability</h2>

            <div className="search-bar">
              <input
                type="text"
                placeholder="Enter Batch Code (e.g. BATCH-001)"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
              />
              <button className="btn-secondary" onClick={fetchBatch}>
                Verify Batch
              </button>
            </div>

            {error && <p className="error-text">{error}</p>}

            {data && (
              <div className="trace-layout">

                {/* FARMER */}
                <div className="trace-card">
                  <h3>Farmer</h3>
                  <div className="info-block">
                    <label>Name</label>
                    <span>{data.labResult.collection.farmer.name}</span>
                  </div>
                  <div className="info-block">
                    <label>Farmer ID</label>
                    <span>{data.labResult.collection.farmer.orgCode}</span>
                  </div>
                  <div className="info-block">
                    <label>Location</label>
                    <span>{data.labResult.collection.location}</span>
                  </div>
                  <div className="info-block">
                    <label>Herb</label>
                    <span>{data.labResult.collection.herbName}</span>
                  </div>
                  <div className="info-block">
                    <label>Quantity</label>
                    <span>{data.labResult.collection.quantity} kg</span>
                  </div>
                </div>

                {/* LAB */}
                <div className="trace-card">
                  <h3>Laboratory</h3>
                  <div className="info-block">
                    <label>Lab</label>
                    <span>{data.labResult.lab.name}</span>
                  </div>
                  <div className="info-block">
                    <label>Lab ID</label>
                    <span>{data.labResult.lab.orgCode}</span>
                  </div>
                  <div className="info-block">
                    <label>Result</label>
                    <span className={`pill ${data.labResult.result === "PASS" ? "pass active" : "fail active"}`}>
                      {data.labResult.result}
                    </span>
                  </div>
                  <div className="info-block">
                    <label>Remarks</label>
                    <span>{data.labResult.remarks || "—"}</span>
                  </div>
                </div>

                {/* MANUFACTURER */}
                <div className="trace-card">
                  <h3>Manufacturer</h3>
                  <div className="info-block">
                    <label>Name</label>
                    <span>{data.manufacturer.name}</span>
                  </div>
                  <div className="info-block">
                    <label>Manufacturer ID</label>
                    <span>{data.manufacturer.orgCode}</span>
                  </div>
                  <div className="info-block">
                    <label>Batch Name</label>
                    <span>{data.batchName}</span>
                  </div>
                  <div className="info-block">
                    <label>Final Product</label>
                    <span>{data.finalProductQuantity} g</span>
                  </div>
                  <div className="info-block">
                    <label>Expiry</label>
                    <span>{new Date(data.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* VALIDATION */}
                <div className="trace-actions">
                  <h3>Integrity Verification</h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>

                    <div>
                      <button
                        className="btn-secondary"
                        onClick={() => runValidation("Farmer")}
                        disabled={validating === "Farmer"}
                      >
                        {validating === "Farmer" ? "Validating..." : "Validate Farmer Records"}
                      </button>
                      <ValidationBadge label="Farmer" result={validationResults["Farmer"]} />
                    </div>

                    <div>
                      <button
                        className="btn-secondary"
                        onClick={() => runValidation("Lab")}
                        disabled={validating === "Lab"}
                      >
                        {validating === "Lab" ? "Validating..." : "Validate Lab Records"}
                      </button>
                      <ValidationBadge label="Lab" result={validationResults["Lab"]} />
                    </div>

                    <div>
                      <button
                        className="btn-secondary"
                        onClick={() => runValidation("Manufacturer")}
                        disabled={validating === "Manufacturer"}
                      >
                        {validating === "Manufacturer" ? "Validating..." : "Validate Manufacturer Records"}
                      </button>
                      <ValidationBadge label="Manufacturer" result={validationResults["Manufacturer"]} />
                    </div>

                    <button className="btn-secondary" onClick={handleSaveRecord}>
                      Save Record
                    </button>

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

