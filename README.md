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

## Planned production direction

Before deploying to a VPS, this project should be upgraded from a static prototype into a server-backed application with:

- authenticated users and roles
- database persistence
- draw management
- payout configuration
- result settlement
- audit logs
- backup strategy
- deployment configuration
