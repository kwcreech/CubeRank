# CubeRank

Community reviews, radar charts, and leaderboards for speedcubes.

CubeRank is a web app for rating and comparing WCA-style puzzles. Members score cubes on five feel metrics, write a review, and optionally attach a YouTube clip. Those ratings power catalog pages, side-by-side compares, Bayesian leaderboards, and a RAG assistant that recommends cubes from real community write-ups — not invented specs.

The catalog covers WCA-style puzzles (2×2 through 7×7, Megaminx, Pyraminx, Skewb, Square-1, Clock, and FTO). New cubes enter a staging queue; an admin publishes them before they appear in the live catalog.

---

## Features

### Reviews and radars

Each signed-in user can leave **one review per cube**. A review includes:

- Five 1–10 scores: **controllability**, **stability**, **turning**, **customizability**, and **value**
- Written notes (up to 5,000 characters)
- An optional YouTube URL
- An overall score (the mean of the five metrics)

Radars on cube pages, compares, and the landing page visualize those scores.

### Cube catalog

Browse LIVE cubes with search, type, and brand filters. Cube pages show brand and type, community averages, a radar, and recent reviews. Guests can browse; signing in is required to write a review.

### Compare

Pick two cubes of the **same type** and see their radars and averages side by side, plus the highest- and lowest-scoring reviews for each cube.

### Leaderboards

- **Cubes** — ranked with a Bayesian average so a handful of 10s does not instantly outrank a cube with many solid reviews. Filter by type and brand; sort by overall or any single metric.
- **Users** — ranked by review count (ties share a rank).

### Home feed

The signed-in (and guest) home page surfaces recent reviews, top 3×3 cubes, cubes with the most reviews, and top contributors.

### Recommendation assistant

Signed-in users can ask for recommendations grounded in embedded community reviews. The assistant:

- Embeds the question and retrieves similar review snippets with pgvector
- Answers only from retrieved reviews and cube metadata
- Returns citations back to the source reviews
- Enforces prompt length, per-user and per-IP hourly quotas, input/output filters, and concurrent OpenAI limits

### Profiles and settings

Public profiles (`/users/{username}`) show avatar, review count, contributor rank, top cubes by type, and review history. Settings cover username, avatar upload (Supabase Storage), and light / dark / system theme.

### Auth

Email and password via Supabase Auth: sign up, log in, password reset, and session refresh. The first authenticated API call just-in-time provisions a CubeRank user row (same UUID as the Auth user).

### Admin

Users with the `ADMIN` role get an extra nav item for:

- Staging queue — approve or reject new catalog products (one at a time or all)
- Emergency catalog ingest (dormant; not scheduled)
- Embedding backfill for reviews missing a vector row

### Catalog ingest

Catalog updates are not automatic. An admin-only ingest control remains for emergencies and is not part of the live catalog pipeline. If it is used, new cubes land in staging; an admin publishes them to `LIVE`.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | [Next.js](https://nextjs.org/) 16 (App Router), React 19, TypeScript |
| UI | [Tailwind CSS](https://tailwindcss.com/) 4, [shadcn/ui](https://ui.shadcn.com/) (Base Nova), [Recharts](https://recharts.org/), [Motion](https://motion.dev/), [Lucide](https://lucide.dev/), [@cubing/icons](https://icons.cubing.net/) |
| Auth (browser) | [Supabase Auth](https://supabase.com/docs/guides/auth) (`@supabase/ssr`) |
| API | [Spring Boot](https://spring.io/projects/spring-boot) 4.1, Java 21, Spring Web MVC |
| Security | Spring Security OAuth2 resource server (Supabase JWTs, ES256) |
| Database | [Supabase Postgres](https://supabase.com/docs/guides/database) with [pgvector](https://github.com/pgvector/pgvector) |
| Schema | Flyway migrations; Hibernate / Spring Data JPA (`ddl-auto: validate`) |
| Storage | Supabase Storage public `avatars` bucket |
| AI | OpenAI `text-embedding-3-small` (1536-d) and `gpt-4o-mini` |
