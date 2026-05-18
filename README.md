# Lottery Manager

Role-based lottery management web app for:

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
- Read-only head-house summary view
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

## Role model

- `admin`: access to every page, including ticket approval, user management, head-house management, schedules, payouts, and reports
- `operator`: access to operational pages such as intake, entries, results entry, and day-to-day reports, but not admin-only user management or approval actions
- `head_house_viewer`: read-only access to the head-house summary for their own account only

All roles use the same application entry point. Access is limited by role instead of splitting customer and admin work into separate sites.

## Admin workflow

For daily intake work:

1. Open `แทงหวย`.
2. Pick the lottery card for the round that is currently accepting entries.
3. Key the ticket in `คีย์โพย` using `แทงเร็ว`, `แทงแบบคลาสสิค`, or `วางโพย`.
4. Put the customer's LINE name in the note field so it appears on the receipt immediately.
5. Save the ticket and send the generated receipt code back to the customer.
6. A supervisor reviews the full ticket in `ตรวจโพย` before it is counted in official totals.
7. After draw time, record results in `ตรวจรางวัล`, review them, and finalize the round before payouts become official.

Use `รายการแทง` for search and correction work, and keep long-lived setup work under `ตั้งค่า`.

## QA

Run the repeatable end-to-end smoke test:

```powershell
npm.cmd run smoke
```

The smoke test covers ticket capture, supervisor approval, approved-ticket locking, result finalization, settlement totals, head-house totals, and audit logging.
