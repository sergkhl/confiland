# Confidence Workshop

A browser-local pact with an original manga tanuki guardian: choose an everyday action, sign AGREE together, and return with your own account of the attempt.

## Play

Choose one of three equally available actions: **Start a real conversation**, **Make a clear request**, or **Share a different view**. Each asks for a meaningful contribution: an update plus an open question, a specific request plus a reason, or a respectful different opinion plus a reason. A reply or agreement is never required. There are no practice categories, difficulty numbers, or automatic smaller/larger-step suggestions.

One lower manga panel changes as you answer: **action → anticipated effort → prediction or Skip → signature → return review**. Saved answers replace the current prompt immediately. A short selected-action label remains; **Details** temporarily replaces the panel with the full commitment, completion criterion, and an opening example. **Back** revisits choices. The guardian stays in the same scene position throughout.

Choose anticipated effort (**Manageable / A stretch / Too much**) and an optional prediction, or **Skip**. Too much offers reassurance, **Change action**, and **Pause for now** to leave the pact unsigned. Selecting the final prediction saves it and enters signing in one guarded write. The signing screen can return to choices while accepted ink is zero; the first accepted stroke locks the wording.

Trace the connected **AGREE** guide from the red ring along the next red stroke. Lift to pause. Saved ink stays through interruption, resize, or reload. Re-grab at the ring; movement near a later letter cannot skip ahead. At the completed endpoint, deliberately release to seal. Reaching the end while holding, losing capture, hiding the page, or reloading cannot seal. A completed but unsigned trace needs a fresh endpoint press/release or **Seal this pact**.

For keyboard or taps, use **Write next stroke** to write the same path one authored segment at a time. Completing the path focuses **Seal this pact** and requires a separate activation. The trace surface accepts keyboard activation for the next stroke and cannot seal through that activation. There is no timer or speed score. Meaningful stages and pause status are announced without reading every pointer sample. Sound is optional.

The guardian responds to saved choices and signing activity: curious initially; welcoming for conversation; determined for a request; mischievously confident for a different view; a grin or resolve for anticipated effort; brief surprise then reassurance for Too much; thoughtful/apprehensive prediction cues; concentration while writing; relaxed attention while paused; and a short delighted response only after a new successful seal. Done is pleased, Tried encouraging, and Not today accepting. Reopening a seal never replays celebration. Reduced motion retains expressions and static symbols and hides the moving paw, while removing speed/bounce animations.

Review is sequential: **outcome → prediction comparison, when applicable → effort**, or **outcome → non-attempt reason or Skip**. Done means the chosen action; Tried means a partial attempt. The compact summary needs an explicit **Close pact**. No observation is invented for a skipped prediction or an unattempted action. Back permits corrections until closure.

The scene fits normal phone and desktop viewports. Unusually short screens and enlarged text scroll only the interaction panel. Controls have at least 44 px targets and visible keyboard focus. The current preview retains the original opaque atlas pending verified transparent replacements; the expression system and new asset slots are implemented, but the transparent artwork gate remains open in [art-direction.md](art-direction.md).

One new pact may be signed per local calendar date. An earlier open pact keeps its actual date and must be reviewed or explicitly closed before a fresh pact. An unsigned draft crossing midnight consumes no daily commitment. **Try demo** and **Replay** are isolated rehearsals. No accounts, backend, notifications, streaks, scores, generated tasks, or clinical effectiveness claims are present.

## Local saves and compatibility

Daily state uses `confidence-workshop.ritual.v2` in `localStorage`; demo state uses `confidence-workshop.demo.v2` in `sessionStorage`. Each mode retains only its current pact and the latest closed review for each of the two practices. A revision and current ritual ID guard late mutations.

The active catalogue is `everyday-2`; the unchanged six-action `everyday-1` catalogue is read-only compatibility data. Unsigned drafts now carry catalogue identity. Old choosing drafts refresh to the three new actions with an explanation only after the migration write succeeds. Existing traces, signed wording, dates, and reviews keep their original catalogue. An old zero-ink trace can explicitly return to the new choices; accepted old ink can still sign only its original action text.

The original `.v1` keys are retained on compatibility writes, including a failed write; a valid v2 record takes precedence afterward. Earlier signed actions preserve exactly **Say hello** or **Start 2 minutes** and any recorded outcome. An unfinished v1 pact can be honestly reviewed, carries no fabricated AGREE ink, and carries no invented practice or difficulty observations. Malformed records are not silently cleared. Retry rereads the retained record; a failed action must be deliberately made again.

Mutations reread and compare the saved record before applying an event, and save successfully before exposing accepted ink, a seal, or an outcome. Pointer samples are coalesced into one write per animation frame; unsaved movement is not painted as accepted ink. Local storage is not a server transaction system. The comparison rejects a stale page's next write, and storage events refresh other pages; the app makes no cross-device synchronization claim.

`agree-connected-1` owns the exact path geometry. Its ordered progress gives each letter and its joining stroke one fifth of the range. Preserve that geometry for existing records; do not reinterpret a saved percentage when changing artwork. A three-unit capture at the end of the current, nearly finished segment accommodates rounded browser pixels without selecting a later segment. Input ownership is ephemeral and never serialized. The state machine and input guard are both required: the reducer cannot itself prove physical pointer input.

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

## Core code and browser tools

- `lib/challenges.ts`: three active authored actions, the immutable archived catalogue, and answer vocabularies.
- `lib/pact-flow.ts` and `lib/guardian.ts`: next unanswered prompts and deterministic emotional reactions.
- `lib/ritual.ts`: guarded pact transitions, validation, bounded prior reviews, and compatibility.
- `lib/pact-storage.ts`: save-before-display and stale-state rejection for independent daily/demo stores.
- `lib/legacy-ritual.ts`: validation-only reader for earlier saves; retired gestures have no active implementation.
- `lib/signature-path.ts`: versioned geometry, ordered segment sampling, coordinate normalization, and cancellable input ownership.
- `components/ritual/`: choice and signature controls. `app/page.tsx` owns the scene and persistence integration.
- `lib/webmcp.ts`: read-only `read_ritual` and guarded `record_outcome`. The latter requires the current ID and reviewing phase, accepts only an explicit outcome, and supplies no effort, prediction comparison, reason, or completed review. No browser tool signs or bypasses the trace.
- `public/guardian-atlas.png` and `public/guardian-signing-atlas.png`: original body poses and companion foreground artwork. Sources, prompts, crop anchors, and rendering limitations live in [art-direction.md](art-direction.md).

## Verification and remaining limits

All **40 focused tests**, TypeScript, targeted lint, and the production build pass. Tests cover catalogue migration (including failed writes), every archived action's partial trace and signed/closed state, immutable wording, atomic prediction/signing, zero-ink return, conditional review, local dates, failed/stale writes, daily/demo isolation, and the retained signature path guards. Vinext still emits its non-failing unknown-route classification notice.

Local in-app browser demo checks cover exactly three actions; immediate replacement; Details and Back; Too much and unsigned pause; keyboard and mouse ink; zero-ink Back and locking after ink; partial and completed trace reload; explicit sealing; no replayed celebration; all three outcomes; chosen/skipped predictions; corrections; and explicit closure. The current 612 × 734 preview, 390 × 844 phone, and 1280 × 900 desktop fit without page scrolling. At 844 × 390 landscape, scrolling stays in the panel. A temporary 200% root-text fixture kept the page within 390 × 844 and every control at least 44 px tall. A temporary demo-only save exception retained saved ink and displayed recovery. Both temporary fixtures were removed. The preserved hot-reload evidence is in the active plan.

The reduced-motion CSS branch was exercised with a temporary local rule override: all effect animations were disabled, the moving paw was hidden, and the seal still changed the expression with static symbols. This is not a system-preference switching test. True touch trajectories, a separately held pointer during page hiding, continuous animation/timing quality, physical finger occlusion, audible output, assistive technology output, and vibration remain unverified. Browser storage/date faults remain covered by deterministic storage fixtures, rather than actual quota/clock manipulation.

Transparent artwork is **not complete**: the curious pose and both extraction/export edits were RGB with baked checkerboards. The first genuine-alpha gate therefore prevented production of the remaining pose set. Existing artwork remains visible until a permitted extraction method and the full set pass alpha, white-fur edge, framing, light/dark/colored-background, and preload acceptance. See the [active plan](docs/plans/2026-09-07-real-world-pacts.md) for the concrete next step. Acceptance testing needs no further permission; deployment is separately requested.
