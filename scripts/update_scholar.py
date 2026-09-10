#!/usr/bin/env python3
"""Refresh the website's last-known-good Google Scholar metrics snapshot."""

from __future__ import annotations

import argparse
import copy
import json
import os
import re
import ssl
import sys
import tempfile
import unicodedata
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, urlopen


PROFILE_ID = "C4xHgUMAAAAJ"
PROFILE_URL = f"https://scholar.google.com/citations?user={PROFILE_ID}&hl=en"
SERPAPI_URL = "https://serpapi.com/search.json"
FETCH_URLS = (
    f"https://scholar.google.nl/citations?user={PROFILE_ID}&hl=en",
    f"https://scholar.google.co.uk/citations?user={PROFILE_ID}&hl=en",
    PROFILE_URL,
)
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "data" / "scholar.json"
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

PUBLICATIONS = (
    {
        "id": "ntire-2025",
        "scholar_id": f"{PROFILE_ID}:u5HHmVD_uO8C",
        "title": (
            "NTIRE 2025 Challenge on Day and Night Raindrop Removal for "
            "Dual-Focused Images: Methods and Results"
        ),
        "url": (
            "https://openaccess.thecvf.com/content/CVPR2025W/NTIRE/html/"
            "Li_NTIRE_2025_Challenge_on_Day_and_Night_Raindrop_Removal_for_"
            "CVPRW_2025_paper.html"
        ),
    },
    {
        "id": "promise-2025",
        "scholar_id": f"{PROFILE_ID}:d1gkVwhDpl0C",
        "title": (
            "A Qualitative Investigation into LLM-Generated Multilingual Code "
            "Comments and Automatic Evaluation Metrics"
        ),
        "url": "https://doi.org/10.1145/3727582.3728683",
    },
)


def _classes(attributes: list[tuple[str, str | None]]) -> set[str]:
    value = dict(attributes).get("class") or ""
    return set(value.split())


def _clean_text(parts: list[str]) -> str:
    return " ".join("".join(parts).split())


def _normalise_title(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold()
    return " ".join(re.findall(r"\w+", value))


def _parse_nonnegative_int(value: str, label: str) -> int:
    compact = re.sub(r"[,\s\u00a0\u202f]", "", value)
    if not re.fullmatch(r"\d+", compact):
        raise ValueError(f"invalid {label}: {value!r}")
    return int(compact)


class ScholarProfileParser(HTMLParser):
    """Extract only the stable, labelled profile elements needed by the site."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.metric_rows: list[list[str]] = []
        self.graph_years: list[str] = []
        self.graph_citations: list[str] = []
        self.articles: list[dict[str, object]] = []

        self._in_metric_table = False
        self._metric_row: list[str] | None = None
        self._metric_cell: list[str] | None = None
        self._article: dict[str, object] | None = None
        self._capture_kind: str | None = None
        self._capture_tag: str | None = None
        self._capture_parts: list[str] = []

    def handle_starttag(
        self, tag: str, attributes: list[tuple[str, str | None]]
    ) -> None:
        attrs = dict(attributes)
        classes = _classes(attributes)

        if tag == "table" and attrs.get("id") == "gsc_rsb_st":
            self._in_metric_table = True
        elif self._in_metric_table and tag == "tr":
            self._metric_row = []
        elif self._in_metric_table and tag in {"td", "th"}:
            self._metric_cell = []

        if tag == "tr" and "gsc_a_tr" in classes:
            self._article = {"citations": 0}

        if tag == "span" and "gsc_g_t" in classes:
            self._begin_capture("graph_year", tag)
        elif tag == "span" and "gsc_g_al" in classes:
            self._begin_capture("graph_citations", tag)
        elif self._article is not None and tag == "a" and "gsc_a_at" in classes:
            self._begin_capture("article_title", tag)
            href = attrs.get("href") or ""
            query = parse_qs(urlparse(href).query)
            scholar_ids = query.get("citation_for_view", [])
            if scholar_ids:
                self._article["scholar_id"] = scholar_ids[0]
        elif self._article is not None and tag == "a" and "gsc_a_ac" in classes:
            self._begin_capture("article_citations", tag)
        elif self._article is not None and tag == "span" and "gsc_a_h" in classes:
            self._begin_capture("article_year", tag)

    def handle_data(self, data: str) -> None:
        if self._metric_cell is not None:
            self._metric_cell.append(data)
        if self._capture_kind is not None:
            self._capture_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if self._capture_kind is not None and tag == self._capture_tag:
            self._finish_capture()

        if self._in_metric_table and tag in {"td", "th"}:
            if self._metric_row is not None and self._metric_cell is not None:
                self._metric_row.append(_clean_text(self._metric_cell))
            self._metric_cell = None
        elif self._in_metric_table and tag == "tr":
            if self._metric_row is not None:
                self.metric_rows.append(self._metric_row)
            self._metric_row = None
        elif self._in_metric_table and tag == "table":
            self._in_metric_table = False

        if tag == "tr" and self._article is not None:
            if self._article.get("title"):
                self.articles.append(self._article)
            self._article = None

    def _begin_capture(self, kind: str, tag: str) -> None:
        if self._capture_kind is not None:
            raise ValueError(
                f"unexpected nested Scholar text captures: {self._capture_kind}, {kind}"
            )
        self._capture_kind = kind
        self._capture_tag = tag
        self._capture_parts = []

    def _finish_capture(self) -> None:
        kind = self._capture_kind
        value = _clean_text(self._capture_parts)

        if kind == "graph_year":
            self.graph_years.append(value)
        elif kind == "graph_citations":
            self.graph_citations.append(value)
        elif kind == "article_title" and self._article is not None:
            self._article["title"] = value
        elif kind == "article_citations" and self._article is not None:
            self._article["citations"] = _parse_nonnegative_int(
                value, "article citation count"
            )
        elif kind == "article_year" and self._article is not None:
            self._article["year"] = _parse_nonnegative_int(value, "article year")

        self._capture_kind = None
        self._capture_tag = None
        self._capture_parts = []


def fetch_profile(timeout: float) -> str:
    errors: list[str] = []
    for fetch_url in FETCH_URLS:
        try:
            request = Request(
                fetch_url,
                headers={
                    "Accept": "text/html,application/xhtml+xml",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Cache-Control": "no-cache",
                    "User-Agent": USER_AGENT,
                },
            )
            with urlopen(request, timeout=timeout, context=_ssl_context()) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                body = response.read().decode(charset, errors="replace")

            lower_body = body.casefold()
            block_markers = ("unusual traffic", "not a robot", "recaptcha", "/sorry/")
            if any(marker in lower_body for marker in block_markers):
                raise RuntimeError("bot-check page")
            if 'id="gsc_rsb_st"' not in body or PROFILE_ID not in body:
                raise RuntimeError("unexpected profile response")
            return body
        except Exception as error:
            errors.append(f"{fetch_url}: {type(error).__name__}: {error}")

    raise RuntimeError("all Google Scholar profile hosts failed; " + " | ".join(errors))


def fetch_serpapi(api_key: str, timeout: float) -> dict[str, object]:
    """Fetch the same public profile through SerpAPI without logging the key."""
    query = urlencode(
        {
            "engine": "google_scholar_author",
            "author_id": PROFILE_ID,
            "hl": "en",
            "num": "100",
            "api_key": api_key,
        }
    )
    request = Request(
        f"{SERPAPI_URL}?{query}",
        headers={"Accept": "application/json", "User-Agent": USER_AGENT},
    )

    try:
        with urlopen(request, timeout=timeout, context=_ssl_context()) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        raise RuntimeError(
            f"SerpAPI request returned HTTP {error.code}"
        ) from None
    except URLError:
        raise RuntimeError("SerpAPI request failed") from None
    except json.JSONDecodeError:
        raise RuntimeError("SerpAPI returned invalid JSON") from None

    if not isinstance(payload, dict):
        raise RuntimeError("SerpAPI returned an unexpected response")
    if payload.get("error"):
        raise RuntimeError("SerpAPI returned an error response")

    metadata = payload.get("search_metadata")
    status = metadata.get("status") if isinstance(metadata, dict) else None
    if status != "Success":
        raise RuntimeError(f"unexpected SerpAPI status: {status!r}")

    parameters = payload.get("search_parameters")
    author_id = parameters.get("author_id") if isinstance(parameters, dict) else None
    if author_id != PROFILE_ID:
        raise RuntimeError("SerpAPI response is for a different Scholar profile")

    return payload


def _ssl_context() -> ssl.SSLContext:
    """Use Python's CA bundle, with common system bundles as safe fallbacks."""
    defaults = ssl.get_default_verify_paths()
    if defaults.cafile and Path(defaults.cafile).is_file():
        return ssl.create_default_context()

    for candidate in (
        Path("/etc/ssl/cert.pem"),
        Path("/etc/ssl/certs/ca-certificates.crt"),
        Path("/etc/pki/tls/certs/ca-bundle.crt"),
    ):
        if candidate.is_file():
            return ssl.create_default_context(cafile=str(candidate))

    return ssl.create_default_context()


def parse_metric_rows(rows: list[list[str]]) -> tuple[dict[str, object], int]:
    recent_since_year: int | None = None
    raw_metrics: dict[str, tuple[int, int]] = {}

    for row in rows:
        for cell in row:
            match = re.fullmatch(r"Since\s+(\d{4})", cell, flags=re.IGNORECASE)
            if match:
                recent_since_year = int(match.group(1))

        if len(row) < 3:
            continue
        label = row[0].strip().casefold()
        if label in {"citations", "h-index", "i10-index"}:
            raw_metrics[label] = (
                _parse_nonnegative_int(row[1], f"{label} total"),
                _parse_nonnegative_int(row[2], f"{label} recent total"),
            )

    required = {"citations", "h-index", "i10-index"}
    missing = required - raw_metrics.keys()
    if missing:
        raise ValueError(f"missing Scholar metrics: {', '.join(sorted(missing))}")
    if recent_since_year is None:
        raise ValueError("missing the recent-citations start year")

    metrics: dict[str, object] = {
        "citations": raw_metrics["citations"][0],
        "h_index": raw_metrics["h-index"][0],
        "i10_index": raw_metrics["i10-index"][0],
        "recent_since_year": recent_since_year,
        "recent": {
            "citations": raw_metrics["citations"][1],
            "h_index": raw_metrics["h-index"][1],
            "i10_index": raw_metrics["i10-index"][1],
        },
    }
    return metrics, recent_since_year


def parse_yearly_citations(parser: ScholarProfileParser) -> dict[str, int]:
    if not parser.graph_years or len(parser.graph_years) != len(
        parser.graph_citations
    ):
        raise ValueError(
            "Scholar citation graph has mismatched year and citation values"
        )

    result: dict[str, int] = {}
    for raw_year, raw_count in zip(
        parser.graph_years, parser.graph_citations, strict=True
    ):
        year = _parse_nonnegative_int(raw_year, "citation graph year")
        if not 1900 <= year <= 2200:
            raise ValueError(f"implausible citation graph year: {year}")
        key = str(year)
        if key in result:
            raise ValueError(f"duplicate citation graph year: {year}")
        result[key] = _parse_nonnegative_int(
            raw_count, f"citation graph count for {year}"
        )

    return dict(sorted(result.items()))


def parse_publications(parser: ScholarProfileParser) -> list[dict[str, object]]:
    articles_by_id = {
        str(article.get("scholar_id")): article
        for article in parser.articles
        if article.get("scholar_id")
    }
    result: list[dict[str, object]] = []

    for expected in PUBLICATIONS:
        scholar_id = expected["scholar_id"]
        article = articles_by_id.get(scholar_id)
        if article is None:
            raise ValueError(f"missing expected Scholar publication: {scholar_id}")
        if _normalise_title(str(article.get("title", ""))) != _normalise_title(
            expected["title"]
        ):
            raise ValueError(f"title mismatch for Scholar publication: {scholar_id}")
        if "year" not in article:
            raise ValueError(f"missing year for Scholar publication: {scholar_id}")

        result.append(
            {
                "id": expected["id"],
                "scholar_id": scholar_id,
                "title": expected["title"],
                "year": article["year"],
                "citations": article["citations"],
                "url": expected["url"],
            }
        )

    return result


def parse_serpapi_metrics(payload: dict[str, object]) -> dict[str, object]:
    cited_by = payload.get("cited_by")
    table = cited_by.get("table") if isinstance(cited_by, dict) else None
    if not isinstance(table, list):
        raise ValueError("missing SerpAPI cited-by table")

    raw_metrics: dict[str, tuple[int, int, int]] = {}
    for row in table:
        if not isinstance(row, dict):
            continue
        for label in ("citations", "h_index", "i10_index"):
            values = row.get(label)
            if not isinstance(values, dict):
                continue

            recent_keys = [
                key
                for key in values
                if isinstance(key, str) and re.fullmatch(r"since_\d{4}", key)
            ]
            if len(recent_keys) != 1:
                raise ValueError(f"invalid SerpAPI recent metric for {label}")
            recent_key = recent_keys[0]
            raw_metrics[label] = (
                _parse_nonnegative_int(str(values.get("all", "")), f"{label} total"),
                _parse_nonnegative_int(
                    str(values.get(recent_key, "")), f"{label} recent total"
                ),
                int(recent_key.removeprefix("since_")),
            )

    required = {"citations", "h_index", "i10_index"}
    missing = required - raw_metrics.keys()
    if missing:
        raise ValueError(f"missing SerpAPI metrics: {', '.join(sorted(missing))}")

    recent_years = {values[2] for values in raw_metrics.values()}
    if len(recent_years) != 1:
        raise ValueError("SerpAPI metrics use inconsistent recent-year windows")
    recent_since_year = recent_years.pop()

    return {
        "citations": raw_metrics["citations"][0],
        "h_index": raw_metrics["h_index"][0],
        "i10_index": raw_metrics["i10_index"][0],
        "recent_since_year": recent_since_year,
        "recent": {
            "citations": raw_metrics["citations"][1],
            "h_index": raw_metrics["h_index"][1],
            "i10_index": raw_metrics["i10_index"][1],
        },
    }


def parse_serpapi_yearly_citations(
    payload: dict[str, object],
) -> dict[str, int]:
    cited_by = payload.get("cited_by")
    graph = cited_by.get("graph") if isinstance(cited_by, dict) else None
    if not isinstance(graph, list) or not graph:
        raise ValueError("missing SerpAPI citation graph")

    result: dict[str, int] = {}
    for point in graph:
        if not isinstance(point, dict):
            raise ValueError("invalid SerpAPI citation graph point")
        year = _parse_nonnegative_int(str(point.get("year", "")), "citation year")
        if not 1900 <= year <= 2200:
            raise ValueError(f"implausible citation graph year: {year}")
        key = str(year)
        if key in result:
            raise ValueError(f"duplicate citation graph year: {year}")
        result[key] = _parse_nonnegative_int(
            str(point.get("citations", "")), f"citation graph count for {year}"
        )

    return dict(sorted(result.items()))


def parse_serpapi_publications(
    payload: dict[str, object],
) -> list[dict[str, object]]:
    articles = payload.get("articles")
    if not isinstance(articles, list):
        raise ValueError("missing SerpAPI articles")
    articles_by_id = {
        str(article.get("citation_id")): article
        for article in articles
        if isinstance(article, dict) and article.get("citation_id")
    }
    result: list[dict[str, object]] = []

    for expected in PUBLICATIONS:
        scholar_id = expected["scholar_id"]
        article = articles_by_id.get(scholar_id)
        if article is None:
            raise ValueError(f"missing expected Scholar publication: {scholar_id}")
        if _normalise_title(str(article.get("title", ""))) != _normalise_title(
            expected["title"]
        ):
            raise ValueError(f"title mismatch for Scholar publication: {scholar_id}")

        year = _parse_nonnegative_int(str(article.get("year", "")), "article year")
        cited_by = article.get("cited_by")
        citations = 0
        if cited_by is not None:
            if not isinstance(cited_by, dict):
                raise ValueError(f"invalid cited-by data for publication: {scholar_id}")
            citations = _parse_nonnegative_int(
                str(cited_by.get("value", "")), "article citation count"
            )

        result.append(
            {
                "id": expected["id"],
                "scholar_id": scholar_id,
                "title": expected["title"],
                "year": year,
                "citations": citations,
                "url": expected["url"],
            }
        )

    return result


def build_snapshot(body: str) -> dict[str, object]:
    parser = ScholarProfileParser()
    parser.feed(body)
    parser.close()

    metrics, _ = parse_metric_rows(parser.metric_rows)
    yearly = parse_yearly_citations(parser)
    publications = parse_publications(parser)

    if metrics["h_index"] > metrics["citations"]:
        raise ValueError("h-index cannot exceed the total citation count")
    if metrics["i10_index"] > len(publications) + metrics["citations"]:
        raise ValueError("implausible i10-index")

    return {
        "source": "Google Scholar",
        "profile_id": PROFILE_ID,
        "profile_url": PROFILE_URL,
        "metrics": metrics,
        "citations_by_year": yearly,
        "publications": publications,
    }


def build_serpapi_snapshot(payload: dict[str, object]) -> dict[str, object]:
    metrics = parse_serpapi_metrics(payload)
    yearly = parse_serpapi_yearly_citations(payload)
    publications = parse_serpapi_publications(payload)

    if metrics["h_index"] > metrics["citations"]:
        raise ValueError("h-index cannot exceed the total citation count")
    if metrics["i10_index"] > len(publications) + metrics["citations"]:
        raise ValueError("implausible i10-index")

    return {
        "source": "Google Scholar",
        "profile_id": PROFILE_ID,
        "profile_url": PROFILE_URL,
        "metrics": metrics,
        "citations_by_year": yearly,
        "publications": publications,
    }


def load_existing(path: Path) -> dict[str, object] | None:
    if not path.exists():
        return None
    with path.open(encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValueError(f"existing snapshot is not a JSON object: {path}")
    return value


def comparable(snapshot: dict[str, object] | None) -> dict[str, object] | None:
    if snapshot is None:
        return None
    result = copy.deepcopy(snapshot)
    result.pop("updated_at", None)
    return result


def atomic_write_json(path: Path, value: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        dir=path.parent, prefix=f".{path.name}.", suffix=".tmp"
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            json.dump(value, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_name, path)
    except BaseException:
        try:
            os.unlink(temporary_name)
        except FileNotFoundError:
            pass
        raise


def update(output: Path, timeout: float) -> bool:
    existing = load_existing(output)
    serpapi_key = os.environ.get("SERPAPI_KEY", "").strip()
    if serpapi_key:
        candidate = build_serpapi_snapshot(fetch_serpapi(serpapi_key, timeout))
        retrieval_method = "SerpAPI"
    else:
        candidate = build_snapshot(fetch_profile(timeout))
        retrieval_method = "the public profile"
    verified_at = (
        datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    )

    if (
        comparable(existing) == candidate
        and str((existing or {}).get("updated_at", ""))[:10] == verified_at[:10]
    ):
        print(
            f"Google Scholar metrics already verified today via "
            f"{retrieval_method}; kept {output}"
        )
        return False

    candidate_with_time = copy.deepcopy(candidate)
    candidate_with_time["updated_at"] = verified_at
    atomic_write_json(output, candidate_with_time)
    print(f"Verified Google Scholar metrics via {retrieval_method} in {output}")
    return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"snapshot path (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=30.0,
        help="network timeout in seconds (default: 30)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.timeout <= 0:
        print("error: --timeout must be positive", file=sys.stderr)
        return 2
    try:
        update(args.output.resolve(), args.timeout)
    except Exception as error:
        print(
            f"error: Scholar snapshot was not changed: {type(error).__name__}: {error}",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
