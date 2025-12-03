import React, { useEffect, useState, useMemo } from "react";
import PoemReader from "./PoemReader.js";
import "./App.css";
import WordCloudBackground from "./WordCloudBackground";

function groupByCategory(poems, categoryOrder = []) {
  const byCat = {};
  poems.forEach((poem) => {
    if (!poem.category) return;
    if (!byCat[poem.category]) byCat[poem.category] = [];
    byCat[poem.category].push(poem);
  });

  if (categoryOrder.length > 0) {
    const ordered = {};
    categoryOrder.forEach((cat) => {
      if (byCat[cat]) ordered[cat] = byCat[cat];
    });
    return ordered;
  }
  return byCat;
}

// Info Modal Component
function InfoModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="info-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="info-modal-content">
          <section className="dedication-section">
            <p className="dedication-label">Dedicated</p>
            <p className="dedication-text">
              in humble thanksgiving
              <br />
              for their countless blessings
              <br />
              to the radiant Da'is
            </p>
            <p className="dedication-names">
              Syedna Taher Saifuddin <span className="honorific">(RA)</span>
              <br />
              Syedna Mohammed Burhanuddin{" "}
              <span className="honorific">(RA)</span>
              <br />
              Syedna Khuzaima Qutbuddin <span className="honorific">(RA)</span>
              <br />
              Syedna Taher Fakhruddin <span className="honorific">(TUS)</span>
            </p>
            <p className="dedication-text">
              and with heartfelt gratitude
              <br />
              to my beloved, respected parents
            </p>
            <p className="dedication-names">
              Rasul Hudood Syedi Ibrahim bhaisaheb Zainuddin
              <br />
              al-Sayyida al-Fadila Fatema baisaheba
            </p>
          </section>
          <div className="section-divider">❧</div>
          <section className="foreword-section">
            <h2 className="foreword-title">Foreword</h2>
            <p>
              Sakina Busaheba is the embodiment of the strong Muslim
              woman—steadfast in faith, serene in adversity, radiant in love.
              She stands firm through calamity yet greets every soul with a
              smile. Her heart rejoices in gratitude through fire and rain. Her
              lips are ever moist with the name of Ali, and her heart overflows
              with love for Husain.
            </p>
            <p>
              For over fifty years she was the solace—<em>sakina</em>—of her
              husband, the 53rd Dāʿī al-Muṭlaq, Syedna Khuzaima Qutbuddin (RA):
              his companion in light and darkness alike. After his passing, she
              yearns for him day and night, yet remains strong and content,
              knowing she will meet him again in heaven.
            </p>
            <p>
              Sakina Busaheba's lineage is luminous. She is the mother of the
              54th and present Tayyibi Dāʿī al-Muṭlaq, Syedna Taher Fakhruddin
              (TUS); wife of the 53rd Dāʿī, Syedna Khuzaima Qutbuddin (RA);
              sister-in-law of the 52nd Dāʿī, Syedna Mohammed Burhanuddin (RA);
              daughter-in-law and niece of the 51st Dāʿī, Syedna Taher Saifuddin
              (RA); and granddaughter of the 49th Dāʿī, Syedna Mohammed
              Burhanuddin (RA).
            </p>
            <p>
              Her father, Rasul Hudood Syedi Ibrahim bhaisaheb Zainuddin, and
              her mother, al-Sayyida al-Fadila Fatema bensaheba, nurtured her in
              faith and learning. Guided by their example—and blessed by the
              teachings and nazaraat of Syedna Taher Saifuddin (RA)—she grew in
              both scholarship and devotion. She prays for hours, recites
              tasbeeh with deep focus, and completes a full reading of the
              Qur'an each day in Ramadan.
            </p>
            <p>
              A devoted mother of nine, she raised her children in faith,
              fortitude, and aspiration. Alongside Syedna Qutbuddin (RA), she
              inculcated in them—sons and daughters—the importance of education
              and the ethic of service. Her grandchildren find in her a fountain
              of gentle affection.
            </p>
            <p>
              In every role—daughter, wife, mother, counsellor, teacher,
              scholar, benefactor, believer, devotee, and poet—she reflects
              resilience, sincerity, devotion, warmth, generosity and grace. She
              is, truly, the epitome of Muslim womanhood—my mother, an
              inspiration to me and to us all.
            </p>
            <p>
              At a time when few women studied beyond home, she attended
              Cathedral School and Sophia College, graduating with honours in
              English literature and a B.Ed., also teaching there for two years.
              She reads widely and now especially appreciates political
              commentary and historical works. She has long loved Shakespeare,
              Milton, Emerson, and Frost—poets who helped shape her own voice.
            </p>
            <p>
              Sakina Busaheba began composing poetry in the early 1960s and
              continues to this day. This beautiful and intimate collection is a
              mirror of her life and her faith—of devotion, gratitude, and love.
              Within these pages are 220 poems in praise of Allah, in awe at the
              circle of life, in remembrance of the Panjetan Paak, and in
              devotion to the Da'is of her time—many written in elegy for her
              noble husband, Syedna Khuzaima Qutbuddin (RA). They come from the
              heart and they touch the heart—they will be recited and savoured
              for generations to come.
            </p>
            <p className="foreword-signature">
              <span className="signature-name">
                Bazat Tahera binte Syedna Khuzaima Qutbuddin (RA)
              </span>
              <span className="signature-title">
                AlBabtain Laudian Professor of Arabic, University of Oxford
              </span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

// Index Modal Component
function IndexModal({ isOpen, onClose, poems, categoryOrder, onSelectPoem }) {
  const [groupBy, setGroupBy] = useState("category");
  const [sortBy, setSortBy] = useState("id");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  const sortedPoems = useMemo(() => {
    const sorted = [...poems];
    if (sortBy === "id") {
      sorted.sort((a, b) => Number(a.id) - Number(b.id));
    } else if (sortBy === "title") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "category") {
      sorted.sort((a, b) => {
        const catA = categoryOrder.indexOf(a.category);
        const catB = categoryOrder.indexOf(b.category);
        if (catA !== catB) return catA - catB;
        return Number(a.id) - Number(b.id);
      });
    }
    return sorted;
  }, [poems, sortBy, categoryOrder]);

  const groupedPoems = useMemo(() => {
    if (groupBy === "none") {
      return { "All Poems": sortedPoems };
    }
    return groupByCategory(sortedPoems, categoryOrder);
  }, [sortedPoems, groupBy, categoryOrder]);

  if (!isOpen) return null;

  const handlePoemClick = (poem) => {
    const idx = poems.findIndex((p) => p.id === poem.id);
    onSelectPoem(idx, poems);
    onClose();
  };

  return (
    <div className="index-modal-overlay" onClick={onClose}>
      <div className="index-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="index-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="index-modal-header">
          <h2 className="index-modal-title">Index</h2>
          <div className="index-controls">
            <div className="index-toggle-group">
              <span className="index-toggle-label">Group</span>
              <div className="index-toggle">
                <button
                  className={`index-toggle-btn ${
                    groupBy === "category" ? "active" : ""
                  }`}
                  onClick={() => setGroupBy("category")}
                >
                  Category
                </button>
                <button
                  className={`index-toggle-btn ${
                    groupBy === "none" ? "active" : ""
                  }`}
                  onClick={() => setGroupBy("none")}
                >
                  None
                </button>
              </div>
            </div>
            <div className="index-toggle-group">
              <span className="index-toggle-label">Sort</span>
              <div className="index-toggle">
                <button
                  className={`index-toggle-btn ${
                    sortBy === "id" ? "active" : ""
                  }`}
                  onClick={() => setSortBy("id")}
                >
                  #
                </button>
                <button
                  className={`index-toggle-btn ${
                    sortBy === "title" ? "active" : ""
                  }`}
                  onClick={() => setSortBy("title")}
                >
                  A-Z
                </button>
                <button
                  className={`index-toggle-btn ${
                    sortBy === "category" ? "active" : ""
                  }`}
                  onClick={() => setSortBy("category")}
                >
                  Cat
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="index-modal-content">
          {Object.entries(groupedPoems).map(([category, catPoems]) => (
            <div key={category} className="index-category-group">
              {groupBy === "category" && (
                <h3 className="index-category-header">
                  {category}
                  <span className="index-category-count">
                    {catPoems.length}
                  </span>
                </h3>
              )}
              <ul className="index-poem-list">
                {catPoems.map((poem) => (
                  <li
                    key={poem.id}
                    className="index-poem-item"
                    onClick={() => handlePoemClick(poem)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handlePoemClick(poem);
                      }
                    }}
                  >
                    <span className="index-poem-number">{poem.id}</span>
                    <span className="index-poem-title">{poem.title}</span>
                    {groupBy === "none" && (
                      <span className="index-poem-category">
                        {poem.category}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [poems, setPoems] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [bookMeta, setBookMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [currentCat, setCurrentCat] = useState("All");
  const [sortBy, setSortBy] = useState("id"); // Default to numbered
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerPoems, setReaderPoems] = useState([]);
  const [readerStart, setReaderStart] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showIndex, setShowIndex] = useState(false);

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/book_categorized.json")
      .then((res) => res.json())
      .then((data) => {
        const poemsArray = data.poems || [];
        const poemsWithCategory = poemsArray.filter(
          (poem) =>
            poem.title?.trim() && poem.body?.trim() && poem.category?.trim()
        );
        setPoems(poemsWithCategory);

        if (data.categories?.length > 0) {
          setCategoryOrder(data.categories);
        } else {
          const extractedCats = [
            ...new Set(
              poemsWithCategory.map((p) => p.category).filter(Boolean)
            ),
          ];
          setCategoryOrder(extractedCats);
        }

        if (data.meta) setBookMeta(data.meta);
      })
      .catch((err) => console.error("Failed to load poems:", err));
  }, []);

  const filtered = useMemo(() => {
    return poems.filter(
      (poem) =>
        (poem.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (poem.body || "").toLowerCase().includes(search.toLowerCase()) ||
        (poem.category || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [poems, search]);

  const byCat = useMemo(
    () => groupByCategory(filtered, categoryOrder),
    [filtered, categoryOrder]
  );

  const categories = useMemo(() => {
    return categoryOrder.filter((cat) => byCat[cat]?.length > 0);
  }, [categoryOrder, byCat]);

  const allCat = ["All", ...categories];

  // Compute displayed poems based on filter and sort
  const displayData = useMemo(() => {
    let poemsToShow = currentCat === "All" ? filtered : byCat[currentCat] || [];

    if (sortBy === "id") {
      // Flat list sorted by ID
      const sorted = [...poemsToShow].sort(
        (a, b) => Number(a.id) - Number(b.id)
      );
      return { type: "flat", poems: sorted };
    } else {
      // Grouped by category
      if (currentCat === "All") {
        return {
          type: "grouped",
          groups: groupByCategory(poemsToShow, categoryOrder),
        };
      } else {
        // Single category - show as flat list
        return { type: "flat", poems: poemsToShow };
      }
    }
  }, [currentCat, filtered, byCat, sortBy, categoryOrder]);

  function handlePoemClick(index, groupPoems) {
    setReaderPoems(groupPoems);
    setReaderStart(index);
    setReaderOpen(true);
  }

  return (
    <div className="page-wrapper">
      <WordCloudBackground poems={poems} />

      <div className="app-root">
        {/* Top buttons */}
        <div className="top-buttons">
          <button
            className="top-button"
            onClick={() => setShowIndex(true)}
            aria-label="Index"
            title="Index"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
          <button
            className="top-button"
            onClick={() => setShowInfo(true)}
            aria-label="About this book"
            title="About this book"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
        </div>

        {/* Header */}
        <span className="flourish-container">
          <img
            src={process.env.PUBLIC_URL + "/flurish.svg"}
            alt=""
            className="flourish-img"
          />
        </span>

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

        {/* Category pills with integrated sort */}
        <div className="filter-row">
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
          <div className="sort-control">
            <span className="sort-label">Sort:</span>
            <button
              className={`sort-option ${sortBy === "id" ? "active" : ""}`}
              onClick={() => setSortBy("id")}
              title="Sort by number"
            >
              1-220
            </button>
            <button
              className={`sort-option ${sortBy === "category" ? "active" : ""}`}
              onClick={() => setSortBy("category")}
              title="Group by category"
            >
              By Category
            </button>
          </div>
        </div>

        {/* Poem Grid */}
        <div className="poem-list-root">
          {displayData.type === "flat" && displayData.poems.length === 0 && (
            <div className="no-poems">No poems found.</div>
          )}

          {displayData.type === "grouped"
            ? // Grouped by category
              Object.entries(displayData.groups).map(([cat, catPoems]) =>
                catPoems?.length ? (
                  <div key={cat} className="category-group">
                    <h2 className="cat-header">
                      <span className="cat-header-text">{cat}</span>
                      <span className="cat-header-count">
                        {catPoems.length}
                      </span>
                    </h2>
                    <div>
                      {catPoems.map((poem, i) => (
                        <div
                          className="poem-card"
                          key={poem.id + "-" + poem.title}
                          tabIndex={0}
                          onClick={() => handlePoemClick(i, catPoems)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handlePoemClick(i, catPoems);
                            }
                          }}
                          role="button"
                        >
                          <div className="poem-meta">
                            <span className="poem-chip">
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
            : // Flat list
              displayData.poems.map((poem, i) => (
                <div
                  className="poem-card"
                  key={poem.id + "-" + poem.title}
                  tabIndex={0}
                  onClick={() => handlePoemClick(i, displayData.poems)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handlePoemClick(i, displayData.poems);
                    }
                  }}
                  role="button"
                >
                  <div className="poem-meta">
                    <span className="poem-chip">
                      {currentCat === "All" && (
                        <>
                          <span className="poem-cat">{poem.category}</span>
                          <span className="poem-dot"> · </span>
                        </>
                      )}
                      <span className="poem-num">{poem.id}</span>
                    </span>
                  </div>
                  <div className="poem-title">{poem.title}</div>
                  {poem.date && <div className="poem-date">{poem.date}</div>}
                  <pre className="poem-body">{poem.body}</pre>
                </div>
              ))}
        </div>

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
      </div>

      {/* Modals */}
      {readerOpen && (
        <PoemReader
          poems={readerPoems}
          startIndex={readerStart}
          onClose={() => setReaderOpen(false)}
        />
      )}
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
      <IndexModal
        isOpen={showIndex}
        onClose={() => setShowIndex(false)}
        poems={poems}
        categoryOrder={categoryOrder}
        onSelectPoem={handlePoemClick}
      />
    </div>
  );
}

export default App;
