# Personal Website - Yongcheng Huang

This is the source code for my personal website hosted on GitHub Pages.

## Features

- Dark editorial design inspired by DeepSeek Harness, with full-width blue light, restrained typography, and an identifier-recovery illustration.
- Responsive profile, research, publication, service, and project sections.
- Interactive research visualizations with keyboard-accessible launch controls.
- A last-known-good Google Scholar snapshot refreshed daily by GitHub Actions.

## Scholar data

Run the same refresh used by GitHub Actions:

```bash
python3 scripts/update_scholar.py
```

The updater validates the profile before atomically replacing `data/scholar.json`. A failed request leaves the last verified snapshot untouched.

For reliable hosted refreshes, add a GitHub Actions repository secret named `SERPAPI_KEY`. The updater then uses SerpAPI's Google Scholar Author endpoint; without the secret it attempts the public Scholar profile directly. If Google blocks that request, the workflow records a warning and deliberately keeps the dated last-known-good snapshot.

## Local Development

The page keeps the existing visualization styles in `style.css`. The current site-wide visual system lives in `redesign.css`, which loads after it on both the homepage and privacy page.

To preview the site locally:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.
