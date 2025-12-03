import React, { useMemo, useState, useEffect, useRef } from "react";

// Stop words
const STOP = new Set([
  "the",
  "and",
  "a",
  "to",
  "of",
  "in",
  "is",
  "it",
  "that",
  "i",
  "you",
  "for",
  "on",
  "with",
  "as",
  "at",
  "this",
  "but",
  "be",
  "by",
  "or",
  "an",
  "from",
  "are",
  "was",
  "were",
  "so",
  "if",
  "not",
  "no",
  "me",
  "my",
  "we",
  "our",
  "your",
  "they",
  "them",
  "his",
  "her",
  "its",
  "all",
  "can",
  "will",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "just",
  "very",
  "only",
  "one",
  "would",
  "could",
  "should",
  "into",
  "more",
  "been",
  "being",
  "each",
  "which",
  "their",
  "there",
  "these",
  "those",
  "then",
  "than",
  "what",
  "when",
  "where",
]);

function extractWords(text, count = 80) {
  const words = (text || "").toLowerCase().match(/[a-z]{3,}/g) || [];
  const freq = {};
  for (const w of words) {
    if (!STOP.has(w)) freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count);
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h;
}

function seeded(seed) {
  return (((Math.sin(seed) * 10000) % 1) + 1) % 1;
}

export default function WordCloudBackground({
  poems = [],
  density = 3,
  sizeRange = [14, 64],
  wordCount = 80,
  opacity = [0.04, 0.12],
  debug = false,
}) {
  const [height, setHeight] = useState(2000);
  const [visible, setVisible] = useState(false);

  // Measure content height
  useEffect(() => {
    const measure = () => {
      const appRoot = document.querySelector(".app-root");
      const h = Math.max(
        appRoot?.offsetHeight || 0,
        appRoot?.scrollHeight || 0,
        window.innerHeight
      );
      if (h > 100) setHeight(h);
    };

    measure();
    const timers = [100, 500, 1000, 2000].map((ms) => setTimeout(measure, ms));
    window.addEventListener("resize", measure);

    let ro;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(measure);
      const appRoot = document.querySelector(".app-root");
      if (appRoot) ro.observe(appRoot);
    }

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, [poems]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const fullText = useMemo(() => {
    if (!poems?.length) return "";
    return poems
      .map((p) => `${p?.title || p?.Title || ""} ${p?.body || p?.Body || ""}`)
      .join(" ");
  }, [poems]);

  const wordList = useMemo(
    () => extractWords(fullText, wordCount),
    [fullText, wordCount]
  );

  // Generate words grouped into chunks for content-visibility optimization
  const chunks = useMemo(() => {
    if (!wordList.length) return [];

    const maxFreq = wordList[0]?.[1] || 1;
    const minFreq = wordList[wordList.length - 1]?.[1] || 1;
    const range = maxFreq - minFreq || 1;

    // Grid parameters
    const rows = Math.max(4, Math.ceil((height / 100) * density));
    const cols = 4;
    const rowH = height / rows;
    const colW = 100 / cols;

    // Chunk size: group words into sections of ~500px height
    const chunkHeight = 500;
    const rowsPerChunk = Math.max(1, Math.floor(chunkHeight / rowH));
    const numChunks = Math.ceil(rows / rowsPerChunk);

    if (debug) {
      console.log(
        `[WordCloud] Height: ${height}, Rows: ${rows}, Chunks: ${numChunks}, RowsPerChunk: ${rowsPerChunk}`
      );
    }

    const result = [];

    for (let c = 0; c < numChunks; c++) {
      const startRow = c * rowsPerChunk;
      const endRow = Math.min(startRow + rowsPerChunk, rows);
      const chunkTop = startRow * rowH;
      const chunkHeightPx = (endRow - startRow) * rowH;

      const words = [];
      for (let row = startRow; row < endRow; row++) {
        for (let col = 0; col < cols; col++) {
          const i = row * cols + col;
          const wi =
            (i * 7 + Math.floor(i / wordList.length) * 3) % wordList.length;
          const [word, freq] = wordList[wi];
          const h = hash(word + i);
          const norm = (freq - minFreq) / range;

          // Position relative to chunk
          const y = (row - startRow) * rowH + seeded(h * 2) * rowH * 0.75 + 15;

          words.push({
            key: `w${i}`,
            word,
            x: col * colW + colW * 0.1 + seeded(h) * colW * 0.8,
            y,
            size: Math.round(
              sizeRange[0] + Math.pow(norm, 0.7) * (sizeRange[1] - sizeRange[0])
            ),
            opacity: opacity[0] + norm * (opacity[1] - opacity[0]),
            rotate: Math.round((seeded(h * 3) - 0.5) * 18),
            dur: 14 + Math.round(seeded(h * 4) * 20),
            del: seeded(h * 5) * 2,
          });
        }
      }

      result.push({
        id: `chunk-${c}`,
        top: chunkTop,
        height: chunkHeightPx,
        words,
      });
    }

    return result;
  }, [wordList, height, density, sizeRange, opacity, debug]);

  if (!chunks.length) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: height,
        pointerEvents: "none",
        zIndex: 0,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}
    >
      {debug && (
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            background: "black",
            color: "lime",
            padding: "5px 10px",
            fontSize: 12,
            fontFamily: "monospace",
            zIndex: 9999,
          }}
        >
          H:{height} | Chunks:{chunks.length} | Words:
          {chunks.reduce((a, c) => a + c.words.length, 0)}
        </div>
      )}

      <style>{`
        @keyframes wcFloat {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-4px) }
        }
        .wc-chunk {
          position: absolute;
          left: 0;
          right: 0;
          content-visibility: auto;
          contain-intrinsic-size: auto 500px;
        }
        .wc-w {
          position: absolute;
          font-family: 'Caveat', cursive;
          text-shadow: 0 1px 3px rgba(255,255,255,0.5);
          animation: wcFloat var(--d) ease-in-out infinite;
          animation-delay: var(--l);
        }
      `}</style>

      {chunks.map((chunk) => (
        <div
          key={chunk.id}
          className="wc-chunk"
          style={{
            top: chunk.top,
            height: chunk.height,
          }}
        >
          {chunk.words.map((w) => (
            <span
              key={w.key}
              className="wc-w"
              style={{
                left: `${w.x-3}%`,
                top: w.y,
                fontSize: w.size,
                color: `rgba(100, 125, 115, ${w.opacity})`,
                transform: `rotate(${w.rotate}deg)`,
                "--d": `${w.dur}s`,
                "--l": `${w.del}s`,
              }}
            >
              {w.word}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
