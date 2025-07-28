import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import "./Stack.css";

// Card component: receives an x motion value for animation/drag
function Card({ item, isFront, onSwiped, x }) {
  const rotate = useTransform(x, [-180, 180], [-18, 18]);
  const opacity = useTransform(x, [-180, 0, 180], [0, 1, 0]);

  function handleDragEnd(_, info) {
    if (Math.abs(info.offset.x) > 90) {
      onSwiped(info.offset.x > 0 ? "right" : "left");
    } else {
      x.set(0);
    }
  }

  return (
    <motion.div
      className="card stack-card"
      style={{
        position: "absolute",
        x,
        opacity,
        rotate,
        zIndex: isFront ? 2 : 1,
        boxShadow: isFront
          ? "0 20px 32px -8px rgba(0,0,0,.11)"
          : "0 6px 18px 0 rgba(90, 110, 150, 0.09)",
        background: "#fff",
        cursor: isFront ? "grab" : "default",
        minWidth: 260,
        maxWidth: 540,
        minHeight: 140,
        maxHeight: "72vh",
        padding: "24px 22px 20px 22px",
        margin: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        boxSizing: "border-box",
      }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.56}
      whileTap={{ cursor: "grabbing" }}
      onDragEnd={isFront ? handleDragEnd : undefined}
      initial={{ scale: isFront ? 1 : 0.97, y: isFront ? 0 : 18 }}
      animate={{ scale: isFront ? 1 : 0.97, y: isFront ? 0 : 18 }}
      exit={{ opacity: 0, scale: 0.9, y: -30 }}
      transition={{ type: "tween", duration: 0.09 }}
    >
      <div className="poem-title">{item.Title}</div>
      <pre className="poem-body">{item.Body}</pre>
    </motion.div>
  );
}

// Category Switcher: Modern pill dropdown (unchanged)
function CategorySwitcher({ category, categories, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        display: "inline-block",
        zIndex: 120,
        minWidth: 100,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="category-switcher-btn"
        style={{
          border: "none",
          borderRadius: 18,
          background: "#f3fbf5",
          color: "#31724a",
          fontWeight: 700,
          fontSize: "1.09rem",
          padding: "7px 34px 7px 20px",
          boxShadow: open
            ? "0 2px 12px 0 rgba(110,170,120,0.12)"
            : "0 1.5px 4px 0 rgba(140,190,120,0.07)",
          cursor: "pointer",
          outline: open ? "2px solid #6ac2a0" : "none",
          transition: "box-shadow 0.16s, outline 0.15s",
          display: "flex",
          alignItems: "center",
          minWidth: 100,
          position: "relative",
          userSelect: "none",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ flex: 1 }}>{category}</span>
        <svg
          style={{
            marginLeft: 10,
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            opacity: 0.74,
            pointerEvents: "none",
          }}
          width={16}
          height={16}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M7 8l3 3 3-3"
            stroke="#31724a"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          className="category-switcher-dropdown"
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            minWidth: "100%",
            background: "#fff",
            borderRadius: 15,
            boxShadow:
              "0 2px 12px 0 rgba(130,170,150,0.12), 0 0.5px 3px 0 rgba(110,190,120,0.04)",
            padding: "4px 0",
            zIndex: 200,
          }}
          role="listbox"
        >
          {categories.map(
            (cat) =>
              cat !== category && (
                <div
                  key={cat}
                  className="category-switcher-item"
                  style={{
                    padding: "8px 28px 8px 19px",
                    cursor: "pointer",
                    color: "#29734e",
                    fontWeight: 600,
                    fontSize: "1.01rem",
                    background: "none",
                    border: "none",
                    transition: "background 0.13s, color 0.13s",
                    borderRadius: 11,
                    margin: "1px 0",
                  }}
                  onClick={() => {
                    onChange(cat);
                    setOpen(false);
                  }}
                  onMouseDown={(e) => e.preventDefault()} // Don't blur button
                  role="option"
                  aria-selected={cat === category}
                  tabIndex={0}
                >
                  {cat}
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}

export default function Stack({
  cardsData = [],
  startIndex = 0,
  allCategories = [],
  onCategoryChange, // (category: string) => void
  onClose,
}) {
  const [index, setIndex] = useState(startIndex);

  // Shared x value for both cards (top and next)
  const x = useMotionValue(0);

  // Always define transforms regardless of which card is shown (to satisfy React hooks rules)
  const nextCardOpacity = useTransform(x, [0, -120, -220], [0, 0.48, 1]);
  const nextCardScale = useTransform(x, [0, -120, -220], [0.96, 1, 1]);

  // Use current card's category (if stack is not empty)
  const category = cardsData.length > 0 ? cardsData[index]?.Category : "";

  useEffect(() => {
    if (index > cardsData.length - 1) setIndex(cardsData.length - 1);
    if (index < 0 && cardsData.length > 0) setIndex(0);
  }, [cardsData, index]);

  function next() {
    setIndex((i) => (i < cardsData.length - 1 ? i + 1 : i));
    x.set(0);
  }
  function prev() {
    setIndex((i) => (i > 0 ? i - 1 : i));
    x.set(0);
  }
  function handleSwiped(direction) {
    if (direction === "right") prev();
    else next();
  }

  useEffect(() => {
    function handler(e) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape" && onClose) onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, cardsData.length, onClose]);

  if (!cardsData.length) return null;

  // --- RENDER ---
  return (
    <div
      className="stack-outer-flex"
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        top: 0,
        left: 0,
        background: "rgba(248,250,248,0.97)",
        zIndex: 60,
      }}
      tabIndex={-1}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        aria-label="Close stack mode"
        style={{
          position: "fixed",
          top: 18,
          right: 24,
          zIndex: 120,
          background: "#eaeaea",
          border: "none",
          borderRadius: 8,
          padding: "8px 18px",
          fontWeight: 600,
          fontSize: 18,
          color: "#354",
          boxShadow: "0 1.5px 8px #c6e3d2a3",
          cursor: "pointer",
        }}
      >
        Close
      </button>

      {/* Fixed category/number bar */}
      <div
        className="stack-fixed-info"
        style={{
          position: "fixed",
          top: 22,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 110,
          background: "rgba(250,250,250,0.93)",
          borderRadius: 16,
          padding: "8px 28px 8px 28px",
          boxShadow: "0 2px 8px 0 rgba(130,170,150,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 20,
          fontWeight: 700,
          fontSize: "1.13rem",
          color: "#315a35",
          letterSpacing: ".03em",
          userSelect: "none",
        }}
      >
        <CategorySwitcher
          category={category}
          categories={allCategories}
          onChange={(cat) => {
            onCategoryChange?.(cat);
            setIndex(0);
            x.set(0);
          }}
        />
        <span
          style={{
            fontWeight: 500,
            fontSize: "1.04rem",
            color: "#29413a",
            marginLeft: 6,
          }}
        >
          {index + 1} / {cardsData.length}
        </span>
      </div>

      {/* Stack Card and Arrows */}
      <div
        className="stack-container"
        style={{
          minWidth: "60%",
          maxWidth: 550,
          minHeight: 180,
          maxHeight: "74vh",
          width: "auto",
          background: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* Arrows */}
        <button
          className="stack-arrow stack-arrow-left"
          onClick={prev}
          disabled={index === 0}
          aria-label="Previous"
          style={{
            position: "absolute",
            left: -48,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 5,
            fontSize: 32,
            opacity: index === 0 ? 0.2 : 0.7,
            pointerEvents: index === 0 ? "none" : "auto",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          &#8592;
        </button>
        <button
          className="stack-arrow stack-arrow-right"
          onClick={next}
          disabled={index === cardsData.length - 1}
          aria-label="Next"
          style={{
            position: "absolute",
            right: -48,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 5,
            fontSize: 32,
            opacity: index === cardsData.length - 1 ? 0.2 : 0.7,
            pointerEvents: index === cardsData.length - 1 ? "none" : "auto",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          &#8594;
        </button>
        {/* Card */}
        <div
          className="stack-card-outer"
          style={{
            width: "100%",
            minHeight: 140,
            maxWidth: 540,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            position: "relative",
          }}
        >
          {/* Next card (peek in as you drag left) */}
          {index < cardsData.length - 1 && (
            <motion.div
              className="card stack-card"
              style={{
                position: "absolute",
                zIndex: 1,
                minWidth: 260,
                maxWidth: 540,
                minHeight: 140,
                maxHeight: "72vh",
                padding: "24px 22px 20px 22px",
                background: "#f7f7f7",
                boxShadow: "0 8px 28px 0 rgba(60, 100, 90, 0.09)",
                pointerEvents: "none",
                opacity: nextCardOpacity,
                scale: nextCardScale,
                x: 0,
              }}
              transition={{ type: "tween", duration: 0.09 }}
            >
              <div className="poem-title">{cardsData[index + 1]?.Title}</div>
              <pre className="poem-body">{cardsData[index + 1]?.Body}</pre>
            </motion.div>
          )}

          {/* Front card (draggable) */}
          <AnimatePresence mode="wait" initial={false}>
            <Card
              key={index}
              item={cardsData[index]}
              isFront={true}
              onSwiped={handleSwiped}
              x={x}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
