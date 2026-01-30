# Scores

A Next.js (TypeScript) app for browsing, searching, and sharing brass scores via S3-compatible storage.

## Features

- **Dashboard**: Browse S3 folders and files with automatic pagination (handles folders with 100+ items)
- **Search**: Full-text search by filename or path with keyword matching
- **Uploads**: PDF file uploads to S3 with progress tracking
- **Auth**: Email-based magic link authentication via Supabase
- **Terms**: Legal disclaimers and usage policies
- **Responsive**: Mobile-friendly UI with graceful truncation

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
SUPABASE_URL=...       # Supabase project URL
SUPABASE_ANON_KEY=...  # Supabase anon key
```

2) Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Pages

### Home (/)
Redirect to `/login` if not authenticated, otherwise redirect to `/dashboard`.

### Login (/login)
Email-based magic link authentication. User enters email, receives sign-in link, and is redirected via `/auth/callback` to the dashboard.

### Dashboard (/dashboard)
S3 browser with folder/file browsing and automatic pagination.

## Dashboard

The Dashboard provides a minimal S3 browser with pagination support for large folders.

- Breadcrumbs: shows current prefix; click segments to navigate up.
- Folder list: underscore-first sort (any folder starting with `_` appears first), then A→Z.
- File list: shows size and a Download action. Names truncate gracefully on mobile.
- "Up" row: appears when not at root to go one level up.
- Loading overlay: prevents flicker while navigating or searching.
- Pagination: automatically fetches and combines all results when a prefix contains >100 items (the API limit per request). Uses continuation tokens to retrieve subsequent pages transparently.
- Responsive header: on small screens, the search input starts right after the Name label and spans the full width; on ≥640px, the header is a 4‑column grid (Name | Search | Size | Action).

### Search behavior

- Scope: matches filename (basename) by default to avoid accidental folder-only hits. Path-wide matching is supported by the API (`scope=path`) but not exposed in UI yet.
- Extensions: defaults to PDFs only. Other types can be included via `exts` query (comma‑separated), if exposed.
- Ordering: deterministic, underscore-first, then A→Z for both folders and files.
- Pagination: the API scans multiple S3 pages per request (capped) and returns a `nextToken` for continued fetching. The client keeps “Load more” available even if a page yields zero matches.
- Result mix: matching folders are listed first (derived from path segments that include the query), then matching files.

### Actions

- Open folder: click the row or the Open button.
- View file: opens a presigned view URL in a new tab.
- Download file: presigned download link.

## Uploads (/upload)
PDF file upload interface with:

- File type validation (PDF only)
- Progress bar with upload percentage
- Presigned PUT URL via `/api/s4/presign`
- Fallback to server-side upload on CORS errors (`/api/s4/upload`)
- Success/error inline feedback

### Terms (/terms)
Static page with usage policies and legal disclaimers.arch (/search)
Global text search by filename or path with:

- Minimum 2-character query requirement
- Result count display (shows "100+" if capped)
- File/folder icons and size display
- Full path display for context
- Empty state messaging

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
