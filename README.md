# Lottery Manager

Prototype back-office web app for managing:

- customer codes
- multiple lottery products
- lottery entries
- number limits
- basic summaries and statistics

## Current stack

- Static HTML, CSS, and JavaScript
- Browser `localStorage` for data persistence

## Run locally

Open `index.html` directly in a browser, or start a small local server:

```powershell
python -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Current modules

- Customer management
- Lottery product management
- Entry recording
- Number limit management
- Dashboard summaries
- Import and export via JSON

## Current VPS deployment

The prototype is currently served from a Git checkout on the VPS:

- repository path: `/var/www/lottery-manager`
- nginx port: `8092`
- public URL: `http://139.59.123.146:8092/`

Update flow:

```bash
cd /var/www/lottery-manager
git pull
```

The VPS uses a dedicated read-only GitHub deploy key, so the application code stays in GitHub and the server pulls from Git instead of receiving manual file uploads.

## Planned production direction

Before using this for real shared operations, this project should be upgraded from a static prototype into a server-backed application with:

- authenticated users and roles
- database persistence
- draw management
- payout configuration
- result settlement
- audit logs
- backup strategy
- deployment configuration

The current static version stores data in each browser's `localStorage`, so data is not shared across devices or admins yet.
