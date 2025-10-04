# Scores

A Next.js (TypeScript) app for browsing and sharing brass scores.

## Dev

1) Create `.env.local` (not committed) with S3-compatible storage credentials:

```
S4_ENDPOINT=...        # e.g. https://s3.your-provider.example
S4_REGION=us-east-1    # or your region
S4_BUCKET=...          # bucket name
S4_ACCESS_KEY_ID=...
S4_SECRET_ACCESS_KEY=...
S4_SESSION_TOKEN=...   # optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

2) Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Dashboard

The Dashboard provides a minimal S3 browser and a global search.

- Breadcrumbs: shows current prefix; click segments to navigate up.
- Folder list: underscore-first sort (any folder starting with `_` appears first), then A→Z.
- File list: shows size and a Download action. Names truncate gracefully on mobile.
- “Up” row: appears when not at root to go one level up.
- Loading overlay: prevents flicker while navigating or searching.
- Responsive header: on small screens, the search input starts right after the Name label and spans the full width; on ≥640px, the header is a 4‑column grid (Name | Search | Size | Action).

### Search behavior (2025 rules)

- Scope: matches filename (basename) by default to avoid accidental folder-only hits. Path-wide matching is supported by the API (`scope=path`) but not exposed in UI yet.
- Extensions: defaults to PDFs only. Other types can be included via `exts` query (comma‑separated), if exposed.
- Ordering: deterministic, underscore-first, then A→Z for both folders and files.
- Pagination: the API scans multiple S3 pages per request (capped) and returns a `nextToken` for continued fetching. The client keeps “Load more” available even if a page yields zero matches.
- Result mix: matching folders are listed first (derived from path segments that include the query), then matching files.

### Actions

- Open folder: click the row or the Open button.
- View file: opens a presigned view URL in a new tab.
- Download file: presigned download link.

## Uploads

The Upload page lets you select a PDF and upload it to the "upload" area in your bucket.

- Accepts only PDF files.
- Uses a presigned PUT URL, with a server fallback for CORS-restricted environments.
- Shows an in-button progress bar; success and error states are indicated inline.
- Selected filename is shown and truncates gracefully on mobile.

## API

All routes live under `app/api/s4/*` and use an S3‑compatible backend.

### GET /api/s4/list

Lists folders and files under an optional `prefix`.

Query params:
- `prefix` (optional): path prefix to list under.

Sorting:
- Folders: underscore‑first, then A→Z.
- Files: returned as provided by storage (UI renders alongside size/actions).

### GET /api/s4/search

Searches object keys with pagination and returns matching folders and files.

Query params:
- `q` (required): search text.
- `token` (optional): continuation token for pagination.
- `prefix` (optional): constrain the scan to this prefix.
- `scope` (optional): `basename` (default) to match filename only; `path` to match the entire key path.
- `exts` (optional): comma-separated list of file extensions to include; defaults to `pdf`.

Response:
- `results`: array of folders (keys ending with '/') and files. Folders first, then files.
- `nextToken`: string or null; pass to fetch the next page.
- Deterministic sort: underscore‑first, then A→Z for both folders and files.

Notes:
- The server scans multiple S3 pages per request (capped for safety) and returns up to a capped number of matches.
- The client preserves `nextToken` even when a page yields no matches, allowing additional “Load more” requests.

## Misc

- Keep UI simple and consistent; prioritize performance and clarity.
- `SUMMARY.txt` and `.env.local` are ignored by git.
