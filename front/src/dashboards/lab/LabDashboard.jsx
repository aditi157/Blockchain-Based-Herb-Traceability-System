import React, { useState } from "react"
import Sidebar from "../../components/Sidebar"
import AssignedCollections from "./AssignedCollections"; 
import PastTests from "./PastTests";
import Certificates from "./certificates";
import LabAuditLog from "./LabAuditLog";

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
        return <Certificates />
      case "audit":
        return <LabAuditLog />
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
