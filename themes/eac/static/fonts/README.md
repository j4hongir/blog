# JetBrains Mono

Active family for all theme text, navigation, headings, metadata and code.
Source: https://github.com/JetBrains/JetBrainsMono
Pinned commit: `19371302b95d218af43299bce79ddbddd0bc364d`
Source files: `fonts/variable/JetBrainsMono[wght].ttf` and
`fonts/variable/JetBrainsMono-Italic[wght].ttf`.
License: SIL OFL 1.1, full notice in `JetBrainsMono-OFL.txt`.

Local variable WOFF2 subsets: normal and italic, weights 100–800.
Russian alphabet (including Ёё), English, numbers and punctuation verified.
Only normal is preloaded; italic downloads when italic content uses it.
No Google Fonts CSS or third-party font requests. `font-display: swap` keeps
text visible during loading. Both `--sans` and `--mono` use this family.

Preparation: FontTools subset + Brotli, preserving layout features and weights.
Unicode ranges: U+0020-00FF,U+0400-052F,U+2000-206F,U+20A0-20CF,
U+2100-214F,U+2190-21FF,U+2212,U+FEFF,U+FFFD.
The prepared files need no build-time font tools.

For another font, update @font-face and --mono in `static/style.css`, and the
normal-file preload in `templates/document.html` and
`scripts/sync_submodule_styles.py`. Use a new filename to avoid stale caches.
Then run `python3 scripts/sync_submodule_styles.py` to update both modules.

## Inactive previous fonts

Golos Text (`OFL.txt`) and Manrope (`Manrope-OFL.txt`) are retained for reverting
font choices. Neither is referenced by active CSS or preload, so neither loads.
