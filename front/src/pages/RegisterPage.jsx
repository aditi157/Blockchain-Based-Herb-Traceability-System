// import { useState } from "react"
// import { useNavigate } from "react-router-dom"

// const RegisterPage = () => {
//   console.log("REGISTER PAGE LOADED")

//   const navigate = useNavigate()

//   const [role, setRole] = useState("Farmer")
//   const [name, setName] = useState("")
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [error, setError] = useState("")
//   const [success, setSuccess] = useState("")

//   const handleRegister = async () => {
//     console.log("REGISTER BUTTON CLICKED", {
//       role,
//       name,
//       email,
//       password
//     })

//     setError("")
//     setSuccess("")

//     try {
//       const res = await fetch("http://localhost:5000/api/auth/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ role, name, email, password })
//       })

//       console.log("REGISTER RESPONSE STATUS:", res.status)

//       const data = await res.json()
//       console.log("REGISTER RESPONSE DATA:", data)

//       if (!res.ok) {
//         setError(data.error || "Registration failed")
//         return
//       }

//       setSuccess("Registration successful!")
//       alert("REGISTER SUCCESS")

//       setTimeout(() => navigate("/login"), 1000)
//     } catch (err) {
//       console.error(err)
//       setError("Server error")
//     }
//   }

//   return (
//     <div className="auth-container">
//       <h2>Register</h2>

//       <select value={role} onChange={e => setRole(e.target.value)}>
//         <option value="Farmer">Farmer</option>
//         <option value="Laboratory">Laboratory</option>
//         <option value="Manufacturer">Manufacturer</option>
//       </select>

//       <input
//         placeholder="Organization Name"
//         value={name}
//         onChange={e => setName(e.target.value)}
//       />

//       <input
//         type="email"
//         placeholder="Email"
//         value={email}
//         onChange={e => setEmail(e.target.value)}
//       />

//       <input
//         type="password"
//         placeholder="Password"
//         value={password}
//         onChange={e => setPassword(e.target.value)}
//       />

//       <button onClick={handleRegister}>Register</button>

//       {error && <p className="error">{error}</p>}
//       {success && <p className="success">{success}</p>}

//       <p style={{ marginTop: "16px", fontSize: "14px" }}>
//         Already registered?{" "}
//         <span
//           style={{ color: "#2e7d32", cursor: "pointer", fontWeight: "500" }}
//           onClick={() => navigate("/login")}
//         >
//           Log in instead
//         </span>
//       </p>
//     </div>
//   )
// }

// export default RegisterPage

import { useState } from "react"
import { useNavigate } from "react-router-dom"

const RegisterPage = () => {
  const navigate = useNavigate()

  const [role, setRole] = useState("FARMER")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleRegister = async () => {
    setError("")
    setSuccess("")

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, name, email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Registration failed")
        return
      }

      setSuccess(`Registered successfully! Your org code: ${data.orgCode}`)
      setTimeout(() => navigate("/login"), 2000)
    } catch (err) {
      console.error(err)
      setError("Server error")
    }
  }

  return (
    <div className="auth-container">
      <h2>Register</h2>

      <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="FARMER">Farmer</option>
        <option value="LAB">Laboratory</option>
        <option value="MANUFACTURER">Manufacturer</option>
        <option value="CONSUMER">Consumer</option>
      </select>

      <input
        placeholder="Organization Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button onClick={handleRegister}>Register</button>

      {error   && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <p style={{ marginTop: "16px", fontSize: "14px" }}>
        Already registered?{" "}
        <span
          style={{ color: "#2e7d32", cursor: "pointer", fontWeight: "500" }}
          onClick={() => navigate("/login")}
        >
          Log in instead
        </span>
      </p>
    </div>
  )
}

export default RegisterPage