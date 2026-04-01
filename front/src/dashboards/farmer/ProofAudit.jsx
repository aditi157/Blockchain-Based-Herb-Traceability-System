import { useState } from "react";

function ProofAudit() {
  const [collectionId, setCollectionId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/proof/${collectionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Verification failed");
        setResult(null);
        return;
      }

      setResult(data);
      setError("");
    } catch (err) {
      setError("Server error");
      setResult(null);
    }
  };

  return (
    <div className="card">
      <h2>Proof Audit</h2>

      <input
        type="text"
        placeholder="Enter Collection ID"
        value={collectionId}
        onChange={(e) => setCollectionId(e.target.value)}
      />

      <button onClick={handleCheck}>Verify</button>

      {error && <p>{error}</p>}

      {result && (
        <div>
          <p>Hash: {result.hash}</p>
          <p>Signature Valid: {result.valid ? "Yes" : "No"}</p>
        </div>
      )}
    </div>
  );
}

export default ProofAudit;
