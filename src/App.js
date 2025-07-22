import React, { useState } from "react";

const samplePoems = [
  {
    title: "Daffodils",
    author: "William Wordsworth",
    text: `I wandered lonely as a cloud...`
  },
  {
    title: "The Road Not Taken",
    author: "Robert Frost",
    text: `Two roads diverged in a yellow wood...`
  }
];

function App() {
  const [poems] = useState(samplePoems);
  const [search, setSearch] = useState("");

  const filtered = poems.filter(poem =>
    poem.title.toLowerCase().includes(search.toLowerCase()) ||
    poem.author.toLowerCase().includes(search.toLowerCase()) ||
    poem.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h1>Motam Poetry Repository</h1>
      <input
        placeholder="Search poems…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 20 }}
      />
      {filtered.map((poem, i) => (
        <div key={i} style={{ marginBottom: 32 }}>
          <h2>{poem.title}</h2>
          <h4>by {poem.author}</h4>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
            {poem.text}
          </pre>
        </div>
      ))}
    </div>
  );
}

export default App;
