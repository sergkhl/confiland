# Confidence Workshop

A browser-local pact with an original manga tanuki guardian: choose an everyday action, build momentum, seal it together, and return with your own account of the attempt.

Play at **[confiland.globesoul.com](https://confiland.globesoul.com/)**. Source: [sergkhl/confiland](https://github.com/sergkhl/confiland).

## Play

Choose **Start a real conversation**, **Make a clear request**, or **Share a different view**. Each asks for a meaningful contribution: an update plus an open question, a specific request plus a reason, or a respectful different opinion plus a reason. A reply or agreement is never required. There are no practice categories, difficulty numbers, or automatic smaller/larger suggestions.

The guardian has his own stable stage above one changing panel: **challenge → stretch gesture → applicable concern or Skip → momentum → Seal pact → return review**. Answered prompts disappear only after they save. **Details** temporarily shows the commitment, criterion and an opening example. **Back** revisits choices; **Too much** offers reassurance, **Change action**, and **Pause for now** without signing.

For “How much of a stretch would this be?”, drag freely along the elastic meter or tap its track. A single manga speech balloon beside the guardian starts with **Your call.**, then previews **Doable / A stretch / Too much**. It reflects your choice. No number is displayed and the thumb does not snap to a category. Arrow keys adjust by five internal points; Home/End reach the endpoints, Enter/Space confirms, and Escape or cancellation restores the previous position. The untouched initial position never saves automatically.

**Doable** skips the concern question: the effort, skipped prediction and entry into momentum save atomically. **A stretch** and **Too much** keep the applicable concern choices and Skip; the worries do not become more severe as the slider moves. Selecting a concern or Skip saves it and enters sealing together.

**Tap to build momentum.** is the single heading, changing to **Ready to seal.** at full charge. Each completed tap adds 5 points internally; twenty steady taps fill the meter in approximately 5–7 seconds at three to four taps per second, without a minimum timer. After 450 milliseconds without a tap it drains at 12 points per second. **At my pace** keeps the same tap gain and removes decay. Enter and Space each count as an activation; holding a key does not generate automatic progress. No confidence score is shown.

A full meter stays ready and focuses the separate **Seal pact** button. Reaching full charge, extra taps, pausing, timers and reloads cannot seal. The first saved tap locks the action; draining to zero does not unlock it. Before that first tap, **Back** returns to the stretch slider for Doable or to the concern question for the other categories. Hiding or leaving the window pauses momentum, and reload restores the last saved charge with no offline drain. Failed saves pause the meter and offer **Retry loading**; a failed seal needs a fresh deliberate activation.

The guardian reacts to saved answers and tapping: curious, welcoming, determined, mischievously confident, surprised then reassuring, or thoughtfully apprehensive. Saved-answer reactions hold for 1.2 seconds unless a newer explicit answer replaces them. Charging builds through focused, determined and ready poses, each held at least 650 ms with only the newest pending pose retained. Short tap impulses stay responsive; 1.2 seconds without input returns him to relaxed attention. A successful saved seal triggers a 2.4-second comic sequence: 600 ms anticipation, 180 ms smear, 620 ms strike/ink impact and 1,000 ms delighted settle. Done is pleased, Tried encouraging, and Not today accepting. Reopening a seal does not replay the celebration. Reduced motion keeps facial changes and static symbols while removing movement effects.

Review is sequential: **outcome → applicable prediction comparison → effort**, or **outcome → non-attempt reason or Skip**. Done means the chosen action; Tried means a partial attempt. End with the summary and explicit **Close pact**. A skipped prediction has no invented observation, and an unattempted action has no invented effort. Back permits corrections until closure.

Normal phone and desktop layouts fit the viewport. The lower panel alone scrolls for short screens, expanded content or enlarged text; the guardian stays visible above it. Controls have at least 44 px targets and visible focus; the tap target is 104 px. Sound is optional.

One new pact may be sealed per local calendar date. Review an earlier open pact before starting a fresh one. **Try demo** and **Replay** are isolated rehearsals. There are no accounts, backend, notifications, streaks, scores, generated tasks, or clinical effectiveness claims.

## Local saves and compatibility

Daily state uses `confidence-workshop.ritual.v2` in localStorage; demo uses `confidence-workshop.demo.v2` in sessionStorage. Each retains the current pact and the latest closed review for each historical practice. The current pact ID and revision reject stale writes; mutations reread and compare the stored record, then save before exposing accepted input, a seal or an outcome.

The active catalogue is everyday-2. The six-action everyday-1 catalogue remains immutable compatibility data. Drafts carry catalogue identity; old choosing drafts refresh to the three actions only after the migration saves. Existing tracing, signed and reviewed actions retain their original wording, catalogue and dates.

The v2 extension includes phase `sealing`, a version-1 meter containing charge, started, pace and ready, and optional numeric `anticipatedValue`. Domain logic derives effort from its continuous 0–100 position: 0–33 is manageable, above 33–66 is stretch, and above 66 is too_much. Existing choosing drafts without a number reopen the slider at the old category midpoint as an uncommitted preview; their old answer stays saved until confirmation. Historical numerical measurements are never invented. Existing sealing charge, pace, started status and readiness survive tuning changes. Incomplete old AGREE traces migrate to an empty meter while retaining the original ink record; complete traces remain ready for explicit sealing. Zero legacy ink permits returning to choices; accepted old ink keeps its wording locked. New taps never fabricate AGREE progress. The retired geometry remains versioned as `agree-connected-1` for compatibility fixtures.

Meter snapshots contain charge, not wall-clock deadlines. Only active time after the current tap's grace period decays the visual meter. Taps and pause snapshots persist it; a new page resumes that saved amount without catching up hidden time. Local storage is not a server transaction system and makes no cross-device synchronization claim.

Original v1 keys remain intact, including on failed migration writes. Earlier signed **Say hello** and **Start 2 minutes** pacts retain their exact wording and recorded outcomes without invented practice, effort or ink. Malformed records are not silently cleared. Retry rereads the retained record.

## Develop

```sh
npm install
npm run dev
npm test
npx tsc --noEmit
npm run build
```

`npm run dev` starts Vinext/Vite with hot module replacement: saved React/TypeScript and CSS source changes update the open preview automatically. Open the Local URL printed by the server and keep the process running. `vite.config.ts` enables polling when `CODEX_SANDBOX=seatbelt` so source watching also works in the macOS Codex sandbox. `npm start` serves the existing build; use `npm run dev` while editing source.

The existing Sites/Vinext build targets Cloudflare Workers. `.openai/hosting.json` identifies the Site. [Repository instructions](AGENTS.md) authorize acceptance testing as part of the work without a separate permission question. Deployment and publication remain separate actions. This repository does not maintain a release manifest for now.

## GitHub Pages

The public GitHub repository publishes the site at **https://confiland.globesoul.com/**. `.github/workflows/pages.yml` runs on pushes to `main` and manual dispatch. It installs the lockfile dependencies, runs tests, TypeScript and targeted lint, then builds and validates the static artifact before deploying through the `github-pages` environment. GitHub Actions versions are pinned to release commits. The workflow uses the built-in GitHub token and OpenID Connect; it needs no deployment secret.

`npm run build:pages` sets `CONFILAND_STATIC_EXPORT=1` for a Vinext `output: 'export'` build. Only this mode omits the Sites/Cloudflare runtime plugins. Its public output is `dist/client/`, including the generated HTML, client scripts/styles, static RSC payload, fonts and guardian assets. The workflow uploads only that public directory. The home link uses ordinary document navigation, avoiding unnecessary RSC prefetch on this single-route static site.

The custom domain serves the app at `/`, so no repository-name base path is added. `public/CNAME` records `confiland.globesoul.com`, and `public/.nojekyll` preserves static assets without Jekyll processing. The domain's DNS CNAME points to `sergkhl.github.io`; GitHub Pages also records the custom domain and enforces HTTPS. DNS CNAME alone does not select the repository.

To preview the exported files locally after building:

```sh
python3 -m http.server 3002 --bind 127.0.0.1 --directory dist/client
```

Open `http://127.0.0.1:3002/?demo=1` for isolated play. Saved pacts belong to each browser origin; the custom domain does not copy saves from localhost or the earlier Sites address. `npm run dev` and the normal `npm run build` retain the existing development and Sites/Workers configuration. After a Pages export, run the normal build again before using the existing Worker-based `npm start` command.

## Core code and browser tools

- `lib/challenges.ts`: three authored actions, archived catalogue and answer vocabularies.
- `lib/ritual.ts` and `lib/pact-storage.ts`: guarded state transitions, save validation, compatibility, bounded reviews and independent stores.
- `lib/seal-meter.ts`: pure charging/decay rules; `lib/stretch-choice.ts`: one-pointer effort gesture ownership and cancellation.
- `lib/pact-flow.ts`, `lib/guardian.ts` and `lib/guardian-motion.ts`: next unanswered prompts, deterministic reactions, shared motion timings and latest-pose holding.
- `components/ritual/`: effort, momentum, choosing/review and guardian controls; `app/page.tsx` integrates persistence and the scene.
- `lib/webmcp.ts`: read-only **read_ritual**, including numeric stretch when recorded, and explicit **record_outcome**. No tool taps, seals, supplies observations, or closes a review.
- `public/guardian/`: individual transparent emotion and seal sprites. [Artwork notes](art-direction.md) own generation prompts, extraction and alpha acceptance; original atlases are identity references.

## Verification and remaining limits

**55 focused tests, TypeScript, targeted lint and the production build pass.** Coverage includes continuous stretch boundaries and cancellation, exact position reload, atomic Doable routing, legacy category previews, twenty-tap momentum and decay, pose holding and seal timing, paused reload, failed/stale writes, every legacy trace state, catalogue identity and all review branches. Local browser acceptance covers the complete demo flow, normal-speed mouse taps, keyboard choice/confirmation, Back, Details, unsigned pause, persistence errors, explicit sealing and closure. Phone, desktop, narrow preview, landscape and 200% text fixtures keep the guardian above the interaction. All thirteen transparent assets passed alpha and background checks; the runtime set is 2.90 MB. Detailed evidence is in the [completed plan](docs/plans/2026-09-07-real-world-pacts.md).

Browser tests use demo mode or isolated fixtures. Physical touchscreen input, finger occlusion and continuous animation/video observation were unavailable. Reduced-motion presentation passed a temporary forced CSS branch; system preference switching was not exercised. Normal mouse and keyboard activations, sampled animation states, and screenshots are recorded separately from those unavailable surfaces. Device-local saves or scripted outcomes never establish real-world activity or confidence effectiveness. Acceptance tests are already authorized; deployment remains a separate request.
