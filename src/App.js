import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import Stack from "./Stack";
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
  const [stackMode, setStackMode] = useState(false);
  const [stackPoems, setStackPoems] = useState([]);
  const [stackStart, setStackStart] = useState(0);
  // const [dims, setDims] = useState({ width: 320, height: 400 });
  // useEffect(() => {
  //   function handleResize() {
  //     setDims({
  //       width: Math.min(window.innerWidth * 0.7, 540),
  //       height: Math.min(window.innerHeight * 0.85, 700),
  //     });
  //   }
  //   window.addEventListener("resize", handleResize);
  //   handleResize();
  //   return () => window.removeEventListener("resize", handleResize);
  // }, []);
  function isMobile() {
    return window.innerWidth < 600; // or use 768 for tablets
  }

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
  // const categories = Object.keys(byCat).sort();
  const categories = Object.keys(byCat);
  const allCat = ["All", ...categories];
  const showPoems = currentCat === "All" ? filtered : byCat[currentCat] || [];
  const groupedAll = groupByCategory(showPoems);

  // Inside your App() component in App.js

  function onCategoryChange(newCat) {
    if (isMobile()) return;
    if (!byCat[newCat] || byCat[newCat].length === 0) return; // Just in case
    setStackPoems(byCat[newCat]);
    setStackMode(true);
    // If you have a separate stackStart, set to 0
    // setStackStart(0);
  }

  // Stack mode: always use the category's poems (never "All")
  function handlePoemClick(index, groupPoems = null) {
    if (isMobile()) return;
    const poemsArr = groupPoems || showPoems;
    setStackPoems(poemsArr);
    setStackStart(index);
    setStackMode(true);
  }

  // function reorderForStack(poems, index) {
  //   return [...poems.slice(index), ...poems.slice(0, index)];
  // }

  // // Render poem card for stack
  // function renderStackCard({ item }) {
  //   return (
  //     <div className="poem-card stack-card" style={{ minHeight: 230 }}>
  //       <div className="poem-meta">
  //         <span className="poem-chip">
  //           <span className="poem-cat-name">{item.Category}</span>
  //           <span className="poem-dot">{item.Category ? " · " : ""}</span>
  //           <span className="poem-num">
  //             {item.Number && item.Number.replace(/^0+/, "")}
  //           </span>
  //         </span>
  //       </div>
  //       <div className="poem-title">{item.Title}</div>
  //       <pre className="poem-body">{item.Body}</pre>
  //     </div>
  //   );
  // }

  // Stack mode overlay/modal
  function StackModal() {
    return (
      <div
        style={{
          zIndex: 40,
          position: "fixed",
          left: 0,
          top: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(248,250,248,0.97)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <button
          onClick={() => setStackMode(false)}
          style={{
            position: "absolute",
            top: 18,
            right: 22,
            background: "#eaeaea",
            border: "none",
            borderRadius: 8,
            padding: "8px 17px",
            fontWeight: 600,
            fontSize: 18,
            color: "#354",
            boxShadow: "0 1.5px 8px #c6e3d2a3",
            cursor: "pointer",
            zIndex: 41,
          }}
          aria-label="Close stack mode"
        >
          Close
        </button>
        <Stack
          cardsData={stackPoems}
          allCategories={categories}
          onCategoryChange={onCategoryChange}
          // renderCard={(poem) => (
          //   // REMOVE the outer .poem-card.stack-card! Just return the card content:
          //   <>
          //     <div className="poem-meta">
          //       <span className="poem-chip">
          //         <span className="poem-cat-name">{poem.Category}</span>
          //         <span className="poem-dot">{poem.Category ? " · " : ""}</span>
          //         <span className="poem-num">
          //           {poem.Number && poem.Number.replace(/^0+/, "")}
          //         </span>
          //       </span>
          //     </div>
          //     <div className="poem-title">{poem.Title}</div>
          //     <pre className="poem-body">{poem.Body}</pre>
          //   </>
          // )}
          // cardDimensions={dims}
          startIndex={stackStart}
          onClose={() => setStackMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="app-root">
      {/* --- Header / SVG --- */}
      {!stackMode && (
        <>
          <span
            style={{
              display: "flex",
              justifyContent: "center",
              alignContent: "center",
            }}
          >
            <img
              src={process.env.PUBLIC_URL + "/flurish.svg"}
              alt="Logo"
              style={{
                position: "absolute",
                // left: "calc(18%)",
                // margin: "auto",
                // marginBottom: "60px",

                alignItems: "center",
                justifyItems: "center",
                // postion: "fixed",
                width: 280,
                height: "auto",
                opacity: 0.58,
                zIndex: 1,
                pointerEvents: "none",
                top: "-10px",
                // filter: "blur(0.2px)",
              }}
            />
          </span>
          <div
            style={{
              position: "relative",
              display: "flex",
              // alignItems: "center",
              justifyContent: "center",
              margin: "170px 0 20px 0",
              minHeight: 45,
            }}
          >
            <h1
              className="main-title"
              style={{
                position: "relative",
                zIndex: 2,
                fontWeight: 700,
                fontSize: "1.6rem",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {/* <span
                style={{ position: "relative", zIndex: 2, fontSize: "2.8rem" }}
              > */}
              S{/* </span> */}
              akina K Qutbuddin
              <div style={{fontFamily: "Caveat", fontSize: "0.8rem", textAlign: "right"}}>poems from the heart</div>
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
                className={`category-pill${
                  currentCat === cat ? " selected" : ""
                }`}
                onClick={() => setCurrentCat(cat)}
              >
                {cat}
                <span className="cat-count-pill">
                  {cat === "All" ? filtered.length : byCat[cat]?.length || 0}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* --- Poem Grid (hide in stack mode) --- */}
      {!stackMode && (
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
                        <div
                          className="poem-card"
                          key={poem.Number + poem.Title}
                          tabIndex={0}
                          onClick={() => handlePoemClick(i, groupedAll[cat])}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="poem-meta">
                            <span className="poem-chip">
                              <span className="poem-cat">{poem.Category}</span>
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
                <div
                  className="poem-card"
                  key={poem.Number + poem.Title}
                  tabIndex={0}
                  onClick={() => handlePoemClick(i)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="poem-meta">
                    <span className="poem-chip">
                      {/* {poem.Category} ·{" "} */}
                      {poem.Number && poem.Number.replace(/^0+/, "")}
                    </span>
                  </div>
                  <div className="poem-title">{poem.Title}</div>
                  <pre className="poem-body">{poem.Body}</pre>
                </div>
              ))}
        </div>
      )}

      {/* --- Stack Mode Overlay --- */}
      {stackMode && <StackModal />}

      <footer className="repo-footer">
        &copy; {new Date().getFullYear()} Motam Poetry Repository
      </footer>
    </div>
  );
}

export default App;
