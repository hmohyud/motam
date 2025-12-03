import React, { useMemo, useState, useEffect } from "react";

export default function WordCloudBackground({
  wordCloudData = null,
  debug = false,
  mobileBreakpoint = 600,
}) {
  const [height, setHeight] = useState(2000);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= mobileBreakpoint
  );

  // Check for mobile on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= mobileBreakpoint);
    };

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mobileBreakpoint]);

  // Measure content height
  useEffect(() => {
    if (isMobile) return;

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
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, [isMobile]);

  // Build chunks from pre-generated data
  const chunks = useMemo(() => {
    if (!wordCloudData?.words?.length || isMobile) return [];

    const { words, totalRows, config } = wordCloudData;
    const cols = config?.cols || 4;
    const density = config?.density || 3;

    // Calculate row height based on current page height
    const rows = Math.max(4, Math.ceil((height / 100) * density));
    const rowH = height / rows;

    // Chunk into ~500px sections
    const chunkHeight = 500;
    const rowsPerChunk = Math.max(1, Math.floor(chunkHeight / rowH));
    const numChunks = Math.ceil(rows / rowsPerChunk);

    // Only use words up to current height
    const maxWordIndex = rows * cols;

    const result = [];

    for (let c = 0; c < numChunks; c++) {
      const startRow = c * rowsPerChunk;
      const endRow = Math.min(startRow + rowsPerChunk, rows);
      const chunkTop = startRow * rowH;
      const chunkHeightPx = (endRow - startRow) * rowH;

      const chunkWords = [];
      for (let row = startRow; row < endRow; row++) {
        for (let col = 0; col < cols; col++) {
          const i = row * cols + col;
          if (i >= words.length || i >= maxWordIndex) continue;

          const w = words[i];
          // Calculate y position relative to chunk
          const y = (row - startRow) * rowH + w.yOffset * rowH + 15;

          chunkWords.push({
            ...w,
            y,
          });
        }
      }

      result.push({
        id: `chunk-${c}`,
        top: chunkTop,
        height: chunkHeightPx,
        words: chunkWords,
      });
    }

    return result;
  }, [wordCloudData, height, isMobile]);

  // Don't render on mobile or if no data
  if (isMobile || !chunks.length) return null;

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
                left: `${w.x}%`,
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
