# Operations Manager

Role-based records management web app for:

- account codes
- group owners
- multiple product categories
- rounds and schedules
- number records
- number caps
- rate settings
- result and settlement workflows
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

## Current Modules

- Account management
- Group-owner management
- User management with edit/delete safeguards
- Product management
- Round management with editable cutoff settings
- Fast intake parser for pasted LINE-style messages
- Account-code detection inside pasted LINE messages
- Manual record entry
- Ticket-level review workflow with pending, approved, rejected, and cancelled states
- Round cutoff times that stop intake automatically before draw time
- Number cap management
- Rate configuration
- Result entry
- Result finalization and reopen flow
- Settlement reports
- Read-only group-owner summary view
- Login and first-admin setup
- Dashboard summaries
- JSON export
- Audit logging

## Current VPS Deployment

The app is deployed from a Git checkout on the VPS:

- repository path: configured on the server
- app port: configured by the service environment
- public port: configured by the reverse proxy
- public URL: configured by the deployment owner

Update flow:

```bash
cd <app-directory>
git pull
npm install
sudo systemctl restart <app-service>
```

The VPS uses a dedicated read-only GitHub deploy key, so the application code stays in GitHub and the server pulls from Git instead of receiving manual file uploads.

Deployment files live under `ops/`, and the backup helper lives under `scripts/`.

## Data model

- `customers`
- `head_houses`
- `products`
- `rounds`
- `record_types`
- `rate_rules`
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
0 3 * * * /bin/bash <app-directory>/scripts/backup-db.sh
```

## Role Model

- `admin`: access to every page, including ticket approval, user management, group-owner management, schedules, rates, and reports
- `operator`: access to operational pages such as intake, records, result entry, and day-to-day reports, but not admin-only user management or approval actions
- `head_house_viewer`: read-only access to the group-owner summary for their own account only

All roles use the same application entry point. Access is limited by role instead of splitting user groups into separate sites.

## Admin Workflow

For daily intake work:

1. Open the intake board.
2. Pick the product card for the round that is currently accepting records.
3. Key the ticket using fast entry, classic entry, or pasted-message entry.
4. Put the LINE display name in the note field so it appears on the receipt immediately.
5. Save the ticket and send the generated receipt code back to the sender.
6. A supervisor reviews the full ticket before it is counted in official totals.
7. After draw time, record results, review them, and finalize the round before settlement becomes official.

Use the records page for search and correction work, and keep long-lived setup work under settings.

## QA

Run the repeatable end-to-end smoke test:

```powershell
npm.cmd run smoke
```

The smoke test covers ticket capture, supervisor approval, approved-ticket locking, result finalization, settlement totals, group-owner totals, and audit logging.
