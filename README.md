# Confidence Workshop

A browser-local pact with an original manga tanuki guardian: choose an everyday action, sign AGREE together, and return with your own account of the attempt.

## Play

Choose **Initiate contact** or **Speak up**, then one of its three suggested steps. All six actions stay available. The card says “Today, I'll…” and explains what is under your control. An answer, agreement, or another person's approval is never required to count the action as Done.

Choose anticipated effort (**Manageable / A stretch / Too much**) and an optional prediction, or **Skip**. Too much offers a smaller action without changing your choice. You can edit before beginning the signature. Beginning freezes this draft; it does not make a commitment.

Trace the connected **AGREE** guide from the red ring along the next red stroke. Lift to pause. Saved ink stays through interruption, resize, or reload. Re-grab at the ring; movement near a later letter cannot skip ahead. At the completed endpoint, deliberately release to seal. Reaching the end while holding, losing capture, hiding the page, or reloading cannot seal. A completed but unsigned trace needs a fresh endpoint press/release or **Seal this pact**.

For keyboard or taps, use **Write next stroke** to write the same path one authored segment at a time, then activate **Seal this pact**. There is no timer or speed score. Focus remains visible; meaningful stages are announced without reading every pointer sample. Reduced motion removes idle and settling movement and the sweeping paw, while the guide, saved ink, ring, and answering mark remain. Sound is optional and can be muted.

Return at any honest time. **Done / Tried / Not today** records what you report, never what the game infers. An attempted action can compare a chosen prediction and report actual effort. Not today asks an optional reason or Skip and records no unobserved effort or prediction. Closing a review requires explicit answers; the signed action remains visible.

One new pact may be signed per local calendar date. An earlier open pact shows its actual date and must be reviewed or explicitly closed before a fresh pact. An unsigned draft crossing midnight consumes no daily commitment. The signed date never rolls forward. **Try demo** and **Replay** are isolated rehearsals; they never change the daily pact. No accounts, backend, notifications, streaks, score, history feed, generated tasks, or clinical effectiveness claims are present.

## Local saves and compatibility

Daily state uses `confidence-workshop.ritual.v2` in `localStorage`; demo state uses `confidence-workshop.demo.v2` in `sessionStorage`. Each mode retains only its current pact and the latest closed review for each of the two practices. A revision and current ritual ID guard late mutations.

The original `.v1` keys are retained on compatibility writes, including a failed write; a valid v2 record takes precedence afterward. Earlier signed actions preserve exactly **Say hello** or **Start 2 minutes** and any recorded outcome. An unfinished v1 pact can be honestly reviewed, carries no fabricated AGREE ink, and never influences the new practice suggestions. Malformed records are not silently cleared. Retry rereads the retained record; a failed action must be deliberately made again.

Mutations reread and compare the saved record before applying an event, and save successfully before exposing accepted ink, a seal, or an outcome. Pointer samples are coalesced into one write per animation frame; unsaved movement is not painted as accepted ink. Local storage is not a server transaction system. The comparison rejects a stale page's next write, and storage events refresh other pages; the app makes no cross-device synchronization claim.

`agree-connected-1` owns the exact path geometry. Its ordered progress gives each letter and its joining stroke one fifth of the range. Preserve that geometry for existing records; do not reinterpret a saved percentage when changing artwork. Input ownership is ephemeral and never serialized. The state machine and input guard are both required: the reducer cannot itself prove physical pointer input.

## Develop

```sh
npm install
npm run dev
npm test
npx tsc --noEmit
npm run build
```

The existing Sites/Vinext build targets Cloudflare Workers. `.openai/hosting.json` identifies the Site. Deployment and published-browser access require a separate authorization; [pending releases](docs/plans/RELEASE.md) are not evidence of the live version.

## Core code and browser tools

- `lib/challenges.ts`: six authored actions and explicit answer vocabularies.
- `lib/ritual.ts`: guarded pact transitions, validation, bounded prior reviews, and compatibility.
- `lib/pact-storage.ts`: save-before-display and stale-state rejection for independent daily/demo stores.
- `lib/legacy-ritual.ts`: validation-only reader for earlier saves; retired gestures have no active implementation.
- `lib/signature-path.ts`: versioned geometry, ordered segment sampling, coordinate normalization, and cancellable input ownership.
- `components/ritual/`: choice and signature controls. `app/page.tsx` owns the scene and persistence integration.
- `lib/webmcp.ts`: read-only `read_ritual` and guarded `record_outcome`. The latter requires the current ID and reviewing phase, accepts only an explicit outcome, and supplies no effort, prediction comparison, reason, or completed review. No browser tool signs or bypasses the trace.
- `public/guardian-atlas.png` and `public/guardian-signing-atlas.png`: original body poses and companion foreground artwork. Sources, prompts, crop anchors, and rendering limitations live in [art-direction.md](art-direction.md).

## Verification limits

State/storage and path tests cover choice freezing, explicit answers, local-date limits, overdue closure, exact legacy preservation, failed writes, stale IDs, mode isolation, ordered turns and retraces, shortcuts, reversal, off-path movement, early release, completed-endpoint cancellation/reload, and coordinate normalization. These are deterministic local fixtures, not evidence of a real conversation or increased confidence.

The current implementation still requires an explicitly authorized browser acceptance session for mouse and real browser touch events, keyboard/tap integration, phone/desktop composition, storage-failure UI, reduced motion, mute, and full animation inspection. The 8–12 second comfortable trace is a player-observation target, not a timing gate or a result established by scripted state changes. Physical touch ergonomics, finger occlusion, assistive technology behavior, and vibration hardware have not been verified. The owning [plan](docs/plans/2026-09-07-real-world-pacts.md) retains that missing evidence.
