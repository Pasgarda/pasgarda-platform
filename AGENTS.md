# PASGARDA Platform — Agent Guide

## Stack

- **Laravel 13** (PHP ^8.3) + Inertia.js 3 + **React 19** + **Tailwind CSS 4** + **Vite 8**
- **Midtrans Snap** payment gateway; **Google OAuth** + **Email OTP** auth

## Developer Commands

| Command | What it does |
|---|---|
| `composer run dev` | Concurrent: `php artisan serve` + `queue:listen` + `pail` + `npm run dev` |
| `composer run test` | `php artisan config:clear` then `php artisan test` |
| `composer run setup` | Full first-time setup (install, .env, key:generate, migrate, npm build) |
| `npm run build` | Vite production build |
| `npm run dev` | Vite dev server only |

Run tests directly with `php artisan test` or `vendor/bin/phpunit`.

## Architecture

- **No SPA routes** — all Inertia page renders go through `routes/web.php`. Admin prefix `/admin`.
- **Entrypoints**: `resources/js/app.jsx` (Inertia React), `resources/css/app.css`, `resources/views/app.blade.php`
- **Models** in `app/Models/`, controllers in `app/Http/Controllers/` (grouped under `Admin/`, `Auth/`)
- **React pages** at `resources/js/Pages/` — mirrors directory structure (no router, Inertia resolves by name)
- **Shared Inertia props**: `auth.user`, `flash.status`, `flash.last_issued_ticket` (`app/Http/Middleware/HandleInertiaRequests.php:36`)
- **`design.md`** is the canonical product spec — consult it for business logic, scoring formulas, and DB schema

## Testing

- **PHPUnit** with `RefreshDatabase` trait; SQLite in-memory (`DB_DATABASE=:memory:`)
- Tests must create required DB records (Event, User, etc.) per test — no global fixtures
- Mock checkout flow (Midtrans bypass): leave `MIDTRANS_SERVER_KEY` empty in `.env`
- Run single test: `php artisan test --filter test_name`
- Feature tests in `tests/Feature/`, unit tests in `tests/Unit/`

## Auth & Roles

- Roles: `super_admin`, `admin`, `operator_gate`, `operator_nilai`, `coach`, `spectator` (enum in `users` table)
- Google OAuth (`/auth/google/*`) and Email OTP (`/auth/otp/*`)
- Self-voting blocked: user `name` is matched against contingent `coach_name`

## Scoring System

- **First round**: `PBB + Danton + Vafor + Kostum + Makeup - Penalties + Nilai Kontingen`
- **Final round** (top 2 U16 & U19): `Juri1 + Juri2 + VotingBonus - Penalties`
- **Nilai Kontingen**: vote rank % of `(PBB + Danton)` — top rank = 1%, down to 0.1% at rank 7
- **Pelatih Terbaik** = coach of Juara Utama 1 (automated, no manual input)
- Jury scores (`jury_scores` table) aggregate into the `scores` table automatically on submission

## Recap Module (Super Admin Only)
- Route: `GET /admin/events/{slug}/recap` → `RecapController@index`
- Permission: `recap` (only `super_admin`)
- Data sections:
  - **Konfigurasi Acara** — leaderboard status, voting day toggles, limits
  - **Keuangan** — grand total, tiket revenue, merch revenue, order status
  - **Tiket** — online sold, OTS, check-in, per-package breakdown table
  - **Kontingen** — total, verified, breakdown per kategori (U12/U16/U19/Purna)
  - **Voting** — total, Day 1 vs Day 2 breakdown, top 5 kontingen
  - **Supporter** — total, top 5 kontingen
  - **Sosmed** — total likes (reels + posts)
  - **Penilaian** — per kategori: kontingen, babak 1, entri juri, final
  - **Pesanan Terbaru** — 10 order terakhir
  - **Pengguna** — total + breakdown per role

## Live Leaderboard (Quickcount Style)
- Component: `resources/js/Components/LiveLeaderboard.jsx`
- Embedded in `Show.jsx` before Footer
- Polling: every 10s via `GET /api/events/{slug}/live-counts`
- 7 tabs: Kontingen Terbaik, Peserta Terfavorit, Kreator Terfavorit, Supporter Terfavorit, Sponsor Terbaik, The Final, Daftar Juara
- 4 category filters: SD (U12), SMP (U16), SMA (U19), Purna
- Animated progress bars, live pulsing indicator, "X Input Terproses" badge

## Key Quirks

- `.env.example` defaults to `DB_CONNECTION=sqlite`; session, cache, queue all default to `database` driver
- OTS tickets (admin-generated) allow optional buyer email — QR shown on admin screen if no email
- Leaderboard has `draft`/`published` state per event — public can only see when published
- `npm run dev` uses `concurrently` — kills all processes together (`--kill-others`)
- Static schedule data is hardcoded in `EventController::show()` (not in DB)
- No factories or seeders yet — migrations only
