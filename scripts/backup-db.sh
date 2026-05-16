#!/usr/bin/env bash
set -euo pipefail

db_path="${1:-/var/lib/lottery-manager/lottery-manager.sqlite}"
backup_dir="${2:-/var/backups/lottery-manager}"
timestamp="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$backup_dir"
sqlite3 "$db_path" ".backup '$backup_dir/lottery-manager-$timestamp.sqlite'"
find "$backup_dir" -type f -name 'lottery-manager-*.sqlite' -mtime +14 -delete
