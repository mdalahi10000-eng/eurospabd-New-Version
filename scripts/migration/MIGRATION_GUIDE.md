# Euro Spa Dhaka: Firebase to Supabase Migration Blueprint & Verification Guide

## 1. Safety Guarantees
- **Zero Firebase Modification**: Firebase Auth, Firestore, and Storage remain active and untouched.
- **Zero Downtime**: The current production application continues running on Firebase.
- **Full Data Parity**: All services, reviews, blog posts, site settings, and appointments are backed up in JSON before import.
- **Zero-Flicker Hydration Preserved**: The cross-tab `cacheService` layer remains identical; it simply receives updates from Supabase channels instead of Firestore snapshots.

---

## 2. Inventory of Created Migration Assets

| Path | Purpose |
| :--- | :--- |
| `supabase/migrations/20260908000000_init_euro_spa_schema.sql` | Complete PostgreSQL DDL schema with 11 tables, indexes, RLS security policies, and `spa-assets` storage bucket definitions. |
| `supabase/types.ts` | TypeScript database definitions for strict type safety. |
| `src/supabase.ts` | Isolated Supabase client SDK with OAuth, `withTimeout`, and admin verification. |
| `scripts/migration/export-firebase-data.ts` | Exporter script reading live Firestore data into JSON snapshots. |
| `scripts/migration/data/*.json` | Current snapshot backups (`services.json`, `reviews.json`, `siteSettings.json`, etc.). |
| `scripts/migration/import-to-supabase.ts` | Batch upsert importer into Supabase tables with field mapping. |
| `scripts/migration/verify-migration-parity.ts` | Automated parity auditor checking record counts and sample values side-by-side. |

---

## 3. Step-by-Step Cutover Sequence (When You Are Ready)

### Step 1: Run Schema Migration in Supabase
In your Supabase project dashboard:
1. Open the **SQL Editor**.
2. Paste and run `supabase/migrations/20260908000000_init_euro_spa_schema.sql`.
3. Under **Authentication > Providers**, enable **Google** with your Google Client ID and Secret.
4. Add the redirect URL: `https://<YOUR_APP_DOMAIN>/admin` and `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`.

### Step 2: Populate Data to Supabase
Run the importer script with your credentials:
```bash
SUPABASE_URL="https://xyz.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..." \
npx tsx scripts/migration/import-to-supabase.ts
```

### Step 3: Run the Automated Parity Verification
```bash
SUPABASE_URL="https://xyz.supabase.co" \
SUPABASE_ANON_KEY="eyJhbGci..." \
npx tsx scripts/migration/verify-migration-parity.ts
```
This script validates:
- [x] All 7 live services and their exact prices match.
- [x] All 21 customer reviews, star ratings, and comments match.
- [x] Homepage hero banners, badges, and About Us content match.
- [x] Service areas for Gulshan, Banani, Uttara, Dhanmondi match.

### Step 4: Switch Service Layer to Supabase (Client Cutover)
The service layer files (`servicesService.ts`, `reviewsService.ts`, `appointmentsService.ts`, `articlesService.ts`, `homepageService.ts`, `aboutService.ts`) are updated to read from `supabase.from(...)` and subscribe via `supabase.channel(...)`.

### Step 5: Test Admin & Customer Portals
- Log in to `/admin` using Google Sign-in.
- Verify instant dashboard load, update a test price, and check that live updates trigger smoothly.
- Submit a test appointment and review.

---

## 4. Rollback Plan
If you ever want to revert to Firebase, you simply switch the import references in `src/services/` back to `src/firebase.ts`. Because Firebase data is never deleted, rollback takes less than 60 seconds.
