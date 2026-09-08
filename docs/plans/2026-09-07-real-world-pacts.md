<!-- Hygiene: status header <=15 lines. Keep evidence in this plan, index/TODO, and existing artwork/play notes. No RELEASE.md. -->

# Three meaningful actions with the guardian always in view

Status: In progress; compact flow and compatibility implemented; transparent artwork blocked at the first-alpha gate.
Order: 1 of 1.
Scope: Three meaningful actions, one changing foreground panel, preserved AGREE safeguards, and expressive transparent guardian artwork.
Authority: Owner-approved implementation plan on 2026-09-08; local acceptance testing is already authorized by AGENTS.md.
NEXT: Resolve the pending Python background-removal authorization, verify one true-alpha pose, then produce and inspect the remaining set.
Exit: Finish artwork and the acceptance findings below; keep deployment separate.
Coordination: [Index](README.md) · [TODO](TODO.md) · [Blockers](BLOCKERS.md).

## Approved design

The guardian is the dominant object throughout. Every interaction, including the signature paper, uses one manga panel over the lower scene. Answered prompts are replaced after successful persistence, with no accumulating questions. Lower-body overlap is allowed; the face, upper body, and emotion effects need clear space. Normal phone and desktop sizes fit within the viewport; short screens and enlarged text scroll only the foreground panel. Keep controls at least 44 px tall, readable contrast, and visible focus.

### Three equally available actions

| Action                    | Commitment under the player's control                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Start a real conversation | Approach an acquaintance, share a short update, and ask an open question. Offering both parts counts; a reply is not required. |
| Make a clear request      | Ask for a specific helpful change and briefly explain why. Agreement is not required.                                          |
| Share a different view    | Respectfully express a different opinion in an everyday conversation and give one reason. Agreement is not required.           |

Remove practice-category selection, greeting-only/single-question/simple-preference fresh choices, visible difficulty numbers, and automatic smaller/larger suggestions. These are three kinds of practice, not a difficulty ladder. Existing practice and step metadata remains readable only for compatibility and bounded history.

### Compact choosing, signing, and review

- Sequence: **Action → anticipated effort → prediction or Skip → signature → return review**. Preserve the existing effort and prediction choices. Too much briefly surprises the guardian, then reassures; provide Change action and an unsigned pause.
- Keep a short selected-action label. Details temporarily replaces the active panel with full wording, criteria, and an opening example. Back works during choosing and from signing only while accepted progress is zero.
- Preserve `agree-connected-1`, ordered geometric sampling, accepted-ink persistence, pause/reload behavior, pointer ownership/cancellation, and explicit sealing. A completed trace remains unsigned until a deliberate endpoint release or separate seal activation. Place paper and brush inside the foreground without covering the instruction or the guardian's face.
- Review one prompt at a time: outcome → applicable comparison → actual effort, or outcome → non-attempt reason/Skip. End at a compact summary with explicit **Close pact**. Back permits corrections; honest outcomes never cause scolding or disappointment.
- Resolve the next unanswered prompt from saved answers on reload. A failed save leaves the current question and recoverable error. Save prediction and entry into signing in one guarded transition. Reopening a signed pact never replays celebration.

### Emotions and artwork

| Trigger                                 | Reaction                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------- |
| Initial choice                          | Alert curiosity                                                           |
| Conversation / request / different view | Welcoming excitement / determined resolve / mischievous confidence        |
| Manageable / A stretch / Too much       | Confident grin / dramatic determination / brief surprise then reassurance |
| Prediction                              | Thoughtful or apprehensive response appropriate to the concern            |
| Writing / paused                        | Focused concentration / relaxed attention                                 |
| New successful seal                     | Delighted expression and short celebratory burst                          |
| Done / Tried / Not today                | Pleased / encouraging / relaxed acceptance                                |

Use the existing guardian as the identity reference, with individual transparent body poses, writing paw, lifted paw, and answering mark. Faces and poses carry big comic reactions, supported by selective speed lines, sparkles, surprise marks, and sweat drops. Reduced motion preserves facial changes and static symbols while removing sweeping/bouncing effects.

Verify **one genuine-alpha pose before producing the remaining set**. Require actual PNG alpha, clean fur edges, opaque white fur, consistent framing, and no baked checkerboard. Inspect against light, dark, and colored backgrounds. Preload poses and foreground parts. Remove contrast/multiply/atlas-crop workarounds only after replacements pass. Source prompts and limits belong in [art-direction.md](../../art-direction.md).

### Compatibility and persistence

Keep storage format v2 and existing daily/localStorage and demo/sessionStorage keys. `everyday-2` contains only the new trio; `everyday-1` stays immutable for reading saved pacts. Add catalogue identity to unsigned drafts so existing ink cannot sign rewritten text. Refresh old choosing drafts with an explanation and a guarded write. Preserve old tracing, signed, and closed states—including exact wording, date, progress, and reviews. Preserve the earlier v1 compatibility reader and original keys. No silent reset on malformed or unavailable storage.

Keep the revision/current-ID guards, one daily seal per local date, explicit overdue review, and bounded prior records. Do not infer real-world actions from signatures or test data. No deployment, publication, accounts, backend, release manifest, or substitute status document is part of this work.

## Implementation units

1. **Catalogue and state — implemented.** Three active actions; archived wording; catalogue identity; choosing migration; atomic prediction/begin; zero-ink return; retired suggestions. Compatibility and persistence tests pass.
2. **Compact panels and reactions — implemented with existing artwork as an interim preview.** Sequential choice/review, Details, Back, lower signature paper, viewport layout, saved-answer reactions, manga effects, focus, and preload-ready individual-asset rendering are present. `TRANSPARENT_ARTWORK_READY` stays false until accepted replacements exist.
3. **Transparent artwork — blocked at first-alpha verification.** Three built-in outputs (initial curious pose and two extraction/export edits) are 1254 × 1254 RGB with no alpha and a visible checkerboard. No remaining poses were generated. A local Python extraction fallback was requested asynchronously and has not been authorized.
4. **Acceptance and documentation — available checks pass; artwork and device/motion limits remain below.** Tests, TypeScript, targeted lint, production build, browser demo journeys, viewport/text/error fixtures, and reduced-motion-rule inspection are complete for the implemented flow. Preserve prior hot-reload evidence and update these existing documents only.

## Validation Log

Earlier entries below describe the original implementation and remain historical evidence; the 2026-09-08 approved design above supersedes its six-action/category/suggestion behavior.

- 2026-09-07 — Unit 1: authored six selectable actions and connected effort/prediction choices to the guardian scene. Focused state/storage tests and TypeScript pass. The runnable scene uses interim explicit letter controls while unit 2 installs the path; no pointer-gesture quality is claimed. Invariants: choice freezes at tracing; seal uses its actual local date; v1 signed wording/outcome survives exactly without invented AGREE ink or difficulty; failed writes retain the original record; stale pages cannot apply events to newer saves. Durable save mechanics are in README and executable tests. The review fields have a minimal runnable interface; unit 3 owns reactions and suggestions.

- 2026-09-07 — Unit 2 implementation: connected AGREE geometry, next-segment guidance, saved ink, frame-coalesced input, independent brush paw/lift/answer crops, and explicit keyboard/tap completion are implemented. State/path tests and TypeScript pass; geometry tests traverse every ordered turn and retrace and reject shortcuts, stale owners, cancellation, unsaved endpoint release, and duplicate sealing. The hold/pull engine and browser seal tool are retired; only a validation-only legacy reader remains. Path and input invariants live in tests/README; asset source, exact prompt, source-space crops, nib anchors, and RGB/checkerboard limitations live in art-direction.md. No observed browser timing, touch, visual alignment, or animation quality is claimed; BROWSER-ACCEPTANCE owns those remaining criteria.

- 2026-09-07 — Unit 3: complete explicit review branches, conditional prediction comparison, actual effort/non-attempt separation, context-specific guardian reactions, and optional next-step suggestions. Table-driven tests cover every rule in both practices at all three steps, no prior review, bounds, and player overrides. State and browser-tool contract tests prove immutable signed actions, independent retained reviews across days, explicit overdue closure, uncertain/true predictions without penalties, exact legacy closure, and no guessed review fields. TypeScript and targeted lint pass. Rules and controls are retained in README; browser integration observation remains part of BROWSER-ACCEPTANCE.

- 2026-09-07 — Unit 4 automated/documentation batch: all 32 focused tests, TypeScript, targeted implementation lint, and the production build pass. Persisted isolated journeys cover both practices, all outcomes, chosen/skipped predictions, midpoint/endpoint reload, daily/demo separation, midnight sealing, stale tab mutations, malformed/missing/unavailable storage, and failed seal/outcome/closure writes. Repeating an explicit outcome preserves its existing observations. Keyboard tracing cannot seal through repeated activations; late pointer writes retain their ritual owner; reopening a saved pact does not replay the new-seal mark animation. README owns play/keyboard/tool/save instructions and precise verification limits; art-direction.md owns the intact RGB atlas and rendering constraints. Required observed browser scenarios were not run, so units 2/4 remain open under BROWSER-ACCEPTANCE. No physical device, simulator, published browser save, deployment, real-world contact, or confidence-effectiveness evidence is claimed.

- 2026-09-07 — Units 2/4 browser acceptance and repair batch: the repository owner authorized acceptance tests as routine work and removed the release manifest requirement; AGENTS.md records both rules. Three local in-app browser demo journeys covered contact/question + Done/Happened/Manageable, voice/request + skipped prediction/Tried/Too much, and contact/greeting + Not today/Skip. An explicit Can't tell observation was retained, then cleared with effort when switching to Not today. Each signed action remained unchanged; optional larger/smaller suggestions and no-inference closure matched the supplied answers. No outcome was real-world activity.

- 2026-09-07 — Input and persistence evidence: actual mouse segment drags followed every remaining turn and retrace, pausing and re-grabbing at each corner; reversal preserved ink. A fractional first corner exposed a browser pixel-rounding stall. A three-scene-unit capture on the current nearly finished segment repaired it; two regression tests cover rounded desktop/phone corners and old near-corner saves. Reload during a partial trace and 1280 × 900 → 390 × 844 resize retained the same accepted progress. Keyboard and button alternatives each completed all 53 authored strokes. Extra keyboard activation and endpoint reload stayed unsigned until a separate explicit seal. A mouse endpoint release sealed once. Reopening the signed pact retained the mark with no entry animation. After all demo outcomes, daily state was still an unsigned revision-zero choice with no prior reviews; returning to demo restored its closed fixture.

- 2026-09-07 — Visual and verification evidence: desktop and phone screenshots showed a neighboring atlas fragment and a brush overlap with the action criterion; CSS crop, reserved clearance, and nib-anchored mirroring repaired them. Later-letter phone screenshots had no horizontal overflow and kept the criterion readable. Focus, letter-stage status, complete AGREE, and the final red mark were inspected. Mute toggling and persistence survived reload; audible output was not observed. All 34 tests, TypeScript, targeted lint, and production build pass. The build retains Vinext's non-failing route-classification notice. An initial development dependency-optimizer hook error recovered after reload before the journeys and did not recur during them. Motion quality, touch, reduced-motion switching, and browser fault/date integration remain explicitly unproved below; no deployment occurred.

- 2026-09-08 — Development hot reload acceptance: the existing `npm run dev` command uses Vinext/Vite HMR, with a configured polling fallback for `CODEX_SANDBOX=seatbelt`. On the running local server at `http://localhost:3001/?demo=1`, a temporary React caption edit and a separate CSS generated-content edit appeared in the same browser tab without manual reload or server restart; browser logs reported the corresponding Vite hot updates. Both probes were restored exactly and their removal appeared automatically. No browser warnings or errors were recorded; all 34 tests, TypeScript, and `git diff --check` pass. No runtime/configuration change was needed; README documents the development command and distinguishes the built preview. The sandbox polling branch was inspected but not exercised in this unsandboxed session.

- 2026-09-08 — Three-action implementation: all 40 tests, TypeScript, targeted lint, and the production build pass. New cases cover every archived action, old choosing refresh, failed migration writes, old partial/signed/closed saves, catalogue/text mismatch rejection, atomic prediction/signing failure, zero-ink Back, next unanswered prompts, and deterministic honest reactions. The production build retains Vinext's non-failing route-classification notice.

- 2026-09-08 — Browser flow acceptance in demo mode: exactly three fresh actions; action/effort/prediction replacement; choosing and signing Back; Details return; Too much and unsigned pause; chosen prediction into signing; keyboard ink and action locking; partial and full trace reload; explicit keyboard seal; no replayed celebration. Review covered Done/Happened/stretch, correction to Tried/unknown/Too much, and Not today/no opportunity with explicit closure. A second opinion pact used Skip, a mouse segment (saved progress 0.0546908948236632), remaining button strokes, and Tried/Manageable; reload resumed its unanswered effort prompt. All outcomes were isolated rehearsal data.

- 2026-09-08 — Layout and accessibility fixtures: 612 × 734 current preview, 390 × 844 phone, and 1280 × 900 desktop showed no page scrolling. 844 × 390 landscape scrolled only the panel (page scroll remained zero; guardian position remained fixed). A temporary 200% root-text fixture kept document dimensions 390 × 844, with a 409 px panel viewport over 622 px content and no controls below 44 px. Details focused its heading and reset only panel scroll. A temporary demo-only exception before persistence kept saved ink and showed the recoverable error. Both fixtures were removed. The reduced-motion CSS branch was temporarily forced for inspection: effect animation names were all none, the moving paw was hidden, and a new seal still produced its delighted expression and static marks. This does not establish system preference switching or true touch/motion quality.

- 2026-09-08 — Artwork alpha gate: the built-in curious pose, background extraction, and final transparent-sticker export all returned 1254 × 1254 RGB, with no alpha channel and baked checkerboards. The gate prevented the remaining set. Rejected outputs remain outside the repository; the existing atlas is explicitly retained as interim preview art. No local Python editing occurred. The owner authorization question for that fallback is pending. Exact sources and prompts are recorded in artwork notes. No Site was deployed or published.

## Open findings

- **TRANSPARENT-ARTWORK (unit 3)** — Pending explicit authorization for local Python background removal after built-in generation failed actual alpha three times. After authorization, verify the neutral cutout with opaque white fur and clean edges; only then generate/process the remaining expressive poses and parts, inspect light/dark/colored backgrounds and framing, enable individual assets, and remove the interim atlas workarounds. Complete final face/upper-body clearance and image-flash checks with the actual accepted set. The plan is not complete without this work.
- **TOUCH-AND-MOTION (unit 4)** — CUA supplies mouse segment drags, keyboard/buttons, screenshots, and viewport sizing, but no true touch trajectory, separately held pointer through hide/cancel, continuous motion/video inspection, or system reduced-motion preference switching. The CSS branch was inspected through a temporary override. Observe a continuous comfortable trace against the 8–12 second target, actual signing/lift/answer motion, touch/finger occlusion, and system preference behavior when available. Tool duration and screenshots do not establish these results. Audible output and vibration remain unverified.
- **BROWSER-RECOVERY (unit 4)** — Storage/date/stale/cancellation invariants pass deterministic fixtures; UI recovery was inspected with a temporary demo-only exception. Actual browser quota/clock manipulation and held-pointer page-hide integration were not exercised. This is an evidence limit, not an acceptance-test permission gate.
