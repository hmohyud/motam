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

function App() {
  const [poems, setPoems] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [bookMeta, setBookMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [currentCat, setCurrentCat] = useState("All");
  const [stackMode, setStackMode] = useState(false);
  const [stackPoems, setStackPoems] = useState([]);
  const [stackStart, setStackStart] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  function isMobile() {
    return window.innerWidth < 600;
  }

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/book_categorized.json")
      .then((res) => res.json())
      .then((data) => {
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

        if (data.meta) {
          setBookMeta(data.meta);
        }
      })
      .catch((err) => console.error("Failed to load poems:", err));
  }, []);

  const filtered = poems.filter(
    (poem) =>
      (poem.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (poem.body || "").toLowerCase().includes(search.toLowerCase()) ||
      (poem.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const byCat = groupByCategory(filtered);

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

  return (
    <div className="page-wrapper">
      <WordCloudBackground poems={poems} />

      <div className="app-root">
        {!stackMode && (
          <>
            {/* Info button */}
            <button
              className="info-button"
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

        {/* Stack Mode */}
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

      {/* Info Modal */}
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
    </div>
  );
}

export default App;
