# SubBoost Edge

This workspace combines the SubBoost converter UI with the existing Cloudflare subscription Worker contracts.

## Architecture

- `app/` statically exports the SubBoost conversion workspace.
- `worker/` serves the static export through Workers Static Assets.
- `/sub`, `/clash`, `/shorten`, and `/test` retain the existing Worker API surface.
- `/api/source-import` proxies remote subscription content for the browser-side SubBoost parser.
- `/api/subscriptions` and `/config/:token` persist the generated YAML, source snapshot, and refresh settings in `SUB_KV`.
- `/dashboard` lists the authenticated administrator's KV records and supports editing, refreshing, downloading, and deleting them.
- `/login` uses a Worker Secret password and a signed HttpOnly session cookie; management and conversion endpoints require authentication.
- A Cloudflare Cron trigger runs every 15 minutes and refreshes subscriptions whose configured interval has elapsed.
- Failed refreshes keep serving the last successful YAML and retry after one hour.
- Legacy rolling seven-day YAML records are migrated to persistent records the next time their config URL is accessed.
- `/subboost-edge-source.tar.gz` serves the complete corresponding source generated from the current worktree.

## Commands

```bash
npm run edge:typecheck
npm run edge:build
npm run edge:deploy
```

The deployment config targets the existing `test` Worker and its `SUB_KV` namespace. Verify the Cloudflare account before deploying.

Configure the two required secrets before deployment:

```bash
npx wrangler secret put EDGE_ADMIN_PASSWORD --config edge/wrangler.jsonc
npx wrangler secret put EDGE_SESSION_SECRET --config edge/wrangler.jsonc
```

Public Clash config URLs remain bearer links so subscription clients do not need the web login password.

## License

SubBoost and this network-deployed derivative are licensed under AGPL-3.0-only. `npm run edge:build` creates a source archive before the static export so every deployment can provide its exact modified source from the header, footer, and mobile navigation.
