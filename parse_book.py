import re
import json
import csv
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import argparse

SEPARATOR_RE = re.compile(r"^\s*_{5,}\s*$")

# TOC lines look like: Title<spaces>13
TOC_RE = re.compile(r"^(?P<title>.+?)\s+(?P<page>\d{1,4})\s*$")

# --- Date patterns (expanded) ---
YEAR_ONLY_RE = re.compile(r"^(1[89]\d{2}|20\d{2})$")

# 14 July 1963 / 14 Jul 1963 / 14th July 1963 / 14 July, 1963
DAY_MONTH_YEAR_RE = re.compile(
    r"^(?P<day>\d{1,2})(?:st|nd|rd|th)?\s+"
    r"(?P<mon>[A-Za-z]{3,9})\,?\s+"
    r"(?P<year>1[89]\d{2}|20\d{2})$"
)

# July 14, 1963 / Jul 14, 1963
MONTH_DAY_YEAR_RE = re.compile(
    r"^(?P<mon>[A-Za-z]{3,9})\s+"
    r"(?P<day>\d{1,2})(?:st|nd|rd|th)?\,\s*"
    r"(?P<year>1[89]\d{2}|20\d{2})$"
)

# August 1963 / Jan 1961
MONTH_YEAR_RE = re.compile(r"^(?P<mon>[A-Za-z]{3,9})\s+(?P<year>1[89]\d{2}|20\d{2})$")


def norm(s: str) -> str:
    """Normalize for matching titles robustly."""
    s = s.strip()
    # unify curly quotes and apostrophes
    s = (s.replace("“", '"').replace("”", '"')
           .replace("’", "'").replace("‘", "'"))
    # unify dashes
    s = s.replace("—", "-").replace("–", "-")
    # collapse whitespace
    s = re.sub(r"\s+", " ", s)
    return s


def is_separator_line(ln: str) -> bool:
    return bool(SEPARATOR_RE.match(ln))


def strip_wrapping_punct(line: str) -> str:
    # remove surrounding () and trailing punctuation that often appears after dates
    t = line.strip()
    if t.startswith("(") and t.endswith(")"):
        t = t[1:-1].strip()
    t = t.rstrip(" .;:,")
    return t


def looks_like_date(line: str) -> bool:
    t = norm(strip_wrapping_punct(line))
    return bool(
        YEAR_ONLY_RE.match(t)
        or DAY_MONTH_YEAR_RE.match(t)
        or MONTH_DAY_YEAR_RE.match(t)
        or MONTH_YEAR_RE.match(t)
    )


def extract_date(line: str) -> str:
    return norm(strip_wrapping_punct(line))


def pop_trailing_date(cleaned_lines: List[str]) -> Tuple[List[str], Optional[str]]:
    """
    Look at the last few *non-empty* lines of a poem chunk and extract a date if found.
    Checks last 1..6 non-empty lines for robustness.
    """
    if not cleaned_lines:
        return cleaned_lines, None

    nonempty_idx = [i for i, ln in enumerate(cleaned_lines) if ln.strip()]
    if not nonempty_idx:
        return cleaned_lines, None

    for k in range(1, min(6, len(nonempty_idx)) + 1):
        i = nonempty_idx[-k]
        if looks_like_date(cleaned_lines[i]):
            date = extract_date(cleaned_lines[i])
            new_lines = cleaned_lines[:i] + cleaned_lines[i + 1:]
            while new_lines and not new_lines[-1].strip():
                new_lines.pop()
            return new_lines, date

    return cleaned_lines, None


def parse_meta(lines: List[str]) -> Dict:
    """
    Lightweight meta extraction for your front matter.
    """
    text = "\n".join(lines[:300])
    meta: Dict = {}

    nonempty = [ln.strip() for ln in lines[:60] if ln.strip()]
    if nonempty:
        meta["bookTitle"] = nonempty[0]
    if len(nonempty) > 1:
        meta["subtitle"] = nonempty[1]

    m = re.search(r"written by\s*\n(.+)", text, flags=re.IGNORECASE)
    if m:
        meta["author"] = m.group(1).strip()

    m2 = re.search(r"\n(Fatemi Dawat Publications)\s*\n(\d{3,4}/\d{4})", text)
    if m2:
        meta["publisher"] = m2.group(1).strip()
        meta["yearHijriGregorian"] = m2.group(2).strip()

    m3 = re.search(r"Copyright\s*\n(.+)", text, flags=re.IGNORECASE)
    if m3:
        meta["copyright"] = m3.group(1).strip()

    return meta


def find_toc_with_bounds(lines: List[str]) -> Tuple[List[Dict], int, int]:
    """
    Returns (toc, poems_heading_idx, toc_end_idx_exclusive)
    """
    poems_heading_idx = -1
    for i, ln in enumerate(lines):
        if ln.strip() == "Poems":
            poems_heading_idx = i
            break
    if poems_heading_idx == -1:
        return [], -1, -1

    start = poems_heading_idx + 1
    toc: List[Dict] = []
    started = False
    toc_end = start

    for j in range(start, len(lines)):
        s = lines[j].strip()
        if not s:
            toc_end = j + 1
            continue

        m = TOC_RE.match(s)
        if m:
            started = True
            toc.append({"title": norm(m.group("title")), "page": int(m.group("page"))})
            toc_end = j + 1
            continue

        if started and toc:
            toc_end = j  # end before this line
            break
        else:
            toc_end = j + 1

    return toc, poems_heading_idx, toc_end


def find_title_indices_in_order(lines: List[str], start_idx: int, toc: List[Dict]) -> List[int]:
    """
    For each TOC entry in order, find the next line index whose normalized text == title.
    Searches only forward from the previous match.
    """
    indices: List[int] = []
    cursor = start_idx

    for item in toc:
        expected = item["title"]
        found = -1
        for i in range(cursor, len(lines)):
            s = lines[i].strip()
            if not s or is_separator_line(lines[i]):
                continue
            if norm(s) == expected:
                found = i
                break
        if found == -1:
            break
        indices.append(found)
        cursor = found + 1

    return indices


def build_sections_raw(
    lines: List[str],
    poems_heading_idx: int,
    toc_end_idx: int,
    first_poem_idx: int,
    after_last_poem_idx: int
) -> List[Dict]:
    sections = []

    if poems_heading_idx > 0:
        front = "\n".join(lines[:poems_heading_idx]).strip()
        if front:
            sections.append({"type": "front_matter_raw", "body": front})

    if poems_heading_idx != -1 and toc_end_idx != -1 and toc_end_idx > poems_heading_idx:
        toc_raw = "\n".join(lines[poems_heading_idx:toc_end_idx]).strip()
        if toc_raw:
            sections.append({"type": "toc_raw", "body": toc_raw})

    if after_last_poem_idx < len(lines):
        back = "\n".join(lines[after_last_poem_idx:]).strip()
        if back:
            sections.append({"type": "back_matter_raw", "body": back})

    return sections


def extract_poems_by_order(lines: List[str], toc: List[Dict], body_start_idx: int) -> List[Dict]:
    """
    Extract poems by TOC order: poem i goes from title_i line to title_{i+1} line.
    Also removes duplicated title lines at the start of a poem chunk.
    """
    title_indices = find_title_indices_in_order(lines, body_start_idx, toc)
    poems: List[Dict] = []
    if not title_indices:
        return poems

    for i, title_line_idx in enumerate(title_indices):
        toc_item = toc[i]
        next_title_idx = title_indices[i + 1] if i + 1 < len(title_indices) else len(lines)

        chunk_lines = lines[title_line_idx + 1: next_title_idx]

        # remove separator lines but keep blanks
        cleaned = [ln.rstrip() for ln in chunk_lines if not is_separator_line(ln)]

        # trim leading/trailing blanks
        while cleaned and not cleaned[0].strip():
            cleaned.pop(0)
        while cleaned and not cleaned[-1].strip():
            cleaned.pop()

        # --- FIX: drop repeated title lines at start of poem body (e.g., "Aqa Mohammed Burhanuddin") ---
        while cleaned and norm(cleaned[0]) == toc_item["title"]:
            cleaned.pop(0)
            while cleaned and not cleaned[0].strip():
                cleaned.pop(0)

        cleaned, date = pop_trailing_date(cleaned)

        poems.append({
            "title": toc_item["title"],
            "page": toc_item.get("page"),
            "date": date,
            "body": "\n".join(cleaned).strip(),
        })

    return poems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", default="public/Busaab Poems 26 Nov 2025.txt")
    ap.add_argument("--outdir", default="public")
    args = ap.parse_args()

    inp = Path(args.inp)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    raw = inp.read_text(encoding="utf-8")
    lines = raw.splitlines()

    meta = parse_meta(lines)
    toc, poems_heading_idx, toc_end_idx = find_toc_with_bounds(lines)
    if not toc:
        raise SystemExit("Could not find TOC (looked for a line exactly 'Poems' then TOC entries).")

    body_start = toc_end_idx if toc_end_idx != -1 else 0

    # Find the first poem title after TOC (anchors parsing and avoids TOC false positives)
    first_title = toc[0]["title"]
    first_poem_idx = None
    for i in range(body_start, len(lines)):
        if norm(lines[i].strip()) == first_title:
            first_poem_idx = i
            break
    if first_poem_idx is None:
        first_poem_idx = body_start

    poems = extract_poems_by_order(lines, toc, first_poem_idx)

    # ids/categories + id->title map (handy for stable references)
    id_to_title: Dict[int, str] = {}
    title_to_id: Dict[str, int] = {}

    for i, p in enumerate(poems, start=1):
        p["id"] = i
        p["category"] = "Uncategorized"
        id_to_title[i] = p["title"]
        title_to_id[p["title"]] = i

    # Back matter capture: everything after the last poem title we matched
    title_indices = find_title_indices_in_order(lines, first_poem_idx, toc)
    after_last_poem_idx = len(lines)
    if title_indices:
        # If we found the last title line, back matter starts after the last poem's content.
        # We approximate by taking end-of-file (conservative) — you can tighten later if needed.
        after_last_poem_idx = len(lines)

    sections = build_sections_raw(
        lines=lines,
        poems_heading_idx=poems_heading_idx,
        toc_end_idx=toc_end_idx,
        first_poem_idx=first_poem_idx,
        after_last_poem_idx=after_last_poem_idx,
    )

    out = {
        "meta": meta,
        "toc": toc,
        "sections": sections,
        "poems": poems,
        "idToTitle": id_to_title,
        "titleToId": title_to_id,
    }

    (outdir / "book.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    with open(outdir / "poems.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Category", "Number", "Title", "Body", "Page", "Date"])
        for p in poems:
            w.writerow([p["category"], p["id"], p["title"], p["body"], p.get("page"), p.get("date")])

    print(f"Input: {inp}")
    print(f"TOC entries: {len(toc)}")
    print(f"Poems parsed: {len(poems)}")
    if len(poems) != len(toc):
        print("WARNING: Poems parsed != TOC entries.")
        print("  This usually means one or more titles were not found as standalone headings in the body.")


if __name__ == "__main__":
    main()
