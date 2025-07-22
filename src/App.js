import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "./App.css";

function groupByCategory(poems) {
  const byCat = {};
  poems.forEach((poem) => {
    if (!poem.Category) return;
    if (!byCat[poem.Category]) byCat[poem.Category] = [];
    byCat[poem.Category].push(poem);
  });
  return byCat;
}

function App() {
  const [poems, setPoems] = useState([]);
  const [search, setSearch] = useState("");
  const [currentCat, setCurrentCat] = useState("All");

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/poems.csv")
      .then((res) => res.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const cleaned = results.data.filter(
              (row) =>
                row.Title &&
                row.Title.trim() !== "" &&
                row.Body &&
                row.Body.trim() !== "" &&
                row.Category &&
                row.Category.trim() !== ""
            );
            setPoems(cleaned);
          },
        });
      });
  }, []);

  // Filter and group poems
  const filtered = poems.filter(
    (poem) =>
      (poem.Title || "").toLowerCase().includes(search.toLowerCase()) ||
      (poem.Body || "").toLowerCase().includes(search.toLowerCase()) ||
      (poem.Category || "").toLowerCase().includes(search.toLowerCase())
  );

  const byCat = groupByCategory(filtered);
  const categories = Object.keys(byCat).sort();
  const allCat = ["All", ...categories];

  // Show poems based on selected category
  let showPoems;
  if (currentCat === "All") {
    showPoems = filtered;
  } else {
    showPoems = byCat[currentCat] || [];
  }

  // Regroup for "All" so poems are grouped under category headers
  const groupedAll = groupByCategory(showPoems);

  return (
    <div className="app-root">
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "40px 0 16px 0",
          minHeight: 100,
        }}
      >
        {/* SVG flourish behind and overlapping */}
        <img
          src={process.env.PUBLIC_URL + "/flurish.svg"}
          alt="Logo"
          style={{
            position: "absolute",
            left: "calc(18%)", // tweak as needed!
            // top: "0",
            marginBottom: "60px",
            width: 280,
            height: "auto",
            opacity: 0.58,
            zIndex: 1,
            pointerEvents: "none",
            filter: "blur(0.2px)",
          }}
        />
        {/* Main title in front */}
        <h1
          className="main-title"
          style={{
            position: "relative",
            zIndex: 2,
            fontWeight: 700,
            fontSize: "2.6rem",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          <span
            style={{
              position: "relative",
              zIndex: 2,
              fontSize: "2.8rem",
            }}
          >
            S
          </span>
          akina Qutbuddin
        </h1>
      </div>

      <input
        className="search-input"
        placeholder="Search poems…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="category-bar">
        {allCat.map((cat) => (
          <button
            key={cat}
            className={`category-pill${currentCat === cat ? " selected" : ""}`}
            onClick={() => setCurrentCat(cat)}
          >
            {cat}
            <span className="cat-count-pill">
              {cat === "All" ? filtered.length : byCat[cat]?.length || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="poem-list-root">
        {showPoems.length === 0 && (
          <div className="no-poems">No poems found.</div>
        )}

        {currentCat === "All"
          ? categories.map((cat) =>
              groupedAll[cat]?.length ? (
                <div key={cat} className="category-group">
                  <h2 className="cat-header">{cat}</h2>
                  <div>
                    {groupedAll[cat].map((poem, i) => (
                      <div className="poem-card" key={poem.Number + poem.Title}>
                        <div className="poem-meta">
                          {/* <span className="poem-chip">
                            {cat} ·{" "}
                            {poem.Number && poem.Number.replace(/^0+/, "")}
                          </span> */}
                          <span className="poem-chip">
                            <span className="poem-cat-name">
                              {poem.Category}
                            </span>
                            <span className="poem-dot">
                              {poem.Category ? " · " : ""}
                            </span>
                            <span className="poem-num">
                              {poem.Number && poem.Number.replace(/^0+/, "")}
                            </span>
                          </span>
                        </div>
                        <div className="poem-title">{poem.Title}</div>
                        <pre className="poem-body">{poem.Body}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )
          : showPoems.map((poem, i) => (
              <div className="poem-card" key={poem.Number + poem.Title}>
                <div className="poem-meta">
                  <span className="poem-chip">
                    {poem.Category} ·{" "}
                    {poem.Number && poem.Number.replace(/^0+/, "")}
                  </span>
                </div>
                <div className="poem-title">{poem.Title}</div>
                <pre className="poem-body">{poem.Body}</pre>
              </div>
            ))}
      </div>
      <footer className="repo-footer">
        &copy; {new Date().getFullYear()} Motam Poetry Repository
      </footer>
    </div>
  );
}

export default App;
