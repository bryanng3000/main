# Bryan Ng — personal and commercial portfolio

Live website: https://bryanng3000.github.io/main/

The site is static HTML, CSS and JavaScript. The existing GitHub Pages workflow publishes the repository root on pushes to `main`. No package installation or server is required.

## Editing

- `content.js`: regional contacts, verified work, Malaysia rates, English/Chinese copy, brand placeholders, testimonial categories and quiz questions.
- `app.js`: language/region navigation, video and rate dialogs, brand scrolling and the project finder.
- `styles.css`, `pages.css`, `theme.css`: responsive layout and the white-background, black-text theme.
- `src/layout.html` and `scripts/build-pages.py`: shared page templates. After editing these or the English copy, run `python scripts/build-pages.py` to regenerate the eight pages and the legacy Clients redirect.
- `assets/`: portrait and selected-film thumbnails.

Malaysia uses email/WhatsApp and category prices. China uses email/WeChat and has no published monetary rates. The project finder only prepares an editable draft; it does not automatically send messages or collect answers on a server.

Brand and testimonial records marked `placeholder: true` are layout samples, not endorsements. Replace them with genuine collaborations and feedback when available.

Existing PDFs and older asset folders are retained for their original links. The pre-redesign site is preserved in the backup branch created before deployment and in Git history.
