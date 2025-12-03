import React, { useEffect, useState } from "react";
import Stack from "./Stack";
import "./App.css";
import WordCloudBackground from "./WordCloudBackground";

function groupByCategory(poems) {
  const byCat = {};
  poems.forEach((poem) => {
    if (!poem.category) return;
    if (!byCat[poem.category]) byCat[poem.category] = [];
    byCat[poem.category].push(poem);
  });
  return byCat;
}

function App() {
  const [poems, setPoems] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [bookMeta, setBookMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [currentCat, setCurrentCat] = useState("All");
  const [stackMode, setStackMode] = useState(false);
  const [stackPoems, setStackPoems] = useState([]);
  const [stackStart, setStackStart] = useState(0);

  function isMobile() {
    return window.innerWidth < 600;
  }

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/book_categorized.json")
      .then((res) => res.json())
      .then((data) => {
        // Use the poems array from JSON
        const poemsArray = data.poems || [];
        const poemsWithCategory = poemsArray.filter(
          (poem) =>
            poem.title &&
            poem.title.trim() !== "" &&
            poem.body &&
            poem.body.trim() !== "" &&
            poem.category &&
            poem.category.trim() !== ""
        );
        setPoems(poemsWithCategory);

        // Preserve category order from JSON, or extract from poems
        if (data.categories && data.categories.length > 0) {
          setCategoryOrder(data.categories);
        } else {
          const extractedCats = [
            ...new Set(
              poemsWithCategory.map((p) => p.category).filter(Boolean)
            ),
          ];
          setCategoryOrder(extractedCats);
        }

        // Store book metadata
        if (data.meta) {
          setBookMeta(data.meta);
        }
      })
      .catch((err) => console.error("Failed to load poems:", err));
  }, []);

  // Filter poems by search
  const filtered = poems.filter(
    (poem) =>
      (poem.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (poem.body || "").toLowerCase().includes(search.toLowerCase()) ||
      (poem.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const byCat = groupByCategory(filtered);

  // Use the preserved category order, filtering to only categories with poems
  const categories =
    categoryOrder.length > 0
      ? categoryOrder.filter((cat) => byCat[cat] && byCat[cat].length > 0)
      : Object.keys(byCat);

  const allCat = ["All", ...categories];
  const showPoems = currentCat === "All" ? filtered : byCat[currentCat] || [];
  const groupedAll = groupByCategory(showPoems);

  function onCategoryChange(newCat) {
    if (isMobile()) return;
    if (!byCat[newCat] || byCat[newCat].length === 0) return;
    setStackPoems(byCat[newCat]);
    setStackStart(0);
    setStackMode(true);
  }

  function handlePoemClick(index, groupPoems = null) {
    if (isMobile()) return;
    const poemsArr = groupPoems || showPoems;
    setStackPoems(poemsArr);
    setStackStart(index);
    setStackMode(true);
  }

  // Use all poems for word cloud (stable, doesn't change with filters)
  return (
    <div className="page-wrapper">
      <WordCloudBackground poems={poems} />

      <div className="app-root">
        {!stackMode && (
          <>
            {/* Decorative header flourish */}
            <span className="flourish-container">
              <img
                src={process.env.PUBLIC_URL + "/flurish.svg"}
                alt=""
                className="flourish-img"
              />
            </span>

            {/* Main title area */}
            <div className="title-area">
              <h1 className="main-title">
                {bookMeta?.bookTitle || "From Earth to Eternity"}
              </h1>
              <p className="subtitle">
                {bookMeta?.subtitle || "Poems of Devotion, Gratitude, and Love"}
              </p>
              <p className="author-line">
                {bookMeta?.author || "Ummul Mumineen Sakina Aaisaheba"}
              </p>
            </div>

            {/* Search */}
            <input
              className="search-input"
              placeholder="Search poems…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* Category pills */}
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

        {/* Poem Grid */}
        {!stackMode && (
          <div className="poem-list-root">
            {showPoems.length === 0 && (
              <div className="no-poems">No poems found.</div>
            )}

            {currentCat === "All"
              ? categories.map((cat) =>
                  groupedAll[cat]?.length ? (
                    <div key={cat} className="category-group">
                      <h2 className="cat-header">
                        <span className="cat-header-text">{cat}</span>
                        <span className="cat-header-count">
                          {groupedAll[cat].length}
                        </span>
                      </h2>
                      <div>
                        {groupedAll[cat].map((poem, i) => (
                          <div
                            className="poem-card"
                            key={poem.id + "-" + poem.title}
                            tabIndex={0}
                            onClick={() => handlePoemClick(i, groupedAll[cat])}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="poem-meta">
                              <span className="poem-chip">
                                <span className="poem-cat">
                                  {poem.category}
                                </span>
                                <span className="poem-dot">
                                  {poem.category ? " · " : ""}
                                </span>
                                <span className="poem-num">{poem.id}</span>
                              </span>
                            </div>
                            <div className="poem-title">{poem.title}</div>
                            {poem.date && (
                              <div className="poem-date">{poem.date}</div>
                            )}
                            <pre className="poem-body">{poem.body}</pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                )
              : showPoems.map((poem, i) => (
                  <div
                    className="poem-card"
                    key={poem.id + "-" + poem.title}
                    tabIndex={0}
                    onClick={() => handlePoemClick(i)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="poem-meta">
                      <span className="poem-chip">{poem.id}</span>
                    </div>
                    <div className="poem-title">{poem.title}</div>
                    {poem.date && <div className="poem-date">{poem.date}</div>}
                    <pre className="poem-body">{poem.body}</pre>
                  </div>
                ))}
          </div>
        )}

        {/* Stack Mode - uses Stack component which has its own close button */}
        {stackMode && (
          <Stack
            cardsData={stackPoems}
            allCategories={categories}
            onCategoryChange={onCategoryChange}
            startIndex={stackStart}
            onClose={() => setStackMode(false)}
          />
        )}

        {!stackMode && (
          <footer className="repo-footer">
            <div className="footer-publisher">
              {bookMeta?.publisher || "Fatemi Dawat Publications"} ·{" "}
              {bookMeta?.yearHijriGregorian || "1447/2025"}
            </div>
            <div className="footer-copy">
              &copy; {new Date().getFullYear()}{" "}
              {bookMeta?.copyright || "Fatemi Dawat Publications"}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

export default App;
