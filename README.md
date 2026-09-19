# Fantasy Command Center

Fantasy Command Center is a private decision assistant for your Sleeper NFL
fantasy league. It turns your current matchup, roster, league rules,
projections, recent performance, injuries, and player trends into a focused
weekly game plan.

Instead of asking you to compare dozens of players and screens, it answers:

- How does my matchup look this week?
- Is my current starting lineup the best available option?
- Which waiver move would actually improve my roster?
- Is there a trade that could help both managers?
- What should I do first, and what is the risk?

The dashboard is read-only. It never changes your Sleeper lineup, adds or drops
a player, or submits a trade.

## What you get

### A weekly briefing

The opening dashboard summarizes your matchup, projected advantage or deficit,
lineup readiness, injury concerns, and the number of opportunities worth
reviewing.

### Five prioritized moves

The decision desk ranks the best lineup, waiver, and trade options together and
shows no more than five. Each recommendation includes:

- the move to make;
- its projected point impact;
- a confidence level;
- the evidence supporting it;
- the main reason it could go wrong.

Players stored in your Sleeper injury-reserve slot are protected. The dashboard
will not recommend dropping an IR stash just because a healthy free agent has a
better current-week projection.

### Advice based on your league

Recommendations use your actual scoring rules, roster positions, current
starters, available players, opponent, recent scoring, injuries, and Sleeper
add/drop activity. This makes the advice specific to your team rather than a
generic player ranking.

### Telegram briefings

The same game plan can be delivered to a Telegram channel:

- automatically every day at 08:00 in the `Europe/Zurich` timezone;
- immediately whenever you generate or refresh the game plan in the dashboard.

Telegram receives two messages: **The analyst's read** followed by the five
**Next best moves**.

## Configuration options

Create `.env.local` for local use or add these values to the Production
environment in Vercel.

| Option | Required | What it controls |
| --- | --- | --- |
| `APP_URL` | Yes | The public address of the dashboard, such as `https://fantasy.example.com`. |
| `DASHBOARD_PASSWORD` | Yes | The private password used to open the dashboard. Use a unique value of at least 12 characters. |
| `SLEEPER_USERNAME` | Yes | The Sleeper account whose roster should be analyzed. |
| `SLEEPER_LEAGUE_ID` | Yes | The league to analyze. The numeric ID can be copied from the Sleeper league URL. |
| `OPENROUTER_API_KEY` | Yes | Authorizes the AI-generated briefing and recommendation explanations. |
| `OPENROUTER_MODEL` | Yes | Selects the OpenRouter model. A fast, economical model is usually sufficient. |
| `TELEGRAM_BOT_TOKEN` | For Telegram | The token issued by Telegram's BotFather. |
| `TELEGRAM_CHAT_ID` | For Telegram | The destination channel username, such as `@my_fantasy_channel`, or its numeric private-channel ID. |
| `CRON_SECRET` | For scheduled Telegram updates | Protects the daily briefing endpoint. Use the same value for the GitHub repository secret `DAILY_BRIEFING_SECRET`. |

An example configuration is available in [`.env.example`](./.env.example).

## Getting started

1. Install the project:

   ```bash
   npm install
   ```

2. Copy the example configuration:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in your Sleeper, dashboard, and OpenRouter settings.

4. Start the dashboard:

   ```bash
   npm run dev
   ```

5. Open <http://localhost:3000>, sign in, and generate your first game plan.

## Setting up Telegram

1. Create a bot with Telegram's **BotFather** and copy its token.
2. Add the bot to your target channel as an administrator with permission to
   publish messages.
3. For a public channel, use its username as the chat ID, for example
   `@my_fantasy_channel`.
4. For a private channel, publish a new channel message after adding the bot,
   then open:

   ```text
   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```

   Copy the value under `channel_post.chat.id`. It normally starts with `-100`.

5. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to the Vercel Production
   environment.
6. Add the same strong random scheduling secret as:
   - `CRON_SECRET` in Vercel;
   - `DAILY_BRIEFING_SECRET` in the GitHub repository's Actions secrets.
7. Redeploy the project, then manually run **Daily Telegram briefing** from the
   repository's Actions tab to confirm delivery.

Keep the bot token and scheduling secret private.

## Deploying

1. Import the repository into Vercel.
2. Add the required configuration options to the Production environment.
3. Set `APP_URL` to the final production address.
4. Deploy the project.

After adding or changing a Vercel environment variable, redeploy so the new
value is available to the application.

## Important limitations

- Recommendations and projections are estimates, not guarantees.
- The dashboard does not currently include live news or web search.
- Always verify late injuries, inactive reports, and kickoff-time changes in
  Sleeper.
- All lineup changes and transactions must be completed in Sleeper.
- Generating a game plan uses the configured OpenRouter model and may incur a
  small usage charge.
