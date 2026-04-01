import React from 'react'
import './RoleCard.css'

/*
  RoleCard:
  - Reusable card component
  - Receives title, description, and click handler
*/
const RoleCard = ({ title, description, onClick }) => {
  return (
    <div className="role-card" onClick={onClick}>
      {/* Role name */}
      <h3>{title}</h3>

      {/* Short explanation of role */}
      <p>{description}</p>
    </div>
  )
}

export default RoleCard
