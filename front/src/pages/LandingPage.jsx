import React from 'react'
import { useNavigate } from 'react-router-dom'
import RoleCard from '../components/RoleCard'

/*
  LandingPage:
  - Shows role selection cards
  - Redirects user to login page with selected role
*/
const LandingPage = () => {
  const navigate = useNavigate()

  // Function called when a role card is clicked
  const handleRoleSelect = (role) => {
    // Navigate to login page and pass role as state
    navigate('/login', { state: { role } })
  }

  return (
    <div className="app-container">
      {/* Main title */}
      <h1 className="title">HerbTrace</h1>

      {/* Subtitle */}
      <p className="subtitle">
        Securely track the journey of Ayurvedic herbs from collection to consumption
        using blockchain and cryptography.
      </p>

      {/* Container holding all role cards */}
      <div className="card-container">
        <RoleCard
          title="Farmer / Collector"
          description="Record herb collection details and geographic origin."
          onClick={() => handleRoleSelect('Farmer')}
        />

        <RoleCard
          title="Laboratory"
          description="Upload quality test results and verification reports."
          onClick={() => handleRoleSelect('Laboratory')}
        />

        <RoleCard
          title="Manufacturer"
          description="Create product batches and generate QR codes."
          onClick={() => handleRoleSelect('Manufacturer')}
        />

        <RoleCard
          title="Consumer"
          description="Verify product authenticity and provenance."
          onClick={() => handleRoleSelect('Consumer')}
        />
      </div>
    </div>
  )
}

export default LandingPage
