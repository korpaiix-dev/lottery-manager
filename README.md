# Lottery Manager

Back-office web app for managing:

- customer codes
- head houses
- multiple lottery products
- rounds
- lottery entries
- number limits
- payout settings
- results and settlement
- shared login-protected data

## Current stack

- Node.js
- Express
- SQLite via Node's built-in `node:sqlite`
- HTML, CSS, and vanilla JavaScript frontend

## Run locally

Install dependencies and start the app:

```powershell
npm.cmd install
npm.cmd start
```

Then open `http://127.0.0.1:3001`.

## Current modules

- Customer management
- Head-house management
- User management with edit/delete safeguards
- Lottery product management
- Round management with editable cutoff settings
- Fast intake parser for pasted LINE-style messages
- Customer-code detection inside pasted LINE messages
- Manual entry recording
- Ticket-level review workflow with pending/approved/rejected/cancelled states
- Round cutoff times that stop intake automatically before draw time
- Number limit management
- Payout configuration
- Result entry
- Result finalization and reopen flow
- Settlement reports
- Read-only head-house summary portal
- Login and first-admin setup
- Dashboard summaries
- JSON export
- Audit logging

## Current VPS deployment

The app is deployed from a Git checkout on the VPS:

- repository path: `/var/www/lottery-manager`
- app port: `3001`
- nginx public port: `8092`
- public URL: `http://139.59.123.146:8092/`

Update flow:

```bash
cd /var/www/lottery-manager
git pull
npm install
sudo systemctl restart lottery-manager
```

The VPS uses a dedicated read-only GitHub deploy key, so the application code stays in GitHub and the server pulls from Git instead of receiving manual file uploads.

Deployment files:

- `ops/lottery-manager.service`
- `ops/nginx-lottery-manager.conf`
- `scripts/backup-db.sh`

## Data model

- `customers`
- `head_houses`
- `lotteries`
- `rounds`
- `bet_types`
- `payout_rates`
- `limits`
- `tickets`
- `entries`
- `results`
- `users`
- `sessions`
- `audit_logs`

## Backup

The included backup script creates a SQLite backup and prunes backups older than 14 days:

```bash
bash scripts/backup-db.sh
```

Example cron:

```cron
0 3 * * * /bin/bash /var/www/lottery-manager/scripts/backup-db.sh
```

## Admin workflow

For common intake work, use `รับรายการ`:

1. Select the customer once.
2. If the customer is new, add them inline from the same screen.
3. Paste the LINE message, for example `01 02 03 04 05 06 ไทย 1000บาท`.
4. Let the parser infer lottery, active round, bet type, amount, and numbers where possible.
5. Review the generated rows.
6. Save the whole batch in one action and use the generated ticket code for follow-up.
7. A supervisor reviews the full ticket in `ตรวจงาน` before it is counted in official totals.
8. After draw time, record results and finalize the round before payouts become official.

Use the detailed form only for exceptional cases that need manual correction.

## QA

Run the repeatable end-to-end smoke test:

```powershell
npm.cmd run smoke
```

The smoke test covers ticket capture, supervisor approval, approved-ticket locking, result finalization, settlement totals, head-house totals, and audit logging.
