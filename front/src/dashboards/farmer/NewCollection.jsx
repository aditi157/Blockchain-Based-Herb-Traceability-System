import { useState, useEffect } from "react"

function NewCollection() {
  const [herbName, setHerbName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [assignedLabId, setAssignedLabId] = useState("")
  const [location, setLocation] = useState("")
  const [timestamp, setTimestamp] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Set timestamp automatically
    const now = new Date().toISOString()
    setTimestamp(now)

    // Get browser location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`
          setLocation(coords)
        },
        () => {
          setLocation("Location unavailable")
        }
      )
    } else {
      setLocation("Geolocation not supported")
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const token = localStorage.getItem("token")

    const response = await fetch("http://localhost:5000/api/collections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        herbName,
        quantity: Number(quantity),
        assignedLabId: assignedLabId || null,
        location,
        timestamp
      }),
    })

    const data = await response.json()

    if (response.ok) {
      setMessage("Collection submitted successfully!")
      setHerbName("")
      setQuantity("")
      setAssignedLabId("")
    } else {
      setMessage(data.message || "Error submitting collection")
    }
  }

  return (
    <div className="records-section">
      <h2>New Collection</h2>

      <form className="dashboard-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Herb Name"
          value={herbName}
          onChange={(e) => setHerbName(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Assigned Lab ID"
          value={assignedLabId}
          onChange={(e) => setAssignedLabId(e.target.value)}

        />

        {/* Immutable Timestamp */}
        <input
          type="text"
          value={timestamp}
          readOnly
        />

        {/* Immutable Location */}
        <input
          type="text"
          value={location}
          readOnly
        />

        <button type="submit">Submit Collection</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  )
}

export default NewCollection
