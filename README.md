# Confidence Workshop

A small manga ritual with an original fantasy tanuki guardian. Two choices, two tactile gestures, three honest outcomes.

## Play

Choose **Say hello** or **Start 2 minutes**, then hold the token in the guardian's paw for 900 ms. Completing the seal locks the choice. Grab his outstretched paw and pull upward: progress cannot move backward, and release/reload preserves the furthest position. After the real-world action, return and report **Done**, **Tried**, or **Not today**.

**Try demo** runs the same flow with a replay control. It never changes the daily ritual. The daily ritual is local to this browser (`localStorage`); the demo is local to this tab (`sessionStorage`). One new commitment per local calendar date. Unfinished commitments carry forward until reported. There is no account, backend, confidence score, streak, or generated conversation.

Keyboard: hold Space/Enter on the selected token; press Up Arrow on the offered paw to advance one notch. Sounds can be muted. Vibration is optional and browser-dependent. Reduced-motion styles disable idle and completion animations.

## Develop

```sh
npm install
npm run dev
npm test
npx tsc --noEmit
npm run build
```

The Sites/Vinext starter builds the app for Cloudflare Workers. `.openai/hosting.json` identifies the private Site. Sites owns deployment credentials and runtime resources.

## Core code

The real-world pact implementation is being introduced in ordered units. The current scene exposes six authored actions with personal effort and optional prediction choices. Signature geometry and the final verification record follow in the owning plan.

Pact saves use `confidence-workshop.ritual.v2` in browser-local storage and `confidence-workshop.demo.v2` in tab-local storage. The v1 keys are retained during compatibility writes, including after a successful migration; v2 takes precedence afterward. An earlier signed action keeps its exact original label and outcome, carries no invented AGREE progress, and never enters practice difficulty suggestions. Malformed saves stay recoverable rather than being cleared. A mutation rereads and compares the current record, then writes successfully before displaying new ink, a seal, or an outcome. Unsigned drafts do not consume a local date; the seal checks the actual date. Earlier open pacts must be explicitly reviewed before the next pact.

- `app/page.tsx`: responsive scene, gesture handlers, browser persistence, and optional browser-agent registration.
- `lib/ritual.ts`: guarded transitions, save validation, local-date handling, hold gate, and forward-only progress.
- `lib/webmcp.ts`: `read_ritual`, `press_and_seal`, and `record_outcome`, sharing the visible flow and its guards.
- `public/guardian-atlas.png`: six-pose original manga guardian artwork, generated once with the built-in image-generation tool. CSS selects frames and applies the ink treatment; the original raster is preserved.

The image-generation prompt is retained in `art-direction.md`.

## Verification

13 unit scenarios cover interrupted and repeated holds, choice locking, ratcheted movement, refresh-compatible serialization, all outcomes, local dates, midnight carry-over, corrupt saves, and independent demo state. Browser checks cover the timed seal through the same visible hold handler, early release with pointer input, mouse drag/reverse/re-grab, reload at 50%, keyboard completion, muted interaction, phone and desktop layouts, and live WebMCP success/error contracts.

The browser automation's pointer helper does not expose a 900 ms mouse-down duration, so full-duration holds were driven through `press_and_seal`, which uses the actual shared hold gate and animation. No physical phone or vibration hardware was used. Reduced-motion behavior is implemented in CSS; native reduced-motion settings were not changed during validation.
