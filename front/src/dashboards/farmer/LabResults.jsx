import { useEffect, useState } from "react";

function LabResults() {
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/lab/farmer",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setResults(data);
        } else {
          setError(data.message || "Failed to fetch lab results");
        }
      } catch {
        setError("Server error");
      }
    };

    fetchResults();
  }, []);

  return (
    <div className="records-section">
      <h2>Lab Results</h2>

      {error && <p className="error-text">{error}</p>}

      <table className="records-table">
        <thead>
          <tr>
            <th>Collection ID</th>
            <th>Result</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id}>
              <td>{r.collectionId}</td>
              <td>{r.result}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LabResults;
