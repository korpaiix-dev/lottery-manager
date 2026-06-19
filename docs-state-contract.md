# State Contract — /api/state response

Updated: 2026-06-19 (Phase C + Phase D start)

## Source of Truth

Backend (server.js: `getFullState(user)`) → DB → frontend (`window.state`)

Frontend MUST NOT hardcode lists that are derived from DB.

## Shape (admin/staff role)

```ts
{
  // Phase C: source of truth for categories
  lotteryCategories: Array<{ id: string, label: string }>,

  // Core entities
  headHouses: Array<HeadHouse>,
  lotteries: Array<Lottery>,
  customers: Array<Customer>,
  rounds: Array<Round>,
  scheduleTemplates: Array<ScheduleTemplate>,
  betTypes: Array<BetType>,
  payoutRates: Array<PayoutRate>,
  payoutOverrides: Record<HeadHouseId, Record<"lotteryId|betTypeId", number>>,
  limits: Array<Limit>,
  tickets: Array<Ticket>,
  entries: Array<Entry>,
  results: Array<Result>,
  resultSources: Array<ResultSource>,
  resultImports: Array<ResultImport>,
  auditLogs: Array<AuditLog>,
  users: Array<User>,
}
```

## Rules for frontend

1. **NEVER hardcode** category list, lottery list, head house list, etc.
2. Read from `window.state.<key>` instead.
3. If state load fails → show error UI + retry button (not silent fallback).
4. `LOTTERY_CATEGORIES` is a Proxy that reads `state.lotteryCategories` — safe to use directly.

## Why fail-hard instead of silent fallback?

Phase 2 bug history: `category="online"` was added in seed list but missing from `LOTTERY_CATEGORIES` → 18 lotteries silently disappeared from "หน้าแทงหวย".

Silent fallback hides bugs. Fail-hard surfaces them immediately.
