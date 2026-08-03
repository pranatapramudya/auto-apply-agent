# PRD-v06: UI/UX Redesign, Database Synchronization, & Bug Fixes

## 1. Project Overview & Vision
- **Project Name**: One Salesman
- **Architecture**: Zero-Cost (Localhost for Scraper/Bot, Neon Serverless for Database, Vercel for Dashboard UI).
- **Goal of v06**: Address critical UI/UX shortcomings in the dashboard, synchronize database schema changes, and fix persistent data extraction bugs in the scraper to ensure data integrity and a premium user experience.

## 2. Identified Bugs & Loopholes
### Bug 1: Prisma Schema Desync (The "Red Error Screen")
- **Symptom**: Next.js throws a `PrismaClientKnownRequestError: The column \`(not available)\` does not exist in the current database` when attempting to fetch data (`prisma.prospect.findMany()`).
- **Root Cause**: The Next.js application code is requesting columns or using a generated Prisma Client that does not match the actual schema of the remote NeonDB database. Specifically, the newly added `city` column (or other recent schema changes) hasn't been properly migrated or the local client hasn't been regenerated.
- **Fix**: Force a database schema synchronization and regenerate the Prisma Client.

### Bug 2: Scraper Extraction Error ("Hasil" Business Name)
- **Symptom**: All newly scraped prospects have their `businessName` recorded as "Hasil" instead of their actual business names (e.g., Cake A Wish, Majakoffie).
- **Root Cause**: The Playwright scraper logic in `src/scraper/gmaps.ts` is likely targeting the wrong DOM element or misinterpreting a UI label (like a search result header) as the business name.
- **Fix**: Inspect the Google Maps DOM structure and update the Playwright selector in `gmaps.ts` to accurately target the business title element (usually an `h1` or a specific class within the listing card).

### UI/UX Shortcoming: Subpar Dashboard Design
- **Symptom**: The current UI feels "polos" (basic), with unrefined proportions (e.g., a massive Hot Leads fire icon) and styling that doesn't meet premium SaaS standards.
- **Root Cause**: Lack of cohesive Tailwind styling, improper component sizing, and unpolished layouts.
- **Fix**: Complete frontend overhaul using a modern, refined design system.

## 3. Action Plan & Feature Specifications

### Phase 1: Database & Backend Fixes (Critical)
1. **Fix Prisma Desync**:
   - Run `npx prisma db push` (or `npx prisma migrate dev` if using migrations) to ensure the NeonDB schema matches `schema.prisma`.
   - Run `npx prisma generate` to rebuild the local client.
   - Restart the Next.js development server.
2. **Fix Scraper Logic (`src/scraper/gmaps.ts`)**:
   - Correct the selector for `businessName`. Ensure it extracts the actual title of the place, not a generic UI label.

### Phase 2: UI/UX Redesign (Frontend Overhaul)
- **Design Language**: Implement a clean, professional "shadcn/ui" aesthetic.
- **Layout Adjustments**:
  - Fix the oversized "Hot Leads" icon. Make it subtle and proportionate to the text.
  - Standardize the height and padding of the Stats Cards.
- **Filter Bar Integration**:
  - Replace raw dropdowns with a styled, cohesive filter bar.
  - Ensure filters (Category, City, Status) work concurrently and update the table/stats reactively.
- **Table Styling**:
  - Refine typography (smaller, uppercase headers, clear data rows).
  - Improve badge styling (Status pills should be compact with solid background colors).
  - Display the `city` column clearly.

## 4. Expected Outcome
Upon completion, the dashboard will load without Prisma errors, the scraper will save correct business names, and the UI will reflect a premium, highly functional control center for managing B2B leads.