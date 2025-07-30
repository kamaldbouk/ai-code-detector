// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

import { useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setResult(null);

    const res = await fetch("http://localhost:8080/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>AI Code Detector</h1>
      <input
        type="text"
        placeholder="Enter GitHub repo URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: "400px", marginRight: "10px" }}
      />
      <button onClick={analyze}>Analyze</button>

      {loading && <p>Analyzing repo...</p>}

      {result && !result.error && (
        <div>
          <h2>Repo AI Score: {result.repo_score}%</h2>
          <ul>
            {Object.entries(result.files).map(([file, score]) => (
              <li key={file}>{file}: {score}%</li>
            ))}
          </ul>
        </div>
      )}

      {result && result.error && <p style={{ color: "red" }}>{result.error}</p>}
    </div>
  );
}

export default App;
