# Fantasy Command Center

A private NFL fantasy dashboard for Sleeper. It reads a configured league,
finds legal lineup, waiver, and one-for-one trade candidates, then uses
OpenRouter to rank and explain those grounded options.

The app is read-only. It never changes a Sleeper lineup or submits a
transaction.

## Stack

- Next.js 16, React 19, TypeScript, and Tailwind CSS 4
- Open-source [Untitled UI React](https://github.com/untitleduico/react)
  patterns and `@untitledui/icons`
- Master-password authentication with a signed, HttpOnly session cookie
- Sleeper's public NFL API and undocumented weekly projections endpoint
- OpenRouter's usage-based API with a configurable model

## Requirements

- Node.js 22 or newer
- npm
- An OpenRouter account with API credits
- A Sleeper username and league ID

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment:

   ```bash
   cp .env.example .env.local
   ```

3. Replace every placeholder in `.env.local`:

   ```dotenv
   APP_URL=http://localhost:3000
   DASHBOARD_PASSWORD=replace-with-a-long-random-master-password
   SLEEPER_USERNAME=your-sleeper-username
   SLEEPER_LEAGUE_ID=123456789012345678
   OPENROUTER_API_KEY=your-openrouter-api-key
   OPENROUTER_MODEL=google/gemini-2.5-flash-lite
   ```

   Use a unique, randomly generated value of at least 12 characters for
   `DASHBOARD_PASSWORD`.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open <http://localhost:3000>.

## Password authentication

The login form compares the submitted password with `DASHBOARD_PASSWORD` on the
server using a timing-safe digest comparison. A successful login receives a
signed session cookie with these properties:

- HttpOnly, so browser JavaScript cannot read it
- Secure in production
- SameSite Strict
- 30-day browser expiry

The password itself is never stored in the cookie or browser storage. Changing
`DASHBOARD_PASSWORD` immediately invalidates existing sessions.

## Sleeper data

`SLEEPER_USERNAME` identifies your roster. `SLEEPER_LEAGUE_ID` pins the app to
one league, even if the account belongs to several.

The app uses documented read-only endpoints for:

- NFL state
- league settings and scoring
- league users and rosters
- weekly matchups
- NFL player metadata

Weekly projections come from Sleeper's undocumented
`api.sleeper.com/projections` endpoint. That endpoint can change without
notice. Its response is isolated behind a validated adapter; if the shape
changes, the dashboard reports an unavailable data feed instead of generating
advice from missing information.

Recommendations also include the previous three weeks of actual scoring,
current Sleeper injury designations, the upcoming opponent, and 48-hour Sleeper
add trends. The dashboard does not include live news or web search. Always
verify late injury and inactive reports before kickoff.

## Recommendation pipeline

The model does not receive the full NFL player pool and cannot freely invent
moves. Application code first:

1. Applies the league's scoring settings to weekly projected stats.
2. Calculates recent scoring averages using the same league settings.
3. Optimizes legal roster slots, including flex and superflex eligibility.
4. Compares starter sets so slot rearrangements are never shown as lineup
   changes.
5. Finds start/sit differences from the current Sleeper lineup.
6. Finds free-agent upgrades using projections, recent production, injury
   context, and league-wide add activity.
7. Finds approximately balanced one-for-one trades that improve both rosters.

Only those candidate IDs and their relevant facts are sent to OpenRouter.
Structured model output is validated with Zod and rejected if it refers to an
unknown candidate.

Generation happens only when **Generate game plan** is selected. A valid
response is cached in `localStorage` using a fingerprint of the week, rosters,
starters, scoring, projections, and model. It does not persist across browsers
or devices.

## OpenRouter cost controls

OpenRouter bills by usage rather than requiring a monthly application
subscription. `OPENROUTER_MODEL` can be changed without a deployment code
change. The example uses a low-cost Gemini Flash-class model.

The request:

- sends only shortlisted candidates;
- uses a bounded completion size;
- uses structured JSON output;
- asks OpenRouter to prefer lower-cost providers;
- runs only on explicit user action.

Review the selected model's current token pricing in the OpenRouter catalog
before deployment.

## Deploy to Vercel

1. Import the repository into Vercel.
2. Add every variable from `.env.example` in Project Settings.
3. Set `APP_URL` to the production origin, without a trailing slash.
4. Deploy and verify that an incorrect password is rejected.

No application database, cron job, or Vercel storage product is required.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Playwright is configured for a login-page smoke test:

```bash
npx playwright install chromium
npm run test:e2e
```

## Security and operating notes

- `.env*` files are ignored except `.env.example`; never commit real keys.
- The OpenRouter key is used only by the authenticated server route.
- Use a strong, unique `DASHBOARD_PASSWORD` and rotate it if it is exposed.
- Sleeper's API is free for non-commercial use and recommends staying below
  1,000 calls per minute. This app uses server revalidation and a single-user
  flow well below that threshold.
- AI recommendations and projections are estimates, not guarantees.
