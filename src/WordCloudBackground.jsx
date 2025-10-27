import React, { useEffect, useMemo, useRef, useState } from "react";

/* ---------- text utils ---------- */
const STOP = new Set([
    "the", "and", "a", "to", "of", "in", "is", "it", "that", "i", "you", "for", "on", "with", "as", "at", "this", "but", "be", "by", "or", "an", "from", "are",
    "was", "were", "so", "if", "then", "than", "into", "out", "up", "down", "over", "under", "not", "no", "yes", "me", "my", "mine", "we", "our", "ours",
    "your", "yours", "their", "theirs", "he", "she", "they", "them", "his", "her", "hers", "its", "what", "which", "who", "whom", "when", "where", "why",
    "how", "too", "very", "just", "only", "also", "all", "any", "each", "every", "few", "more", "most", "other", "some", "such", "can", "will", "shall",
    "may", "might", "must", "could", "would", "should", "been", "being", "do", "does", "did", "done", "have", "has", "had", "having", "again", "ever", "never"
]);
const tokenize = (text) =>
    (text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s'-]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .filter((w) => !STOP.has(w) && w.length > 2 && !/^\d+$/.test(w));

function countFreq(words) {
    const m = new Map();
    for (const w of words) m.set(w, (m.get(w) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
function scale(v, inMin, inMax, outMin, outMax) {
    if (inMax === inMin) return (outMin + outMax) / 2;
    const t = (v - inMin) / (inMax - inMin);
    return outMin + t * (outMax - outMin);
}

/* ---------- PRNG (seeded) ---------- */
function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function mulberry32(seed) {
    return function () {
        let t = (seed += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/* ---------- density: constant per viewport ---------- */
function placementsPerViewport({ minFont, maxFont, coveragePerViewport }) {
    const vw = window.innerWidth || 1200;
    const vh = window.innerHeight || 800;
    const avgFont = (minFont + maxFont) / 2;
    const wordW = avgFont * 3.4;
    const wordH = avgFont * 1.12;
    const wordArea = Math.max(1, wordW * wordH);
    return Math.max(1, Math.floor((vw * vh * coveragePerViewport) / wordArea));
}

/* ---------- positions per-viewport slice (blue-noise-ish) ---------- */
function bestCandidatePositionsPerViewportPx(nTotal, docHeight, seed) {
    if (!nTotal) return [];
    const rnd = mulberry32(seed);
    const vh = window.innerHeight || 800;
    const slices = Math.max(1, Math.ceil(docHeight / vh));
    const base = Math.floor(nTotal / slices);
    let rem = nTotal - base * slices;

    const pts = [];
    const dist2 = (a, b, sliceH) => {
        const dx = a.x - b.x;
        const dy = (a.y - b.y) / sliceH;
        return dx * dx + dy * dy;
    };

    for (let s = 0; s < slices; s++) {
        const y0 = s * vh;
        const y1 = Math.min((s + 1) * vh, docHeight);
        const sliceH = Math.max(1, y1 - y0);
        const count = base + (rem > 0 ? 1 : 0);
        if (rem > 0) rem--;

        const local = [];
        const k = 14;
        for (let i = 0; i < count; i++) {
            let best = null, bestMinD = -1;
            for (let c = 0; c < k; c++) {
                const cand = { x: rnd(), y: y0 + rnd() * sliceH };
                let minD = Infinity;
                for (let j = 0; j < local.length; j++) {
                    const d2 = dist2(cand, local[j], sliceH);
                    if (d2 < minD) minD = d2;
                    if (minD === 0) break;
                }
                if (local.length === 0) minD = Infinity;
                if (minD > bestMinD) { bestMinD = minD; best = cand; }
            }
            local.push(best || { x: rnd(), y: y0 + rnd() * sliceH });
        }
        pts.push(...local);
    }

    return pts.map(p => ({ leftPct: Math.round(p.x * 100), docY: Math.round(p.y) }));
}

/* ---------- debounced scrollY ---------- */
function useDebouncedScrollY(delay = 16) {
    const [scrollY, setScrollY] = useState(() => window.scrollY || 0);
    const tRef = useRef(null);

    useEffect(() => {
        const onScroll = () => {
            if (tRef.current) clearTimeout(tRef.current);
            tRef.current = setTimeout(() => {
                setScrollY(window.scrollY || 0);
            }, delay);
        };
        const onResize = onScroll;

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onResize);
            if (tRef.current) clearTimeout(tRef.current);
        };
    }, [delay]);

    return scrollY;
}

/* ---------- component ---------- */
export default function WordCloudBackground({
    poems = null,
    fontFamily = "'Caveat', cursive",
    minFont = 28,
    maxFont = 84,
    coveragePerViewport = 0.22,
    repeatWeighted = true,
    scrollDebounceMs = 16,
}) {
    const scrollY = useDebouncedScrollY(scrollDebounceMs);

    /* ----- visible text source (props or IO) ----- */
    const [visibleText, setVisibleText] = useState("");

    useEffect(() => {
        if (poems && poems.length) {
            const chunks = [];
            for (const p of poems) {
                if (p?.Title) chunks.push(p.Title, p.Title);
                if (p?.Body) chunks.push(p.Body);
                if (p?.Category) chunks.push(p.Category);
            }
            setVisibleText(chunks.join(" "));
            return;
        }

        const io = new IntersectionObserver((entries) => {
            const onScreen = entries.filter(e => e.isIntersecting).map(e => e.target);
            const combined = onScreen.map((el) => {
                const title = el.querySelector(".poem-title")?.textContent || "";
                const body = el.querySelector(".poem-body")?.textContent || el.textContent || "";
                return `${title}\n${body}`;
            }).join("\n\n");
            setVisibleText(combined || "");
        }, { root: null, rootMargin: "0px 0px -12% 0px", threshold: 0.12 });

        const cards = Array.from(document.querySelectorAll(".poem-card"));
        cards.forEach((el) => io.observe(el));

        // initial snapshot
        const vh = window.innerHeight || 800;
        const initial = cards.filter((el) => {
            const r = el.getBoundingClientRect();
            const overlap = Math.min(r.bottom, vh) - Math.max(r.top, 0);
            return overlap > r.height * 0.12;
        }).map((el) => {
            const title = el.querySelector(".poem-title")?.textContent || "";
            const body = el.querySelector(".poem-body")?.textContent || el.textContent || "";
            return `${title}\n${body}`;
        }).join("\n\n");
        if (initial) setVisibleText(initial);

        return () => io.disconnect();
    }, [poems]);

    /* ----- word frequencies & target count ----- */
    const freqUniques = useMemo(() => countFreq(tokenize(visibleText)), [visibleText]);

    const perViewport = useMemo(() => {
        return placementsPerViewport({ minFont, maxFont, coveragePerViewport });
    }, [minFont, maxFont, coveragePerViewport]);

    const docHeight = useMemo(() => {
        const de = document.documentElement;
        const body = document.body || {};
        return Math.max(
            de.scrollHeight, de.offsetHeight, de.clientHeight,
            body.scrollHeight || 0, body.offsetHeight || 0
        );
    }, [visibleText]);

    const targetCount = useMemo(() => {
        const vh = window.innerHeight || 800;
        const slices = Math.max(1, Math.ceil(docHeight / vh));
        return Math.max(1, perViewport * slices);
    }, [docHeight, perViewport]);

    /* ----- placements (unique once, then weighted fill) ----- */
    const placements = useMemo(() => {
        if (!freqUniques.length || targetCount <= 0) return [];

        const uniqueOnce = freqUniques.map(([w, c]) => [w, c]);
        if (!repeatWeighted || uniqueOnce.length >= targetCount) {
            return uniqueOnce.slice(0, targetCount);
        }

        const remaining = targetCount - uniqueOnce.length;
        const totalWeight = freqUniques.reduce((s, [, c]) => s + c, 0);
        const cum = [];
        let acc = 0;
        for (const [w, c] of freqUniques) { acc += c / Math.max(1, totalWeight); cum.push([w, acc, c]); }

        const seed = hashString(visibleText.slice(0, 4096));
        const rand = mulberry32(seed);

        function pickWeighted() {
            const r = rand();
            let lo = 0, hi = cum.length - 1, ans = hi;
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                if (r <= cum[mid][1]) { ans = mid; hi = mid - 1; } else { lo = mid + 1; }
            }
            const chosen = cum[ans] || cum[cum.length - 1];
            const [word, , count] = chosen;
            return [word, count];
        }

        const filled = [];
        for (let i = 0; i < remaining; i++) filled.push(pickWeighted());
        return uniqueOnce.concat(filled);
    }, [freqUniques, targetCount, repeatWeighted, visibleText]);

    /* ----- positions & final display ----- */
    const cloudPositions = useMemo(() => {
        const seed = hashString(visibleText.slice(0, 2048)) ^ placements.length;
        return bestCandidatePositionsPerViewportPx(placements.length, docHeight, seed);
    }, [placements.length, docHeight, visibleText]);

    const display = useMemo(() => {
        if (!placements.length) return [];
        const counts = placements.map(([, c]) => c);
        const maxC = Math.max(...counts), minC = Math.min(...counts);

        return placements.map(([word, count], i) => {
            const fontSize = Math.round(scale(count, minC, maxC, minFont, maxFont));
            const pos = cloudPositions[i] || { leftPct: 50, docY: 0 };
            const seed = hashString(`${word}:${i}`);
            const r = mulberry32(seed);
            const rotate = Math.round((r() - 0.5) * 10);
            const duration = Math.round(22 + r() * 18);
            const delay = Math.round(r() * 16);
            const opacity = scale(count, minC, maxC, 0.10, 0.26);
            return { id: `${word}-${i}`, word, fontSize, leftPct: pos.leftPct, docY: pos.docY, rotate, duration, delay, opacity };
        });
    }, [placements, cloudPositions, minFont, maxFont]);

    /* ----- two-layer crossfade with transitionend (prevents pop) ----- */
    const [flip, setFlip] = useState(false);
    const prevRef = useRef(display);
    const layerARef = useRef(null);
    const layerBRef = useRef(null);
    const overlayRef = useRef(null);

    // Flip when display changes
    useEffect(() => { setFlip(f => !f); }, [display]);

    // After the fading-out layer finishes opacity transition, update snapshot.
    useEffect(() => {
        const fadingOutEl = flip ? layerBRef.current : layerARef.current;
        if (!fadingOutEl) return;
        const onEnd = (e) => {
            if (e.target !== fadingOutEl) return;
            if (e.propertyName !== "opacity") return;
            prevRef.current = display;
        };
        fadingOutEl.addEventListener("transitionend", onEnd);
        return () => fadingOutEl.removeEventListener("transitionend", onEnd);
    }, [display, flip]);

    const layerA = flip ? display : (prevRef.current || []);
    const layerB = flip ? (prevRef.current || []) : display;
    useEffect(() => {
        const root = overlayRef.current;
        if (!root) return;

        // Collect word elements from both layers, map id -> element list (A and B)
        const wordEls = new Map();
        const collect = () => {
            for (const el of root.querySelectorAll(".wc-word")) {
                // Compose a stable-ish key per visual instance in both layers
                const key = `${el.textContent}|${el.style.fontSize}|${el.style.left}`;
                const arr = wordEls.get(key) || [];
                arr.push(el);
                wordEls.set(key, arr);
            }
        };
        collect();

        const getVH = () => window.innerHeight || 800;
        let raf = 0;

        const loop = () => {
            raf = requestAnimationFrame(loop);
            // Read current scroll var once per frame
            const yStr = getComputedStyle(root).getPropertyValue("--wcScroll") || "0px";
            const scrollYNow = parseFloat(yStr) || 0;
            const topBound = scrollYNow - 200;
            const botBound = scrollYNow + getVH() + 200;

            // Toggle visibility for words outside the band
            for (const group of wordEls.values()) {
                const anyEl = group[0];
                const docY = parseFloat(anyEl.style.getPropertyValue("--docY")) || 0;
                const visible = docY >= topBound && docY <= botBound;
                for (const el of group) {
                    if (visible) {
                        el.classList.remove("is-culled");
                    } else {
                        el.classList.add("is-culled");
                    }
                }
            }
        };

        raf = requestAnimationFrame(loop);
        const onResize = () => { /* band recomputed via getVH() on next frame */ };
        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
            cancelAnimationFrame(raf);
        };
    }, []);

    // inject once: bob via CSS var, not transform
    useEffect(() => {
        if (document.getElementById("wc-float-style")) return;
        const css = `
      @keyframes wcFloat {
        0%   { --floatY: -2px; }
        50%  { --floatY:  2px; }
        100% { --floatY: -2px; }
      }
      .wc-layer { will-change: opacity; }
      .wc-word  { will-change: transform, opacity; backface-visibility: hidden; }
    `;
        const el = document.createElement("style");
        el.id = "wc-float-style";
        el.textContent = css;
        document.head.appendChild(el);
    }, []);

    return (
        <div
            ref={overlayRef}
            className="wordcloud-bg"
            aria-hidden
            style={{
                position: "fixed",
                inset: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 1,
                pointerEvents: "none",
                overflow: "hidden",
                // expose scroll to CSS as a variable
                "--wcScroll": (scrollY || 0) + "px",
            }}
        >

            {/* Layer A */}
            <div
                ref={layerARef}
                className={`wc-layer ${flip ? "fade-in" : "fade-out"}`}
                style={layerStyle}
            >
                {layerA.map((w) => (
                    <span
                        key={`A-${w.id}`}
                        className="wc-word"
                        style={{
                            // inputs to the single transform
                            "--docY": w.docY + "px",
                            "--rot": `${w.rotate}deg`,
                            "--floatY": "0px",

                            // anchor: x from left%, y computed in transform only
                            left: `${w.leftPct}%`,
                            top: 0, // keep top fixed; all vertical movement in transform

                            fontSize: `${w.fontSize}px`,
                            fontFamily,
                            position: "absolute",
                            opacity: w.opacity,

                            // authoritative transform (CSS vars -> GPU-friendly)
                            transform: `translate(-50%, 0)
                          translate3d(0, calc(var(--docY) - var(--wcScroll, 0px) + var(--floatY)), 0)
                          rotate(var(--rot))`,

                            // gentle bob that only mutates --floatY (not transform)
                            animationName: "wcFloat",
                            animationDuration: `${w.duration}s`,
                            animationDelay: `${w.delay}s`,
                            animationTimingFunction: "ease-in-out",
                            animationIterationCount: "infinite",
                        }}
                    >
                        {w.word}
                    </span>
                ))}
            </div>

            {/* Layer B */}
            <div
                ref={layerBRef}
                className={`wc-layer ${flip ? "fade-out" : "fade-in"}`}
                style={layerStyle}
            >
                {layerB.map((w) => (
                    <span
                        key={`B-${w.id}`}
                        className="wc-word"
                        style={{
                            "--docY": w.docY + "px",
                            "--rot": `${w.rotate}deg`,
                            "--floatY": "0px",

                            left: `${w.leftPct}%`,
                            top: 0,

                            fontSize: `${w.fontSize}px`,
                            fontFamily,
                            position: "absolute",
                            opacity: w.opacity,

                            transform: `translate(-50%, 0)
                          translate3d(0, calc(var(--docY) - var(--wcScroll, 0px) + var(--floatY)), 0)
                          rotate(var(--rot))`,

                            animationName: "wcFloat",
                            animationDuration: `${w.duration}s`,
                            animationDelay: `${w.delay}s`,
                            animationTimingFunction: "ease-in-out",
                            animationIterationCount: "infinite",
                        }}
                    >
                        {w.word}
                    </span>
                ))}
            </div>
        </div>
    );
}

/* inline style for the layers */
const layerStyle = {
    position: "absolute",
    inset: 0,
    transition: "opacity 1.2s cubic-bezier(.22,.61,.36,1)",
};
