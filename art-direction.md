# Guardian artwork

Generated once with the built-in image-generation tool. Original output: 1536 × 1024 PNG, six poses in a 3 × 2 atlas. Copied into `public/guardian-atlas.png`.

The output contains a rendered checkerboard rather than an alpha channel. The display uses a high-contrast ink treatment and multiply blending to present the artwork on the paper surface. CSS adjusts the reaching pose's crop to retain the extended paw. The leaning pose (`pose-1`) clips 6.5% from its right edge to exclude a fragment of the neighboring atlas pose while retaining its own tail. The raster file is not modified.

## Generation prompt

Use case: illustration-story
Asset type: production character sprite atlas for the manga browser game Confidence Workshop.

Create ONE original raster image: a perfectly aligned 3-column by 2-row sprite sheet, ideally 3072 x 2048 pixels, with six equal square cells. The background must be genuinely transparent with an alpha channel. There are NO visible cell divisions, panels, borders, labels, numbers, or text.

Subject and identity: the same original fantasy tanuki guardian in every cell, full body, lovable but not babyish. He is an adult-feeling protective and mischievous spirit with a slightly rogue, knowing expression. Dense confident manga ink, beautifully drawn premium manga illustration, crisp black and warm-white fur, subtle fine screentone shading, charcoal eye mask, untidy cheek fur, substantial expressive paws, short legs, and a distinctive small vermilion-red scarf. The scarf is the ONLY colored accent. Preserve identical face design, fur markings, scarf, anatomy, proportions, and character scale across all six poses. Not an emoji, corporate mascot, plush toy, or photorealistic animal.

Composition: a clean, production-ready 3 by 2 atlas. Each character is centered within its own invisible square cell with generous transparent padding on every side. All extremities and the entire tail fit inside that cell. No overlap, no cropping. Each pose has the same consistent scale, with feet or seated contact grounded at the same relative baseline within its cell. Each frame must read beautifully when cropped to its square and displayed at 300–470 CSS pixels.

Six poses, ordered left to right:
Top left, pose 1: seated alert, one open palm offered low in front.
Top center, pose 2: leaning forward, bracing with paws near his belly as if pressing a seal, with a focused expression. Do not draw the seal or any tool.
Top right, pose 3: offering an outstretched paw toward the viewer, ready to move.
Bottom left, pose 4: pleased crooked grin, a little confident fist near his cheek.
Bottom center, pose 5: attentive head tilt, reserved encouraging expression.
Bottom right, pose 6: sitting comfortably with tail curled, unbothered and present.

Avoid: rendered tools, props, scenery, lettering, watermarks, UI, panel borders, cell backgrounds, drop shadows, gradient backgrounds, checkerboard artwork, extra characters, duplicate poses, exaggerated infant proportions. Leave all space around the six figures actually transparent.

## Signing companion atlas

`public/guardian-signing-atlas.png` was generated once with the built-in image-generation tool, using `guardian-atlas.png` as a style/identity reference only. The original body atlas was not edited. Output is 1774 × 887 RGB: despite the prompt, it has a baked checkerboard and irregular spacing, not alpha or equal cells. Keep the raster intact; do not treat it as transparent artwork.

The scene uses independently cropped foreground elements. Source rectangles (x, y, width, height): signing paw `(85, 85, 580, 700)`; lifted paw `(665, 105, 570, 665)`; answering paw print `(1245, 220, 460, 490)`. Approximate nib anchors within those crops: signing `(5.5%, 96.4%)`, lifted `(4%, 96.1%)`. Scale crop, image size, and offsets together. The background uses multiply blending plus contrast/brightness to suppress the pale checkerboard on warm paper; this treatment clips some light screentone and is not an alpha substitute on arbitrary surfaces. Desktop and phone screenshots checked the paused crop, brush clearance, complete word, body pose, and final mark. Continuous motion and touch occlusion acceptance remain in the owning plan.

The foreground paw follows only saved accepted geometry; raw unsaved pointer samples never move durable ink. Body reach is a small translation with subtle compression, not a stretch across the word. Pausing selects the lifted crop and settles it. A successful seal displays the separate red answering mark with one entry motion. Reduced motion hides the moving foreground paw and disables idle/recoil/settling while retaining ink, next-stroke guidance, pause state, and the final mark. The brush sits above/right of its nib and mirrors above/left from scene x = 436 to stay within the paper near the last letter. Transform origins stay at the nib through mirroring and lift. Reserve 96 px above the signature on desktop and 80 px on phone so the foreground artwork cannot cover the action criterion. Actual finger occlusion requires physical playtesting.

### Companion generation prompt

Use case: illustration-story. Create ONE NEW companion raster sprite atlas for an adult manga tanuki guardian signing scene. The supplied image is STYLE AND CHARACTER IDENTITY REFERENCE ONLY; do not recreate, revise, overwrite, or include its existing full-character poses. Match its mature tanuki identity, black and warm-white coarse fur, strong fine manga ink contours and subtle screentone, restrained warm tones, and red-scarf character palette. Output a wide 3:1 atlas with THREE EQUAL SQUARE CELLS in ONE ROW, no drawn borders or separators, generous clear transparent margins separating each sprite. Cell 1, left: one large isolated furry tanuki paw and short forearm, viewed diagonally from above, gripping ONE traditional Japanese calligraphy brush in a plausible controlled signing grip; forearm enters from upper-right, brush shaft slopes toward lower-left, and the clean black brush nib points down-left near the cell's lower-left region. Keep the entire brush and forearm within the cell. This sprite will move over lettering supplied separately by the website. Cell 2, middle: the same paw and short forearm in a relaxed follow-through after lifting the brush, still holding ONE matching Japanese brush with nib off the invisible surface, similar scale and direction but clearly a softer lifted pose. Cell 3, right: one distinct vermilion ink PAW-PRINT answering stamp, an irregular large central paw pad with four smaller toe pads, textured dry-ink edges and sparse authentic ink mottling, no enclosing seal, no handle and no characters. Real transparent alpha background, including all empty areas between fur, digits and brush; absolutely no white/gray background, no checkerboard artwork, no paper texture. The warm-white fur itself stays opaque. Anatomically coherent anthropomorphic paw grip with one thumb and four digits at most, no extra fingers, no human skin. Foreground assets only: no full character, no face, no UI, no lettering, no text, no watermark, no scenery, no ground shadows. Keep each sprite fully isolated within its own equal cell and make the brush nib easy to identify for an animation anchor.
