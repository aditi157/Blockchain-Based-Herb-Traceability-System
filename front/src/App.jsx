import { Routes, Route, Navigate } from "react-router-dom"

import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"

// Dashboards — MATCHING YOUR ACTUAL FOLDERS
import FarmerDashboard from "./dashboards/farmer/FarmerDashboard"
import LabDashboard from "./dashboards/lab/LabDashboard"
import ManufacturerDashboard from "./dashboards/manufacturer/ManufacturerDashboard"
import ConsumerDashboard from "./dashboards/consumer/ConsumerDashboard"

const App = () => {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Role dashboards */}
      <Route path="/farmer" element={<FarmerDashboard />} />
      <Route path="/lab" element={<LabDashboard />} />
      <Route path="/manufacturer" element={<ManufacturerDashboard />} />
      <Route path="/consumer" element={<ConsumerDashboard />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
