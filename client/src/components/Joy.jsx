import { useState } from "react";
import axios from "axios";

// axios.defaults.withCredentials = false;

export default function Joy() {
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConnectors = async () => {
    setLoading(true);
    setError(null);

    let url =
      "https://c77c-2001-bc8-710-ac1b-dc00-ff-fe91-873b.ngrok-free.app/v1/auth/connectors";
    url = "https://test.api.apps.lithiumdigital.com/v1/auth/connectors";
    url = "http://localhost:8080";

    try {
      const r = await axios.get(url, {
        headers: {
          Accept: "application/json",
          // "ngrok-skip-browser-warning": true,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      return;
      const response = await axios.get(url, {
        headers: {
          Accept: "application/json",
          // "ngrok-skip-browser-warning": true,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      console.log(response.data);
      setConnectors(response.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setError("Error fetching connectors");
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>React ⚛️ + Vite ⚡ + Replit 🌀</h1>

      <div className="api-section">
        <button
          onClick={fetchConnectors}
          disabled={loading}
          className="fetch-button"
        >
          {loading ? "Loading..." : "Fetch Connectors"}
        </button>

        {error && <p className="error-message">{error}</p>}

        {connectors.length > 0 && (
          <div className="results">
            <h2>Connectors:</h2>
            <ul>
              {connectors.map((connector) => (
                <li key={connector.id}>
                  <strong>{connector.name}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
