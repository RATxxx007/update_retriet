# Summit Reset

Static landing page for the Summit Reset corporate retreat.

## Live Editing

The site is a plain static build:

- `index.html` - page structure and content
- `styles.css` - visual system and responsive layout
- `script.js` - interactions, reveal animations, FAQ, and inquiry form UX
- `Photos/` - local venue photography used in the landing page

## Local Preview

Run a simple local server from the project root:

```bash
python3 -m http.server 4173
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Deploy

GitHub Pages deployment is configured through [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

After GitHub Pages is enabled for the repository, every push to `main` will publish the current static site automatically.

## Notes

- `site-config.js` contains the inquiry endpoint placeholder.
- The project currently uses a mix of local venue photos and remote massage images.
