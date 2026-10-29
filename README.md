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
- Destination-specific hero CTAs with **named campaign tabs** instead of dots, plus pause control and progress.
- Shopping benefits row.
- Explicit "Shop by Category".
- Persistent **New Arrivals** rail with tabs, "View all (N)", position counter and end state.
- Editorial tiles with label, headline and named CTA.
- **Shoppable UGG look** with hotspots.
- "Only at JD" band.
- Sale rail.
- Store module.
- Collapsed SEO copy.
- Compact remembered **country confirmation** instead of a blocking modal.

**PLP**
- Counts beside every filter value (disjunctive faceting).
- **Shoes / Clothing / Accessories size groups**.
- **In-stock toggle**.
- Brand search.
- Selection count on each group heading ("Brand · 2").
- Removable chips and Clear all.
- Sticky toolbar with result count.
- Full-height mobile sheet with "View N items".
- Use-case shortcuts.
- **Load more** with "Showing X of Y" and URL state.
- Scroll restoration after visiting a PDP.
- Back to top.
- No-results recovery.

**Product cards**
- Brand on its own line above the model.
- "+N colours" with swatches that update image, price and availability.
- Hover alternate angle.
- In-place **Quick Buy** with purchasable sizes. Its "Added" confirmation card is fully clickable and opens the cart.
- Factual stock line.
- Stable card height.

**PDP**
- Three key benefits near the price.
- Colour switching that **keeps the selected size** and explains when that size is sold out (linking to colours that have it).
- US/UK/EU/CM toggle, remembered.
- Model fit cue.
- **Fit recommender**.
- Size guide.
- Distinct size states.
- **Back-in-stock alerts** on sold-out sizes.
- "Only 2 left in size 10" shown only after selection.
- Free-shipping qualification and returns summary under the CTA.
- **Inline store stock** after size selection, with preferred store remembered.
- Desktop 2-up gallery with zoom lightbox; mobile swipe with "1 / 6".
- Details, story and care kept separate.
- Fit-summary reviews.
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

- **Fonts:** JD's site uses licensed **Gotham**. This POC uses Montserrat, its closest free match, via `--font-brand`. Point that variable at self-hosted Gotham for production.
- Product images are hot-linked from JD's Shopify CDN. If JD removes a product, its images will 404 until the catalog is rebuilt.
- Out of scope: Kids and Releases navigation (no catalog coverage), French locale, account and auth, real checkout.
