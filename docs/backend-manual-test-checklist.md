# Backend manual test checklist (pre-frontend)

Assume API base: `http://localhost:8080`

Use this file as the runbook when asking the agent to execute manual API tests. Check off items as they pass; on failure note **HTTP status + response body + step number**.

---

## 0. Prerequisites

- [ ] **Supabase ready**
  - `pgvector` enabled (Database → Extensions)
  - `avatars` bucket can wait (not used by these APIs yet)
- [ ] **`backend/.env` filled** with real `DATABASE_*`, `SUPABASE_ISSUER_URI`, `SUPABASE_JWKS_URL`, `INGEST_CRON_SECRET`
  - Prefer **Session pooler** JDBC URL (IPv4): `jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require`
  - Pooler username is `postgres.<project-ref>` (not bare `postgres`)
  - Direct `db.<ref>.supabase.co` is IPv6-only and fails on many networks
- [ ] **Auth redirects** not required for API tests; you’ll get a JWT from Supabase Auth directly
- [ ] **Start the API** from `backend/`:
  ```powershell
  cd C:\Users\kerry\Downloads\dev\CubeRank\backend
  .\mvnw.cmd spring-boot:run
  ```
  Expect Flyway to create tables/views on first boot with no errors.

---

## 1. Get a JWT (needed for auth’d routes)

**Create a user** (Supabase Auth REST), or use one you already created in the dashboard:

```powershell
# Sign up (or use /token?grant_type=password if user already exists)
$body = @{ email = "kerrywcreech@gmail.com"; password = "your-password" } | ConvertTo-Json
Invoke-RestMethod -Method POST `
  -Uri "https://YOUR_PROJECT_REF.supabase.co/auth/v1/signup" `
  -Headers @{ apikey = "YOUR_PUBLISHABLE_KEY"; "Content-Type" = "application/json" } `
  -Body $body
```

Save `access_token` from the response as `$TOKEN`.

```powershell
$TOKEN = "eyJ..."   # paste access_token
$H = @{ Authorization = "Bearer $TOKEN" }
```

---

## 2. Profile / auth wiring

- [ ] **`GET /api/me` without token → 401**
  ```powershell
  Invoke-WebRequest http://localhost:8080/api/me
  ```
- [ ] **`GET /api/me` with token → 200**, creates `users` row, returns username/email/role/`reviewCount`/`rank`
  ```powershell
  Invoke-RestMethod http://localhost:8080/api/me -Headers $H
  ```
- [ ] **Confirm row in Supabase** SQL editor: `select * from users;`
- [ ] **`PATCH /api/me`** change username
  ```powershell
  Invoke-RestMethod -Method PATCH http://localhost:8080/api/me -Headers ($H + @{ "Content-Type"="application/json" }) `
    -Body (@{ username = "testcuber" } | ConvertTo-Json)
  ```
- [ ] **`GET /api/users/testcuber`** (public) → profile with empty/zero reviews

---

## 3. Promote yourself to admin

- [ ] In Supabase SQL:
  ```sql
  update users set role = 'ADMIN' where email = 'you@example.com';
  ```
- [ ] Call `GET /api/me` again → `role` should be `ADMIN`
  (If still `USER`, get a fresh token / restart isn’t needed; role is read from DB each request.)

---

## 4. Catalog ingest

- [ ] **Bad secret → 401**
  ```powershell
  Invoke-WebRequest -Method POST http://localhost:8080/api/internal/catalog/ingest `
    -Headers @{ "X-Ingest-Secret" = "wrong" }
  ```
- [ ] **Good secret → 200** (may take a few minutes; TheCubicle pagination + delays)
  ```powershell
  Invoke-RestMethod -Method POST http://localhost:8080/api/internal/catalog/ingest `
    -Headers @{ "X-Ingest-Secret" = "YOUR_INGEST_CRON_SECRET" }
  ```
  Check response: `created` > 0, `collectionsProcessed` = 12, skim `warnings`.
- [ ] **Optional:** same ingest via admin JWT
  ```powershell
  Invoke-RestMethod -Method POST http://localhost:8080/api/admin/catalog/ingest -Headers $H
  ```
- [ ] In SQL: `select status, count(*) from cubes group by status;` → mostly `STAGING`

---

## 5. Admin staging → LIVE

- [ ] **`GET /api/admin/cubes/staging`** → list of staging cubes (needs admin JWT)
- [ ] **`GET /api/cubes`** → empty or few LIVE (public)
- [ ] **Approve a few cubes** (pick ids from staging):
  ```powershell
  Invoke-RestMethod -Method POST http://localhost:8080/api/admin/cubes/123/approve -Headers $H
  ```
- [ ] **`GET /api/cubes`** → those cubes appear
- [ ] **`GET /api/cubes/meta`** → types/brands populated
- [ ] **`GET /api/cubes/{id}`** for a LIVE id → detail JSON
- [ ] **`GET /api/cubes/{stagingId}`** for a still-STAGING id → 404
- [ ] **`DELETE /api/admin/cubes/{stagingId}`** → rejects/deletes staging; confirm gone from staging list
- [ ] Non-admin token on `/api/admin/**` → 403

---

## 6. Reviews + metrics

Use a LIVE `$CUBE_ID`.

- [ ] **Create review**
  ```powershell
  $reviewBody = @{
    cubeId = $CUBE_ID
    writtenContent = "Smooth turning, solid corner cutting replacement is turning metric."
    youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    metrics = @{ speed = 8; stability = 7; turning = 9; customizability = 6; value = 8 }
  } | ConvertTo-Json -Depth 5
  $review = Invoke-RestMethod -Method POST http://localhost:8080/api/reviews -Headers ($H + @{ "Content-Type"="application/json" }) -Body $reviewBody
  $REVIEW_ID = $review.id
  ```
- [ ] **Duplicate create same cube → 409**
- [ ] **Review STAGING cube → 400**
- [ ] **Bad metrics (e.g. 11) → 400**
- [ ] **Bad YouTube URL → 400**
- [ ] **`GET /api/reviews/cube/{cubeId}`** → includes your review
- [ ] **`GET /api/reviews/{id}`** → detail
- [ ] **`GET /api/reviews/cube/{cubeId}/mine`** with JWT → your review
- [ ] **`PUT /api/reviews/{id}`** update text/metrics → 200
- [ ] Second user (optional): cannot `PUT`/`DELETE` first user’s review → 403
- [ ] **`DELETE /api/reviews/{id}`** → 204; list no longer shows it
  (Re-create one review afterward so leaderboards/profile have data.)

---

## 7. Profile after reviews

- [ ] **`GET /api/me`** → `reviewCount` ≥ 1, `rank` set
- [ ] **`GET /api/users/{username}`** → reviews newest-first, `topCubesByType` populated for types you reviewed

---

## 8. Leaderboards

- [ ] Add **2+ reviews on different LIVE cubes** (and ideally a second user) so rankings aren’t trivial
- [ ] **`GET /api/leaderboards/cubes`** → ranked list with `bayesianScore`
- [ ] **`GET /api/leaderboards/cubes?type=3x3`**
- [ ] **`GET /api/leaderboards/cubes?brand=MoYu`** (use a real brand from `/api/cubes/meta`)
- [ ] **`GET /api/leaderboards/cubes?sortBy=stability`**
- [ ] Cubes with few reviews shouldn’t auto-dominate highly reviewed ones (spot-check Bayesian effect)
- [ ] **`GET /api/leaderboards/users`** → you appear with review count

---

## 9. Cube compare

Use two LIVE cubes of the **same type** (`$LEFT_ID`, `$RIGHT_ID`). Prefer cubes that already have reviews.

```powershell
Invoke-RestMethod "http://localhost:8080/api/cubes/compare?leftId=$LEFT_ID&rightId=$RIGHT_ID"
```

- [x] **Happy path (same type, both reviewed)** → 200; `left`/`right` each have `cube` (with `metrics` + `reviewCount`), `bestReview`, `worstReview`
- [x] Best review mean ≥ worst review mean on each side (spot-check metrics)
- [x] **Same id twice** (`leftId=rightId`) → 400
- [x] **Different types** (e.g. 3x3 vs 2x2) → 400
- [x] **Missing / STAGING cube id** → 404
- [x] **Zero-review LIVE cube** on one side → that side’s `metrics`, `bestReview`, `worstReview` are null; `reviewCount` is 0
- [x] **One-review LIVE cube** → `bestReview.id` equals `worstReview.id`
- [x] Public without token → 200 (same as other cube GETs)

---

## 10. Security smoke checks

- [ ] Public OK without token: `/api/cubes`, `/api/cubes/compare`, `/api/leaderboards/*`, `/api/users/{username}`, `GET /api/reviews/...`
- [ ] Protected without token → 401: `POST /api/reviews`, `PATCH /api/me`, `/api/admin/**`
- [ ] Expired/garbage Bearer token → 401
- [ ] Internal ingest ignores JWT; only `X-Ingest-Secret` matters

---

## Suggested happy-path order

1. Boot app + Flyway
2. JWT + `/api/me` + promote ADMIN
3. Ingest → approve a handful of cubes
4. Post/edit reviews
5. Profile + both leaderboards
6. Cube compare (same-type pair)
7. Negative cases (401/403/409/400)

---

## Not in scope yet (skip)

- Frontend / shadcn UI
- Avatar upload (Storage)
- RAG / embeddings / OpenAI calls
- GitHub Actions cron against a deployed URL
