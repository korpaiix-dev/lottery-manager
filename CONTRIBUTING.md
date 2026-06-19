# Contributing — กฎสำหรับแก้ระบบหวย

## ⛔ ห้ามใช้ Python patch script

ตั้งแต่ **2026-06-19** ขอ **เลิก** ใช้ Python sed/replace script เพื่อแก้ server.js / app.js

**เหตุผล:**
- Patch script run แล้วหาย — ไม่อยู่ใน git
- ถ้า server.js restore จาก backup → patch ทั้งหมดต้อง re-apply manual + ลำดับสำคัญ
- ไม่มีใครรู้ว่าใครเพิ่ม patch อะไรไป

**วิธีที่ถูกต้อง:**
1. ใช้ Edit/MultiEdit ตรง code
2. `node --check server.js` (verify)
3. `git add` + `git commit -m "fix: เรื่องที่แก้"`
4. (pre-commit hook จะ run node --check อัตโนมัติ)
5. `systemctl restart lottery-manager`

## 🔍 ก่อน commit ทุกครั้ง

```bash
npm run check         # syntax
npm run smoke         # smoke test (e2e)
git diff --stat       # ดูจำนวน lines
```

## 📋 Pre-deploy ก่อน restart service

```bash
npm run predeploy     # check + smoke
systemctl restart lottery-manager
sleep 2 && systemctl is-active lottery-manager  # verify
journalctl -u lottery-manager --since "30 sec ago"  # check log
```

## 🛡️ Safety rules

1. **อย่า edit production file ตรงๆ** — git commit ก่อนเสมอ
2. **อย่า restart service** ตอนงวดกำลังจะปิด (ลูกค้าโดน)
3. **Backup DB** ก่อนแก้ schema: `sqlite3 lottery-manager.sqlite .backup /tmp/db.bak`
4. **อย่าลบไฟล์ `.bak-*`** ทันที — รอ 1 อาทิตย์
