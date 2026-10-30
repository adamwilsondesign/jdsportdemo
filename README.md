# JD Sports Canada — Premium CRO Redesign (POC)

A high-fidelity proof of concept for a redesigned [jdsports.ca](https://jdsports.ca): **Home, Collection (PLP), Product (PDP) and Cart**, built from the *JD Sports Canada — Premium Experience & CRO Implementation Brief*. It uses only JD's own brand assets, campaign imagery and live product content.

> Design direction: **JD energy + SKIMS restraint**. Campaign moments stay loud (full-bleed art, JD Yellow, heavy uppercase type). Commerce surfaces stay calm, square and precise.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static build: ~570 prerendered pages
```

Deploys to Vercel with no configuration. Connect the repo and every push gets a preview URL.

## Architecture: Shopify conventions without Shopify

The demo never talks to a real store, but it is structured like a headless Shopify build so the patterns carry straight over.

| Concern | Implementation |
| --- | --- |
| Data model | `src/data/catalog.json` mirrors the **Storefront API** shape: `Product → variants → selectedOptions`, `MoneyV2` prices, images with dimensions, `gid://shopify/...` IDs |
| Data layer | `src/lib/storefront.ts`: `getProduct`, `getCollectionProducts`, `searchProducts`, `getRecommendations`, each mapping 1:1 to a Storefront query |
| URLs | `/collections/[handle]`, `/products/[handle]?size=10`, `/cart`, `/search?q=`, `/pages/[slug]` |
| Filters | Shopify-style params: `?filter.brand=Nike&filter.size=Shoes:10&sort_by=price-asc&page=2` |
| Cart | Shopify Cart shape (`lines[].merchandise`), one authoritative state; checkout hands off to a **"Shopify Checkout takes over here"** end screen |
| Images | Served by Shopify's CDN with `&width=` transforms and `srcset` (the same approach as Liquid's `image_url: width:`) |
| Composition | Pages are assembled from section-style components (hero, rails, editorial, shoppable look) like OS 2.0 sections |
| SEO | Static generation for every product and collection, `Product` JSON-LD, metadata per route |

### Content source

`scripts/build-catalog.mjs` pulls JD Canada's public Shopify feeds (`/collections/*/products.json`). It then:
- Separates **brand / model / colourway** from JD's long titles.
- Groups sibling colourways.
- Reads JD's tags for "Only at JD" exclusivity, rollover images, size types and style classes.

```bash
node scripts/build-catalog.mjs --fetch   # refresh from jdsports.ca, then rebuild
```

The catalog has **258 products** (New Arrivals plus a curated set of 44 sale items). Campaign art lives in `public/campaign/` (webp).

### Brand assets

- `public/brand-logos/`: brand marks taken from JD Canada's own brands page (`jdsports.ca/pages/brands`), tight-cropped so they size consistently. The Reebok mark comes from Simple Icons (CC0). EA7, HOKA and Sonneti have no mark yet and fall back to text.
- `public/brand-cutouts/`: six hero shoes for the Shop by Brand stage. They were cut from JD's product photos with a one-off background-removal pass (rembg), which is not part of the build.

### Demo data (not public on jdsports.ca)

- **Per-variant inventory quantities.** Availability is real; quantities are generated deterministically, so low-stock messaging is consistent.
- **Ratings, review summaries and sample review text.** Labelled as sample data on the page.
- **Store locations and store stock.** Labelled as demo data in the store picker.

## Brief coverage

**Site-wide**
- Documented type scale (`.t-display` → `.t-meta`) and design tokens in `globals.css`.
- One badge per card with fixed priority: Sale → Only at JD → New.
- Restrained motion that respects `prefers-reduced-motion`.
- Visible yellow and black focus rings, 44px touch targets, live regions for cart, filter and stock changes.
- Reserved aspect ratios, so there is no layout shift.

**Home**
- One shoppable campaign hero (no carousel) with a single named CTA, kept short so the next section shows above the fold.
- "Shop by Category" with a yellow wipe hover.
- Four-up product rows (matching the PLP grid) for New Arrivals, Only at JD and Sale, each with one "View all (N)" link and no tabs or pagination.
- The whole page sits on black (`.theme-dark` re-points the neutral tokens).
- Two big-photography editorial pairs and a **shoppable UGG look** with hotspots.
- **Shop by Brand** tiles using brand logos.
- Store module, and a footer with a giant JD watermark.
- Compact remembered **country confirmation** instead of a blocking modal.

**PLP**
- Counts beside every filter value (disjunctive faceting).
- **Shoes / Clothing / Accessories size groups**, **in-stock toggle**, brand search.
- Applied filters shown in the sidebar, so toggling never pushes the grid down.
- One sticky bar for filter toggle, result count, quick filters and sort.
- 3 columns with filters open, 4 with them hidden.
- Promo cards and full-row campaign banners merchandised into the grid.
- **Infinite scroll** with URL state, scroll restoration after visiting a PDP, back to top, and no-results recovery.
- Full-height mobile filter sheet with "View N items".

**Product cards**
- Brand logo over the image (no mark taller than the Nike swoosh); model, colourway, price and rating in a tight block.
- Sale, New and low-stock tags over the image.
- Colour dots that switch the card's image, price and availability.
- Hover effects (instant alternate angle, Quick Buy) apply to the image only.
- In-place **Quick Buy**; its "Added" confirmation opens the cart.

**PDP**
- Thumbnail rail and one large image, click to zoom; mobile swipe with "1 / 6".
- Buy box order: brand logo, name, colours, a **single scrollable size row**, price with Afterpay, then **Add to Cart** above the fold.
- Size kept across colour changes, with links to colours that have it when it's sold out.
- US/UK/EU/CM toggle (remembered), fit cue, **fit recommender**, size guide.
- **Back-in-stock alerts** on sold-out sizes; "Only 2 left in size 10" only after selection.
- Buy Now, Pay Later marks (Afterpay, Shop Pay, Sezzle, PayPal) from jdsports.ca under the price.
- Key benefits, free-shipping qualification, returns summary and **inline store stock** under the CTA.
- Details, story and care kept separate; fit-summary reviews.
- One "Complete the Look" and one "You Might Also Like".
- **Mobile sticky purchase bar**.

**Cart**
- Single state source, so badge, heading and totals always agree.
- Dollar-based free-shipping progress.
- **Inline size and colour editing** with availability recheck.
- Save for later.
- **Remove with Undo**.
- Low-stock line warnings.
- Unavailable-line handling.
- Sale savings per line and in total.
- Shipping "Calculated at checkout" and tax "TBD", with an explainer.
- Afterpay split.
- Shop Pay express button.
- Payment marks.
- Returns reminder.
- Collapsible "Complete the look".
- Summary pinned while lines scroll.

**Intentionally not added** (per the brief's guardrails): promo-code entry in the cart, destination-based delivery date promises, and duplicate "You Might Like" modules.

## Notes and next steps

- **Fonts:** JD's site uses licensed **Gotham**. This POC self-hosts Montserrat (OFL, `src/app/fonts/`), its closest free match, via `--font-brand`. Swap the file for JD's licensed Gotham in production.
- Product images are hot-linked from JD's Shopify CDN. If JD removes a product, its images will 404 until the catalog is rebuilt.
- Out of scope: Kids and Releases navigation (no catalog coverage), French locale, account and auth, real checkout.
