import React, { useState } from "react"
import Sidebar from "../../components/Sidebar"
import AssignedCollections from "./AssignedCollections"; 
import PastTests from "./PastTests";

const LabDashboard = () => {
  const [activeTab, setActiveTab] = useState("incoming")

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = "/"
  }

  const renderContent = () => {
    switch (activeTab) {
      case "incoming":
        return <AssignedCollections />
      case "test":
        return <PastTests />
      case "certs":
        return <h2>Issued Certificates</h2>
      case "audit":
        return <h2>Audit Log</h2>
      default:
        return null
    }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        role="Laboratory"
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />
      <div className="dashboard-content">
        {renderContent()}
      </div>
    </div>
  )
}

export default LabDashboard
