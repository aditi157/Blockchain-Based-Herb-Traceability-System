import { useState } from "react"
import Sidebar from "../../components/Sidebar"
import NewCollection from "./NewCollection"
import MyCollections from "./MyCollections"
import LabResults from "./LabResults"
import ProofAudit from "./ProofAudit"

function FarmerDashboard() {
  const [activeTab, setActiveTab] = useState("new")

  const handleLogout = () => {
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        role="Farmer"
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <div className="dashboard-content">
        {activeTab === "new" && <NewCollection />}
        {activeTab === "collections" && <MyCollections />}
        {activeTab === "results" && <LabResults />}
        {activeTab === "proof" && <ProofAudit />}
      </div>
    </div>
  )
}

export default FarmerDashboard
