# Margin Missions

An interactive, mobile-friendly merchant learning prototype by **Team PluemPiTi**. It helps a restaurant owner evaluate one promotion decision using confirmed variable costs, a demand assumption, a new practice question, an owner-controlled test plan, and a cautious review. The interface opens in English and can be switched to Thai. This README is in English.

**Live prototype:** <https://grab-drab-pi.vercel.app/>

## Run locally

Requirements: Node.js 18 or newer. There are no runtime dependencies.

```bash
npm start
```

Open <http://127.0.0.1:4173>. Run the calculation tests with:

```bash
npm test
```

The root `index.html` can also be hosted on any static web host. Use an HTTP server because the application imports a JavaScript module.

## Deploy to Vercel

1. Import the [GitHub repository](https://github.com/svkhun/Grab) into Vercel and select the `main` branch.
2. Keep the project root at `.`. The checked-in `vercel.json` selects the **Other** framework, runs `npm run build`, and publishes `dist/`.
3. No environment variables, server command, or Node web service are required. Click **Deploy**. Later pushes to `main` can trigger redeploys through the Git integration.

The build copies only `index.html`, `styles.css`, `app.js`, `logic.mjs`, and `i18n.mjs` into `dist/`. The local Node server, tests, README, and original source documents are not part of the deployed website. To check the exact output locally:

```bash
npm run build
npm run preview
```

Open <http://127.0.0.1:4173>. `npm run preview` uses the same small HTTP server as `npm start`, but serves `dist/` instead of the project root.

## Prototype flow

1. **Check costs:** Enter a menu price, ingredient cost, packaging, platform charges, other variable costs, and baseline weekly orders. Blank or invalid values block calculations; unknown costs are never silently treated as zero.
2. **Compare:** Change the discount, one-off photo test cost, and assumed order uplift. See weekly contribution for doing nothing, discounting, and improving a menu photo. The app calculates the extra orders needed to break even.
3. **Practise and approve:** Solve a different break-even question. The owner can approve a sample seven-day photo test only after passing the question and setting a spending cap that covers the test. They can also skip the plan and inspect the review example.
4. **Review:** Vary observed orders and benchmark growth. The app separates raw change from the benchmark-adjusted gap. The owner can record a decision locally and download a text summary of the current scenario.

The **EN / ไทย** control switches all lesson copy, calculation explanations, validation messages, and the downloaded summary without clearing entered numbers. English is the first-visit default; the chosen language is remembered in the current browser.

## Calculation model

- Unit contribution = menu price − ingredients − packaging − platform charges − other variable costs.
- Baseline weekly contribution = baseline orders × unit contribution.
- Discount contribution = assumed orders × (unit contribution − discount).
- Required discount uplift = old unit contribution ÷ discounted unit contribution − 1, when both are positive.
- Photo test contribution = assumed orders × unit contribution − photo test cost.
- Extra photo-test orders to break even = ceiling(photo test cost ÷ unit contribution), when unit contribution is positive.
- Benchmark-adjusted review gap = observed contribution after test cost − baseline orders × (1 + benchmark growth) × unit contribution.

The default synthetic scenario follows the supplied presentation and PDF: THB 100 price, THB 75 variable costs, 100 weekly orders, THB 10 discount, THB 200 photo test, and 20% assumed uplift. It produces THB 25 unit contribution, a 66.7% discount break-even uplift, and eight extra orders to cover the photo test. The review example uses 112 observed orders and 8% benchmark growth, resulting in a THB 100 raw gain but a THB 100 negative benchmark-adjusted gap.

## What the prototype does and does not do

All starting values and review outcomes are **synthetic examples**. User edits are scenarios, not forecasts or measured outcomes. The THB 30 platform charge is an example, **not a Grab fee quote**. Contribution excludes fixed costs. Actual tax, fee, co-funding, and settlement treatment must be confirmed before a real merchant decision. One shop-week cannot establish causality.

This is a standalone deterministic web application. It does not call live AI, connect to GrabMerchant or a POS, process payments, spend money, or change a store. The review decision is saved only to the current browser's `localStorage`; the downloaded summary is generated locally. The proposed Thai voice/text AI coach, permission-based data import, and randomized 240-shop pilot described in the presentation are future validation and production concepts, not implemented features or proven outcomes.

## Source material and design

- The supplied ZIP storyboard informed the interaction and calculation model.
- The supplied presentation and PDF informed the four-step flow, sample arithmetic, evidence limits, and pilot plan.
- The supplied Grab UI image informed the green visual language and mobile presentation. The merchant mission and its calculations remain the primary focus.

The original ZIP, presentation, and PDF remain local source material and are intentionally excluded from this public repository.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Accessible, bilingual application markup |
| `styles.css` | Responsive layout and visual system |
| `app.js` | Interaction and local browser state |
| `i18n.mjs` | English and Thai interface copy |
| `logic.mjs` | Pure calculation and input validation functions |
| `logic.test.mjs` | Tests for documented examples and invalid inputs |
| `server.mjs` | Dependency-free local HTTP server |
| `scripts/build.mjs` | Allowlist build for static deployment |
| `vercel.json` | Vercel build and output configuration |
