# A1 Refactor Plan — Light Version

## ตอนนี้ (รอบ X4)
- ทำ documentation/marker เท่านั้น — ไม่ touch server.js logic
- เพิ่ม comment marker /* MIG: ... */, /* CRON: ... */, /* ROUTE-ADMIN: ... */ ทุก block

## รอบถัดไป (ต้อง dev environment + testing)
1. แยก db/migrations.js — ย้าย CREATE TABLE + ensureColumn + migrations ทั้งหมด
2. แยก cron/index.js — รวม setInterval + node-schedule
3. แยก routes/admin.js, customer.js, line.js, affiliate.js
4. แยก services/{slip,broadcast,apilotto,linebot}.js
5. เพิ่ม unit tests สำหรับ helpers

## ทำไมไม่ทำเลย
- server.js 7,395 บรรทัด — import dependencies ผูกกัน (db, env, helpers)
- ไม่มี unit test เป็น safety net
- ต้อง refactor + test endpoint ทุกตัว ใช้เวลา 1-2 วัน
- risk break business — ระบบกำลังจะ launch
