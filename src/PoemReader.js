import React, { useState, useEffect, useCallback } from "react";
import "./PoemReader.css";

// Helper to get field value (supports both uppercase CSV and lowercase JSON)
const getField = (item, field) => {
  if (!item) return "";
  const lower = field.toLowerCase();
  const upper = field.charAt(0).toUpperCase() + field.slice(1);
  return item[lower] || item[upper] || "";
};

export default function PoemReader({ poems = [], startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState(null); // 'next' or 'prev'

  const poem = poems[index] || {};
  const title = getField(poem, "title");
  const body = getField(poem, "body");
  const date = getField(poem, "date");
  const category = getField(poem, "category");
  const id = getField(poem, "id");

  const canGoPrev = index > 0;
  const canGoNext = index < poems.length - 1;

  const goNext = useCallback(() => {
    if (!canGoNext || isAnimating) return;
    setDirection("next");
    setIsAnimating(true);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setIsAnimating(false);
    }, 150);
  }, [canGoNext, isAnimating]);

  const goPrev = useCallback(() => {
    if (!canGoPrev || isAnimating) return;
    setDirection("prev");
    setIsAnimating(true);
    setTimeout(() => {
      setIndex((i) => i - 1);
      setIsAnimating(false);
    }, 150);
  }, [canGoPrev, isAnimating]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Touch swipe handling
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goNext();
    } else if (isRightSwipe) {
      goPrev();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className="poem-reader-overlay" onClick={handleBackdropClick}>
      <div
        className={`poem-reader ${isAnimating ? `animating-${direction}` : ""}`}
      >
        {/* Close button */}
        <button
          className="poem-reader-close"
          onClick={onClose}
          aria-label="Close"
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
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Navigation - Previous */}
        <button
          className={`poem-reader-nav poem-reader-prev ${
            !canGoPrev ? "disabled" : ""
          }`}
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label="Previous poem"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {/* Poem content */}
        <div
          className="poem-reader-content"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="poem-reader-header">
            {category && (
              <span className="poem-reader-category">{category}</span>
            )}
            {id && <span className="poem-reader-number">№ {id}</span>}
          </div>

          <h1 className="poem-reader-title">{title}</h1>

          {date && <p className="poem-reader-date">{date}</p>}

          <div className="poem-reader-body-wrapper">
            <pre className="poem-reader-body">{body}</pre>
          </div>

          <div className="poem-reader-footer">
            <span className="poem-reader-progress">
              {index + 1} of {poems.length}
            </span>
          </div>
        </div>

        {/* Navigation - Next */}
        <button
          className={`poem-reader-nav poem-reader-next ${
            !canGoNext ? "disabled" : ""
          }`}
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="Next poem"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
}
