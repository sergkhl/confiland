<!-- Hygiene: status header <=15 lines. Units are sequential and exclusive. Validation Log <=350 lines: append within an active unit, consolidate to one dated entry when the unit closes, and never keep metric trajectories. Keep one Open findings section. Re-home durable facts before closing; commit this plan before its eventual deletion in a separate commit. -->

# Real-world pacts with the guardian

Status: Owner-gated on BROWSER-ACCEPTANCE; implementation and automated checks are complete.
Order: 1 of 1.
Scope: Six everyday challenges, personal difficulty review, an AGREE signature, and an honest return.
Execution: Units 1–4 in order, one unit at a time; drain-plans implementation authorized.
NEXT: After an explicit browser-testing request, complete units 2/4 observed acceptance in local demo/isolated fixtures.
Exit: Keep this plan open for the multi-scenario interaction/animation session; its acceptance is not yet proved.
Coordination: [Index](README.md) · [TODO](TODO.md) · [Blockers](BLOCKERS.md).

## Problem and intended outcome

The current ritual offers two fixed labels, a 900 ms hold, and a 160 px upward pull. Its return records Done, Tried, or Not today, but gives the player no way to choose an appropriate social challenge, test a specific doubt, or use the experience to choose the next action.

Make the ritual a pact with the guardian to try one concrete action today. Confidence practice happens when the player initiates contact or speaks up outside the game. The signature records intent; the return records the player's account of what happened. Neither finishing an animation nor receiving another person's approval is evidence that the player has become more confident.

Keep three compact beats: choose the pact, sign with the guardian, return to review. Preserve the original manga tanuki guardian, warm paper, black ink, vermilion accents, and minimal text. His attention, movement, and answering mark should carry the relationship. Use specific, candid reactions; avoid slogans, forced celebration, guilt, or disappointment directed at the player.

The content draws on graded practice and comparing predictions with observed experience, as described by the Centre for Clinical Interventions in [assertiveness practice](https://www.cci.health.wa.gov.au/-/media/CCI/Consumer-Modules/Assert-Yourself/Assert-Yourself---10---Putting-it-All-Together.pdf) and [behavioural experiments](https://www.cci.health.wa.gov.au/-/media/CCI/Mental-Health-Professionals/Anxiety/Anxiety---Information-Sheets/Anxiety-Information-Sheet---05---Behavioural-Experiments-Negative-Predictions.pdf). The brief chip interaction is our product adaptation, not the complete clinical exercise. Implementation checks can establish usability and correct behaviour; improvement in confidence requires evaluation with players over real-world attempts.

## Existing implementation and constraints

- [Ritual state](../../lib/ritual.ts) owns choice locking, local dates, phase guards, serialization, and monotonic vertical progress. Keep the guarded state model; replace the hold and vertical-distance mechanics.
- [The scene](../../app/page.tsx) owns pointer capture, keyboard input, persistence, daily/demo separation, and return UI. Preserve storage error recovery and interruption handling while introducing the new flow.
- [The artwork notes](../../art-direction.md) describe six fixed raster poses, a baked checkerboard, and crop/blend workarounds. The atlas has no independently movable paw or arm. Longer writing needs suitable foreground artwork and motion; selecting existing poses alone cannot supply it.
- [Browser tools](../../lib/webmcp.ts) currently expose a 900 ms `press_and_seal` contract. That contract must be retired when the mechanic changes; it cannot silently claim to perform the new trace.
- [Signature tests](../../tests/signature.test.ts), [state compatibility tests](../../tests/pact-state.test.ts), and [persisted journeys](../../tests/persistence.test.ts) now own the replacement interaction invariants. Obsolete one-dimensional gesture tests were retired. [README](../../README.md) is the durable home for play instructions and verification limitations.
- There is no existing `CONTEXT.md`, ADR index, or earlier plan to supersede. Adopt only this plan and the four planning files; do not add speculative architecture documents.

## Agreed design

### Six authored challenges

The two practice sets each have three suggested steps. They are starting points, not universal difficulty rankings. Keep every action selectable. Show the active set and its three choices rather than a large catalogue.

| Practice | Suggested step | Action for today | Completion under the player's control |
| --- | --- | --- | --- |
| Initiate contact | 1 | Say hello first to someone familiar. | The player initiates the greeting. |
| Initiate contact | 2 | Ask one question you actually want answered. | The player asks a genuine, appropriate question. |
| Initiate contact | 3 | Start a short conversation with an acquaintance. | The player offers an opener that invites conversation; the other person need not continue it. |
| Speak up | 1 | State a preference before someone chooses for you. | The player expresses their preference. |
| Speak up | 2 | Ask for one small change that would help you. | The player makes the request; agreement is not required. |
| Speak up | 3 | Express a different opinion respectfully, with one reason. | The player states their view and reason in a low-stakes conversation. |

Use ordinary situations and people the player can appropriately approach today. Do not turn the higher steps into confrontation, pressure on a recipient, or tasks requiring a stranger's cooperation. Each card may offer one optional example opening sentence. No required writing, contact details, generated tasks, or additional challenge categories.

### Choose and sign a pact for today

1. Choose the practice and action. The card states the complete commitment as a short sentence beginning "Today, I'll..." and makes the controllable completion criterion available without a text-heavy instruction screen.
2. Check anticipated effort: **Manageable / A stretch / Too much**. The guardian can point to a smaller action when appropriate; the player retains the choice. The action is editable before tracing starts.
3. Offer one short prediction chip, plus Skip. Prefer observable possibilities, such as not receiving an answer or stopping mid-sentence, over claims about another person's private thoughts. Do not require a negative prediction.
4. Trace **AGREE**, then deliberately release at the completed endpoint. Seal the displayed action and the local date exactly once. The guardian adds his answering mark and the pact remains available while the player goes about their day.

The signing interaction replaces both the 900 ms press and the straight upward pull. It does not add a third gesture after them. The pact is editable before tracing, frozen during that trace, and immutable after sealing. An unsigned trace can be left unfinished; it creates no real-world obligation or recorded outcome.

### Signature and guardian motion

- Author one connected, legible AGREE path with several changes in direction. Use designed letter connections rather than freehand handwriting recognition. Aim for roughly **8–12 seconds at a comfortable pace**; this is a playtest target, not a minimum time, countdown, or speed score.
- Keep the guardian and paper visible together. The paw/brush follows the accepted stroke, the body reacts subtly to reach and pressure, and release produces visible settling. Use a distinct answering paw mark and short completion motion after sealing. Frame changes and motion must preserve the guardian's identity and anatomy.
- Add only the artwork needed for writing, release, and the answering mark. Existing poses can serve body reactions. Use suitable separate foreground elements rather than stretching the whole raster across the word. Record asset sources and reusable rendering constraints in `art-direction.md` during implementation.
- Track ordered path progress in normalized scene coordinates. X and Y movement both matter. At intersections, accept only the next part of the path; a diagonal shortcut or a touch near a later letter cannot skip ahead. Validate travelled segments, not just a nearest point at the latest pointer position.
- Accepted ink never rewinds. Reverse movement, small overshoots, and leaving the guide do not erase it or trigger a failure animation. A forgiving corridor and a clear next segment guide the player back to the last accepted position.
- Early release pauses. The paw settles while ink stays. Re-grab, resize, interruption, and reload resume the same path and accepted progress. Persist a path identity/version so later artwork changes cannot reinterpret a saved percentage.
- Reaching the endpoint while still holding does not seal. A deliberate release at the completed endpoint seals once; pointer cancellation, loss of capture, blur, or hiding the page never substitutes for that release. After a cancelled or reloaded completed trace, require a fresh deliberate endpoint release.
- Preserve visible focus and provide a keyboard/tap alternative that advances the same authored strokes and ends with an explicit seal activation. Precise dragging, an uninterrupted timed hold, and rapid input must not be prerequisites. Announce meaningful stages rather than every pointer sample.
- Reduced motion keeps ink, the next segment, pause state, and the final mark understandable while removing idle, recoil, and sweeping movement. Sound and haptics remain optional; mute continues to work.

### Return and suggest the next step

The player can return immediately if that is honest; do not invent a timer or demand proof of contact. Keep the signed sentence visible during review.

- **Done / Tried / Not today** records the player's account. Done refers to the chosen action; Tried means a partial attempt. The game never infers an outcome from elapsed time, opening the app, animation completion, or another person's response.
- For Done or Tried with a prediction, ask **Happened / Partly / Didn't happen / Can't tell**. Skip this comparison when no prediction was chosen; allow Can't tell for an attempt that did not test it. A prediction coming true is not a failed ritual.
- Ask actual effort using **Manageable / A stretch / Too much**. No required prose. If the player chooses Not today, ask what got in the way using brief optional chips such as No opportunity, Too much, or Changed plans; do not record unobserved effort or a tested prediction.
- Give one context-specific guardian reaction and a next-step suggestion. Use these initial deterministic rules, with no hidden confidence score: Done + Manageable suggests one step up; A stretch suggests the same step; Too much suggests one step down; Tried otherwise suggests the same step. Clamp to the available range. Not today + No opportunity keeps the step; Not today + Too much suggests a smaller step; otherwise make no difficulty inference.
- Suggestions are invitations the player can override. A pre-sign Too much rating offers a smaller step without changing the selected action automatically. Never lock content, promote automatically, penalize a skipped day, or claim to know how confident the player is.

After sealing, **Not today** is available at any time. It closes the pact honestly without changing its signed action. Tomorrow offers a fresh choice. If a prior day's pact is still open, show its actual date and offer a brief review or explicit closure before a new pact; never silently mark it Not today or carry its deadline forward. One new daily pact may be signed per local calendar date. Demo replay stays independent.

### State and persistence

Keep the existing `Ritual` vocabulary for the flow. A pact is its signed action, not a second parallel task system. Extend the versioned state to hold:

- The selected practice/action, suggested step, immutable action text/catalog version at signing, and the local date the pact covers.
- Anticipated effort and an optional prediction; path identity/version, ordered accepted progress, and unsigned/signed status.
- Explicit outcome, prediction comparison where applicable, actual effort or an optional non-attempt reason, and review completion.
- The current daily ritual and the latest closed pact/review for each practice, sufficient for the next suggestion. Keep this bounded; a history feed and analytics are outside scope.

Preserve the separate browser-local daily and tab-local demo stores. A save failure must not display a committed seal or outcome that was not saved. Coalesce raw pointer events without making unsaved preview movement look like durable ink. Validate records and phase invariants; reject stale ritual IDs, duplicate completion, invalid progress, and late events. Re-read current state before applying mutations so a stale page cannot casually replace newer progress.

Local development and demo fixtures may be reset. Published browser saves can represent actual commitments and need narrow compatibility handling: retain the exact signed v1 action and outcome; expose unfinished v1 commitments as earlier pacts that can be honestly reviewed or closed. Do not reinterpret their vertical pull percentage as AGREE progress, fabricate a signature, or turn "Start 2 minutes" into a social challenge. Keep legacy reviews out of the new difficulty suggestions. Preserve the original save until the new record is written successfully; malformed saves retain a recoverable error state rather than being silently cleared.

At sealing, use the actual local calendar date and re-check that day's existing pact. An unsigned draft crossing midnight has not consumed a daily commitment. A signed pact's date does not change on reload or the next day.

### Boundaries and alternatives

- Keep six authored actions. A broad catalogue, AI-generated dialogue, and a free-form task builder add content and interaction costs before these practices have been evaluated.
- Use player-selected difficulty with suggestions. Assigned levels and automatic promotion ignore the player's context and the agreed control over challenge size.
- Use an authored connected trace. Free-form signatures or OCR would add recognition failures without improving the real-world commitment. Restarting on every early release would make precision and uninterrupted attention the challenge.
- Retire `HoldGate`, `HOLD_MS`, `PULL_PX`, `forwardProgress`, the vertical trail, and their obsolete UI/test assumptions when the new signing flow takes over. Preserve applicable state, interruption, and persistence guards; do not keep redundant mechanics behind the new scene.
- Retire `press_and_seal`. Keep `read_ritual` read-only and update its schema. Adapt `record_outcome` to the new review guards without inventing prediction or effort answers; completing review requires explicit player input. Do not add a browser tool that skips the trace and calls that successful gesture validation.
- Retain local-only operation. Accounts, backend storage, notifications, streaks, social sharing, confidence scores, and clinical effectiveness claims are outside this plan.

## Ordered implementation units

Execute one unit at a time. Complete its acceptance criteria and update this header, the index, and TODO at their respective levels before starting the next unit. Keep verification evidence in this plan's Validation Log until closure.

### 1. Challenges and daily pact state

Implement the six authored cards, practice selection, personal effort check, optional prediction, and the versioned pact data model. Connect the choice UI to the guardian scene. Add the narrow v1 compatibility path and the minimum retained review state needed for suggestions.

Acceptance:

- All six cards state a concrete action and controllable completion criterion; a small request or different opinion does not require agreement to count as Done.
- Both sets expose three suggested steps, every action stays selectable, and Too much offers a smaller choice without changing the player's selection.
- The pact preview clearly means today, with no required writing. A skipped prediction is distinct from a prediction that did not happen.
- Focused state tests cover choice freezing, valid/invalid records, local-day limits and rollover, exact preservation of signed legacy actions, failed compatibility writes, and isolated daily/demo state.
- Existing behaviour remains runnable while the new model is introduced. No temporary score system, placeholder backend, or catalogue beyond the agreed six actions is added.

### 2. AGREE signature and guardian animation

Implement ordered path geometry, rendering, the paw/brush motion and answering mark, persistence-aware pause/resume, and keyboard/tap alternatives. Connect final release to the pact's guarded seal transition. Remove the replaced hold/pull mechanics and retire their browser-tool contract in this unit.

Acceptance:

- The word is legible, has meaningful direction changes, and is comfortable on phone and desktop layouts. An observed playthrough checks the 8–12 second design target without adding a duration gate.
- Path tests cover ordered turns, intersections, shortcuts between letters, off-path movement, reversal, large pointer samples, early release, re-grab, and normalized coordinates after resize.
- Interaction tests establish that only a completed path plus deliberate endpoint release can seal; cancellation at the endpoint, hidden pages, duplicate releases, and stale events cannot seal it.
- Reload during tracing preserves accepted ink; reload after reaching the endpoint still requires deliberate sealing. A storage failure retains a visible recoverable state and does not claim commitment.
- Guardian movement follows the interaction continuously, pauses and settles on release, then adds the final mark once. Inspect crops, seams, paw alignment, finger occlusion, and answering-mark visibility at phone and desktop sizes.
- Keyboard and tap alternatives complete the same pact with explicit intent. Reduced motion and mute preserve all essential feedback. Obsolete hold/pull helpers and instructions have no active callers.

### 3. Honest return and next-step suggestions

Implement the short review, conditional prediction comparison, actual effort/non-attempt branches, guardian reactions, and deterministic suggestions. Complete dated pact closure and the next day's fresh invitation.

Acceptance:

- Done, Tried, and Not today each have a complete, honest path. No branch auto-fills an observation, treats a signature as an action, or equates a negative response with failure.
- Prediction comparison is omitted when skipped, supports an inconclusive observation, and is not asked as though an unattempted action tested anything.
- Table-driven tests cover every suggestion rule, minimum/maximum steps, missing prior review, and player overrides. Different practice sets retain independent latest reviews.
- Not today is reachable after signing without changing the signed action; an older open pact is explicitly reviewed/closed rather than silently expired. Tomorrow's invitation does not penalize yesterday.
- Copy remains short, specific, and free of motivational slogans. The guardian reacts to the reported experience without praise inflation, judgement, or pressure to select Done.
- Browser tools validate current IDs and phases and accept only explicit answers; they cannot turn a partial review into a completed one by supplying guessed fields.

### 4. Integrated verification and durable documentation

Run focused automated checks and one successful pass per distinct required browser scenario. Update README play instructions, keyboard/tap controls, browser-tool descriptions, and accurate verification limits. Re-home art mechanics in `art-direction.md` and state/geometry invariants in meaningful tests.

Acceptance:

- `npm test`, `npx tsc --noEmit`, and `npm run build` pass. Update obsolete tests rather than retaining expectations for removed mechanics.
- Verify complete flows from both practices; all three outcomes and the conditional review branches; fresh/repeated/overdue daily states; independent demo replay; interruption/reload; and recoverable storage errors.
- Exercise mouse, browser-driven touch or a touch device, keyboard, and tap alternatives. A narrow viewport alone is not touch-input evidence. Check phone and desktop composition, focus, meaningful progress announcements, reduced motion, and mute. Record actual input surfaces and any untested hardware behaviour.
- Inspect the full signing and release animation in motion. A screenshot or state mutation alone cannot prove gesture quality. Keep the user-visible action criterion readable and the guardian present throughout all three beats.
- Any scripted outcome is identified as test data in demo/isolated fixtures. Do not perform or claim a real conversation, recipient response, or confidence gain for verification.
- If a required scenario cannot be exercised, keep the unit open with the concrete missing evidence. Put an owner-only setup action in BLOCKERS only when it actually requires the owner; do not invent a gate from a hypothetical limitation.
- This plan authorizes no deployment by itself. When implementation is complete, put any pending website release and its observable drain criterion in RELEASE; a later authorized deployment must read the live site to verify it. Do not add release entries for this documentation-only planning commit.

## Exit test

Close only after all four units meet their acceptance criteria, durable instructions and invariants have tracked homes, and Open findings is empty or each finding has been re-homed to TODO. A deployment command alone does not close the plan. Any remaining release work must fit its RELEASE entry; a multi-step acceptance session keeps the plan open with that reason stated in the header.

Delete the completed plan and its index/TODO references in a separate commit after its durable facts are re-homed. Git history is the archive. Keep the rolling COMPLETED outcome separate from release status.

## Validation Log

- 2026-09-07 — Unit 1: authored six selectable actions and connected effort/prediction choices to the guardian scene. Focused state/storage tests and TypeScript pass. The runnable scene uses interim explicit letter controls while unit 2 installs the path; no pointer-gesture quality is claimed. Invariants: choice freezes at tracing; seal uses its actual local date; v1 signed wording/outcome survives exactly without invented AGREE ink or difficulty; failed writes retain the original record; stale pages cannot apply events to newer saves. Durable save mechanics are in README and executable tests. The review fields have a minimal runnable interface; unit 3 owns reactions and suggestions.

- 2026-09-07 — Unit 2 implementation: connected AGREE geometry, next-segment guidance, saved ink, frame-coalesced input, independent brush paw/lift/answer crops, and explicit keyboard/tap completion are implemented. State/path tests and TypeScript pass; geometry tests traverse every ordered turn and retrace and reject shortcuts, stale owners, cancellation, unsaved endpoint release, and duplicate sealing. The hold/pull engine and browser seal tool are retired; only a validation-only legacy reader remains. Path and input invariants live in tests/README; asset source, exact prompt, source-space crops, nib anchors, and RGB/checkerboard limitations live in art-direction.md. No observed browser timing, touch, visual alignment, or animation quality is claimed; BROWSER-ACCEPTANCE owns those remaining criteria.

- 2026-09-07 — Unit 3: complete explicit review branches, conditional prediction comparison, actual effort/non-attempt separation, context-specific guardian reactions, and optional next-step suggestions. Table-driven tests cover every rule in both practices at all three steps, no prior review, bounds, and player overrides. State and browser-tool contract tests prove immutable signed actions, independent retained reviews across days, explicit overdue closure, uncertain/true predictions without penalties, exact legacy closure, and no guessed review fields. TypeScript and targeted lint pass. Rules and controls are retained in README; browser integration observation remains part of BROWSER-ACCEPTANCE.

- 2026-09-07 — Unit 4 automated/documentation batch: all 32 focused tests, TypeScript, targeted implementation lint, and the production build pass. Persisted isolated journeys cover both practices, all outcomes, chosen/skipped predictions, midpoint/endpoint reload, daily/demo separation, midnight sealing, stale tab mutations, malformed/missing/unavailable storage, and failed seal/outcome/closure writes. Repeating an explicit outcome preserves its existing observations. Keyboard tracing cannot seal through repeated activations; late pointer writes retain their ritual owner; reopening a saved pact does not replay the new-seal mark animation. README owns play/keyboard/tool/save instructions and precise verification limits; art-direction.md owns the intact RGB atlas and rendering constraints. Required observed browser scenarios were not run, so units 2/4 remain open under BROWSER-ACCEPTANCE. No physical device, simulator, published browser save, deployment, real-world contact, or confidence-effectiveness evidence is claimed.

## Open findings

- **BROWSER-ACCEPTANCE (units 2 and 4)** — Await an explicit local browser-testing request under the installed Sites instructions. Then run one successful isolated/demo pass per required scenario, including real browser touch events, mouse, keyboard/taps, interruption/reload, save errors, reduced motion/mute, and phone/desktop moving crop/nib/mark inspection. Observe comfortable 8–12 second tracing without introducing a time gate. See [owner blocker](BLOCKERS.md).
