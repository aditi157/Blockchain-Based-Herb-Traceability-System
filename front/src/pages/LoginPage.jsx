import { useState } from "react"
import { useNavigate } from "react-router-dom"

const LoginPage = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async () => {
  setError("")

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.message || "Login failed")
      return
    }

    // Store token
    localStorage.setItem("token", data.token)

    // Store role directly
    localStorage.setItem("role", data.role)

    const role = data.role

    if (role === "FARMER") navigate("/farmer")
    else if (role === "LAB") navigate("/lab")
    else if (role === "MANUFACTURER") navigate("/manufacturer")
    else if (role === "CONSUMER") navigate("/consumer")
    else setError("Unknown role")

  } catch (err) {
    console.error(err)
    setError("Server error")
  }
}


  return (
    <div className="auth-container">
      <h2>Login</h2>

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
      <p></p>
      <button onClick={handleLogin}>Login</button>

      {error && <p className="error">{error}</p>}

      <p style={{ marginTop: "16px", fontSize: "14px" }}>
        Don’t have an account?{" "}
        <span
          style={{ color: "#2e7d32", cursor: "pointer", fontWeight: "500" }}
          onClick={() => navigate("/register")}
        >
          Register instead
        </span>
      </p>
    </div>
  )
}

export default LoginPage
