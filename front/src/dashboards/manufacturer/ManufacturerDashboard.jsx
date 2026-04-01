import { useState } from "react"
import Sidebar from "../../components/Sidebar"
import ApprovedResults from "./ApprovedResults"
import MyBatches from "./MyBatches"



function ManufacturerDashboard() {
  const [activeTab, setActiveTab] = useState("approved")

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("organization")
    window.location.href = "/login"
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        role="Manufacturer"
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <div className="dashboard-content">
        {activeTab === "approved" && <ApprovedResults />}
        {activeTab === "manufacture" && <MyBatches />}
      </div>
    </div>
  )
}

export default ManufacturerDashboard
