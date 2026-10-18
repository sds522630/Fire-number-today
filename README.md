# FIREPath — FIRE Calculator MVP

A responsive, installable web app for FIRE planning. It runs entirely in the browser; there is no backend and no account is required.

## Features
- Current age, target retirement age, assets, income, expenses, withdrawal rate
- Monthly contribution with annual step-up
- Return and inflation assumptions
- Inflation-adjusted FIRE target and projected portfolio
- Estimate of starting monthly investment needed for a selected target age
- Canvas chart, downloadable text report, URL-based shareable assumptions
- Progressive Web App manifest and service-worker cache
- Responsive layout and basic accessibility labels

## Run locally
Because service workers require localhost or HTTPS, serve the folder with a local web server.

### Python
```bash
python -m http.server 8000
```
Open http://localhost:8000

No dependencies or build step are required.

## Publish a public link
### GitHub Pages (free static hosting)
1. Create a GitHub account and a new public repository, for example `firepath-calculator`.
2. Upload `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `sw.js`, and `icon.svg` to the repository root.
3. Open **Settings → Pages**.
4. Under build and deployment, select **Deploy from a branch**, choose `main` and `/ (root)`, and save.
5. Wait for GitHub Pages to publish. It will show your public URL, typically `https://YOUR-USERNAME.github.io/firepath-calculator/`.
6. Test the link on a phone and a desktop. Use HTTPS so install and share features work correctly.

Alternative: Netlify or Cloudflare Pages can host these static files with similarly simple deployment.

## Important before a public launch
- This is an MVP, not a regulated financial-advice product.
- Projections use a constant annualized return; they are not Monte Carlo simulations and do not model volatility, tax, fees, or sequence-of-returns risk.
- Education is shown as a separate goal estimate and is not automatically deducted from retirement assets.
- URL sharing includes the financial assumptions in the query string. Do not share a link containing sensitive personal financial information publicly.
- Review the calculations, test edge cases, and have a qualified financial professional review the methodology before presenting it as advice.
- Add a privacy notice, terms, analytics consent if needed, and an appropriate disclaimer before a wider public launch.

## Model notes
Monthly growth rate is derived from the effective annual return: `(1 + annualReturn)^(1/12) - 1`.
Each month, balance grows by that rate and the month-end contribution is added. Contributions step up once per year.
FIRE target at year `n` is `annualExpenses * (1 + inflation)^n / withdrawalRate`.
The monthly amount required is found by binary search against the same projection model.
