# Final image prompts

Mode: built-in ImageGen. Reference: `reference.png`, except the blink frame, which uses `assets/cartoon/shop/owner-open.png`. PNGs are saved under `assets/cartoon/shop/` with the names below.

## scene-wall.png — opaque

Extract a background scene plate from this EXACT approved shop image. Preserve its 16:9 composition, dark muted warm gray central wall, simple painted wooden shelving and jars at far left and right, and bold 1930s cartoon ink/watercolor treatment. REMOVE merchant completely, all merchandise, all price tags, entire wooden counter and dark lower front panel, all UI and all lettering. Fill formerly occluded areas naturally with dark central wall / lower shelving. No character, no counter, no text, no UI, no merchandise, no signage. Keep same camera scale, same wall shading, same shelf positions. Opaque full-frame game background plate.

## scene-counter.png — transparent

Extract ONLY the wooden countertop and its dark front panel from this EXACT approved 16:9 shop image, as a transparent-background compositing layer. Preserve the countertop geometry, warm paint texture and dark hand-inked front edge. Full 16:9 canvas with same registration: countertop upper back edge at y=59 percent on left, y=57 percent on right, front lip runs y=70 percent. Dark brown almost-black counter front covers bottom 30 percent. Entire top 57 percent TRANSPARENT. Remove all merchant parts, gloves, merchandise, price tags, selection pointer, all UI lettering and paper button. Fill those holes with matching uninterrupted wood or dark panel, no text/no symbols. Counterfront opaque to bottom edge, exactly like reference. No shelves or wall, no characters. This will be drawn IN FRONT OF the merchant's lower body. No background, preserve real transparent alpha.

## owner-open.png — transparent

Extract and redraw the EXACT spool shopkeeper from the LEFT SIDE of this approved shop image as one transparent character sprite. Preserve EXACT pose, face, eyes, proportions, blue hat/tan brim, blue overalls, left forearm with white glove resting on counter, right arm gesturing palm up toward merchandise. Same 1930s ink-and-painted watercolor style, same friendly smile. This is the character alone, without counter, wall, products, price labels, pointer or UI. Include the lower torso extending beneath counter level by about 10 percent of character height so a separate foreground counter can naturally occlude him. Keep whole hat, both hands and elbows inside crop. Tight bounding canvas around character silhouette, roughly 1.3:1 wide. All surrounding pixels transparent. Eye openings black ovals as reference. Do not change to centered portrait pose; retain leaning merchant on left pointing to right.

## owner-blink.png — transparent

Precise animation-frame edit. This is the open-eye frame of our shopkeeper. Create its CLOSED-EYE BLINK frame. Change ONLY the two black oval eyes: replace each black oval with a curved black closed eyelid line, restoring the tan face paint behind where the oval was. Keep EXACT same image dimensions, transparent canvas, character silhouette, registration, hat, face position, nose, mouth, tooth, hands, finger positions, clothing, contours and all pixels outside the eye regions. Do not move, crop, resize, redraw or recolor the character. Same pose and exact alignment needed for a two-frame blink; eyes gently closed, still smiling. Preserve true transparency.

## action-paper.png — transparent

Extract ONLY the blank cream torn paper action-button label from the bottom right of this image. Remove all lettering, symbols, coin and decorative rays so the paper is entirely blank. Preserve warm watercolor paper, asymmetric torn left/right ends and hand-inked slight shadow edge. Tight crop, horizontal roughly 4:1 aspect, transparent outside paper silhouette. No background, no scene, no text, no additional objects. Production UI button background.

## pointing-hand.png — transparent

Extract ONLY the small cartoon pointing glove cursor next to the pink candy in this image, on transparent background. Same cream white gloved hand with dark thick ink outline and slight tan shading, pointing diagonally up and right with one extended index finger. Tight crop, no surrounding rays, no background, no candy, no text, no other objects. Simple 1930s cartoon UI selection cursor.

## price-tag.png — transparent

Extract one of the tiny cream folding tent price tags standing on the counter in this image. Blank tag: REMOVE numbers and coin symbols. Preserve black thick cartoon outlines, ivory card face, little triangular folded-back support on left, slightly angled trapezoid front face. Tight crop with transparent background. One blank physical price tag only, no counter, no text, no other objects. Horizontal roughly 2:1 aspect. Match exact approved simple 1930s painted style.

## gold-coin.png — transparent

Extract a single golden cartoon coin from the top-right wallet of this image. One vertically standing gold coin, oval due slight perspective, thick dark ink outline, bright yellow rim, simple orange shaded inner oval and cream highlight, exactly matching reference. Tight crop with transparent background. No numbers, lettering, rays, UI, background or other objects. Clean simple 1930s ink-and-paint icon.
