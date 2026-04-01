import React from 'react'
import { Navigate } from 'react-router-dom'

/*
  ProtectedRoute:
  - Checks if user is logged in
  - Redirects to login if not authenticated
*/
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('loggedInUser')

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
