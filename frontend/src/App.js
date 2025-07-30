import { useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("http://localhost:8080/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Failed to connect to backend" });
    }

    setLoading(false);
  };

  const getColor = (score) => {
    if (score < 25) return "#00ff99"; 
    if (score < 75) return "#ffcc00"; 
    return "#ff0066"; 
  };

  return (
    <div className="app">
      {/* Background circles */}
      <div className="background-circles">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="circle"></div>
        ))}
      </div>

      <h1 className="title">AI Code Detector</h1>

      <div className="input-container">
        <input
          type="text"
          placeholder="Paste your GitHub repo URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="input"
        />
        <button onClick={analyze} className="button">Analyze</button>
      </div>

      {loading && <p className="loading">Summoning the AI detection bot...</p>}

      {result && !result.error && !loading && (
        <div className="results">
          <div className="chart">
            <CircularProgressbar
              value={result.repo_score}
              text={`${result.repo_score}%`}
              styles={buildStyles({
                textColor: "#fff",
                pathColor: getColor(result.repo_score),
                trailColor: "#222",
              })}
            />
          </div>

          <h2>Repo AI Likelihood</h2>

          <div className="files">
            <h3>File Analysis</h3>
            <ul>
              {Object.entries(result.files).map(([file, score]) => (
                <li key={file} className="file-item">
                  <span className="file-name">{file}</span>
                  <span className="file-score" style={{ color: getColor(score) }}>
                    {score}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {result && result.error && !loading && (
        <p className="error">{result.error}</p>
      )}

      <footer className="footer">Powered by <span>OpenAI</span></footer>
    </div>
  );
}

export default App;
