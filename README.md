# AoE2 Scout (PWA)

One button: loads your current/latest match and shows one line per opponent and teammate.
Static files only (no build step). Data: data.aoe2companion.com/api/matches.

## Deploy (free, ~3 min)
Cloudflare Pages: Workers & Pages > Create > Pages > Upload assets > drop this folder.
Or GitHub Pages: push these files to a repo, Settings > Pages > deploy from main branch.
Open the URL in Chrome on Android > menu > "Install app" / "Add to Home screen".

## If it says "cannot reach the API"
The browser may block direct calls (CORS). Deploy proxy-worker.js as a Cloudflare Worker,
then in the app: Settings > API/proxy URL = https://<your-worker>.workers.dev/api

## Notes
- Profile ID is stored in the phone's local storage (default 6560794).
- Fewer than 5 recent Team RM games = "thin data": civ-only advice, no play-style claim.
- civs.js holds the civ table; civs marked "rough" are less certain. Edit freely.
