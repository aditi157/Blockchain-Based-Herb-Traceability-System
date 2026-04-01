import React from "react"
import "./Sidebar.css"

const sidebarConfig = {
  Farmer: [
    { key: "new", label: "New Collection" },
    { key: "collections", label: "My Collections" },
    { key: "results", label: "Lab Results" },
    { key: "proof", label: "Proof & Audit" }
  ],

  Laboratory: [
    { key: "incoming", label: "Incoming Samples" },
    { key: "test", label: "Past Tests" },
    { key: "certs", label: "Issued Certificates" },
    { key: "audit", label: "Audit Log" }
  ],

  Manufacturer: [
    { key: "approved", label: "Approved Batches" },
    { key: "manufacture", label: "Manufacturing Records" },
    { key: "blockchain", label: "Blockchain Proof" },
    { key: "audit", label: "Audit Trail" }
  ],

  Consumer: [
  { key: "verify", label: "Verify Product" },
  { key: "saved", label: "Saved Records" }
]

}

const Sidebar = ({ role, activeTab, setActiveTab, onLogout }) => {
  const tabs = sidebarConfig[role] || []

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">HerbTrace</h2>

      <ul className="sidebar-menu">
        {tabs.map(tab => (
          <li
            key={tab.key}
            className={activeTab === tab.key ? "active" : ""}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </li>
        ))}

        <li className="logout" onClick={onLogout}>
          Logout
        </li>
      </ul>
    </div>
  )
}

export default Sidebar
