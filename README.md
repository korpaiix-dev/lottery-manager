# Lottery Manager

Back-office web app for managing:

- customer codes
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
- Lottery product management
- Round management
- Fast intake parser for pasted LINE-style messages
- Manual entry recording
- Number limit management
- Payout configuration
- Result entry
- Settlement reports
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
- `lotteries`
- `rounds`
- `bet_types`
- `payout_rates`
- `limits`
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
2. Paste the LINE message, for example `01 02 03 04 05 06 ไทย 1000บาท`.
3. Let the parser infer lottery, active round, bet type, amount, and numbers where possible.
4. Review the generated rows.
5. Save the whole batch in one action.

Use the detailed form only for exceptional cases that need manual correction.
