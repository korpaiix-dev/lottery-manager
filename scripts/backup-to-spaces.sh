#!/usr/bin/env bash
# Lottery Manager: Daily backup → DigitalOcean Spaces (charoenpon-backup bucket)
# - SQLite .backup → gzip → upload as db/lottery/lottery-manager-YYYYMMDD-HHMMSS.sqlite.gz
# - Keep local copy 14 days
# - Spaces retention handled by separate cleanup script

set -euo pipefail

DB_PATH="${DB_PATH:-/var/lib/lottery-manager/lottery-manager.sqlite}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/lottery-manager}"
LOG_FILE="${LOG_FILE:-/var/log/lottery-backup.log}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOCAL_FILE="lottery-manager-${TIMESTAMP}.sqlite"
GZ_FILE="${LOCAL_FILE}.gz"
LOCAL_BAK="${BACKUP_DIR}/${LOCAL_FILE}"
LOCAL_GZ="${BACKUP_DIR}/${GZ_FILE}"

mkdir -p "$BACKUP_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "🗄️  เริ่ม backup: ${TIMESTAMP}"

# 1. SQLite .backup (safe — works while DB is being written)
sqlite3 "$DB_PATH" ".backup '${LOCAL_BAK}'"
BAK_SIZE=$(du -h "$LOCAL_BAK" | cut -f1)
log "✅ Backup local: ${BAK_SIZE}"

# 2. Compress
gzip -f "$LOCAL_BAK"
GZ_SIZE=$(du -h "$LOCAL_GZ" | cut -f1)
log "✅ Gzipped: ${GZ_SIZE}"

# 3. Upload to Spaces
log "☁️  Upload → s3://charoenpon-backup/db/lottery/${GZ_FILE}"
python3 - "$LOCAL_GZ" "lottery/${GZ_FILE}" <<'PYEOF'
import sys, os, boto3
from botocore.client import Config

# Load env (same as charoenpon)
with open('/root/charoenpon/.env') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())

local_path = sys.argv[1]
remote_name = sys.argv[2]

s3 = boto3.client(
    's3',
    region_name=os.getenv('DO_SPACES_REGION', 'sgp1'),
    endpoint_url=os.getenv('DO_SPACES_ENDPOINT', 'https://sgp1.digitaloceanspaces.com'),
    aws_access_key_id=os.getenv('DO_SPACES_KEY'),
    aws_secret_access_key=os.getenv('DO_SPACES_SECRET'),
    config=Config(signature_version='s3v4')
)
bucket = os.getenv('DO_SPACES_BUCKET', 'charoenpon-backup')
s3.upload_file(local_path, bucket, f"db/{remote_name}", ExtraArgs={'ACL': 'private'})
print(f"✅ Uploaded: s3://{bucket}/db/{remote_name}")
PYEOF

log "✅ Upload OK"

# 4. Local cleanup (keep 14 days)
find "$BACKUP_DIR" -type f -name 'lottery-manager-*.sqlite*' -mtime +14 -delete
log "🧹 ลบ local backup เก่ากว่า 14 วัน"

# 5. Spaces cleanup (keep 30 days)
python3 - 30 <<'PYEOF'
import os, sys, datetime, boto3
from botocore.client import Config

with open('/root/charoenpon/.env') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())

retain_days = int(sys.argv[1])
s3 = boto3.client(
    's3',
    region_name=os.getenv('DO_SPACES_REGION', 'sgp1'),
    endpoint_url=os.getenv('DO_SPACES_ENDPOINT', 'https://sgp1.digitaloceanspaces.com'),
    aws_access_key_id=os.getenv('DO_SPACES_KEY'),
    aws_secret_access_key=os.getenv('DO_SPACES_SECRET'),
    config=Config(signature_version='s3v4')
)
bucket = os.getenv('DO_SPACES_BUCKET', 'charoenpon-backup')

cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=retain_days)
resp = s3.list_objects_v2(Bucket=bucket, Prefix='db/lottery/')
deleted = 0
for obj in resp.get('Contents', []):
    if obj['LastModified'] < cutoff:
        s3.delete_object(Bucket=bucket, Key=obj['Key'])
        deleted += 1
print(f"🗑️  Spaces: ลบ {deleted} ไฟล์เก่ากว่า {retain_days} วัน")
PYEOF

log "🎉 Backup เสร็จ: ${GZ_FILE} (${GZ_SIZE})"
