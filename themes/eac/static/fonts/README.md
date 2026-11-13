# Golos Text

Source: https://github.com/googlefonts/golos-text
Pinned commit: `cf2e27222937d97c2d858fff0499bcc667a64e9d`
Original file: `fonts/variable/GolosText[wght].ttf`
License: SIL OFL 1.1; the complete notice is in `OFL.txt`.

`golos-text-ru-latin-v1.woff2` is a local variable web subset with a weight axis
limited to 400–700. It contains Latin and Cyrillic letters, numbers, punctuation,
currency symbols and the supported arrows. No remote font request is needed.
Code and technical metadata continue to use system monospace fonts.

Preparation uses FontTools (`varLib.instancer` followed by `subset`) and Brotli.
These tools are not required for a Zola build: the finished WOFF2 is committed.
Keep shaping/layout features. Subset Unicode ranges:

```
U+0020-00FF,U+0400-052F,U+2000-206F,U+20A0-20CF,
U+2100-214F,U+2190-21FF,U+2212,U+FEFF,U+FFFD
```

The stylesheet and preload reference the same file, without mismatched query
parameters. When replacing the font, update its versioned filename in the CSS,
`templates/document.html` and `scripts/sync_submodule_styles.py`, then run:

```sh
python3 scripts/sync_submodule_styles.py
```

The sync script also copies the font and license into both standalone modules.
