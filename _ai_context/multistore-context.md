# Multistore AI Context

Generated from: /Users/matsgrotterud/multistore

## Project tree

```
_ai_context/
.claude/
  settings.local.json
prisma/
  seed-data/
    bamboo-toothbrushes.ts
    drones.ts
    ergonomic-office.ts
    hiking-gear.ts
    pet-grooming.ts
    types.ts
  dev.db
  schema.prisma
  seed.ts
public/
  catalog/
    backpack/
      01.jpg
      02.jpg
      03.jpg
    bamboo/
      01.jpg
      02.jpg
      03.jpg
    battery/
      01.jpg
      02.jpg
      03.jpg
    camera/
      01.jpg
      02.jpg
      03.jpg
    camping/
      01.jpg
      02.jpg
      03.jpg
    cat/
      01.jpg
      02.jpg
      03.jpg
    chair/
      01.jpg
      02.jpg
      03.jpg
    desk/
      01.jpg
      02.jpg
      03.jpg
    dog/
      01.jpg
      02.jpg
      03.jpg
    drone/
      01.jpg
      02.jpg
      03.jpg
      04.jpg
      05.jpg
    eco/
      01.jpg
      02.jpg
      03.jpg
    ergonomic/
      01.jpg
      02.jpg
      03.jpg
    fpv/
      01.jpg
      02.jpg
      03.jpg
    grooming/
      01.jpg
      02.jpg
      03.jpg
    hiking/
      01.jpg
      02.jpg
      03.jpg
      04.jpg
    office/
      01.jpg
      02.jpg
      03.jpg
      04.jpg
    pet/
      01.jpg
      02.jpg
      03.jpg
      04.jpg
    poles/
      01.jpg
      02.jpg
      03.jpg
    product/
      01.jpg
      02.jpg
      03.jpg
      04.jpg
      05.jpg
    toothbrush/
      01.jpg
      02.jpg
      03.jpg
  uploads/
scripts/
  catalog-sync.ts
  db-doctor.ts
  download-catalog-images.ts
  media-smoke.ts
  refresh-product-images.ts
  repair-local-env.ts
  smoke.mjs
  sync-supplier-images.ts
src/
  app/
    admin/
      content/
        page.tsx
      experiments/
        page.tsx
      generator/
        page.tsx
      import/
        page.tsx
      login/
        page.tsx
      orders/
        page.tsx
      products/
        page.tsx
      providers/
        page.tsx
      seo-audit/
        page.tsx
      stores/
        [slug]/
          edit/
          products/
        page.tsx
      layout.tsx
      page.tsx
    api/
      admin/
        jobs/
          run/
        upload/
          route.ts
      checkout/
        create-payment-intent/
          route.ts
      cron/
        catalog-sync/
          route.ts
        sync-supplier-catalog/
          route.ts
      debug/
        db/
          route.ts
      feeds/
        google/
          route.ts
      health/
        route.ts
      placeholder/
        route.ts
      track/
        route.ts
      webhooks/
        stripe/
          route.ts
    s/
      [store]/
        c/
          [category]/
        cart/
          page.tsx
        checkout/
          page.tsx
        compare/
          page.tsx
        guides/
          [slug]/
          page.tsx
        p/
          [product]/
        policies/
          privacy/
          returns/
          shipping/
          terms/
        quiz/
          page.tsx
        search/
          page.tsx
        layout.tsx
        page.tsx
    globals.css
    layout.tsx
    not-found.tsx
    page.tsx
    robots.ts
    sitemap.ts
  components/
    admin/
      AdminLoginForm.tsx
      AdminNav.tsx
      ComingSoon.tsx
      fields.tsx
      GeneratorForms.tsx
      GoLiveButton.tsx
      ProductEditForm.tsx
      ProductImageManager.tsx
      StoreEditForm.tsx
    AddToCartButton.tsx
    Breadcrumbs.tsx
    CartButton.tsx
    CartDrawer.tsx
    CartPageContent.tsx
    CategoryCard.tsx
    CheckoutForm.tsx
    ComparisonTable.tsx
    CookieConsent.tsx
    FAQAccordion.tsx
    FilterSidebar.tsx
    GuideCard.tsx
    NewsletterCapture.tsx
    PageViewTracker.tsx
    PolicyDisclosure.tsx
    PolicyPage.tsx
    PriceBlock.tsx
    ProductCard.tsx
    ProductCardCta.tsx
    ProductGallery.tsx
    ProductGrid.tsx
    ProductPurchaseActions.tsx
    ProductQuiz.tsx
    RatingDisplay.tsx
    SearchBox.tsx
    ShippingEstimate.tsx
    SortDropdown.tsx
    StickyMobileCTA.tsx
    StoreFooter.tsx
    StoreHeader.tsx
    StructuredData.tsx
    TrustBar.tsx
  config/
    domain-map.ts
  lib/
    actions/
      admin-image.ts
      admin-import.ts
      admin-product.ts
      admin-store.ts
      admin.ts
      checkout.ts
      form.ts
      generator.ts
      newsletter.ts
    admin/
      auth.ts
      commerce-dashboard.ts
    ai/
      content-guardrails.ts
      mock-ai-provider.ts
      store-blueprint.ts
      types.ts
    analytics/
      events.ts
      track.ts
    cart/
      cart-context.tsx
    catalog/
      candidate-service.ts
      publish-product.ts
      quality-gates.ts
      refresh-existing-products.ts
    content/
      markdown.tsx
    db/
      dev-guard.ts
      env-sanitize.ts
    images/
      enhance-pipeline.ts
      photo-catalog.ts
      resolve-product-images.ts
      sync-product-images.ts
      types.ts
    jobs/
      catalog-jobs.ts
      queue.ts
      runner.ts
    media/
      fetch-media.ts
      hash.ts
      ingest-product-media.ts
      sync-product-gallery.ts
    monetization/
      bundles.ts
      margin.ts
      recommendations.ts
    orders/
      persist-order.ts
      prepare-checkout.ts
      route-order.ts
      types.ts
    payments/
      payment-provider.ts
      stripe-client.ts
    pricing/
      calculate-price.ts
    products/
      product-score.ts
    quiz/
      quiz-config.ts
    seo/
      canonical.ts
      jsonld.ts
      metadata.ts
      sitemap.ts
    settings/
      store-settings.ts
    storage/
      local-storage-provider.ts
      storage-provider.ts
      types.ts
      vercel-blob-provider.ts
    stores/
      create-from-blueprint.ts
      locale-defaults.ts
      preview-url.ts
      queries.ts
    suppliers/
      aliexpress/
        api-client.ts
        find-images.ts
      catalog/
        discover-products.ts
        enrich-candidate.ts
        import-candidate.ts
        provider-health.ts
        score-candidate.ts
      providers/
        alibaba-provider.ts
        aliexpress-provider.ts
        amazon-provider.ts
        cj-auth.ts
        cj-provider.ts
        doba-provider.ts
        ebay-provider.ts
        errors.ts
        mock-provider.ts
        registry.ts
        temu-provider.ts
        types.ts
        wish-provider.ts
      scrape/
        aliexpress.ts
        ebay.ts
        image-urls.ts
        index.ts
        jina-reader.ts
        temu.ts
      import-products.ts
      mock-supplier.ts
      sync-supplier-images.ts
      types.ts
    tenant/
      resolve-tenant.ts
    uploads/
      save-upload.ts
    utils/
      json.ts
    validation/
      schemas.ts
    consent.ts
    db.ts
    theme.ts
    types.ts
  middleware.ts
.eslintrc.json
.gitignore
next-env.d.ts
next.config.ts
package.json
postcss.config.mjs
README.md
tailwind.config.ts
tsconfig.json
tsconfig.tsbuildinfo
vercel.json

```

## Files



---

## .claude/settings.local.json

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npx prisma *)"
    ]
  }
}

```


---

## .eslintrc.json

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@next/next/no-img-element": "off",
    "react/no-unescaped-entities": "off"
  }
}

```


---

## next-env.d.ts

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference path="./.next/types/routes.d.ts" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```


---

## next.config.ts

```ts
import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile in a parent directory doesn't
  // confuse output file tracing.
  outputFileTracingRoot: path.join(__dirname),
  // Storefront images come from the local /api/placeholder route and admin
  // uploads under /uploads/** in development; real deployments should add their
  // CDN/object-storage hostnames to remotePatterns. localPatterns whitelists the
  // upload path for next/image (the storefront uses plain <img> today, but this
  // keeps the path valid if/when imagery migrates to next/image).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "blob.vercel-storage.com", pathname: "/**" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
      { protocol: "https", hostname: "*.aliexpress-media.com", pathname: "/**" },
      { protocol: "https", hostname: "*.alicdn.com", pathname: "/**" },
      { protocol: "https", hostname: "ae01.alicdn.com", pathname: "/**" },
      { protocol: "https", hostname: "*.ebayimg.com", pathname: "/**" },
      { protocol: "https", hostname: "img.kwcdn.com", pathname: "/**" },
      { protocol: "https", hostname: "**.temu.com", pathname: "/**" },
    ],
    localPatterns: [{ pathname: "/uploads/**" }, { pathname: "/api/placeholder" }],
  },
  // Multi-tenant rewrites are handled in src/middleware.ts based on the Host
  // header, so no static rewrites are needed here.
};

export default nextConfig;

```


---

## package.json

```json
{
  "name": "multi-store-dropship-factory",
  "version": "0.1.0",
  "private": true,
  "description": "Multi-tenant dropshipping store factory: one Next.js codebase serving many niche storefronts resolved by domain.",
  "scripts": {
    "postinstall": "prisma generate",
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:doctor": "tsx scripts/db-doctor.ts",
    "db:repair-local": "tsx scripts/repair-local-env.ts",
    "dev:local": "dotenv -e .env.local -o -- next dev -p 3010",
    "db:push": "prisma db push",
    "db:push:local": "dotenv -e .env.local -o -- prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:seed:local": "dotenv -e .env.local -o -- pnpm run db:seed",
    "db:refresh-images": "tsx scripts/refresh-product-images.ts",
    "sync:supplier-images": "tsx scripts/sync-supplier-images.ts",
    "catalog:download": "tsx scripts/download-catalog-images.ts",
    "catalog:discover": "tsx scripts/catalog-sync.ts discover",
    "catalog:run-jobs": "tsx scripts/catalog-sync.ts run-jobs",
    "catalog:sync": "tsx scripts/catalog-sync.ts sync",
    "catalog:health": "tsx scripts/catalog-sync.ts health",
    "media:smoke": "tsx scripts/media-smoke.ts",
    "prisma:studio": "prisma studio"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^6.5.0",
    "@stripe/react-stripe-js": "^6.6.0",
    "@stripe/stripe-js": "^9.8.0",
    "@vercel/blob": "^2.4.0",
    "next": "^15.2.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "stripe": "^22.2.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^22.13.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "dotenv-cli": "^8.0.0",
    "eslint": "^8.57.1",
    "eslint-config-next": "^15.2.3",
    "postcss": "^8.5.3",
    "prisma": "^6.5.0",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.3",
    "typescript": "^5.8.2"
  }
}

```


---

## postcss.config.mjs

```mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;

```


---

## prisma/schema.prisma

```prisma
// Multi-tenant store factory schema.
//
// Postgres (Neon) for production and recommended local dev.
// JSON fields are stored as String columns for SQLite/Postgres parity; validate
// with Zod in app code (see src/lib/types.ts and src/lib/validation/schemas.ts).
// On Postgres you may later migrate String JSON columns to native `Json` types.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  // Neon: use the *direct* connection for migrations/db push; use the *pooled*
  // connection (host contains "-pooler") for DATABASE_URL on Vercel/serverless.
  directUrl = env("DIRECT_URL")
}

model Store {
  id                        String   @id @default(cuid())
  slug                      String   @unique
  name                      String
  legalName                 String
  primaryDomain             String
  locale                    String   @default("en-US")
  currency                  String   @default("USD")
  niche                     String
  positioning               String
  audience                  String
  valueProposition          String
  brandVoice                String
  logoText                  String
  supportEmail              String
  supportPhone              String?
  shippingOriginDisclosure  String
  defaultShippingDaysMin    Int      @default(5)
  defaultShippingDaysMax    Int      @default(12)
  returnPolicySummary       String
  privacyPolicy             String
  termsOfSale               String
  // DRAFT | PREVIEW | LIVE — PREVIEW stores are noindexed until a real domain is connected.
  launchStatus              String   @default("PREVIEW")
  // Domain the merchant plans to use (e.g. jaaaws.com). Storefront preview works via /s/[slug] until LIVE.
  plannedDomain             String?
  isActive                  Boolean  @default(true)
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  theme                 StoreTheme?
  settings              StoreSettings?
  domains               Domain[]
  categories            Category[]
  products              Product[]
  contentPages          ContentPage[]
  collections           Collection[]
  cartEvents            CartEvent[]
  newsletterSubscribers NewsletterSubscriber[]
  experiments           Experiment[]
  supplierSettings      StoreSupplierSettings[]
  productCandidates     ProductCandidate[]
  catalogSyncRuns       CatalogSyncRun[]
  catalogJobs           CatalogJob[]
  customers             Customer[]
  orders                Order[]
  wishlists             Wishlist[]
}

model StoreSettings {
  id      String @id @default(cuid())
  storeId String @unique
  // JSON-encoded StoreSettings object (see src/lib/settings/store-settings.ts).
  // Holds SEO defaults, homepage layout, monetization targets, marketing
  // pixels, personalization weights, automation thresholds and compliance
  // toggles. Validated + defaulted in app code with Zod.
  settings String @default("{}")

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
}

model StoreTheme {
  id              String @id @default(cuid())
  storeId         String @unique
  primaryColor    String
  secondaryColor  String
  accentColor     String
  backgroundColor String
  textColor       String
  borderRadius    String @default("0.75rem")
  fontHeading     String @default("system-ui")
  fontBody        String @default("system-ui")

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
}

model Domain {
  id        String  @id @default(cuid())
  storeId   String
  hostname  String  @unique
  isPrimary Boolean @default(false)

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@index([storeId])
}

model Category {
  id             String @id @default(cuid())
  storeId        String
  slug           String
  name           String
  description    String
  seoTitle       String
  seoDescription String
  heroTitle      String
  heroSubtitle   String
  sortOrder      Int    @default(0)

  store    Store     @relation(fields: [storeId], references: [id], onDelete: Cascade)
  products Product[]
  productCandidates ProductCandidate[]

  @@unique([storeId, slug])
  @@index([storeId])
}

model Product {
  id                String   @id @default(cuid())
  storeId           String
  categoryId        String
  slug              String
  title             String
  subtitle          String
  description       String
  shortDescription  String
  brand             String
  sku               String
  gtin              String?
  imageUrl          String
  imageAlt          String
  price             Float
  compareAtPrice    Float?
  currency          String   @default("USD")
  cost              Float
  shippingCost      Float
  marginPercent     Float
  // One of: IN_STOCK | LOW_STOCK | OUT_OF_STOCK | PREORDER (enum in app code)
  stockStatus       String   @default("IN_STOCK")
  supplierName      String
  supplierProductId String
  // aliexpress | temu | ebay | wish | alibaba — used by the image sync cron.
  supplierSource    String   @default("aliexpress")
  // Direct listing URL when known; otherwise search uses supplierSearchQuery.
  supplierUrl       String?
  supplierSearchQuery String?
  imagesSyncedAt    DateTime?
  providerKey       String?
  externalId        String?
  sourceUrl         String?
  affiliateUrl      String?
  fulfillmentMode   String   @default("MANUAL")
  lastSupplierSyncAt DateTime?
  supplierDataJson  String   @default("{}")
  mediaStatus       String   @default("UNKNOWN")
  qualityStatus     String   @default("NEEDS_REVIEW")
  shippingDaysMin   Int
  shippingDaysMax   Int
  countryOfOrigin   String?
  materials         String?
  warranty          String?
  returnable        Boolean  @default(true)
  ratingAverage     Float?
  ratingCount       Int      @default(0)
  // JSON-encoded string[] (use native Json on Postgres)
  pros              String   @default("[]")
  // JSON-encoded string[]
  cons              String   @default("[]")
  // JSON-encoded { label, value }[]
  specs             String   @default("[]")
  // JSON-encoded string[] of use-case tags (drives quiz + recommendations)
  useCases          String   @default("[]")
  // JSON-encoded { question, answer }[]
  faq               String   @default("[]")
  seoTitle          String
  seoDescription    String
  canonicalUrl      String?
  productScore      Float    @default(0)
  isPublished       Boolean  @default(true)
  noindex           Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  store    Store          @relation(fields: [storeId], references: [id], onDelete: Cascade)
  category Category       @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  images   ProductImage[]
  mediaAssets ProductMediaAsset[]
  orderItems OrderItem[]
  wishlistItems WishlistItem[]

  @@unique([storeId, slug])
  @@index([storeId, isPublished])
  @@index([categoryId])
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  url       String
  alt       String  @default("")
  sortOrder Int     @default(0)
  isPrimary Boolean @default(false)
  sourceUrl String?
  storageKey String?
  providerKey String?
  externalId String?
  contentHash String?
  width Int?
  height Int?
  contentType String?
  ingestionStatus String @default("LEGACY")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
}

model SupplierProvider {
  id                     String   @id @default(cuid())
  key                    String   @unique
  name                   String
  type                   String
  isEnabled              Boolean  @default(false)
  supportsSearch         Boolean  @default(false)
  supportsProductDetails Boolean  @default(false)
  supportsImages         Boolean  @default(false)
  supportsVideo          Boolean  @default(false)
  supportsInventory      Boolean  @default(false)
  supportsPricing        Boolean  @default(false)
  supportsCheckout       Boolean  @default(false)
  supportsTracking       Boolean  @default(false)
  supportsReturns        Boolean  @default(false)
  defaultFulfillmentMode String   @default("AFFILIATE")
  reliabilityScore       Float    @default(0.75)
  averageShippingDays    Int      @default(14)
  configJson             String   @default("{}")
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}

model StoreSupplierSettings {
  id                String   @id @default(cuid())
  storeId           String
  providerKey       String
  isEnabled         Boolean  @default(true)
  priority          Int      @default(0)
  fulfillmentMode   String   @default("AFFILIATE")
  importQueries     String   @default("[]")
  excludedKeywords  String   @default("[]")
  minMarginPercent  Float    @default(25)
  minProductScore   Float    @default(75)
  maxShippingDays   Int      @default(18)
  autoPublish       Boolean  @default(false)
  settingsJson      String   @default("{}")

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@unique([storeId, providerKey])
  @@index([storeId])
}

model ProductCandidate {
  id                  String   @id @default(cuid())
  storeId             String
  categoryId          String?
  providerKey         String
  externalId          String
  sourceUrl           String?
  affiliateUrl        String?
  titleRaw            String
  titleEnhanced       String?
  descriptionRaw      String?
  descriptionEnhanced String?
  brandRaw            String?
  priceRaw            Float?
  currencyRaw         String?
  supplierCost        Float?
  shippingCost        Float?
  marginPercent       Float?
  stockStatus         String   @default("UNKNOWN")
  shippingDaysMin     Int?
  shippingDaysMax     Int?
  countryOfOrigin     String?
  gtin                String?
  skuCandidate        String?
  specsJson           String   @default("[]")
  variantsJson        String   @default("[]")
  mediaJson           String   @default("[]")
  signalsJson         String   @default("{}")
  riskJson            String   @default("{}")
  score               Float    @default(0)
  status              String   @default("NEW")
  rejectionReason     String?
  importedProductId   String?
  lastSeenAt          DateTime @default(now())
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  store       Store               @relation(fields: [storeId], references: [id], onDelete: Cascade)
  category    Category?           @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  mediaAssets ProductMediaAsset[]

  @@unique([storeId, providerKey, externalId])
  @@index([storeId, status])
  @@index([providerKey, externalId])
}

model ProductMediaAsset {
  id                String   @id @default(cuid())
  productId         String?
  candidateId       String?
  providerKey       String?
  externalId        String?
  mediaType         String   @default("IMAGE")
  sourceUrl         String
  storageUrl        String?
  storageKey        String?
  thumbnailUrl      String?
  alt               String   @default("")
  sortOrder         Int      @default(0)
  isPrimary         Boolean  @default(false)
  width             Int?
  height            Int?
  contentType       String?
  contentHash       String?
  fileSize          Int?
  licenseStatus     String   @default("SOURCE_SUPPLIER")
  ingestionStatus   String   @default("PENDING")
  enhancementStatus String   @default("NOT_REQUESTED")
  errorMessage      String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  product   Product?          @relation(fields: [productId], references: [id], onDelete: Cascade)
  candidate ProductCandidate? @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([candidateId])
  @@index([contentHash])
}

model CatalogSyncRun {
  id          String    @id @default(cuid())
  storeId     String?
  providerKey String?
  status      String    @default("RUNNING")
  startedAt   DateTime  @default(now())
  finishedAt  DateTime?
  requestedBy String    @default("system")
  summaryJson String    @default("{}")
  errorMessage String?

  store Store? @relation(fields: [storeId], references: [id], onDelete: SetNull)

  @@index([storeId, startedAt])
}

model CatalogJob {
  id          String   @id @default(cuid())
  storeId     String
  providerKey String
  jobType     String
  status      String   @default("QUEUED")
  payloadJson String   @default("{}")
  attempts    Int      @default(0)
  maxAttempts Int      @default(3)
  lockedAt    DateTime?
  lockedBy    String?
  runAfter    DateTime @default(now())
  lastError   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@index([status, runAfter])
  @@index([storeId, jobType])
}

model Customer {
  id        String   @id @default(cuid())
  storeId   String
  email     String
  name      String?
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  store     Store      @relation(fields: [storeId], references: [id], onDelete: Cascade)
  orders    Order[]
  wishlists Wishlist[]

  @@unique([storeId, email])
}

model Order {
  id                  String   @id @default(cuid())
  storeId             String
  customerId          String?
  orderNumber         String   @unique
  status              String   @default("DRAFT")
  paymentStatus       String   @default("UNPAID")
  fulfillmentStatus   String   @default("NOT_STARTED")
  paymentProvider     String?
  stripePaymentIntentId String?
  paymentError        String?
  currency            String
  subtotal            Float
  shippingTotal       Float    @default(0)
  taxTotal            Float    @default(0)
  grandTotal          Float
  shippingAddressJson String   @default("{}")
  billingAddressJson  String   @default("{}")
  notes               String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  store          Store           @relation(fields: [storeId], references: [id], onDelete: Cascade)
  customer       Customer?       @relation(fields: [customerId], references: [id], onDelete: SetNull)
  items          OrderItem[]
  supplierOrders SupplierOrder[]
}

model OrderItem {
  id              String  @id @default(cuid())
  orderId         String
  productId       String
  quantity        Int
  titleSnapshot   String
  skuSnapshot     String
  unitPrice       Float
  unitCost        Float?
  providerKey     String?
  externalId      String?
  fulfillmentMode String  @default("MANUAL")
  supplierOrderId String?
  status          String  @default("PENDING")

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@index([orderId])
  @@index([productId])
}

model SupplierOrder {
  id              String   @id @default(cuid())
  orderId         String
  providerKey     String
  externalOrderId String?
  status          String   @default("PENDING")
  requestJson     String   @default("{}")
  responseJson    String   @default("{}")
  trackingJson    String   @default("[]")
  errorMessage    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@index([providerKey, status])
}

model Wishlist {
  id          String   @id @default(cuid())
  storeId     String
  anonymousId String?
  customerId  String?
  email       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  store    Store          @relation(fields: [storeId], references: [id], onDelete: Cascade)
  customer Customer?      @relation(fields: [customerId], references: [id], onDelete: SetNull)
  items    WishlistItem[]

  @@index([storeId, anonymousId])
  @@index([storeId, email])
}

model WishlistItem {
  id         String   @id @default(cuid())
  wishlistId String
  productId  String
  createdAt  DateTime @default(now())

  wishlist Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  product  Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([wishlistId, productId])
}

model ContentPage {
  id                String   @id @default(cuid())
  storeId           String
  slug              String
  // One of: GUIDE | COMPARISON | FAQ | LANDING | POLICY (enum in app code)
  type              String
  title             String
  excerpt           String
  body              String
  seoTitle          String
  seoDescription    String
  heroImageUrl      String?
  // JSON-encoded string[] of Product ids
  relatedProductIds String   @default("[]")
  isPublished       Boolean  @default(true)
  noindex           Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@unique([storeId, slug])
  @@index([storeId, type])
}

model Collection {
  id             String @id @default(cuid())
  storeId        String
  slug           String
  title          String
  description    String
  // JSON-encoded string[] of Product ids
  productIds     String @default("[]")
  seoTitle       String
  seoDescription String

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@unique([storeId, slug])
}

model CartEvent {
  id        String   @id @default(cuid())
  storeId   String
  sessionId String
  eventName String
  // JSON-encoded payload
  payload   String   @default("{}")
  createdAt DateTime @default(now())

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@index([storeId, eventName])
}

model NewsletterSubscriber {
  id          String   @id @default(cuid())
  storeId     String
  email       String
  source      String
  // JSON-encoded preferences object
  preferences String?
  createdAt   DateTime @default(now())

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@unique([storeId, email])
}

model Experiment {
  id       String  @id @default(cuid())
  storeId  String
  key      String
  name     String
  // JSON-encoded variant config
  variantA String  @default("{}")
  // JSON-encoded variant config
  variantB String  @default("{}")
  isActive Boolean @default(false)

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@unique([storeId, key])
}

model Supplier {
  id                  String  @id @default(cuid())
  name                String  @unique
  type                String
  apiBaseUrl          String?
  reliabilityScore    Float   @default(0.8)
  averageShippingDays Int     @default(10)
  notes               String?
}

```


---

## prisma/seed-data/bamboo-toothbrushes.ts

```ts
import {
  defaultPrivacyPolicy,
  defaultTermsOfSale,
  type SeedStore,
  type SeedStoreInfo,
} from "./types";

/** Bamboo toothbrush store: calm, sustainable, subscription-friendly brand. */

const info: SeedStoreInfo = {
  slug: "bamboo-toothbrushes",
  name: "Bamboo Smile",
  legalName: "Bamboo Smile Commerce ApS",
  primaryDomain: "bambussmil.example",
  locale: "en-US",
  currency: "USD",
  niche: "sustainable oral care",
  positioning:
    "Plastic-free oral care that holds up to daily use. We are honest about what bamboo can and cannot do — the bristles are still nylon on most models, and we say so — and we make switching easy with refills on a schedule you control.",
  audience: "households reducing everyday plastic waste",
  valueProposition: "A calmer, plastic-free morning routine",
  brandVoice: "calm, warm, honest, sustainability-minded",
  logoText: "bamboo smile",
  supportEmail: "hello@bambussmil.example",
  supportPhone: null,
  shippingOriginDisclosure:
    "Orders ship from our partner suppliers' facilities in Asia in plastic-free packaging. We do not hold local stock; we publish the real delivery window on every product and offer scheduled refills so you never run out.",
  defaultShippingDaysMin: 5,
  defaultShippingDaysMax: 12,
  returnPolicySummary:
    "Unopened products return free within 30 days; for hygiene reasons opened brushes cannot be returned, but we refund any defective item without requiring a return.",
};

export const bambooSeed: SeedStore = {
  store: info,
  theme: {
    primaryColor: "#15803d",
    secondaryColor: "#1a2e22",
    accentColor: "#d97706",
    backgroundColor: "#fafdf7",
    textColor: "#1c2a21",
    borderRadius: "1rem",
    fontHeading: "humanist",
    fontBody: "humanist",
  },
  domains: ["bambussmil.example", "www.bambussmil.example"],
  categories: [
    {
      slug: "adult-brushes",
      name: "Adult Brushes",
      description:
        "Moso bamboo handles with BPA-free bristles in soft and medium. We label bristle material honestly: most are nylon-6 (recyclable, not compostable); our castor-oil bioblend option is clearly marked.",
      seoTitle: "Bamboo Toothbrushes for Adults — Soft & Medium | Bamboo Smile",
      seoDescription:
        "Adult bamboo toothbrushes with honest material labeling: moso bamboo handles, BPA-free soft or medium bristles, plastic-free packaging.",
      heroTitle: "Adult brushes, honestly labeled",
      heroSubtitle:
        "Compostable handles, clearly labeled bristles — and the truth about which parts are recyclable versus compostable.",
      sortOrder: 1,
      products: [
        {
          slug: "classic-soft-4-pack",
          title: "Classic Bamboo Toothbrush 4-Pack, Soft",
          subtitle: "A season of brushing for one person — or a month for the family",
          description:
            "Our standard brush: a smooth moso bamboo handle that stays comfortable when wet, with soft BPA-free nylon-6 bristles dentists generally recommend for everyday brushing.\n\nDentists advise replacing your brush every three months, so a 4-pack covers one person for a year — or a family of four for a season. The honest detail most shops skip: bamboo handles are home-compostable, but nylon bristles must be pulled out (pliers work) and binned before composting.",
          shortDescription:
            "Four soft bamboo toothbrushes with BPA-free nylon bristles and compostable moso handles, in plastic-free packaging.",
          brand: "Bamboo Smile",
          sku: "BAM-CL4S",
          gtin: null,
          price: 12.95,
          compareAtPrice: null,
          cost: 3.4,
          shippingCost: 2.1,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1101",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Moso bamboo handle, nylon-6 bristles",
          warranty: null,
          returnable: true,
          pros: [
            "Soft bristles suit most gums, per general dental guidance",
            "Handle is home-compostable after bristle removal",
            "Plastic-free paper packaging",
            "A year of brushing for one person in one order",
          ],
          cons: [
            "Nylon bristles are not compostable — remove before composting the handle",
            "Bamboo handles need to dry upright to stay mold-free",
          ],
          specs: [
            { label: "Pack size", value: "4 brushes" },
            { label: "Bristles", value: "Soft, BPA-free nylon-6" },
            { label: "Handle", value: "Moso bamboo, water-resistant finish" },
            { label: "Packaging", value: "Recycled kraft paper, no plastic" },
            { label: "Replace every", value: "~3 months (dental guidance)" },
          ],
          useCases: ["adult", "soft", "multipack", "eco", "zero-waste"],
          faq: [
            {
              question: "Are the bristles compostable?",
              answer:
                "No — they are BPA-free nylon-6. Pull them out with pliers and bin them, then home-compost the bamboo handle. We label this honestly because 'fully compostable' claims about nylon-bristle brushes are simply false.",
            },
            {
              question: "How do I keep the handle from getting moldy?",
              answer:
                "Rinse and store it upright in a dry cup, not in a sealed container. Treated this way the handle stays clean for its full three-month life.",
            },
          ],
          seoTitle: "Bamboo Toothbrush 4-Pack (Soft) — Honest Compostability Info",
          seoDescription:
            "Four soft bamboo toothbrushes with BPA-free bristles. We explain what is compostable (handle) and what is not (bristles) — no greenwashing.",
        },
        {
          slug: "classic-medium-4-pack",
          title: "Classic Bamboo Toothbrush 4-Pack, Medium",
          subtitle: "For brushers who prefer firmer feedback",
          description:
            "The same moso bamboo handle and plastic-free packaging as our soft 4-pack, with medium BPA-free bristles for people who prefer a firmer brushing feel.\n\nAn honest note: most dental guidance favors soft bristles, because medium ones can be hard on gums with an aggressive technique. If your gums are sensitive or you press hard, choose soft.",
          shortDescription:
            "Four medium-bristle bamboo toothbrushes with compostable moso handles — for brushers who deliberately prefer firmer bristles.",
          brand: "Bamboo Smile",
          sku: "BAM-CL4M",
          gtin: null,
          price: 12.95,
          compareAtPrice: null,
          cost: 3.4,
          shippingCost: 2.1,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1102",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Moso bamboo handle, nylon-6 bristles",
          warranty: null,
          returnable: true,
          pros: [
            "Firmer feel some brushers strongly prefer",
            "Same compostable handle and plastic-free packaging as the soft pack",
            "Clearly labeled so households can mix soft and medium",
          ],
          cons: [
            "Dental guidance generally favors soft — medium can stress gums if you press hard",
            "Bristles are nylon, not compostable",
          ],
          specs: [
            { label: "Pack size", value: "4 brushes" },
            { label: "Bristles", value: "Medium, BPA-free nylon-6" },
            { label: "Handle", value: "Moso bamboo, water-resistant finish" },
            { label: "Packaging", value: "Recycled kraft paper, no plastic" },
          ],
          useCases: ["adult", "medium", "multipack", "eco"],
          faq: [
            {
              question: "Should I pick soft or medium?",
              answer:
                "If you are unsure, pick soft — that matches general dental guidance. Choose medium only if you know you prefer it and your gums are healthy.",
            },
          ],
          seoTitle: "Bamboo Toothbrush 4-Pack (Medium) — For Firm-Brush Fans",
          seoDescription:
            "Medium-bristle bamboo toothbrush 4-pack with an honest note: soft suits most people better. Compostable handles, plastic-free packaging.",
        },
        {
          slug: "bioblend-soft-2-pack",
          title: "BioBlend Bristle Brush 2-Pack, Extra Soft",
          subtitle: "Castor-oil based bristles — our most plastic-reduced brush",
          description:
            "Our most advanced brush: extra-soft bristles made from a castor-oil based bioblend (about 60% bio-based content) instead of standard nylon, on the same moso bamboo handle.\n\nFull honesty: bioblend bristles are bio-*based*, not home-compostable — they still need to be removed and binned, but they cut fossil plastic content substantially. They are also slightly softer-wearing, so replace at the first sign of splaying. Gentle enough for sensitive gums.",
          shortDescription:
            "Two extra-soft brushes with castor-oil bioblend bristles (≈60% bio-based) — our most plastic-reduced option, honestly labeled.",
          brand: "Bamboo Smile",
          sku: "BAM-BIO2",
          gtin: null,
          price: 9.95,
          compareAtPrice: null,
          cost: 2.9,
          shippingCost: 2.1,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1140",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Moso bamboo handle, castor-oil bioblend bristles",
          warranty: null,
          returnable: true,
          pros: [
            "≈60% bio-based bristle content — least fossil plastic in our range",
            "Extra-soft: kind to sensitive gums",
            "Same compostable handle and plastic-free packaging",
          ],
          cons: [
            "Bristles wear slightly faster than nylon — watch for splaying",
            "Still not compostable, despite what some brands claim about bioblends",
          ],
          specs: [
            { label: "Pack size", value: "2 brushes" },
            { label: "Bristles", value: "Extra-soft, castor-oil bioblend (~60% bio-based)" },
            { label: "Handle", value: "Moso bamboo" },
            { label: "Packaging", value: "Recycled kraft paper" },
          ],
          useCases: ["adult", "soft", "sensitive", "zero-waste", "compostable", "eco"],
          faq: [
            {
              question: "Are bioblend bristles compostable?",
              answer:
                "No. Bio-based means the raw material is partly plant-derived; it does not mean home-compostable. Remove and bin the bristles like nylon ones. We would rather be precise than impressive.",
            },
          ],
          seoTitle: "BioBlend Bamboo Toothbrush — Castor-Oil Bristles, Extra Soft",
          seoDescription:
            "Extra-soft castor-oil bioblend bristles (~60% bio-based) on a compostable bamboo handle. Honest about what bio-based does and does not mean.",
        },
        {
          slug: "charcoal-soft-4-pack",
          title: "Charcoal-Infused Bamboo Brush 4-Pack, Soft",
          subtitle: "Soft nylon bristles with activated charcoal — minus the hype",
          description:
            "Soft BPA-free bristles infused with activated charcoal on our standard moso handle. Marketing elsewhere credits charcoal bristles with whitening and antibacterial superpowers; the evidence is thin and we will not repeat those claims.\n\nWhat you actually get: a good soft brush with a matte black look many people prefer, the same honest compostability story as our classic range, and a price only slightly above it.",
          shortDescription:
            "Four soft charcoal-infused bamboo toothbrushes — chosen for looks and feel, sold without the pseudo-medical whitening claims.",
          brand: "Bamboo Smile",
          sku: "BAM-CH4S",
          gtin: null,
          price: 13.95,
          compareAtPrice: null,
          cost: 3.7,
          shippingCost: 2.1,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1118",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Moso bamboo handle, charcoal-infused nylon-6 bristles",
          warranty: null,
          returnable: true,
          pros: [
            "Distinct matte-black bristles people genuinely like",
            "Same soft, BPA-free brushing feel as our classic range",
            "No pseudo-medical claims — just a good brush",
          ],
          cons: [
            "Charcoal whitening claims industry-wide are not well supported; do not buy it for that",
            "Bristles are nylon, not compostable",
          ],
          specs: [
            { label: "Pack size", value: "4 brushes" },
            { label: "Bristles", value: "Soft, charcoal-infused nylon-6" },
            { label: "Handle", value: "Moso bamboo" },
            { label: "Packaging", value: "Recycled kraft paper" },
          ],
          useCases: ["adult", "soft", "multipack", "eco"],
          faq: [
            {
              question: "Does charcoal whiten teeth?",
              answer:
                "The evidence for charcoal-bristle whitening is weak, and we do not claim it. If whitening matters to you, talk to your dentist about options that actually work.",
            },
          ],
          seoTitle: "Charcoal Bamboo Toothbrush 4-Pack — Honest, Hype-Free",
          seoDescription:
            "Soft charcoal-infused bamboo toothbrushes sold without fake whitening claims. Good brush, good looks, honest labeling.",
        },
      ],
    },
    {
      slug: "kids-brushes",
      name: "Kids Brushes",
      description:
        "Smaller heads, extra-soft bristles and grippy handles sized for small hands — because the easiest way to make a family plastic-free is gear the kids actually want to use.",
      seoTitle: "Kids Bamboo Toothbrushes — Extra Soft | Bamboo Smile",
      seoDescription:
        "Bamboo toothbrushes for kids: small heads, extra-soft BPA-free bristles, fun colors from food-safe dye. Plastic-free family bathroom, made easy.",
      heroTitle: "Little brushes for little hands",
      heroSubtitle:
        "Extra-soft bristles, small heads and food-safe colored handles that make kids want to brush.",
      sortOrder: 2,
      products: [
        {
          slug: "kids-rainbow-4-pack",
          title: "Kids Bamboo Brush 4-Pack, Rainbow",
          subtitle: "Four colors so everyone knows whose brush is whose",
          description:
            "Four kids brushes with extra-soft BPA-free bristles, small brush heads for mouths aged roughly 3-10, and handles dipped in four different food-safe colors — which settles the daily whose-brush-is-this debate instantly.\n\nThe handles are slightly shorter and thicker than adult brushes, matching how kids actually grip. Same honest materials story as our adult range: compostable handle, binnable bristles.",
          shortDescription:
            "Four kids bamboo toothbrushes in different food-safe colors: extra-soft bristles, small heads, grippy handles for ages ~3-10.",
          brand: "Bamboo Smile",
          sku: "BAM-KID4",
          gtin: null,
          price: 11.95,
          compareAtPrice: null,
          cost: 3.1,
          shippingCost: 2.1,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1210",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Moso bamboo handle, food-safe dye, nylon-6 bristles",
          warranty: null,
          returnable: true,
          pros: [
            "Four colors end brush mix-ups in shared bathrooms",
            "Extra-soft bristles and small heads sized for kids",
            "Shorter, thicker grip matches small hands",
          ],
          cons: [
            "Kids brushes need replacing more often — chewed bristles splay fast",
            "Supervise brushing under age 6, as with any brush",
          ],
          specs: [
            { label: "Pack size", value: "4 brushes, 4 colors" },
            { label: "Age range", value: "~3-10 years" },
            { label: "Bristles", value: "Extra-soft, BPA-free nylon-6" },
            { label: "Handle", value: "Moso bamboo, food-safe dye" },
          ],
          useCases: ["kids", "family", "soft", "multipack", "eco"],
          faq: [
            {
              question: "From what age can kids use these?",
              answer:
                "From about age 3, with an adult supervising and finishing the brushing until around age 6 — standard dental guidance regardless of brush material.",
            },
          ],
          seoTitle: "Kids Bamboo Toothbrush 4-Pack — Extra Soft, 4 Colors",
          seoDescription:
            "Four colorful kids bamboo toothbrushes: extra-soft bristles, small heads, food-safe dyes. The easy way to a plastic-free family bathroom.",
        },
        {
          slug: "kids-first-brush-2-pack",
          title: "First Brush 2-Pack, Ages 1-3",
          subtitle: "Ultra-soft bristles and a chunky safety grip for toddlers",
          description:
            "A toddler's first toothbrush: ultra-soft bristles on a very small head, and a chunky rounded handle that small fists can hold but cannot push too deep — the safety ring stops the head short.\n\nTwo per pack because toddler brushes get chewed: when bristles splay, replace. Brushing at this age is about habit and gentleness, not scrubbing.",
          shortDescription:
            "Two toddler bamboo brushes (ages 1-3) with ultra-soft bristles, tiny heads and a chunky safety-ring grip.",
          brand: "Bamboo Smile",
          sku: "BAM-TOD2",
          gtin: null,
          price: 8.95,
          compareAtPrice: null,
          cost: 2.6,
          shippingCost: 2.1,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1222",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Moso bamboo handle, nylon-6 bristles",
          warranty: null,
          returnable: true,
          pros: [
            "Safety ring prevents the head going too deep",
            "Ultra-soft bristles for first teeth and gums",
            "Chunky grip designed for toddler fists",
          ],
          cons: [
            "Gets chewed — expect to replace more often than every 3 months",
            "Always supervise toddler brushing",
          ],
          specs: [
            { label: "Pack size", value: "2 brushes" },
            { label: "Age range", value: "1-3 years" },
            { label: "Bristles", value: "Ultra-soft, BPA-free nylon-6" },
            { label: "Safety", value: "Depth-stop ring on handle" },
          ],
          useCases: ["kids", "family", "soft", "sensitive", "eco"],
          faq: [
            {
              question: "When should my child get their first toothbrush?",
              answer:
                "Dental guidance says to start brushing when the first tooth appears. This brush is designed for exactly that stage — with an adult doing the brushing.",
            },
          ],
          seoTitle: "Toddler Bamboo Toothbrush 2-Pack (Ages 1-3) — Ultra Soft",
          seoDescription:
            "First bamboo toothbrush for ages 1-3: ultra-soft bristles, tiny head, safety-ring grip. Honest guidance on toddler brushing included.",
        },
        {
          slug: "kids-timer-hourglass",
          title: "Two-Minute Brushing Hourglass",
          subtitle: "A bathroom-proof sand timer that makes two minutes visible",
          description:
            "The single cheapest upgrade to a kid's brushing routine: a two-minute hourglass with a suction cup that sticks to tile or mirror at kid height. Flip it, brush until the green sand runs out.\n\nNo batteries, no app, no plastic toy that breaks in a month — a glass timer in a bamboo frame that turns the abstract 'two minutes' into something a four-year-old can see and own.",
          shortDescription:
            "Two-minute hourglass in a bamboo frame with suction mount — makes the dentist-recommended brushing time visible for kids.",
          brand: "Bamboo Smile",
          sku: "BAM-TIMER",
          gtin: null,
          price: 9.5,
          compareAtPrice: null,
          cost: 2.8,
          shippingCost: 2.4,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1240",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Bamboo frame, glass vial, silicone suction cup",
          warranty: null,
          returnable: true,
          pros: [
            "Makes the two-minute target concrete for kids",
            "No batteries or apps — flip and brush",
            "Suction cup mounts at kid height",
          ],
          cons: [
            "Glass vial — mount it out of grabbing range for the youngest",
            "Sand timing is approximate (±10 seconds)",
          ],
          specs: [
            { label: "Duration", value: "2 minutes (±10 s)" },
            { label: "Frame", value: "Bamboo" },
            { label: "Mount", value: "Silicone suction cup" },
          ],
          useCases: ["kids", "family", "eco"],
          faq: [
            {
              question: "Why two minutes?",
              answer:
                "Two minutes twice a day is the standard dental recommendation. Most people — adults included — brush for far less when they do not time it.",
            },
          ],
          seoTitle: "Kids Brushing Timer — 2-Minute Bamboo Hourglass",
          seoDescription:
            "A two-minute bamboo-framed hourglass with suction mount that makes proper brushing time visible for kids. No batteries, no apps.",
        },
        {
          slug: "kids-travel-case",
          title: "Kids Brush Travel Case",
          subtitle: "Ventilated bamboo case sized for kids brushes",
          description:
            "A ventilated travel case in solid bamboo, sized for our kids brushes. The ventilation slots matter: a wet brush sealed in an airtight box grows things you do not want near a mouth, so this case is deliberately not airtight.\n\nFits school trips, sleepovers and family travel; the lid twists shut so it stays closed in a backpack.",
          shortDescription:
            "Ventilated bamboo travel case for kids toothbrushes — deliberately not airtight, so brushes dry instead of growing mold.",
          brand: "Bamboo Smile",
          sku: "BAM-KCASE",
          gtin: null,
          price: 7.95,
          compareAtPrice: null,
          cost: 2.2,
          shippingCost: 2.1,
          stockStatus: "LOW_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1255",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Solid bamboo",
          warranty: null,
          returnable: true,
          pros: [
            "Ventilated so brushes dry properly",
            "Twist-lock lid survives backpacks",
            "Solid bamboo, no plastic liner",
          ],
          cons: [
            "Sized for kids brushes — adult brushes do not fit",
            "Not watertight (by design)",
          ],
          specs: [
            { label: "Fits", value: "Kids brushes up to 16 cm" },
            { label: "Material", value: "Solid bamboo" },
            { label: "Closure", value: "Twist-lock, ventilated" },
          ],
          useCases: ["kids", "travel", "eco"],
          faq: [
            {
              question: "Why is the case not airtight?",
              answer:
                "Because wet brushes need airflow to dry. Sealed cases trap moisture and breed bacteria and mold — ventilation is a hygiene feature, not a flaw.",
            },
          ],
          seoTitle: "Kids Toothbrush Travel Case — Ventilated Bamboo",
          seoDescription:
            "Ventilated bamboo travel case for kids brushes. We explain why ventilation beats airtight for toothbrush hygiene.",
        },
      ],
    },
    {
      slug: "oral-care-extras",
      name: "Oral Care Extras",
      description:
        "The rest of a plastic-free routine: compostable floss, brush stands, and refill bundles sized so a whole household switches in one order.",
      seoTitle: "Plastic-Free Oral Care Extras: Floss & Stands | Bamboo Smile",
      seoDescription:
        "Complete the plastic-free routine: corn-fiber floss in refillable glass, bamboo brush stands and family refill bundles with honest material info.",
      heroTitle: "Everything but the toothpaste",
      heroSubtitle:
        "Floss, stands and family refill bundles — the practical extras that make a plastic-free routine stick.",
      sortOrder: 3,
      products: [
        {
          slug: "corn-fiber-floss-glass",
          title: "Corn-Fiber Floss in Refillable Glass Dispenser",
          subtitle: "30 m of PLA floss with candelilla wax, plus a glass dispenser for life",
          description:
            "Floss is one of the worst plastic offenders in the bathroom — single-use nylon in a single-use plastic box. This kit replaces it with corn-fiber (PLA) floss coated in candelilla wax and mint oil, in a glass dispenser with a stainless cutter you refill forever.\n\nHonest materials note: PLA floss is industrially compostable, not home-compostable. It is still a meaningful upgrade over nylon-in-plastic, and refills come in paper.",
          shortDescription:
            "Corn-fiber (PLA) floss with candelilla wax in a refillable glass dispenser. Industrially compostable — labeled honestly.",
          brand: "Bamboo Smile",
          sku: "BAM-FLOSS",
          gtin: null,
          price: 11.5,
          compareAtPrice: null,
          cost: 3.2,
          shippingCost: 2.3,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1310",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "PLA (corn fiber) floss, candelilla wax, glass dispenser",
          warranty: null,
          returnable: true,
          pros: [
            "Glass dispenser is a one-time purchase — refills only after this",
            "Vegan wax coating (candelilla, not beeswax)",
            "Paper-packaged refills",
          ],
          cons: [
            "PLA needs industrial composting — home compost is too cool",
            "Slightly less shred-resistant than nylon floss on tight contacts",
          ],
          specs: [
            { label: "Length", value: "30 m per spool" },
            { label: "Material", value: "PLA corn fiber, candelilla wax, mint oil" },
            { label: "Dispenser", value: "Glass with stainless steel cutter" },
          ],
          useCases: ["adult", "zero-waste", "compostable", "subscription", "eco"],
          faq: [
            {
              question: "Is the floss home-compostable?",
              answer:
                "No — PLA breaks down in industrial composting facilities, not garden compost. We label it accurately; it is still far better than nylon floss in a plastic box.",
            },
          ],
          seoTitle: "Corn-Fiber Floss + Refillable Glass Dispenser — Plastic-Free",
          seoDescription:
            "PLA corn-fiber floss with vegan wax in a refill-forever glass dispenser. Honest note: industrially compostable, not home-compostable.",
        },
        {
          slug: "bamboo-brush-stand-duo",
          title: "Bamboo Brush Stand, 2 Slots",
          subtitle: "Keeps brushes upright, separated and drying — the way they should be stored",
          description:
            "Bamboo handles last their full three months only when they dry upright between uses. This small two-slot stand holds brushes vertically with air around the heads and a drainage groove so water never pools at the base.\n\nSolid bamboo with a water-resistant finish; wipe it weekly and it outlasts years of brushes.",
          shortDescription:
            "Two-slot solid bamboo stand that stores brushes upright and separated with proper airflow and base drainage.",
          brand: "Bamboo Smile",
          sku: "BAM-STAND2",
          gtin: null,
          price: 8.5,
          compareAtPrice: null,
          cost: 2.3,
          shippingCost: 2.3,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1322",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Solid bamboo, water-resistant plant-oil finish",
          warranty: null,
          returnable: true,
          pros: [
            "Upright, separated storage extends brush (and handle) life",
            "Drainage groove keeps the base dry",
            "Outlasts years of brushes",
          ],
          cons: ["Two slots only — larger households need two stands or the family bundle"],
          specs: [
            { label: "Slots", value: "2" },
            { label: "Material", value: "Solid bamboo, oil finish" },
            { label: "Care", value: "Wipe dry weekly" },
          ],
          useCases: ["adult", "family", "eco"],
          faq: [
            {
              question: "Why does brush storage matter?",
              answer:
                "Wet brushes stored flat or sealed stay damp, which shortens bamboo-handle life and is unhygienic for any brush. Upright with airflow is the simple fix.",
            },
          ],
          seoTitle: "Bamboo Toothbrush Stand (2-Slot) — Proper Brush Storage",
          seoDescription:
            "Two-slot bamboo stand that keeps toothbrushes upright, separated and dry — the storage habit that makes bamboo handles last.",
        },
        {
          slug: "family-refill-bundle",
          title: "Family Refill Bundle (8 Brushes + Floss)",
          subtitle: "A quarter of oral care for a family of four, one plastic-free box",
          description:
            "Our best-value bundle: four soft adult brushes, four kids rainbow brushes and a corn-fiber floss refill, in one paper-packed box. It is sized to be exactly one quarter of a family-of-four's brushing — which is why it pairs perfectly with a 3-month reorder rhythm.\n\nSubscription-friendly by design: order once to try it, then set a calendar reminder (or wait for our optional email nudge) every three months. We do not auto-charge; the reminder is the service.",
          shortDescription:
            "Quarterly family bundle: 4 soft adult brushes, 4 kids brushes and a floss refill in one plastic-free box.",
          brand: "Bamboo Smile",
          sku: "BAM-FAM8",
          gtin: null,
          price: 24.95,
          compareAtPrice: 26.4,
          cost: 7.1,
          shippingCost: 3.2,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1350",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Moso bamboo, nylon-6 bristles, PLA floss",
          warranty: null,
          returnable: true,
          pros: [
            "Covers a family of four for a full quarter",
            "Cheaper than buying the parts separately (real math: $26.40)",
            "One reorder rhythm instead of three",
          ],
          cons: [
            "Fixed composition — households without kids should buy packs separately",
          ],
          specs: [
            { label: "Contents", value: "4 adult soft + 4 kids brushes + 30 m floss refill" },
            { label: "Covers", value: "Family of 4 for ~3 months" },
            { label: "Packaging", value: "Single kraft box, no plastic" },
          ],
          useCases: ["family", "kids", "adult", "multipack", "subscription", "zero-waste", "eco"],
          faq: [
            {
              question: "Is this a subscription?",
              answer:
                "No auto-charging. You can opt into a quarterly email reminder and reorder in one click — you stay in control of every payment.",
            },
          ],
          seoTitle: "Family Oral Care Refill Bundle — 8 Brushes + Floss, Quarterly",
          seoDescription:
            "One plastic-free box covering a family of four for a quarter: 4 adult + 4 kids bamboo brushes plus floss. Honest bundle math shown.",
        },
        {
          slug: "travel-case-adult",
          title: "Adult Brush Travel Case",
          subtitle: "Ventilated solid-bamboo case for standard brushes",
          description:
            "The adult version of our ventilated travel case: solid bamboo, twist-lock lid, and airflow slots that let the brush dry instead of fermenting in your wash bag.\n\nFits any standard-length adult brush including every model we sell. Like all our cases it is deliberately not airtight — that is hygiene, not cost-cutting.",
          shortDescription:
            "Ventilated solid-bamboo travel case for adult toothbrushes with a twist-lock lid — designed to let brushes dry.",
          brand: "Bamboo Smile",
          sku: "BAM-ACASE",
          gtin: null,
          price: 8.95,
          compareAtPrice: null,
          cost: 2.5,
          shippingCost: 2.1,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1360",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Solid bamboo",
          warranty: null,
          returnable: true,
          pros: [
            "Ventilation keeps traveling brushes hygienic",
            "Fits all standard adult brushes",
            "Twist-lock lid stays shut in luggage",
          ],
          cons: ["Not watertight (by design)"],
          specs: [
            { label: "Fits", value: "Brushes up to 19.5 cm" },
            { label: "Material", value: "Solid bamboo" },
            { label: "Closure", value: "Twist-lock, ventilated" },
          ],
          useCases: ["adult", "travel", "eco"],
          faq: [
            {
              question: "Will it fit non-bamboo brushes?",
              answer: "Yes — any standard manual brush up to 19.5 cm fits.",
            },
          ],
          seoTitle: "Bamboo Toothbrush Travel Case (Adult) — Ventilated",
          seoDescription:
            "Solid bamboo travel case for adult toothbrushes with hygiene-first ventilation and a twist-lock lid.",
        },
      ],
    },
  ],
  guides: [
    {
      slug: "switching-to-bamboo-honestly",
      title: "Switching to Bamboo Toothbrushes: An Honest Guide",
      excerpt:
        "Bamboo brushes eliminate the plastic handle — about 80% of a toothbrush's plastic by weight — but the bristles on almost every bamboo brush are still nylon. Switching is worth it; expecting a 100% compostable brush is not. Here is exactly what changes, what does not, and how to dispose of each part.",
      body: `## The short answer

Switching to bamboo replaces the plastic handle (the bulk of the brush) with a home-compostable material, while the bristles remain nylon or bio-based plastic on essentially every brush on the market. That is a real improvement sold honestly — and a fake one when brands claim "100% compostable".

## What actually changes

- A typical plastic toothbrush is roughly 80% handle by weight. Four billion brushes are discarded globally each year; handles are the bulk of that plastic.
- Bamboo (moso) grows fast without replanting or pesticides and the handle composts at home in months once the bristles are removed.
- Our packaging is paper, so the switch removes the blister pack too.

## What does not change

- **Bristles.** Nylon-6 on standard brushes, castor-oil bioblend (~60% bio-based) on our BioBlend model. Neither is home-compostable. Anyone claiming otherwise is greenwashing.
- **Brushing quality.** A soft bamboo brush cleans exactly as well as a soft plastic brush. Technique and the two-minute rule matter far more than handle material.
- **Replacement rhythm.** Every three months, same as always.

## How to dispose of a used brush

- Pull the bristles out with pliers (ten seconds) and bin them.
- Compost the handle at home, or repurpose it — plant markers are the classic.
- Metal staples holding bristles (tiny) can go to metal recycling with the bristle clump if you separate them.

## Making the switch stick

- Switch the whole household at once — mixed cups of plastic and bamboo brushes tend to drift back to plastic.
- Store brushes upright with airflow (see our stand); damp storage is the one way bamboo handles fail early.
- Put refills on a quarterly rhythm. Our family bundle exists precisely for that.

## Is it worth it?

Yes — honestly framed: you remove the large plastic component of an item you discard four times a year, for a small price difference. You do not achieve a zero-waste bathroom in one purchase, and no toothbrush brand can honestly promise that.`,
      seoTitle: "Switching to Bamboo Toothbrushes — What Changes & What Doesn't",
      seoDescription:
        "An honest guide: bamboo handles compost, nylon bristles do not. What actually improves, how to dispose of each part, and how to make the switch stick.",
      relatedProductSlugs: ["classic-soft-4-pack", "bioblend-soft-2-pack", "bamboo-brush-stand-duo"],
    },
    {
      slug: "soft-vs-medium-bristles",
      title: "Soft vs Medium Bristles: Which Should You Choose?",
      excerpt:
        "Choose soft unless you have a specific reason not to. Dental guidance broadly favors soft bristles because they clean effectively with less risk of gum recession and enamel wear — pressure and technique do the cleaning, not bristle stiffness.",
      body: `## The short answer

**Pick soft.** General dental guidance favors soft bristles for almost everyone, because effective cleaning comes from technique and time, not stiffness — while stiff bristles plus a heavy hand contribute to gum recession and enamel wear. Choose medium only if your gums are healthy and you genuinely prefer the feel with a light technique.

## Why soft wins for most people

- Plaque is soft; it does not need scrubbing force to remove. Two minutes of gentle circles with soft bristles out-cleans thirty seconds of hard sawing with medium ones.
- The most common brushing error is too much pressure. Soft bristles are forgiving of it; medium bristles turn the same habit into gum damage over years.
- Sensitive gums, receding gums, or post-dental-work mouths should always use soft or extra-soft — see our BioBlend extra-soft.

## When medium is legitimate

Some brushers with healthy gums and a deliberately light grip simply prefer firmer tactile feedback and brush longer because of it. If that is you — knowingly — our medium 4-pack exists without judgment. If you are guessing, you are a soft-bristle person.

## Kids are always soft

Children's enamel and gums are developing; every kids brush we sell is extra-soft. There is no medium kids brush here on purpose.

## The two-minute rule beats everything

Whatever bristle you choose, two minutes twice daily with light pressure is the whole game. Our hourglass timer makes that concrete for kids (and, quietly, for adults).

## Quick chooser

- Sensitive or receding gums: **extra-soft** (BioBlend)
- Everyone else, default: **soft** (Classic soft 4-pack)
- Healthy gums + light hand + strong preference: **medium** (Classic medium 4-pack)
- Kids: **extra-soft**, always`,
      seoTitle: "Soft vs Medium Toothbrush Bristles — A Direct Answer",
      seoDescription:
        "Why dental guidance favors soft bristles for nearly everyone, the one case where medium is fine, and why kids brushes are always extra-soft.",
      relatedProductSlugs: ["classic-soft-4-pack", "classic-medium-4-pack", "bioblend-soft-2-pack"],
    },
    {
      slug: "plastic-free-bathroom-routine",
      title: "Building a Plastic-Free Bathroom Routine, One Swap at a Time",
      excerpt:
        "The effective way to de-plastic a bathroom is one finished swap at a time, starting with the items you discard most often: toothbrush first, floss second, then storage. Trying to replace everything in one order is how drawers fill with abandoned eco-gadgets.",
      body: `## The short answer

Swap in order of discard frequency: **toothbrush → floss → storage**. Each swap should be fully working (including the reorder rhythm) before you start the next. This beats the all-at-once approach, which mostly produces a drawer of abandoned eco-products and a return to old habits.

## Swap 1: The toothbrush (month 1)

Highest discard frequency in the bathroom — four per person per year. Switch the entire household at once so the bathroom cup does not become a mixed reminder of the old default. A 4-pack per adult and the rainbow pack for kids covers a quarter.

Set the reorder rhythm immediately: a calendar note every three months, or our optional email reminder. The swap that survives is the one with a working refill loop.

## Swap 2: Floss (month 2)

Floss is single-use plastic in a single-use plastic case — and the glass-dispenser model fixes the case part permanently. One dispenser, then paper-packed refills forever. Honest note from the product page applies here too: PLA floss is industrially compostable, not garden-compostable.

## Swap 3: Storage and travel (month 3)

Two small purchases that protect the first two swaps: an upright stand (bamboo handles last their full life only when they dry properly) and ventilated travel cases so trips do not push you back to hotel plastic.

## What we deliberately do not tell you to do

- Throw away working plastic items. Use them up; replacing functional items early is waste, not sustainability.
- Buy a "zero-waste starter kit" of fifteen items. Three finished swaps beat fifteen started ones.

## The math, honestly

A family of four discards roughly 16 brushes and a dozen floss cases a year. After the three swaps above, the same routine sends bamboo handles to compost and a small clump of bristles to the bin. Not zero — meaningfully less, sustained.`,
      seoTitle: "Plastic-Free Bathroom Routine: The 3-Swap Method That Sticks",
      seoDescription:
        "De-plastic the bathroom one finished swap at a time: toothbrush, floss, then storage. Honest math and the reorder rhythms that make swaps stick.",
      relatedProductSlugs: ["family-refill-bundle", "corn-fiber-floss-glass", "bamboo-brush-stand-duo"],
    },
  ],
  comparison: {
    slug: "brush-comparison",
    title: "Bamboo Smile Brushes Compared: Classic vs Charcoal vs BioBlend",
    excerpt:
      "Classic soft for most people, BioBlend extra-soft for sensitive gums and the lowest fossil-plastic content, charcoal if you like the look — bought for honest reasons.",
    body: "Our three adult brush lines differ in exactly two ways: bristle material and feel. The handles, packaging and compostability story are identical across all three — moso bamboo, kraft paper, remove-bristles-then-compost.\n\nClassic soft is the default recommendation. BioBlend swaps nylon for a castor-oil bioblend (about 60% bio-based) and is the gentlest brush we sell. Charcoal is the classic soft brush with charcoal-infused bristles — buy it because you like matte black, not for whitening claims we refuse to make.",
    seoTitle: "Bamboo Toothbrush Comparison: Classic vs Charcoal vs BioBlend",
    seoDescription:
      "Side-by-side comparison of our adult bamboo brushes: bristle material, softness, bio-based content and price — labeled honestly.",
    productSlugs: ["classic-soft-4-pack", "charcoal-soft-4-pack", "bioblend-soft-2-pack"],
  },
  homepageFaq: [
    {
      question: "Are bamboo toothbrushes really compostable?",
      answer:
        "The handle is home-compostable; the bristles are nylon or bioblend plastic and must be removed and binned first. We label every product accurately — 'fully compostable' brushes with plastic bristles do not exist, no matter what other shops claim.",
    },
    {
      question: "Where do orders ship from?",
      answer:
        "From our partner suppliers' facilities in Asia, in plastic-free packaging, typically arriving in 5-12 business days with tracking. We do not hold local stock and we say so.",
    },
    {
      question: "Do you have a subscription?",
      answer:
        "We do reminders, not auto-charges: opt into a quarterly email nudge and reorder in one click. You stay in control of every payment.",
    },
    {
      question: "Can I return an opened brush?",
      answer:
        "For hygiene reasons, no — but defective items are refunded without needing a return. Unopened products return free within 30 days.",
    },
    {
      question: "Do charcoal bristles whiten teeth?",
      answer:
        "The evidence is weak and we do not claim it. Our charcoal brush is sold for its look and feel — for whitening, talk to your dentist about options that actually work.",
    },
  ],
};

export const bambooPolicies = {
  privacyPolicy: defaultPrivacyPolicy(info),
  termsOfSale: defaultTermsOfSale(info),
};

```


---

## prisma/seed-data/drones.ts

```ts
import {
  defaultPrivacyPolicy,
  defaultTermsOfSale,
  type SeedStore,
  type SeedStoreInfo,
} from "./types";

/** Drone store: technical, performance-oriented brand. */

const info: SeedStoreInfo = {
  slug: "drones",
  name: "Skyforge Drones",
  legalName: "Skyforge Commerce ApS",
  primaryDomain: "dronestore.example",
  locale: "en-US",
  currency: "USD",
  niche: "consumer drones",
  positioning:
    "We test flight time, range and camera stabilization claims against real specs, then stock only the drones whose numbers hold up. Every listing shows honest delivery windows and the trade-offs other shops hide.",
  audience: "hobby pilots and aerial photo enthusiasts",
  valueProposition: "Drones specced for real flying, not marketing sheets",
  brandVoice: "technical, direct, performance-oriented",
  logoText: "SKYFORGE",
  supportEmail: "support@dronestore.example",
  supportPhone: "+1 (555) 010-7700",
  shippingOriginDisclosure:
    "Orders ship directly from our partner suppliers' warehouses in Asia and the EU. We do not hold local stock — that is how we keep prices down — and we publish the real delivery window on every product page.",
  defaultShippingDaysMin: 6,
  defaultShippingDaysMax: 14,
  returnPolicySummary:
    "30-day returns on unflown drones in original packaging; defective units are replaced or refunded at our cost.",
};

export const dronesSeed: SeedStore = {
  store: info,
  theme: {
    primaryColor: "#0284c7",
    secondaryColor: "#0c1c2e",
    accentColor: "#f59e0b",
    backgroundColor: "#f6f9fc",
    textColor: "#0f172a",
    borderRadius: "0.5rem",
    fontHeading: "geometric",
    fontBody: "system-ui",
  },
  domains: ["dronestore.example", "www.dronestore.example"],
  categories: [
    {
      slug: "camera-drones",
      name: "Camera Drones",
      description:
        "GPS camera drones compared on the numbers that matter: stabilized resolution, real-world flight time, transmission range and takeoff weight. We list the certification-relevant weight class for every model.",
      seoTitle: "Camera Drones with Honest Specs | Skyforge Drones",
      seoDescription:
        "Compare 4K and 1080p camera drones on real flight time, range and gimbal stabilization. Transparent supplier shipping and 30-day returns.",
      heroTitle: "Camera drones, specced honestly",
      heroSubtitle:
        "Stabilization, flight time and range as measured — with the under-250 g models clearly marked for easier regulation compliance.",
      sortOrder: 1,
      products: [
        {
          slug: "aero-s1-mini-4k",
          title: "Aero S1 Mini 4K Foldable Drone",
          subtitle: "Sub-250 g with 3-axis stabilized 4K and GPS return-to-home",
          description:
            "The Aero S1 Mini is the drone we recommend most often: under 249 g takeoff weight (no registration in many regions — check your local rules), a genuinely stabilized 4K/30 camera on a 3-axis gimbal, and 28 minutes of measured hover time per battery.\n\nGPS hold and automatic return-to-home make it forgiving for first-time pilots, while manual exposure and RAW stills keep it interesting once you outgrow auto mode. The folded footprint fits a jacket pocket.",
          shortDescription:
            "Sub-250 g foldable drone with 3-axis stabilized 4K/30 camera, GPS return-to-home and 28 minutes of real flight time per battery.",
          brand: "Aero",
          sku: "DRN-S1MINI",
          gtin: null,
          price: 289,
          compareAtPrice: null,
          cost: 96,
          shippingCost: 9.5,
          stockStatus: "IN_STOCK",
          supplierName: "SkyTech Wholesale",
          supplierProductId: "ST-4410",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "ABS/PC composite airframe",
          warranty: "12-month manufacturer warranty",
          returnable: true,
          pros: [
            "Under 249 g — lighter regulation burden in many regions",
            "True 3-axis gimbal, not electronic-only stabilization",
            "28 min measured hover time, 6 km video transmission",
            "RAW photo support for editing flexibility",
          ],
          cons: [
            "No obstacle avoidance sensors at this price",
            "Struggles in winds above ~10 m/s due to low weight",
            "Spare batteries are a near-mandatory extra purchase",
          ],
          specs: [
            { label: "Takeoff weight", value: "249 g" },
            { label: "Camera", value: "4K/30fps, 1/2.3\" sensor, 3-axis gimbal" },
            { label: "Flight time", value: "28 min per battery (measured hover)" },
            { label: "Transmission range", value: "6 km (FCC), line of sight" },
            { label: "Max wind resistance", value: "Level 4 (~8 m/s)" },
            { label: "Folded size", value: "140 × 82 × 57 mm" },
          ],
          useCases: ["beginner", "camera", "4k", "outdoor", "gps", "compact", "easy-fly"],
          faq: [
            {
              question: "Do I need to register this drone?",
              answer:
                "At 249 g it falls under the lighter registration regimes in many countries, but rules differ and change — always check your national aviation authority before flying.",
            },
            {
              question: "How many batteries do I need?",
              answer:
                "One battery gives about 28 minutes. Most pilots are happiest with three; see the Aero Flight Battery 2-Pack in accessories.",
            },
          ],
          seoTitle: "Aero S1 Mini 4K Drone (Sub-250 g) — Real Specs & Price",
          seoDescription:
            "Aero S1 Mini: 249 g foldable drone with 3-axis 4K gimbal, 28 min flight time and 6 km range. Honest pros, cons and delivery times.",
        },
        {
          slug: "aero-x8-pro",
          title: "Aero X8 Pro Camera Drone",
          subtitle: "1-inch sensor, 45-minute flight time, omnidirectional sensing",
          description:
            "The X8 Pro is for pilots who have outgrown entry-level drones. Its 1-inch 20 MP sensor shoots 5.4K/30 and genuinely usable low-light footage, and the 45-minute flight time means you stop planning flights around battery anxiety.\n\nOmnidirectional obstacle sensing and a 15 km transmission link make longer, more ambitious flights practical. It is heavier than 250 g, so expect registration and stricter rules in most regions.",
          shortDescription:
            "Prosumer camera drone with 1-inch 20 MP sensor, 5.4K video, 45 min flight time and omnidirectional obstacle sensing.",
          brand: "Aero",
          sku: "DRN-X8PRO",
          gtin: null,
          price: 1049,
          compareAtPrice: null,
          cost: 540,
          shippingCost: 18,
          stockStatus: "IN_STOCK",
          supplierName: "SkyTech Wholesale",
          supplierProductId: "ST-4480",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "China",
          materials: "Magnesium-aluminium alloy frame",
          warranty: "12-month manufacturer warranty",
          returnable: true,
          pros: [
            "1-inch sensor with noticeably better dynamic range and low light",
            "45-minute real-world flight time",
            "Omnidirectional obstacle sensing for safer automated flight",
            "15 km O3-class transmission link",
          ],
          cons: [
            "895 g — registration and stricter rules apply in most regions",
            "Significant investment; overkill for casual weekend flying",
            "ND filter set needed for cinematic shutter speeds, sold separately",
          ],
          specs: [
            { label: "Takeoff weight", value: "895 g" },
            { label: "Camera", value: "5.4K/30, 1\" CMOS 20 MP, 3-axis gimbal" },
            { label: "Flight time", value: "45 min per battery" },
            { label: "Transmission range", value: "15 km (FCC)" },
            { label: "Obstacle sensing", value: "Omnidirectional" },
            { label: "Internal storage", value: "8 GB + microSD" },
          ],
          useCases: ["pro", "performance", "camera", "4k", "outdoor", "gps"],
          faq: [
            {
              question: "Is the X8 Pro worth it over the S1 Mini?",
              answer:
                "If you sell footage, fly in low light or need obstacle sensing for complex shots — yes. For travel memories and hobby flying, the S1 Mini covers 90% of use cases at a quarter of the price.",
            },
          ],
          seoTitle: "Aero X8 Pro — 1-Inch Sensor Drone with 45 Min Flight Time",
          seoDescription:
            "Aero X8 Pro prosumer drone: 5.4K video from a 1-inch sensor, omnidirectional sensing, 45 min flight time. Real specs and honest trade-offs.",
        },
        {
          slug: "aero-lite-2",
          title: "Aero Lite 2 Beginner Drone",
          subtitle: "Stabilized 1080p, GPS hold and one-key landing under $150",
          description:
            "The Lite 2 is our honest budget pick. The 1080p camera is electronically stabilized — fine for sharing clips, not for cinematic work — and GPS position hold plus one-key takeoff and landing make the first flights stress-free.\n\nAt this price you give up a gimbal and long range, but you get a tough, repairable airframe and 22 minutes of flight per charge, which beats most toy-grade drones by a wide margin.",
          shortDescription:
            "Budget GPS drone with electronically stabilized 1080p camera, 22 min flight time and one-key takeoff and landing.",
          brand: "Aero",
          sku: "DRN-LITE2",
          gtin: null,
          price: 139,
          compareAtPrice: null,
          cost: 46,
          shippingCost: 7,
          stockStatus: "IN_STOCK",
          supplierName: "MockSupply Co",
          supplierProductId: "MS-1001",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "ABS airframe",
          warranty: "6-month manufacturer warranty",
          returnable: true,
          pros: [
            "GPS hold and return-to-home rarely seen under $150",
            "22 min flight time per charge",
            "Cheap, widely available spare parts",
          ],
          cons: [
            "Electronic stabilization only — visible jello in wind",
            "1080p camera is for fun clips, not serious footage",
            "2 km range in ideal conditions, less in cities",
          ],
          specs: [
            { label: "Takeoff weight", value: "245 g" },
            { label: "Camera", value: "1080p/30, electronic stabilization" },
            { label: "Flight time", value: "22 min per battery" },
            { label: "Transmission range", value: "2 km (line of sight)" },
            { label: "Features", value: "GPS hold, one-key takeoff/landing, RTH" },
          ],
          useCases: ["budget", "beginner", "easy-fly", "camera", "outdoor", "gps"],
          faq: [
            {
              question: "Is this a toy drone?",
              answer:
                "No — it has GPS position hold and return-to-home, which toy drones lack. But the camera is hobby-grade; if footage quality matters, look at the S1 Mini instead.",
            },
          ],
          seoTitle: "Aero Lite 2 — Best Beginner GPS Drone Under $150",
          seoDescription:
            "Aero Lite 2 budget drone: GPS hold, return-to-home, 22 min flight time and stabilized 1080p. Honest review of what you get under $150.",
        },
        {
          slug: "aero-trail-explorer",
          title: "Aero Trail Explorer Drone",
          subtitle: "Rugged sub-400 g travel drone with 2.7K camera and quick-swap props",
          description:
            "Built for hikers and travelers: the Trail Explorer trades outright camera quality for durability and packability. The reinforced arms survive the tumbles that crack lighter airframes, and tool-free quick-swap propellers mean a rough landing does not end the trip.\n\nThe 2.7K camera on a single-axis gimbal with electronic roll correction produces stable, share-ready footage, and the controller doubles as a power bank for your phone.",
          shortDescription:
            "Rugged 390 g travel drone with 2.7K camera, quick-swap props, 26 min flight time and a controller that doubles as a power bank.",
          brand: "Aero",
          sku: "DRN-TRAIL",
          gtin: null,
          price: 329,
          compareAtPrice: null,
          cost: 128,
          shippingCost: 10,
          stockStatus: "LOW_STOCK",
          supplierName: "SkyTech Wholesale",
          supplierProductId: "ST-4452",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "China",
          materials: "Glass-fiber reinforced nylon arms, ABS body",
          warranty: "12-month manufacturer warranty",
          returnable: true,
          pros: [
            "Reinforced arms shrug off crashes that break lighter drones",
            "Tool-free propeller swaps in the field",
            "Controller doubles as a USB-C power bank",
          ],
          cons: [
            "Hybrid stabilization is a step below a full 3-axis gimbal",
            "390 g — above the lightest regulation class",
            "Currently low stock with our supplier",
          ],
          specs: [
            { label: "Takeoff weight", value: "390 g" },
            { label: "Camera", value: "2.7K/30, 1-axis gimbal + EIS" },
            { label: "Flight time", value: "26 min per battery" },
            { label: "Transmission range", value: "5 km (FCC)" },
            { label: "Special", value: "Quick-swap props, power-bank controller" },
          ],
          useCases: ["outdoor", "compact", "camera", "gps", "beginner"],
          faq: [
            {
              question: "How crash-resistant is it really?",
              answer:
                "The arms are glass-fiber reinforced and the props swap without tools. It survives grass and dirt tumbles well; concrete at speed will still break things — that is physics, not marketing.",
            },
          ],
          seoTitle: "Aero Trail Explorer — Rugged Travel Drone with 2.7K Camera",
          seoDescription:
            "Aero Trail Explorer: crash-tolerant 390 g travel drone, 2.7K stabilized camera, 26 min flight time, quick-swap props. Real specs and trade-offs.",
        },
      ],
    },
    {
      slug: "fpv-racing",
      name: "FPV & Racing",
      description:
        "First-person-view kit for pilots who want speed and immersion: ready-to-fly bundles, indoor micro whoops, goggles and freestyle frames. We state video latency and battery sag honestly — they decide races.",
      seoTitle: "FPV Drones, Goggles & Racing Gear | Skyforge Drones",
      seoDescription:
        "FPV starter kits, micro whoops, goggles and racing frames with honest latency and flight-time numbers. Transparent shipping, 30-day returns.",
      heroTitle: "FPV that tells you the latency",
      heroSubtitle:
        "Starter kits and racing gear specced with the numbers that decide races: video latency, battery sag and real flight weight.",
      sortOrder: 2,
      products: [
        {
          slug: "volt-fpv-starter-kit",
          title: "Volt FPV Starter Kit",
          subtitle: "Ready-to-fly 3.5-inch FPV drone with goggles and controller",
          description:
            "Everything needed for a first FPV flight in one box: a durable 3.5-inch quad, digital goggles with a 28 ms latency feed, a hall-sensor controller and two batteries. The flight controller ships with beginner, sport and full acro modes so the kit grows with you.\n\nFPV has a learning curve — expect to spend hours in a simulator (the controller plugs into your PC via USB-C) before confident acro flying. The kit is the cheapest honest way in that does not need replacing after a month.",
          shortDescription:
            "Complete ready-to-fly FPV kit: 3.5-inch quad, digital goggles (28 ms latency), hall-sensor controller and two batteries.",
          brand: "Volt",
          sku: "DRN-VFPVKIT",
          gtin: null,
          price: 419,
          compareAtPrice: null,
          cost: 198,
          shippingCost: 14,
          stockStatus: "IN_STOCK",
          supplierName: "SkyTech Wholesale",
          supplierProductId: "ST-5101",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "China",
          materials: "Carbon fiber frame, TPU mounts",
          warranty: "6-month warranty on electronics",
          returnable: true,
          pros: [
            "Genuinely complete kit — nothing extra needed for first flights",
            "Digital video link at 28 ms latency",
            "Controller doubles as a USB simulator stick",
            "Beginner/sport/acro modes to grow into",
          ],
          cons: [
            "FPV has a real learning curve; budget simulator hours",
            "3.5-inch props need open space — not a living-room drone",
            "Crash repairs are part of the hobby; budget for spares",
          ],
          specs: [
            { label: "Quad size", value: "3.5-inch props, 280 g with battery" },
            { label: "Video system", value: "Digital, 28 ms latency, 10 km max" },
            { label: "Flight time", value: "7-9 min per battery (freestyle)" },
            { label: "Controller", value: "Hall-sensor gimbals, USB-C sim mode" },
            { label: "Batteries included", value: "2 × 4S 850 mAh LiPo" },
          ],
          useCases: ["racing", "performance", "beginner", "outdoor"],
          faq: [
            {
              question: "Can I learn FPV without crashing expensive gear?",
              answer:
                "Yes — plug the included controller into a PC simulator first. Twenty hours of sim time saves most of the early repair bills.",
            },
          ],
          seoTitle: "Volt FPV Starter Kit — Complete RTF FPV Bundle with Goggles",
          seoDescription:
            "Volt FPV starter kit: 3.5-inch quad, 28 ms digital goggles, sim-ready controller, 2 batteries. Honest learning-curve advice included.",
        },
        {
          slug: "volt-micro-whoop",
          title: "Volt Micro Whoop Indoor FPV",
          subtitle: "65 mm ducted indoor quad — learn FPV in your living room",
          description:
            "The micro whoop is how most FPV pilots actually learn: a 25-gram ducted quad that bounces off walls, furniture and family members without damage. Fly line-of-sight or pair it with any analog goggles.\n\nFour-minute packs sound short, but with six included batteries and a four-slot charger you get continuous practice sessions. This is the lowest-risk entry into FPV flying we know of.",
          shortDescription:
            "25 g ducted indoor FPV quad with analog VTX, six batteries and a 4-slot charger — the classic low-risk way to learn FPV.",
          brand: "Volt",
          sku: "DRN-VWHOOP",
          gtin: null,
          price: 95,
          compareAtPrice: null,
          cost: 34,
          shippingCost: 5.5,
          stockStatus: "IN_STOCK",
          supplierName: "MockSupply Co",
          supplierProductId: "MS-2031",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "PA12 ducted frame",
          warranty: "3-month warranty on electronics",
          returnable: true,
          pros: [
            "Safe indoors — ducts protect props, people and furniture",
            "Six batteries + multi-charger included for long sessions",
            "Binds to most common analog goggles and radios",
          ],
          cons: [
            "About 4 minutes per battery",
            "Analog video only at this price",
            "Outdoor flying limited to calm days",
          ],
          specs: [
            { label: "Weight", value: "25 g with battery" },
            { label: "Frame", value: "65 mm ducted" },
            { label: "Video", value: "Analog 25 mW VTX" },
            { label: "Flight time", value: "~4 min per 300 mAh 1S pack" },
            { label: "Included", value: "6 batteries, 4-slot USB charger" },
          ],
          useCases: ["indoor", "racing", "beginner", "easy-fly", "budget", "compact"],
          faq: [
            {
              question: "Do I need goggles to fly it?",
              answer:
                "No — it flies line-of-sight out of the box. Add any analog FPV goggles later for the full first-person experience.",
            },
          ],
          seoTitle: "Volt Micro Whoop — Indoor FPV Quad with 6 Batteries",
          seoDescription:
            "Volt Micro Whoop: 25 g ducted indoor FPV drone, six batteries included, safe around furniture. The proven low-risk way to learn FPV.",
        },
        {
          slug: "volt-r5-freestyle-frame",
          title: "Volt R5 Freestyle Frame Kit",
          subtitle: "5-inch carbon freestyle frame with crash-replaceable arms",
          description:
            "A 5-inch freestyle frame for pilots building their own quad: 6 mm arms in T700 carbon, replaceable individually with four screws each, and a stack bay that fits 20×20 and 30.5×30.5 mounting patterns.\n\nThis is a frame kit only — motors, stack, VTX and receiver are up to you. The geometry favors smooth freestyle lines over outright racing stiffness, and all hardware is standard metric.",
          shortDescription:
            "T700 carbon 5-inch freestyle frame with individually replaceable 6 mm arms and 20/30.5 mm stack compatibility. Frame kit only.",
          brand: "Volt",
          sku: "DRN-VR5FRAME",
          gtin: null,
          price: 64,
          compareAtPrice: null,
          cost: 21,
          shippingCost: 4.5,
          stockStatus: "IN_STOCK",
          supplierName: "MockSupply Co",
          supplierProductId: "MS-2044",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "T700 carbon fiber, stainless hardware",
          warranty: null,
          returnable: true,
          pros: [
            "Arms replace individually — cheap crash repairs",
            "True T700 carbon, 116 g frame weight",
            "Fits standard 20×20 and 30.5×30.5 stacks",
          ],
          cons: [
            "Frame only — full build requires separate electronics",
            "Freestyle geometry, not optimized for pure racing",
          ],
          specs: [
            { label: "Frame size", value: "5-inch, 225 mm wheelbase" },
            { label: "Arm thickness", value: "6 mm, individually replaceable" },
            { label: "Weight", value: "116 g frame only" },
            { label: "Stack mounting", value: "20×20 and 30.5×30.5 mm" },
            { label: "Camera mount", value: "19-21 mm micro, adjustable tilt" },
          ],
          useCases: ["racing", "pro", "performance"],
          faq: [
            {
              question: "Is this a complete drone?",
              answer:
                "No — it is the carbon frame and hardware only. You add motors, flight stack, video system and receiver. Our FPV starter kit is the ready-to-fly option.",
            },
          ],
          seoTitle: "Volt R5 Freestyle Frame — 5-Inch T700 Carbon Frame Kit",
          seoDescription:
            "Volt R5 5-inch freestyle frame: T700 carbon, replaceable 6 mm arms, standard stack mounting. Honest note: frame kit only, electronics separate.",
        },
        {
          slug: "volt-vision-goggles",
          title: "Volt Vision FPV Goggles",
          subtitle: "Analog goggles with DVR, diversity receivers and glasses-friendly fit",
          description:
            "Solid analog goggles for whoop and budget FPV pilots: dual diversity receivers hold signal where single-antenna boxes drop out, the built-in DVR records every flight to microSD, and the optics leave room for most glasses.\n\nThese are analog goggles — they will not receive digital video systems. For the price of one digital headset you can equip yourself and a friend, which is exactly how most people get hooked.",
          shortDescription:
            "Analog FPV goggles with dual diversity receivers, onboard DVR recording and a glasses-friendly fit.",
          brand: "Volt",
          sku: "DRN-VGOGGLE",
          gtin: null,
          price: 129,
          compareAtPrice: null,
          cost: 48,
          shippingCost: 6,
          stockStatus: "IN_STOCK",
          supplierName: "SkyTech Wholesale",
          supplierProductId: "ST-5130",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "China",
          materials: "ABS shell, foam faceplate",
          warranty: "6-month warranty",
          returnable: true,
          pros: [
            "Dual diversity receivers — fewer signal dropouts",
            "Built-in DVR records flights to microSD",
            "Fits over most glasses",
          ],
          cons: [
            "Analog only — incompatible with digital video systems",
            "Box-style goggles are bulkier than low-profile designs",
          ],
          specs: [
            { label: "Screen", value: "4.3\" LCD, 800×480" },
            { label: "Receiver", value: "5.8 GHz, 48ch, dual diversity" },
            { label: "DVR", value: "Onboard, microSD up to 128 GB" },
            { label: "Battery", value: "Built-in 2000 mAh, ~2.5 h" },
            { label: "Weight", value: "385 g" },
          ],
          useCases: ["racing", "indoor", "budget", "beginner"],
          faq: [
            {
              question: "Will these work with the Micro Whoop?",
              answer:
                "Yes — the whoop's analog VTX pairs directly with these goggles. They will not work with digital-only quads like the one in our FPV starter kit.",
            },
          ],
          seoTitle: "Volt Vision FPV Goggles — Analog Diversity Goggles with DVR",
          seoDescription:
            "Volt Vision analog FPV goggles: dual diversity receivers, built-in DVR, glasses-friendly. Honest compatibility notes for whoop pilots.",
        },
      ],
    },
    {
      slug: "accessories",
      name: "Accessories",
      description:
        "The unglamorous gear that decides whether a flying day succeeds: spare batteries, propellers, landing pads and transport cases — matched to the drones we sell so compatibility is never a guess.",
      seoTitle: "Drone Accessories: Batteries, Props & Cases | Skyforge Drones",
      seoDescription:
        "Spare drone batteries, propeller sets, landing pads and hard cases — compatibility clearly listed for every Aero and Volt model we stock.",
      heroTitle: "Accessories that match your drone",
      heroSubtitle:
        "Compatibility stated explicitly on every item — no guessing whether a battery or prop set fits your model.",
      sortOrder: 3,
      products: [
        {
          slug: "aero-flight-battery-2-pack",
          title: "Aero Flight Battery 2-Pack",
          subtitle: "Two genuine S1 Mini batteries — doubles your session to ~84 minutes",
          description:
            "Two genuine Aero intelligent flight batteries for the S1 Mini, with onboard charge-level LEDs and storage-mode self-discharge that protects cell health when you fly less often.\n\nThree batteries total (the one in your drone plus these two) is the setup most S1 Mini pilots settle on: roughly 84 minutes of combined flight time per outing.",
          shortDescription:
            "Two genuine Aero S1 Mini intelligent batteries with charge LEDs and storage self-discharge. Compatible with S1 Mini only.",
          brand: "Aero",
          sku: "DRN-S1BAT2",
          gtin: null,
          price: 79,
          compareAtPrice: null,
          cost: 31,
          shippingCost: 6,
          stockStatus: "IN_STOCK",
          supplierName: "SkyTech Wholesale",
          supplierProductId: "ST-4610",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Li-ion cells, PC housing",
          warranty: "6-month warranty",
          returnable: true,
          pros: [
            "Genuine cells with the same 28 min runtime as the original",
            "Auto storage mode protects cells between sessions",
            "Charge-level LEDs on the pack",
          ],
          cons: [
            "Fits the Aero S1 Mini only",
            "Air-shipping rules for lithium batteries can add transit time",
          ],
          specs: [
            { label: "Compatibility", value: "Aero S1 Mini only" },
            { label: "Capacity", value: "2453 mAh per battery" },
            { label: "Flight time", value: "~28 min per battery" },
            { label: "Charge time", value: "~70 min each" },
          ],
          useCases: ["outdoor", "camera", "beginner"],
          faq: [
            {
              question: "Why does battery shipping sometimes take longer?",
              answer:
                "Lithium batteries move under stricter air-freight rules, which can add a few days. The window shown here already accounts for it.",
            },
          ],
          seoTitle: "Aero S1 Mini Battery 2-Pack — Genuine Flight Batteries",
          seoDescription:
            "Double your Aero S1 Mini flight time with two genuine intelligent batteries: 2453 mAh, storage mode, charge LEDs. Compatibility clearly stated.",
        },
        {
          slug: "aero-low-noise-props",
          title: "Aero Low-Noise Propeller Set",
          subtitle: "Four pairs of swept-tip props for the S1 Mini — quieter and balanced",
          description:
            "Replacement propellers wear out faster than anything else on a drone. This set gives you four pairs of swept-tip low-noise props for the S1 Mini, factory-balanced so you avoid the micro-vibrations that show up as jello in footage.\n\nThe swept tips reduce the characteristic drone whine noticeably — useful for wildlife shots and not annoying everyone at the park.",
          shortDescription:
            "Four pairs of factory-balanced, swept-tip low-noise propellers for the Aero S1 Mini, with mounting screws and tool.",
          brand: "Aero",
          sku: "DRN-S1PROPS",
          gtin: null,
          price: 19,
          compareAtPrice: null,
          cost: 5.2,
          shippingCost: 2.8,
          stockStatus: "IN_STOCK",
          supplierName: "MockSupply Co",
          supplierProductId: "MS-2102",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Glass-fiber reinforced nylon",
          warranty: null,
          returnable: true,
          pros: [
            "Factory-balanced — no jello from vibrating props",
            "Noticeably quieter swept-tip design",
            "Includes screws and driver",
          ],
          cons: ["Fits the Aero S1 Mini only"],
          specs: [
            { label: "Compatibility", value: "Aero S1 Mini" },
            { label: "Contents", value: "4 pairs (8 props), screws, driver" },
            { label: "Material", value: "GF-reinforced nylon" },
          ],
          useCases: ["outdoor", "camera", "budget"],
          faq: [
            {
              question: "How often should props be replaced?",
              answer:
                "Inspect before every flight; replace at any nick or chip. Damaged props cause vibration that degrades footage and stresses motors.",
            },
          ],
          seoTitle: "Aero S1 Mini Low-Noise Props — 4-Pair Replacement Set",
          seoDescription:
            "Balanced low-noise propeller set for the Aero S1 Mini: 4 pairs, swept tips, screws and tool included. Why and when to replace props, explained.",
        },
        {
          slug: "skyforge-landing-pad-75",
          title: "Skyforge Landing Pad 75 cm",
          subtitle: "Foldable double-sided pad — protects gimbals from dust and grass",
          description:
            "Sand, dust and wet grass end more gimbal motors than crashes do. This 75 cm pad folds to a third of its size, spring-opens in a second, and anchors with the included stakes on windy days.\n\nThe double-sided high-contrast print (orange/blue) also gives vision-positioning drones a clean texture to lock onto during takeoff and landing.",
          shortDescription:
            "75 cm foldable landing pad with ground stakes and high-contrast double-sided print — cheap insurance for camera drone gimbals.",
          brand: "Skyforge",
          sku: "DRN-PAD75",
          gtin: null,
          price: 24,
          compareAtPrice: null,
          cost: 7.5,
          shippingCost: 3.5,
          stockStatus: "IN_STOCK",
          supplierName: "MockSupply Co",
          supplierProductId: "MS-2110",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Oxford polyester, spring-steel frame",
          warranty: null,
          returnable: true,
          pros: [
            "Protects gimbal and motors from dust and moisture",
            "Spring-open design, packs flat in seconds",
            "Stakes included for windy ground",
          ],
          cons: ["75 cm suits sub-1 kg drones; large rigs need the 110 cm class"],
          specs: [
            { label: "Diameter", value: "75 cm open, 28 cm folded" },
            { label: "Material", value: "Waterproof Oxford polyester" },
            { label: "Included", value: "3 stakes, carry bag" },
          ],
          useCases: ["outdoor", "beginner", "budget"],
          faq: [
            {
              question: "Do I actually need a landing pad?",
              answer:
                "On clean concrete, no. On grass, sand, dust or snow — yes: debris ingestion is one of the most common gimbal and motor failure causes.",
            },
          ],
          seoTitle: "Skyforge 75 cm Drone Landing Pad — Foldable, Double-Sided",
          seoDescription:
            "Foldable 75 cm landing pad with stakes and high-contrast print. Why landing pads prevent the most common gimbal failures, explained honestly.",
        },
        {
          slug: "skyforge-hard-case",
          title: "Skyforge Hard Case for S1 Mini",
          subtitle: "IP67 case with custom foam for drone, 3 batteries and controller",
          description:
            "A crushproof, IP67 water-sealed case cut specifically for the S1 Mini kit: drone, controller, three batteries, charger, props and filters each get a dedicated foam cavity, so nothing rattles in a car boot or checked luggage.\n\nThe pressure-equalization valve makes it flight-safe, and the lid accepts standard padlocks for travel.",
          shortDescription:
            "IP67 crushproof hard case with custom-cut foam for the Aero S1 Mini, controller, 3 batteries and accessories.",
          brand: "Skyforge",
          sku: "DRN-CASE1",
          gtin: null,
          price: 84,
          compareAtPrice: null,
          cost: 29,
          shippingCost: 9,
          stockStatus: "IN_STOCK",
          supplierName: "SkyTech Wholesale",
          supplierProductId: "ST-4720",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "China",
          materials: "PP copolymer shell, PE foam insert",
          warranty: "24-month warranty on shell",
          returnable: true,
          pros: [
            "IP67 sealed and crushproof",
            "Custom foam — nothing moves in transit",
            "Pressure valve for air travel, padlock-ready",
          ],
          cons: [
            "Foam layout fits the S1 Mini kit only",
            "Heavier than soft bags (1.4 kg empty)",
          ],
          specs: [
            { label: "Rating", value: "IP67, crushproof to 120 kg" },
            { label: "Fits", value: "S1 Mini, controller, 3 batteries, charger" },
            { label: "Weight", value: "1.4 kg empty" },
            { label: "External size", value: "32 × 27 × 13 cm" },
          ],
          useCases: ["outdoor", "compact", "camera"],
          faq: [
            {
              question: "Can it go in checked airline luggage?",
              answer:
                "The case is built for it, but airlines require lithium batteries in carry-on. Pack the case in checked luggage and the batteries in your cabin bag.",
            },
          ],
          seoTitle: "Skyforge IP67 Hard Case for Aero S1 Mini — Custom Foam",
          seoDescription:
            "Crushproof IP67 case with custom foam for the Aero S1 Mini kit. Includes honest airline guidance: batteries belong in carry-on.",
        },
      ],
    },
  ],
  guides: [
    {
      slug: "best-beginner-drone",
      title: "How to Choose Your First Drone (Without Wasting Money)",
      excerpt:
        "For most beginners the right first drone is a sub-250 g GPS camera drone like the Aero S1 Mini: light enough for relaxed rules, stabilized enough that footage looks good, forgiving enough that mistakes rarely end in losses. Pay for GPS hold and a real gimbal; skip obstacle sensing until you know you need it.",
      body: `## The short answer

If you want good footage with minimal regulatory hassle, buy a **sub-250 g GPS drone with a real 3-axis gimbal** — in our catalog that is the Aero S1 Mini. If you mainly want the fun of flying and your budget is tight, the Aero Lite 2 keeps the GPS safety net for under $150. If the goal is adrenaline rather than footage, skip camera drones entirely and start FPV with a micro whoop.

## The three questions that actually decide it

- **Footage or flying?** Camera drones fly themselves so you can frame shots. FPV drones are flown for the flying itself. They are different hobbies that happen to share propellers.
- **Where will you fly?** Sub-250 g drones face lighter rules in many countries. Above that weight, expect registration, tests and more restricted zones. Check your aviation authority — rules change.
- **What is the real budget?** Add roughly 30% to any drone's sticker price for spare batteries and a case. A $289 drone is a $370 setup. Budgeting this up front beats being grounded after 28 minutes on a perfect evening.

## What matters in the spec sheet

- **Gimbal type.** A mechanical 3-axis gimbal produces smooth footage; "electronic stabilization" crops your image and shows jello in wind. This single line in the spec sheet explains most of the price difference between the Lite 2 and the S1 Mini.
- **Flight time per battery.** Treat manufacturer numbers as hover-in-a-lab values; real flying costs 10-15% more. Anything under 20 minutes gets frustrating fast.
- **Transmission range.** You must legally keep line of sight almost everywhere, so a 6 km link is not about flying 6 km away — it is about a rock-solid connection at 500 m.

## What does not matter (yet)

- **Obstacle avoidance** is genuinely useful but expensive; careful flying replaces it while you learn. It becomes worth paying for when you fly complex automated shots — that is X8 Pro territory.
- **8K video** on a tiny sensor is marketing. A good 4K image from a 1/2.3-inch sensor beats a noisy 8K one every time.

## Best for each budget

- **Under $150:** Aero Lite 2 — GPS hold and return-to-home make it a real aircraft, not a toy. Accept hobby-grade footage.
- **Around $300:** Aero S1 Mini — the sweet spot. Real gimbal, sub-250 g, RAW photos.
- **Serious footage:** Aero X8 Pro — 1-inch sensor and obstacle sensing, but only worth it if footage quality has concrete value to you.

## The mistakes we see most

- Buying a toy-grade drone without GPS "to learn on" — it teaches bad habits and usually ends up in a tree.
- Skipping spare batteries, then planning every outing around 28 airborne minutes.
- Ignoring local rules. Five minutes on your aviation authority's site prevents real fines.`,
      seoTitle: "Best Beginner Drone 2026: How to Choose Without Wasting Money",
      seoDescription:
        "A direct answer to which drone to buy first: why sub-250 g GPS drones with real gimbals win, what specs are marketing, and best picks per budget.",
      relatedProductSlugs: ["aero-s1-mini-4k", "aero-lite-2", "aero-flight-battery-2-pack"],
    },
    {
      slug: "drone-camera-specs-explained",
      title: "Drone Camera Specs Explained: What Actually Affects Your Footage",
      excerpt:
        "Sensor size and gimbal type determine your footage quality far more than resolution. A 4K camera on a 1-inch sensor with a 3-axis gimbal beats an '8K' camera on a tiny sensor with electronic stabilization in every real-world condition — here is how to read the spec sheet.",
      body: `## The short answer

Read drone camera specs in this order: **gimbal type, sensor size, then resolution**. A mechanical 3-axis gimbal and a larger sensor improve every shot you take; extra resolution only helps when the first two are already good.

## Gimbal: the spec that hides in the footnotes

A mechanical gimbal physically isolates the camera from the airframe's vibration and tilt. Electronic stabilization (EIS) instead crops into the image and shifts it digitally — it works for casual clips in calm air and falls apart in wind. Marketing copy blurs this line constantly; the honest phrasing to look for is "3-axis mechanical gimbal".

- Aero S1 Mini and X8 Pro: mechanical 3-axis gimbals.
- Aero Trail Explorer: hybrid (1-axis mechanical + EIS) — a fair middle ground.
- Aero Lite 2: EIS only, priced accordingly.

## Sensor size beats megapixels

Sensor area determines how much light the camera gathers, which controls noise, dynamic range and low-light usability. The jump from a 1/2.3-inch sensor to a 1-inch sensor is roughly four times the light-gathering area — visible in every dusk shot. Megapixels divide that same light into smaller buckets; more is not automatically better.

## Resolution: when 4K matters

4K is worth having: it lets you crop and stabilize in post while delivering sharp 1080p. Beyond 4K, gains are real only for professional delivery or heavy cropping. "8K" from a tiny sensor mostly produces bigger files of the same noise.

## Frame rates and shutter

For smooth cinematic motion you want your shutter at roughly double the frame rate, which in daylight requires ND filters — budget for a set if you shoot seriously. 60 fps modes are for slow-motion or fast action; 24-30 fps is the standard look.

## What this means per pilot type

- **Social clips and travel memories:** any stabilized 4K is plenty — S1 Mini class.
- **Selling footage or printing stills:** 1-inch sensor minimum — X8 Pro class, plus ND filters.
- **Just learning:** the Lite 2's EIS footage is fine while you decide whether the hobby sticks.`,
      seoTitle: "Drone Camera Specs Explained: Gimbal, Sensor Size & 4K Truths",
      seoDescription:
        "Why gimbal type and sensor size matter more than resolution, which specs are marketing, and what camera class fits travel clips vs paid work.",
      relatedProductSlugs: ["aero-x8-pro", "aero-s1-mini-4k", "aero-trail-explorer"],
    },
    {
      slug: "getting-started-with-fpv",
      title: "Getting Started With FPV: A Realistic Roadmap",
      excerpt:
        "Start FPV with 20 hours in a free simulator using a real controller, then fly a $95 micro whoop indoors before spending on a full kit. This order costs the least, teaches the most, and tells you within a month whether the hobby is for you.",
      body: `## The short answer

The proven path into FPV: **simulator first, micro whoop second, full-size quad third.** Total cost to find out if you love it: about $95 for a whoop (plus a controller if you do not buy a kit). Skipping steps is the expensive route, not the fast one.

## Step 1: Simulator (weeks 1-3)

FPV quads in acro mode do not self-level — that is what makes them capable of the flying you have seen in videos, and what makes the first hours humbling. A simulator turns those crashes into keystrokes. Use any mainstream FPV sim with a real controller; the hall-sensor controller in our Volt starter kit plugs straight into a PC over USB-C. Twenty hours of sim is the consensus threshold before real-world acro.

## Step 2: Micro whoop (month 1-2)

The Volt Micro Whoop weighs 25 g and bounces off walls without damage. Indoors, year-round, no weather excuses. Six included batteries give continuous practice sessions, and the analog video link pairs with budget goggles like the Volt Vision. Every skill transfers directly to bigger quads.

## Step 3: A real quad outdoors (month 2+)

The Volt FPV starter kit's 3.5-inch quad is the sensible first outdoor machine: powerful enough for real freestyle, small enough that crashes are usually repairable with a prop swap. Digital video at 28 ms latency is a genuine upgrade over analog for spatial awareness in trees and gaps.

## Honest cost expectations

- Crashing is part of FPV at every skill level; budget for props (consumable), the odd arm, and eventually motors.
- Batteries are the recurring cost: LiPos survive roughly 150-300 cycles when stored properly at storage voltage.
- The hobby rewards people who enjoy building and tuning. If that sounds like a chore, camera drones may fit you better — no judgment, different hobby.

## Rules still apply

FPV flying through goggles legally requires a spotter maintaining line of sight in most countries, and the same weight/zone rules as camera drones. Check before you rip.`,
      seoTitle: "Getting Started With FPV Drones: Simulator to First Quad",
      seoDescription:
        "A realistic FPV roadmap: 20 sim hours, a $95 micro whoop, then a full kit. Honest cost expectations, crash budgeting and the rules that apply.",
      relatedProductSlugs: ["volt-micro-whoop", "volt-fpv-starter-kit", "volt-vision-goggles"],
    },
  ],
  comparison: {
    slug: "camera-drone-comparison",
    title: "Skyforge Camera Drones Compared: Lite 2 vs S1 Mini vs X8 Pro",
    excerpt:
      "Three honest tiers: the Lite 2 for learning cheaply, the S1 Mini for the best footage-per-dollar under 250 g, the X8 Pro when image quality has concrete value.",
    body: "These are the three camera platforms we stock, and they map cleanly to three kinds of pilots. The Lite 2 exists to make your first hundred flights cheap and safe. The S1 Mini is the one most people should buy: a real gimbal and RAW stills below the 250-gram regulatory line. The X8 Pro earns its price only when footage quality converts into something concrete — paid work, serious projects, low-light shoots.\n\nThe table below shows the differences that actually change outcomes. Everything else — colorful marketing names for flight modes, app filters — is the same drone-shaped noise on every spec sheet in the industry.",
    seoTitle: "Camera Drone Comparison: Aero Lite 2 vs S1 Mini vs X8 Pro",
    seoDescription:
      "Side-by-side comparison of our three camera drones: weight class, gimbal, sensor, flight time and price — with honest guidance on who needs which.",
    productSlugs: ["aero-lite-2", "aero-s1-mini-4k", "aero-x8-pro"],
  },
  homepageFaq: [
    {
      question: "Where do orders ship from?",
      answer:
        "Directly from our partner suppliers' warehouses in Asia and the EU — we do not hold local stock, and we say so. Every product page shows the realistic delivery window for that item, typically 6-14 business days with tracking.",
    },
    {
      question: "Do I need to register my drone?",
      answer:
        "It depends on weight and your country. Sub-250 g models like the Aero S1 Mini face lighter rules in many regions, but requirements change — always check your national aviation authority before flying.",
    },
    {
      question: "What if my drone arrives damaged?",
      answer:
        "Email support@dronestore.example within 14 days with photos and we replace or refund it at our cost. You never deal with the supplier directly — we are your contract partner.",
    },
    {
      question: "Why don't you show customer star ratings?",
      answer:
        "Because we have not collected enough verified reviews yet, and we refuse to fake them. We show measured specs, honest pros and cons, and clear return rights instead.",
    },
    {
      question: "Can I return a drone I have flown?",
      answer:
        "Unflown drones return free within 30 days. Once flown, returns are accepted for defects under warranty; we cannot resell a crashed drone as new and will not pretend otherwise.",
    },
  ],
};

export const dronesPolicies = {
  privacyPolicy: defaultPrivacyPolicy(info),
  termsOfSale: defaultTermsOfSale(info),
};

```


---

## prisma/seed-data/ergonomic-office.ts

```ts
import {
  defaultPrivacyPolicy,
  defaultTermsOfSale,
  type SeedStore,
  type SeedStoreInfo,
} from "./types";

/** Ergonomic office store: professional, health/comfort-focused brand. */

const info: SeedStoreInfo = {
  slug: "ergonomic-office",
  name: "UprightWorks",
  legalName: "UprightWorks Commerce ApS",
  primaryDomain: "ergonomikontor.example",
  locale: "en-US",
  currency: "USD",
  niche: "ergonomic office equipment",
  positioning:
    "Desk-setup gear chosen by one criterion: does it measurably reduce strain for people who sit at a screen all day? We explain the ergonomics behind every product, state honest limits (no cushion cures a bad chair), and never use the word 'orthopedic' as decoration.",
  audience: "remote workers and desk professionals with aches that arrive by 3 pm",
  valueProposition: "Work a full day without the 3 pm ache",
  brandVoice: "professional, evidence-aware, calm",
  logoText: "UprightWorks",
  supportEmail: "care@ergonomikontor.example",
  supportPhone: "+1 (555) 010-4410",
  shippingOriginDisclosure:
    "Orders ship directly from our partner suppliers' warehouses. We do not hold local stock; every product page shows its real delivery window, typically 6-13 business days with tracking.",
  defaultShippingDaysMin: 6,
  defaultShippingDaysMax: 13,
  returnPolicySummary:
    "30-day comfort guarantee: if a product does not improve your setup, return it in resaleable condition for a full refund.",
};

export const ergonomicSeed: SeedStore = {
  store: info,
  theme: {
    primaryColor: "#4338ca",
    secondaryColor: "#1e1b4b",
    accentColor: "#0d9488",
    backgroundColor: "#f8f8fc",
    textColor: "#1e1b2e",
    borderRadius: "0.625rem",
    fontHeading: "system-ui",
    fontBody: "system-ui",
  },
  domains: ["ergonomikontor.example", "www.ergonomikontor.example"],
  categories: [
    {
      slug: "seating-support",
      name: "Seating & Support",
      description:
        "Lumbar cushions, seat wedges and footrests that fix the most common sitting problems — chosen because they address posture mechanics, not because they photograph well.",
      seoTitle: "Lumbar Support & Seating Ergonomics | UprightWorks",
      seoDescription:
        "Lumbar cushions, seat cushions and footrests that measurably improve sitting posture. Honest limits stated — no cushion fixes a broken chair.",
      heroTitle: "Fix how you sit first",
      heroSubtitle:
        "The highest-impact, lowest-cost ergonomic upgrades all happen at the chair. Start here before buying anything else.",
      sortOrder: 1,
      products: [
        {
          slug: "contour-lumbar-cushion",
          title: "Contour Lumbar Support Cushion",
          subtitle: "Memory foam that holds the curve your lower back gives up on by noon",
          description:
            "A contoured memory-foam cushion that fills the gap between your lower back and the chair, maintaining the lumbar curve your muscles stop holding after hours of sitting. Two adjustable straps fit office chairs, car seats and dining chairs pressed into home-office duty.\n\nHonest scope: a lumbar cushion reduces slouching strain on a decent chair. It does not turn a kitchen stool into an ergonomic chair, and it works best combined with screen-height fixes — see our laptop stand.",
          shortDescription:
            "Contoured memory-foam lumbar cushion with washable mesh cover and dual straps — keeps your lower back's curve supported through the day.",
          brand: "UprightWorks",
          sku: "ERG-LUMB1",
          gtin: null,
          price: 36.95,
          compareAtPrice: null,
          cost: 11.4,
          shippingCost: 4.8,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2210",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "High-density memory foam, breathable mesh cover",
          warranty: "12-month shape-retention warranty",
          returnable: true,
          pros: [
            "High-density foam keeps its contour (12-month shape warranty)",
            "Dual straps hold position — no constant readjusting",
            "Mesh cover is removable and machine-washable",
          ],
          cons: [
            "Cannot compensate for a chair with a broken backrest",
            "Adds ~5 cm of seat depth — very shallow chairs get tight",
          ],
          specs: [
            { label: "Foam", value: "High-density memory foam, 50D" },
            { label: "Cover", value: "Breathable mesh, machine-washable" },
            { label: "Attachment", value: "2 adjustable straps" },
            { label: "Size", value: "39 × 39 × 10 cm" },
          ],
          useCases: ["back-pain", "lumbar", "budget"],
          faq: [
            {
              question: "Will this fix my back pain?",
              answer:
                "It reduces the slouching strain that aggravates many desk workers' lower backs. Persistent or severe pain needs a clinician, not a cushion — we say that plainly.",
            },
          ],
          seoTitle: "Contour Lumbar Cushion — Memory Foam Back Support for Desk Chairs",
          seoDescription:
            "Memory-foam lumbar cushion with washable cover and strap mounting. Honest scope: reduces slouching strain, doesn't replace a decent chair.",
        },
        {
          slug: "ortho-seat-cushion",
          title: "Pressure-Relief Seat Cushion",
          subtitle: "Gel-infused foam with a coccyx cutout for long sitting days",
          description:
            "A seat cushion engineered around two pressure points: a U-shaped cutout takes load off the tailbone, and gel-infused high-density foam spreads the rest across your thighs instead of two sit bones.\n\nMost useful for people on hard chairs, long-haul drivers, and anyone with tailbone discomfort. The non-slip base actually grips; the handle makes it portable between home, office and car.",
          shortDescription:
            "Gel-infused seat cushion with coccyx cutout and non-slip base — redistributes sitting pressure on hard chairs.",
          brand: "UprightWorks",
          sku: "ERG-SEAT1",
          gtin: null,
          price: 32.95,
          compareAtPrice: null,
          cost: 10.2,
          shippingCost: 4.6,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2225",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Gel-infused memory foam, non-slip rubberized base",
          warranty: "12-month shape-retention warranty",
          returnable: true,
          pros: [
            "Coccyx cutout relieves direct tailbone pressure",
            "Gel layer prevents the heat build-up plain foam suffers",
            "Genuinely non-slip base",
          ],
          cons: [
            "Raises seat height ~4 cm — re-check your desk and screen heights",
            "Too firm for people who prefer plush seating",
          ],
          specs: [
            { label: "Foam", value: "Gel-infused memory foam" },
            { label: "Design", value: "U-shaped coccyx cutout" },
            { label: "Base", value: "Non-slip rubberized" },
            { label: "Size", value: "45 × 36 × 7 cm" },
          ],
          useCases: ["back-pain", "lumbar", "budget"],
          faq: [
            {
              question: "Does it work on an office chair that already has padding?",
              answer:
                "Yes, but the benefit is biggest on hard or thinly padded seats. On a well-padded chair, prioritize lumbar support and screen height first.",
            },
          ],
          seoTitle: "Pressure-Relief Seat Cushion with Coccyx Cutout — Gel Foam",
          seoDescription:
            "Gel-infused seat cushion that redistributes sitting pressure and relieves the tailbone. Honest fit guidance for chair and desk heights.",
        },
        {
          slug: "tilt-footrest",
          title: "Adjustable Tilt Footrest",
          subtitle: "Closes the gap between short legs and tall desks",
          description:
            "If your feet dangle or you tuck them under the chair, your posture collapses no matter how good the chair is. This footrest gives feet a firm, height-adjustable platform (10-16 cm) with a free-tilting surface that keeps ankles moving through the day.\n\nThe textured surface works with or without shoes, and the steel frame does not creep across the floor like hollow plastic footrests.",
          shortDescription:
            "Height-adjustable (10-16 cm) tilting footrest with steel frame — restores proper sitting posture when your desk is too tall.",
          brand: "UprightWorks",
          sku: "ERG-FOOT1",
          gtin: null,
          price: 42.5,
          compareAtPrice: null,
          cost: 14.1,
          shippingCost: 6.2,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2240",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "Taiwan",
          materials: "Steel frame, textured PP platform",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "Restores thigh-parallel-to-floor posture at tall desks",
            "Free tilt keeps ankles and calves active",
            "Steel frame stays put on hard floors",
          ],
          cons: [
            "Takes permanent floor space under the desk",
            "Not needed if your feet already rest flat",
          ],
          specs: [
            { label: "Height range", value: "10-16 cm, 4 steps" },
            { label: "Tilt", value: "Free-tilting ±15°" },
            { label: "Platform", value: "45 × 35 cm, textured" },
            { label: "Frame", value: "Powder-coated steel" },
          ],
          useCases: ["back-pain", "movement", "budget"],
          faq: [
            {
              question: "How do I know if I need a footrest?",
              answer:
                "Sit back in your chair with the seat at elbow-height for the desk. If your heels lift or feet dangle, you need a footrest. If feet rest flat, you don't.",
            },
          ],
          seoTitle: "Adjustable Tilt Footrest — Fix Dangling Feet at Tall Desks",
          seoDescription:
            "Steel-framed adjustable footrest (10-16 cm) with free tilt. Includes the 10-second test for whether you actually need one.",
        },
        {
          slug: "balance-cushion",
          title: "Active Sitting Balance Cushion",
          subtitle: "Inflatable wobble cushion that turns a chair into active seating",
          description:
            "An inflatable cushion that introduces controlled instability to your chair, recruiting core and postural muscles that switch off on a static seat. Used in 20-40 minute intervals it is a genuinely useful tool against the stiffness of long sitting.\n\nHonest framing: active sitting is a supplement to movement, not a replacement for it. The included pump lets you tune wobble from subtle to demanding; the textured side doubles as a standing balance pad.",
          shortDescription:
            "Inflatable balance cushion for active sitting intervals — adjustable wobble, includes pump, doubles as a standing balance pad.",
          brand: "UprightWorks",
          sku: "ERG-BAL1",
          gtin: null,
          price: 26.95,
          compareAtPrice: null,
          cost: 7.8,
          shippingCost: 4.1,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2260",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Burst-resistant PVC, free of phthalates",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "Recruits postural muscles static sitting switches off",
            "Inflation-adjustable difficulty",
            "Doubles as a standing balance pad",
          ],
          cons: [
            "Use in intervals — hours of continuous wobble fatigues the back",
            "Slight seat-height increase (~6 cm inflated)",
          ],
          specs: [
            { label: "Diameter", value: "33 cm" },
            { label: "Material", value: "Burst-resistant, phthalate-free PVC" },
            { label: "Max load", value: "150 kg" },
            { label: "Included", value: "Hand pump" },
          ],
          useCases: ["movement", "standing", "budget", "back-pain"],
          faq: [
            {
              question: "Can I sit on it all day?",
              answer:
                "Don't — 20-40 minute intervals a few times daily is the useful dose. Continuous use fatigues exactly the muscles you are trying to help.",
            },
          ],
          seoTitle: "Active Sitting Balance Cushion — Adjustable Wobble + Pump",
          seoDescription:
            "Inflatable balance cushion for active-sitting intervals, with honest dosage guidance (20-40 min, not all day). Pump included.",
        },
      ],
    },
    {
      slug: "desk-setup",
      name: "Desk Setup",
      description:
        "Screen and input geometry: laptop stands, monitor risers and desk converters that put the top of your screen at eye height — the single change that fixes most desk-related neck pain.",
      seoTitle: "Ergonomic Desk Setup: Stands & Risers | UprightWorks",
      seoDescription:
        "Laptop stands, monitor risers and sit-stand converters that fix screen height — the root cause of most desk neck pain. Honest setup guidance.",
      heroTitle: "Your screen is too low",
      heroSubtitle:
        "Nearly every laptop worker's screen sits 20 cm below where it should. These products fix exactly that.",
      sortOrder: 2,
      products: [
        {
          slug: "alu-laptop-stand",
          title: "Aluminium Laptop Stand",
          subtitle: "Raises your laptop screen to eye height — the #1 neck-pain fix",
          description:
            "A rigid aluminium stand that lifts your laptop screen 12-21 cm so the top of the display reaches eye height. Combined with an external keyboard (non-negotiable — typing on a raised laptop is worse than not raising it), this is the single highest-value ergonomic purchase for laptop workers.\n\nThe solid aluminium build does not bounce while you type on the desk, ventilation is improved by design, and it folds flat for bag transport.",
          shortDescription:
            "Rigid aluminium laptop stand, adjustable 12-21 cm — puts your screen at eye height. Requires an external keyboard to work properly.",
          brand: "UprightWorks",
          sku: "ERG-LAP1",
          gtin: null,
          price: 39.95,
          compareAtPrice: null,
          cost: 12.6,
          shippingCost: 5,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2310",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Anodized aluminium, silicone pads",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "Fixes the root cause of most laptop neck pain",
            "Rigid — no wobble while typing on the desk",
            "Folds flat, weighs 280 g; commute-friendly",
          ],
          cons: [
            "Useless without an external keyboard and mouse — budget for them",
            "Max laptop size 16 inches",
          ],
          specs: [
            { label: "Height range", value: "12-21 cm, 6 steps" },
            { label: "Fits", value: "Laptops 10-16\", up to 5 kg" },
            { label: "Material", value: "Anodized aluminium" },
            { label: "Folded size", value: "26 × 5 × 4 cm, 280 g" },
          ],
          useCases: ["neck-pain", "monitor-height", "laptop", "compact", "budget"],
          faq: [
            {
              question: "Do I really need an external keyboard with it?",
              answer:
                "Yes. Raising the laptop without one forces your wrists up to the keyboard and trades neck pain for wrist pain. Stand + external keyboard is the complete fix.",
            },
          ],
          seoTitle: "Aluminium Laptop Stand (12-21 cm) — Fix Laptop Neck Pain",
          seoDescription:
            "Rigid foldable laptop stand that raises your screen to eye height. Honest requirement: pair it with an external keyboard or skip it.",
        },
        {
          slug: "bamboo-monitor-riser",
          title: "Bamboo Monitor Riser with Storage",
          subtitle: "Raises external monitors 10 cm and declutters the desk beneath",
          description:
            "A solid bamboo platform that raises an external monitor 10 cm — right for most people on standard desks — with a storage shelf underneath that swallows the keyboard at day's end.\n\nRule of thumb we print everywhere: the top of the screen belongs at eye height. If 10 cm is not enough (tall person, low desk), stack height with your monitor's own stand or choose an arm instead.",
          shortDescription:
            "Solid bamboo monitor riser (10 cm) with under-shelf storage — fits monitors up to 32\" and 20 kg.",
          brand: "UprightWorks",
          sku: "ERG-RISER1",
          gtin: null,
          price: 34.5,
          compareAtPrice: null,
          cost: 10.8,
          shippingCost: 6.8,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2325",
          shippingDaysMin: 7,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "Solid bamboo",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "Stable up to 20 kg — no flex under big monitors",
            "Under-shelf clears the keyboard off the desk overnight",
            "Solid bamboo, not veneered chipboard",
          ],
          cons: [
            "Fixed 10 cm height — measure before buying",
            "Takes 54 cm of desk width",
          ],
          specs: [
            { label: "Height", value: "10 cm fixed" },
            { label: "Platform", value: "54 × 24 cm" },
            { label: "Max load", value: "20 kg / up to 32\" monitors" },
            { label: "Material", value: "Solid bamboo" },
          ],
          useCases: ["neck-pain", "monitor-height", "typing"],
          faq: [
            {
              question: "How do I know if 10 cm is right?",
              answer:
                "Sit upright and note where your eyes hit the screen. The top edge of the display should be at eye height; measure the gap and compare with 10 cm plus your monitor's own adjustment range.",
            },
          ],
          seoTitle: "Bamboo Monitor Riser (10 cm) with Storage Shelf",
          seoDescription:
            "Solid bamboo monitor stand that raises screens 10 cm and stores your keyboard underneath. Includes the eye-height measuring rule.",
        },
        {
          slug: "sit-stand-converter",
          title: "Sit-Stand Desk Converter",
          subtitle: "Turns any desk into a standing desk — no replacement furniture",
          description:
            "A gas-spring platform that sits on your existing desk and lifts your monitor and keyboard 11-50 cm in one motion, converting any fixed desk to sit-stand without replacing furniture.\n\nThe two-tier design keeps the keyboard at elbow height in both positions — the detail cheap converters miss. Realistic standing guidance: alternate in 30-60 minute blocks; standing all day just relocates the strain.",
          shortDescription:
            "Gas-spring sit-stand converter (11-50 cm) with two-tier keyboard deck — converts any desk to standing without new furniture.",
          brand: "UprightWorks",
          sku: "ERG-CONV1",
          gtin: null,
          price: 189,
          compareAtPrice: null,
          cost: 78,
          shippingCost: 19,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2350",
          shippingDaysMin: 7,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "Steel frame, MDF work surface",
          warranty: "36-month warranty on gas spring",
          returnable: true,
          pros: [
            "One-motion gas-spring lift with 12 lockable heights",
            "Separate keyboard tier keeps elbows at 90° standing or sitting",
            "No furniture replacement — sits on the existing desk",
          ],
          cons: [
            "23 kg unit; plan the unboxing",
            "Monitor wobble at full height with cheap desk underneath",
            "Footprint claims most of a 120 cm desk",
          ],
          specs: [
            { label: "Height range", value: "11-50 cm, gas-assisted" },
            { label: "Surface", value: "80 × 40 cm + keyboard deck 80 × 30 cm" },
            { label: "Max load", value: "15 kg" },
            { label: "Weight", value: "23 kg" },
          ],
          useCases: ["standing", "movement", "neck-pain", "premium", "back-pain"],
          faq: [
            {
              question: "Is standing all day better than sitting all day?",
              answer:
                "No — it trades one static posture for another. The benefit is in alternating; 30-60 minute blocks is the common-sense rhythm we recommend.",
            },
          ],
          seoTitle: "Sit-Stand Desk Converter — Gas Spring, Two-Tier Keyboard Deck",
          seoDescription:
            "Convert any desk to sit-stand: gas-spring lift, 11-50 cm range, proper keyboard tier. Honest guidance: alternate, don't just stand.",
        },
        {
          slug: "monitor-arm-single",
          title: "Single Monitor Arm, Gas Spring",
          subtitle: "Full height, depth and rotation control for monitors up to 32\"",
          description:
            "A gas-spring monitor arm that frees you from your monitor's built-in stand: fluid height, depth, tilt and rotation adjustment, plus reclaimed desk space where the stand's foot used to be.\n\nFits VESA 75/100 monitors from 2 to 9 kg (check your monitor's weight — too light is as problematic as too heavy for gas springs). Clamp and grommet mounts both included.",
          shortDescription:
            "Gas-spring monitor arm for 17-32\" VESA monitors (2-9 kg) with full motion adjustment; clamp and grommet mounts included.",
          brand: "UprightWorks",
          sku: "ERG-ARM1",
          gtin: null,
          price: 64.95,
          compareAtPrice: null,
          cost: 23.5,
          shippingCost: 7.4,
          stockStatus: "LOW_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2370",
          shippingDaysMin: 7,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "Aluminium and steel, internal gas spring",
          warranty: "36-month warranty",
          returnable: true,
          pros: [
            "Fluid one-hand positioning at any height in range",
            "Reclaims the desk space under the old stand",
            "Integrated cable channel",
          ],
          cons: [
            "Monitors under 2 kg won't hold position — check weight first",
            "Needs a desk edge or grommet hole that can take a clamp",
          ],
          specs: [
            { label: "Fits", value: "17-32\", VESA 75/100" },
            { label: "Weight range", value: "2-9 kg" },
            { label: "Motion", value: "Height, depth, ±90° tilt, 360° rotation" },
            { label: "Mount", value: "C-clamp + grommet (both included)" },
          ],
          useCases: ["neck-pain", "monitor-height", "premium", "typing"],
          faq: [
            {
              question: "Why does monitor weight matter so much?",
              answer:
                "Gas springs are tuned for a weight range. Below 2 kg the arm drifts up; above 9 kg it sags. Weigh your monitor (spec sheet, without stand) before ordering.",
            },
          ],
          seoTitle: "Gas-Spring Monitor Arm (17-32\") — Full Motion, VESA 75/100",
          seoDescription:
            "Single gas-spring monitor arm with fluid adjustment and cable management. Includes the weight-range check most shops skip.",
        },
      ],
    },
    {
      slug: "accessories",
      name: "Wrist & Accessories",
      description:
        "The finishing layer: wrist rests, ergonomic mice, desk mats and cable management that remove the small daily frictions and strains a good chair-and-screen setup leaves behind.",
      seoTitle: "Wrist Rests, Ergonomic Mice & Desk Accessories | UprightWorks",
      seoDescription:
        "Ergonomic wrist support, vertical mice and desk accessories that complete a healthy setup — with honest guidance on what each actually fixes.",
      heroTitle: "The last 10% of a good setup",
      heroSubtitle:
        "Chair right? Screen right? These accessories clean up the remaining strain points: wrists, forearms and desk chaos.",
      sortOrder: 3,
      products: [
        {
          slug: "vertical-mouse",
          title: "Vertical Ergonomic Mouse",
          subtitle: "Handshake-angle grip that unloads forearm rotation",
          description:
            "A vertical mouse holds your hand at a 57° handshake angle, removing the forearm rotation (pronation) a flat mouse forces for hours a day — the strain many people feel as wrist or elbow ache.\n\nExpect 3-5 awkward days while your aim recalibrates; nearly everyone adapts and few go back. Six buttons, adjustable DPI, silent clicks, and connection via USB receiver or Bluetooth.",
          shortDescription:
            "57° vertical mouse that removes forearm pronation strain. Six buttons, dual wireless, silent clicks — expect a 3-5 day adjustment.",
          brand: "UprightWorks",
          sku: "ERG-VMOUSE",
          gtin: null,
          price: 34.95,
          compareAtPrice: null,
          cost: 11.2,
          shippingCost: 4.2,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2410",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "ABS shell, rubberized grip",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "Removes the constant forearm pronation of flat mice",
            "Dual wireless (USB receiver + Bluetooth)",
            "Silent clicks for shared spaces",
          ],
          cons: [
            "3-5 day precision adjustment period is real",
            "Right-handed model only at present",
            "Not ideal for pixel-precision design work during adaptation",
          ],
          specs: [
            { label: "Angle", value: "57° vertical grip" },
            { label: "Buttons", value: "6, adjustable 800-2400 DPI" },
            { label: "Connection", value: "2.4 GHz USB + Bluetooth" },
            { label: "Battery", value: "Rechargeable, ~3 weeks per charge" },
          ],
          useCases: ["wrist-pain", "typing", "budget"],
          faq: [
            {
              question: "Will I get used to it?",
              answer:
                "Almost everyone does within a week. Keep your old mouse nearby for deadline days during the transition, then it usually gathers dust.",
            },
          ],
          seoTitle: "Vertical Ergonomic Mouse — 57° Grip Against Wrist Strain",
          seoDescription:
            "Vertical mouse that unloads forearm rotation, with honest notes on the adjustment week. Dual wireless, silent clicks, 6 buttons.",
        },
        {
          slug: "memory-wrist-rest-set",
          title: "Keyboard & Mouse Wrist Rest Set",
          subtitle: "Slow-rebound foam that positions wrists without propping them",
          description:
            "A matched set: full-width keyboard rest and mouse pad with integrated rest, in slow-rebound memory foam with a cool-touch lycra surface. The role of a wrist rest is orientation, not pressure: it keeps wrists neutral between keystrokes; you should not plant them while typing.\n\nThe non-slip bases stay put, and the foam height (18 mm) matches standard and low-profile keyboards alike.",
          shortDescription:
            "Memory-foam wrist rest set (keyboard + mouse) with cool-touch surface — keeps wrists neutral between keystrokes.",
          brand: "UprightWorks",
          sku: "ERG-WRIST1",
          gtin: null,
          price: 21.95,
          compareAtPrice: null,
          cost: 6.4,
          shippingCost: 3.6,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2425",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Memory foam, lycra cover, PU base",
          warranty: null,
          returnable: true,
          pros: [
            "Keeps wrists neutral between keystrokes",
            "Cool-touch surface avoids the sweaty-foam problem",
            "Matched heights for keyboard and mouse sides",
          ],
          cons: [
            "Wrists should hover while actively typing — a rest is for the pauses",
            "18 mm height suits standard boards; very thick gaming boards may need more",
          ],
          specs: [
            { label: "Keyboard rest", value: "44 × 8.5 × 1.8 cm" },
            { label: "Mouse pad", value: "25 × 20 cm with integrated rest" },
            { label: "Foam", value: "Slow-rebound memory foam" },
          ],
          useCases: ["wrist-pain", "typing", "budget"],
          faq: [
            {
              question: "Should my wrists rest on it while typing?",
              answer:
                "No — hover while typing, rest in the pauses. Planting wrists while typing creates the bend and pressure these rests exist to prevent.",
            },
          ],
          seoTitle: "Memory Foam Wrist Rest Set — Keyboard + Mouse, Cool-Touch",
          seoDescription:
            "Matched wrist rest set with honest usage guidance: hover while typing, rest between. Slow-rebound foam, non-slip bases.",
        },
        {
          slug: "felt-desk-mat",
          title: "Wool-Felt Desk Mat 80×33",
          subtitle: "A defined, quiet work zone that doubles as a forearm cushion",
          description:
            "A dense wool-felt desk mat that softens forearm contact with hard desk edges, quiets keyboard and mouse, and visually defines the work zone — a small ritual cue that helps remote workers start and stop the day.\n\n3 mm dense felt with a recycled-PET backing that stays flat without curling. Brush or vacuum clean; spot-clean spills quickly as felt is wool.",
          shortDescription:
            "3 mm wool-felt desk mat (80 × 33 cm) that cushions forearms, quiets peripherals and defines the work zone.",
          brand: "UprightWorks",
          sku: "ERG-MAT1",
          gtin: null,
          price: 27.5,
          compareAtPrice: null,
          cost: 8.6,
          shippingCost: 4.4,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2440",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "India",
          materials: "Wool felt, recycled-PET backing",
          warranty: null,
          returnable: true,
          pros: [
            "Cushions forearms against hard desk edges",
            "Noticeably quiets keyboard and mouse",
            "Lies flat from day one (dense 3 mm felt)",
          ],
          cons: [
            "Wool needs prompt spot-cleaning on spills",
            "Optical mice work fine on it; old laser mice can struggle on felt",
          ],
          specs: [
            { label: "Size", value: "80 × 33 cm" },
            { label: "Material", value: "3 mm wool felt, recycled-PET backing" },
            { label: "Care", value: "Vacuum/brush; spot-clean spills" },
          ],
          useCases: ["typing", "wrist-pain", "budget"],
          faq: [
            {
              question: "Does a mouse track properly on felt?",
              answer:
                "Modern optical mice track well on dense felt. Very old laser sensors can be finicky — if yours is, any thin pad on top solves it.",
            },
          ],
          seoTitle: "Wool-Felt Desk Mat 80×33 — Forearm Comfort & Quiet",
          seoDescription:
            "Dense wool-felt desk mat that cushions forearms and quiets your setup. Honest compatibility note for older laser mice.",
        },
        {
          slug: "cable-management-kit",
          title: "Under-Desk Cable Management Kit",
          subtitle: "Tray, sleeves and clips that clear the cable nest in 20 minutes",
          description:
            "Cable chaos is an ergonomic issue in disguise: it blocks leg room, snags chair wheels and makes sit-stand desks unusable. This kit clears it in one session — a 40 cm steel tray that screws or clamps under the desk, two zip-up neoprene sleeves, and 20 adhesive clips.\n\nEverything reusable and re-positionable; the tray holds a power strip so one cable leaves the desk.",
          shortDescription:
            "Complete under-desk cable kit: steel tray, 2 neoprene sleeves, 20 clips — clears leg room and makes sit-stand setups practical.",
          brand: "UprightWorks",
          sku: "ERG-CABLE1",
          gtin: null,
          price: 29.95,
          compareAtPrice: null,
          cost: 9.1,
          shippingCost: 4.8,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2455",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Powder-coated steel, neoprene, 3M adhesive",
          warranty: null,
          returnable: true,
          pros: [
            "Frees leg room and chair-wheel paths",
            "Essential prep for any sit-stand conversion",
            "Tray fits a full power strip — one cable to the wall",
          ],
          cons: [
            "Adhesive clips need 24 h cure time before loading",
            "Clamp mount needs a desk lip of at least 1.5 cm",
          ],
          specs: [
            { label: "Tray", value: "40 × 12 × 12 cm steel, screw or clamp mount" },
            { label: "Sleeves", value: "2 × 50 cm zip neoprene" },
            { label: "Clips", value: "20 adhesive, reusable" },
          ],
          useCases: ["standing", "movement", "budget", "compact"],
          faq: [
            {
              question: "Why does cable management matter for sit-stand desks?",
              answer:
                "Because every cable must survive the full height travel. Loose cables yank out of sockets at standing height — the tray-and-sleeve setup gives them a managed path.",
            },
          ],
          seoTitle: "Under-Desk Cable Management Kit — Tray, Sleeves & Clips",
          seoDescription:
            "Clear the cable nest in 20 minutes: steel under-desk tray, neoprene sleeves and reusable clips. Essential prep for sit-stand desks.",
        },
      ],
    },
  ],
  guides: [
    {
      slug: "fix-desk-neck-pain",
      title: "Desk Neck Pain: Find the Cause, Fix It for Under $50",
      excerpt:
        "Most desk-related neck pain traces to a screen that sits too low — typically a laptop flat on the desk. Raising the screen so its top edge reaches eye height, plus an external keyboard, fixes the geometry for under $50 in most setups.",
      body: `## The short answer

If your neck aches after screen time and you work on a laptop, the cause is almost certainly **screen height**. A laptop on the desk puts the display ~20 cm below neutral gaze, and your neck holds the difference — several extra kilograms of effective load — all day. The fix: raise the screen until its top edge is at eye height, add an external keyboard, done. In our catalog that is the aluminium laptop stand plus any keyboard you like.

## The 30-second self-diagnosis

- Sit as you normally work. Where do your eyes naturally land on the screen? If you look *down* more than slightly, the screen is too low.
- Check your shoulders: hunched forward usually follows a low screen or a desk that is too high.
- Check where the ache lives: base of the skull and upper trapezius point to screen height; between the shoulder blades often adds slouching — see the lumbar guide.

## Fix by setup type

### Laptop only

Laptop stand (raises 12-21 cm) + external keyboard and mouse. This is the under-$50-plus-keyboard fix that resolves the majority of cases. Typing on a raised laptop is *worse* than the original problem — the external keyboard is not optional.

### External monitor

The top edge belongs at eye height. Measure the gap; our 10 cm bamboo riser fits most average setups, while a gas-spring monitor arm covers any height and adds depth control (closer screen = less forward head lean).

### Two screens

Put the primary screen directly in front, secondary angled beside it. The classic mistake — both screens symmetric so you twist all day — keeps physiotherapists in business.

## What rarely helps (first)

- A new chair, when the screen is still 20 cm too low. Fix geometry top-down: screen, then arms, then seat.
- "Posture corrector" straps: passive devices that switch your muscles off rather than train them.
- Massage guns: pleasant, but they treat the symptom you re-create every workday.

## When to see a professional

Numbness or tingling in arms or hands, pain radiating below the elbow, or pain that persists for weeks after fixing the setup — clinician, not catalog. We sell desk gear, not medicine, and the distinction matters.`,
      seoTitle: "Desk Neck Pain: The Screen-Height Fix Explained (Under $50)",
      seoDescription:
        "Self-diagnose desk neck pain in 30 seconds and fix the usual cause — a too-low screen — with a stand and external keyboard. Honest non-fixes listed.",
      relatedProductSlugs: ["alu-laptop-stand", "bamboo-monitor-riser", "monitor-arm-single"],
    },
    {
      slug: "lower-back-pain-at-desk",
      title: "Lower Back Pain at the Desk: What Helps, in Order",
      excerpt:
        "Desk-related lower-back ache usually comes from unsupported slouching plus too many static hours. The fix order that works: support the lumbar curve, get feet planted, then add movement — lumbar cushion, footrest if needed, and breaks every 30-45 minutes.",
      body: `## The short answer

For typical desk-related lower-back ache: **(1) support the lumbar curve, (2) plant your feet, (3) move more often.** A lumbar cushion handles the first, a footrest the second if your feet do not rest flat, and a timer — or our balance cushion used in intervals — drives the third. Persistent or radiating pain is a clinician's job, full stop.

## Why sitting hurts backs

Upright spines hold a natural inward curve at the lower back. After 20-30 minutes of sitting, the muscles maintaining it fatigue, you slide into a C-shaped slouch, and load shifts onto passive structures — discs and ligaments — that complain by mid-afternoon. The pattern is boring and almost universal.

## Step 1: Support the curve

A contoured lumbar cushion fills the gap between your lower back and the chair so the curve survives hour three. Strap height matters: the bulge belongs in the small of your back, just above the belt line. Our contour cushion's two straps keep it there.

Reality check we publish on the product page too: a cushion improves a decent chair. It does not resurrect a chair with a collapsed backrest.

## Step 2: Plant your feet

Feet dangling or tucked under the chair tilt the pelvis and undo the lumbar support above. Quick test: seat at elbow height for the desk — do your heels lift? If yes, the tilt footrest closes the gap. If your feet already rest flat, skip this purchase; we would rather you not buy it.

## Step 3: Add movement

The best posture is the next one. Practical doses:

- Stand or walk 2-3 minutes every 30-45 minutes — calendar reminders work.
- Balance cushion in 20-40 minute intervals to keep postural muscles engaged.
- If budget allows, a sit-stand converter makes alternating effortless — alternation, not all-day standing, is the benefit.

## Spending guide

- Under $40: lumbar cushion — biggest single improvement for most.
- Under $90: + footrest or balance cushion depending on your test above.
- Around $230: + sit-stand converter for full posture rotation.

## Red flags — skip the shop, see a professional

Pain radiating down a leg, numbness or tingling, night pain, or no improvement after 2-3 weeks of better setup and movement. Desk gear addresses desk strain; it does not treat medical conditions.`,
      seoTitle: "Lower Back Pain at the Desk — The 3-Step Fix Order",
      seoDescription:
        "Support the lumbar curve, plant your feet, move every 30-45 minutes: the evidence-aware fix order for desk back ache, with honest red flags.",
      relatedProductSlugs: ["contour-lumbar-cushion", "tilt-footrest", "balance-cushion", "sit-stand-converter"],
    },
    {
      slug: "home-office-setup-budget",
      title: "The Complete Home-Office Ergonomics Setup, by Budget",
      excerpt:
        "A healthy home office is built in a fixed order — screen height, then seating support, then wrists, then movement — and the first three cost under $120 combined. Here is the exact sequence with honest skip-conditions for each purchase.",
      body: `## The short answer

Build in this order: **screen height → seating support → wrist setup → movement tools.** Each layer assumes the previous one; buying in reverse (the classic: expensive chair, laptop still flat on the desk) wastes most of the money. The first three layers together cost under $120 in our catalog.

## Layer 1: Screen height (~$40)

The non-negotiable foundation. Laptop workers: stand + external keyboard. Monitor workers: riser or arm until the top edge of the screen meets eye height. Every other purchase builds on this geometry — skip it and the rest underperforms.

## Layer 2: Seating support (~$37-79)

With the screen right, fix the chair you have before replacing it: lumbar cushion for the curve, footrest only if the heel-lift test says so (seat at elbow height — do heels lift?). A $37 cushion on a mediocre chair beats a mediocre cushion-less posture on the same chair; neither equals a genuinely good chair, which is a future upgrade, not a prerequisite.

## Layer 3: Wrists (~$22-57)

Wrist ache or forearm tightness after long days: vertical mouse (removes constant forearm rotation; allow the 3-5 day adjustment) and a wrist rest set used correctly — hover while typing, rest between bursts.

## Layer 4: Movement (~$27-219)

The layer people buy first and should buy last, because it only pays off on top of correct geometry. Balance cushion for active-sitting intervals; sit-stand converter if you want real position rotation through the day. Standing all day is not the goal — alternating is.

## Three budgets, honestly

- **$60:** laptop stand + lumbar cushion. Covers the two highest-impact fixes.
- **$130:** + vertical mouse, wrist rest set, footrest if the test says so.
- **$350:** + sit-stand converter and cable kit (sit-stand without cable management is a daily fight).

## The skip-list

Things we sell that *you* specifically might not need: footrest (feet already flat? skip), balance cushion (already exercise regularly? lower priority), desk mat (comfort, not therapy — buy it for the feel, not the back).`,
      seoTitle: "Home Office Ergonomics by Budget: The Right Buying Order",
      seoDescription:
        "Screen, seat, wrists, movement — the buying order that makes every dollar count, with three honest budget tiers and a skip-list.",
      relatedProductSlugs: ["alu-laptop-stand", "contour-lumbar-cushion", "vertical-mouse", "sit-stand-converter"],
    },
  ],
  comparison: {
    slug: "screen-height-comparison",
    title: "Screen-Height Fixes Compared: Stand vs Riser vs Arm vs Converter",
    excerpt:
      "Four ways to fix the most common desk problem: the laptop stand for laptop workers, the riser for simple monitor setups, the arm for full adjustability, the converter when you want standing too.",
    body: "All four products in this comparison solve the same root problem — a screen below eye height — at different points on the price/flexibility curve. The laptop stand is the answer if your screen is a laptop. The bamboo riser is the no-moving-parts answer for a monitor that needs about 10 cm. The gas-spring arm covers any height plus depth and rotation. The sit-stand converter solves height and adds the sit/stand rotation on top.\n\nPick by setup, not by price: an expensive converter under a screen you never stand at is the most common over-purchase we see.",
    seoTitle: "Laptop Stand vs Monitor Riser vs Arm vs Sit-Stand Converter",
    seoDescription:
      "Four screen-height fixes compared on height range, flexibility, load and price — with guidance to pick by setup, not by budget.",
    productSlugs: ["alu-laptop-stand", "bamboo-monitor-riser", "monitor-arm-single", "sit-stand-converter"],
  },
  homepageFaq: [
    {
      question: "I ache after a workday — where do I start?",
      answer:
        "Neck and shoulders: fix screen height first (usually a laptop stand plus external keyboard). Lower back: lumbar support plus movement breaks. Our two guides walk through the self-diagnosis in under a minute each.",
    },
    {
      question: "Where do orders ship from?",
      answer:
        "Directly from partner supplier warehouses, typically arriving in 6-13 business days with tracking. We publish the real window on every product page and do not claim local stock we don't hold.",
    },
    {
      question: "What is the 30-day comfort guarantee?",
      answer:
        "If a product does not improve your setup, return it within 30 days in resaleable condition for a full refund. Email care@ergonomikontor.example and we send instructions within one business day.",
    },
    {
      question: "Will a lumbar cushion fix my back pain?",
      answer:
        "It reduces the slouching strain behind much desk-related ache. Pain that radiates, tingles or persists belongs with a clinician — we say this on every relevant product page.",
    },
    {
      question: "Why no customer star ratings?",
      answer:
        "We have not collected enough verified reviews yet and will not invent them. You get measured specs, honest pros and cons, and a 30-day guarantee instead.",
    },
  ],
};

export const ergonomicPolicies = {
  privacyPolicy: defaultPrivacyPolicy(info),
  termsOfSale: defaultTermsOfSale(info),
};

```


---

## prisma/seed-data/hiking-gear.ts

```ts
import {
  defaultPrivacyPolicy,
  defaultTermsOfSale,
  type SeedStore,
  type SeedStoreInfo,
} from "./types";

/** Hiking gear store: rugged, practical brand. */

const info: SeedStoreInfo = {
  slug: "hiking-gear",
  name: "Ridgeline Supply",
  legalName: "Ridgeline Supply Commerce ApS",
  primaryDomain: "turklar.example",
  locale: "en-US",
  currency: "USD",
  niche: "hiking gear",
  positioning:
    "Trail gear rated by weight, weather resistance and field durability — the three numbers that matter at kilometer twenty. We publish measured weights (not 'from' weights), state real waterproof ratings, and skip gear that only works in the product photo.",
  audience: "day hikers and weekend backpackers",
  valueProposition: "Gear that earns its place in your pack",
  brandVoice: "rugged, practical, no-nonsense",
  logoText: "RIDGELINE",
  supportEmail: "trail@turklar.example",
  supportPhone: null,
  shippingOriginDisclosure:
    "Orders ship from our partner suppliers' warehouses, typically arriving in 6-14 business days with tracking. We don't hold local stock — plan gear orders before the trip, not the night before.",
  defaultShippingDaysMin: 6,
  defaultShippingDaysMax: 14,
  returnPolicySummary:
    "30-day returns on unused gear with tags; field-tested gear that fails within warranty is replaced or refunded — that's what warranties are for.",
};

export const hikingSeed: SeedStore = {
  store: info,
  theme: {
    primaryColor: "#166534",
    secondaryColor: "#14261b",
    accentColor: "#ca8a04",
    backgroundColor: "#f7f8f5",
    textColor: "#1a2419",
    borderRadius: "0.375rem",
    fontHeading: "geometric",
    fontBody: "system-ui",
  },
  domains: ["turklar.example", "www.turklar.example"],
  categories: [
    {
      slug: "packs-bags",
      name: "Packs & Bags",
      description:
        "Daypacks, dry bags and pack accessories with measured weights and honest volume numbers — because a '20L' pack that holds 14 liters ruins more hikes than rain does.",
      seoTitle: "Hiking Daypacks & Dry Bags — Measured Weights | Ridgeline",
      seoDescription:
        "Daypacks and dry bags with honestly measured weights and volumes. Real water-resistance ratings, no 'from' weights, transparent shipping.",
      heroTitle: "Packs with honest numbers",
      heroSubtitle:
        "Measured weights and real volumes on every pack — the two specs the industry fudges most.",
      sortOrder: 1,
      products: [
        {
          slug: "crest-22-daypack",
          title: "Crest 22 Daypack",
          subtitle: "A 22-liter do-everything daypack at a measured 740 g",
          description:
            "The Crest 22 is the pack for 90% of day hikes: 22 measured liters (we fill packs with beans to check — this one is a true 22), a ventilated back panel that actually channels air, and hip-belt pockets sized for a phone and snacks.\n\nAt 740 g measured it is not the lightest 22-liter pack made, and we will not pretend otherwise — the weight buys a frame sheet, real padding and 210D fabric that survives granite scrapes. Rain cover included and stowed in the bottom pocket.",
          shortDescription:
            "True-22-liter daypack at 740 g measured: ventilated back, hip-belt pockets, included rain cover, 210D fabric.",
          brand: "Ridgeline",
          sku: "HIK-CREST22",
          gtin: null,
          price: 64.95,
          compareAtPrice: null,
          cost: 22.4,
          shippingCost: 6.8,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4110",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "Vietnam",
          materials: "210D ripstop nylon, PU coating",
          warranty: "24-month warranty on seams and zips",
          returnable: true,
          pros: [
            "True 22 L — we measure, not estimate",
            "Ventilated back panel that actually moves air",
            "Rain cover included, not sold separately",
            "Hip-belt pockets fit phone + snacks",
          ],
          cons: [
            "740 g is mid-weight; ultralighters will want the Featherline",
            "No dedicated hydration port (route the hose over the top)",
          ],
          specs: [
            { label: "Volume", value: "22 L (measured)" },
            { label: "Weight", value: "740 g (measured)" },
            { label: "Fabric", value: "210D ripstop nylon, PU-coated" },
            { label: "Back", value: "Ventilated channel panel" },
            { label: "Included", value: "Rain cover" },
          ],
          useCases: ["day-hike", "summer", "comfort", "padded"],
          faq: [
            {
              question: "Is 22 liters enough for a full-day hike?",
              answer:
                "For three-season day hiking: yes — layers, lunch, water, first aid and a headlamp fit with room over. Winter kit or pack-the-kids duty wants 28-35 L.",
            },
          ],
          seoTitle: "Crest 22 Daypack — True 22L, 740 g Measured, Rain Cover Included",
          seoDescription:
            "A do-everything 22L daypack with honestly measured volume and weight, ventilated back and included rain cover.",
        },
        {
          slug: "featherline-18-ultralight",
          title: "Featherline 18 Ultralight Pack",
          subtitle: "280 g packable pack that disappears until you need it",
          description:
            "The Featherline 18 weighs 280 g and stuffs into its own chest pocket — the pack for summit pushes from a base pack, travel days and fast-and-light missions.\n\nUltralight honesty: 30D fabric trades durability for weight. It shrugs off brush and normal use but will not love granite hauling or 12 kg loads. No frame, minimal padding — pack soft items against your back. Used within its limits it is a brilliant tool; used as a daily hauler it will wear, and we would rather tell you now.",
          shortDescription:
            "280 g ultralight 18L pack that stuffs into its own pocket — for summit pushes and travel, with honest durability limits.",
          brand: "Ridgeline",
          sku: "HIK-FTHR18",
          gtin: null,
          price: 34.95,
          compareAtPrice: null,
          cost: 8.7,
          shippingCost: 3.4,
          stockStatus: "IN_STOCK",
          supplierName: "MockSupply Co",
          supplierProductId: "MS-1005",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "30D ripstop nylon",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "280 g — you stop noticing it's there",
            "Stuffs into its own pocket, lives in any travel bag",
            "True 18 L when deployed",
          ],
          cons: [
            "30D fabric: not for rock-hauling or heavy loads",
            "No frame or padding — load discipline required",
            "Comfort ceiling around 6-7 kg",
          ],
          specs: [
            { label: "Volume", value: "18 L (measured)" },
            { label: "Weight", value: "280 g (measured)" },
            { label: "Fabric", value: "30D ripstop nylon" },
            { label: "Packed size", value: "Fits own 14 × 10 cm pocket" },
          ],
          useCases: ["ultralight", "day-hike", "summer", "multi-day"],
          faq: [
            {
              question: "Can it be my only hiking pack?",
              answer:
                "If your hikes are light and short, yes. If you carry winter layers, much water or camera gear, the Crest 22's structure earns its extra 460 g fast.",
            },
          ],
          seoTitle: "Featherline 18 — 280 g Ultralight Packable Daypack",
          seoDescription:
            "Ultralight 18L pack at a measured 280 g with honest durability limits: brilliant within them, wrong tool outside them.",
        },
        {
          slug: "drysack-set",
          title: "Dry Sack 3-Set (5/10/20 L)",
          subtitle: "Roll-top organization that keeps the spare layer actually dry",
          description:
            "Three roll-top dry sacks in the sizes that map to real packing: 5 L (electronics, first aid), 10 L (spare clothes), 20 L (sleeping bag or the whole base layer system). Taped seams and 70D fabric — these are genuine dry sacks, not the coated stuff bags that wick at the seams.\n\nRoll three turns minimum and buckle: that is the technique, and it is on the label too. Different colors end the which-bag-is-it rummage.",
          shortDescription:
            "Three taped-seam roll-top dry sacks (5/10/20 L) in different colors — real waterproofing for the gear that must stay dry.",
          brand: "Ridgeline",
          sku: "HIK-DRY3",
          gtin: null,
          price: 28.5,
          compareAtPrice: null,
          cost: 8.2,
          shippingCost: 3.6,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4140",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "70D nylon, TPU lamination, taped seams",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "Taped seams — actually waterproof, not water-resistant-ish",
            "Sizes match real packing categories",
            "Color-coded against pack rummage",
          ],
          cons: [
            "Submersion-rated they are not — these are rain-and-river-splash sacks",
            "Roll-top technique matters: three turns minimum",
          ],
          specs: [
            { label: "Sizes", value: "5 L + 10 L + 20 L" },
            { label: "Fabric", value: "70D nylon, TPU laminated" },
            { label: "Seams", value: "Fully taped" },
            { label: "Weight", value: "215 g total (measured)" },
          ],
          useCases: ["rain", "waterproof", "multi-day", "day-hike"],
          faq: [
            {
              question: "Are these submersible?",
              answer:
                "No — roll-tops handle rain, splashes and brief dunks, not sustained submersion. For packraft-style swimming loads, you need submersion-rated bags at several times the price.",
            },
          ],
          seoTitle: "Dry Sack 3-Set (5/10/20 L) — Taped Seams, Honest Ratings",
          seoDescription:
            "Roll-top dry sacks with taped seams in the three sizes packing actually uses. Honest rating: rainproof yes, submersible no.",
        },
        {
          slug: "pack-rain-cover",
          title: "Universal Pack Rain Cover 20-35 L",
          subtitle: "For the packs that didn't come with one",
          description:
            "A sized-right rain cover for 20-35 L packs with an elastic hem, a cinch cord, and the detail cheap covers skip: a small buckle strap that anchors it to the pack so gusts cannot balloon it off the top.\n\nReflective logo for road sections, stuff sack included. Reality note printed on the box: in driving rain, covers protect from above while shoulder-strap runoff wets the back panel — line critical gear in dry sacks regardless.",
          shortDescription:
            "Anchored rain cover for 20-35 L packs with cinch hem and stuff sack — plus the honest advice to still use dry sacks.",
          brand: "Ridgeline",
          sku: "HIK-RAINCVR",
          gtin: null,
          price: 14.95,
          compareAtPrice: null,
          cost: 3.8,
          shippingCost: 2.6,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4155",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "190T polyester, PU 3000 mm coating",
          warranty: null,
          returnable: true,
          pros: [
            "Anchor strap stops gusts stealing it — the cheap-cover failure",
            "True 20-35 L sizing with cinch adjustment",
            "27 g packed, lives in the pack lid",
          ],
          cons: [
            "No cover seals shoulder-strap runoff — dry sacks remain the real insurance",
          ],
          specs: [
            { label: "Fits", value: "20-35 L packs" },
            { label: "Coating", value: "PU 3000 mm" },
            { label: "Weight", value: "27 g (measured)" },
            { label: "Anchor", value: "Buckle strap to pack body" },
          ],
          useCases: ["rain", "waterproof", "day-hike", "budget"],
          faq: [
            {
              question: "Does my Crest 22 need this?",
              answer:
                "No — the Crest 22 ships with its own cover. This one is for packs that came without, or as a replacement for one donated to the wind.",
            },
          ],
          seoTitle: "Pack Rain Cover 20-35 L — Anchored Against Gusts",
          seoDescription:
            "Universal hiking pack rain cover with anchor strap and honest limits: tops yes, strap runoff no — keep using dry sacks.",
        },
      ],
    },
    {
      slug: "trail-essentials",
      name: "Trail Essentials",
      description:
        "The kit that earns permanent pack residency: trekking poles, headlamps, water filtration and first aid — selected by the grams-to-usefulness ratio.",
      seoTitle: "Trail Essentials: Poles, Headlamps & Filters | Ridgeline",
      seoDescription:
        "Trekking poles, headlamps, water filters and first-aid kits chosen by grams-to-usefulness ratio. Measured weights, honest runtimes.",
      heroTitle: "The permanent residents of a good pack",
      heroSubtitle:
        "Poles, light, water and first aid — the four categories that turn a walk into a capable hike.",
      sortOrder: 2,
      products: [
        {
          slug: "carbon-cork-poles",
          title: "Carbon Trekking Poles, Cork Grip (Pair)",
          subtitle: "228 g per pole, flick-locks that hold, cork that molds to your hands",
          description:
            "Carbon poles at 228 g each (measured) with the two features that separate good poles from pole-shaped objects: metal flick-locks that hold under full body weight, and real cork grips that wick sweat and mold to your grip over a season.\n\nPoles reduce knee load meaningfully on descents — that is the science-backed reason to carry them. Carbide tips for rock and dirt, snow baskets included for shoulder-season use.",
          shortDescription:
            "Carbon trekking poles (228 g/pole measured) with metal flick-locks and cork grips; carbide tips, snow baskets included.",
          brand: "Ridgeline",
          sku: "HIK-POLES1",
          gtin: null,
          price: 74.95,
          compareAtPrice: null,
          cost: 26.2,
          shippingCost: 7.2,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4210",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "China",
          materials: "3K carbon shafts, cork grips, carbide tips",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "228 g per pole — carbon where it counts",
            "Metal flick-locks hold under real load",
            "Cork grips outclass foam in sweat and comfort",
            "Snow baskets included",
          ],
          cons: [
            "Carbon snaps where aluminium bends — pack mules choose alu",
            "Cork needs a season to reach peak comfort",
          ],
          specs: [
            { label: "Weight", value: "228 g per pole (measured)" },
            { label: "Length", value: "62-135 cm, flick-lock" },
            { label: "Shaft", value: "3K carbon" },
            { label: "Grip", value: "Natural cork + EVA choke-up" },
            { label: "Tips", value: "Carbide, rubber caps included" },
          ],
          useCases: ["multi-day", "day-hike", "comfort", "winter", "ultralight"],
          faq: [
            {
              question: "Carbon or aluminium?",
              answer:
                "Carbon is lighter and damps vibration; aluminium bends instead of snapping under abuse. For most hikers carbon is the upgrade; for expedition loads or rough treatment, aluminium forgives more.",
            },
          ],
          seoTitle: "Carbon Trekking Poles with Cork Grips — 228 g Measured",
          seoDescription:
            "Carbon flick-lock trekking poles with cork grips and carbide tips. The honest carbon-vs-aluminium trade-off, explained.",
        },
        {
          slug: "ridgebeam-450-headlamp",
          title: "Ridgebeam 450 Headlamp",
          subtitle: "450 real lumens, USB-C, and a runtime chart you can trust",
          description:
            "A headlamp with honest numbers: 450 lumens on boost (10-minute bursts), 250 lumens for 4 hours, 30 lumens for 40 hours. Published as a chart because 'up to 450 lumens, up to 40 hours' — implying both at once — is the industry's favorite lie.\n\nUSB-C charging, red mode that preserves night vision and tent diplomacy, IPX5 rain rating, and a lockout that stops it igniting inside your pack.",
          shortDescription:
            "450-lumen USB-C headlamp with an honest runtime chart, red mode, IPX5 rating and transport lockout.",
          brand: "Ridgeline",
          sku: "HIK-BEAM450",
          gtin: null,
          price: 39.95,
          compareAtPrice: null,
          cost: 12.8,
          shippingCost: 3.8,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4225",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "PC housing, elastic strap",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "Runtime chart published per mode — no 'up to' games",
            "USB-C — one cable for everything",
            "Red mode + pack lockout",
            "78 g with strap (measured)",
          ],
          cons: [
            "Boost mode is thermally limited to bursts (physics, on every lamp)",
            "IPX5 = rain, not submersion",
          ],
          specs: [
            { label: "Output", value: "450 lm boost / 250 lm high / 30 lm low" },
            { label: "Runtime", value: "4 h @ 250 lm, 40 h @ 30 lm" },
            { label: "Battery", value: "1200 mAh, USB-C" },
            { label: "Rating", value: "IPX5" },
            { label: "Weight", value: "78 g (measured)" },
          ],
          useCases: ["day-hike", "multi-day", "winter", "navigation"],
          faq: [
            {
              question: "Why does every headlamp's battery claim seem false?",
              answer:
                "Because 'up to X lumens' and 'up to Y hours' are different modes advertised side by side. Our chart shows which runtime belongs to which brightness — the honest version every lamp should publish.",
            },
          ],
          seoTitle: "Ridgebeam 450 Headlamp — Honest Runtime Chart, USB-C",
          seoDescription:
            "450-lumen headlamp with per-mode runtime published honestly, red mode, lockout and IPX5. 78 g measured.",
        },
        {
          slug: "squeeze-filter-kit",
          title: "Squeeze Water Filter Kit",
          subtitle: "0.1-micron hollow fiber — drink from streams, skip the carry weight",
          description:
            "A 65 g hollow-fiber filter (0.1 micron) that removes bacteria and protozoa from wild water sources — the technology that lets you carry one bottle and a filter instead of three liters. Kit includes two 1 L squeeze pouches, backflush syringe and bottle-thread adapter.\n\nHonest scope: hollow fiber handles biological contamination, not viruses (rare in mountain streams in most temperate regions) or chemical pollution — choose sources accordingly. Critical care note: a frozen filter is a dead filter; sleep with it in cold weather.",
          shortDescription:
            "65 g hollow-fiber squeeze filter (0.1 micron) with pouches and backflush kit — biological filtration for wild water.",
          brand: "Ridgeline",
          sku: "HIK-FILTER1",
          gtin: null,
          price: 32.95,
          compareAtPrice: null,
          cost: 9.4,
          shippingCost: 3.2,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4240",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "United States",
          materials: "Hollow-fiber membrane, BPA-free housing",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "65 g replaces liters of carried water",
            "0.1 micron: bacteria and protozoa filtered",
            "Backflushable for thousands of liters of life",
            "Threads onto standard soda bottles",
          ],
          cons: [
            "Does not remove viruses or chemicals — pick sources sensibly",
            "Freezing destroys the membrane invisibly — pocket it in cold",
            "Flow slows when overdue for a backflush",
          ],
          specs: [
            { label: "Filtration", value: "0.1 micron hollow fiber" },
            { label: "Removes", value: "Bacteria, protozoa, microplastics" },
            { label: "Weight", value: "65 g filter only" },
            { label: "Included", value: "2 × 1 L pouches, syringe, adapter" },
          ],
          useCases: ["multi-day", "ultralight", "day-hike", "summer", "expedition"],
          faq: [
            {
              question: "Can I drink from any stream with this?",
              answer:
                "It handles the biological risks of typical mountain and forest streams. It does not remove agricultural chemicals or viruses — filter upstream of grazing and settlements, not downstream.",
            },
          ],
          seoTitle: "Squeeze Water Filter Kit — 0.1 Micron, 65 g, Honest Limits",
          seoDescription:
            "Hollow-fiber squeeze filter with pouches and backflush kit. What it removes, what it doesn't, and why frozen filters die.",
        },
        {
          slug: "trail-first-aid",
          title: "Trail First Aid Kit",
          subtitle: "The realistic kit: blisters, cuts, sprains — 230 g, IPX-rated pouch",
          description:
            "A first-aid kit built around what actually goes wrong on day hikes and weekenders: blister care (the most-used compartment by far), wound cleaning and closure, an elastic bandage for sprains, tick tweezers and an emergency blanket. 230 g in a welded waterproof pouch.\n\nNo expedition theater — no airway kit you have no training for — just the high-frequency items, organized so cold hands find them. Refill the used items; the pouch outlasts many seasons.",
          shortDescription:
            "Realistic 230 g first-aid kit in a waterproof pouch: blister care, wounds, sprains, ticks, emergency blanket.",
          brand: "Ridgeline",
          sku: "HIK-FAID1",
          gtin: null,
          price: 26.95,
          compareAtPrice: null,
          cost: 7.8,
          shippingCost: 3.4,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4255",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "Welded TPU pouch, CE-marked contents",
          warranty: null,
          returnable: true,
          pros: [
            "Blister module first — matching actual trail injury statistics",
            "Welded waterproof pouch, organized compartments",
            "230 g: light enough to never leave the pack",
          ],
          cons: [
            "A kit is not training — know how to use what you carry",
            "Personal medications: add your own",
          ],
          specs: [
            { label: "Weight", value: "230 g (measured)" },
            { label: "Pouch", value: "Welded TPU, waterproof" },
            { label: "Contents", value: "42 items incl. blister kit, elastic bandage" },
            { label: "Extras", value: "Tick tweezers, emergency blanket" },
          ],
          useCases: ["day-hike", "multi-day", "comfort", "expedition"],
          faq: [
            {
              question: "What's the most-used item in a trail first-aid kit?",
              answer:
                "Blister supplies, by a wide margin — which is why this kit leads with a full blister module instead of burying two plasters under expedition gear.",
            },
          ],
          seoTitle: "Trail First Aid Kit — Realistic 230 g Kit, Waterproof Pouch",
          seoDescription:
            "First-aid kit built around real trail statistics: blisters first, wounds and sprains covered, zero expedition theater. 230 g.",
        },
      ],
    },
    {
      slug: "camp-comfort",
      name: "Camp & Comfort",
      description:
        "The overnight layer: sleeping pads, camp stoves, insulated bottles and sit pads — judged on warmth-to-weight honesty and whether they survive season three.",
      seoTitle: "Camp Gear: Pads, Stoves & Bottles | Ridgeline Supply",
      seoDescription:
        "Sleeping pads with real R-values, fast camp stoves and insulated bottles — overnight gear rated on honest warmth-to-weight numbers.",
      heroTitle: "Sleep warm, eat hot, carry less",
      heroSubtitle:
        "Overnight gear with the R-values and boil times printed honestly — comfort at camp is what makes day two good.",
      sortOrder: 3,
      products: [
        {
          slug: "alpine-pad-r4",
          title: "Alpine Sleeping Pad R4.2",
          subtitle: "Real R-value 4.2 at 480 g — three-season warmth that packs small",
          description:
            "An insulated air pad with an honest, standardized R-value of 4.2 — genuinely warm enough for three-season ground including frosty shoulder-season nights. 480 g measured, packs to a 1-liter bottle size, 7 cm thick for side sleepers.\n\nThe included pump sack inflates it in 90 seconds without lightheadedness and keeps moisture out of the pad (moist breath inside an insulated pad degrades it over years). Field repair kit included; punctures happen, dead pads from one thorn should not.",
          shortDescription:
            "Insulated air pad with standardized R4.2 at 480 g measured — 7 cm thick, pump sack and repair kit included.",
          brand: "Ridgeline",
          sku: "HIK-PADR4",
          gtin: null,
          price: 89.95,
          compareAtPrice: null,
          cost: 32.6,
          shippingCost: 7.8,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4310",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "Taiwan",
          materials: "30D ripstop top, synthetic insulation",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "Standardized R4.2 — real three-season warmth",
            "7 cm thick: side sleepers sleep",
            "Pump sack included (faster, and keeps breath moisture out)",
            "Repair kit in the stuff sack",
          ],
          cons: [
            "Air pads crinkle; light sleepers should know",
            "480 g is mid-pack: summer-only hikers can go lighter",
          ],
          specs: [
            { label: "R-value", value: "4.2 (standardized)" },
            { label: "Weight", value: "480 g (measured)" },
            { label: "Thickness", value: "7 cm" },
            { label: "Size", value: "183 × 59 cm; packs to 24 × 11 cm" },
            { label: "Included", value: "Pump sack, repair kit" },
          ],
          useCases: ["multi-day", "winter", "insulation", "comfort", "expedition"],
          faq: [
            {
              question: "What does R-value actually mean?",
              answer:
                "Resistance to heat loss into the ground — the number that decides whether you sleep warm. R2 is summer-only, R4+ covers frost, R6+ is winter. The ground steals more heat than the air does.",
            },
          ],
          seoTitle: "Alpine Sleeping Pad — Real R4.2, 480 g, Pump Sack Included",
          seoDescription:
            "Three-season insulated pad with standardized R4.2 and honest weight. R-value explained so you buy warmth, not marketing.",
        },
        {
          slug: "ridgeline-stove-kit",
          title: "Ridgeline Stove + 750 ml Pot Kit",
          subtitle: "Boils 500 ml in ~3.5 min; everything nests into the pot",
          description:
            "A canister-top stove and 750 ml hard-anodized pot that nest together with a 100 g gas canister inside — one fist-sized package that makes hot food and coffee a default instead of a production.\n\nHonest numbers: ~3.5 minutes to boil 500 ml in calm conditions; wind stretches that badly, so use natural windbreaks (a foam windscreen wrapped around a canister stove is a safety risk — it overheats the canister). Piezo igniter plus the matches you should carry anyway.",
          shortDescription:
            "Nesting stove kit: canister-top burner + 750 ml pot, ~3.5 min boils, piezo ignition — hot meals as the default.",
          brand: "Ridgeline",
          sku: "HIK-STOVE1",
          gtin: null,
          price: 44.95,
          compareAtPrice: null,
          cost: 15.2,
          shippingCost: 4.6,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4325",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "China",
          materials: "Hard-anodized aluminium pot, stainless/brass burner",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "Stove + pot + small canister nest into one unit",
            "~3.5 min boils (500 ml, calm) — honest, conditions stated",
            "Piezo ignition with manual backup recommended",
          ],
          cons: [
            "Canister stoves weaken below ~-5°C (liquid fuel territory)",
            "Wind murders boil times — plan your kitchen spot",
            "Gas canister not included (shipping rules)",
          ],
          specs: [
            { label: "Boil time", value: "~3.5 min / 500 ml, calm conditions" },
            { label: "Pot", value: "750 ml hard-anodized aluminium" },
            { label: "Weight", value: "318 g kit (measured, no canister)" },
            { label: "Ignition", value: "Piezo + carry matches" },
          ],
          useCases: ["multi-day", "comfort", "winter", "expedition"],
          faq: [
            {
              question: "Why is no gas canister included?",
              answer:
                "Pressurized canisters can't ship by standard air freight. Every outdoor shop and most supermarkets near trailheads stock the standard screw-thread canisters this uses.",
            },
          ],
          seoTitle: "Ridgeline Stove Kit — Nesting 750 ml Pot, Honest Boil Times",
          seoDescription:
            "Canister stove and pot kit that nests into one unit. Real boil times with conditions stated, plus cold-weather limits explained.",
        },
        {
          slug: "summit-bottle-insulated",
          title: "Summit Insulated Bottle 750 ml",
          subtitle: "Hot 10 hours, cold 22 — and it survives being dropped on rock",
          description:
            "A double-wall vacuum bottle in 18/8 stainless that holds heat through a winter day (10 h hot tested at 20°C ambient, 22 h cold) and shrugs off the drops that dent thinner bottles. Two lids included: a sip lid for the move and a sealed cap for the pack.\n\nThe honest trade-off of all vacuum bottles: 365 g empty. In summer, carry the weight only if you want cold water at the summit badly enough; in winter, a hot drink at the turnaround is worth double the grams.",
          shortDescription:
            "750 ml vacuum bottle: 10 h hot / 22 h cold tested, dent-resistant 18/8 steel, two lids included. 365 g — an honest trade-off.",
          brand: "Ridgeline",
          sku: "HIK-BOTTLE1",
          gtin: null,
          price: 29.95,
          compareAtPrice: null,
          cost: 8.9,
          shippingCost: 4.2,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4340",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "18/8 stainless steel, double-wall vacuum",
          warranty: "24-month warranty on vacuum seal",
          returnable: true,
          pros: [
            "10 h hot / 22 h cold — tested, conditions stated",
            "Survives rock drops that kill thin-wall bottles",
            "Two lids: sip for the trail, sealed for the pack",
          ],
          cons: [
            "365 g empty — summer hikers may prefer a plastic bottle + filter",
            "Hand-wash; dishwashers age the vacuum seal",
          ],
          specs: [
            { label: "Volume", value: "750 ml" },
            { label: "Insulation", value: "10 h hot / 22 h cold (20°C ambient)" },
            { label: "Steel", value: "18/8 stainless, BPA-free lids" },
            { label: "Weight", value: "365 g (measured)" },
          ],
          useCases: ["winter", "day-hike", "comfort", "insulation"],
          faq: [
            {
              question: "Is it worth the weight in summer?",
              answer:
                "Honestly, often not — a plastic bottle and the squeeze filter weigh less combined. The bottle earns its place when temperature matters: winter hikes, hot coffee, all-day cold water in heat waves.",
            },
          ],
          seoTitle: "Summit Insulated Bottle 750 ml — 10 h Hot, Tested Honestly",
          seoDescription:
            "Vacuum bottle with tested insulation times and the honest weight trade-off per season. Dent-resistant, two lids included.",
        },
        {
          slug: "foam-sit-pad",
          title: "Folding Foam Sit Pad",
          subtitle: "60 grams between you and cold, wet, sharp everything",
          description:
            "The highest comfort-per-gram item in hiking: a folding closed-cell foam pad that turns wet logs, snowy rocks and frozen ground into seats. 60 g, indestructible, and it doubles as a knee pad for tent pitching, a boost under your sleeping pad's R-value at the hips, and emergency splint padding.\n\nClosed-cell foam absorbs nothing — sit in a puddle, stand up dry. It clips to any pack's exterior, which is where it lives between breaks.",
          shortDescription:
            "60 g folding closed-cell sit pad — dry warm seats anywhere, plus half a dozen secondary uses. The best grams in your pack.",
          brand: "Ridgeline",
          sku: "HIK-SITPAD",
          gtin: null,
          price: 12.95,
          compareAtPrice: null,
          cost: 3.1,
          shippingCost: 2.8,
          stockStatus: "IN_STOCK",
          supplierName: "MockSupply Co",
          supplierProductId: "MS-3201",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "IXPE closed-cell foam",
          warranty: null,
          returnable: true,
          pros: [
            "60 g for warm dry seating anywhere, all year",
            "Closed-cell: absorbs no water, ever",
            "Doubles as knee pad, pad-booster, splint padding",
          ],
          cons: [
            "It is a foam square — comfort, not luxury",
          ],
          specs: [
            { label: "Weight", value: "60 g (measured)" },
            { label: "Folded", value: "29 × 19 × 4 cm" },
            { label: "Foam", value: "IXPE closed-cell" },
          ],
          useCases: ["day-hike", "multi-day", "winter", "ultralight", "budget", "comfort"],
          faq: [
            {
              question: "Is this really worth carrying?",
              answer:
                "It is the item experienced hikers defend most stubbornly: 60 g for a dry warm seat at every break, every season. Try one lunch on frozen rock without it and the question answers itself.",
            },
          ],
          seoTitle: "Folding Foam Sit Pad — 60 g of Trail Comfort",
          seoDescription:
            "Closed-cell folding sit pad: dry, warm seating anywhere for 60 g, plus secondary uses. The best comfort-per-gram in hiking.",
        },
      ],
    },
  ],
  guides: [
    {
      slug: "day-hike-packing-list",
      title: "The Day-Hike Packing List That Fits in 22 Liters",
      excerpt:
        "A safe three-season day hike needs ten categories of gear — water, food, layers, navigation, light, first aid, sun, knife, fire, shelter — and all ten fit in a 22-liter pack at under 5 kg. Here is the exact list with weights.",
      body: `## The short answer

Pack the ten essentials in their lightweight forms: roughly **4.5-5 kg including water** in a 22 L pack covers a full three-season day hike safely. The list below is the version we actually carry, with measured weights, not the maximal version that turns day hikes into expeditions.

## The list, by category

- **Water (1.5-2 kg):** 1-1.5 L carried + the squeeze filter (65 g) where streams exist. The filter changes the math: carry less, drink more.
- **Food (~400 g):** lunch plus 200 g of margin snacks you do not plan to eat. Energy problems on trail are morale problems.
- **Layers (~600 g):** insulation layer + rain shell, every season, every forecast. Summits are colder and forecasts are suggestions. Dry bag them (10 L).
- **Navigation (~50 g):** offline map on the phone + a paper backup of the area. Phone batteries are also suggestions.
- **Light (~78 g):** the Ridgebeam headlamp, even on morning hikes — 'we walked out by headlamp' beats the alternative story.
- **First aid (~230 g):** the trail kit, led by blister care, because blisters are what actually happens.
- **Sun (~60 g):** SPF + sunglasses; above treeline, non-negotiable.
- **Knife/repair (~80 g):** small knife, tape wrapped around a pole, two zip ties.
- **Fire (~20 g):** lighter + a few storm matches in the first-aid pouch.
- **Emergency shelter (~110 g):** the foil blanket in the first-aid kit plus the sit pad (60 g) — ground insulation if a sprain pins you in place.

## Why a true 22 liters matters

This list fits a *true* 22 L with room for the camera. Packs that measure generous fail you here — which is why we measure volumes with the bean test and print the result. The Crest 22 carries this list with the structure to keep it comfortable; the Featherline 18 carries the summer version of it at 280 g of pack weight.

## The adjustments

- **Winter:** swap to the insulated bottle (hot drink), add microspikes, double the layers, R-value matters at every break (sit pad).
- **Heat waves:** double water, halve layers, keep the shell (storms love heat).
- **With kids:** add 50% snacks and one full extra layer set; their thermostat budget is smaller.`,
      seoTitle: "Day Hike Packing List — Ten Essentials in 22 L, Under 5 kg",
      seoDescription:
        "The complete day-hike list with measured weights: ten essential categories that fit a true 22-liter pack at under 5 kg including water.",
      relatedProductSlugs: ["crest-22-daypack", "squeeze-filter-kit", "ridgebeam-450-headlamp", "trail-first-aid"],
    },
    {
      slug: "stay-dry-hiking-rain",
      title: "Staying Dry on Wet Hikes: The System, Not the Jacket",
      excerpt:
        "No jacket keeps you dry on a long wet hike — you manage moisture instead: shell for the rain, ventilation against sweat, dry sacks for the gear that must stay dry, and a guaranteed-dry layer for breaks. Thinking in systems beats buying a more expensive jacket.",
      body: `## The short answer

Wet-weather comfort is a **system**: rain shell (worn loose and ventilated), pack protection (cover + dry sacks inside), and a guaranteed-dry insulation layer that only comes out at breaks. Chasing dryness with an ever-more-expensive jacket fails because the jacket was never the whole problem — sweat is.

## The uncomfortable physics

A hiking body produces around a liter of sweat per hard hour. Any shell that blocks rain also traps part of that, so on a climb in rain you get wet from one direction or the other. The goal is not staying perfectly dry — it is staying *warm while damp* and having dry things for when you stop.

## The shell: worn right beats bought expensive

- Vent aggressively: pit zips open, front zip cracked on climbs, hood down whenever rain pauses.
- Loose fit over a wicking layer beats a snug fit — airflow is the de-fogger.
- Re-DWR the shell when water stops beading; a wetted-out face fabric breathes roughly not at all.

## Pack protection: layered like the body

- Rain cover for the bulk water (anchored, or the wind takes it as tax).
- Dry sacks inside for the must-stay-dry trio: insulation layer, first aid/electronics, lunch. Covers leak at the back panel by design — straps run there.
- The 5/10/20 L set maps to exactly those three categories. Roll three turns.

## The break-layer rule

One insulation layer lives in a dry sack and is **forbidden while moving**. At breaks it goes over the wet shell (yes, over), trapping your heat while you eat. Hike on, stow it dry again. This single habit separates wet-weather hikers who enjoy it from those who endure it.

## Feet: the lost cause and the fix

On an all-day wet hike, feet get wet — waterproof boots delay it and then hold the water in. The fix is woolen socks (warm while wet) plus dry socks in the 5 L sack reserved for the car or the tent. Chasing all-day dry feet in heavy rain is the most expensive lost cause in hiking.

## The camp transition

Arriving wet at camp: pitch, then immediately change *everything* against the skin into the dry-sack reserves. Wet hiking clothes go back on next morning (awful for two minutes, correct for the trip) — the dry set is sacred for sleep. This is the discipline that makes multi-day rain manageable.`,
      seoTitle: "Staying Dry Hiking in Rain — The System That Actually Works",
      seoDescription:
        "Why no jacket keeps you dry and what does: ventilation discipline, layered pack protection with dry sacks, and the break-layer rule.",
      relatedProductSlugs: ["drysack-set", "pack-rain-cover", "crest-22-daypack"],
    },
    {
      slug: "sleep-warm-outdoors",
      title: "Sleeping Warm Outdoors: R-Values, Layers and the Cold Truths",
      excerpt:
        "Cold nights outdoors are usually lost to the ground, not the air: your pad's R-value matters as much as your sleeping bag's rating. R4+ for frost nights, a real understanding of 'comfort' vs 'limit' bag ratings, and three camp habits cover almost every cold-sleeper's problem.",
      body: `## The short answer

If you sleep cold outdoors, look down before you look up: **the ground steals heat faster than the air**, and a pad with R-value 4+ fixes frosty-night sleep more often than a warmer bag does. After that: trust 'comfort' ratings not 'limit' ratings on bags, and adopt the three pre-sleep habits below.

## R-value, demystified

R-value measures a pad's resistance to conductive heat loss — you compress your sleeping bag's insulation flat under your body weight, so under you, the pad *is* the insulation.

- **R2:** summer ground only.
- **R4+:** three seasons including frost — our Alpine pad sits here at 4.2, standardized testing.
- **R6+:** winter and snow camping.
- Values stack: a 60 g foam sit pad under the hips adds real warmth to any air pad on a marginal night.

## Bag ratings: read the right number

Sleeping bags publish a 'comfort' and a 'limit' temperature. Shops quote the impressive one (limit); your body cares about the other. Plan to the **comfort rating**, and treat even that as assuming a good pad, dry clothes and a fed body — see below.

## The three habits worth a season of gear

- **Eat before sleep.** Calories are fuel for your internal heater; a fatty snack at bedtime runs it through the night.
- **Go to bed warm.** A two-minute walk or some squats before getting in beats an hour of shivering the bag warm. A hot drink (insulated bottle) counts.
- **Sleep in dry layers — not all your layers.** Damp anything is a heat pump pointed the wrong way. Compressing every jacket inside the bag also crushes the bag's loft; drape spares over instead.

## The mistakes that make cold nights

- Air pad bought for thickness with no insulation (R1): comfortable in July, refrigeration in October.
- Breathing into the bag: a night of breath moisture is a wet bag by morning. Nose out, hood cinched.
- Tent ventilation closed 'for warmth': condensation rains on everything by 3 am. Vents open, always.

## A worked example

Frosty shoulder-season night, 0°C ground: Alpine pad (R4.2) + comfort-rated 0°C bag + dry base layer + bedtime snack + hot bottle in the footbox = a boringly warm night. Swap any single item for its summer version and you will meet the cold spot it was covering.`,
      seoTitle: "How to Sleep Warm Outdoors — R-Values and Bag Ratings Explained",
      seoDescription:
        "Cold sleepers: the ground is the thief. R-values explained, comfort-vs-limit bag ratings decoded, and the three habits that out-warm new gear.",
      relatedProductSlugs: ["alpine-pad-r4", "summit-bottle-insulated", "foam-sit-pad"],
    },
  ],
  comparison: {
    slug: "daypack-comparison",
    title: "Ridgeline Packs Compared: Crest 22 vs Featherline 18",
    excerpt:
      "Two packs, two philosophies: the Crest 22 carries structure, comfort and a rain cover for all-day hikes; the Featherline 18 weighs 280 g and disappears into a travel bag. Most hikers eventually own both.",
    body: "The Crest 22 and Featherline 18 are not competitors — they are the two halves of how people actually hike. The Crest is the default day pack: framed, padded, ventilated, with the ten-essentials list fitting comfortably and a rain cover in the bottom pocket. The Featherline is the opportunist: 280 g stuffed in its own pocket inside a suitcase or base pack, deployed for summit pushes and city-to-trail days.\n\nThe table shows the real trade: 460 g of structure and durability versus the pack you always have with you. If forced to choose one, choose by your most frequent hike, not your most ambitious one.",
    seoTitle: "Crest 22 vs Featherline 18 — Daypack Comparison",
    seoDescription:
      "Our two daypacks compared honestly: measured weights, volumes, fabric durability and comfort ceilings — and why many hikers own both.",
    productSlugs: ["crest-22-daypack", "featherline-18-ultralight"],
  },
  homepageFaq: [
    {
      question: "Why do you publish 'measured' weights?",
      answer:
        "Because catalog weights in this industry are routinely optimistic — 'from' weights, smallest sizes, no straps. We weigh production samples and print that number. If it is heavier than a competitor's claim, at least it is true.",
    },
    {
      question: "Where do orders ship from?",
      answer:
        "From partner supplier warehouses, typically 6-14 business days with tracking. We don't hold local stock — order before the trip, not the night before.",
    },
    {
      question: "Can I return gear I've used on trail?",
      answer:
        "Unused gear with tags returns free within 30 days. Gear that fails in normal use within warranty gets replaced or refunded — that is what a warranty means. Gear you simply wore out hiking is yours; that is what gear is for.",
    },
    {
      question: "What if gear arrives right before a trip and is wrong?",
      answer:
        "Email trail@turklar.example — exchanges get priority handling. Better: order with margin. Supplier shipping is honest but not overnight, and we print that everywhere.",
    },
    {
      question: "Why no customer star ratings?",
      answer:
        "We haven't collected enough verified reviews to show, and we won't invent them. Measured specs and stated limits are our substitute until real reviews accumulate.",
    },
  ],
};

export const hikingPolicies = {
  privacyPolicy: defaultPrivacyPolicy(info),
  termsOfSale: defaultTermsOfSale(info),
};

```


---

## prisma/seed-data/pet-grooming.ts

```ts
import {
  defaultPrivacyPolicy,
  defaultTermsOfSale,
  type SeedStore,
  type SeedStoreInfo,
} from "./types";

/** Pet grooming store: warm, friendly brand. */

const info: SeedStoreInfo = {
  slug: "pet-grooming",
  name: "Fur & Friends",
  legalName: "Fur and Friends Commerce ApS",
  primaryDomain: "pelspleie.example",
  locale: "en-US",
  currency: "USD",
  niche: "pet grooming",
  positioning:
    "Grooming tools chosen by people who actually groom their own dogs and cats. We match every tool to coat type and temperament, tell you when the groomer is the better answer, and never sell a 'miracle' deshedder that does not exist.",
  audience: "dog and cat owners who groom at home",
  valueProposition: "Happy grooming for pets who'd rather be napping",
  brandVoice: "warm, friendly, practical",
  logoText: "Fur & Friends",
  supportEmail: "woof@pelspleie.example",
  supportPhone: null,
  shippingOriginDisclosure:
    "Orders ship from our partner suppliers' warehouses, typically arriving in 5-12 business days with tracking. We don't hold local stock — that honesty keeps our prices fair.",
  defaultShippingDaysMin: 5,
  defaultShippingDaysMax: 12,
  returnPolicySummary:
    "30-day returns on unused tools in original packaging; if a tool genuinely doesn't suit your pet's coat, we'll help you pick the right one or refund you.",
};

export const petGroomingSeed: SeedStore = {
  store: info,
  theme: {
    primaryColor: "#c2410c",
    secondaryColor: "#431407",
    accentColor: "#0d9488",
    backgroundColor: "#fffaf5",
    textColor: "#2d1a10",
    borderRadius: "1.25rem",
    fontHeading: "rounded",
    fontBody: "system-ui",
  },
  domains: ["pelspleie.example", "www.pelspleie.example"],
  categories: [
    {
      slug: "brushes-combs",
      name: "Brushes & Combs",
      description:
        "The daily-driver tools: slickers, deshedding rakes and combs matched to coat type — because the right brush for a husky ruins a poodle's coat, and vice versa.",
      seoTitle: "Pet Brushes & Combs by Coat Type | Fur & Friends",
      seoDescription:
        "Slicker brushes, undercoat rakes and combs matched honestly to coat types. Clear guidance on which tool suits which dog or cat.",
      heroTitle: "The right brush for that coat",
      heroSubtitle:
        "Every brush here states which coats it suits — and which it doesn't. The wrong tool is why brushing 'doesn't work'.",
      sortOrder: 1,
      products: [
        {
          slug: "self-clean-slicker",
          title: "Self-Cleaning Slicker Brush",
          subtitle: "One-click hair release — the everyday brush for most medium and long coats",
          description:
            "The workhorse brush for medium and long coats: fine stainless pins with rounded tips work through topcoat and light undercoat, and the one-click retract ejects the collected hair in a single satisfying pad.\n\nSuits most dogs and long-haired cats for everyday maintenance. Honest fit note: for short, smooth coats (boxers, beagles) a rubber curry mitt is kinder and works better — see our grooming mitt instead.",
          shortDescription:
            "Self-cleaning slicker with rounded stainless pins and one-click hair release — the everyday brush for medium and long coats.",
          brand: "Fur & Friends",
          sku: "PET-SLICK1",
          gtin: null,
          price: 18.95,
          compareAtPrice: null,
          cost: 4.9,
          shippingCost: 2.6,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3110",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Stainless steel pins, ABS handle, TPR grip",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "One-click cleaning — no picking hair from pins",
            "Rounded pin tips are gentle on skin",
            "Comfortable grip for long sessions",
          ],
          cons: [
            "Wrong tool for short smooth coats — use a curry mitt instead",
            "Light undercoat only; heavy shedders need the undercoat rake too",
          ],
          specs: [
            { label: "Pins", value: "Stainless steel, rounded tips" },
            { label: "Cleaning", value: "One-click retract release" },
            { label: "Best for", value: "Medium & long coats, dogs and cats" },
            { label: "Handle", value: "Non-slip TPR grip" },
          ],
          useCases: ["dog", "cat", "long-coat", "detangling"],
          faq: [
            {
              question: "How often should I brush with it?",
              answer:
                "Medium coats: 2-3 times a week. Long coats: daily during shedding season. Short sessions your pet enjoys beat long sessions they tolerate.",
            },
          ],
          seoTitle: "Self-Cleaning Slicker Brush — For Medium & Long Coats",
          seoDescription:
            "One-click self-cleaning slicker with gentle rounded pins. Honest fit guide: great for medium/long coats, wrong for short smooth ones.",
        },
        {
          slug: "undercoat-rake",
          title: "Undercoat Deshedding Rake",
          subtitle: "For double coats that fill the house twice a year",
          description:
            "For huskies, shepherds, collies and other double-coated breeds, shedding season is a structural event. This rake's rotating stainless teeth reach through the topcoat and pull out loose undercoat without cutting healthy hair — unlike blade-style 'deshedders' that slice the topcoat and ruin its weather protection.\n\nUse on dry, detangled coat in the direction of growth. During coat-blow, ten minutes daily for a week beats one heroic hour.",
          shortDescription:
            "Rotating-teeth undercoat rake that removes loose undercoat without cutting topcoat — the honest tool for double-coated shedders.",
          brand: "Fur & Friends",
          sku: "PET-RAKE1",
          gtin: null,
          price: 22.5,
          compareAtPrice: null,
          cost: 6.1,
          shippingCost: 2.8,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3125",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Stainless steel teeth, beech handle",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "Removes undercoat without cutting topcoat",
            "Rotating teeth follow the coat instead of snagging",
            "Solid beech handle, comfortable for long sessions",
          ],
          cons: [
            "Only for double coats — pointless on single-coated breeds",
            "Won't make a husky stop shedding; nothing will",
          ],
          specs: [
            { label: "Teeth", value: "2 rows, rotating stainless steel" },
            { label: "Best for", value: "Double coats (husky, shepherd, collie...)" },
            { label: "Handle", value: "Beech wood" },
            { label: "Use on", value: "Dry, detangled coat only" },
          ],
          useCases: ["dog", "long-coat", "deshedding"],
          faq: [
            {
              question: "Will this stop my dog shedding?",
              answer:
                "No tool stops shedding — anyone claiming otherwise is selling you a story. This one moves the hair from your dog to the rake before it reaches the sofa, which is the realistic win.",
            },
          ],
          seoTitle: "Undercoat Deshedding Rake — Double Coats, No Topcoat Damage",
          seoDescription:
            "Rotating-teeth undercoat rake for huskies and shepherds. Honest promise: less hair on the sofa, not a shed-free dog.",
        },
        {
          slug: "detangling-comb",
          title: "Stainless Detangling Comb",
          subtitle: "Wide-and-narrow teeth for mats, finishing and behind-the-ears work",
          description:
            "The precision end of the toolkit: a polished stainless comb with a wide-tooth half for working through tangles and a narrow half for finishing and checking your work. If the comb glides to the skin everywhere, the coat is genuinely tangle-free.\n\nEssential for poodles, doodles and long-haired cats, where surface brushing hides forming mats. Work mats from the tip toward the skin, never yank from the root.",
          shortDescription:
            "Polished stainless comb with wide and narrow teeth — the precision tool for tangles, mats and grooming quality control.",
          brand: "Fur & Friends",
          sku: "PET-COMB1",
          gtin: null,
          price: 12.95,
          compareAtPrice: null,
          cost: 3.2,
          shippingCost: 2.2,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3140",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Polished stainless steel",
          warranty: null,
          returnable: true,
          pros: [
            "The honest test of a finished groom — comb to skin everywhere",
            "Polished teeth glide instead of snagging",
            "One tool for tangle work and finishing",
          ],
          cons: [
            "Severe matting needs clippers or a professional, not a comb",
          ],
          specs: [
            { label: "Material", value: "Polished stainless steel" },
            { label: "Teeth", value: "Dual spacing: wide + narrow" },
            { label: "Length", value: "19 cm" },
          ],
          useCases: ["dog", "cat", "long-coat", "detangling", "sensitive-skin"],
          faq: [
            {
              question: "My pet has a solid mat — comb or clipper?",
              answer:
                "If you cannot work a finger under the mat, do not comb it — that hurts. Tight mats are clipper territory, and close-to-skin mats are a groomer's job. We'd rather lose a sale than have you hurt your pet.",
            },
          ],
          seoTitle: "Stainless Pet Detangling Comb — Wide/Narrow Dual Teeth",
          seoDescription:
            "Polished stainless grooming comb for tangles and finishing, with honest guidance on when mats need clippers or a professional instead.",
        },
        {
          slug: "grooming-mitt",
          title: "Rubber Grooming Mitt",
          subtitle: "For short coats and pets who think brushes are suspicious",
          description:
            "A rubber-nubbed mitt that grooms while it pets — the right tool for short smooth coats and the gateway tool for brush-suspicious pets. Loose hair sticks to the rubber nubs; massage is built in.\n\nWorks wet as a bath scrubber too, lifting shampoo through dense short coats. One size with an adjustable strap fits most hands.",
          shortDescription:
            "Rubber grooming mitt that removes loose hair from short coats while petting — ideal for brush-shy dogs and cats.",
          brand: "Fur & Friends",
          sku: "PET-MITT1",
          gtin: null,
          price: 10.95,
          compareAtPrice: null,
          cost: 2.7,
          shippingCost: 2.2,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3155",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Natural rubber nubs, mesh back",
          warranty: null,
          returnable: true,
          pros: [
            "Feels like petting — perfect for nervous groomees",
            "The correct tool for short smooth coats",
            "Doubles as a bath scrubber",
          ],
          cons: [
            "Surface tool only — useless on undercoat and tangles",
            "Hand-wash and air-dry to keep the rubber grippy",
          ],
          specs: [
            { label: "Surface", value: "Natural rubber nubs" },
            { label: "Best for", value: "Short smooth coats; nervous pets" },
            { label: "Fit", value: "One size, adjustable strap" },
            { label: "Wet use", value: "Yes — bath scrubbing" },
          ],
          useCases: ["dog", "cat", "short-coat", "sensitive-skin", "quiet"],
          faq: [
            {
              question: "My cat hates every brush. Will this work?",
              answer:
                "It is the best first move — most cats read it as petting. Keep first sessions short and treat-heavy, and let the cat leave whenever it wants.",
            },
          ],
          seoTitle: "Rubber Pet Grooming Mitt — Short Coats & Nervous Pets",
          seoDescription:
            "Grooming mitt that works like petting: right tool for short smooth coats and brush-suspicious cats and dogs. Wet or dry use.",
        },
      ],
    },
    {
      slug: "clippers-trimming",
      name: "Clippers & Trimming",
      description:
        "Quiet clippers, nail tools and trimming scissors for home maintenance between professional grooms — with honest guidance on what belongs at the groomer.",
      seoTitle: "Pet Clippers & Nail Trimming Tools | Fur & Friends",
      seoDescription:
        "Quiet cordless clippers, nail clippers, grinders and trimming scissors for home grooming — with honest notes on what to leave to professionals.",
      heroTitle: "Maintenance trims, minus the drama",
      heroSubtitle:
        "Quiet tools for the between-groomer work: nails, paws, face tidying and touch-ups.",
      sortOrder: 2,
      products: [
        {
          slug: "quiet-cordless-clipper",
          title: "Quiet Cordless Clipper Kit",
          subtitle: "50 dB motor for sound-sensitive pets, with 4 guard combs",
          description:
            "A cordless clipper built around the spec that matters most at home: noise. At roughly 50 dB — quiet conversation level — it stays under the panic threshold of most sound-sensitive pets. Ceramic-titanium blades stay cooler than all-steel, and four guards (3/6/9/12 mm) cover maintenance trims.\n\nHonest scope: this handles touch-ups, paws, sanitary trims and light body work. Full breed cuts on thick or matted coats need pro-grade clippers and skills — that is a groomer visit, and we say so.",
          shortDescription:
            "~50 dB cordless clipper with ceramic-titanium blade and 4 guards — built for sound-sensitive pets and maintenance trims.",
          brand: "Fur & Friends",
          sku: "PET-CLIP1",
          gtin: null,
          price: 42.95,
          compareAtPrice: null,
          cost: 14.8,
          shippingCost: 4.4,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3210",
          shippingDaysMin: 5,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Ceramic-titanium blade, ABS body",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "~50 dB — most nervous pets tolerate it",
            "Ceramic blade runs cooler against the skin",
            "Cordless, 90 min per charge, USB-C",
          ],
          cons: [
            "Not for full cuts on thick or matted coats",
            "Blade oiling before each use is required maintenance",
          ],
          specs: [
            { label: "Noise", value: "~50 dB" },
            { label: "Blade", value: "Ceramic-titanium, detachable" },
            { label: "Guards", value: "3, 6, 9, 12 mm" },
            { label: "Battery", value: "90 min, USB-C charging" },
          ],
          useCases: ["dog", "cat", "sensitive-skin", "quiet", "long-coat"],
          faq: [
            {
              question: "Can I do my doodle's full haircut with this?",
              answer:
                "Honestly: no. Doodle coats need pro-grade clippers and technique. This kit keeps the face, paws and sanitary areas tidy between groomer visits — which stretches the interval and saves money anyway.",
            },
          ],
          seoTitle: "Quiet Cordless Pet Clipper (~50 dB) — For Nervous Pets",
          seoDescription:
            "Cordless clipper quiet enough for sound-sensitive pets, with honest scope: maintenance trims yes, full breed cuts no.",
        },
        {
          slug: "led-nail-clippers",
          title: "LED Nail Clippers with Quick Guard",
          subtitle: "See the quick before you cut — fewer nail-trim standoffs",
          description:
            "Nail trims go wrong at exactly one point: cutting the quick. These clippers put an LED behind the nail so the quick shows as a pink shadow in light-colored nails, plus a physical guard that limits how much nail can enter the blade.\n\nFor dark nails where the LED cannot help, trim 1-2 mm at a time watching the cut face — when a dark dot appears in the center, stop. That technique note ships in the box too.",
          shortDescription:
            "Pet nail clippers with LED quick-illumination and a safety guard — built to prevent the one mistake that ruins nail trims.",
          brand: "Fur & Friends",
          sku: "PET-NAIL1",
          gtin: null,
          price: 15.95,
          compareAtPrice: null,
          cost: 4.1,
          shippingCost: 2.4,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3225",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Stainless blades, ABS handle",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "LED makes the quick visible in light nails",
            "Physical guard limits over-cutting",
            "Sharp stainless blades crush less, cut cleaner",
          ],
          cons: [
            "LED cannot illuminate dark nails — use the 1-2 mm technique",
            "Large-breed thick nails may suit a grinder better",
          ],
          specs: [
            { label: "Blades", value: "Stainless steel" },
            { label: "Light", value: "LED quick-illumination" },
            { label: "Safety", value: "Adjustable depth guard" },
            { label: "Battery", value: "2 × AAA (included)" },
          ],
          useCases: ["dog", "cat", "sensitive-skin"],
          faq: [
            {
              question: "What if I cut the quick anyway?",
              answer:
                "Press styptic powder (or plain cornstarch) on the tip for a minute or two and stay calm — it looks worse than it is. Then trim less per cut next time, and rebuild trust with treats.",
            },
          ],
          seoTitle: "LED Pet Nail Clippers with Quick Guard — Safer Nail Trims",
          seoDescription:
            "Nail clippers with LED quick-light and depth guard, plus the dark-nail technique most shops never explain.",
        },
        {
          slug: "nail-grinder-quiet",
          title: "Whisper Nail Grinder",
          subtitle: "Low-vibration grinding for dogs who refuse clippers",
          description:
            "Some dogs never accept the squeeze of clippers but tolerate grinding — especially with a tool engineered for low noise (under 45 dB) and low hand vibration like this one. The diamond-bit wheel rounds nails smoothly, removing the sharp edges clippers leave.\n\nThe trade-off is time: grinding takes longer per nail, and acclimation (paw handling, tool-off, tool-on-nearby, then short touches) takes a patient week. The included guide walks through it day by day.",
          shortDescription:
            "Under-45 dB nail grinder with diamond bit and 3 speeds — the patient alternative for clipper-refusing dogs.",
          brand: "Fur & Friends",
          sku: "PET-GRIND1",
          gtin: null,
          price: 24.95,
          compareAtPrice: null,
          cost: 7.6,
          shippingCost: 2.8,
          stockStatus: "LOW_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3240",
          shippingDaysMin: 5,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Diamond grinding bit, ABS body",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "Under 45 dB with low hand vibration",
            "Leaves smooth, rounded nails — no sharp clipper edges",
            "Three speeds; USB-C rechargeable",
          ],
          cons: [
            "Slower than clipping — patience required",
            "A week of acclimation is normal, not a product flaw",
          ],
          specs: [
            { label: "Noise", value: "< 45 dB" },
            { label: "Bit", value: "Diamond, 3 port sizes" },
            { label: "Speeds", value: "3" },
            { label: "Battery", value: "USB-C, ~4 h runtime" },
          ],
          useCases: ["dog", "quiet", "sensitive-skin"],
          faq: [
            {
              question: "Grinder or clippers — which should I buy?",
              answer:
                "Clippers are faster if your dog tolerates them. The grinder is for dogs who hate the clipper squeeze, and for smoothing after clipping. Many households end up using both.",
            },
          ],
          seoTitle: "Whisper Pet Nail Grinder (<45 dB) — For Clipper-Refusers",
          seoDescription:
            "Low-noise, low-vibration nail grinder with diamond bit and a day-by-day acclimation guide. Honest trade-off: gentler but slower.",
        },
        {
          slug: "rounded-trim-scissors",
          title: "Rounded-Tip Trimming Scissors Set",
          subtitle: "Safety-tip scissors for face, paws and sanitary areas",
          description:
            "Two scissors for the precision zones where clippers feel too big: a rounded-tip straight pair for face and paw-pad edges, and a small thinning pair for blending the cut lines so home trims do not look like home trims.\n\nThe rounded tips are the point (so to speak): around eyes and paw pads, a sudden head-jerk meets a blunt curve, not a blade tip. Japanese stainless holds its edge for years of home use.",
          shortDescription:
            "Rounded-safety-tip straight + thinning scissors in Japanese stainless — for face, paws and blending home trims.",
          brand: "Fur & Friends",
          sku: "PET-SCIS1",
          gtin: null,
          price: 19.95,
          compareAtPrice: null,
          cost: 5.4,
          shippingCost: 2.4,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3255",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "Pakistan",
          materials: "Japanese stainless steel",
          warranty: null,
          returnable: true,
          pros: [
            "Rounded tips protect eyes and pads from sudden movements",
            "Thinning pair hides the cut lines",
            "Edge-holding Japanese stainless",
          ],
          cons: [
            "For detail work only — body trimming wants clippers",
          ],
          specs: [
            { label: "Set", value: "Straight (rounded tip) + thinning" },
            { label: "Steel", value: "Japanese stainless" },
            { label: "Length", value: "16 cm each" },
          ],
          useCases: ["dog", "cat", "long-coat", "sensitive-skin"],
          faq: [
            {
              question: "What are thinning scissors for?",
              answer:
                "They cut only some hair per snip, blending harsh lines into the surrounding coat. They are the difference between 'freshly trimmed' and 'trimmed by an enthusiastic owner'.",
            },
          ],
          seoTitle: "Rounded-Tip Pet Trimming Scissors — Face & Paw Safety Set",
          seoDescription:
            "Safety-tip straight and thinning scissors for the precision zones: face, paws, sanitary. Japanese stainless, honest scope notes.",
        },
      ],
    },
    {
      slug: "bath-skin-care",
      name: "Bath & Skin Care",
      description:
        "Bath-time gear and coat care that respects pet skin pH — pet shampoos, drying towels and massage scrubbers that make wash day less of a wrestling match.",
      seoTitle: "Pet Bath & Skin Care: Shampoo & Drying | Fur & Friends",
      seoDescription:
        "pH-correct pet shampoo, fast-drying towels and bath scrubbers. Honest guidance: human shampoo is the wrong pH for pet skin.",
      heroTitle: "Wash day, without the wrestling",
      heroSubtitle:
        "pH-correct washing, faster drying, calmer pets — the gear that turns bath chaos into routine.",
      sortOrder: 3,
      products: [
        {
          slug: "oatmeal-ph-shampoo",
          title: "Oatmeal pH-Balanced Pet Shampoo",
          subtitle: "Formulated for pet skin pH — because human shampoo isn't",
          description:
            "Pet skin sits near pH 7, human skin near 5.5 — which is why human shampoo (formulated acidic) dries and irritates pet skin over time. This colloidal-oatmeal formula is balanced for pet skin, fragrance-light, and free of parabens and dyes.\n\nIt soothes the mild itch-and-flake cycle of dry skin and rinses out fast — the step most baths shortchange. Persistent scratching, redness or odor is a vet matter, not a shampoo matter; we print that on the bottle.",
          shortDescription:
            "Colloidal oatmeal shampoo balanced for pet skin pH (~7), fragrance-light, paraben-free — for dogs and cats over 12 weeks.",
          brand: "Fur & Friends",
          sku: "PET-SHAM1",
          gtin: null,
          price: 14.95,
          compareAtPrice: null,
          cost: 3.9,
          shippingCost: 2.8,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3310",
          shippingDaysMin: 5,
          shippingDaysMax: 12,
          countryOfOrigin: "United States",
          materials: "Colloidal oatmeal, coconut-derived cleansers",
          warranty: null,
          returnable: true,
          pros: [
            "pH-balanced for pet skin (~7), unlike human shampoo",
            "Colloidal oatmeal calms mild dry-skin itch",
            "Free of parabens, dyes and heavy fragrance",
          ],
          cons: [
            "Not a treatment for skin conditions — persistent issues need a vet",
            "Light lather by design; it still cleans",
          ],
          specs: [
            { label: "Volume", value: "473 ml" },
            { label: "pH", value: "Balanced for pet skin (~7)" },
            { label: "Key ingredient", value: "Colloidal oatmeal 2%" },
            { label: "Suitable for", value: "Dogs & cats from 12 weeks" },
          ],
          useCases: ["dog", "cat", "sensitive-skin", "short-coat", "long-coat"],
          faq: [
            {
              question: "Can I use my own shampoo on my dog?",
              answer:
                "Skip it — human shampoo is formulated for pH ~5.5 skin and pet skin sits near 7. Occasional use won't cause a crisis, but regular use dries and irritates their skin barrier.",
            },
          ],
          seoTitle: "Oatmeal Pet Shampoo, pH-Balanced — Why Human Shampoo Fails",
          seoDescription:
            "pH-correct oatmeal shampoo for dogs and cats, with the honest explanation of why human shampoo is wrong for pet skin.",
        },
        {
          slug: "microfiber-drying-towel",
          title: "Microfiber Drying Towel XL",
          subtitle: "Absorbs several times its weight — cuts shake-spray and dryer time",
          description:
            "An oversized (140 × 76 cm) microfiber towel with hand pockets at both ends, so the towel stays on the dog during the post-bath shake instead of on your bathroom walls. Microfiber pulls water out of undercoat that cotton towels just push around.\n\nLess water in the coat means less hot-dryer time — the part of bath day most pets hate most. Machine-washable; skip fabric softener, which clogs microfiber.",
          shortDescription:
            "XL microfiber towel with hand pockets — soaks up undercoat water fast and contains the post-bath shake.",
          brand: "Fur & Friends",
          sku: "PET-TOWEL1",
          gtin: null,
          price: 16.95,
          compareAtPrice: null,
          cost: 4.6,
          shippingCost: 3.1,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3325",
          shippingDaysMin: 5,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "80/20 polyester/polyamide microfiber",
          warranty: null,
          returnable: true,
          pros: [
            "Dramatically faster drying than cotton towels",
            "Hand pockets keep the towel on during shakes",
            "XL size wraps large breeds",
          ],
          cons: [
            "Wash without fabric softener or absorbency drops",
            "Hooks slightly on very long claws",
          ],
          specs: [
            { label: "Size", value: "140 × 76 cm" },
            { label: "Material", value: "Microfiber 80/20" },
            { label: "Care", value: "Machine wash, no softener" },
          ],
          useCases: ["dog", "cat", "long-coat", "short-coat"],
          faq: [
            {
              question: "Why not just use old bath towels?",
              answer:
                "Cotton pushes water around a dense coat; microfiber pulls it out. The difference is one towel versus three, and far less dryer time for dryer-hating pets.",
            },
          ],
          seoTitle: "XL Microfiber Dog Drying Towel with Hand Pockets",
          seoDescription:
            "Oversized microfiber drying towel that cuts bath drying time and contains the shake. Honest care note: no fabric softener.",
        },
        {
          slug: "bath-massage-scrubber",
          title: "Silicone Bath Massage Scrubber",
          subtitle: "Lathers through dense coats while feeling like a massage",
          description:
            "A palm-strap silicone scrubber that solves the dense-coat bath problem: shampoo sitting on top of the coat while the skin underneath stays dry and unwashed. The soft nubs channel lather down to the skin and turn scrubbing into something pets actively enjoy.\n\nGentler than fingernails, more thorough than fingertips, and it doubles as a wet-coat hair catcher that keeps some fur out of the drain.",
          shortDescription:
            "Palm-strap silicone scrubber that works shampoo through dense coats to the skin — and feels like a massage doing it.",
          brand: "Fur & Friends",
          sku: "PET-SCRUB1",
          gtin: null,
          price: 9.95,
          compareAtPrice: null,
          cost: 2.4,
          shippingCost: 2.2,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3340",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Food-grade silicone",
          warranty: null,
          returnable: true,
          pros: [
            "Gets shampoo to the skin under dense coats",
            "Most pets read it as massage, not washing",
            "Catches loose hair before the drain does",
          ],
          cons: [
            "Less useful on very short single coats — hands do fine there",
          ],
          specs: [
            { label: "Material", value: "Food-grade silicone" },
            { label: "Fit", value: "Palm strap, one size" },
            { label: "Care", value: "Rinse and air-dry" },
          ],
          useCases: ["dog", "cat", "long-coat", "sensitive-skin", "quiet"],
          faq: [
            {
              question: "Does it work on cats?",
              answer:
                "For the rare cat that gets baths, yes — the massage feel helps. For most cats, brushing with the grooming mitt covers coat care without water.",
            },
          ],
          seoTitle: "Silicone Pet Bath Scrubber — Lather to the Skin",
          seoDescription:
            "Palm scrubber that channels shampoo through dense coats and feels like a massage. Honest note: short single coats don't need it.",
        },
        {
          slug: "paw-balm-tin",
          title: "Paw & Nose Balm",
          subtitle: "Beeswax-based protection for cracked pads and winter salt",
          description:
            "A lick-safe balm of beeswax, shea butter and calendula for dry, cracked paw pads and crusty noses — the unglamorous winter problem of road salt, ice and indoor heating.\n\nApply a thin layer before walks as a salt barrier and after walks as repair; expect most pets to attempt a taste (it is lick-safe, just rub it in first and distract for a minute). Deep cracks that bleed or persistent limping is vet territory.",
          shortDescription:
            "Lick-safe beeswax balm for cracked paw pads and dry noses — barrier before winter walks, repair after.",
          brand: "Fur & Friends",
          sku: "PET-BALM1",
          gtin: null,
          price: 11.5,
          compareAtPrice: null,
          cost: 2.9,
          shippingCost: 2.2,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3355",
          shippingDaysMin: 5,
          shippingDaysMax: 12,
          countryOfOrigin: "United States",
          materials: "Beeswax, shea butter, calendula, vitamin E",
          warranty: null,
          returnable: true,
          pros: [
            "Lick-safe, food-grade ingredients",
            "Works as both pre-walk barrier and post-walk repair",
            "One tin lasts a winter for most dogs",
          ],
          cons: [
            "Bleeding cracks or limping need a vet, not a balm",
            "Softens above 30°C — store cool in summer",
          ],
          specs: [
            { label: "Size", value: "60 ml tin" },
            { label: "Ingredients", value: "Beeswax, shea, calendula, vit. E" },
            { label: "Safety", value: "Lick-safe" },
          ],
          useCases: ["dog", "cat", "sensitive-skin", "short-coat"],
          faq: [
            {
              question: "My dog licks it straight off. Problem?",
              answer:
                "It is lick-safe, so no harm — but it works better absorbed. Rub it in well and serve dinner or a chew right after applying; two minutes of distraction is usually enough.",
            },
          ],
          seoTitle: "Lick-Safe Paw & Nose Balm — Winter Pad Protection",
          seoDescription:
            "Beeswax paw balm for salt, ice and cracked pads — lick-safe, with honest red flags for when a vet beats a balm.",
        },
      ],
    },
  ],
  guides: [
    {
      slug: "grooming-tools-by-coat-type",
      title: "Which Grooming Tools Does Your Pet Actually Need? (By Coat Type)",
      excerpt:
        "Match tools to coat, not to marketing: short smooth coats need only a rubber mitt; medium and long coats need a slicker plus a comb; double coats add an undercoat rake. Buying by coat type means two or three tools, not a drawer of regrets.",
      body: `## The short answer

Identify the coat, buy for the coat: **short smooth → mitt. Medium/long → slicker + comb. Double coat → those plus an undercoat rake. Curly/doodle → slicker + comb, used often, plus a groomer relationship.** That is the entire decision tree; everything else in the grooming aisle is situational.

## First: which coat does your pet have?

- **Short smooth** (boxer, beagle, most domestic shorthair cats): hair lies flat, no fluff layer.
- **Medium/long single coat** (spaniels, setters, long-haired cats): visible length, tangles possible, no woolly underlayer.
- **Double coat** (husky, shepherd, collie, Maine Coon): a woolly undercoat beneath the guard hairs; sheds catastrophically twice a year.
- **Curly/wool** (poodles, doodles, bichons): continuously growing coat that mats rather than sheds.

## Short smooth coats: one tool

The rubber grooming mitt removes loose hair and doubles as a bath scrubber. A slicker on this coat is unnecessary and often unpleasant for the pet. Weekly is plenty outside shedding peaks.

## Medium and long single coats: two tools

The self-cleaning slicker for routine brushing (2-3× weekly), and the stainless comb as quality control — if the comb glides to skin everywhere, you are done; where it stops, a tangle is forming. The comb finds the mats the slicker glides over. That pair covers spaniels to long-haired cats.

## Double coats: add the rake

During coat-blow (spring/fall), the undercoat rake moves the dying undercoat out before it carpets your home. Ten minutes daily for a week beats a heroic monthly hour. Never shave a double coat for summer — it wrecks their insulation both ways; the rake plus airflow is the answer.

## Curly and doodle coats: honesty section

These coats mat continuously and need near-daily slicker-and-comb work plus professional cuts every 6-10 weeks. Home kit handles maintenance between visits (see our quiet clipper for face/paw tidying) — but a home-only doodle coat usually ends in a shave-down at the groomer. Budget for both.

## Nails: every coat type

Every pet needs nail care every 3-4 weeks. Clippers with the LED quick-guard if your pet tolerates clipping, the whisper grinder if not. Clicking on the floor means overdue.`,
      seoTitle: "Grooming Tools by Coat Type — The 2-3 Tools You Actually Need",
      seoDescription:
        "A coat-type decision tree for grooming tools: mitt, slicker, comb, rake — what each coat needs and what to skip. No miracle-tool marketing.",
      relatedProductSlugs: ["grooming-mitt", "self-clean-slicker", "undercoat-rake", "detangling-comb"],
    },
    {
      slug: "nail-trimming-without-trauma",
      title: "Nail Trimming Without Trauma: A Week-by-Week Plan",
      excerpt:
        "Pets fear nail trims because of past quick-cuts and restraint, not the tools. The fix is a week of acclimation — paw handling, tool exposure, one nail at a time — plus a tool that prevents the painful mistake: LED clippers or a quiet grinder.",
      body: `## The short answer

Nail-trim battles are learned, which means they can be unlearned: **one week of treat-heavy acclimation, then trim 1-2 nails per session rather than all sixteen-plus in one wrestling match.** Pair the plan with a mistake-preventing tool — LED quick-light clippers or the whisper grinder — and most pets settle within a month.

## Why pets hate nail trims

One cut quick (it hurts, properly) or one forced full-restraint session creates an association that generalizes fast: tool = bad, paw touch = escape. The good news is the association rebuilds the same way it broke — through repetition of the opposite experience.

## The week-by-week plan

- **Days 1-2:** Touch paws during cuddle time. Treat. No tools in sight.
- **Days 3-4:** Tool appears, stays on the floor. Treats near it. If it is the grinder, switch it on across the room so the sound becomes boring.
- **Day 5:** Touch the (off) tool to a paw. Treat generously.
- **Day 6:** One nail. One. Then a party-grade treat and done.
- **Day 7+:** Two to three nails per session, a few sessions a week, until a full rotation happens within the week.

Slow is fast here: a month of two-nail sessions beats a year of quarterly wrestling.

## Choosing the tool

- **LED clippers** — fastest per nail; the light shows the quick in pale nails and the guard limits depth. For dark nails: 1-2 mm per cut, stop at the dark center dot.
- **Whisper grinder** — for clipper-refusers; under 45 dB and no squeeze sensation, at the cost of more time per nail.
- Many households use both: clip, then grind smooth.

## If you cut the quick anyway

Styptic powder or cornstarch, gentle pressure, calm voice, end the session on a treat. It happens to professionals too. The damage to repair is the trust, and the plan above repairs it.

## How short, how often

Trim until just before the quick, every 3-4 weeks; nails clicking on the floor means overdue. Regular trims actually make the quick recede, so consistent maintenance gets easier over time — the opposite of the avoidance spiral.`,
      seoTitle: "Pet Nail Trimming Without Trauma — Week-by-Week Plan",
      seoDescription:
        "Why pets fear nail trims and the 7-day acclimation plan that fixes it, plus honest tool guidance: LED clippers vs quiet grinder.",
      relatedProductSlugs: ["led-nail-clippers", "nail-grinder-quiet"],
    },
    {
      slug: "bath-day-guide",
      title: "Bath Day Done Right: From Pre-Brush to Fully Dry",
      excerpt:
        "A good pet bath follows a fixed order: brush first (wet mats become felt), lukewarm water, pet-pH shampoo worked to the skin, rinse twice as long as feels necessary, then microfiber before any dryer. The order matters more than any single product.",
      body: `## The short answer

Bath day order: **brush → lukewarm water → pet-pH shampoo to the skin → over-rinse → microfiber towel → low-heat dry if needed.** Most bath problems (itchy skin, dull coat, post-bath mats, dryer panic) trace to skipping or rushing one of these steps, not to the wrong shampoo brand.

## Before the water: brush

Water turns loose tangles into felted mats. Five minutes with the slicker (and the comb check) before the bath prevents the post-bath matting people blame on shampoo. Double coats: rake first during shedding season, or you are washing hair that was already leaving.

## Water and shampoo

- Lukewarm, not warm-to-you: pets run hotter and overheat faster.
- Human shampoo is the wrong pH for pet skin (~5.5 vs ~7) — use a pet formula; ours is oatmeal-based and fragrance-light because strong perfume on a nose that sharp is unkind.
- The silicone scrubber gets lather *to the skin* on dense coats. Shampooing the surface of a double coat washes the hair and misses the animal.

## The step everyone shortchanges: rinsing

Rinse until the water runs clean, then rinse that long again. Shampoo residue is the most common cause of post-bath itching and dull coat — it is misdiagnosed as 'shampoo allergy' constantly. Pay special attention to armpits, belly and under the collar line.

## Drying without drama

Microfiber first, always: it pulls water from undercoat that cotton just smears around, and every minute of toweling is several minutes of dryer noise your pet skips. The hand-pocket towel survives the mid-dry shake. If you use a dryer: lowest heat, moving constantly, never pointed at the face.

## How often to bathe

Less than you think: every 4-8 weeks for most dogs, less for many, only-when-dirty for most cats. Over-bathing strips coat oils and causes the dry skin people then buy products to fix. Smell and dirt are the indicators, not the calendar.

## After: the once-over

While the coat dries, do the maintenance round: comb check for missed tangles, nail check (clicking = overdue), paw pads (winter: balm), ears (clean and dry). Five minutes here is what 'well-groomed' actually consists of.`,
      seoTitle: "Pet Bath Day Guide — The Right Order, Start to Dry",
      seoDescription:
        "Brush, lukewarm, pH-correct shampoo, over-rinse, microfiber: the bath order that prevents itching, matting and dryer panic.",
      relatedProductSlugs: ["oatmeal-ph-shampoo", "bath-massage-scrubber", "microfiber-drying-towel", "self-clean-slicker"],
    },
  ],
  comparison: {
    slug: "brush-tool-comparison",
    title: "Brush Showdown: Slicker vs Rake vs Mitt — Which Coat Needs Which",
    excerpt:
      "Three tools, three jobs: the slicker for everyday medium/long coat care, the rake for double-coat shedding season, the mitt for short coats and nervous pets.",
    body: "These three tools cover the brushing needs of nearly every dog and cat — but they are not interchangeable, and the wrong pick is why 'brushing doesn't work for us'. The slicker is the everyday tool for coats with length. The undercoat rake exists for one job: moving dying undercoat out of double-coated breeds before it reaches your furniture. The mitt is the right answer for short smooth coats and the diplomatic answer for pets who distrust anything that looks like a tool.\n\nThe table shows which coats each tool serves, and just as importantly, which it does not.",
    seoTitle: "Slicker vs Undercoat Rake vs Grooming Mitt — Honest Comparison",
    seoDescription:
      "Three brushing tools compared by coat type, job and limits — so you buy the two or three your pet needs instead of a drawer of regrets.",
    productSlugs: ["self-clean-slicker", "undercoat-rake", "grooming-mitt"],
  },
  homepageFaq: [
    {
      question: "How do I know which brush my pet needs?",
      answer:
        "By coat type, not by marketing: short smooth coats want the rubber mitt, medium/long coats the slicker plus comb, double coats add the undercoat rake. Our coat-type guide sorts it in two minutes.",
    },
    {
      question: "Where do orders ship from?",
      answer:
        "From partner supplier warehouses, typically arriving in 5-12 business days with tracking. We don't hold local stock and we say so up front.",
    },
    {
      question: "My pet hates being groomed. Where do I start?",
      answer:
        "With the tool that doesn't feel like one: the grooming mitt. Then short, treat-heavy sessions where the pet can leave anytime. Our nail-trim guide's acclimation plan works for brushing too.",
    },
    {
      question: "Can I return a tool that doesn't suit my pet's coat?",
      answer:
        "Unused tools return free within 30 days — and email us first: we'd rather swap you to the right tool than process a refund. Helping you pick correctly is the whole point of the store.",
    },
    {
      question: "Do you sell anything that stops shedding?",
      answer:
        "No, because nothing does — shedding is biology. Our rake and slicker move loose hair onto the tool instead of your sofa, which is the honest version of every 'anti-shedding' claim you've read.",
    },
  ],
};

export const petGroomingPolicies = {
  privacyPolicy: defaultPrivacyPolicy(info),
  termsOfSale: defaultTermsOfSale(info),
};

```


---

## prisma/seed-data/types.ts

```ts
import type { StockStatus } from "../../src/lib/types";

/** Shapes for the per-store seed modules. Validated with Zod in seed.ts. */

export interface SeedSpec {
  label: string;
  value: string;
}

export interface SeedFaq {
  question: string;
  answer: string;
}

export interface SeedProductInput {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  shortDescription: string;
  brand: string;
  sku: string;
  gtin?: string | null;
  price: number;
  compareAtPrice?: number | null;
  cost: number;
  shippingCost: number;
  stockStatus: StockStatus;
  supplierName: string;
  supplierProductId: string;
  /** Marketplace used for daily image sync cron. */
  supplierSource?: "aliexpress" | "temu" | "ebay" | "wish" | "alibaba";
  /** Direct listing URL when known. */
  supplierUrl?: string;
  /** Search query for finding the best-matching supplier listing. */
  supplierSearchQuery?: string;
  shippingDaysMin: number;
  shippingDaysMax: number;
  countryOfOrigin?: string | null;
  materials?: string | null;
  warranty?: string | null;
  returnable: boolean;
  pros: string[];
  cons: string[];
  specs: SeedSpec[];
  useCases: string[];
  faq: SeedFaq[];
  seoTitle: string;
  seoDescription: string;
}

export interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  sortOrder: number;
  products: SeedProductInput[];
}

export interface SeedGuide {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  relatedProductSlugs: string[];
}

export interface SeedComparison {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  productSlugs: string[];
}

export interface SeedStoreInfo {
  slug: string;
  name: string;
  legalName: string;
  primaryDomain: string;
  locale: string;
  currency: string;
  niche: string;
  positioning: string;
  audience: string;
  valueProposition: string;
  brandVoice: string;
  logoText: string;
  supportEmail: string;
  supportPhone?: string | null;
  shippingOriginDisclosure: string;
  defaultShippingDaysMin: number;
  defaultShippingDaysMax: number;
  returnPolicySummary: string;
}

export interface SeedTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  fontHeading: string;
  fontBody: string;
}

export interface SeedStore {
  store: SeedStoreInfo;
  theme: SeedTheme;
  domains: string[];
  categories: SeedCategory[];
  guides: SeedGuide[];
  comparison: SeedComparison;
  homepageFaq: SeedFaq[];
}

/**
 * Shared policy text generators so each store ships complete, store-specific
 * legal copy. Replace with lawyer-reviewed text per market before launch.
 */
export function defaultPrivacyPolicy(info: SeedStoreInfo): string {
  return [
    `${info.legalName} ("we") operates ${info.name} at ${info.primaryDomain}. This policy explains what personal data we process and why.`,
    `We process the data you provide when ordering (name, email, delivery address) to fulfill your purchase, including sharing the delivery address with the supplier partner and carrier that ship your order. We process your email for order updates, and for newsletters only if you explicitly subscribe.`,
    `With your consent we collect anonymous analytics events (pages viewed, items added to cart) to improve the store. Necessary cookies for cart and checkout are always active; analytics and marketing cookies are opt-in and can be declined with one click.`,
    `We never sell personal data. Data is retained only as long as needed for orders, accounting law, or until you ask us to delete it. You can request access, correction or deletion of your data at any time by emailing ${info.supportEmail}.`,
  ].join("\n\n");
}

export function defaultTermsOfSale(info: SeedStoreInfo): string {
  return [
    `These terms govern purchases from ${info.name}, operated by ${info.legalName}. By placing an order you accept these terms.`,
    `Prices are shown in ${info.currency} and include the product price only; shipping is shown at checkout. Depending on your country, import taxes or customs duties may be charged on delivery and are your responsibility unless stated otherwise at checkout.`,
    `Orders are fulfilled by third-party supplier partners. Typical delivery is ${info.defaultShippingDaysMin}–${info.defaultShippingDaysMax} business days; the estimate on each product page applies to that item. ${info.name} remains your contract partner: if anything goes wrong with delivery or the product, contact ${info.supportEmail} and we will resolve it.`,
    `${info.returnPolicySummary} Statutory warranty rights in your country remain unaffected by these terms.`,
    `If an item arrives damaged or defective, contact us within 14 days with photos and we will replace or refund it at no cost to you.`,
  ].join("\n\n");
}

```


---

## prisma/seed.ts

```ts
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { computeProductScore } from "../src/lib/products/product-score";
import {
  DEFAULT_STORE_SETTINGS,
  serializeStoreSettings,
} from "../src/lib/settings/store-settings";
import { bambooPolicies, bambooSeed } from "./seed-data/bamboo-toothbrushes";
import { dronesPolicies, dronesSeed } from "./seed-data/drones";
import { ergonomicPolicies, ergonomicSeed } from "./seed-data/ergonomic-office";
import { hikingPolicies, hikingSeed } from "./seed-data/hiking-gear";
import { petGroomingPolicies, petGroomingSeed } from "./seed-data/pet-grooming";
import type { SeedProductInput, SeedStore } from "./seed-data/types";
import { resolveProductImages } from "../src/lib/images/resolve-product-images";

/**
 * Seed script: validates every product with Zod, computes margins and
 * product scores with the same libraries the app uses, and builds five
 * complete stores. Idempotent — re-running wipes and recreates seeded
 * stores by slug.
 *
 * Run with: npm run db:seed
 */

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Suppliers (reliability feeds the product score)
// ---------------------------------------------------------------------------

const SUPPLIERS: Array<{
  name: string;
  type: string;
  reliabilityScore: number;
  averageShippingDays: number;
  notes: string;
}> = [
  { name: "MockSupply Co", type: "aggregator", reliabilityScore: 0.85, averageShippingDays: 10, notes: "Default mock adapter supplier for local development." },
  { name: "SkyTech Wholesale", type: "dropship", reliabilityScore: 0.86, averageShippingDays: 10, notes: "Drone and electronics supplier; lithium battery shipping adds transit time." },
  { name: "GreenLeaf Supply", type: "dropship", reliabilityScore: 0.9, averageShippingDays: 8, notes: "Sustainable consumables; plastic-free packaging program." },
  { name: "ComfortLine Trading", type: "dropship", reliabilityScore: 0.88, averageShippingDays: 9, notes: "Ergonomics and home-office equipment." },
  { name: "PetCare Direct", type: "dropship", reliabilityScore: 0.87, averageShippingDays: 8, notes: "Pet grooming tools and care products." },
  { name: "TrailGear Wholesale", type: "dropship", reliabilityScore: 0.89, averageShippingDays: 10, notes: "Outdoor equipment; weights verified per production batch." },
];

const RELIABILITY = new Map(SUPPLIERS.map((supplier) => [supplier.name, supplier.reliabilityScore]));

// ---------------------------------------------------------------------------
// Validation (inline so the seed runs standalone under tsx)
// ---------------------------------------------------------------------------

const seedProductSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  subtitle: z.string(),
  description: z.string().min(80),
  shortDescription: z.string().min(20).max(300),
  brand: z.string().min(1),
  sku: z.string().min(3),
  price: z.number().positive(),
  cost: z.number().positive(),
  shippingCost: z.number().min(0),
  stockStatus: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "PREORDER"]),
  supplierName: z.string().min(1),
  supplierProductId: z.string().min(1),
  shippingDaysMin: z.number().int().min(1),
  shippingDaysMax: z.number().int().min(1),
  returnable: z.boolean(),
  pros: z.array(z.string()).min(2),
  cons: z.array(z.string()).min(1),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).min(3),
  useCases: z.array(z.string()).min(1),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  seoTitle: z.string().min(10),
  seoDescription: z.string().min(40),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAYMENT_FEE_RATE = 0.029;
const PAYMENT_FEE_FIXED = 0.3;

function grossMarginPercent(product: SeedProductInput): number {
  const fees = product.price * PAYMENT_FEE_RATE + PAYMENT_FEE_FIXED;
  const margin = product.price - product.cost - product.shippingCost - fees;
  return Math.round((margin / product.price) * 1000) / 10;
}

function productImages(
  productSeed: SeedProductInput,
  storeNiche: string
): { imageUrl: string; imageAlt: string; gallery: Array<{ url: string; alt: string; sortOrder: number; isPrimary: boolean }> } {
  const label = encodeURIComponent(productSeed.title.slice(0, 28));
  const placeholder = `/api/placeholder?label=${label}&seed=${productSeed.slug}&niche=${encodeURIComponent(storeNiche)}`;
  const alt = `${productSeed.title} — ${productSeed.subtitle}`;
  return {
    imageUrl: placeholder,
    imageAlt: alt,
    gallery: [{ url: placeholder, alt, sortOrder: 0, isPrimary: true }],
  };
}

function heroImage(title: string, seed: string, niche: string): string {
  return resolveProductImages({
    title,
    slug: seed,
    sku: seed,
    niche,
  }).primaryUrl;
}

// ---------------------------------------------------------------------------
// Store builder
// ---------------------------------------------------------------------------

async function seedStore(
  seed: SeedStore,
  policies: { privacyPolicy: string; termsOfSale: string }
): Promise<void> {
  const { store: info } = seed;
  console.log(`\nSeeding store: ${info.name} (${info.slug})`);

  // Idempotency: wipe and recreate this store.
  await prisma.store.deleteMany({ where: { slug: info.slug } });

  const store = await prisma.store.create({
    data: {
      slug: info.slug,
      name: info.name,
      legalName: info.legalName,
      primaryDomain: info.primaryDomain,
      locale: info.locale,
      currency: info.currency,
      niche: info.niche,
      positioning: info.positioning,
      audience: info.audience,
      valueProposition: info.valueProposition,
      brandVoice: info.brandVoice,
      logoText: info.logoText,
      supportEmail: info.supportEmail,
      supportPhone: info.supportPhone ?? null,
      shippingOriginDisclosure: info.shippingOriginDisclosure,
      defaultShippingDaysMin: info.defaultShippingDaysMin,
      defaultShippingDaysMax: info.defaultShippingDaysMax,
      returnPolicySummary: info.returnPolicySummary,
      privacyPolicy: policies.privacyPolicy,
      termsOfSale: policies.termsOfSale,
      launchStatus: "LIVE",
      isActive: true,
      theme: { create: seed.theme },
      settings: {
        create: { settings: serializeStoreSettings(DEFAULT_STORE_SETTINGS) },
      },
      domains: {
        create: seed.domains.map((hostname, index) => ({
          hostname,
          isPrimary: index === 0,
        })),
      },
    },
  });

  const productIdBySlug = new Map<string, string>();
  let productCount = 0;

  for (const categorySeed of seed.categories) {
    const category = await prisma.category.create({
      data: {
        storeId: store.id,
        slug: categorySeed.slug,
        name: categorySeed.name,
        description: categorySeed.description,
        seoTitle: categorySeed.seoTitle,
        seoDescription: categorySeed.seoDescription,
        heroTitle: categorySeed.heroTitle,
        heroSubtitle: categorySeed.heroSubtitle,
        sortOrder: categorySeed.sortOrder,
      },
    });

    for (const productSeed of categorySeed.products) {
      const validation = seedProductSchema.safeParse(productSeed);
      if (!validation.success) {
        throw new Error(
          `Seed validation failed for ${info.slug}/${productSeed.slug}: ${validation.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ")}`
        );
      }

      const marginPercent = grossMarginPercent(productSeed);
      const productScore = computeProductScore({
        marginPercent,
        shippingDaysMin: productSeed.shippingDaysMin,
        shippingDaysMax: productSeed.shippingDaysMax,
        supplierReliability: RELIABILITY.get(productSeed.supplierName) ?? 0.8,
        stockStatus: productSeed.stockStatus,
        returnRiskRate: productSeed.returnable ? 0.04 : 0.01,
        content: {
          descriptionLength: productSeed.description.length,
          prosCount: productSeed.pros.length,
          consCount: productSeed.cons.length,
          specsCount: productSeed.specs.length,
          faqCount: productSeed.faq.length,
          useCasesCount: productSeed.useCases.length,
          hasImageAlt: true,
        },
      });

      const images = productImages(productSeed, info.niche);

      const product = await prisma.product.create({
        data: {
          storeId: store.id,
          categoryId: category.id,
          slug: productSeed.slug,
          title: productSeed.title,
          subtitle: productSeed.subtitle,
          description: productSeed.description,
          shortDescription: productSeed.shortDescription,
          brand: productSeed.brand,
          sku: productSeed.sku,
          gtin: productSeed.gtin ?? null,
          imageUrl: images.imageUrl,
          imageAlt: images.imageAlt,
          images: { create: images.gallery },
          price: productSeed.price,
          compareAtPrice: productSeed.compareAtPrice ?? null,
          currency: info.currency,
          cost: productSeed.cost,
          shippingCost: productSeed.shippingCost,
          marginPercent,
          stockStatus: productSeed.stockStatus,
          supplierName: productSeed.supplierName,
          supplierProductId: productSeed.supplierProductId,
          supplierSource: productSeed.supplierSource ?? "aliexpress",
          supplierUrl: productSeed.supplierUrl ?? null,
          supplierSearchQuery:
            productSeed.supplierSearchQuery ??
            `${productSeed.title} ${productSeed.subtitle}`.slice(0, 120),
          shippingDaysMin: productSeed.shippingDaysMin,
          shippingDaysMax: productSeed.shippingDaysMax,
          countryOfOrigin: productSeed.countryOfOrigin ?? null,
          materials: productSeed.materials ?? null,
          warranty: productSeed.warranty ?? null,
          returnable: productSeed.returnable,
          // Honesty rule: no fake review data. Ratings stay null/0 until the
          // platform collects real verified reviews.
          ratingAverage: null,
          ratingCount: 0,
          pros: JSON.stringify(productSeed.pros),
          cons: JSON.stringify(productSeed.cons),
          specs: JSON.stringify(productSeed.specs),
          useCases: JSON.stringify(productSeed.useCases),
          faq: JSON.stringify(productSeed.faq),
          seoTitle: productSeed.seoTitle,
          seoDescription: productSeed.seoDescription,
          canonicalUrl: `https://${info.primaryDomain}/p/${productSeed.slug}`,
          productScore,
          isPublished: true,
          noindex: false,
        },
      });

      productIdBySlug.set(productSeed.slug, product.id);
      productCount += 1;
    }
  }

  const resolveIds = (slugs: string[]): string[] =>
    slugs
      .map((slug) => productIdBySlug.get(slug))
      .filter((id): id is string => {
        if (!id) throw new Error(`Unknown product slug referenced in content: ${id}`);
        return true;
      });

  for (const guide of seed.guides) {
    await prisma.contentPage.create({
      data: {
        storeId: store.id,
        slug: guide.slug,
        type: "GUIDE",
        title: guide.title,
        excerpt: guide.excerpt,
        body: guide.body,
        seoTitle: guide.seoTitle,
        seoDescription: guide.seoDescription,
        heroImageUrl: heroImage(guide.title, `guide-${guide.slug}`, info.niche),
        relatedProductIds: JSON.stringify(resolveIds(guide.relatedProductSlugs)),
        isPublished: true,
        noindex: false,
      },
    });
  }

  await prisma.contentPage.create({
    data: {
      storeId: store.id,
      slug: seed.comparison.slug,
      type: "COMPARISON",
      title: seed.comparison.title,
      excerpt: seed.comparison.excerpt,
      body: seed.comparison.body,
      seoTitle: seed.comparison.seoTitle,
      seoDescription: seed.comparison.seoDescription,
      relatedProductIds: JSON.stringify(resolveIds(seed.comparison.productSlugs)),
      isPublished: true,
      noindex: false,
    },
  });

  await prisma.contentPage.create({
    data: {
      storeId: store.id,
      slug: "faq",
      type: "FAQ",
      title: `${info.name} — Frequently asked questions`,
      excerpt: `Shipping, returns and product questions for ${info.name}.`,
      body: JSON.stringify(seed.homepageFaq),
      seoTitle: `FAQ | ${info.name}`,
      seoDescription: `Common questions about shipping, returns and products at ${info.name}.`,
      isPublished: true,
      noindex: false,
    },
  });

  // A featured collection per store (top products by score).
  const topProducts = await prisma.product.findMany({
    where: { storeId: store.id },
    orderBy: { productScore: "desc" },
    take: 4,
    select: { id: true },
  });
  await prisma.collection.create({
    data: {
      storeId: store.id,
      slug: "featured",
      title: "Featured picks",
      description: `The current top-scoring products at ${info.name}.`,
      productIds: JSON.stringify(topProducts.map((product) => product.id)),
      seoTitle: `Featured picks | ${info.name}`,
      seoDescription: `Our current top-rated ${info.niche} picks, ranked by product score.`,
    },
  });

  // Example A/B experiment scaffold (inactive by default).
  await prisma.experiment.create({
    data: {
      storeId: store.id,
      key: "hero-cta-copy",
      name: "Homepage hero CTA copy",
      variantA: JSON.stringify({ cta: "Shop bestsellers" }),
      variantB: JSON.stringify({ cta: "Find my match in 60 seconds" }),
      isActive: false,
    },
  });

  console.log(`  ✓ ${seed.categories.length} categories, ${productCount} products, ${seed.guides.length} guides, 1 comparison, FAQ, collection`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("Seeding suppliers…");
  for (const supplier of SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { name: supplier.name },
      create: supplier,
      update: supplier,
    });
  }

  const stores: Array<[SeedStore, { privacyPolicy: string; termsOfSale: string }]> = [
    [dronesSeed, dronesPolicies],
    [bambooSeed, bambooPolicies],
    [ergonomicSeed, ergonomicPolicies],
    [petGroomingSeed, petGroomingPolicies],
    [hikingSeed, hikingPolicies],
  ];

  for (const [seed, policies] of stores) {
    await seedStore(seed, policies);
  }

  const totals = await prisma.$transaction([
    prisma.store.count(),
    prisma.product.count(),
    prisma.contentPage.count(),
  ]);
  console.log(
    `\nDone: ${totals[0]} stores, ${totals[1]} products, ${totals[2]} content pages.`
  );
  console.log("Open http://localhost:3000/?store=drones to browse.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

```


---

## README.md

```md
# Multi-Store Dropship Factory

One Next.js codebase for many niche storefronts. The app resolves a tenant from host/query/cookie, renders `/s/[store]`, and keeps seeded demo stores, admin, product pages, category pages, guides, cart, checkout stub, SEO and Prisma in one platform.

The current direction is a commerce operating system for many premium niche stores: generated storefronts, provider-backed product discovery, durable media ingestion, candidate review, quality gates, catalog jobs and honest fulfillment modes.

## Local Setup

```bash
pnpm install
pnpm prisma generate
pnpm run db:push:local
pnpm run db:seed:local
pnpm run dev:local
```

Open `/admin` with `ADMIN_PASSWORD`, or preview a store at `/s/drones` or `http://localhost:3010/?store=drones`.

If you see `Store table does not exist`, run `pnpm run db:doctor` — it checks every env file for duplicate `DATABASE_URL` lines (last value wins) and reports which Neon database has your stores. Use `dev:local` / `db:push:local` / `db:seed:local` so commands always read `.env.local`.

## Database Troubleshooting

Never run `vercel env pull .env.local` directly. It can overwrite local database settings and leave `DATABASE_URL` or `DIRECT_URL` empty. Pull Vercel env into `.env.vercel` instead:

```bash
vercel env pull .env.vercel
```

When Prisma complains that the `Store` table does not exist, run:

```bash
pnpm run db:doctor
```

It inspects `.env`, `.env.local`, `.env.vercel`, `.env.production.local`, and `.env.local.backup*`, redacts credentials, probes each unique Postgres URL, and recommends the database that already has Multistore stores.

When `DATABASE_URL` is empty or duplicated in `.env.local`, run:

```bash
pnpm run db:repair-local
```

The repair script backs up `.env.local`, keeps one DB URL per key, prefers the database with `Store` rows, sets `MEDIA_STORAGE_PROVIDER=local`, and sets `NEXT_PUBLIC_SITE_URL=http://localhost:3010`. It does not push schema or seed data.

## Required Credentials

The app works locally with `MEDIA_STORAGE_PROVIDER=local`, `MOCK_CHECKOUT=true` and the `mock` provider. For production, get these first:

| Need | Env vars |
| --- | --- |
| Database | `DATABASE_URL`, `DIRECT_URL` |
| Admin | `ADMIN_PASSWORD` |
| Cron protection | `CRON_SECRET` |
| Runtime object storage | `BLOB_READ_WRITE_TOKEN`, `MEDIA_STORAGE_PROVIDER=vercel-blob` |
| Stripe checkout | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYMENT_CAPTURE_MODE=manual` |
| CJdropshipping | `CJ_ENABLED`, `CJ_API_KEY`, optional `CJ_ACCESS_TOKEN`/`CJ_REFRESH_TOKEN`; order API also needs `CJ_ORDER_API_ENABLED`, `CJ_ORDER_PAY_TYPE`, `CJ_LOGISTIC_NAME`, `CJ_FROM_COUNTRY_CODE` |
| Doba | `DOBA_ENABLED`, `DOBA_ACCESS_KEY`, `DOBA_APP_KEY`, `DOBA_APP_SECRET` |
| eBay Browse API | `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, optional `EBAY_EPN_CAMPAIGN_ID` |
| AliExpress affiliate/open platform | `ALIEXPRESS_APP_KEY`, `ALIEXPRESS_APP_SECRET`, `ALIEXPRESS_TRACKING_ID` |
| AI copy later | `OPENAI_API_KEY`, `AI_PROVIDER` |

Other provider env vars are scaffolded in `.env.example` for Temu, Amazon, Wish and Alibaba. They stay `NOT_CONFIGURED` until authorized credentials are present.

## Architecture

Key runtime paths:

```text
src/app/s/[store]/...              Storefront routes
src/app/admin/import               Candidate review/import UI
src/app/api/cron/catalog-sync      Daily catalog jobs
src/lib/suppliers/providers        Provider contracts and adapters
src/lib/catalog                    Candidate service and quality gates
src/lib/media                      Fetch/hash/ingest/sync media pipeline
src/lib/storage                    Local/Vercel Blob storage providers
src/lib/jobs                       Catalog queue and runner
prisma/schema.prisma               Multi-tenant commerce schema
```

Product discovery flow:

```text
StoreSupplierSettings/import query
  -> CommerceProvider.searchProducts()
  -> ProductCandidate upsert
  -> scoreCandidate + quality gates
  -> admin approve/reject
  -> import as Product draft/noindex
  -> ProductMediaAsset + ProductImage compatibility mirror
```

Supplier search never creates a live product directly. Imported products remain unpublished/noindex until a later quality review marks them ready.

## Provider Capability Model

Every provider exposes explicit capabilities: search, details, images, video, pricing, inventory, checkout, tracking, returns and affiliate links. Missing credentials return `NOT_CONFIGURED` health and do not crash catalog jobs.

Current providers:

| Provider | Status |
| --- | --- |
| `mock` | Functional local discovery/media ingestion |
| `cj` | Official API token/search/detail/media scaffold; order creation is gated behind explicit CJ order env and remains pending unless CJ pay type confirms fulfillment |
| `doba` | Credential-aware scaffold; product/order endpoints stay disabled until the Doba API contract is confirmed |
| `ebay` | Official Browse API search/details when OAuth env vars exist; affiliate mode by default |
| `aliexpress` | Signing scaffold plus fixture mode; no checkout unless explicitly enabled later |
| `temu`, `amazon`, `wish`, `alibaba` | Health/capability scaffolds; no checkout claims |

The project intentionally does not use captcha bypasses, login-wall bypasses, marketplace scraping or reader proxies for AliExpress, eBay, Temu, Amazon, Wish or Alibaba. Use official APIs, affiliate APIs, authorized feeds, supplier-provided feeds or user-provided URLs where fetching is allowed.

## Media Ingestion

Dynamic supplier media is stored at runtime, not committed to Git and not written to `public/catalog`.

Local dev stores under:

```text
public/uploads/dev-media
```

Production should use Vercel Blob with `BLOB_READ_WRITE_TOKEN`. `fetchMedia` only accepts `http`/`https`, rejects unsafe URL schemes, enforces content type/size limits, computes SHA-256 hashes and dedupes stored assets by hash.

`ProductMediaAsset` is the durable media model. `ProductImage` is kept in sync for existing storefront compatibility.

## Catalog Jobs

Vercel cron is configured in `vercel.json`:

```json
{ "path": "/api/cron/catalog-sync", "schedule": "0 3 * * *" }
```

In production the route requires:

```text
Authorization: Bearer $CRON_SECRET
```

Local scripts:

```bash
npm run catalog:health
npm run catalog:discover
npm run catalog:run-jobs
npm run catalog:sync
```

Jobs are small-batch and lock rows with `CatalogJob.lockedAt/lockedBy`, so one run does not try to process every store at once.

## Fulfillment Modes

Products can be `DROPSHIP`, `AFFILIATE`, `MANUAL` or `MOCK`.

Automatic supplier ordering must only be enabled when the provider has an approved checkout/order API. Otherwise the product stays affiliate/manual/mock and should not pretend automatic fulfillment exists.

Stripe PaymentIntent checkout is available when `MOCK_CHECKOUT=false` and Stripe keys exist. Use `PAYMENT_CAPTURE_MODE=manual` for dropship mode: the app authorizes payment first, routes the order to an approved provider, and only captures when fulfillment is confirmed. If a provider returns pending or errors, the uncaptured PaymentIntent is left authorized or cancelled instead of pretending fulfillment succeeded.

Mock checkout remains available for local development with `MOCK_CHECKOUT=true`.

## Quality Gates

Candidates are rejected or require manual review for risky categories such as supplements, medical/cosmetic claims, baby safety products, regulated drones, batteries/chargers without safety info, weapons, adult/restricted products and counterfeit/trademark risk.

A product needs source info, shipping estimate, acceptable margin, enough supplier media and a passing score before it can move toward publication. No fake reviews, fake sales counts, fake scarcity or fake local stock are generated.

## Admin Import

`/admin/import` now shows:

- provider health and missing env vars
- discovery form by store/provider/query
- latest candidates
- score, media ingestion count and rejection reason
- approve/reject buttons
- import approved candidates as draft products
- latest sync runs

## Adding A Provider

1. Add an adapter in `src/lib/suppliers/providers`.
2. Implement the `CommerceProvider` contract.
3. Validate normalized outputs with the shared Zod schemas.
4. Add it to `registry.ts`.
5. Store raw provider signals in candidate/product JSON for audit.
6. Keep unsupported checkout/tracking as explicit unsupported capabilities.

## Launching Many Stores Safely

Use preview/noindex for generated stores, configure providers per store, import candidates into review, publish only products that pass quality gates, and keep merchant feeds limited to live fulfillable products with stored images. Scale by adding StoreSupplierSettings and catalog jobs, not by copying apps.

```


---

## scripts/catalog-sync.ts

```ts
import { prisma } from "@/lib/db";
import { enqueueCatalogJob } from "@/lib/jobs/queue";
import { runQueuedCatalogJobs } from "@/lib/jobs/runner";
import { getProviderHealthReport } from "@/lib/suppliers/catalog/provider-health";

async function main() {
  const command = process.argv[2] ?? "sync";

  if (command === "health") {
    const report = await getProviderHealthReport();
    console.table(
      report.map((provider) => ({
        key: provider.key,
        status: provider.status,
        mode: provider.defaultFulfillmentMode,
        checkout: provider.capabilities.checkout,
        message: provider.message,
      }))
    );
    return;
  }

  if (command === "discover" || command === "sync") {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      take: 10,
      include: { categories: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });
    for (const store of stores) {
      await enqueueCatalogJob({
        storeId: store.id,
        providerKey: "mock",
        jobType: "DISCOVER",
        payload: { query: store.niche, categoryId: store.categories[0]?.id },
      });
    }
  }

  if (command === "run-jobs" || command === "sync" || command === "discover") {
    const summary = await runQueuedCatalogJobs({ workerId: `script-${command}`, timeboxMs: 60_000 });
    console.log(summary);
    return;
  }

  throw new Error(`Unknown catalog command: ${command}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


```


---

## scripts/db-doctor.ts

```ts
import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import {
  CORE_TABLES,
  DB_ENV_KEYS,
  extractDatabaseAssignmentsFromText,
  sanitizeDatabaseUrl,
  uniqueUrlKey,
  type DatabaseEnvKey,
} from "../src/lib/db/env-sanitize";

const ROOT = process.cwd();
const BASE_ENV_FILES = [".env", ".env.local", ".env.vercel", ".env.production.local"] as const;

interface RawEnvValue {
  source: string;
  key: DatabaseEnvKey;
  line?: number;
  value: string;
}

interface UrlProbe {
  url: string;
  sanitized: NonNullable<ReturnType<typeof sanitizeDatabaseUrl>>;
}

interface ProbeResult {
  urlKey: string;
  sanitized: NonNullable<ReturnType<typeof sanitizeDatabaseUrl>>;
  sources: string[];
  publicTableCount: number;
  hasStoreTable: boolean;
  hasProductTable: boolean;
  coreTables: Record<(typeof CORE_TABLES)[number], boolean>;
  storeCount: number | null;
  productCount: number | null;
  error?: string;
}

function discoverEnvFiles(): string[] {
  const backups = fs
    .readdirSync(ROOT)
    .filter((file) => file.startsWith(".env.local.backup"))
    .sort();
  return [...new Set([...BASE_ENV_FILES, ...backups])];
}

function readEnvFile(relativePath: string): string | null {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf8");
}

function collectRawEnvValues(): RawEnvValue[] {
  const collected: RawEnvValue[] = [];

  for (const file of discoverEnvFiles()) {
    const contents = readEnvFile(file);
    if (contents === null) continue;
    for (const entry of extractDatabaseAssignmentsFromText(contents)) {
      collected.push({
        source: `${file}:${entry.line}`,
        key: entry.key,
        line: entry.line,
        value: entry.value,
      });
    }
  }

  for (const key of DB_ENV_KEYS) {
    const value = process.env[key];
    if (value !== undefined) {
      collected.push({ source: "process.env", key, value });
    }
  }

  return collected;
}

function printHeader(title: string) {
  console.log(`\n=== ${title} ===`);
}

function isPostgresUrl(value: string): boolean {
  return /^postgres(?:ql)?:\/\//i.test(value.trim().replace(/^["']|["']$/g, ""));
}

function sanitizeForOutput(value: string): string {
  if (!value.trim()) return "(empty)";
  const sanitized = sanitizeDatabaseUrl(value);
  return sanitized ? `${sanitized.redacted}${sanitized.isPooler ? " [pooler]" : ""}` : "(invalid)";
}

function redactKnownUrls(message: string, rawValues: RawEnvValue[]): string {
  let redacted = message;
  for (const entry of rawValues) {
    const value = entry.value.trim();
    if (!value) continue;
    const sanitized = sanitizeDatabaseUrl(value);
    if (!sanitized) continue;
    redacted = redacted.split(value).join(sanitized.redacted);
  }
  return redacted;
}

async function probeDatabase(
  url: string,
  rawValues: RawEnvValue[]
): Promise<Omit<ProbeResult, "urlKey" | "sanitized" | "sources">> {
  const prisma = new PrismaClient({
    datasources: { db: { url } },
    log: [],
  });

  try {
    const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename ASC
    `;
    const tables = rows.map((row) => row.tablename);
    const coreTables = Object.fromEntries(
      CORE_TABLES.map((table) => [table, tables.includes(table)])
    ) as Record<(typeof CORE_TABLES)[number], boolean>;
    const hasStoreTable = tables.includes("Store");
    const hasProductTable = tables.includes("Product");

    let storeCount: number | null = null;
    let productCount: number | null = null;

    if (hasStoreTable) {
      storeCount = await prisma.store.count();
    }
    if (hasProductTable) {
      productCount = await prisma.product.count();
    }

    return {
      publicTableCount: tables.length,
      hasStoreTable,
      hasProductTable,
      coreTables,
      storeCount,
      productCount,
    };
  } catch (error) {
    return {
      publicTableCount: 0,
      hasStoreTable: false,
      hasProductTable: false,
      coreTables: Object.fromEntries(CORE_TABLES.map((table) => [table, false])) as Record<
        (typeof CORE_TABLES)[number],
        boolean
      >,
      storeCount: null,
      productCount: null,
      error: redactKnownUrls(error instanceof Error ? error.message : String(error), rawValues),
    };
  } finally {
    await prisma.$disconnect();
  }
}

function chooseBestDatabase(results: ProbeResult[]): ProbeResult | null {
  return (
    results
      .filter((result) => !result.error)
      .sort((a, b) => {
        const storeDelta = (b.storeCount ?? 0) - (a.storeCount ?? 0);
        if (storeDelta !== 0) return storeDelta;
        const tableDelta = b.publicTableCount - a.publicTableCount;
        if (tableDelta !== 0) return tableDelta;
        return (b.productCount ?? 0) - (a.productCount ?? 0);
      })[0] ?? null
  );
}

async function main() {
  printHeader("Inspected env files");
  const envFiles = discoverEnvFiles();
  for (const file of envFiles) {
    console.log(`- ${file}: ${fs.existsSync(path.join(ROOT, file)) ? "found" : "missing"}`);
  }

  printHeader("Next.js development env load order");
  loadEnvConfig(ROOT, true);
  console.log("Loaded via @next/env loadEnvConfig(cwd, dev=true)");
  console.log(`NODE_ENV=${process.env.NODE_ENV ?? "(unset)"}`);
  console.log(`VERCEL=${process.env.VERCEL ?? "(unset)"}`);

  printHeader("DATABASE_URL sources (redacted)");
  const rawValues = collectRawEnvValues();
  const duplicateKeys = new Map<string, number>();

  if (rawValues.length === 0) {
    console.log("No DATABASE_URL, DIRECT_URL or DATABASE_URL_UNPOOLED assignments found.");
  }

  for (const entry of rawValues) {
    console.log(`- ${entry.source} ${entry.key} -> ${sanitizeForOutput(entry.value)}`);
    duplicateKeys.set(entry.key, (duplicateKeys.get(entry.key) ?? 0) + 1);
  }

  const duplicateWarnings = [...duplicateKeys.entries()].filter(([, count]) => count > 1);
  if (duplicateWarnings.length > 0) {
    printHeader("Duplicate env keys detected");
    for (const [key, count] of duplicateWarnings) {
      console.log(`- ${key} appears ${count} times across inspected sources/process env`);
      console.log("  Last parsed value wins in dotenv/Next, so empty late values can break Prisma.");
    }
  }

  printHeader("Effective process.env after Next dev load");
  for (const key of DB_ENV_KEYS) {
    const value = process.env[key];
    console.log(`- ${key}: ${value === undefined ? "(unset)" : sanitizeForOutput(value)}`);
  }

  const probesByUrl = new Map<string, UrlProbe>();
  for (const entry of rawValues) {
    if (!isPostgresUrl(entry.value)) continue;
    const sanitized = sanitizeDatabaseUrl(entry.value);
    if (!sanitized || sanitized.host === "invalid-url") continue;
    const urlKey = uniqueUrlKey(entry.value);
    if (!probesByUrl.has(urlKey)) {
      probesByUrl.set(urlKey, { url: entry.value, sanitized });
    }
  }

  printHeader("Database probes");
  const results: ProbeResult[] = [];

  if (probesByUrl.size === 0) {
    console.log("No unique Postgres URLs found to probe.");
  }

  for (const [urlKey, probe] of probesByUrl) {
    console.log(`\nProbing ${probe.sanitized.redacted}`);
    const measured = await probeDatabase(probe.url, rawValues);
    const sources = rawValues
      .filter((entry) => uniqueUrlKey(entry.value) === urlKey)
      .map((entry) => `${entry.source} (${entry.key})`);

    const result: ProbeResult = {
      urlKey,
      sanitized: probe.sanitized,
      sources,
      ...measured,
    };
    results.push(result);

    if (result.error) {
      console.log(`  ERROR: ${result.error}`);
      continue;
    }

    console.log(`  public schema table count: ${result.publicTableCount}`);
    console.log(`  hasStoreTable: ${result.hasStoreTable ? "yes" : "no"}`);
    console.log(`  hasProductTable: ${result.hasProductTable ? "yes" : "no"}`);
    console.log(`  Store row count: ${result.storeCount ?? "n/a"}`);
    console.log(`  Product row count: ${result.productCount ?? "n/a"}`);
    console.log(
      `  Core tables: ${CORE_TABLES.map((table) => `${table}=${result.coreTables[table] ? "yes" : "no"}`).join(", ")}`
    );
    console.log(`  Referenced from: ${sources.join(", ")}`);
  }

  printHeader("Recommendation");
  const effectiveValue = process.env.DATABASE_URL ?? "";
  const effective = sanitizeDatabaseUrl(effectiveValue);
  const effectiveResult = results.find((result) => result.urlKey === uniqueUrlKey(effectiveValue));
  const best = chooseBestDatabase(results);

  if (best && (best.storeCount ?? 0) > 0) {
    console.log("Recommended Multistore database:");
    console.log(`  ${best.sanitized.redacted} (${best.storeCount} stores, ${best.productCount ?? 0} products)`);
    if (effective && effective.host !== "invalid-url" && uniqueUrlKey(effectiveValue) !== best.urlKey) {
      console.log("Current effective DATABASE_URL points somewhere else:");
      console.log(`  ${effective.redacted}`);
      console.log("Run pnpm run db:repair-local to rewrite .env.local toward the seeded database.");
    }
  } else if (best?.hasStoreTable) {
    console.log("A database has the Store table, but no Store rows yet:");
    console.log(`  ${best.sanitized.redacted}`);
    console.log("Seed only after confirming this is the intended local database.");
  } else {
    console.log("No probed database contains Store rows.");
    console.log("After confirming the intended DB, run pnpm run db:push:local and pnpm run db:seed:local manually.");
  }

  if (rawValues.some((entry) => DB_ENV_KEYS.includes(entry.key) && !entry.value.trim())) {
    console.log("One or more DB env assignments are empty. Empty late values are a common Prisma failure mode.");
  }

  if (duplicateWarnings.length > 0) {
    console.log("Duplicate DB env keys found. Keep one value per key in .env.local.");
  }

  if (effectiveResult && !effectiveResult.hasStoreTable) {
    console.log("Current effective DATABASE_URL is missing the Store table.");
  }

  if (best && effectiveResult?.urlKey === best.urlKey && (effectiveResult.storeCount ?? 0) > 0) {
    console.log("Effective DATABASE_URL matches a seeded Multistore database. Local DB looks healthy.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

```


---

## scripts/download-catalog-images.ts

```ts
import fs from "node:fs/promises";
import path from "node:path";
import {
  CATALOG_SOURCE_BY_TAG,
  unsplashPhotoUrl,
} from "../src/lib/images/photo-catalog";

/**
 * Download verified catalog photos into public/catalog/{tag}/NN.jpg
 *
 *   npm run catalog:download
 */

const ROOT = path.join(process.cwd(), "public", "catalog");

async function downloadTag(tag: string, photoIds: string[]): Promise<number> {
  const dir = path.join(ROOT, tag);
  await fs.mkdir(dir, { recursive: true });

  let saved = 0;
  for (let index = 0; index < photoIds.length; index++) {
    const photoId = photoIds[index];
    const fileName = `${String(index + 1).padStart(2, "0")}.jpg`;
    const filePath = path.join(dir, fileName);
    const url = unsplashPhotoUrl(photoId, 800, 800);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${tag}/${fileName} (${photoId}): HTTP ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    saved += 1;
    console.log(`  ✓ ${tag}/${fileName}`);
  }

  return saved;
}

async function main(): Promise<void> {
  let total = 0;
  for (const [tag, photoIds] of Object.entries(CATALOG_SOURCE_BY_TAG)) {
    console.log(`Downloading ${tag} (${photoIds.length} images)...`);
    total += await downloadTag(tag, photoIds);
  }
  console.log(`\nSaved ${total} catalog images to public/catalog/`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

```


---

## scripts/media-smoke.ts

```ts
import { del } from "@vercel/blob";
import { loadEnvConfig } from "@next/env";
import {
  getVercelBlobAuthOptions,
  VercelBlobStorageProvider,
} from "@/lib/storage/vercel-blob-provider";

loadEnvConfig(process.cwd());

async function main() {
  const provider = new VercelBlobStorageProvider();
  const key = `smoke/media-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  const body = Buffer.from(`multistore media smoke ${new Date().toISOString()}\n`, "utf8");

  const uploaded = await provider.putObject({
    key,
    body,
    contentType: "text/plain; charset=utf-8",
  });

  console.log(`Uploaded test blob: ${uploaded.key}`);
  console.log(`URL: ${uploaded.url}`);

  await del(uploaded.url, getVercelBlobAuthOptions());
  console.log("Deleted test blob.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`media:smoke failed: ${message}`);
  if (message.includes("storeId") || message.includes("BLOB_STORE_ID")) {
    console.error(
      "OIDC Blob auth may also need BLOB_STORE_ID locally. Run `vercel env pull` for the connected Blob store or set BLOB_STORE_ID explicitly."
    );
  }
  process.exitCode = 1;
});

```


---

## scripts/refresh-product-images.ts

```ts
import { PrismaClient } from "@prisma/client";
import { syncSupplierImagesForAllStores } from "../src/lib/suppliers/sync-supplier-images";

/**
 * @deprecated Use provider-backed catalog jobs. This shim does not fetch marketplace pages.
 */
const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.warn("db:refresh-images is deprecated. Running sync:supplier-images instead...");
  const delayMs = Number(process.env.SUPPLIER_SYNC_DELAY_MS ?? "1500");
  const batches = await syncSupplierImagesForAllStores(prisma, { delayMs });
  let total = 0;
  for (const batch of batches) {
    total += batch.results.filter((result) => result.imageCount > 0).length;
  }
  console.log(`Updated ${total} products through the legacy image shim.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

```


---

## scripts/repair-local-env.ts

```ts
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  DB_ENV_KEYS,
  extractDatabaseAssignmentsFromText,
  sanitizeDatabaseUrl,
  uniqueUrlKey,
  type DatabaseEnvKey,
} from "../src/lib/db/env-sanitize";

const ROOT = process.cwd();
const LOCAL_ENV_FILE = ".env.local";
const INSPECTED_ENV_FILES = [".env", ".env.local", ".env.vercel", ".env.production.local"] as const;
const MANAGED_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "DATABASE_URL_UNPOOLED",
  "MEDIA_STORAGE_PROVIDER",
  "NEXT_PUBLIC_SITE_URL",
] as const;

interface CandidateUrl {
  value: string;
  key: DatabaseEnvKey;
  source: string;
  sanitized: NonNullable<ReturnType<typeof sanitizeDatabaseUrl>>;
  urlKey: string;
  storeCount: number | null;
  productCount: number | null;
  hasStoreTable: boolean;
  error?: string;
}

function assertNotProduction() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production"
  ) {
    throw new Error("Refusing to repair .env.local while running in a production/Vercel context.");
  }
}

function discoverEnvFiles(): string[] {
  const backups = fs
    .readdirSync(ROOT)
    .filter((file) => file.startsWith(".env.local.backup"))
    .sort();
  return [...new Set([...INSPECTED_ENV_FILES, ...backups])];
}

function readFileIfExists(relativePath: string): string | null {
  const fullPath = path.join(ROOT, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : null;
}

function isPostgresUrl(value: string): boolean {
  return /^postgres(?:ql)?:\/\//i.test(value.trim().replace(/^["']|["']$/g, ""));
}

function redact(value: string): string {
  return sanitizeDatabaseUrl(value)?.redacted ?? "(invalid)";
}

function collectCandidateUrls(): Array<Omit<CandidateUrl, "storeCount" | "productCount" | "hasStoreTable" | "error">> {
  const candidates: Array<Omit<CandidateUrl, "storeCount" | "productCount" | "hasStoreTable" | "error">> = [];

  for (const file of discoverEnvFiles()) {
    const contents = readFileIfExists(file);
    if (contents === null) continue;
    for (const assignment of extractDatabaseAssignmentsFromText(contents)) {
      if (!isPostgresUrl(assignment.value)) continue;
      const sanitized = sanitizeDatabaseUrl(assignment.value);
      if (!sanitized || sanitized.host === "invalid-url") continue;
      candidates.push({
        value: assignment.value,
        key: assignment.key,
        source: `${file}:${assignment.line}`,
        sanitized,
        urlKey: uniqueUrlKey(assignment.value),
      });
    }
  }

  const unique = new Map<string, Omit<CandidateUrl, "storeCount" | "productCount" | "hasStoreTable" | "error">>();
  for (const candidate of candidates) {
    if (!unique.has(candidate.urlKey)) unique.set(candidate.urlKey, candidate);
  }
  return [...unique.values()];
}

async function probeCandidate(
  candidate: Omit<CandidateUrl, "storeCount" | "productCount" | "hasStoreTable" | "error">
): Promise<CandidateUrl> {
  const prisma = new PrismaClient({
    datasources: { db: { url: candidate.value } },
    log: [],
  });

  try {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
    `;
    const tableNames = new Set(tables.map((table) => table.tablename));
    const hasStoreTable = tableNames.has("Store");
    const hasProductTable = tableNames.has("Product");
    return {
      ...candidate,
      hasStoreTable,
      storeCount: hasStoreTable ? await prisma.store.count() : null,
      productCount: hasProductTable ? await prisma.product.count() : null,
    };
  } catch (error) {
    return {
      ...candidate,
      hasStoreTable: false,
      storeCount: null,
      productCount: null,
      error: error instanceof Error ? error.message.split(candidate.value).join(redact(candidate.value)) : String(error),
    };
  } finally {
    await prisma.$disconnect();
  }
}

function parseLocalAssignments(contents: string): Map<string, string[]> {
  const values = new Map<string, string[]>();
  const lines = contents.split("\n");
  for (const line of lines) {
    const trimmed = line.trim().startsWith("export ")
      ? line.trim().slice("export ".length).trim()
      : line.trim();
    for (const key of MANAGED_KEYS) {
      if (trimmed.startsWith(`${key}=`)) {
        const value = trimmed.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
        values.set(key, [...(values.get(key) ?? []), value]);
      }
    }
  }
  return values;
}

function sameDatabaseFamily(a: CandidateUrl, b: CandidateUrl): boolean {
  return a.sanitized.pathname === b.sanitized.pathname;
}

function chooseSeededCandidate(candidates: CandidateUrl[]): CandidateUrl | null {
  return (
    candidates
      .filter((candidate) => !candidate.error)
      .sort((a, b) => {
        const storeDelta = (b.storeCount ?? 0) - (a.storeCount ?? 0);
        if (storeDelta !== 0) return storeDelta;
        if (a.sanitized.isPooler !== b.sanitized.isPooler) return a.sanitized.isPooler ? 1 : -1;
        return (b.productCount ?? 0) - (a.productCount ?? 0);
      })[0] ?? null
  );
}

function chooseUrls(candidates: CandidateUrl[], localValues: Map<string, string[]>): {
  databaseUrl: string;
  directUrl: string;
  unpooledUrl: string;
  reason: string;
  selected: CandidateUrl | null;
} {
  const seeded = candidates.filter((candidate) => (candidate.storeCount ?? 0) > 0);
  const selected = chooseSeededCandidate(seeded) ?? chooseSeededCandidate(candidates);
  if (selected) {
    const sameFamily = candidates.filter((candidate) => sameDatabaseFamily(candidate, selected));
    const pooler = sameFamily.find((candidate) => candidate.sanitized.isPooler && !candidate.error);
    const unpooled = sameFamily.find((candidate) => !candidate.sanitized.isPooler && !candidate.error);
    return {
      databaseUrl: (pooler ?? selected).value,
      directUrl: (unpooled ?? selected).value,
      unpooledUrl: (unpooled ?? selected).value,
      reason:
        (selected.storeCount ?? 0) > 0
          ? "selected database with existing Store rows"
          : "selected first reachable database because no Store rows were found",
      selected,
    };
  }

  const localUnpooled = localValues.get("DATABASE_URL_UNPOOLED")?.find(isPostgresUrl);
  const localDatabaseUrl = localValues.get("DATABASE_URL")?.find(isPostgresUrl);
  const fallback = localUnpooled ?? localDatabaseUrl;
  if (fallback) {
    return {
      databaseUrl: fallback,
      directUrl: fallback,
      unpooledUrl: fallback,
      reason: "copied valid local DATABASE_URL_UNPOOLED/DATABASE_URL fallback",
      selected: null,
    };
  }

  throw new Error("No valid Postgres URL found in .env, .env.local, .env.vercel, .env.production.local or .env.local.backup*.");
}

function isManagedLine(line: string): boolean {
  const trimmed = line.trim().startsWith("export ")
    ? line.trim().slice("export ".length).trim()
    : line.trim();
  return MANAGED_KEYS.some((key) => trimmed.startsWith(`${key}=`));
}

function renderLocalEnv(contents: string, values: { databaseUrl: string; directUrl: string; unpooledUrl: string }): string {
  const preservedLines = contents
    .split("\n")
    .filter((line) => !isManagedLine(line))
    .join("\n")
    .replace(/\s+$/g, "");

  const managedBlock = [
    "# Local database/media settings managed by pnpm run db:repair-local",
    `DATABASE_URL=***REDACTED***
    `DIRECT_URL=${values.directUrl}`,
    `DATABASE_URL_UNPOOLED=${values.unpooledUrl}`,
    "MEDIA_STORAGE_PROVIDER=local",
    "NEXT_PUBLIC_SITE_URL=http://localhost:3010",
  ].join("\n");

  return `${preservedLines ? `${preservedLines}\n\n` : ""}${managedBlock}\n`;
}

function backupLocalEnv(contents: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
  const backupFile = `${LOCAL_ENV_FILE}.backup-db-repair-${stamp}`;
  fs.writeFileSync(path.join(ROOT, backupFile), contents);
  return backupFile;
}

async function main() {
  assertNotProduction();

  const localPath = path.join(ROOT, LOCAL_ENV_FILE);
  const localContents = fs.existsSync(localPath) ? fs.readFileSync(localPath, "utf8") : "";
  const localValues = parseLocalAssignments(localContents);
  const candidates = await Promise.all(collectCandidateUrls().map(probeCandidate));
  const selectedUrls = chooseUrls(candidates, localValues);
  const nextContents = renderLocalEnv(localContents, selectedUrls);

  if (nextContents === localContents) {
    console.log(".env.local is already normalized.");
    console.log(`DATABASE_URL: ${redact(selectedUrls.databaseUrl)}`);
    return;
  }

  const backupFile = backupLocalEnv(localContents);
  fs.writeFileSync(localPath, nextContents);

  console.log(`Backed up .env.local to ${backupFile}`);
  console.log(`Repaired .env.local (${selectedUrls.reason}).`);
  console.log(`DATABASE_URL: ${redact(selectedUrls.databaseUrl)}`);
  console.log(`DIRECT_URL: ${redact(selectedUrls.directUrl)}`);
  console.log("MEDIA_STORAGE_PROVIDER=local");
  console.log("NEXT_PUBLIC_SITE_URL=http://localhost:3010");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

```


---

## scripts/smoke.mjs

```mjs
const paths = [
  "/?store=drones",
  "/s/bamboo-toothbrushes",
  "/s/drones/c/fpv-racing",
  "/s/drones/p/aero-s1-mini-4k",
  "/s/hiking-gear/guides",
  "/s/ergonomic-office/compare",
  "/s/pet-grooming/quiz",
  "/s/drones/cart",
  "/s/drones/checkout",
  "/s/drones/search?q=drone",
  "/s/bamboo-toothbrushes/policies/shipping",
  "/s/drones/policies/returns",
  "/s/drones/policies/privacy",
  "/s/drones/policies/terms",
  "/admin",
  "/admin/login",
  "/robots.txt",
  "/sitemap.xml",
  "/api/feeds/google?store=drones",
  "/api/placeholder?label=Test&seed=x",
];

let failures = 0;
for (const path of paths) {
  const res = await fetch(`http://localhost:3000${path}`, { redirect: "follow" });
  const ok = res.status === 200;
  if (!ok) failures += 1;
  console.log(`${ok ? "OK " : "FAIL"} ${res.status} ${path}`);
}
process.exit(failures === 0 ? 0 : 1);

```


---

## scripts/sync-supplier-images.ts

```ts
import { PrismaClient } from "@prisma/client";
import {
  syncSupplierImagesForAllStores,
  syncSupplierImagesForStore,
} from "../src/lib/suppliers/sync-supplier-images";

/**
 * Deprecated legacy image sync shim.
 * Runtime supplier media now flows through provider adapters and catalog jobs.
 *
 *   npm run sync:supplier-images
 *   npm run sync:supplier-images -- --store=pet-grooming
 */

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const storeArg = process.argv.find((arg) => arg.startsWith("--store="));
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const storeSlug = storeArg?.split("=")[1];
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
  const delayMs = Number(process.env.SUPPLIER_SYNC_DELAY_MS ?? "800");

  if (storeSlug) {
    console.log(`Syncing supplier images for store: ${storeSlug}${limit ? ` (limit ${limit})` : ""}`);
    const results = await syncSupplierImagesForStore(prisma, storeSlug, { delayMs, limit });
    const ok = results.filter((result) => result.imageCount > 0).length;
    console.log(`Updated ${ok}/${results.length} products.`);
    for (const result of results) {
      if (result.error) {
        console.warn(`  ✗ ${result.slug}: ${result.error}`);
      } else {
        console.log(`  ✓ ${result.slug}: ${result.imageCount} images`);
      }
    }
    return;
  }

  console.log("Syncing supplier images for all active stores...");
  const batches = await syncSupplierImagesForAllStores(prisma, { delayMs, limitPerStore: 999 });
  let totalOk = 0;
  let totalProducts = 0;
  for (const batch of batches) {
    const ok = batch.results.filter((result) => result.imageCount > 0).length;
    totalOk += ok;
    totalProducts += batch.results.length;
    console.log(`  ${batch.storeSlug}: ${ok}/${batch.results.length} products updated`);
  }
  console.log(`\nDone. ${totalOk}/${totalProducts} products updated by legacy image shim.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

```


---

## src/app/admin/content/page.tsx

```tsx
import { requireAdmin } from "@/lib/admin/auth";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireAdmin();
  return (
    <ComingSoon
      title="Content"
      description="Edit guides, comparisons, FAQ and landing pages per store."
      phase="Phase 2 · content CRUD"
    />
  );
}

```


---

## src/app/admin/experiments/page.tsx

```tsx
import { requireAdmin } from "@/lib/admin/auth";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const dynamic = "force-dynamic";

export default async function AdminExperimentsPage() {
  await requireAdmin();
  return (
    <ComingSoon
      title="Experiments"
      description="Create A/B tests with sticky cookie assignment and conversion tracking."
      phase="Phase 2 · A/B runtime"
    />
  );
}

```


---

## src/app/admin/generator/page.tsx

```tsx
import { requireAdmin } from "@/lib/admin/auth";
import { GeneratorForms } from "@/components/admin/GeneratorForms";

export const dynamic = "force-dynamic";

export default async function AdminGeneratorPage() {
  await requireAdmin();

  return (
    <div>
      <h1 className="text-2xl font-bold">Store factory</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-500">
        Describe a niche → generate a blueprint → create a preview store with categories, products,
        FAQ and a buying guide. No real domain required until you are ready to go Live and connect
        DNS.
      </p>
      <div className="mt-8">
        <GeneratorForms />
      </div>
    </div>
  );
}

```


---

## src/app/admin/import/page.tsx

```tsx
import { requireAdmin } from "@/lib/admin/auth";
import {
  approveCandidateAction,
  importApprovedCandidatesAction,
  rejectCandidateAction,
  runDiscoveryAction,
} from "@/lib/actions/admin-import";
import { prisma } from "@/lib/db";
import { getProviderHealthReport } from "@/lib/suppliers/catalog/provider-health";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  await requireAdmin();

  const [stores, providers, candidates, runs] = await Promise.all([
    prisma.store.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: { categories: { orderBy: { sortOrder: "asc" } } },
    }),
    getProviderHealthReport(),
    prisma.productCandidate.findMany({
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: { store: true, category: true, mediaAssets: true },
    }),
    prisma.catalogSyncRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 8,
      include: { store: true },
    }),
  ]);

  const defaultStore = stores[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Supplier import</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Discover supplier candidates, review quality gates, approve safe products and import them as unpublished drafts.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Run discovery</h2>
        <form action={runDiscoveryAction} className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_2fr_auto]">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Store</span>
            <select name="storeId" className="input" defaultValue={defaultStore?.id}>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Provider</span>
            <select name="providerKey" className="input" defaultValue="mock">
              {providers.map((provider) => (
                <option key={provider.key} value={provider.key}>
                  {provider.name} ({provider.status})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Query</span>
            <input name="query" className="input" defaultValue="ergonomic office" required />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Category</span>
            <select name="categoryId" className="input">
              <option value="">Auto</option>
              {defaultStore?.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-primary lg:col-start-4" type="submit">
            Run discovery now
          </button>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {providers.map((provider) => (
          <article key={provider.key} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{provider.name}</h2>
                <p className="text-xs uppercase tracking-wide text-slate-500">{provider.key}</p>
              </div>
              <span className={statusClass(provider.status)}>{provider.status}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{provider.message}</p>
            {provider.missingEnv?.length ? (
              <p className="mt-2 text-xs text-amber-700">Missing: {provider.missingEnv.join(", ")}</p>
            ) : null}
            <p className="mt-3 text-xs text-slate-500">
              Mode: {provider.defaultFulfillmentMode} · Checkout: {provider.capabilities.checkout ? "yes" : "no"}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-semibold">Candidates</h2>
            <p className="text-sm text-slate-500">Latest discovered products across all stores.</p>
          </div>
          {defaultStore && (
            <form action={importApprovedCandidatesAction}>
              <input type="hidden" name="storeId" value={defaultStore.id} />
              <button className="btn-secondary" type="submit">
                Import approved for {defaultStore.name}
              </button>
            </form>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Media</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td className="max-w-xs px-4 py-3">
                    <p className="font-medium text-slate-900">{candidate.titleEnhanced ?? candidate.titleRaw}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{candidate.descriptionRaw}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {candidate.store.name}
                    {candidate.category ? <span className="block text-xs text-slate-400">{candidate.category.name}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{candidate.providerKey}</td>
                  <td className="px-4 py-3 font-semibold">{candidate.score.toFixed(1)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {candidate.mediaAssets.filter((asset) => asset.ingestionStatus === "STORED").length}/
                    {candidate.mediaAssets.length}
                  </td>
                  <td className="px-4 py-3">
                    <span className={candidateStatusClass(candidate.status)}>{candidate.status}</span>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-xs leading-5 text-slate-500">
                    {candidate.rejectionReason || "Ready for review."}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {candidate.status !== "APPROVED" && candidate.status !== "IMPORTED" ? (
                        <form action={approveCandidateAction}>
                          <input type="hidden" name="candidateId" value={candidate.id} />
                          <button className="rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700" type="submit">
                            Approve
                          </button>
                        </form>
                      ) : null}
                      {candidate.status !== "REJECTED" && candidate.status !== "IMPORTED" ? (
                        <form action={rejectCandidateAction}>
                          <input type="hidden" name="candidateId" value={candidate.id} />
                          <input type="hidden" name="reason" value="Rejected by admin." />
                          <button className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700" type="submit">
                            Reject
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {candidates.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                    No candidates yet. Run discovery with the mock provider to test the pipeline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Last sync runs</h2>
        <div className="mt-4 grid gap-3">
          {runs.map((run) => (
            <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 p-3 text-sm">
              <span className="font-medium">{run.store?.name ?? "All stores"} · {run.providerKey ?? "all providers"}</span>
              <span>{run.status}</span>
              <span className="text-slate-500">{run.startedAt.toLocaleString()}</span>
              {run.errorMessage ? <span className="text-xs text-red-600">{run.errorMessage}</span> : null}
            </div>
          ))}
          {runs.length === 0 ? <p className="text-sm text-slate-500">No catalog sync runs yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

function statusClass(status: string): string {
  const base = "rounded-full px-2.5 py-1 text-xs font-semibold";
  if (status === "OK") return `${base} bg-emerald-100 text-emerald-800`;
  if (status === "DEGRADED") return `${base} bg-amber-100 text-amber-800`;
  if (status === "ERROR") return `${base} bg-red-100 text-red-800`;
  return `${base} bg-slate-100 text-slate-700`;
}

function candidateStatusClass(status: string): string {
  const base = "rounded-full px-2.5 py-1 text-xs font-semibold";
  if (status === "APPROVED") return `${base} bg-emerald-100 text-emerald-800`;
  if (status === "IMPORTED") return `${base} bg-blue-100 text-blue-800`;
  if (status === "REJECTED" || status === "ERROR") return `${base} bg-red-100 text-red-800`;
  return `${base} bg-slate-100 text-slate-700`;
}


```


---

## src/app/admin/layout.tsx

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { adminLogoutAction } from "@/lib/actions/admin";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Admin | Multi-Store Dropship Factory",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const authenticated = await isAdminAuthenticated();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin" className="text-sm font-extrabold tracking-tight">
            MSDF <span className="font-normal text-slate-500">Admin</span>
          </Link>
          {authenticated && (
            <form action={adminLogoutAction}>
              <button
                type="submit"
                className="text-sm font-medium text-slate-500 underline hover:text-slate-900"
              >
                Log out
              </button>
            </form>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[180px_1fr]">
        {authenticated && (
          <aside className="mb-6 lg:mb-0">
            <AdminNav />
          </aside>
        )}
        <main className={authenticated ? "" : "lg:col-span-2"}>{children}</main>
      </div>
    </div>
  );
}

```


---

## src/app/admin/login/page.tsx

```tsx
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold">Admin login</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter the value of <code className="rounded bg-slate-100 px-1">ADMIN_PASSWORD</code>{" "}
        from your environment.
      </p>
      <div className="mt-5">
        <AdminLoginForm />
      </div>
    </div>
  );
}

```


---

## src/app/admin/orders/page.tsx

```tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminOrders } from "@/lib/admin/commerce-dashboard";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await getAdminOrders(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-600">
          Payment, fulfillment and supplier routing status across all stores.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Order status</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Error</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  No orders yet. Complete a mock or Stripe checkout to create one.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-slate-100 align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{order.orderNumber}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/stores/${order.store.slug}/edit`} className="text-primary hover:underline">
                    {order.store.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs">
                  {order.customer?.name ?? "—"}
                  <div className="text-slate-500">{order.customer?.email ?? "—"}</div>
                </td>
                <td className="px-4 py-3">
                  {order.grandTotal.toFixed(2)} {order.currency}
                </td>
                <td className="px-4 py-3">{order.status}</td>
                <td className="px-4 py-3">
                  <div>{order.paymentStatus}</div>
                  <div className="text-xs text-slate-500">{order.paymentProvider ?? "—"}</div>
                </td>
                <td className="px-4 py-3">{order.fulfillmentStatus}</td>
                <td className="px-4 py-3 text-xs">
                  {order.supplierOrders.length === 0
                    ? "—"
                    : order.supplierOrders
                        .map((supplierOrder) => `${supplierOrder.providerKey}:${supplierOrder.status}`)
                        .join(", ")}
                </td>
                <td className="px-4 py-3 text-xs text-red-700">{order.paymentError ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

```


---

## src/app/admin/page.tsx

```tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [storeCount, productCount, publishedCount, subscriberCount, eventGroups] =
    await Promise.all([
      prisma.store.count(),
      prisma.product.count(),
      prisma.product.count({ where: { isPublished: true } }),
      prisma.newsletterSubscriber.count(),
      prisma.cartEvent.groupBy({
        by: ["eventName"],
        _count: { eventName: true },
        orderBy: { _count: { eventName: "desc" } },
        take: 10,
      }),
    ]);

  const missingSeo = await prisma.product.count({
    where: { OR: [{ seoTitle: "" }, { seoDescription: "" }] },
  });

  const stats = [
    { label: "Stores", value: storeCount, href: "/admin/stores" },
    { label: "Products", value: productCount, href: "/admin/products" },
    { label: "Published products", value: publishedCount, href: "/admin/products" },
    { label: "Products missing SEO", value: missingSeo, href: "/admin/products" },
    { label: "Newsletter subscribers", value: subscriberCount, href: "/admin" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Platform-wide overview. Margin and monetization insights are internal
        and never shown on storefronts.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400"
          >
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Analytics events</h2>
        <p className="mt-1 text-sm text-slate-500">
          First-party events recorded in the CartEvent table.
        </p>
        {eventGroups.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            No events yet. Browse a storefront (and accept analytics cookies)
            to start collecting.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Event</th>
                  <th className="px-4 py-2.5 font-medium">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventGroups.map((group) => (
                  <tr key={group.eventName}>
                    <td className="px-4 py-2.5 font-mono text-xs">{group.eventName}</td>
                    <td className="px-4 py-2.5">{group._count.eventName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

```


---

## src/app/admin/products/page.tsx

```tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { calculateGrossMargin } from "@/lib/monetization/margin";
import { suggestBundles } from "@/lib/monetization/bundles";
import { buildProductInsights } from "@/lib/monetization/recommendations";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ store?: string }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { store: storeFilter } = await searchParams;

  const stores = await prisma.store.findMany({ orderBy: { name: "asc" } });
  const activeStore =
    stores.find((store) => store.slug === storeFilter) ?? stores[0];

  if (!activeStore) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No stores seeded yet. Run <code>npm run db:seed</code> first.
        </p>
      </div>
    );
  }

  const products = await prisma.product.findMany({
    where: { storeId: activeStore.id },
    orderBy: { productScore: "desc" },
    include: { category: { select: { name: true } } },
  });

  const insights = buildProductInsights(activeStore, products);
  const insightById = new Map(insights.map((insight) => [insight.productId, insight]));
  const bundles = suggestBundles(products, 5);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-slate-500">
            Internal commercial view: product score, margins, SEO completeness
            and monetization recommendations.
          </p>
        </div>
        <nav aria-label="Filter by store" className="flex flex-wrap gap-2">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/admin/products?store=${store.slug}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                store.id === activeStore.id
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {store.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Margin</th>
              <th className="px-4 py-3 font-medium">SEO</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Monetization notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => {
              const margin = calculateGrossMargin(product);
              const insight = insightById.get(product.id);
              const missingSeo: string[] = [];
              if (!product.seoTitle) missingSeo.push("title");
              if (!product.seoDescription) missingSeo.push("description");
              if (!product.imageAlt) missingSeo.push("image alt");

              return (
                <tr key={product.id}>
                  <td className="max-w-64 px-4 py-3">
                    <Link
                      href={`/admin/stores/${activeStore.slug}/products/${product.slug}/edit`}
                      className="font-semibold text-blue-700 hover:underline"
                    >
                      {product.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {product.sku} ·{" "}
                      <Link
                        href={`/s/${activeStore.slug}/p/${product.slug}`}
                        className="underline hover:text-slate-700"
                      >
                        view
                      </Link>
                    </p>
                  </td>
                  <td className="px-4 py-3">{product.category.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        product.productScore >= 70
                          ? "bg-emerald-100 text-emerald-800"
                          : product.productScore >= 50
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.productScore.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{margin.grossMarginPercent.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">{margin.health}</p>
                  </td>
                  <td className="px-4 py-3">
                    {missingSeo.length === 0 ? (
                      <span className="text-xs text-emerald-700">Complete</span>
                    ) : (
                      <span className="text-xs text-red-700">
                        Missing: {missingSeo.join(", ")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {!product.isPublished && (
                      <span className="mr-1 rounded bg-slate-200 px-1.5 py-0.5">unpublished</span>
                    )}
                    {product.noindex && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">noindex</span>
                    )}
                    {product.isPublished && !product.noindex && (
                      <span className="text-emerald-700">live + indexable</span>
                    )}
                  </td>
                  <td className="max-w-64 px-4 py-3 text-xs text-slate-600">
                    {insight?.affiliateFallbackRecommended && (
                      <p className="text-red-700">
                        Margin too thin — consider affiliate fallback.
                      </p>
                    )}
                    {insight?.subscriptionSuitable && (
                      <p>{insight.subscriptionReason}</p>
                    )}
                    {insight && insight.upsellCandidates.length > 0 && (
                      <p>
                        Upsell: {insight.upsellCandidates[0].title}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Bundle suggestions</h2>
        <p className="mt-1 text-sm text-slate-500">
          Cross-category pairs with overlapping use cases that keep ≥20%
          margin after an 8% bundle discount.
        </p>
        {bundles.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            No margin-safe bundles found for this store yet.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {bundles.map((bundle) => (
              <li
                key={`${bundle.anchorProductId}-${bundle.companionProductId}`}
                className="rounded-xl border border-slate-200 bg-white p-4 text-sm"
              >
                <p className="font-semibold">
                  {bundle.anchorTitle} + {bundle.companionTitle}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Bundle at {bundle.suggestedBundlePrice.toFixed(2)} (vs{" "}
                  {bundle.combinedPrice.toFixed(2)}) · margin{" "}
                  {bundle.combinedMarginPercent.toFixed(1)}% · shared:{" "}
                  {bundle.sharedUseCases.join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

```


---

## src/app/admin/providers/page.tsx

```tsx
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminProviderDashboard } from "@/lib/admin/commerce-dashboard";

export default async function AdminProvidersPage() {
  await requireAdmin();
  const providers = await getAdminProviderDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Supplier providers</h1>
        <p className="mt-1 text-sm text-slate-600">
          Health, credentials, capabilities and checkout support for each fulfillment source.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Health</th>
              <th className="px-4 py-3">Capabilities</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3">Stores</th>
              <th className="px-4 py-3">Last sync</th>
              <th className="px-4 py-3">Order API</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((row) => (
              <tr key={row.key} className="border-b border-slate-100 align-top">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {row.name}
                  <div className="text-xs font-normal text-slate-500">{row.key}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={row.health.status} />
                  <p className="mt-1 max-w-xs text-xs text-slate-500">{row.health.message}</p>
                  {row.health.missingEnv && row.health.missingEnv.length > 0 && (
                    <p className="mt-1 text-xs text-amber-700">
                      Missing: {row.health.missingEnv.join(", ")}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <CapabilityList capabilities={row.health.capabilities} />
                </td>
                <td className="px-4 py-3 text-xs">{row.health.defaultFulfillmentMode}</td>
                <td className="px-4 py-3">{row.enabledStores}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {row.lastSync ? new Date(row.lastSync).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-xs">{row.orderApiStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    OK: "bg-emerald-100 text-emerald-800",
    NOT_CONFIGURED: "bg-slate-100 text-slate-700",
    DEGRADED: "bg-amber-100 text-amber-800",
    ERROR: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[value] ?? colors.NOT_CONFIGURED}`}>
      {value}
    </span>
  );
}

function CapabilityList({
  capabilities,
}: {
  capabilities: {
    search: boolean;
    details: boolean;
    images: boolean;
    checkout: boolean;
    tracking: boolean;
  };
}) {
  const items = [
    capabilities.search && "search",
    capabilities.details && "details",
    capabilities.images && "images",
    capabilities.checkout && "checkout",
    capabilities.tracking && "tracking",
  ].filter(Boolean);
  return <span>{items.join(", ") || "none"}</span>;
}

```


---

## src/app/admin/seo-audit/page.tsx

```tsx
import { requireAdmin } from "@/lib/admin/auth";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const dynamic = "force-dynamic";

export default async function AdminSeoAuditPage() {
  await requireAdmin();
  return (
    <ComingSoon
      title="SEO audit"
      description="Per-store report of missing SEO fields, weak products and launch readiness."
      phase="Phase 2 · SEO audit + launch checklist"
    />
  );
}

```


---

## src/app/admin/stores/[slug]/edit/page.tsx

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { parseStoreSettings } from "@/lib/settings/store-settings";
import { getStorePreviewUrl } from "@/lib/stores/preview-url";
import { GoLiveButton } from "@/components/admin/GoLiveButton";
import { StoreEditForm } from "@/components/admin/StoreEditForm";

export const dynamic = "force-dynamic";

const DEFAULT_THEME = {
  primaryColor: "#1d4ed8",
  secondaryColor: "#1e293b",
  accentColor: "#f59e0b",
  backgroundColor: "#f8fafc",
  textColor: "#0f172a",
  borderRadius: "0.75rem",
  fontHeading: "system-ui",
  fontBody: "system-ui",
};

export default async function StoreEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug },
    include: { theme: true, domains: true, settings: true },
  });
  if (!store) notFound();

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-slate-500">
        <Link href="/admin/stores" className="hover:underline">
          Stores
        </Link>{" "}
        / <span className="text-slate-900">{store.name}</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Edit {store.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Brand, domains, theme and per-store settings.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/stores/${store.slug}/products`}
            className="rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Products
          </Link>
          <Link
            href={`/s/${store.slug}`}
            className="rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            View storefront
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <GoLiveButton slug={store.slug} launchStatus={store.launchStatus} />
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">Preview URL</p>
          <a
            href={getStorePreviewUrl(store.slug)}
            className="mt-1 block break-all font-mono text-blue-700 underline"
          >
            {getStorePreviewUrl(store.slug)}
          </a>
          {store.plannedDomain && (
            <p className="mt-2">
              Planned domain: <span className="font-mono">{store.plannedDomain}</span>
            </p>
          )}
        </div>
      </div>

      <StoreEditForm
        slug={store.slug}
        store={{
          name: store.name,
          legalName: store.legalName,
          primaryDomain: store.primaryDomain,
          locale: store.locale,
          currency: store.currency,
          niche: store.niche,
          positioning: store.positioning,
          audience: store.audience,
          valueProposition: store.valueProposition,
          brandVoice: store.brandVoice,
          logoText: store.logoText,
          supportEmail: store.supportEmail,
          supportPhone: store.supportPhone,
          shippingOriginDisclosure: store.shippingOriginDisclosure,
          defaultShippingDaysMin: store.defaultShippingDaysMin,
          defaultShippingDaysMax: store.defaultShippingDaysMax,
          returnPolicySummary: store.returnPolicySummary,
          privacyPolicy: store.privacyPolicy,
          termsOfSale: store.termsOfSale,
          isActive: store.isActive,
        }}
        theme={store.theme ?? DEFAULT_THEME}
        domains={store.domains.map((domain) => domain.hostname)}
        settings={parseStoreSettings(store.settings?.settings)}
      />
    </div>
  );
}

```


---

## src/app/admin/stores/[slug]/products/[productSlug]/edit/page.tsx

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { parseFaq, parseSpecs, parseStringArray } from "@/lib/utils/json";
import { ProductEditForm } from "@/components/admin/ProductEditForm";
import { ProductImageManager } from "@/components/admin/ProductImageManager";

export const dynamic = "force-dynamic";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  await requireAdmin();
  const { slug, productSlug } = await params;

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();

  const product = await prisma.product.findUnique({
    where: { storeId_slug: { storeId: store.id, slug: productSlug } },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) notFound();

  const [categories, suppliers] = await Promise.all([
    prisma.category.findMany({
      where: { storeId: store.id },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);

  const specsText = parseSpecs(product.specs)
    .map((spec) => `${spec.label} | ${spec.value}`)
    .join("\n");
  const faqText = parseFaq(product.faq)
    .map((item) => `${item.question} | ${item.answer}`)
    .join("\n");

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-slate-500">
        <Link href="/admin/stores" className="hover:underline">
          Stores
        </Link>{" "}
        /{" "}
        <Link href={`/admin/stores/${store.slug}/products`} className="hover:underline">
          {store.name}
        </Link>{" "}
        / <span className="text-slate-900">{product.title}</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Edit product</h1>
        <Link
          href={`/s/${store.slug}/p/${product.slug}`}
          className="rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-700 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          View on storefront
        </Link>
      </div>

      <div className="mb-6">
        <ProductImageManager
          storeSlug={store.slug}
          productId={product.id}
          images={product.images.map((image) => ({
            id: image.id,
            url: image.url,
            alt: image.alt,
            sortOrder: image.sortOrder,
            isPrimary: image.isPrimary,
          }))}
        />
      </div>

      <ProductEditForm
        storeSlug={store.slug}
        productId={product.id}
        categories={categories}
        suppliers={suppliers.map((supplier) => supplier.name)}
        product={{
          categoryId: product.categoryId,
          title: product.title,
          subtitle: product.subtitle,
          description: product.description,
          shortDescription: product.shortDescription,
          brand: product.brand,
          sku: product.sku,
          gtin: product.gtin,
          imageUrl: product.imageUrl,
          imageAlt: product.imageAlt,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          cost: product.cost,
          shippingCost: product.shippingCost,
          stockStatus: product.stockStatus,
          supplierName: product.supplierName,
          supplierProductId: product.supplierProductId,
          shippingDaysMin: product.shippingDaysMin,
          shippingDaysMax: product.shippingDaysMax,
          countryOfOrigin: product.countryOfOrigin,
          materials: product.materials,
          warranty: product.warranty,
          returnable: product.returnable,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          canonicalUrl: product.canonicalUrl,
          isPublished: product.isPublished,
          noindex: product.noindex,
          pros: parseStringArray(product.pros).join("\n"),
          cons: parseStringArray(product.cons).join("\n"),
          useCases: parseStringArray(product.useCases).join("\n"),
          specs: specsText,
          faq: faqText,
        }}
      />
    </div>
  );
}

```


---

## src/app/admin/stores/[slug]/products/page.tsx

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function StoreProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();

  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    orderBy: { productScore: "desc" },
    include: { category: { select: { name: true } } },
  });

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-slate-500">
        <Link href="/admin/stores" className="hover:underline">
          Stores
        </Link>{" "}
        /{" "}
        <Link href={`/admin/stores/${store.slug}/edit`} className="hover:underline">
          {store.name}
        </Link>{" "}
        / <span className="text-slate-900">Products</span>
      </nav>
      <h1 className="text-2xl font-bold">{store.name} — Products</h1>
      <p className="mt-1 text-sm text-slate-500">{products.length} products. Click a title to edit.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Margin</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="max-w-72 px-4 py-3">
                  <Link
                    href={`/admin/stores/${store.slug}/products/${product.slug}/edit`}
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    {product.title}
                  </Link>
                  <p className="text-xs text-slate-500">{product.sku}</p>
                </td>
                <td className="px-4 py-3">{product.category.name}</td>
                <td className="px-4 py-3">
                  {product.price.toFixed(2)} {product.currency}
                </td>
                <td className="px-4 py-3">{product.marginPercent.toFixed(1)}%</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      product.productScore >= 70
                        ? "bg-emerald-100 text-emerald-800"
                        : product.productScore >= 50
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.productScore.toFixed(0)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {!product.isPublished && (
                    <span className="mr-1 rounded bg-slate-200 px-1.5 py-0.5">unpublished</span>
                  )}
                  {product.noindex && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">noindex</span>
                  )}
                  {product.isPublished && !product.noindex && (
                    <span className="text-emerald-700">live</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

```


---

## src/app/admin/stores/page.tsx

```tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { getStorePreviewUrl, launchStatusLabel } from "@/lib/stores/preview-url";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  await requireAdmin();

  const stores = await prisma.store.findMany({
    orderBy: { name: "asc" },
    include: {
      domains: true,
      _count: {
        select: {
          products: true,
          categories: true,
          contentPages: true,
          newsletterSubscribers: true,
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Stores</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every tenant served by this deployment. Open a storefront locally with{" "}
        <code className="rounded bg-slate-200 px-1">/?store=&lt;slug&gt;</code>.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Store</th>
              <th className="px-4 py-3 font-medium">Launch</th>
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Niche</th>
              <th className="px-4 py-3 font-medium">Categories</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Content pages</th>
              <th className="px-4 py-3 font-medium">Subscribers</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stores.map((store) => (
              <tr key={store.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold">{store.name}</p>
                  <p className="text-xs text-slate-500">{store.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      store.launchStatus === "LIVE"
                        ? "bg-emerald-100 text-emerald-800"
                        : store.launchStatus === "DRAFT"
                          ? "bg-slate-200 text-slate-600"
                          : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {launchStatusLabel(store.launchStatus)}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {store.plannedDomain ?? store.primaryDomain}
                  {store.plannedDomain && store.launchStatus !== "LIVE" && (
                    <span className="mt-0.5 block text-[10px] text-slate-400">not connected</span>
                  )}
                </td>
                <td className="px-4 py-3">{store.niche}</td>
                <td className="px-4 py-3">{store._count.categories}</td>
                <td className="px-4 py-3">{store._count.products}</td>
                <td className="px-4 py-3">{store._count.contentPages}</td>
                <td className="px-4 py-3">{store._count.newsletterSubscribers}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      store.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {store.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <Link
                      href={`/admin/stores/${store.slug}/edit`}
                      className="text-blue-700 underline"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/stores/${store.slug}/products`}
                      className="text-blue-700 underline"
                    >
                      Products
                    </Link>
                    <Link
                      href={getStorePreviewUrl(store.slug)}
                      className="text-slate-500 underline"
                    >
                      Preview
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

```


---

## src/app/api/admin/jobs/run/route.ts

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { runQueuedCatalogJobs } from "@/lib/jobs/runner";

export const dynamic = "force-dynamic";

export async function POST() {
  await requireAdmin();
  const summary = await runQueuedCatalogJobs({ workerId: "admin-run-jobs" });
  return NextResponse.json({ ok: true, summary });
}


```


---

## src/app/api/admin/upload/route.ts

```ts
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { saveUpload } from "@/lib/uploads/save-upload";

/**
 * Authenticated image upload. Accepts multipart/form-data with `file` and
 * `storeSlug`, stores the image under public/uploads/<storeSlug>/ and returns
 * its public URL. Used by the admin product image manager.
 */
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const storeSlug = String(formData.get("storeSlug") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!storeSlug) {
    return NextResponse.json({ error: "Missing store." }, { status: 400 });
  }

  const result = await saveUpload(file, storeSlug);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ url: result.url });
}

```


---

## src/app/api/checkout/create-payment-intent/route.ts

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { persistOrderFromCheckout } from "@/lib/orders/persist-order";
import { prepareCheckout } from "@/lib/orders/prepare-checkout";
import { routeOrder } from "@/lib/orders/route-order";
import {
  getStripeClient,
  isMockCheckoutEnabled,
  isStripeConfigured,
  paymentCaptureMode,
} from "@/lib/payments/stripe-client";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (isMockCheckoutEnabled()) {
    return NextResponse.json(
      { error: "Stripe checkout is disabled while MOCK_CHECKOUT=true. Use the mock checkout form." },
      { status: 400 }
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prepared = await prepareCheckout(body);
  if (!prepared.ok) {
    return NextResponse.json(
      { error: prepared.message, fieldErrors: prepared.fieldErrors },
      { status: 400 }
    );
  }

  const checkout = prepared.checkout;
  if (checkout.grandTotal <= 0) {
    return NextResponse.json({ error: "Order total must be greater than zero." }, { status: 400 });
  }

  const { order } = await persistOrderFromCheckout(prisma, checkout, {
    paymentProvider: "stripe",
    paymentStatus: "UNPAID",
    orderStatus: "DRAFT",
  });

  const stripe = getStripeClient();
  const captureMethod = paymentCaptureMode();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(checkout.grandTotal * 100),
    currency: checkout.currency.toLowerCase(),
    capture_method: captureMethod,
    automatic_payment_methods: { enabled: true },
    receipt_email: checkout.customer.email,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      storeId: checkout.storeId,
      storeSlug: checkout.storeSlug,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      stripePaymentIntentId: paymentIntent.id,
      paymentStatus: "UNPAID",
    },
  });

  return NextResponse.json({
    clientSecret: ***REDACTED***,
    orderId: order.id,
    orderNumber: order.orderNumber,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    captureMode: captureMethod,
  });
}

/** Finalize an authorized Stripe payment after client-side confirmation. */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  let body: { orderId?: string };
  try {
    body = (await request.json()) as { orderId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: body.orderId } });
  if (!order?.stripePaymentIntentId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
  const captureMode = paymentCaptureMode();
  const expectedStatus = captureMode === "manual" ? "requires_capture" : "succeeded";

  if (paymentIntent.status !== expectedStatus) {
    return NextResponse.json(
      { error: `Payment not authorized yet (status: ${paymentIntent.status})` },
      { status: 400 }
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: captureMode === "manual" ? "AUTHORIZED" : "CAPTURED",
      status: "CONFIRMED",
    },
  });

  const routed = await routeOrder(order.id);
  return NextResponse.json(routed, { status: routed.ok ? 200 : 422 });
}

```


---

## src/app/api/cron/catalog-sync/route.ts

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enqueueCatalogJob } from "@/lib/jobs/queue";
import { runQueuedCatalogJobs } from "@/lib/jobs/runner";
import { syncProviderRegistryToDb } from "@/lib/suppliers/providers/registry";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    const auth = request.headers.get("authorization");
    if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }
  }

  await syncProviderRegistryToDb();
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
    include: { settings: true, categories: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  let enqueued = 0;
  for (const store of stores) {
    const settings = await prisma.storeSupplierSettings.findMany({
      where: { storeId: store.id, isEnabled: true },
      orderBy: [{ priority: "desc" }],
      take: 3,
    });
    const providerSettings =
      settings.length > 0
        ? settings
        : [
            {
              providerKey: "mock",
              importQueries: JSON.stringify([store.niche]),
              storeId: store.id,
            },
          ];

    for (const setting of providerSettings) {
      const queries = parseQueries(setting.importQueries);
      for (const query of queries.slice(0, 2)) {
        await enqueueCatalogJob({
          storeId: store.id,
          providerKey: setting.providerKey,
          jobType: "DISCOVER",
          payload: { query, categoryId: store.categories[0]?.id },
        });
        enqueued += 1;
      }
    }
  }

  const summary = await runQueuedCatalogJobs({
    batchSize: Number(process.env.CATALOG_SYNC_BATCH_SIZE ?? 20),
    timeboxMs: 25_000,
    workerId: "cron-catalog-sync",
  });

  return NextResponse.json({ ok: true, enqueued, summary });
}

function parseQueries(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  } catch {
    return [];
  }
}


```


---

## src/app/api/cron/sync-supplier-catalog/route.ts

```ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Deprecated scraping sync is disabled. Use /api/cron/catalog-sync for provider-backed catalog jobs.",
    },
    { status: 410 }
  );
}


```


---

## src/app/api/debug/db/route.ts

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CORE_TABLES, getSanitizedDatabaseTarget } from "@/lib/db/env-sanitize";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const target = getSanitizedDatabaseTarget();

  try {
    const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename ASC
    `;
    const tables = rows.map((row) => row.tablename);
    const hasStoreTable = tables.includes("Store");
    const hasProductTable = tables.includes("Product");

    let storeCount: number | null = null;
    let productCount: number | null = null;

    if (hasStoreTable) {
      storeCount = await prisma.store.count();
    }
    if (hasProductTable) {
      productCount = await prisma.product.count();
    }

    return NextResponse.json({
      nodeEnv: process.env.NODE_ENV ?? null,
      vercel: process.env.VERCEL ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      database: {
        host: target.host,
        pathname: target.pathname,
        isPooler: target.isPooler,
        redacted: target.redacted,
      },
      tables,
      coreTables: Object.fromEntries(CORE_TABLES.map((table) => [table, tables.includes(table)])),
      hasStoreTable,
      storeCount,
      productCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        nodeEnv: process.env.NODE_ENV ?? null,
        vercel: process.env.VERCEL ?? null,
        vercelEnv: process.env.VERCEL_ENV ?? null,
        database: {
          host: target.host,
          pathname: target.pathname,
          isPooler: target.isPooler,
          redacted: target.redacted,
        },
        error: error instanceof Error ? error.message : "Database probe failed",
        hasStoreTable: false,
        storeCount: null,
        productCount: null,
      },
      { status: 500 }
    );
  }
}

```


---

## src/app/api/feeds/google/route.ts

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { absoluteUrl, canonicalUrl } from "@/lib/seo/canonical";
import { resolveStoreForRequest } from "@/lib/tenant/resolve-tenant";
import { toJson } from "@/lib/utils/json";
import type { StockStatus } from "@/lib/types";

/**
 * Google Merchant Center product feed (RSS 2.0 XML with the g: namespace).
 *
 * Resolve the store by Host header or an explicit ?store=<slug> param:
 *   https://dronestore.example/api/feeds/google
 *   http://localhost:3000/api/feeds/google?store=drones
 *
 * IMPORTANT before submitting to a real Merchant Center account:
 * - Product data must be accurate (price, availability, identifiers/GTIN).
 * - Shipping settings, delivery times, return policy and tax settings must
 *   be configured in Merchant Center and match what the store actually does.
 * - Business information, contact details and the website claim must be
 *   verified. Misleading data leads to account suspension.
 * - This feed is a structural starting point, not a compliance guarantee.
 */

const AVAILABILITY: Record<StockStatus, string> = {
  IN_STOCK: "in_stock",
  LOW_STOCK: "in_stock",
  OUT_OF_STOCK: "out_of_stock",
  PREORDER: "preorder",
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: NextRequest) {
  const store = await resolveStoreForRequest({
    host: request.headers.get("host"),
    storeParam: request.nextUrl.searchParams.get("store"),
  });
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  // Only published, indexable products belong in the feed.
  const products = await prisma.product.findMany({
    where: { storeId: store.id, isPublished: true },
    orderBy: { productScore: "desc" },
  });

  const items = products
    .map((product) => {
      const availability =
        AVAILABILITY[product.stockStatus as StockStatus] ?? "in_stock";
      return `    <item>
      <g:id>${escapeXml(product.sku)}</g:id>
      <g:title>${escapeXml(product.title)}</g:title>
      <g:description>${escapeXml(product.shortDescription)}</g:description>
      <g:link>${escapeXml(canonicalUrl(store, `/p/${product.slug}`))}</g:link>
      <g:image_link>${escapeXml(absoluteUrl(store, product.imageUrl))}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${product.price.toFixed(2)} ${product.currency}</g:price>
      <g:brand>${escapeXml(product.brand)}</g:brand>
${product.gtin ? `      <g:gtin>${escapeXml(product.gtin)}</g:gtin>\n` : `      <g:identifier_exists>false</g:identifier_exists>\n`}      <g:condition>new</g:condition>
      <g:shipping>
        <g:country>${escapeXml(store.locale.split("-")[1] ?? "US")}</g:country>
        <g:service>Standard (${product.shippingDaysMin}-${product.shippingDaysMax} business days)</g:service>
        <g:price>${product.shippingCost.toFixed(2)} ${product.currency}</g:price>
      </g:shipping>
      <g:shipping_label>standard</g:shipping_label>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(store.name)}</title>
    <link>${escapeXml(canonicalUrl(store, "/"))}</link>
    <description>${escapeXml(store.positioning)}</description>
${items}
  </channel>
</rss>`;

  // Record feed access for monitoring (e.g. confirming Google fetches it).
  try {
    await prisma.cartEvent.create({
      data: {
        storeId: store.id,
        sessionId: "feed",
        eventName: "merchant_feed_view",
        payload: toJson({ productCount: products.length }),
      },
    });
  } catch {
    /* never fail the feed because of analytics */
  }

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
}

```


---

## src/app/api/health/route.ts

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Quick DB connectivity check for Vercel/Neon debugging.
 * Open /api/health after deploy — does not expose secrets.
 */
export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const usesPooler = process.env.DATABASE_URL?.includes("-pooler") ?? false;
  const looksLikeSqlite = process.env.DATABASE_URL?.startsWith("file:") ?? false;

  if (!hasDatabaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL is not set in this environment.",
        hint: "Add it in Vercel → Settings → Environment Variables → Redeploy.",
      },
      { status: 503 }
    );
  }

  if (looksLikeSqlite) {
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL points to SQLite (file:...) — Vercel requires Postgres.",
        hint: "Paste your Neon pooled connection string in Vercel env vars.",
      },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const storeCount = await prisma.store.count();
    return NextResponse.json({
      ok: true,
      storeCount,
      usesPooler,
      hint:
        storeCount === 0
          ? "DB connects but is empty — run `npx prisma db push` and `npm run db:seed` against Neon locally."
          : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        usesPooler,
        hints: [
          "Run `npx prisma db push` with DIRECT_URL + DATABASE_URL against your Neon project.",
          "On Vercel, DATABASE_URL should be the Neon *pooled* string (host contains -pooler).",
          "Ensure ?sslmode=require is on the connection string.",
        ],
      },
      { status: 503 }
    );
  }
}

```


---

## src/app/api/placeholder/route.ts

```ts
import { NextRequest, NextResponse } from "next/server";
import { resolveProductImages } from "@/lib/images/resolve-product-images";

/**
 * Legacy SVG placeholders + optional photo redirect.
 * New products use resolveProductImages() directly (Unsplash CDN URLs).
 */

const PALETTES: Array<[string, string]> = [
  ["#0e7490", "#164e63"],
  ["#1d4ed8", "#1e293b"],
  ["#15803d", "#14532d"],
  ["#b45309", "#451a03"],
  ["#7c3aed", "#2e1065"],
  ["#be123c", "#4c0519"],
  ["#0f766e", "#134e4a"],
  ["#4338ca", "#1e1b4b"],
];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const label = (searchParams.get("label") ?? "Product").slice(0, 40);
  const seed = searchParams.get("seed") ?? label;
  const niche = searchParams.get("niche") ?? label;
  const style = searchParams.get("style") ?? searchParams.get("photo");

  // Redirect legacy placeholder requests to photographic URLs when requested.
  if (style === "photo" || style === "1" || style === "true") {
    const resolved = resolveProductImages({
      title: label,
      slug: seed,
      sku: seed,
      niche,
    });
    return NextResponse.redirect(resolved.primaryUrl, 302);
  }

  const [from, to] = PALETTES[hash(seed) % PALETTES.length];

  const words = label.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > 14) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`;
    }
  }
  if (current.trim()) lines.push(current.trim());

  const textSpans = lines
    .slice(0, 3)
    .map(
      (line, index) =>
        `<tspan x="400" dy="${index === 0 ? 0 : 64}">${escapeXml(line)}</tspan>`
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${escapeXml(label)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="650" cy="160" r="220" fill="#ffffff" opacity="0.06"/>
  <circle cx="140" cy="660" r="260" fill="#ffffff" opacity="0.05"/>
  <text x="400" y="${400 - (Math.min(lines.length, 3) - 1) * 32}" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="56" font-weight="700" fill="#ffffff">${textSpans}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

```


---

## src/app/api/track/route.ts

```ts
import { NextRequest, NextResponse } from "next/server";
import { isAnalyticsEvent } from "@/lib/analytics/events";
import { prisma } from "@/lib/db";
import { toJson } from "@/lib/utils/json";
import { trackEventSchema } from "@/lib/validation/schemas";

/**
 * First-party analytics sink. Validates the event, logs it in development
 * and persists it to the CartEvent table. Tracking failures always return
 * 2xx-ish silently from the client's perspective — analytics must never
 * break shopping.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = trackEventSchema.safeParse(body);
  if (!parsed.success || !isAnalyticsEvent(parsed.data.eventName)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { storeSlug, eventName, sessionId, payload } = parsed.data;

  if (process.env.NODE_ENV === "development") {
    console.info(`[track] ${storeSlug} ${eventName}`, payload);
  }

  try {
    const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
    if (store) {
      await prisma.cartEvent.create({
        data: {
          storeId: store.id,
          sessionId,
          eventName,
          payload: toJson(payload),
        },
      });
    }
  } catch (error) {
    console.error("failed to persist analytics event", error);
  }

  return NextResponse.json({ ok: true });
}

```


---

## src/app/api/webhooks/stripe/route.ts

```ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { routeOrder } from "@/lib/orders/route-order";
import { getStripeClient } from "@/lib/payments/stripe-client";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = ***REDACTED***
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "payment_intent.amount_capturable_updated") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      return NextResponse.json({ received: true, skipped: "no orderId metadata" });
    }

    await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: "UNPAID" },
      data: { paymentStatus: "AUTHORIZED", status: "CONFIRMED" },
    });

    await routeOrder(orderId);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      return NextResponse.json({ received: true, skipped: "no orderId metadata" });
    }

    await prisma.order.updateMany({
      where: {
        id: orderId,
        status: { notIn: ["SUPPLIER_ORDERED", "FULFILLMENT_PENDING", "ERROR", "CANCELLED"] },
      },
      data: { paymentStatus: "CAPTURED", status: "CONFIRMED" },
    });

    await routeOrder(orderId);
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "ERROR",
          paymentStatus: "FAILED",
          fulfillmentStatus: "ERROR",
          paymentError: paymentIntent.last_payment_error?.message ?? "Payment failed",
        },
      });
    }
  }

  if (event.type === "payment_intent.canceled") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          paymentStatus: "CANCELLED",
          fulfillmentStatus: "ERROR",
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}

```


---

## src/app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Defaults; each store layout overrides these via inline style. */
  --color-primary: #1d4ed8;
  --color-primary-rgb: 29 78 216;
  --color-primary-soft: rgba(29, 78, 216, 0.08);
  --color-secondary: #1e293b;
  --color-secondary-rgb: 30 41 59;
  --color-accent: #f59e0b;
  --color-accent-rgb: 245 158 11;
  --color-background: #f8fafc;
  --color-background-rgb: 248 250 252;
  --color-text: #0f172a;
  --color-text-rgb: 15 23 42;
  --radius: 0.75rem;
  --font-heading: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-body: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

@layer base {
  body {
    @apply bg-surface text-ink font-body antialiased;
  }

  h1,
  h2,
  h3,
  h4 {
    @apply font-heading;
  }

  /* Visible focus for keyboard users, on-brand per store. */
  :focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 rounded-theme bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50;
  }

  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 rounded-theme border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary disabled:opacity-50;
  }

  .card {
    @apply rounded-theme-lg border border-ink/10 bg-white shadow-sm;
  }

  .input {
    @apply w-full rounded-theme border border-ink/20 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary;
  }

  .label {
    @apply mb-1.5 block text-sm font-medium text-ink/80;
  }

  .prose-guide {
    @apply text-base leading-7 text-ink/90;
  }

  .prose-guide h2 {
    @apply mt-10 scroll-mt-24 text-2xl font-bold text-ink;
  }

  .prose-guide h3 {
    @apply mt-6 text-lg font-semibold text-ink;
  }

  .prose-guide p {
    @apply mt-4;
  }

  .prose-guide ul {
    @apply mt-4 list-disc space-y-1.5 pl-6;
  }

  .prose-guide strong {
    @apply font-semibold text-ink;
  }
}

```


---

## src/app/layout.tsx

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

/**
 * Root layout. Tenant-specific theming, headers and metadata live in
 * src/app/s/[store]/layout.tsx; this only provides the document shell.
 */

export const metadata: Metadata = {
  title: "Multi-Store Dropship Factory",
  description: "One codebase, many niche storefronts.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

```


---

## src/app/not-found.tsx

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-ink/50">
        404
      </p>
      <h1 className="text-3xl font-bold text-ink">
        We could not find that page
      </h1>
      <p className="max-w-md text-sm leading-6 text-ink/60">
        The product or page may have been removed, or the link is out of date.
        Head back to the storefront to keep browsing.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Back to the store
      </Link>
    </main>
  );
}

```


---

## src/app/page.tsx

```tsx
import { redirect } from "next/navigation";
import { DEFAULT_STORE_SLUG } from "@/config/domain-map";

export const dynamic = "force-dynamic";

/**
 * The middleware rewrites "/" to the resolved tenant before this page can
 * render, so this only runs if middleware was bypassed (e.g. direct render
 * during development tooling). Fall back to the default store.
 */
export default function RootPage() {
  redirect(`/s/${DEFAULT_STORE_SLUG}`);
}

```


---

## src/app/robots.ts

```ts
import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getCanonicalBaseUrl } from "@/lib/seo/canonical";
import { resolveStoreForRequest } from "@/lib/tenant/resolve-tenant";

export const dynamic = "force-dynamic";

/**
 * Robots are generated per host: each domain advertises only its own
 * sitemap, storefront pages are crawlable, and internal/admin/api paths are
 * blocked. The internal /s/ paths are blocked too — clean canonical URLs are
 * the only ones that should be indexed.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  let host: string | null = null;
  try {
    host = (await headers()).get("host");
  } catch {
    // Build-time prerender has no request; fall back to the default store.
  }

  const store = await resolveStoreForRequest({ host });
  const base = store ? getCanonicalBaseUrl(store) : "";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/s/", "/cart", "/checkout", "/search"],
      },
    ],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}

```


---

## src/app/s/[store]/c/[category]/page.tsx

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FAQAccordion } from "@/components/FAQAccordion";
import { FilterSidebar } from "@/components/FilterSidebar";
import { GuideCard } from "@/components/GuideCard";
import { PageViewTracker } from "@/components/PageViewTracker";
import { ProductGrid } from "@/components/ProductGrid";
import { SortDropdown } from "@/components/SortDropdown";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, faqPageJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { buildCategoryMetadata } from "@/lib/seo/metadata";
import {
  getCategoryWithProducts,
  getGuides,
  requireStore,
} from "@/lib/stores/queries";
import { parseStringArray } from "@/lib/utils/json";
import type { FaqItem } from "@/lib/types";
import type { Product } from "@prisma/client";

interface CategoryPageProps {
  params: Promise<{ store: string; category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { store: storeSlug, category: categorySlug } = await params;
  const store = await requireStore(storeSlug);
  const category = await getCategoryWithProducts(store.id, categorySlug);
  if (!category) return {};
  return buildCategoryMetadata(store, category, category.products.length);
}

function applyFilters(
  products: Product[],
  filters: { maxPrice?: number; maxDays?: number; inStockOnly: boolean; useCase?: string }
): Product[] {
  return products.filter((product) => {
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false;
    if (filters.maxDays !== undefined && product.shippingDaysMax > filters.maxDays) return false;
    if (filters.inStockOnly && product.stockStatus !== "IN_STOCK") return false;
    if (filters.useCase && !parseStringArray(product.useCases).includes(filters.useCase)) return false;
    return true;
  });
}

function applySort(products: Product[], sort: string): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "shipping":
      return sorted.sort((a, b) => a.shippingDaysMax - b.shippingDaysMax);
    default:
      return sorted.sort((a, b) => b.productScore - a.productScore);
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { store: storeSlug, category: categorySlug } = await params;
  const search = await searchParams;
  const store = await requireStore(storeSlug);
  const category = await getCategoryWithProducts(store.id, categorySlug);
  if (!category) notFound();

  const allProducts = category.products;
  const single = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const maxPriceRaw = Number(single(search.maxPrice));
  const maxDaysRaw = Number(single(search.maxDays));
  const filtered = applySort(
    applyFilters(allProducts, {
      maxPrice: Number.isFinite(maxPriceRaw) && maxPriceRaw > 0 ? maxPriceRaw : undefined,
      maxDays: Number.isFinite(maxDaysRaw) && maxDaysRaw > 0 ? maxDaysRaw : undefined,
      inStockOnly: single(search.stock) === "in",
      useCase: single(search.useCase) || undefined,
    }),
    single(search.sort) ?? "score"
  );

  const useCaseOptions = Array.from(
    new Set(allProducts.flatMap((product) => parseStringArray(product.useCases)))
  ).sort();

  const guides = (await getGuides(store.id)).slice(0, 3);

  const categoryFaq: FaqItem[] = [
    {
      question: `How fast do ${category.name.toLowerCase()} ship?`,
      answer: `Items in this category typically arrive within ${store.defaultShippingDaysMin}–${store.defaultShippingDaysMax} business days. Each product page shows its own exact window, and you receive tracking as soon as the parcel ships.`,
    },
    {
      question: "Can I return a product if it is not right?",
      answer: store.returnPolicySummary,
    },
    {
      question: "How do you rank these products?",
      answer:
        "Default sorting uses our internal product score: a blend of value for money, delivery speed, supplier reliability and how complete our information about the product is. No brand pays for placement.",
    },
  ];

  return (
    <div className="mx-auto max-w-site px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <StructuredData
        data={[
          itemListJsonLd(store, category.name, filtered),
          breadcrumbJsonLd(store, [
            { name: "Home", path: "/" },
            { name: category.name, path: `/c/${category.slug}` },
          ]),
          faqPageJsonLd(categoryFaq),
        ]}
      />

      <Breadcrumbs
        items={[{ name: "Home", href: "/" }, { name: category.name }]}
      />

      <header className="mt-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-ink md:text-4xl">
          {category.heroTitle}
        </h1>
        <p className="mt-3 text-base leading-7 text-ink/70">
          {category.heroSubtitle}
        </p>
        <p className="mt-3 text-sm leading-6 text-ink/60">{category.description}</p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <FilterSidebar useCaseOptions={useCaseOptions} />
        </aside>

        <section aria-label={`${category.name} products`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink/60" aria-live="polite">
              {filtered.length} of {allProducts.length} products
            </p>
            <SortDropdown />
          </div>
          <ProductGrid products={filtered} locale={store.locale} />
        </section>
      </div>

      {guides.length > 0 && (
        <section className="mt-16" aria-labelledby="category-guides">
          <h2 id="category-guides" className="text-2xl font-bold text-ink">
            Guides that help you choose
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {guides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-16">
        <FAQAccordion items={categoryFaq} title={`${category.name}: common questions`} />
      </div>

      <p className="mt-10 text-sm text-ink/60">
        Looking for something else? Try the{" "}
        <Link href="/quiz" className="font-medium text-primary underline">
          product finder quiz
        </Link>{" "}
        or{" "}
        <Link href="/search" className="font-medium text-primary underline">
          search the whole store
        </Link>
        .
      </p>
    </div>
  );
}

```


---

## src/app/s/[store]/cart/page.tsx

```tsx
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CartPageContent } from "@/components/CartPageContent";
import { PageViewTracker } from "@/components/PageViewTracker";
import { buildMetadata } from "@/lib/seo/metadata";
import { requireStore } from "@/lib/stores/queries";

interface CartPageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({
  params,
}: CartPageProps): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  return buildMetadata({
    store,
    title: `Your cart | ${store.name}`,
    description: "Review your cart before checkout.",
    path: "/cart",
    noindex: true,
  });
}

export default async function CartPage({ params }: CartPageProps) {
  const { store: slug } = await params;
  const store = await requireStore(slug);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Cart" }]} />
      <h1 className="mt-4 text-3xl font-bold text-ink">Your cart</h1>
      <div className="mt-6">
        <CartPageContent
          locale={store.locale}
          shippingNote={store.shippingOriginDisclosure}
        />
      </div>
    </div>
  );
}

```


---

## src/app/s/[store]/checkout/page.tsx

```tsx
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckoutForm } from "@/components/CheckoutForm";
import { PageViewTracker } from "@/components/PageViewTracker";
import { buildMetadata } from "@/lib/seo/metadata";
import { requireStore } from "@/lib/stores/queries";

interface CheckoutPageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({
  params,
}: CheckoutPageProps): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  return buildMetadata({
    store,
    title: `Checkout | ${store.name}`,
    description: "Complete your order.",
    path: "/checkout",
    noindex: true,
  });
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  const isMockCheckout = process.env.MOCK_CHECKOUT !== "false";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Cart", href: "/cart" },
          { name: "Checkout" },
        ]}
      />
      <h1 className="mt-4 text-3xl font-bold text-ink">Checkout</h1>
      {isMockCheckout && (
        <p className="mt-2 inline-block rounded-theme bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900">
          Demo mode: checkout runs without payment. Orders are created and routed through mock
          suppliers.
        </p>
      )}
      <div className="mt-6">
        <CheckoutForm
          storeSlug={store.slug}
          locale={store.locale}
          mockCheckout={isMockCheckout}
        />
      </div>
    </div>
  );
}

```


---

## src/app/s/[store]/compare/page.tsx

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ComparisonTable } from "@/components/ComparisonTable";
import { PageViewTracker } from "@/components/PageViewTracker";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  getComparisonPage,
  getFeaturedProducts,
  getProductsByIds,
  requireStore,
} from "@/lib/stores/queries";
import { parseStringArray } from "@/lib/utils/json";

interface ComparePageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({
  params,
}: ComparePageProps): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  const comparison = await getComparisonPage(store.id);
  return buildMetadata({
    store,
    title: comparison?.seoTitle ?? `Compare top picks | ${store.name}`,
    description:
      comparison?.seoDescription ??
      `Our current top ${store.niche} picks side by side: price, delivery time and the specs that actually differ.`,
    path: "/compare",
  });
}

export default async function ComparePage({ params }: ComparePageProps) {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  const comparison = await getComparisonPage(store.id);

  const relatedIds = comparison
    ? parseStringArray(comparison.relatedProductIds)
    : [];
  const products =
    relatedIds.length > 0
      ? await getProductsByIds(store.id, relatedIds)
      : await getFeaturedProducts(store.id, 4);

  return (
    <div className="mx-auto max-w-site px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <StructuredData
        data={[
          itemListJsonLd(store, comparison?.title ?? "Top picks compared", products),
          breadcrumbJsonLd(store, [
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
          ]),
        ]}
      />

      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Compare" }]} />

      <h1 className="mt-4 text-3xl font-bold text-ink md:text-4xl">
        {comparison?.title ?? "Our top picks, side by side"}
      </h1>
      {comparison ? (
        <div className="mt-4 max-w-3xl space-y-3 text-base leading-7 text-ink/75">
          {comparison.body.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink/75">
          The table below compares our current best-scoring products on the
          numbers that actually differ. Prices and delivery windows update
          with the catalog.
        </p>
      )}

      <div className="mt-8">
        <ComparisonTable products={products} locale={store.locale} />
      </div>

      <p className="mt-8 text-sm text-ink/60">
        Still undecided? The{" "}
        <Link href="/quiz" className="font-medium text-primary underline">
          60-second quiz
        </Link>{" "}
        narrows this down to your specific situation.
      </p>
    </div>
  );
}

```


---

## src/app/s/[store]/guides/[slug]/page.tsx

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ComparisonTable } from "@/components/ComparisonTable";
import { FAQAccordion } from "@/components/FAQAccordion";
import { PageViewTracker } from "@/components/PageViewTracker";
import { ProductGrid } from "@/components/ProductGrid";
import { StructuredData } from "@/components/StructuredData";
import { MarkdownContent, extractToc } from "@/lib/content/markdown";
import { articleJsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo/jsonld";
import { buildGuideMetadata } from "@/lib/seo/metadata";
import {
  getCategories,
  getGuideBySlug,
  getProductsByIds,
  requireStore,
} from "@/lib/stores/queries";
import { parseStringArray } from "@/lib/utils/json";
import type { FaqItem } from "@/lib/types";

interface GuidePageProps {
  params: Promise<{ store: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { store: storeSlug, slug } = await params;
  const store = await requireStore(storeSlug);
  const guide = await getGuideBySlug(store.id, slug);
  if (!guide) return {};
  return buildGuideMetadata(store, guide);
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { store: storeSlug, slug } = await params;
  const store = await requireStore(storeSlug);
  const guide = await getGuideBySlug(store.id, slug);
  if (!guide || !guide.isPublished || guide.type !== "GUIDE") notFound();

  const [recommendedProducts, categories] = await Promise.all([
    getProductsByIds(store.id, parseStringArray(guide.relatedProductIds)),
    getCategories(store.id),
  ]);

  const toc = extractToc(guide.body);

  const guideFaq: FaqItem[] = [
    {
      question: "How are the recommendations in this guide chosen?",
      answer:
        "They come from our own catalog, ranked by an internal score that weighs value for money, delivery speed and how complete our data on the product is. No brand pays for placement in our guides.",
    },
    {
      question: "How long does delivery take?",
      answer: `Typically ${store.defaultShippingDaysMin}–${store.defaultShippingDaysMax} business days. ${store.shippingOriginDisclosure}`,
    },
    {
      question: "What if I buy the wrong thing?",
      answer: store.returnPolicySummary,
    },
  ];

  return (
    <div className="mx-auto max-w-site px-4 py-8 sm:px-6">
      <PageViewTracker
        storeSlug={store.slug}
        extraEvent="guide_view"
        extraPayload={{ guideSlug: guide.slug }}
      />
      <StructuredData
        data={[
          articleJsonLd(store, guide),
          breadcrumbJsonLd(store, [
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: guide.title, path: `/guides/${guide.slug}` },
          ]),
          faqPageJsonLd(guideFaq),
        ]}
      />

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Guides", href: "/guides" },
          { name: guide.title },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_280px]">
        <article>
          <h1 className="text-3xl font-bold leading-tight text-ink md:text-4xl">
            {guide.title}
          </h1>

          {/* Direct answer block near the top — for humans and AI search. */}
          <div className="mt-6 rounded-theme-lg border-l-4 border-primary bg-primary-soft p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              The short answer
            </p>
            <p className="mt-2 text-base font-medium leading-7 text-ink">
              {guide.excerpt}
            </p>
          </div>

          <div className="mt-8">
            <MarkdownContent markdown={guide.body} />
          </div>

          {recommendedProducts.length > 0 && (
            <>
              <section className="mt-12" aria-labelledby="guide-comparison">
                <h2 id="guide-comparison" className="text-2xl font-bold text-ink">
                  Side-by-side comparison
                </h2>
                <div className="mt-4">
                  <ComparisonTable
                    products={recommendedProducts.slice(0, 3)}
                    locale={store.locale}
                  />
                </div>
              </section>

              <section className="mt-12" aria-labelledby="guide-products">
                <h2 id="guide-products" className="text-2xl font-bold text-ink">
                  Products mentioned in this guide
                </h2>
                <div className="mt-4">
                  <ProductGrid
                    products={recommendedProducts}
                    locale={store.locale}
                  />
                </div>
              </section>
            </>
          )}

          <div className="mt-12">
            <FAQAccordion items={guideFaq} />
          </div>
        </article>

        <aside className="order-first lg:order-none">
          {toc.length > 0 && (
            <nav
              aria-label="Table of contents"
              className="card sticky top-24 p-5"
            >
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
                In this guide
              </h2>
              <ol className="mt-3 space-y-2 text-sm">
                {toc.map((entry) => (
                  <li key={entry.id}>
                    <a
                      href={`#${entry.id}`}
                      className="text-ink/70 hover:text-primary hover:underline"
                    >
                      {entry.title}
                    </a>
                  </li>
                ))}
              </ol>
              <div className="mt-5 border-t border-ink/10 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                  Browse categories
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/c/${category.slug}`}
                        className="text-primary hover:underline"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          )}
        </aside>
      </div>
    </div>
  );
}

```


---

## src/app/s/[store]/guides/page.tsx

```tsx
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GuideCard } from "@/components/GuideCard";
import { PageViewTracker } from "@/components/PageViewTracker";
import { buildMetadata } from "@/lib/seo/metadata";
import { getGuides, requireStore } from "@/lib/stores/queries";

interface GuidesPageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({
  params,
}: GuidesPageProps): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  return buildMetadata({
    store,
    title: `Buying guides | ${store.name}`,
    description: `Practical, honest buying guides for ${store.niche}: direct answers, real specs and clear trade-offs.`,
    path: "/guides",
  });
}

export default async function GuidesPage({ params }: GuidesPageProps) {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  const guides = await getGuides(store.id);

  return (
    <div className="mx-auto max-w-site px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Guides" }]} />
      <h1 className="mt-4 text-3xl font-bold text-ink md:text-4xl">
        Buying guides
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-ink/70">
        Written for people who want a direct answer first and the reasoning
        second. Every recommendation comes from our own catalog data — price,
        delivery time and specs — not sponsorships.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <GuideCard key={guide.id} guide={guide} />
        ))}
      </div>
    </div>
  );
}

```


---

## src/app/s/[store]/layout.tsx

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CartDrawer } from "@/components/CartDrawer";
import { CookieConsent } from "@/components/CookieConsent";
import { StoreFooter } from "@/components/StoreFooter";
import { StoreHeader } from "@/components/StoreHeader";
import { StructuredData } from "@/components/StructuredData";
import { CartProvider } from "@/lib/cart/cart-context";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo/jsonld";
import { buildStoreMetadata } from "@/lib/seo/metadata";
import { getCategories, requireStore } from "@/lib/stores/queries";
import { buildThemeStyle } from "@/lib/theme";

interface StoreLayoutProps {
  children: ReactNode;
  params: Promise<{ store: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ store: string }>;
}): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  return buildStoreMetadata(store);
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  const categories = await getCategories(store.id);

  return (
    <div
      style={buildThemeStyle(store.theme)}
      className="flex min-h-screen flex-col bg-surface font-body text-ink"
    >
      <StructuredData data={[organizationJsonLd(store), webSiteJsonLd(store)]} />
      <CartProvider storeSlug={store.slug} currency={store.currency}>
        <StoreHeader store={store} categories={categories} />
        <main className="flex-1">{children}</main>
        <StoreFooter store={store} categories={categories} />
        <CartDrawer locale={store.locale} />
        <CookieConsent />
      </CartProvider>
    </div>
  );
}

```


---

## src/app/s/[store]/p/[product]/page.tsx

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPurchaseActions } from "@/components/ProductPurchaseActions";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FAQAccordion } from "@/components/FAQAccordion";
import { PageViewTracker } from "@/components/PageViewTracker";
import { PolicyDisclosure } from "@/components/PolicyDisclosure";
import { PriceBlock } from "@/components/PriceBlock";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductGrid } from "@/components/ProductGrid";
import { RatingDisplay } from "@/components/RatingDisplay";
import { ShippingEstimate } from "@/components/ShippingEstimate";
import { StickyMobileCTA } from "@/components/StickyMobileCTA";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbJsonLd, faqPageJsonLd, productJsonLd } from "@/lib/seo/jsonld";
import { buildProductMetadata } from "@/lib/seo/metadata";
import {
  getProductBySlug,
  getRelatedProducts,
  requireStore,
  toClientProduct,
} from "@/lib/stores/queries";
import { parseFaq, parseSpecs, parseStringArray } from "@/lib/utils/json";
import { STOCK_STATUS_LABELS, isStockStatus } from "@/lib/types";

interface ProductPageProps {
  params: Promise<{ store: string; product: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { store: storeSlug, product: productSlug } = await params;
  const store = await requireStore(storeSlug);
  const product = await getProductBySlug(store.id, productSlug);
  if (!product) return {};
  return buildProductMetadata(store, product);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { store: storeSlug, product: productSlug } = await params;
  const store = await requireStore(storeSlug);
  const product = await getProductBySlug(store.id, productSlug);
  if (!product || !product.isPublished) notFound();

  const related = await getRelatedProducts(
    store.id,
    product.categoryId,
    product.id
  );

  const pros = parseStringArray(product.pros);
  const cons = parseStringArray(product.cons);
  const specs = parseSpecs(product.specs);
  const useCases = parseStringArray(product.useCases);
  const faq = parseFaq(product.faq);
  const clientProduct = toClientProduct(product);
  const stockLabel = isStockStatus(product.stockStatus)
    ? STOCK_STATUS_LABELS[product.stockStatus]
    : product.stockStatus;

  const galleryUrls =
    product.images.length > 0
      ? product.images.map((image) => image.url)
      : [product.imageUrl];

  return (
    <div className="mx-auto max-w-site px-4 py-8 pb-24 sm:px-6 md:pb-8">
      <PageViewTracker
        storeSlug={store.slug}
        extraEvent="product_view"
        extraPayload={{ productId: product.id, slug: product.slug }}
      />
      <StructuredData
        data={[
          productJsonLd(store, product, galleryUrls),
          breadcrumbJsonLd(store, [
            { name: "Home", path: "/" },
            { name: product.category.name, path: `/c/${product.category.slug}` },
            { name: product.title, path: `/p/${product.slug}` },
          ]),
          faqPageJsonLd(faq),
        ]}
      />

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: product.category.name, href: `/c/${product.category.slug}` },
          { name: product.title },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery images={galleryUrls} alt={product.imageAlt} />

        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-ink/50">
            {product.brand}
          </p>
          <h1 className="mt-1 text-3xl font-bold leading-tight text-ink">
            {product.title}
          </h1>
          {product.subtitle && (
            <p className="mt-2 text-base text-ink/70">{product.subtitle}</p>
          )}

          <div className="mt-4">
            <RatingDisplay
              ratingAverage={product.ratingAverage}
              ratingCount={product.ratingCount}
              showEmptyState
            />
          </div>

          <div className="mt-5">
            <PriceBlock
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              currency={product.currency}
              locale={store.locale}
              size="lg"
            />
          </div>

          <dl className="mt-5 space-y-2 text-sm text-ink/80">
            <div className="flex items-center gap-2">
              <dt className="sr-only">Availability</dt>
              <dd
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  product.stockStatus === "IN_STOCK"
                    ? "bg-emerald-100 text-emerald-900"
                    : product.stockStatus === "OUT_OF_STOCK"
                      ? "bg-red-100 text-red-900"
                      : "bg-amber-100 text-amber-900"
                }`}
              >
                {stockLabel}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Shipping estimate</dt>
              <dd>
                <ShippingEstimate
                  daysMin={product.shippingDaysMin}
                  daysMax={product.shippingDaysMax}
                  originNote={store.shippingOriginDisclosure}
                />
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-ink">Returns:</dt>
              <dd>
                {product.returnable
                  ? "Returnable per our returns policy"
                  : "Final sale — not returnable"}
              </dd>
            </div>
            {product.countryOfOrigin && (
              <div className="flex gap-2">
                <dt className="font-medium text-ink">Ships from:</dt>
                <dd>{product.countryOfOrigin}</dd>
              </div>
            )}
            {product.warranty && (
              <div className="flex gap-2">
                <dt className="font-medium text-ink">Warranty:</dt>
                <dd>{product.warranty}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 hidden md:block">
            <ProductPurchaseActions product={clientProduct} storeSlug={store.slug} fullWidth />
          </div>

          <p className="mt-4 text-sm leading-6 text-ink/75">
            {product.shortDescription}
          </p>
        </div>
      </div>

      {/* Pros & cons */}
      <section className="mt-12 grid gap-4 md:grid-cols-2" aria-label="Pros and cons">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-ink">What it does well</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            {pros.map((pro) => (
              <li key={pro} className="flex gap-2">
                <span aria-hidden="true" className="text-emerald-600">✓</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-bold text-ink">Honest trade-offs</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            {cons.map((con) => (
              <li key={con} className="flex gap-2">
                <span aria-hidden="true" className="text-amber-600">✕</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Description */}
      <section className="mt-12 max-w-3xl" aria-labelledby="description-heading">
        <h2 id="description-heading" className="text-2xl font-bold text-ink">
          About this product
        </h2>
        <div className="mt-3 space-y-4 text-base leading-7 text-ink/80">
          {product.description.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* Specs */}
      {specs.length > 0 && (
        <section className="mt-12" aria-labelledby="specs-heading">
          <h2 id="specs-heading" className="text-2xl font-bold text-ink">
            Specifications
          </h2>
          <div className="mt-4 overflow-hidden rounded-theme-lg border border-ink/10 bg-white">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-ink/10">
                {specs.map((spec) => (
                  <tr key={spec.label}>
                    <th
                      scope="row"
                      className="w-1/3 bg-primary-soft px-4 py-3 font-medium text-ink"
                    >
                      {spec.label}
                    </th>
                    <td className="px-4 py-3 text-ink/80">{spec.value}</td>
                  </tr>
                ))}
                {product.materials && (
                  <tr>
                    <th scope="row" className="w-1/3 bg-primary-soft px-4 py-3 font-medium text-ink">
                      Materials
                    </th>
                    <td className="px-4 py-3 text-ink/80">{product.materials}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Use cases */}
      {useCases.length > 0 && (
        <section className="mt-12" aria-labelledby="usecases-heading">
          <h2 id="usecases-heading" className="text-2xl font-bold text-ink">
            Best suited for
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {useCases.map((useCase) => (
              <span
                key={useCase}
                className="rounded-theme bg-primary-soft px-4 py-2 text-sm font-medium capitalize text-ink"
              >
                {useCase.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <div className="mt-12 max-w-3xl">
          <FAQAccordion items={faq} title="Questions about this product" />
        </div>
      )}

      {/* Trust & policy */}
      <div className="mt-12 max-w-3xl">
        <PolicyDisclosure store={store} />
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-2xl font-bold text-ink">
            You might also consider
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            From the same category — or see the{" "}
            <Link href="/compare" className="text-primary underline">
              full comparison
            </Link>
            .
          </p>
          <div className="mt-5">
            <ProductGrid products={related} locale={store.locale} />
          </div>
        </section>
      )}

      <StickyMobileCTA product={clientProduct} storeSlug={store.slug} locale={store.locale} />
    </div>
  );
}

```


---

## src/app/s/[store]/page.tsx

```tsx
import Link from "next/link";
import { CategoryCard } from "@/components/CategoryCard";
import { FAQAccordion } from "@/components/FAQAccordion";
import { GuideCard } from "@/components/GuideCard";
import { NewsletterCapture } from "@/components/NewsletterCapture";
import { PageViewTracker } from "@/components/PageViewTracker";
import { PolicyDisclosure } from "@/components/PolicyDisclosure";
import { ProductGrid } from "@/components/ProductGrid";
import { StructuredData } from "@/components/StructuredData";
import { TrustBar } from "@/components/TrustBar";
import { faqPageJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import {
  getCategories,
  getFeaturedProducts,
  getGuides,
  getHomepageFaq,
  requireStore,
} from "@/lib/stores/queries";
import { parseFaq } from "@/lib/utils/json";

export default async function StoreHomePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: slug } = await params;
  const store = await requireStore(slug);

  const [categories, featuredProducts, guides, faqPage] = await Promise.all([
    getCategories(store.id),
    getFeaturedProducts(store.id, 8),
    getGuides(store.id),
    getHomepageFaq(store.id),
  ]);

  const faq = faqPage ? parseFaq(faqPage.body) : [];

  return (
    <>
      <PageViewTracker storeSlug={store.slug} />
      <StructuredData
        data={[
          itemListJsonLd(store, `${store.name} featured products`, featuredProducts),
          faqPageJsonLd(faq),
        ]}
      />

      {/* Hero */}
      <section className="bg-secondary text-white">
        <div className="mx-auto grid max-w-site gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              {store.niche}
            </p>
            <h1 className="mt-3 font-heading text-4xl font-extrabold leading-tight md:text-5xl">
              {store.valueProposition}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/80">
              {store.positioning}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {categories[0] && (
                <Link href={`/c/${categories[0].slug}`} className="btn-primary">
                  Shop {categories[0].name}
                </Link>
              )}
              <Link
                href="/quiz"
                className="inline-flex items-center justify-center gap-2 rounded-theme border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Find my match in 60 seconds
              </Link>
            </div>
            <p className="mt-5 text-xs text-white/60">
              {store.defaultShippingDaysMin}–{store.defaultShippingDaysMax} day
              tracked delivery · transparent supplier fulfillment · human
              support at {store.supportEmail}
            </p>
          </div>
          <div className="hidden md:block">
            <img
              src={`/api/placeholder?label=${encodeURIComponent(store.logoText)}&seed=${store.slug}-hero`}
              alt={`${store.name} — ${store.niche}`}
              className="aspect-[4/3] w-full rounded-theme-lg object-cover"
            />
          </div>
        </div>
      </section>

      <TrustBar store={store} />

      <div className="mx-auto max-w-site space-y-16 px-4 py-12 sm:px-6">
        {/* Featured categories */}
        <section aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="text-2xl font-bold text-ink">
            Shop by category
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                productCount={category._count.products}
              />
            ))}
          </div>
        </section>

        {/* Featured products */}
        <section aria-labelledby="featured-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="featured-heading" className="text-2xl font-bold text-ink">
                Our current top picks
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                Ranked by our internal product score: value, shipping speed and
                content quality — not by who pays most.
              </p>
            </div>
            <Link
              href="/compare"
              className="hidden shrink-0 text-sm font-semibold text-primary underline sm:block"
            >
              Compare top picks →
            </Link>
          </div>
          <div className="mt-5">
            <ProductGrid products={featuredProducts} locale={store.locale} />
          </div>
        </section>

        {/* How to choose */}
        {guides.length > 0 && (
          <section
            aria-labelledby="choose-heading"
            className="rounded-theme-lg bg-primary-soft p-6 sm:p-10"
          >
            <h2 id="choose-heading" className="text-2xl font-bold text-ink">
              Not sure how to choose?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
              We write the guides we wish existed when we researched this
              niche: direct answers first, real specs, honest trade-offs, and
              no affiliate-driven rankings.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {guides.slice(0, 3).map((guide) => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          </section>
        )}

        {/* Quiz + comparison CTAs */}
        <section className="grid gap-4 md:grid-cols-2" aria-label="Decision tools">
          <div className="card flex flex-col items-start gap-3 p-8">
            <h2 className="text-xl font-bold text-ink">60-second product finder</h2>
            <p className="text-sm leading-6 text-ink/70">
              Answer a few questions about how you will actually use it and we
              will rank the catalog for your situation.
            </p>
            <Link href="/quiz" className="btn-primary mt-auto">
              Take the quiz
            </Link>
          </div>
          <div className="card flex flex-col items-start gap-3 p-8">
            <h2 className="text-xl font-bold text-ink">Side-by-side comparison</h2>
            <p className="text-sm leading-6 text-ink/70">
              Our top picks in one table: price, delivery time and the specs
              that actually differ.
            </p>
            <Link href="/compare" className="btn-secondary mt-auto">
              Open the comparison
            </Link>
          </div>
        </section>

        <NewsletterCapture storeSlug={store.slug} source="homepage" />

        {/* FAQ */}
        {faq.length > 0 && <FAQAccordion items={faq} />}

        <PolicyDisclosure store={store} />
      </div>
    </>
  );
}

```


---

## src/app/s/[store]/policies/privacy/page.tsx

```tsx
import type { Metadata } from "next";
import { PolicyPage, buildPolicyMetadata } from "@/components/PolicyPage";

interface PageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { store } = await params;
  return buildPolicyMetadata(store, "privacy");
}

export default async function PrivacyPolicyPage({ params }: PageProps) {
  const { store } = await params;
  return <PolicyPage storeSlug={store} kind="privacy" />;
}

```


---

## src/app/s/[store]/policies/returns/page.tsx

```tsx
import type { Metadata } from "next";
import { PolicyPage, buildPolicyMetadata } from "@/components/PolicyPage";

interface PageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { store } = await params;
  return buildPolicyMetadata(store, "returns");
}

export default async function ReturnsPolicyPage({ params }: PageProps) {
  const { store } = await params;
  return <PolicyPage storeSlug={store} kind="returns" />;
}

```


---

## src/app/s/[store]/policies/shipping/page.tsx

```tsx
import type { Metadata } from "next";
import { PolicyPage, buildPolicyMetadata } from "@/components/PolicyPage";

interface PageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { store } = await params;
  return buildPolicyMetadata(store, "shipping");
}

export default async function ShippingPolicyPage({ params }: PageProps) {
  const { store } = await params;
  return <PolicyPage storeSlug={store} kind="shipping" />;
}

```


---

## src/app/s/[store]/policies/terms/page.tsx

```tsx
import type { Metadata } from "next";
import { PolicyPage, buildPolicyMetadata } from "@/components/PolicyPage";

interface PageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { store } = await params;
  return buildPolicyMetadata(store, "terms");
}

export default async function TermsOfSalePage({ params }: PageProps) {
  const { store } = await params;
  return <PolicyPage storeSlug={store} kind="terms" />;
}

```


---

## src/app/s/[store]/quiz/page.tsx

```tsx
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageViewTracker } from "@/components/PageViewTracker";
import { ProductQuiz } from "@/components/ProductQuiz";
import { buildMetadata } from "@/lib/seo/metadata";
import { getQuizQuestions } from "@/lib/quiz/quiz-config";
import {
  getCategories,
  getFeaturedProducts,
  requireStore,
  toClientProduct,
} from "@/lib/stores/queries";

interface QuizPageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({
  params,
}: QuizPageProps): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  return buildMetadata({
    store,
    title: `Product finder quiz | ${store.name}`,
    description: `Answer a few questions and get ${store.niche} recommendations matched to your real use case and budget.`,
    path: "/quiz",
  });
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  const [categories, products] = await Promise.all([
    getCategories(store.id),
    getFeaturedProducts(store.id, 50),
  ]);

  const questions = getQuizQuestions(
    store.slug,
    categories.map((category) => category.name)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Quiz" }]} />
      <h1 className="mt-4 text-3xl font-bold text-ink md:text-4xl">
        Find your match in 60 seconds
      </h1>
      <p className="mt-3 text-base leading-7 text-ink/70">
        A few quick questions about how you will actually use it. We rank the
        catalog for your answers — no email required to see results.
      </p>
      <div className="mt-8">
        <ProductQuiz
          storeSlug={store.slug}
          locale={store.locale}
          questions={questions}
          products={products.map(toClientProduct)}
        />
      </div>
    </div>
  );
}

```


---

## src/app/s/[store]/search/page.tsx

```tsx
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageViewTracker } from "@/components/PageViewTracker";
import { ProductGrid } from "@/components/ProductGrid";
import { SearchBox } from "@/components/SearchBox";
import { buildMetadata } from "@/lib/seo/metadata";
import { requireStore, searchProducts } from "@/lib/stores/queries";

interface SearchPageProps {
  params: Promise<{ store: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}

export async function generateMetadata({
  params,
}: SearchPageProps): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await requireStore(slug);
  return buildMetadata({
    store,
    title: `Search | ${store.name}`,
    description: `Search the ${store.name} catalog.`,
    path: "/search",
    noindex: true,
  });
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { store: slug } = await params;
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const store = await requireStore(slug);
  const results = query ? await searchProducts(store.id, query) : [];

  return (
    <div className="mx-auto max-w-site px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Search" }]} />
      <h1 className="mt-4 text-3xl font-bold text-ink">
        {query ? `Results for “${query}”` : "Search the store"}
      </h1>
      <div className="mt-4 max-w-md">
        <SearchBox placeholder="Search by name, brand or feature…" />
      </div>

      <div className="mt-8">
        {query ? (
          <>
            <p className="mb-4 text-sm text-ink/60" aria-live="polite">
              {results.length} {results.length === 1 ? "result" : "results"}
            </p>
            <ProductGrid
              products={results}
              locale={store.locale}
              emptyMessage={`Nothing matched “${query}”. Try a broader term, browse the categories, or take the product quiz.`}
            />
          </>
        ) : (
          <p className="text-sm text-ink/60">
            Type what you are looking for above — product names, brands or
            features all work.
          </p>
        )}
      </div>
    </div>
  );
}

```


---

## src/app/sitemap.ts

```ts
import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { buildStoreSitemap } from "@/lib/seo/sitemap";
import { resolveStoreForRequest } from "@/lib/tenant/resolve-tenant";

export const dynamic = "force-dynamic";

/**
 * Per-domain sitemap: each host serves only its own store's URLs. Unpublished
 * and noindex pages are excluded in buildStoreSitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let host: string | null = null;
  try {
    host = (await headers()).get("host");
  } catch {
    // Build-time prerender has no request; fall back to the default store.
  }

  const store = await resolveStoreForRequest({ host });
  if (!store) return [];
  return buildStoreSitemap(store);
}

```


---

## src/components/AddToCartButton.tsx

```tsx
"use client";

import { useCart } from "@/lib/cart/cart-context";
import { track } from "@/lib/analytics/track";
import type { ClientProduct } from "@/lib/types";

export function AddToCartButton({
  product,
  size = "md",
  fullWidth = false,
}: {
  product: ClientProduct;
  size?: "sm" | "md";
  fullWidth?: boolean;
}) {
  const cart = useCart();
  const outOfStock = product.stockStatus === "OUT_OF_STOCK";

  function handleAdd() {
    cart.addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      currency: product.currency,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
      shippingDaysMin: product.shippingDaysMin,
      shippingDaysMax: product.shippingDaysMax,
    });
    track(cart.storeSlug, "add_to_cart", {
      productId: product.id,
      slug: product.slug,
      price: product.price,
    });
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={outOfStock}
      className={`btn-primary ${size === "sm" ? "px-4 py-2 text-xs" : ""} ${fullWidth ? "w-full" : ""}`}
      aria-label={
        outOfStock
          ? `${product.title} is out of stock`
          : `Add ${product.title} to cart`
      }
    >
      {outOfStock
        ? "Out of stock"
        : product.stockStatus === "PREORDER"
          ? "Pre-order"
          : "Add to cart"}
    </button>
  );
}

```


---

## src/components/admin/AdminLoginForm.tsx

```tsx
"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/lib/actions/admin";

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(adminLoginAction, {
    error: null,
  });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoFocus
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}

```


---

## src/components/admin/AdminNav.tsx

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/stores", label: "Stores" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/experiments", label: "Experiments" },
  { href: "/admin/seo-audit", label: "SEO Audit" },
  { href: "/admin/generator", label: "Generator" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="lg:sticky lg:top-6">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

```


---

## src/components/admin/ComingSoon.tsx

```tsx
export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        <p className="font-medium text-slate-800">Planned for {phase}.</p>
        <p className="mt-1">
          This screen is scaffolded so the navigation is complete. The
          implementation lands in an upcoming Phase 2 session.
        </p>
      </div>
    </div>
  );
}

```


---

## src/components/admin/fields.tsx

```tsx
import type { ReactNode } from "react";

/**
 * Shared form-field primitives for the admin edit screens. Uncontrolled by
 * default (defaultValue + name) so a form is just FormData; components that
 * need live preview manage their own state in the parent.
 */

export const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-slate-100";
export const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function TextField({
  name,
  label,
  defaultValue,
  hint,
  required,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint}>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className={inputClass}
      />
    </Field>
  );
}

export function NumberField({
  name,
  label,
  defaultValue,
  hint,
  min,
  max,
  step,
}: {
  name: string;
  label: string;
  defaultValue?: number | null;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint}>
      <input
        id={name}
        name={name}
        type="number"
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue ?? undefined}
        className={inputClass}
      />
    </Field>
  );
}

export function TextareaField({
  name,
  label,
  defaultValue,
  hint,
  rows = 4,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  hint?: string;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint}>
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className={`${inputClass} font-mono`}
      />
    </Field>
  );
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint}>
      <select id={name} name={name} defaultValue={defaultValue} className={inputClass}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxField({
  name,
  label,
  defaultChecked,
  hint,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-2.5 py-1.5 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        value="on"
        className="mt-0.5 h-4 w-4 rounded border-slate-300"
      />
      <span>
        <span className="font-medium text-slate-700">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

```


---

## src/components/admin/GeneratorForms.tsx

```tsx
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { StoreBlueprint } from "@/lib/ai/types";
import type { GuardrailReport } from "@/lib/ai/content-guardrails";
import {
  createStoreFromBlueprintAction,
  generateBlueprintAction,
  generateProductCopyAction,
} from "@/lib/actions/generator";
import type { CreateStoreFromBlueprintResult } from "@/lib/stores/create-from-blueprint";

function GuardrailSummary({ report }: { report: GuardrailReport }) {
  return (
    <div
      className={`mt-3 rounded-lg border p-3 text-xs ${
        report.passed
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
    >
      <p className="font-semibold">
        Guardrails: {report.passed ? "passed" : "blocked"}
        {report.recommendNoindex ? " · noindex recommended" : ""}
      </p>
      {report.flags.length > 0 && (
        <ul className="mt-1.5 list-disc space-y-1 pl-4">
          {report.flags.map((flag, index) => (
            <li key={index}>
              [{flag.severity}] {flag.rule}: {flag.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function JsonPreview({ value }: { value: unknown }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(value, null, 2);

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="relative mt-3">
      <button
        type="button"
        onClick={copy}
        className="absolute right-3 top-3 rounded-md bg-slate-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-600"
      >
        {copied ? "Copied!" : "Copy JSON"}
      </button>
      <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-5 text-slate-100">
        {json}
      </pre>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

interface BlueprintFormValues {
  domain: string;
  testOnly: boolean;
  niche: string;
  audience: string;
  keywords: string;
  brandVoice: string;
  locale: string;
  country: string;
}

function buildBlueprintInput(values: BlueprintFormValues) {
  return {
    domain: values.testOnly ? undefined : values.domain || undefined,
    niche: values.niche,
    audience: values.audience,
    productKeywords: values.keywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean),
    brandVoice: values.brandVoice || "clear, honest, practical",
    locale: values.locale || "en-US",
    country: values.country || "United States",
  };
}

function BlueprintSummary({ blueprint }: { blueprint: StoreBlueprint }) {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <p className="font-bold text-slate-900">{blueprint.brandName}</p>
      <p className="mt-1 text-slate-600">{blueprint.tagline}</p>
      <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-800">Slug</dt>
          <dd className="font-mono">{blueprint.storeSlug}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-800">Categories</dt>
          <dd>{blueprint.categories.map((category) => category.name).join(", ")}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-slate-800">SEO title</dt>
          <dd>{blueprint.seoTitle}</dd>
        </div>
      </dl>
      {blueprint.qualityChecklist.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-800">Launch checklist</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-600">
            {blueprint.qualityChecklist.slice(0, 6).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LaunchSuccess({ result }: { result: CreateStoreFromBlueprintResult }) {
  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
      <p className="text-lg font-bold">Store created — preview ready</p>
      <p className="mt-1">
        <strong>{result.storeName}</strong> is live in <strong>Preview</strong> mode (noindex until
        you connect a production domain).
      </p>
      <ul className="mt-3 space-y-1 text-xs">
        <li>
          {result.categoriesCreated} categories · {result.productsImported} products imported ·{" "}
          {result.productsPublished} published · {result.guidesCreated} guide
        </li>
        {result.plannedDomain ? (
          <li>
            Planned domain: <span className="font-mono">{result.plannedDomain}</span> (not connected
            yet)
          </li>
        ) : (
          <li>No planned domain yet — using test preview URLs only</li>
        )}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={result.previewUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-emerald-800 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
        >
          Open preview storefront
        </a>
        <Link
          href={`/admin/stores/${result.storeSlug}/edit`}
          className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-300 hover:bg-emerald-100"
        >
          Edit store
        </Link>
        <Link
          href={`/admin/stores/${result.storeSlug}/products`}
          className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-300 hover:bg-emerald-100"
        >
          Manage products
        </Link>
      </div>
      <p className="mt-3 font-mono text-[11px] text-emerald-800">{result.previewUrl}</p>
    </div>
  );
}

export function GeneratorForms() {
  const [formValues, setFormValues] = useState<BlueprintFormValues>({
    domain: "",
    testOnly: true,
    niche: "",
    audience: "",
    keywords: "",
    brandVoice: "warm, honest",
    locale: "nb-NO",
    country: "Norway",
  });
  const [blueprintResult, setBlueprintResult] = useState<{
    blueprint?: StoreBlueprint;
    guardrails?: GuardrailReport;
    error?: string;
  } | null>(null);
  const [launchResult, setLaunchResult] = useState<{
    data?: CreateStoreFromBlueprintResult;
    error?: string;
  } | null>(null);
  const [copyResult, setCopyResult] = useState<{
    copy?: unknown;
    guardrails?: GuardrailReport;
    error?: string;
  } | null>(null);
  const [importProducts, setImportProducts] = useState(true);
  const [autoPublish, setAutoPublish] = useState(true);
  const [isBlueprintPending, startBlueprint] = useTransition();
  const [isLaunchPending, startLaunch] = useTransition();
  const [isCopyPending, startCopy] = useTransition();

  function handleBlueprintSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values: BlueprintFormValues = {
      domain: String(data.get("domain") ?? ""),
      testOnly: data.get("testOnly") === "on",
      niche: String(data.get("niche") ?? ""),
      audience: String(data.get("audience") ?? ""),
      keywords: String(data.get("keywords") ?? ""),
      brandVoice: String(data.get("brandVoice") ?? ""),
      locale: String(data.get("locale") ?? ""),
      country: String(data.get("country") ?? ""),
    };
    setFormValues(values);
    setLaunchResult(null);

    startBlueprint(async () => {
      const result = await generateBlueprintAction(buildBlueprintInput(values));
      setBlueprintResult(
        result.ok
          ? { blueprint: result.data?.blueprint, guardrails: result.data?.guardrails }
          : { error: result.error }
      );
    });
  }

  function handleLaunchStore() {
    startLaunch(async () => {
      const result = await createStoreFromBlueprintAction({
        blueprintInput: buildBlueprintInput(formValues),
        importProducts,
        autoPublishScored: autoPublish,
      });
      setLaunchResult(result.ok ? { data: result.data } : { error: result.error });
    });
  }

  function handleCopySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startCopy(async () => {
      const result = await generateProductCopyAction({
        productTitle: String(data.get("productTitle") ?? ""),
        niche: String(data.get("copyNiche") ?? ""),
        audience: String(data.get("copyAudience") ?? ""),
        brandVoice: String(data.get("copyVoice") ?? "") || "clear, honest, practical",
        specs: [],
        shippingDaysMin: Number(data.get("daysMin") ?? 5) || 5,
        shippingDaysMax: Number(data.get("daysMax") ?? 12) || 12,
      });
      setCopyResult(
        result.ok
          ? { copy: result.data?.copy, guardrails: result.data?.guardrails }
          : { error: result.error }
      );
    });
  }

  const canLaunch =
    blueprintResult?.blueprint &&
    blueprintResult.guardrails?.passed &&
    !launchResult?.data;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-950">
        <h2 className="font-bold">Launch a new store in minutes</h2>
        <p className="mt-1 text-blue-900/90">
          Fill in your niche and audience. You do <strong>not</strong> need a real domain yet — we
          create a <strong>Preview</strong> store on this deployment (noindex) at{" "}
          <code className="rounded bg-white/70 px-1">/s/your-slug</code>. Add your planned domain
          when ready, then mark the store Live after DNS is connected.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-bold">1. Describe your store</h2>
          <p className="mt-1 text-sm text-slate-500">
            Minimal input → full blueprint with categories, SEO, theme, trust copy and import
            queries.
          </p>
          <form onSubmit={handleBlueprintSubmit} className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="testOnly"
                  defaultChecked={formValues.testOnly}
                  className="rounded border-slate-300"
                  onChange={(event) =>
                    setFormValues((current) => ({ ...current, testOnly: event.target.checked }))
                  }
                />
                <span>
                  <strong>No domain yet</strong> — create test preview only (recommended)
                </span>
              </label>
            </div>
            <div className={formValues.testOnly ? "opacity-50 lg:col-span-2" : "lg:col-span-2"}>
              <label htmlFor="gen-domain" className={labelClass}>
                Planned production domain (optional)
              </label>
              <input
                id="gen-domain"
                name="domain"
                disabled={formValues.testOnly}
                className={inputClass}
                placeholder="jaaaws.com"
                defaultValue={formValues.domain}
              />
              <p className="mt-1 text-xs text-slate-500">
                Saved for later — storefront works on preview URL until you connect DNS and mark
                Live.
              </p>
            </div>
            <div>
              <label htmlFor="gen-niche" className={labelClass}>
                Niche *
              </label>
              <input
                id="gen-niche"
                name="niche"
                required
                className={inputClass}
                placeholder="jaw relaxation gummies"
                defaultValue={formValues.niche}
              />
            </div>
            <div>
              <label htmlFor="gen-audience" className={labelClass}>
                Audience *
              </label>
              <input
                id="gen-audience"
                name="audience"
                required
                className={inputClass}
                placeholder="young adults 18–45"
                defaultValue={formValues.audience}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="gen-keywords" className={labelClass}>
                Product keywords (comma-separated)
              </label>
              <input
                id="gen-keywords"
                name="keywords"
                className={inputClass}
                placeholder="gummy, jaw relief, stress chew"
                defaultValue={formValues.keywords}
              />
            </div>
            <div>
              <label htmlFor="gen-voice" className={labelClass}>
                Brand voice
              </label>
              <input
                id="gen-voice"
                name="brandVoice"
                className={inputClass}
                placeholder="warm, honest"
                defaultValue={formValues.brandVoice}
              />
            </div>
            <div>
              <label htmlFor="gen-locale" className={labelClass}>
                Locale
              </label>
              <input
                id="gen-locale"
                name="locale"
                className={inputClass}
                placeholder="nb-NO"
                defaultValue={formValues.locale}
              />
            </div>
            <div>
              <label htmlFor="gen-country" className={labelClass}>
                Country
              </label>
              <input
                id="gen-country"
                name="country"
                className={inputClass}
                placeholder="Norway"
                defaultValue={formValues.country}
              />
            </div>
            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={isBlueprintPending}
                className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {isBlueprintPending ? "Generating blueprint…" : "2. Generate blueprint"}
              </button>
            </div>
          </form>

          {blueprintResult?.error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {blueprintResult.error}
            </p>
          )}
          {blueprintResult?.guardrails && (
            <GuardrailSummary report={blueprintResult.guardrails} />
          )}
          {blueprintResult?.blueprint && (
            <BlueprintSummary blueprint={blueprintResult.blueprint} />
          )}

          {canLaunch && (
            <div className="mt-6 rounded-lg border border-slate-200 p-4">
              <h3 className="font-bold">3. Create store in database</h3>
              <p className="mt-1 text-sm text-slate-600">
                Builds the tenant with theme, categories, mock supplier products, FAQ and a starter
                guide. Preview mode = noindex until you go Live.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={importProducts}
                    onChange={(event) => setImportProducts(event.target.checked)}
                  />
                  Import mock supplier products
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoPublish}
                    onChange={(event) => setAutoPublish(event.target.checked)}
                  />
                  Auto-publish high-scoring imports
                </label>
              </div>
              <button
                type="button"
                disabled={isLaunchPending}
                onClick={handleLaunchStore}
                className="mt-4 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {isLaunchPending ? "Creating store…" : "Create store & open preview"}
              </button>
            </div>
          )}

          {launchResult?.error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {launchResult.error}
            </p>
          )}
          {launchResult?.data && <LaunchSuccess result={launchResult.data} />}

          {blueprintResult?.blueprint && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-600">
                Raw blueprint JSON
              </summary>
              <JsonPreview value={blueprintResult.blueprint} />
            </details>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold">Product copy generator</h2>
          <p className="mt-1 text-sm text-slate-500">
            Generate honest product descriptions for manual edits or supplier imports.
          </p>
          <form onSubmit={handleCopySubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="copy-title" className={labelClass}>
                Product title
              </label>
              <input
                id="copy-title"
                name="productTitle"
                required
                className={inputClass}
                placeholder="Foldable 4K Camera Drone"
              />
            </div>
            <div>
              <label htmlFor="copy-niche" className={labelClass}>
                Niche
              </label>
              <input
                id="copy-niche"
                name="copyNiche"
                required
                className={inputClass}
                placeholder="consumer drones"
              />
            </div>
            <div>
              <label htmlFor="copy-audience" className={labelClass}>
                Audience
              </label>
              <input
                id="copy-audience"
                name="copyAudience"
                required
                className={inputClass}
                placeholder="hobby pilots"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="copy-voice" className={labelClass}>
                  Brand voice
                </label>
                <input
                  id="copy-voice"
                  name="copyVoice"
                  className={inputClass}
                  placeholder="technical"
                />
              </div>
              <div>
                <label htmlFor="copy-daysmin" className={labelClass}>
                  Ship min
                </label>
                <input
                  id="copy-daysmin"
                  name="daysMin"
                  type="number"
                  min={1}
                  defaultValue={5}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="copy-daysmax" className={labelClass}>
                  Ship max
                </label>
                <input
                  id="copy-daysmax"
                  name="daysMax"
                  type="number"
                  min={1}
                  defaultValue={12}
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isCopyPending}
              className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {isCopyPending ? "Generating…" : "Generate copy"}
            </button>
          </form>
          {copyResult?.error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {copyResult.error}
            </p>
          )}
          {copyResult?.guardrails && <GuardrailSummary report={copyResult.guardrails} />}
          {copyResult?.copy !== undefined && <JsonPreview value={copyResult.copy} />}
        </section>
      </div>
    </div>
  );
}

```


---

## src/components/admin/GoLiveButton.tsx

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markStoreLiveAction } from "@/lib/actions/generator";

export function GoLiveButton({ slug, launchStatus }: { slug: string; launchStatus: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (launchStatus === "LIVE") {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
        This store is <strong>Live</strong> — canonical URLs use the production domain and pages are
        indexable.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
      <p className="font-semibold">Preview mode</p>
      <p className="mt-1">
        Storefront works on the preview URL. Pages are noindexed until you connect DNS to your
        planned domain and mark Live.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await markStoreLiveAction(slug);
            setMessage(result.ok ? "Store is now Live." : result.error ?? "Failed.");
            if (result.ok) router.refresh();
          })
        }
        className="mt-2 rounded-md bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-950 disabled:opacity-50"
      >
        {pending ? "Updating…" : "Mark as Live (domain connected)"}
      </button>
      {message && <p className="mt-2 text-amber-900">{message}</p>}
    </div>
  );
}

```


---

## src/components/admin/ProductEditForm.tsx

```tsx
"use client";

import { useActionState } from "react";
import { updateProductAction } from "@/lib/actions/admin-product";
import type { AdminActionState } from "@/lib/actions/admin-store";
import {
  CheckboxField,
  FormSection,
  NumberField,
  SelectField,
  TextField,
  TextareaField,
} from "@/components/admin/fields";
import { STOCK_STATUSES, STOCK_STATUS_LABELS } from "@/lib/types";

const STOCK_OPTIONS = STOCK_STATUSES.map((value) => ({
  value,
  label: STOCK_STATUS_LABELS[value],
}));

const initialState: AdminActionState = { ok: false, error: null };

export interface ProductEditFormProps {
  storeSlug: string;
  productId: string;
  categories: Array<{ id: string; name: string }>;
  suppliers: string[];
  product: {
    categoryId: string;
    title: string;
    subtitle: string;
    description: string;
    shortDescription: string;
    brand: string;
    sku: string;
    gtin: string | null;
    imageUrl: string;
    imageAlt: string;
    price: number;
    compareAtPrice: number | null;
    cost: number;
    shippingCost: number;
    stockStatus: string;
    supplierName: string;
    supplierProductId: string;
    shippingDaysMin: number;
    shippingDaysMax: number;
    countryOfOrigin: string | null;
    materials: string | null;
    warranty: string | null;
    returnable: boolean;
    seoTitle: string;
    seoDescription: string;
    canonicalUrl: string | null;
    isPublished: boolean;
    noindex: boolean;
    pros: string;
    cons: string;
    useCases: string;
    specs: string;
    faq: string;
  };
}

export function ProductEditForm({
  storeSlug,
  productId,
  categories,
  suppliers,
  product,
}: ProductEditFormProps) {
  const [state, formAction, isPending] = useActionState(updateProductAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="storeSlug" value={storeSlug} />

      <FormSection title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="title" label="Title" defaultValue={product.title} required />
          <SelectField
            name="categoryId"
            label="Category"
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
            defaultValue={product.categoryId}
          />
          <TextField name="subtitle" label="Subtitle" defaultValue={product.subtitle} />
          <TextField name="brand" label="Brand" defaultValue={product.brand} required />
          <TextField name="sku" label="SKU" defaultValue={product.sku} required />
          <TextField name="gtin" label="GTIN" defaultValue={product.gtin} hint="Optional barcode for Merchant feed." />
        </div>
        <TextareaField name="shortDescription" label="Short description" defaultValue={product.shortDescription} rows={2} hint="Max 300 chars; used in cards and meta." />
        <TextareaField name="description" label="Full description" defaultValue={product.description} rows={6} />
      </FormSection>

      <FormSection title="Media" description="Upload and order gallery images above. These fields mirror the primary image and update automatically — edit them only to point at an external URL.">
        <TextField name="imageUrl" label="Primary image URL" defaultValue={product.imageUrl} required hint="Auto-set to the primary uploaded image; override for an external/CDN URL." />
        <TextField name="imageAlt" label="Primary image alt text" defaultValue={product.imageAlt} hint="Describe the image for SEO and accessibility." />
      </FormSection>

      <FormSection title="Pricing" description="Margin and product score are recomputed on save from price, cost and shipping.">
        <div className="grid gap-4 sm:grid-cols-4">
          <NumberField name="price" label="Price" defaultValue={product.price} min={0} step={0.01} />
          <NumberField name="compareAtPrice" label="Compare-at price" defaultValue={product.compareAtPrice} min={0} step={0.01} hint="Only shown if honest." />
          <NumberField name="cost" label="Supplier cost" defaultValue={product.cost} min={0} step={0.01} />
          <NumberField name="shippingCost" label="Shipping cost" defaultValue={product.shippingCost} min={0} step={0.01} />
        </div>
      </FormSection>

      <FormSection title="Supply & fulfillment">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="supplierName" label="Supplier name" defaultValue={product.supplierName} hint="Matched to the Supplier table for reliability scoring." />
          <TextField name="supplierProductId" label="Supplier product ID" defaultValue={product.supplierProductId} />
          <SelectField name="stockStatus" label="Stock status" options={STOCK_OPTIONS} defaultValue={product.stockStatus} />
          <TextField name="countryOfOrigin" label="Country of origin" defaultValue={product.countryOfOrigin} />
          <NumberField name="shippingDaysMin" label="Shipping days (min)" defaultValue={product.shippingDaysMin} min={1} />
          <NumberField name="shippingDaysMax" label="Shipping days (max)" defaultValue={product.shippingDaysMax} min={1} />
          <TextField name="materials" label="Materials" defaultValue={product.materials} />
          <TextField name="warranty" label="Warranty" defaultValue={product.warranty} />
        </div>
        <CheckboxField name="returnable" label="Returnable" defaultChecked={product.returnable} />
        {suppliers.length > 0 && (
          <p className="text-xs text-slate-500">Known suppliers: {suppliers.join(", ")}</p>
        )}
      </FormSection>

      <FormSection title="Selling points" description="Honest pros and cons score higher than one-sided copy.">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextareaField name="pros" label="Pros" defaultValue={product.pros} rows={5} hint="One per line." />
          <TextareaField name="cons" label="Cons" defaultValue={product.cons} rows={5} hint="One per line." />
        </div>
        <TextareaField name="useCases" label="Use cases" defaultValue={product.useCases} rows={3} hint="One tag per line. Drives quiz + recommendations." />
        <TextareaField name="specs" label="Specs" defaultValue={product.specs} rows={5} hint="One per line as: Label | Value" />
        <TextareaField name="faq" label="FAQ" defaultValue={product.faq} rows={5} hint="One per line as: Question | Answer" />
      </FormSection>

      <FormSection title="SEO & publishing">
        <TextField name="seoTitle" label="SEO title" defaultValue={product.seoTitle} required />
        <TextareaField name="seoDescription" label="SEO description" defaultValue={product.seoDescription} rows={2} />
        <TextField name="canonicalUrl" label="Canonical URL" defaultValue={product.canonicalUrl} hint="Defaults to the primary domain product URL." />
        <div className="grid gap-1 sm:grid-cols-2">
          <CheckboxField name="isPublished" label="Published" defaultChecked={product.isPublished} hint="Unpublished products are hidden from the storefront." />
          <CheckboxField name="noindex" label="No-index" defaultChecked={product.noindex} hint="Keep live but exclude from search engines." />
        </div>
      </FormSection>

      <div className="sticky bottom-4 z-10 flex items-center gap-4 rounded-xl border border-slate-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save product"}
        </button>
        {state.error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {state.error}
          </p>
        )}
        {state.ok && state.message && (
          <p className="text-sm font-medium text-emerald-700">{state.message}</p>
        )}
      </div>
    </form>
  );
}

```


---

## src/components/admin/ProductImageManager.tsx

```tsx
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addProductImageAction,
  deleteProductImageAction,
  moveProductImageAction,
  setPrimaryProductImageAction,
  updateProductImageAltAction,
} from "@/lib/actions/admin-image";

export interface ProductImageManagerProps {
  storeSlug: string;
  productId: string;
  images: Array<{
    id: string;
    url: string;
    alt: string;
    sortOrder: number;
    isPrimary: boolean;
  }>;
}

export function ProductImageManager({ storeSlug, productId, images }: ProductImageManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
      router.refresh();
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.set("file", file);
        body.set("storeSlug", storeSlug);
        const response = await fetch("/api/admin/upload", { method: "POST", body });
        const data = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !data.url) {
          setError(data.error ?? "Upload failed.");
          continue;
        }
        const result = await addProductImageAction({
          productId,
          storeSlug,
          url: data.url,
          alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        });
        if (!result.ok) setError(result.error ?? "Could not attach image.");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    }
  }

  const busy = isPending || isUploading;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Images</h2>
          <p className="mt-1 text-sm text-slate-500">
            The primary image is mirrored to the product card, structured data and
            the Merchant feed. PNG, JPEG, WebP, GIF or AVIF up to 5 MB.
          </p>
        </div>
        <label className="cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          {isUploading ? "Uploading…" : "Upload images"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {images.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          No uploaded images yet. The storefront falls back to the current image
          URL / placeholder until you add one.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <li key={image.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt}
                  className="h-20 w-20 shrink-0 rounded-md border border-slate-200 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {image.isPrimary ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        Primary
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(() => setPrimaryProductImageAction({ imageId: image.id, storeSlug }))
                        }
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                      >
                        Set primary
                      </button>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Move up"
                        disabled={busy || index === 0}
                        onClick={() =>
                          run(() => moveProductImageAction({ imageId: image.id, storeSlug, direction: "up" }))
                        }
                        className="rounded px-1.5 py-0.5 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        disabled={busy || index === images.length - 1}
                        onClick={() =>
                          run(() => moveProductImageAction({ imageId: image.id, storeSlug, direction: "down" }))
                        }
                        className="rounded px-1.5 py-0.5 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(() => deleteProductImageAction({ imageId: image.id, storeSlug }))
                        }
                        className="rounded px-1.5 py-0.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <input
                    defaultValue={image.alt}
                    placeholder="Alt text (SEO + accessibility)"
                    disabled={busy}
                    onBlur={(event) => {
                      if (event.target.value !== image.alt) {
                        run(() =>
                          updateProductImageAltAction({
                            imageId: image.id,
                            storeSlug,
                            alt: event.target.value,
                          })
                        );
                      }
                    }}
                    className="mt-2 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-900 focus:outline-none disabled:bg-slate-100"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

```


---

## src/components/admin/StoreEditForm.tsx

```tsx
"use client";

import { useActionState, useState } from "react";
import type { CSSProperties } from "react";
import { updateStoreAction, type AdminActionState } from "@/lib/actions/admin-store";
import {
  CheckboxField,
  Field,
  FormSection,
  NumberField,
  SelectField,
  TextField,
  TextareaField,
  inputClass,
  labelClass,
} from "@/components/admin/fields";
import { buildThemeStyle } from "@/lib/theme";
import { HERO_VARIANT_OPTIONS, type StoreSettings } from "@/lib/settings/store-settings";

export interface StoreEditFormProps {
  slug: string;
  store: {
    name: string;
    legalName: string;
    primaryDomain: string;
    locale: string;
    currency: string;
    niche: string;
    positioning: string;
    audience: string;
    valueProposition: string;
    brandVoice: string;
    logoText: string;
    supportEmail: string;
    supportPhone: string | null;
    shippingOriginDisclosure: string;
    defaultShippingDaysMin: number;
    defaultShippingDaysMax: number;
    returnPolicySummary: string;
    privacyPolicy: string;
    termsOfSale: string;
    isActive: boolean;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: string;
    fontHeading: string;
    fontBody: string;
  };
  domains: string[];
  settings: StoreSettings;
}

const FONT_OPTIONS = [
  { value: "system-ui", label: "System UI" },
  { value: "serif", label: "Serif" },
  { value: "rounded", label: "Rounded" },
  { value: "mono", label: "Monospace" },
  { value: "humanist", label: "Humanist" },
  { value: "geometric", label: "Geometric" },
];

const initialState: AdminActionState = { ok: false, error: null };

function ColorInput({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} htmlFor={name}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} swatch`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded border border-slate-300"
        />
        <input
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} font-mono`}
        />
      </div>
    </Field>
  );
}

export function StoreEditForm({ slug, store, theme, domains, settings }: StoreEditFormProps) {
  const [state, formAction, isPending] = useActionState(updateStoreAction, initialState);

  const [colors, setColors] = useState({
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    accentColor: theme.accentColor,
    backgroundColor: theme.backgroundColor,
    textColor: theme.textColor,
  });
  const setColor = (key: keyof typeof colors) => (value: string) =>
    setColors((current) => ({ ...current, [key]: value }));

  const previewStyle = buildThemeStyle({
    id: "preview",
    storeId: "preview",
    ...colors,
    borderRadius: theme.borderRadius,
    fontHeading: theme.fontHeading,
    fontBody: theme.fontBody,
  }) as CSSProperties;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="slug" value={slug} />

      <FormSection title="Brand & identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="name" label="Store name" defaultValue={store.name} required />
          <TextField name="legalName" label="Legal name" defaultValue={store.legalName} required />
          <TextField name="logoText" label="Logo text" defaultValue={store.logoText} required />
          <TextField name="niche" label="Niche" defaultValue={store.niche} required />
        </div>
        <TextField name="positioning" label="Positioning" defaultValue={store.positioning} required />
        <TextField name="audience" label="Audience" defaultValue={store.audience} required />
        <TextareaField
          name="valueProposition"
          label="Value proposition"
          defaultValue={store.valueProposition}
          rows={2}
        />
        <TextField name="brandVoice" label="Brand voice" defaultValue={store.brandVoice} required />
      </FormSection>

      <FormSection
        title="Domains & locale"
        description="Canonical URLs always use the primary domain — never the /s/ path."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="primaryDomain"
            label="Primary domain"
            defaultValue={store.primaryDomain}
            required
            hint="e.g. dronehub.example"
          />
          <TextField name="locale" label="Locale" defaultValue={store.locale} required hint="e.g. en-US" />
          <TextField name="currency" label="Currency" defaultValue={store.currency} required hint="ISO 4217, e.g. USD" />
        </div>
        <TextareaField
          name="domains"
          label="Additional domains"
          defaultValue={domains.filter((host) => host !== store.primaryDomain).join("\n")}
          rows={3}
          hint="One hostname per line. The primary domain is added automatically."
        />
        <CheckboxField
          name="isActive"
          label="Store is active"
          defaultChecked={store.isActive}
          hint="Inactive stores stop resolving on their domains and disappear from sitemaps."
        />
      </FormSection>

      <FormSection title="Support & shipping">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="supportEmail" label="Support email" type="email" defaultValue={store.supportEmail} required />
          <TextField name="supportPhone" label="Support phone" defaultValue={store.supportPhone} />
          <NumberField name="defaultShippingDaysMin" label="Default shipping days (min)" defaultValue={store.defaultShippingDaysMin} min={1} />
          <NumberField name="defaultShippingDaysMax" label="Default shipping days (max)" defaultValue={store.defaultShippingDaysMax} min={1} />
        </div>
        <TextareaField
          name="shippingOriginDisclosure"
          label="Shipping origin disclosure"
          defaultValue={store.shippingOriginDisclosure}
          rows={2}
          hint="Honest disclosure of where orders ship from and expected transit time."
        />
      </FormSection>

      <FormSection title="Policies">
        <TextareaField name="returnPolicySummary" label="Return policy summary" defaultValue={store.returnPolicySummary} rows={2} />
        <TextareaField name="privacyPolicy" label="Privacy policy" defaultValue={store.privacyPolicy} rows={5} />
        <TextareaField name="termsOfSale" label="Terms of sale" defaultValue={store.termsOfSale} rows={5} />
      </FormSection>

      <FormSection title="Theme" description="Changes preview live; save to apply to the storefront.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <ColorInput name="primaryColor" label="Primary" value={colors.primaryColor} onChange={setColor("primaryColor")} />
            <ColorInput name="secondaryColor" label="Secondary" value={colors.secondaryColor} onChange={setColor("secondaryColor")} />
            <ColorInput name="accentColor" label="Accent" value={colors.accentColor} onChange={setColor("accentColor")} />
            <ColorInput name="backgroundColor" label="Background" value={colors.backgroundColor} onChange={setColor("backgroundColor")} />
            <ColorInput name="textColor" label="Text" value={colors.textColor} onChange={setColor("textColor")} />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField name="borderRadius" label="Border radius" defaultValue={theme.borderRadius} hint="e.g. 0.75rem" />
              <SelectField name="fontHeading" label="Heading font" options={FONT_OPTIONS} defaultValue={theme.fontHeading} />
              <SelectField name="fontBody" label="Body font" options={FONT_OPTIONS} defaultValue={theme.fontBody} />
            </div>
          </div>
          <div>
            <span className={labelClass}>Live preview</span>
            <div style={previewStyle} className="overflow-hidden rounded-theme border border-slate-200 bg-surface font-body text-ink">
              <div className="flex items-center justify-between bg-secondary px-4 py-3 text-white">
                <span className="font-heading text-sm font-bold">{store.logoText || "Logo"}</span>
                <span className="rounded-theme bg-accent px-2 py-1 text-xs font-semibold text-black/80">Cart</span>
              </div>
              <div className="p-4">
                <h3 className="font-heading text-lg font-bold">{store.name || "Store name"}</h3>
                <p className="mt-1 text-sm opacity-80">{store.valueProposition || "Value proposition preview"}</p>
                <button type="button" className="mt-3 rounded-theme bg-primary px-3 py-2 text-sm font-semibold text-white">
                  Shop now
                </button>
                <div className="mt-4 rounded-theme bg-primary-soft p-3 text-xs">
                  Soft accent surface · radius {theme.borderRadius}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      <SettingsFields settings={settings} />

      <div className="sticky bottom-4 z-10 flex items-center gap-4 rounded-xl border border-slate-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save store"}
        </button>
        {state.error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {state.error}
          </p>
        )}
        {state.ok && state.message && (
          <p className="text-sm font-medium text-emerald-700">{state.message}</p>
        )}
      </div>
    </form>
  );
}

function SettingsFields({ settings }: { settings: StoreSettings }) {
  return (
    <>
      <FormSection title="SEO defaults">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="s_seo_defaultOgImage" label="Default OG image URL" defaultValue={settings.seo.defaultOgImage} />
          <TextField name="s_seo_googleSiteVerification" label="Google site verification" defaultValue={settings.seo.googleSiteVerification} />
        </div>
        <TextareaField name="s_seo_robotsExtraDisallow" label="Robots extra disallow" defaultValue={settings.seo.robotsExtraDisallow.join("\n")} rows={2} hint="One path per line." />
        <TextField name="s_seo_hreflangLocales" label="Hreflang locales" defaultValue={settings.seo.hreflangLocales.join(", ")} hint="Comma-separated, e.g. en-US, en-GB" />
      </FormSection>

      <FormSection title="Homepage">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField name="s_home_heroVariant" label="Hero variant" options={HERO_VARIANT_OPTIONS} defaultValue={settings.homepage.heroVariant} />
          <TextField name="s_home_featuredCollectionSlug" label="Featured collection slug" defaultValue={settings.homepage.featuredCollectionSlug} />
        </div>
        <TextareaField name="s_home_trustBarItems" label="Trust bar items" defaultValue={settings.homepage.trustBarItems.join("\n")} rows={3} hint="One claim per line." />
        <div className="grid gap-1 sm:grid-cols-2">
          <CheckboxField name="s_home_showQuizCta" label="Show quiz CTA" defaultChecked={settings.homepage.showQuizCta} />
          <CheckboxField name="s_home_showComparisonCta" label="Show comparison CTA" defaultChecked={settings.homepage.showComparisonCta} />
        </div>
      </FormSection>

      <FormSection title="Monetization">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField name="s_mon_targetMarginPercent" label="Target margin %" defaultValue={settings.monetization.targetMarginPercent} min={0} max={95} />
          <NumberField name="s_mon_minMarginPercent" label="Min margin %" defaultValue={settings.monetization.minMarginPercent} min={0} max={95} />
          <NumberField name="s_mon_bundleDiscountPercent" label="Bundle discount %" defaultValue={settings.monetization.bundleDiscountPercent} min={0} max={90} />
        </div>
        <TextField name="s_mon_subscriptionSkus" label="Subscription SKUs" defaultValue={settings.monetization.subscriptionSkus.join(", ")} hint="Comma-separated SKUs offered as subscriptions." />
        <CheckboxField name="s_mon_enableCompareAtPrice" label="Enable compare-at price" defaultChecked={settings.monetization.enableCompareAtPrice} hint="Only honest anchor prices are ever shown (see pricing rules)." />
      </FormSection>

      <FormSection title="Marketing">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField name="s_mkt_metaPixelId" label="Meta Pixel ID" defaultValue={settings.marketing.metaPixelId} />
          <TextField name="s_mkt_googleAdsId" label="Google Ads ID" defaultValue={settings.marketing.googleAdsId} />
          <TextField name="s_mkt_utmDefaultSource" label="Default UTM source" defaultValue={settings.marketing.utmDefaultSource} />
        </div>
      </FormSection>

      <FormSection title="Personalization">
        <CheckboxField name="s_per_enabled" label="Enable personalization" defaultChecked={settings.personalization.enabled} hint="Recommendations only run with analytics consent." />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField name="s_per_quizWeight" label="Quiz weight" defaultValue={settings.personalization.quizWeight} min={0} max={10} step={0.5} />
          <NumberField name="s_per_browseHistoryWeight" label="Browse history weight" defaultValue={settings.personalization.browseHistoryWeight} min={0} max={10} step={0.5} />
        </div>
      </FormSection>

      <FormSection title="Automation">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField name="s_auto_autoPublishMinScore" label="Auto-publish min score" defaultValue={settings.automation.autoPublishMinScore} min={0} max={100} hint="Imported products at/above this score publish automatically." />
          <NumberField name="s_auto_autoNoindexBelowScore" label="Auto-noindex below score" defaultValue={settings.automation.autoNoindexBelowScore} min={0} max={100} hint="Weak products get noindex until improved." />
          <TextField name="s_auto_importDefaultSupplier" label="Default import supplier" defaultValue={settings.automation.importDefaultSupplier} />
          <TextField name="s_auto_importKeywords" label="Import keywords" defaultValue={settings.automation.importKeywords.join(", ")} hint="Comma-separated seed keywords." />
        </div>
      </FormSection>

      <FormSection title="Compliance">
        <CheckboxField name="s_comp_showDropshipDisclosure" label="Show dropship disclosure" defaultChecked={settings.compliance.showDropshipDisclosure} />
        <TextareaField name="s_comp_importTaxDisclaimer" label="Import tax disclaimer" defaultValue={settings.compliance.importTaxDisclaimer} rows={2} />
        <TextField name="s_comp_cookiePolicyUrl" label="Cookie policy URL" defaultValue={settings.compliance.cookiePolicyUrl} />
      </FormSection>
    </>
  );
}

```


---

## src/components/Breadcrumbs.tsx

```tsx
import Link from "next/link";

export interface Crumb {
  name: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-ink/60">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true" className="text-ink/30">
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-primary hover:underline">
                  {item.name}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="text-ink/80">
                  {item.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

```


---

## src/components/CartButton.tsx

```tsx
"use client";

import { useCart } from "@/lib/cart/cart-context";

/** Header cart trigger; opens the drawer and announces the item count. */
export function CartButton() {
  const cart = useCart();
  return (
    <button
      type="button"
      onClick={cart.openDrawer}
      className="relative rounded-theme p-2 text-ink/70 transition hover:bg-primary-soft hover:text-primary"
      aria-label={`Open cart, ${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 4h2l2.5 12.5a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="20.5" r="1.2" />
        <circle cx="17" cy="20.5" r="1.2" />
      </svg>
      {cart.isHydrated && cart.itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white"
        >
          {cart.itemCount}
        </span>
      )}
    </button>
  );
}

```


---

## src/components/CartDrawer.tsx

```tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { estimateShippingCost, useCart } from "@/lib/cart/cart-context";
import { formatCurrency } from "@/lib/pricing/calculate-price";

export function CartDrawer({ locale }: { locale: string }) {
  const cart = useCart();

  // Close on Escape for keyboard accessibility.
  useEffect(() => {
    if (!cart.isDrawerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") cart.closeDrawer();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cart, cart.isDrawerOpen]);

  if (!cart.isDrawerOpen) return null;

  const shipping = estimateShippingCost(cart.subtotal);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-black/40"
        onClick={cart.closeDrawer}
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="text-lg font-bold text-ink">
            Your cart ({cart.itemCount})
          </h2>
          <button
            type="button"
            onClick={cart.closeDrawer}
            className="rounded-full p-2 text-ink/60 hover:bg-ink/5 hover:text-ink"
            aria-label="Close cart"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-base font-medium text-ink">Your cart is empty</p>
            <p className="text-sm text-ink/60">
              Browse the catalog or take the product quiz to find a good fit.
            </p>
            <Link href="/quiz" className="btn-secondary" onClick={cart.closeDrawer}>
              Take the quiz
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-5">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex gap-4 py-4">
                  <img
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    className="h-16 w-16 shrink-0 rounded-theme object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/p/${item.slug}`}
                      onClick={cart.closeDrawer}
                      className="block truncate text-sm font-medium text-ink hover:text-primary"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink/60">
                      {item.shippingDaysMin}–{item.shippingDaysMax} business days
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-theme border border-ink/15">
                        <button
                          type="button"
                          className="px-2.5 py-1 text-sm hover:bg-ink/5"
                          aria-label={`Decrease quantity of ${item.title}`}
                          onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="min-w-7 text-center text-sm" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="px-2.5 py-1 text-sm hover:bg-ink/5"
                          aria-label={`Increase quantity of ${item.title}`}
                          onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatCurrency(item.price * item.quantity, cart.currency, locale)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => cart.removeItem(item.productId)}
                    className="self-start text-xs text-ink/50 underline hover:text-red-600"
                    aria-label={`Remove ${item.title} from cart`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-ink/10 px-5 py-4">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink/70">Subtotal</dt>
                  <dd className="font-semibold">
                    {formatCurrency(cart.subtotal, cart.currency, locale)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/70">Shipping estimate</dt>
                  <dd className="font-semibold">
                    {shipping === 0
                      ? "Free"
                      : formatCurrency(shipping, cart.currency, locale)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 grid gap-2">
                <Link href="/checkout" className="btn-primary" onClick={cart.closeDrawer}>
                  Go to checkout
                </Link>
                <Link href="/cart" className="btn-secondary" onClick={cart.closeDrawer}>
                  View cart
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

```


---

## src/components/CartPageContent.tsx

```tsx
"use client";

import Link from "next/link";
import { estimateShippingCost, useCart } from "@/lib/cart/cart-context";
import { formatCurrency } from "@/lib/pricing/calculate-price";

export function CartPageContent({
  locale,
  shippingNote,
}: {
  locale: string;
  shippingNote: string;
}) {
  const cart = useCart();

  if (!cart.isHydrated) {
    return (
      <div className="card animate-pulse space-y-4 p-6" aria-busy="true" aria-label="Loading cart">
        <div className="h-16 rounded-theme bg-ink/10" />
        <div className="h-16 rounded-theme bg-ink/10" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <p className="text-lg font-semibold text-ink">Your cart is empty</p>
        <p className="max-w-sm text-sm text-ink/60">
          Not sure where to start? The quiz matches products to how you will
          actually use them.
        </p>
        <div className="mt-2 flex gap-3">
          <Link href="/" className="btn-primary">
            Browse products
          </Link>
          <Link href="/quiz" className="btn-secondary">
            Take the quiz
          </Link>
        </div>
      </div>
    );
  }

  const shipping = estimateShippingCost(cart.subtotal);
  const maxDays = Math.max(...cart.items.map((item) => item.shippingDaysMax));
  const minDays = Math.max(...cart.items.map((item) => item.shippingDaysMin));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="card divide-y divide-ink/10">
        {cart.items.map((item) => (
          <li key={item.productId} className="flex gap-4 p-5">
            <img
              src={item.imageUrl}
              alt={item.imageAlt}
              className="h-20 w-20 shrink-0 rounded-theme object-cover"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/p/${item.slug}`}
                className="text-sm font-semibold text-ink hover:text-primary"
              >
                {item.title}
              </Link>
              <p className="mt-1 text-xs text-ink/60">
                Delivery in {item.shippingDaysMin}–{item.shippingDaysMax} business days
              </p>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center rounded-theme border border-ink/15">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-sm hover:bg-ink/5"
                    aria-label={`Decrease quantity of ${item.title}`}
                    onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-sm hover:bg-ink/5"
                    aria-label={`Increase quantity of ${item.title}`}
                    onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="text-xs text-ink/50 underline hover:text-red-600"
                  onClick={() => cart.removeItem(item.productId)}
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="text-sm font-bold text-ink">
              {formatCurrency(item.price * item.quantity, cart.currency, locale)}
            </p>
          </li>
        ))}
      </ul>

      <aside className="card h-fit p-6" aria-label="Order summary">
        <h2 className="text-lg font-bold text-ink">Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/70">Subtotal</dt>
            <dd className="font-semibold">
              {formatCurrency(cart.subtotal, cart.currency, locale)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/70">Shipping</dt>
            <dd className="font-semibold">
              {shipping === 0 ? "Free" : formatCurrency(shipping, cart.currency, locale)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-2 text-base">
            <dt className="font-bold text-ink">Total</dt>
            <dd className="font-bold text-ink">
              {formatCurrency(cart.subtotal + shipping, cart.currency, locale)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-ink/60">
          Estimated delivery: {minDays}–{maxDays} business days. {shippingNote}
        </p>
        <Link href="/checkout" className="btn-primary mt-5 w-full">
          Go to checkout
        </Link>
      </aside>
    </div>
  );
}

```


---

## src/components/CategoryCard.tsx

```tsx
import Link from "next/link";
import type { Category } from "@prisma/client";

export function CategoryCard({
  category,
  productCount,
}: {
  category: Category;
  productCount: number;
}) {
  return (
    <Link
      href={`/c/${category.slug}`}
      className="card group flex flex-col justify-between gap-4 p-6 transition hover:border-primary"
    >
      <div>
        <h3 className="text-lg font-bold text-ink group-hover:text-primary">
          {category.name}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/70">
          {category.description}
        </p>
      </div>
      <p className="text-sm font-medium text-primary">
        {productCount} {productCount === 1 ? "product" : "products"} →
      </p>
    </Link>
  );
}

```


---

## src/components/CheckoutForm.tsx

```tsx
"use client";

import Link from "next/link";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { useEffect, useMemo, useState, useTransition } from "react";
import { placeOrder, type CheckoutResult } from "@/lib/actions/checkout";
import { track } from "@/lib/analytics/track";
import { estimateShippingCost, useCart } from "@/lib/cart/cart-context";
import { formatCurrency } from "@/lib/pricing/calculate-price";

interface FormState {
  name: string;
  email: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  addressLine1: "",
  city: "",
  postalCode: "",
  country: "",
};

interface PaymentSession {
  clientSecret: ***REDACTED***
  orderId: string;
  orderNumber: string;
}

function StripePaymentStep({
  orderId,
  orderNumber,
  storeSlug,
  locale,
  grandTotal,
  currency,
  onSuccess,
  onError,
}: {
  orderId: string;
  orderNumber: string;
  storeSlug: string;
  locale: string;
  grandTotal: number;
  currency: string;
  onSuccess: (result: CheckoutResult) => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const cart = useCart();
  const [isPaying, setIsPaying] = useState(false);

  async function handlePay(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsPaying(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout?order=${orderId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message ?? "Payment failed.");
      setIsPaying(false);
      return;
    }

    const response = await fetch("/api/checkout/create-payment-intent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      orderNumber?: string;
    };

    if (!response.ok || payload.ok === false) {
      onError(payload.error ?? "Fulfillment failed after payment authorization.");
      setIsPaying(false);
      return;
    }

    track(storeSlug, "checkout_success", {
      orderRef: orderNumber,
      total: grandTotal,
    });
    cart.clearCart();
    onSuccess({
      ok: true,
      orderRef: orderNumber,
      orderId,
      total: grandTotal,
      currency,
      message: "Order placed successfully.",
    });
    setIsPaying(false);
  }

  return (
    <form onSubmit={handlePay} className="card space-y-4 p-6">
      <h2 className="text-lg font-bold text-ink">Payment</h2>
      <PaymentElement />
      <button type="submit" className="btn-primary w-full" disabled={!stripe || isPaying}>
        {isPaying ? "Processing…" : `Pay ${formatCurrency(grandTotal, currency, locale)}`}
      </button>
    </form>
  );
}

export function CheckoutForm({
  storeSlug,
  locale,
  mockCheckout,
}: {
  storeSlug: string;
  locale: string;
  mockCheckout: boolean;
}) {
  const cart = useCart();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  const stripePromise = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    return key ? loadStripe(key) : null;
  }, []);
  const useStripeCheckout = !mockCheckout && Boolean(stripePromise);

  useEffect(() => {
    if (cart.isHydrated && cart.items.length > 0) {
      track(storeSlug, "begin_checkout", {
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
      });
    }
    // Fire once on mount after hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.isHydrated]);

  function setField(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleMockSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const response = await placeOrder({
        storeSlug,
        ...form,
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      setResult(response);
      if (response.ok) {
        track(storeSlug, "checkout_success", {
          orderRef: response.orderRef,
          total: response.total,
        });
        cart.clearCart();
      }
    });
  }

  async function handleStripeContinue(event: React.FormEvent) {
    event.preventDefault();
    setIsCreatingPayment(true);
    setResult(null);

    try {
      const response = await fetch("/api/checkout/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          ...form,
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const payload = (await response.json()) as {
        clientSecret?: string;
        orderId?: string;
        orderNumber?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (!response.ok) {
        setResult({
          ok: false,
          message: payload.error ?? "Could not start checkout.",
          fieldErrors: payload.fieldErrors,
        });
        return;
      }

      if (!payload.clientSecret || !payload.orderId || !payload.orderNumber) {
        setResult({ ok: false, message: "Invalid payment session from server." });
        return;
      }

      setPaymentSession({
        clientSecret: ***REDACTED***,
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
      });
    } catch {
      setResult({ ok: false, message: "Network error while starting payment." });
    } finally {
      setIsCreatingPayment(false);
    }
  }

  const elementsOptions: StripeElementsOptions | undefined = paymentSession
    ? {
        clientSecret: ***REDACTED***,
        appearance: { theme: "stripe" },
      }
    : undefined;

  if (result?.ok) {
    return (
      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700"
        >
          ✓
        </span>
        <h2 className="text-2xl font-bold text-ink">Thank you for your order!</h2>
        <p className="text-sm text-ink/70">
          Order reference: <strong>{result.orderRef}</strong>
        </p>
        {result.total !== undefined && result.currency && (
          <p className="text-sm text-ink/70">
            Total: {formatCurrency(result.total, result.currency, locale)}
          </p>
        )}
        <p className="max-w-md text-sm leading-6 text-ink/60">
          A confirmation with tracking details follows by email once the
          supplier hands your parcel to the carrier.
        </p>
        <Link href="/" className="btn-primary mt-3">
          Continue shopping
        </Link>
      </div>
    );
  }

  if (!cart.isHydrated) {
    return (
      <div className="card h-48 animate-pulse p-6" aria-busy="true" aria-label="Loading checkout" />
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <p className="text-lg font-semibold text-ink">Your cart is empty</p>
        <Link href="/" className="btn-primary mt-2">
          Browse products
        </Link>
      </div>
    );
  }

  if (useStripeCheckout && !stripePromise) {
    return (
      <div className="card p-6 text-sm text-red-700" role="alert">
        Stripe publishable key is missing. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY or enable
        MOCK_CHECKOUT=true for local development.
      </div>
    );
  }

  const shipping = estimateShippingCost(cart.subtotal);
  const grandTotal = cart.subtotal + shipping;
  const fields: Array<{
    key: keyof FormState;
    label: string;
    autoComplete: string;
    type?: string;
  }> = [
    { key: "name", label: "Full name", autoComplete: "name" },
    { key: "email", label: "Email address", autoComplete: "email", type: "email" },
    { key: "addressLine1", label: "Street address", autoComplete: "address-line1" },
    { key: "city", label: "City", autoComplete: "address-level2" },
    { key: "postalCode", label: "Postal code", autoComplete: "postal-code" },
    { key: "country", label: "Country", autoComplete: "country-name" },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {!paymentSession ? (
          <form
            onSubmit={useStripeCheckout ? handleStripeContinue : handleMockSubmit}
            className="card space-y-4 p-6"
            noValidate
          >
            <h2 className="text-lg font-bold text-ink">Delivery details</h2>
            {fields.map((field) => (
              <div key={field.key}>
                <label htmlFor={`checkout-${field.key}`} className="label">
                  {field.label}
                </label>
                <input
                  id={`checkout-${field.key}`}
                  type={field.type ?? "text"}
                  required
                  className="input"
                  autoComplete={field.autoComplete}
                  value={form[field.key]}
                  onChange={(event) => setField(field.key, event.target.value)}
                  aria-invalid={Boolean(result?.fieldErrors?.[field.key])}
                  aria-describedby={
                    result?.fieldErrors?.[field.key]
                      ? `checkout-${field.key}-error`
                      : undefined
                  }
                />
                {result?.fieldErrors?.[field.key] && (
                  <p
                    id={`checkout-${field.key}-error`}
                    className="mt-1 text-xs text-red-600"
                    role="alert"
                  >
                    {result.fieldErrors[field.key]}
                  </p>
                )}
              </div>
            ))}

            {result && !result.ok && !result.fieldErrors && (
              <p role="alert" className="rounded-theme bg-red-50 px-4 py-3 text-sm text-red-700">
                {result.message}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={isPending || isCreatingPayment}
            >
              {useStripeCheckout
                ? isCreatingPayment
                  ? "Preparing payment…"
                  : "Continue to payment"
                : isPending
                  ? "Placing order…"
                  : "Place order"}
            </button>
            <p className="text-xs leading-5 text-ink/50">
              By placing the order you accept the{" "}
              <Link href="/policies/terms" className="underline">
                terms of sale
              </Link>{" "}
              and{" "}
              <Link href="/policies/privacy" className="underline">
                privacy policy
              </Link>
              .
            </p>
          </form>
        ) : (
          stripePromise &&
          elementsOptions && (
            <Elements stripe={stripePromise} options={elementsOptions}>
              <StripePaymentStep
                orderId={paymentSession.orderId}
                orderNumber={paymentSession.orderNumber}
                storeSlug={storeSlug}
                locale={locale}
                grandTotal={grandTotal}
                currency={cart.currency}
                onSuccess={setResult}
                onError={(message) => setResult({ ok: false, message })}
              />
            </Elements>
          )
        )}

        {paymentSession && (
          <button
            type="button"
            className="text-sm text-ink/60 underline"
            onClick={() => setPaymentSession(null)}
          >
            Edit delivery details
          </button>
        )}
      </div>

      <aside className="card h-fit p-6" aria-label="Order summary">
        <h2 className="text-lg font-bold text-ink">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {cart.items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3 text-sm">
              <img
                src={item.imageUrl}
                alt={item.imageAlt}
                className="h-12 w-12 shrink-0 rounded-theme object-cover"
              />
              <span className="min-w-0 flex-1 truncate text-ink/80">
                {item.quantity} × {item.title}
              </span>
              <span className="font-semibold">
                {formatCurrency(item.price * item.quantity, cart.currency, locale)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/70">Subtotal</dt>
            <dd className="font-semibold">
              {formatCurrency(cart.subtotal, cart.currency, locale)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/70">Shipping</dt>
            <dd className="font-semibold">
              {shipping === 0 ? "Free" : formatCurrency(shipping, cart.currency, locale)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-2 text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-bold">
              {formatCurrency(grandTotal, cart.currency, locale)}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

```


---

## src/components/ComparisonTable.tsx

```tsx
import Link from "next/link";
import type { Product } from "@prisma/client";
import { formatCurrency } from "@/lib/pricing/calculate-price";
import { parseSpecs } from "@/lib/utils/json";
import { STOCK_STATUS_LABELS, isStockStatus } from "@/lib/types";

/**
 * Side-by-side product comparison built from real catalog data. Spec rows
 * are the union of all compared products' specs; missing values show an
 * honest em dash rather than being hidden.
 */
export function ComparisonTable({
  products,
  locale = "en-US",
}: {
  products: Product[];
  locale?: string;
}) {
  if (products.length === 0) return null;

  const specRows: string[] = [];
  const specMap = new Map<string, Map<string, string>>();
  for (const product of products) {
    const specs = parseSpecs(product.specs);
    const productSpecs = new Map<string, string>();
    for (const spec of specs) {
      if (!specRows.includes(spec.label)) specRows.push(spec.label);
      productSpecs.set(spec.label, spec.value);
    }
    specMap.set(product.id, productSpecs);
  }

  return (
    <div className="overflow-x-auto rounded-theme-lg border border-ink/10 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Product comparison</caption>
        <thead>
          <tr className="border-b border-ink/10 bg-primary-soft">
            <th scope="col" className="px-4 py-3 font-semibold text-ink">
              Product
            </th>
            {products.map((product) => (
              <th key={product.id} scope="col" className="px-4 py-3 align-top">
                <Link
                  href={`/p/${product.slug}`}
                  className="font-semibold text-ink hover:text-primary"
                >
                  {product.title}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          <tr>
            <th scope="row" className="px-4 py-3 font-medium text-ink/70">
              Price
            </th>
            {products.map((product) => (
              <td key={product.id} className="px-4 py-3 font-semibold text-ink">
                {formatCurrency(product.price, product.currency, locale)}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 font-medium text-ink/70">
              Delivery
            </th>
            {products.map((product) => (
              <td key={product.id} className="px-4 py-3">
                {product.shippingDaysMin}–{product.shippingDaysMax} business days
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 font-medium text-ink/70">
              Availability
            </th>
            {products.map((product) => (
              <td key={product.id} className="px-4 py-3">
                {isStockStatus(product.stockStatus)
                  ? STOCK_STATUS_LABELS[product.stockStatus]
                  : product.stockStatus}
              </td>
            ))}
          </tr>
          {specRows.map((label) => (
            <tr key={label}>
              <th scope="row" className="px-4 py-3 font-medium text-ink/70">
                {label}
              </th>
              {products.map((product) => (
                <td key={product.id} className="px-4 py-3 text-ink/80">
                  {specMap.get(product.id)?.get(label) ?? "—"}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <th scope="row" className="px-4 py-3 font-medium text-ink/70">
              <span className="sr-only">Link</span>
            </th>
            {products.map((product) => (
              <td key={product.id} className="px-4 py-3">
                <Link href={`/p/${product.slug}`} className="text-sm font-semibold text-primary underline">
                  View details
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

```


---

## src/components/CookieConsent.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import { getCookieConsent, setCookieConsent } from "@/lib/consent";

/**
 * Cookie consent banner. Necessary cookies are always on; analytics and
 * marketing are opt-in. Accept and reject get equal visual weight by design
 * (no dark patterns), and no marketing/analytics script loads before a
 * positive decision (enforced in src/lib/analytics/track.ts).
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (getCookieConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  function decide(options: { analytics: boolean; marketing: boolean }) {
    setCookieConsent(options);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] sm:p-5"
    >
      <div className="mx-auto max-w-site">
        <h2 className="text-sm font-bold text-ink">Cookies on this site</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink/70">
          Necessary cookies keep the cart and checkout working and are always
          on. Analytics and marketing cookies are optional and only used if
          you allow them.
        </p>

        {showDetails && (
          <fieldset className="mt-3 space-y-2">
            <legend className="sr-only">Optional cookie categories</legend>
            <label className="flex items-center gap-2 text-sm text-ink/80">
              <input type="checkbox" checked disabled className="h-4 w-4" />
              Necessary (always on)
            </label>
            <label className="flex items-center gap-2 text-sm text-ink/80">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Analytics — anonymous usage statistics
            </label>
            <label className="flex items-center gap-2 text-sm text-ink/80">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(event) => setMarketing(event.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Marketing — personalized campaigns
            </label>
          </fieldset>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Equal visual weight on accept and reject — intentionally. */}
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              decide(
                showDetails
                  ? { analytics, marketing }
                  : { analytics: true, marketing: true }
              )
            }
          >
            {showDetails ? "Save choices" : "Accept all"}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => decide({ analytics: false, marketing: false })}
          >
            Reject optional
          </button>
          {!showDetails && (
            <button
              type="button"
              className="text-sm font-medium text-ink/70 underline hover:text-primary"
              onClick={() => setShowDetails(true)}
            >
              Choose per category
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

```


---

## src/components/FAQAccordion.tsx

```tsx
import type { FaqItem } from "@/lib/types";

/**
 * Accessible FAQ using native <details>/<summary> — keyboard and screen
 * reader friendly without any JavaScript. Pages that render this can safely
 * emit FAQPage JSON-LD for the same items.
 */
export function FAQAccordion({
  items,
  title = "Frequently asked questions",
}: {
  items: FaqItem[];
  title?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-4 divide-y divide-ink/10 rounded-theme-lg border border-ink/10 bg-white">
        {items.map((item, index) => (
          <details key={index} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-ink [&::-webkit-details-marker]:hidden">
              {item.question}
              <span
                aria-hidden="true"
                className="text-xl text-primary transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-6 text-ink/75">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

```


---

## src/components/FilterSidebar.tsx

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Category filters encoded in the URL (server component applies them), so
 * filtered views are shareable and crawlable-safe.
 */
export function FilterSidebar({ useCaseOptions }: { useCaseOptions: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const hasFilters = ["maxPrice", "maxDays", "stock", "useCase"].some((key) =>
    searchParams.has(key)
  );

  return (
    <form
      aria-label="Filter products"
      className="card space-y-5 p-5"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
          Filters
        </h2>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="text-xs font-medium text-primary underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div>
        <label htmlFor="filter-price" className="label">
          Max price
        </label>
        <select
          id="filter-price"
          className="input"
          value={searchParams.get("maxPrice") ?? ""}
          onChange={(event) => setParam("maxPrice", event.target.value)}
        >
          <option value="">Any price</option>
          <option value="25">Up to 25</option>
          <option value="50">Up to 50</option>
          <option value="100">Up to 100</option>
          <option value="250">Up to 250</option>
          <option value="500">Up to 500</option>
        </select>
      </div>

      <div>
        <label htmlFor="filter-days" className="label">
          Delivery time
        </label>
        <select
          id="filter-days"
          className="input"
          value={searchParams.get("maxDays") ?? ""}
          onChange={(event) => setParam("maxDays", event.target.value)}
        >
          <option value="">Any speed</option>
          <option value="7">Within 7 days</option>
          <option value="10">Within 10 days</option>
          <option value="14">Within 14 days</option>
        </select>
      </div>

      <div>
        <span className="label">Availability</span>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--color-primary)]"
            checked={searchParams.get("stock") === "in"}
            onChange={(event) => setParam("stock", event.target.checked ? "in" : "")}
          />
          In stock only
        </label>
      </div>

      {useCaseOptions.length > 0 && (
        <div>
          <label htmlFor="filter-usecase" className="label">
            Use case
          </label>
          <select
            id="filter-usecase"
            className="input"
            value={searchParams.get("useCase") ?? ""}
            onChange={(event) => setParam("useCase", event.target.value)}
          >
            <option value="">All use cases</option>
            {useCaseOptions.map((useCase) => (
              <option key={useCase} value={useCase}>
                {useCase.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </div>
      )}
    </form>
  );
}

```


---

## src/components/GuideCard.tsx

```tsx
import Link from "next/link";
import type { ContentPage } from "@prisma/client";

export function GuideCard({ guide }: { guide: ContentPage }) {
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="card group flex h-full flex-col gap-3 p-6 transition hover:border-primary"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Buying guide
      </p>
      <h3 className="text-lg font-bold leading-snug text-ink group-hover:text-primary">
        {guide.title}
      </h3>
      <p className="line-clamp-3 flex-1 text-sm leading-6 text-ink/70">
        {guide.excerpt}
      </p>
      <p className="text-sm font-medium text-primary">Read the guide →</p>
    </Link>
  );
}

```


---

## src/components/NewsletterCapture.tsx

```tsx
"use client";

import { useState, useTransition } from "react";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";
import { track } from "@/lib/analytics/track";

export function NewsletterCapture({
  storeSlug,
  source = "homepage",
  heading = "Useful emails only",
  subheading = "Buying guides, honest product notes and restock info. No daily spam, unsubscribe anytime.",
}: {
  storeSlug: string;
  source?: string;
  heading?: string;
  subheading?: string;
}) {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const response = await subscribeToNewsletter({ storeSlug, email, source });
      setResult(response);
      if (response.ok) {
        setEmail("");
        track(storeSlug, "newsletter_signup", { source });
      }
    });
  }

  return (
    <section
      aria-label="Newsletter signup"
      className="rounded-theme-lg bg-secondary px-6 py-10 text-white sm:px-10"
    >
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-2xl font-bold">{heading}</h2>
        <p className="mt-2 text-sm text-white/80">{subheading}</p>
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label htmlFor={`newsletter-${source}`} className="sr-only">
            Email address
          </label>
          <input
            id={`newsletter-${source}`}
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="input flex-1 text-ink"
            autoComplete="email"
          />
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
        {result && (
          <p
            role="status"
            className={`mt-3 text-sm ${result.ok ? "text-emerald-300" : "text-red-300"}`}
          >
            {result.message}
          </p>
        )}
      </div>
    </section>
  );
}

```


---

## src/components/PageViewTracker.tsx

```tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics/track";
import type { AnalyticsEventName } from "@/lib/analytics/events";

/**
 * Fires page_view on every route change, plus an optional page-specific
 * event (product_view, guide_view, ...) passed by the page.
 */
export function PageViewTracker({
  storeSlug,
  extraEvent,
  extraPayload,
}: {
  storeSlug: string;
  extraEvent?: AnalyticsEventName;
  extraPayload?: Record<string, unknown>;
}) {
  const pathname = usePathname();

  useEffect(() => {
    track(storeSlug, "page_view", { path: pathname });
    if (extraEvent) {
      track(storeSlug, extraEvent, { path: pathname, ...extraPayload });
    }
    // extraPayload is intentionally not a dependency; it is stable per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeSlug, pathname, extraEvent]);

  return null;
}

```


---

## src/components/PolicyDisclosure.tsx

```tsx
import Link from "next/link";
import type { Store } from "@prisma/client";

/**
 * Dropshipping transparency block shown near buying decisions: who fulfills,
 * realistic delivery, how returns work, and how to reach support. Required
 * on product pages and the homepage by the platform's compliance rules.
 */
export function PolicyDisclosure({ store }: { store: Store }) {
  return (
    <aside
      aria-label="Shipping and returns disclosure"
      className="rounded-theme-lg border border-ink/10 bg-primary-soft p-5 text-sm leading-6 text-ink/80"
    >
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">
        Shipping &amp; returns, honestly
      </h3>
      <p className="mt-2">{store.shippingOriginDisclosure}</p>
      <p className="mt-2">
        Typical delivery: {store.defaultShippingDaysMin}–{store.defaultShippingDaysMax}{" "}
        business days. {store.returnPolicySummary}
      </p>
      <p className="mt-2 text-xs text-ink/60">
        Depending on your country, import taxes or duties may apply and are
        not included unless stated at checkout.
      </p>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
        <Link className="text-primary underline" href="/policies/shipping">
          Shipping policy
        </Link>
        <Link className="text-primary underline" href="/policies/returns">
          Returns policy
        </Link>
        <a className="text-primary underline" href={`mailto:${store.supportEmail}`}>
          {store.supportEmail}
        </a>
      </p>
    </aside>
  );
}

```


---

## src/components/PolicyPage.tsx

```tsx
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageViewTracker } from "@/components/PageViewTracker";
import { buildMetadata } from "@/lib/seo/metadata";
import { requireStore } from "@/lib/stores/queries";

/**
 * Shared renderer for the four policy pages. Policy text lives on the Store
 * record so every tenant publishes its own legally distinct copy; the
 * shipping page additionally renders the structured dropshipping disclosure
 * required by the platform's compliance rules.
 */

export type PolicyKind = "shipping" | "returns" | "privacy" | "terms";

const POLICY_TITLES: Record<PolicyKind, string> = {
  shipping: "Shipping policy",
  returns: "Returns policy",
  privacy: "Privacy policy",
  terms: "Terms of sale",
};

export async function buildPolicyMetadata(
  storeSlug: string,
  kind: PolicyKind
): Promise<Metadata> {
  const store = await requireStore(storeSlug);
  return buildMetadata({
    store,
    title: `${POLICY_TITLES[kind]} | ${store.name}`,
    description: `${POLICY_TITLES[kind]} for ${store.name}.`,
    path: `/policies/${kind}`,
  });
}

export async function PolicyPage({
  storeSlug,
  kind,
}: {
  storeSlug: string;
  kind: PolicyKind;
}) {
  const store = await requireStore(storeSlug);

  let body: string;
  switch (kind) {
    case "shipping":
      body = [
        store.shippingOriginDisclosure,
        `Typical delivery time is ${store.defaultShippingDaysMin}–${store.defaultShippingDaysMax} business days after order confirmation. Each product page shows the exact estimate for that item. You receive a tracking link by email as soon as the carrier scans your parcel.`,
        `Orders are fulfilled by third-party supplier partners; ${store.name} remains your contract partner and your single point of contact for any issue with delivery.`,
        `Depending on your country, import taxes or customs duties may apply on delivery and are not included in our prices unless explicitly stated at checkout.`,
        `If a parcel is significantly delayed beyond the stated window, contact ${store.supportEmail} and we will investigate with the carrier, and re-ship or refund where appropriate.`,
      ].join("\n\n");
      break;
    case "returns":
      body = [
        store.returnPolicySummary,
        `To start a return, email ${store.supportEmail} with your order reference. We reply with the return address and instructions within one business day. Because fulfillment is via supplier partners, the return address may be different from our business address — never return a parcel without instructions.`,
        `Refunds are issued to the original payment method within 14 days of the returned item passing inspection. Items must be unused and in original packaging unless the return is due to a defect or our error.`,
        `Products marked "final sale" on their product page are not returnable; this is always disclosed before purchase.`,
      ].join("\n\n");
      break;
    case "privacy":
      body = store.privacyPolicy;
      break;
    case "terms":
      body = store.termsOfSale;
      break;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <Breadcrumbs
        items={[{ name: "Home", href: "/" }, { name: POLICY_TITLES[kind] }]}
      />
      <h1 className="mt-4 text-3xl font-bold text-ink">{POLICY_TITLES[kind]}</h1>
      <p className="mt-2 text-sm text-ink/50">
        {store.legalName} · Contact: {store.supportEmail}
        {store.supportPhone ? ` · ${store.supportPhone}` : ""}
      </p>
      <div className="mt-6 space-y-4 text-base leading-7 text-ink/80">
        {body.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}

```


---

## src/components/PriceBlock.tsx

```tsx
import { formatCurrency } from "@/lib/pricing/calculate-price";
import { honestCompareAtPrice } from "@/lib/pricing/calculate-price";

/**
 * Price display. The compare-at price is run through honestCompareAtPrice so
 * implausible anchor discounts are never rendered.
 */
export function PriceBlock({
  price,
  compareAtPrice,
  currency,
  locale = "en-US",
  size = "md",
}: {
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  locale?: string;
  size?: "sm" | "md" | "lg";
}) {
  const compareAt = honestCompareAtPrice(price, compareAtPrice ?? null);
  const priceClass =
    size === "lg"
      ? "text-3xl font-bold"
      : size === "sm"
        ? "text-base font-semibold"
        : "text-xl font-bold";

  return (
    <p className="flex flex-wrap items-baseline gap-2">
      <span className={`${priceClass} text-ink`}>
        {formatCurrency(price, currency, locale)}
      </span>
      {compareAt !== null && (
        <>
          <s className="text-sm text-ink/50">
            {formatCurrency(compareAt, currency, locale)}
          </s>
          <span className="sr-only">
            , reduced from {formatCurrency(compareAt, currency, locale)}
          </span>
        </>
      )}
    </p>
  );
}

```


---

## src/components/ProductCard.tsx

```tsx
import Link from "next/link";
import type { Product } from "@prisma/client";
import { ProductCardCta } from "@/components/ProductCardCta";
import { PriceBlock } from "@/components/PriceBlock";
import { RatingDisplay } from "@/components/RatingDisplay";
import { toClientProduct } from "@/lib/stores/queries";
import { STOCK_STATUS_LABELS, isStockStatus } from "@/lib/types";

export function ProductCard({
  product,
  locale = "en-US",
}: {
  product: Product;
  locale?: string;
}) {
  const client = toClientProduct(product);
  const stockLabel = isStockStatus(product.stockStatus)
    ? STOCK_STATUS_LABELS[product.stockStatus]
    : product.stockStatus;

  return (
    <article className="card group flex h-full flex-col overflow-hidden">
      <Link href={`/p/${product.slug}`} className="relative block aspect-square overflow-hidden bg-ink/5">
        <img
          src={product.imageUrl}
          alt={product.imageAlt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        />
        {product.stockStatus !== "IN_STOCK" && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink">
            {stockLabel}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
            {product.brand}
          </p>
          <h3 className="mt-1 text-sm font-semibold leading-snug text-ink">
            <Link href={`/p/${product.slug}`} className="hover:text-primary">
              {product.title}
            </Link>
          </h3>
          {product.subtitle && (
            <p className="mt-1 line-clamp-2 text-xs text-ink/60">{product.subtitle}</p>
          )}
        </div>
        <RatingDisplay
          ratingAverage={product.ratingAverage}
          ratingCount={product.ratingCount}
        />
        <PriceBlock
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          currency={product.currency}
          locale={locale}
          size="sm"
        />
        <p className="text-xs text-ink/60">
          Ships in {product.shippingDaysMin}–{product.shippingDaysMax} business days
        </p>
        <ProductCardCta product={client} />
      </div>
    </article>
  );
}

```


---

## src/components/ProductCardCta.tsx

```tsx
"use client";

import { ProductCardActions } from "@/components/ProductPurchaseActions";
import { useCart } from "@/lib/cart/cart-context";
import type { ClientProduct } from "@/lib/types";

export function ProductCardCta({ product }: { product: ClientProduct }) {
  const cart = useCart();
  return <ProductCardActions product={product} storeSlug={cart.storeSlug} />;
}

```


---

## src/components/ProductGallery.tsx

```tsx
"use client";

import { useState } from "react";

/**
 * Product image gallery. The seed catalog ships one hero image per product;
 * additional angle shots slot into the same component when real supplier
 * imagery is connected.
 */
export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeImages = images.length > 0 ? images : ["/api/placeholder?label=No%20image"];
  const active = safeImages[Math.min(activeIndex, safeImages.length - 1)];

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-theme-lg border border-ink/10 bg-ink/5">
        <img src={active} alt={alt} className="h-full w-full object-cover" />
      </div>
      {safeImages.length > 1 && (
        <div className="mt-3 flex gap-2" role="tablist" aria-label="Product images">
          {safeImages.map((image, index) => (
            <button
              key={image}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show image ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-16 w-16 overflow-hidden rounded-theme border-2 ${
                index === activeIndex ? "border-primary" : "border-transparent"
              }`}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

```


---

## src/components/ProductGrid.tsx

```tsx
import type { Product } from "@prisma/client";
import { ProductCard } from "@/components/ProductCard";

export function ProductGrid({
  products,
  locale = "en-US",
  emptyMessage = "No products match your filters yet. Try widening them.",
}: {
  products: Product[];
  locale?: string;
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-10 text-center">
        <p className="text-base font-medium text-ink">Nothing here yet</p>
        <p className="max-w-sm text-sm text-ink/60">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} locale={locale} />
      ))}
    </div>
  );
}

```


---

## src/components/ProductPurchaseActions.tsx

```tsx
"use client";

import { useCart } from "@/lib/cart/cart-context";
import { track } from "@/lib/analytics/track";
import type { ClientProduct } from "@/lib/types";

export function ProductPurchaseActions({
  product,
  storeSlug,
  size = "md",
  fullWidth = false,
}: {
  product: ClientProduct;
  storeSlug: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
}) {
  const cart = useCart();
  const outOfStock = product.stockStatus === "OUT_OF_STOCK";
  const isAffiliate = product.fulfillmentMode === "AFFILIATE";

  if (isAffiliate) {
    if (!product.affiliateUrl) {
      return (
        <p className="text-sm text-ink/60">
          External purchase link pending supplier sync.
        </p>
      );
    }

    return (
      <a
        href={product.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`btn-primary inline-flex items-center justify-center ${size === "sm" ? "px-4 py-2 text-xs" : ""} ${fullWidth ? "w-full" : ""}`}
        onClick={() =>
          track(storeSlug, "affiliate_click", {
            productId: product.id,
            slug: product.slug,
            providerKey: product.providerKey,
          })
        }
      >
        View deal
      </a>
    );
  }

  if (!product.checkoutAvailable) {
    return (
      <p className="text-sm text-ink/60">
        This item is not sold through checkout. Contact support for availability.
      </p>
    );
  }

  function handleAdd() {
    cart.addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      currency: product.currency,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
      shippingDaysMin: product.shippingDaysMin,
      shippingDaysMax: product.shippingDaysMax,
    });
    track(storeSlug, "add_to_cart", {
      productId: product.id,
      slug: product.slug,
      price: product.price,
    });
  }

  return (
    <div className={fullWidth ? "w-full space-y-2" : "space-y-2"}>
      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        className={`btn-primary ${size === "sm" ? "px-4 py-2 text-xs" : ""} ${fullWidth ? "w-full" : ""}`}
        aria-label={
          outOfStock
            ? `${product.title} is out of stock`
            : `Add ${product.title} to cart`
        }
      >
        {outOfStock
          ? "Out of stock"
          : product.stockStatus === "PREORDER"
            ? "Pre-order"
            : "Add to cart"}
      </button>
      {product.countryOfOrigin && (
        <p className="text-xs text-ink/50">
          Ships from partner supplier
          {product.countryOfOrigin ? ` (${product.countryOfOrigin})` : ""}. Typical delivery{" "}
          {product.shippingDaysMin}–{product.shippingDaysMax} business days.
        </p>
      )}
    </div>
  );
}

/** Compact card CTA — affiliate products link out; others add to cart. */
export function ProductCardActions({
  product,
  storeSlug,
}: {
  product: ClientProduct;
  storeSlug: string;
}) {
  if (product.fulfillmentMode === "AFFILIATE" && product.affiliateUrl) {
    return (
      <a
        href={product.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="btn-primary w-full px-4 py-2 text-xs"
      >
        View deal
      </a>
    );
  }

  return <ProductPurchaseActions product={product} storeSlug={storeSlug} size="sm" fullWidth />;
}

```


---

## src/components/ProductQuiz.tsx

```tsx
"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { track } from "@/lib/analytics/track";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";
import { formatCurrency } from "@/lib/pricing/calculate-price";
import {
  recommendProducts,
  type QuizAnswerMap,
  type QuizQuestion,
} from "@/lib/quiz/quiz-config";
import { useCart } from "@/lib/cart/cart-context";
import type { ClientProduct } from "@/lib/types";

export function ProductQuiz({
  storeSlug,
  locale,
  questions,
  products,
}: {
  storeSlug: string;
  locale: string;
  questions: QuizQuestion[];
  products: ClientProduct[];
}) {
  const cart = useCart();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswerMap>({});
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [email, setEmail] = useState("");
  const [emailResult, setEmailResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const recommendations = useMemo(
    () => (finished ? recommendProducts(questions, answers, products) : []),
    [finished, questions, answers, products]
  );

  function selectOption(questionId: string, value: string) {
    if (!started) {
      setStarted(true);
      track(storeSlug, "quiz_start", {});
    }
    const nextAnswers = { ...answers, [questionId]: value };
    setAnswers(nextAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setFinished(true);
      track(storeSlug, "quiz_complete", { answers: nextAnswers });
    }
  }

  function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await subscribeToNewsletter({
        storeSlug,
        email,
        source: "quiz",
        preferences: { quizAnswers: answers },
      });
      setEmailResult(result.message);
      if (result.ok) setEmail("");
    });
  }

  if (finished) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-ink">Your matches</h2>
        <p className="mt-2 text-sm text-ink/70">
          Ranked by how well each product fits your answers and our internal
          product score. No sponsorships — just the best fit from our catalog.
        </p>

        {recommendations.length === 0 ? (
          <div className="card mt-6 p-8 text-center">
            <p className="font-medium text-ink">
              Nothing in the catalog fits those answers within budget.
            </p>
            <p className="mt-2 text-sm text-ink/60">
              Try the quiz again with a wider budget, or browse all products.
            </p>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {recommendations.map(({ product, matchedTags }, index) => (
              <li key={product.id} className="card flex gap-4 p-4">
                <img
                  src={product.imageUrl}
                  alt={product.imageAlt}
                  className="h-20 w-20 shrink-0 rounded-theme object-cover"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {index === 0 ? "Best match" : `Match #${index + 1}`}
                  </p>
                  <Link
                    href={`/p/${product.slug}`}
                    className="mt-0.5 block text-sm font-semibold text-ink hover:text-primary"
                  >
                    {product.title}
                  </Link>
                  <p className="mt-1 text-sm font-bold text-ink">
                    {formatCurrency(product.price, product.currency, locale)}
                  </p>
                  {matchedTags.length > 0 && (
                    <p className="mt-1 truncate text-xs text-ink/60">
                      Matches: {matchedTags.map((tag) => tag.replace(/-/g, " ")).join(", ")}
                    </p>
                  )}
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-primary underline"
                    onClick={() =>
                      cart.addItem({
                        productId: product.id,
                        slug: product.slug,
                        title: product.title,
                        price: product.price,
                        currency: product.currency,
                        imageUrl: product.imageUrl,
                        imageAlt: product.imageAlt,
                        shippingDaysMin: product.shippingDaysMin,
                        shippingDaysMax: product.shippingDaysMax,
                      })
                    }
                  >
                    Add to cart
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="card mt-8 p-6">
          <h3 className="text-base font-semibold text-ink">
            Email me these results (optional)
          </h3>
          <p className="mt-1 text-sm text-ink/60">
            We will send your matches and a reminder — nothing else unless you
            subscribe separately.
          </p>
          <form onSubmit={handleEmailSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="quiz-email" className="sr-only">
              Email address
            </label>
            <input
              id="quiz-email"
              type="email"
              required
              className="input flex-1"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
            <button type="submit" className="btn-secondary" disabled={isPending}>
              {isPending ? "Sending…" : "Send results"}
            </button>
          </form>
          {emailResult && (
            <p role="status" className="mt-2 text-sm text-ink/70">
              {emailResult}
            </p>
          )}
        </div>

        <button
          type="button"
          className="mt-6 text-sm font-medium text-primary underline"
          onClick={() => {
            setStep(0);
            setAnswers({});
            setFinished(false);
            setEmailResult(null);
          }}
        >
          Start over
        </button>
      </div>
    );
  }

  const question = questions[step];
  if (!question) return null;

  return (
    <div>
      <p className="text-sm font-medium text-ink/60" aria-live="polite">
        Question {step + 1} of {questions.length}
      </p>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={step}
        aria-label="Quiz progress"
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(step / questions.length) * 100}%` }}
        />
      </div>

      <h2 className="mt-6 text-2xl font-bold text-ink">{question.label}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => selectOption(question.id, option.value)}
            className="card p-5 text-left text-sm font-medium text-ink transition hover:border-primary hover:bg-primary-soft"
          >
            {option.label}
          </button>
        ))}
      </div>

      {step > 0 && (
        <button
          type="button"
          className="mt-5 text-sm font-medium text-ink/60 underline hover:text-primary"
          onClick={() => setStep(step - 1)}
        >
          ← Back
        </button>
      )}
    </div>
  );
}

```


---

## src/components/RatingDisplay.tsx

```tsx
/**
 * Rating display with a strict honesty contract: stars are only rendered
 * when real rating data exists. With no data we say so explicitly instead of
 * faking social proof.
 */
export function RatingDisplay({
  ratingAverage,
  ratingCount,
  showEmptyState = false,
}: {
  ratingAverage: number | null;
  ratingCount: number;
  showEmptyState?: boolean;
}) {
  if (ratingAverage === null || ratingCount <= 0) {
    if (!showEmptyState) return null;
    return (
      <p className="text-xs text-ink/50">
        No customer reviews yet — we only show ratings we have actually
        collected.
      </p>
    );
  }

  const rounded = Math.round(ratingAverage * 2) / 2;
  return (
    <p
      className="flex items-center gap-1.5 text-sm"
      aria-label={`Rated ${ratingAverage.toFixed(1)} out of 5 from ${ratingCount} reviews`}
    >
      <span aria-hidden="true" className="flex text-accent">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} viewBox="0 0 20 20" className="h-4 w-4" fill={star <= rounded ? "currentColor" : "none"} stroke="currentColor">
            <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z" />
          </svg>
        ))}
      </span>
      <span className="text-ink/70">
        {ratingAverage.toFixed(1)} ({ratingCount})
      </span>
    </p>
  );
}

```


---

## src/components/SearchBox.tsx

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBox({ placeholder = "Search products…" }: { placeholder?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative w-full max-w-xs">
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <input
        id="site-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="input pr-10"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-theme p-2 text-ink/50 hover:text-primary"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}

```


---

## src/components/ShippingEstimate.tsx

```tsx
/**
 * Honest shipping window display. Always shows the realistic supplier window
 * — never "ships today" — per the platform's transparency rules.
 */
export function ShippingEstimate({
  daysMin,
  daysMax,
  originNote,
  compact = false,
}: {
  daysMin: number;
  daysMax: number;
  originNote?: string | null;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "text-xs text-ink/70" : "text-sm text-ink/80"}>
      <p className="flex items-center gap-1.5">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M1 8h13v8H1zM14 11h4l3 3v2h-7z" strokeLinejoin="round" />
          <circle cx="6" cy="18" r="1.6" />
          <circle cx="17.5" cy="18" r="1.6" />
        </svg>
        <span>
          Delivery in <strong>{daysMin}–{daysMax} business days</strong>
        </span>
      </p>
      {!compact && originNote && (
        <p className="mt-1 text-xs text-ink/60">{originNote}</p>
      )}
    </div>
  );
}

```


---

## src/components/SortDropdown.tsx

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const SORT_OPTIONS = [
  { value: "score", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "shipping", label: "Fastest delivery" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "score";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "score") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-ink/60">
        Sort by
      </label>
      <select
        id="sort"
        className="input w-auto py-2"
        value={current}
        onChange={(event) => handleChange(event.target.value)}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

```


---

## src/components/StickyMobileCTA.tsx

```tsx
"use client";

import { ProductPurchaseActions } from "@/components/ProductPurchaseActions";
import { formatCurrency } from "@/lib/pricing/calculate-price";
import type { ClientProduct } from "@/lib/types";

/**
 * Mobile-only sticky add-to-cart bar for product pages: price + CTA stay
 * reachable while the shopper reads specs and FAQ.
 */
export function StickyMobileCTA({
  product,
  storeSlug,
  locale,
}: {
  product: ClientProduct;
  storeSlug: string;
  locale: string;
}) {
  const isAffiliate = product.fulfillmentMode === "AFFILIATE";

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-ink/60">{product.title}</p>
          <p className="text-base font-bold text-ink">
            {formatCurrency(product.price, product.currency, locale)}
          </p>
        </div>
        {!isAffiliate && product.checkoutAvailable && (
          <ProductPurchaseActions product={product} storeSlug={storeSlug} size="sm" />
        )}
        {isAffiliate && product.affiliateUrl && (
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="btn-primary shrink-0 px-4 py-2 text-xs"
          >
            View deal
          </a>
        )}
      </div>
    </div>
  );
}

```


---

## src/components/StoreFooter.tsx

```tsx
import Link from "next/link";
import type { Category, Store } from "@prisma/client";

export function StoreFooter({
  store,
  categories,
}: {
  store: Store;
  categories: Category[];
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-ink/10 bg-secondary text-white">
      <div className="mx-auto grid max-w-site gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-heading text-lg font-extrabold">{store.logoText}</p>
          <p className="mt-3 text-sm leading-6 text-white/70">
            {store.valueProposition}
          </p>
          <p className="mt-4 text-xs text-white/50">
            {store.legalName}
          </p>
        </div>

        <nav aria-label="Shop">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
            Shop
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={`/c/${category.slug}`} className="text-white/80 hover:text-white hover:underline">
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/compare" className="text-white/80 hover:text-white hover:underline">
                Compare top picks
              </Link>
            </li>
            <li>
              <Link href="/quiz" className="text-white/80 hover:text-white hover:underline">
                Product finder quiz
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Help and policies">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
            Help &amp; policies
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/guides" className="text-white/80 hover:text-white hover:underline">
                Buying guides
              </Link>
            </li>
            <li>
              <Link href="/policies/shipping" className="text-white/80 hover:text-white hover:underline">
                Shipping policy
              </Link>
            </li>
            <li>
              <Link href="/policies/returns" className="text-white/80 hover:text-white hover:underline">
                Returns policy
              </Link>
            </li>
            <li>
              <Link href="/policies/privacy" className="text-white/80 hover:text-white hover:underline">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/policies/terms" className="text-white/80 hover:text-white hover:underline">
                Terms of sale
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
            Support
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>
              <a href={`mailto:${store.supportEmail}`} className="hover:text-white hover:underline">
                {store.supportEmail}
              </a>
            </li>
            {store.supportPhone && <li>{store.supportPhone}</li>}
          </ul>
          <p className="mt-4 text-xs leading-5 text-white/50">
            {store.shippingOriginDisclosure}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-site px-4 py-4 text-xs text-white/50 sm:px-6">
          © {year} {store.legalName}. All prices in {store.currency}. Import
          taxes or duties may apply depending on your country.
        </p>
      </div>
    </footer>
  );
}

```


---

## src/components/StoreHeader.tsx

```tsx
import Link from "next/link";
import type { Category, Store } from "@prisma/client";
import { CartButton } from "@/components/CartButton";
import { SearchBox } from "@/components/SearchBox";

export function StoreHeader({
  store,
  categories,
}: {
  store: Store;
  categories: Category[];
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-site items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0" aria-label={`${store.name} home`}>
          <span className="font-heading text-xl font-extrabold tracking-tight text-primary">
            {store.logoText}
          </span>
        </Link>

        <nav aria-label="Categories" className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/c/${category.slug}`}
                  className="rounded-theme px-3 py-2 text-sm font-medium text-ink/75 transition hover:bg-primary-soft hover:text-primary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/guides"
                className="rounded-theme px-3 py-2 text-sm font-medium text-ink/75 transition hover:bg-primary-soft hover:text-primary"
              >
                Guides
              </Link>
            </li>
            <li>
              <Link
                href="/quiz"
                className="rounded-theme px-3 py-2 text-sm font-medium text-ink/75 transition hover:bg-primary-soft hover:text-primary"
              >
                Quiz
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <SearchBox />
          </div>
          <Link
            href="/search"
            className="rounded-theme p-2 text-ink/70 hover:bg-primary-soft hover:text-primary md:hidden"
            aria-label="Search"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </Link>
          <CartButton />
        </div>
      </div>

      {/* Mobile category strip */}
      <nav aria-label="Categories" className="border-t border-ink/5 lg:hidden">
        <ul className="flex gap-1 overflow-x-auto px-4 py-2">
          {categories.map((category) => (
            <li key={category.id} className="shrink-0">
              <Link
                href={`/c/${category.slug}`}
                className="rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/75 hover:border-primary hover:text-primary"
              >
                {category.name}
              </Link>
            </li>
          ))}
          <li className="shrink-0">
            <Link
              href="/guides"
              className="rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/75 hover:border-primary hover:text-primary"
            >
              Guides
            </Link>
          </li>
          <li className="shrink-0">
            <Link
              href="/quiz"
              className="rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/75 hover:border-primary hover:text-primary"
            >
              Quiz
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

```


---

## src/components/StructuredData.tsx

```tsx
/**
 * Renders one or more JSON-LD objects as script tags. Nulls are filtered so
 * callers can pass conditional builders (e.g. faqPageJsonLd) directly.
 */
export function StructuredData({
  data,
}: {
  data: Array<Record<string, unknown> | null>;
}) {
  const items = data.filter(
    (item): item is Record<string, unknown> => item !== null
  );
  if (items.length === 0) return null;
  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}

```


---

## src/components/TrustBar.tsx

```tsx
import type { Store } from "@prisma/client";

/**
 * Store-wide trust strip: real shipping window, returns summary and support
 * contact. Content comes straight from the store record so it can never
 * drift from the policies pages.
 */
export function TrustBar({ store }: { store: Store }) {
  const items = [
    {
      title: `${store.defaultShippingDaysMin}–${store.defaultShippingDaysMax} day delivery`,
      detail: "Realistic windows, tracked shipping",
    },
    {
      title: "Clear returns",
      detail: store.returnPolicySummary.split(".")[0],
    },
    {
      title: "Human support",
      detail: store.supportEmail,
    },
    {
      title: "Transparent fulfillment",
      detail: "We tell you exactly where orders ship from",
    },
  ];

  return (
    <section
      aria-label="Why shop with us"
      className="border-y border-ink/10 bg-white"
    >
      <div className="mx-auto grid max-w-site grid-cols-2 gap-4 px-4 py-5 sm:grid-cols-4 sm:px-6">
        {items.map((item) => (
          <div key={item.title} className="text-center sm:text-left">
            <p className="text-sm font-semibold text-ink">{item.title}</p>
            <p className="mt-0.5 truncate text-xs text-ink/60">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

```


---

## src/config/domain-map.ts

```ts
/**
 * Static hostname -> store slug map used by the edge middleware.
 *
 * The middleware runs on the edge runtime and cannot query the database, so
 * this map is the first (and fastest) resolution step. The Domain table in
 * the database is the source of truth for server-side resolution (sitemaps,
 * feeds) via src/lib/tenant/resolve-tenant.ts; keep both in sync when adding
 * a store. Replace the .example domains with real domains at launch.
 */

export const DEFAULT_STORE_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_STORE ?? "drones";

export const STORE_COOKIE = "msdf_store";

export const DOMAIN_MAP: Record<string, string> = {
  // ---- Seeded stores (live in the local database) ----
  "dronestore.example": "drones",
  "www.dronestore.example": "drones",
  "bambussmil.example": "bamboo-toothbrushes",
  "www.bambussmil.example": "bamboo-toothbrushes",
  "ergonomikontor.example": "ergonomic-office",
  "www.ergonomikontor.example": "ergonomic-office",
  "pelspleie.example": "pet-grooming",
  "www.pelspleie.example": "pet-grooming",
  "turklar.example": "hiking-gear",
  "www.turklar.example": "hiking-gear",

  // ---- Placeholder slots for future stores (up to ~40 domains). ----
  // Generate the store with /admin/generator, seed it, then point the slug
  // here. Slugs without a seeded store fall back to the 404 page.
  "espressohjem.example": "espresso-home",
  "kjokkenproff.example": "kitchen-pro",
  "babytrygg.example": "baby-safety",
  "sykkeldeler.example": "bike-parts",
  "yogarom.example": "yoga-room",
  "vinterlys.example": "winter-lighting",
  "hagedrom.example": "garden-dream",
  "kontorstol.example": "office-chairs",
  "lopesko.example": "running-shoes",
  "fiskelykke.example": "fishing-luck",
  "kattelek.example": "cat-toys",
  "hundeseng.example": "dog-beds",
  "soverom.example": "sleep-comfort",
  "badstue.example": "sauna-supply",
  "gamingrom.example": "gaming-room",
  "fotostudio.example": "photo-studio",
  "tegnesaker.example": "art-supplies",
  "strikkegarn.example": "knitting-yarn",
  "akvarium.example": "aquarium-life",
  "terrarium.example": "terrarium-world",
  "droneproff.example": "drones-pro",
  "elsparkesykkel.example": "e-scooters",
  "campingmat.example": "camp-kitchen",
  "klatregrep.example": "climbing-gear",
  "padlebrett.example": "paddle-boards",
  "skiutstyr.example": "ski-equipment",
  "barnerom.example": "kids-room",
  "smartlys.example": "smart-lighting",
  "verktoykasse.example": "tool-box",
  "grillmester.example": "bbq-master",
  "kaffebar.example": "coffee-bar",
  "tehjorne.example": "tea-corner",
  "massasje.example": "massage-recovery",
  "reiseutstyr.example": "travel-gear",
  "musikkrom.example": "music-room",
};

export function resolveStoreSlugFromHost(hostname: string): string | null {
  const host = hostname.toLowerCase().split(":")[0];
  return DOMAIN_MAP[host] ?? null;
}

```


---

## src/lib/actions/admin-image.ts

```ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";

export interface ImageActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Keep Product.imageUrl/imageAlt mirroring the primary ProductImage so product
 * cards, JSON-LD and the Merchant feed stay correct without each consumer
 * needing to know about the gallery. Guarantees exactly one primary image.
 */
async function syncPrimaryImage(productId: string): Promise<void> {
  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  if (images.length === 0) return;

  let primary = images.find((image) => image.isPrimary);
  if (!primary) {
    primary = images[0];
    await prisma.productImage.update({
      where: { id: primary.id },
      data: { isPrimary: true },
    });
  }

  await prisma.product.update({
    where: { id: productId },
    data: { imageUrl: primary.url, imageAlt: primary.alt },
  });
}

/** Verify the image belongs to a product in the named store; returns productId. */
async function authorizeImage(
  imageId: string,
  storeSlug: string
): Promise<string | null> {
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    include: { product: { select: { storeId: true, store: { select: { slug: true } } } } },
  });
  if (!image || image.product.store.slug !== storeSlug) return null;
  return image.productId;
}

function revalidateStore(storeSlug: string): void {
  revalidatePath(`/s/${storeSlug}`, "layout");
}

export async function addProductImageAction(input: {
  productId: string;
  storeSlug: string;
  url: string;
  alt: string;
}): Promise<ImageActionResult> {
  await requireAdmin();

  const product = await prisma.product.findFirst({
    where: { id: input.productId, store: { slug: input.storeSlug } },
    select: { id: true },
  });
  if (!product) return { ok: false, error: "Product not found." };
  if (!input.url) return { ok: false, error: "Missing image URL." };

  const count = await prisma.productImage.count({ where: { productId: product.id } });
  await prisma.productImage.create({
    data: {
      productId: product.id,
      url: input.url,
      alt: input.alt,
      sortOrder: count,
      isPrimary: count === 0,
    },
  });

  await syncPrimaryImage(product.id);
  revalidateStore(input.storeSlug);
  return { ok: true };
}

export async function updateProductImageAltAction(input: {
  imageId: string;
  storeSlug: string;
  alt: string;
}): Promise<ImageActionResult> {
  await requireAdmin();
  const productId = await authorizeImage(input.imageId, input.storeSlug);
  if (!productId) return { ok: false, error: "Image not found." };

  await prisma.productImage.update({
    where: { id: input.imageId },
    data: { alt: input.alt },
  });
  await syncPrimaryImage(productId);
  revalidateStore(input.storeSlug);
  return { ok: true };
}

export async function setPrimaryProductImageAction(input: {
  imageId: string;
  storeSlug: string;
}): Promise<ImageActionResult> {
  await requireAdmin();
  const productId = await authorizeImage(input.imageId, input.storeSlug);
  if (!productId) return { ok: false, error: "Image not found." };

  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({
      where: { id: input.imageId },
      data: { isPrimary: true },
    }),
  ]);
  await syncPrimaryImage(productId);
  revalidateStore(input.storeSlug);
  return { ok: true };
}

export async function deleteProductImageAction(input: {
  imageId: string;
  storeSlug: string;
}): Promise<ImageActionResult> {
  await requireAdmin();
  const productId = await authorizeImage(input.imageId, input.storeSlug);
  if (!productId) return { ok: false, error: "Image not found." };

  await prisma.productImage.delete({ where: { id: input.imageId } });

  // Re-pack sortOrder so reordering stays predictable.
  const remaining = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  await prisma.$transaction(
    remaining.map((image, index) =>
      prisma.productImage.update({ where: { id: image.id }, data: { sortOrder: index } })
    )
  );

  await syncPrimaryImage(productId);
  revalidateStore(input.storeSlug);
  return { ok: true };
}

export async function moveProductImageAction(input: {
  imageId: string;
  storeSlug: string;
  direction: "up" | "down";
}): Promise<ImageActionResult> {
  await requireAdmin();
  const productId = await authorizeImage(input.imageId, input.storeSlug);
  if (!productId) return { ok: false, error: "Image not found." };

  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  const index = images.findIndex((image) => image.id === input.imageId);
  const swapWith = input.direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= images.length) {
    return { ok: true }; // already at the edge — no-op
  }

  const a = images[index];
  const b = images[swapWith];
  await prisma.$transaction([
    prisma.productImage.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.productImage.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);

  await syncPrimaryImage(productId);
  revalidateStore(input.storeSlug);
  return { ok: true };
}

```


---

## src/lib/actions/admin-import.ts

```ts
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  approveCandidate,
  discoverProductsForStore,
  importApprovedCandidates,
  rejectCandidate,
} from "@/lib/catalog/candidate-service";
import { prisma } from "@/lib/db";
import { toJson } from "@/lib/utils/json";

export async function runDiscoveryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const storeId = String(formData.get("storeId") ?? "");
  const providerKey = String(formData.get("providerKey") ?? "mock");
  const query = String(formData.get("query") ?? "").trim();
  const categoryIdRaw = String(formData.get("categoryId") ?? "");

  if (!storeId || !query) return;

  const run = await prisma.catalogSyncRun.create({
    data: {
      storeId,
      providerKey,
      requestedBy: "admin",
      summaryJson: toJson({ query }),
    },
  });

  try {
    const summary = await discoverProductsForStore({
      storeId,
      providerKey,
      query,
      categoryId: categoryIdRaw || undefined,
      limit: 12,
    });
    await prisma.catalogSyncRun.update({
      where: { id: run.id },
      data: {
        status: summary.errors.length > 0 ? "PARTIAL" : "SUCCESS",
        finishedAt: new Date(),
        summaryJson: toJson({ query, ...summary }),
        errorMessage: summary.errors.join(" "),
      },
    });
  } catch (error) {
    await prisma.catalogSyncRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown discovery error",
      },
    });
  }

  revalidatePath("/admin/import");
}

export async function approveCandidateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const candidateId = String(formData.get("candidateId") ?? "");
  if (candidateId) await approveCandidate(candidateId);
  revalidatePath("/admin/import");
}

export async function rejectCandidateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const candidateId = String(formData.get("candidateId") ?? "");
  const reason = String(formData.get("reason") ?? "Rejected by admin.");
  if (candidateId) await rejectCandidate(candidateId, reason);
  revalidatePath("/admin/import");
}

export async function importApprovedCandidatesAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const storeId = String(formData.get("storeId") ?? "");
  if (storeId) {
    await importApprovedCandidates(storeId, 20);
  }
  revalidatePath("/admin/import");
}


```


---

## src/lib/actions/admin-product.ts

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { calculateGrossMargin } from "@/lib/monetization/margin";
import { computeProductScore } from "@/lib/products/product-score";
import { stockStatusSchema } from "@/lib/validation/schemas";
import { isStockStatus } from "@/lib/types";
import { toJson } from "@/lib/utils/json";
import {
  getBoolean,
  getFaqPairs,
  getLines,
  getNumber,
  getOptionalString,
  getPipePairs,
  getString,
} from "@/lib/actions/form";
import type { AdminActionState } from "@/lib/actions/admin-store";

const productUpdateSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(3, "Title is required"),
  subtitle: z.string(),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().min(1).max(300),
  brand: z.string().min(1),
  sku: z.string().min(1),
  gtin: z.string().nullable(),
  imageUrl: z.string().min(1, "Image URL is required"),
  imageAlt: z.string(),
  price: z.number().positive("Price must be positive"),
  compareAtPrice: z.number().positive().nullable(),
  cost: z.number().positive("Cost must be positive"),
  shippingCost: z.number().min(0),
  stockStatus: stockStatusSchema,
  supplierName: z.string().min(1),
  supplierProductId: z.string().min(1),
  shippingDaysMin: z.number().int().min(1),
  shippingDaysMax: z.number().int().min(1),
  countryOfOrigin: z.string().nullable(),
  materials: z.string().nullable(),
  warranty: z.string().nullable(),
  returnable: z.boolean(),
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),
  canonicalUrl: z.string().nullable(),
  isPublished: z.boolean(),
  noindex: z.boolean(),
});

export async function updateProductAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const productId = getString(formData, "productId");
  const storeSlug = getString(formData, "storeSlug");
  if (!productId || !storeSlug) {
    return { ok: false, error: "Missing product identifier." };
  }

  const rawStock = getString(formData, "stockStatus");
  const parsed = productUpdateSchema.safeParse({
    categoryId: getString(formData, "categoryId"),
    title: getString(formData, "title"),
    subtitle: getString(formData, "subtitle"),
    description: getString(formData, "description"),
    shortDescription: getString(formData, "shortDescription"),
    brand: getString(formData, "brand"),
    sku: getString(formData, "sku"),
    gtin: getOptionalString(formData, "gtin"),
    imageUrl: getString(formData, "imageUrl"),
    imageAlt: getString(formData, "imageAlt"),
    price: getNumber(formData, "price"),
    compareAtPrice: formData.get("compareAtPrice")
      ? getNumber(formData, "compareAtPrice")
      : null,
    cost: getNumber(formData, "cost"),
    shippingCost: getNumber(formData, "shippingCost"),
    stockStatus: isStockStatus(rawStock) ? rawStock : "IN_STOCK",
    supplierName: getString(formData, "supplierName"),
    supplierProductId: getString(formData, "supplierProductId"),
    shippingDaysMin: getNumber(formData, "shippingDaysMin", 5),
    shippingDaysMax: getNumber(formData, "shippingDaysMax", 12),
    countryOfOrigin: getOptionalString(formData, "countryOfOrigin"),
    materials: getOptionalString(formData, "materials"),
    warranty: getOptionalString(formData, "warranty"),
    returnable: getBoolean(formData, "returnable"),
    seoTitle: getString(formData, "seoTitle"),
    seoDescription: getString(formData, "seoDescription"),
    canonicalUrl: getOptionalString(formData, "canonicalUrl"),
    isPublished: getBoolean(formData, "isPublished"),
    noindex: getBoolean(formData, "noindex"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid product data." };
  }
  const data = parsed.data;

  if (data.shippingDaysMax < data.shippingDaysMin) {
    return { ok: false, error: "Shipping days max must be ≥ shipping days min." };
  }

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) {
    return { ok: false, error: "Product not found." };
  }

  // Ensure the supplied category belongs to the same store (no cross-tenant leak).
  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, storeId: existing.storeId },
  });
  if (!category) {
    return { ok: false, error: "Selected category does not belong to this store." };
  }

  // Structured content fields (line / pipe editors).
  const pros = getLines(formData, "pros");
  const cons = getLines(formData, "cons");
  const useCases = getLines(formData, "useCases");
  const specs = getPipePairs(formData, "specs");
  const faq = getFaqPairs(formData, "faq");

  // Recompute margin + score with the same libraries the seed uses.
  const margin = calculateGrossMargin({
    price: data.price,
    cost: data.cost,
    shippingCost: data.shippingCost,
  });

  const supplier = await prisma.supplier.findUnique({
    where: { name: data.supplierName },
  });
  const supplierReliability = supplier?.reliabilityScore ?? 0.8;

  const productScore = computeProductScore({
    marginPercent: margin.grossMarginPercent,
    shippingDaysMin: data.shippingDaysMin,
    shippingDaysMax: data.shippingDaysMax,
    supplierReliability,
    stockStatus: data.stockStatus,
    returnRiskRate: data.returnable ? 0.04 : 0.01,
    content: {
      descriptionLength: data.description.length,
      prosCount: pros.length,
      consCount: cons.length,
      specsCount: specs.length,
      faqCount: faq.length,
      useCasesCount: useCases.length,
      hasImageAlt: data.imageAlt.trim().length > 0,
    },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      ...data,
      currency: existing.currency,
      marginPercent: margin.grossMarginPercent,
      productScore,
      pros: toJson(pros),
      cons: toJson(cons),
      specs: toJson(specs),
      useCases: toJson(useCases),
      faq: toJson(faq),
    },
  });

  revalidatePath(`/s/${storeSlug}`, "layout");
  revalidatePath(`/admin/stores/${storeSlug}/products`);
  revalidatePath("/admin/products");

  return {
    ok: true,
    error: null,
    message: `Saved. Margin ${margin.grossMarginPercent.toFixed(1)}% · score ${productScore.toFixed(0)}.`,
  };
}

```


---

## src/lib/actions/admin-store.ts

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getBoolean,
  getCsv,
  getLines,
  getNumber,
  getOptionalString,
  getString,
} from "@/lib/actions/form";
import {
  serializeStoreSettings,
  storeSettingsSchema,
  type StoreSettings,
} from "@/lib/settings/store-settings";

export interface AdminActionState {
  ok: boolean;
  error: string | null;
  message?: string;
}

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a #rrggbb hex color");

const storeUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  legalName: z.string().min(1, "Legal name is required"),
  primaryDomain: z.string().min(1, "Primary domain is required"),
  locale: z.string().min(2),
  currency: z.string().min(3).max(3),
  niche: z.string().min(1),
  positioning: z.string().min(1),
  audience: z.string().min(1),
  valueProposition: z.string().min(1),
  brandVoice: z.string().min(1),
  logoText: z.string().min(1),
  supportEmail: z.string().email("Enter a valid support email"),
  supportPhone: z.string().nullable(),
  shippingOriginDisclosure: z.string().min(1),
  defaultShippingDaysMin: z.number().int().min(1),
  defaultShippingDaysMax: z.number().int().min(1),
  returnPolicySummary: z.string().min(1),
  privacyPolicy: z.string().min(1),
  termsOfSale: z.string().min(1),
  isActive: z.boolean(),
});

const themeUpdateSchema = z.object({
  primaryColor: hexColor,
  secondaryColor: hexColor,
  accentColor: hexColor,
  backgroundColor: hexColor,
  textColor: hexColor,
  borderRadius: z.string().min(1),
  fontHeading: z.string().min(1),
  fontBody: z.string().min(1),
});

function readStoreSettingsForm(formData: FormData): StoreSettings {
  const raw = {
    seo: {
      defaultOgImage: getString(formData, "s_seo_defaultOgImage"),
      googleSiteVerification: getString(formData, "s_seo_googleSiteVerification"),
      robotsExtraDisallow: getLines(formData, "s_seo_robotsExtraDisallow"),
      hreflangLocales: getCsv(formData, "s_seo_hreflangLocales"),
    },
    homepage: {
      heroVariant: getString(formData, "s_home_heroVariant"),
      featuredCollectionSlug: getString(formData, "s_home_featuredCollectionSlug"),
      showQuizCta: getBoolean(formData, "s_home_showQuizCta"),
      showComparisonCta: getBoolean(formData, "s_home_showComparisonCta"),
      trustBarItems: getLines(formData, "s_home_trustBarItems"),
    },
    monetization: {
      targetMarginPercent: getNumber(formData, "s_mon_targetMarginPercent", 35),
      minMarginPercent: getNumber(formData, "s_mon_minMarginPercent", 15),
      enableCompareAtPrice: getBoolean(formData, "s_mon_enableCompareAtPrice"),
      bundleDiscountPercent: getNumber(formData, "s_mon_bundleDiscountPercent", 8),
      subscriptionSkus: getCsv(formData, "s_mon_subscriptionSkus"),
    },
    marketing: {
      metaPixelId: getString(formData, "s_mkt_metaPixelId"),
      googleAdsId: getString(formData, "s_mkt_googleAdsId"),
      utmDefaultSource: getString(formData, "s_mkt_utmDefaultSource"),
    },
    personalization: {
      enabled: getBoolean(formData, "s_per_enabled"),
      quizWeight: getNumber(formData, "s_per_quizWeight", 2),
      browseHistoryWeight: getNumber(formData, "s_per_browseHistoryWeight", 1),
    },
    automation: {
      autoPublishMinScore: getNumber(formData, "s_auto_autoPublishMinScore", 70),
      autoNoindexBelowScore: getNumber(formData, "s_auto_autoNoindexBelowScore", 40),
      importDefaultSupplier: getString(formData, "s_auto_importDefaultSupplier"),
      importKeywords: getCsv(formData, "s_auto_importKeywords"),
    },
    compliance: {
      showDropshipDisclosure: getBoolean(formData, "s_comp_showDropshipDisclosure"),
      importTaxDisclaimer: getString(formData, "s_comp_importTaxDisclaimer"),
      cookiePolicyUrl: getString(formData, "s_comp_cookiePolicyUrl"),
    },
  };
  // storeSettingsSchema fills any blank/invalid field with its default.
  return storeSettingsSchema.parse(raw);
}

export async function updateStoreAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const slug = getString(formData, "slug");
  if (!slug) return { ok: false, error: "Missing store identifier." };

  const storeParsed = storeUpdateSchema.safeParse({
    name: getString(formData, "name"),
    legalName: getString(formData, "legalName"),
    primaryDomain: getString(formData, "primaryDomain"),
    locale: getString(formData, "locale"),
    currency: getString(formData, "currency").toUpperCase(),
    niche: getString(formData, "niche"),
    positioning: getString(formData, "positioning"),
    audience: getString(formData, "audience"),
    valueProposition: getString(formData, "valueProposition"),
    brandVoice: getString(formData, "brandVoice"),
    logoText: getString(formData, "logoText"),
    supportEmail: getString(formData, "supportEmail"),
    supportPhone: getOptionalString(formData, "supportPhone"),
    shippingOriginDisclosure: getString(formData, "shippingOriginDisclosure"),
    defaultShippingDaysMin: getNumber(formData, "defaultShippingDaysMin", 5),
    defaultShippingDaysMax: getNumber(formData, "defaultShippingDaysMax", 12),
    returnPolicySummary: getString(formData, "returnPolicySummary"),
    privacyPolicy: getString(formData, "privacyPolicy"),
    termsOfSale: getString(formData, "termsOfSale"),
    isActive: getBoolean(formData, "isActive"),
  });
  if (!storeParsed.success) {
    return { ok: false, error: storeParsed.error.issues[0]?.message ?? "Invalid store data." };
  }

  const themeParsed = themeUpdateSchema.safeParse({
    primaryColor: getString(formData, "primaryColor"),
    secondaryColor: getString(formData, "secondaryColor"),
    accentColor: getString(formData, "accentColor"),
    backgroundColor: getString(formData, "backgroundColor"),
    textColor: getString(formData, "textColor"),
    borderRadius: getString(formData, "borderRadius"),
    fontHeading: getString(formData, "fontHeading"),
    fontBody: getString(formData, "fontBody"),
  });
  if (!themeParsed.success) {
    return { ok: false, error: themeParsed.error.issues[0]?.message ?? "Invalid theme data." };
  }

  if (storeParsed.data.defaultShippingDaysMax < storeParsed.data.defaultShippingDaysMin) {
    return { ok: false, error: "Shipping days max must be ≥ shipping days min." };
  }

  const settings = readStoreSettingsForm(formData);

  // Hostnames: one per line; the one matching primaryDomain is flagged primary.
  const hostnames = Array.from(
    new Set(
      [storeParsed.data.primaryDomain, ...getLines(formData, "domains")].map((host) =>
        host.toLowerCase()
      )
    )
  );

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) return { ok: false, error: "Store not found." };

  // Guard against stealing a domain already mapped to another store.
  const conflict = await prisma.domain.findFirst({
    where: { hostname: { in: hostnames }, storeId: { not: store.id } },
  });
  if (conflict) {
    return { ok: false, error: `Domain ${conflict.hostname} is already used by another store.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.store.update({
      where: { id: store.id },
      data: {
        ...storeParsed.data,
        theme: {
          upsert: {
            create: themeParsed.data,
            update: themeParsed.data,
          },
        },
        settings: {
          upsert: {
            create: { settings: serializeStoreSettings(settings) },
            update: { settings: serializeStoreSettings(settings) },
          },
        },
      },
    });

    await tx.domain.deleteMany({ where: { storeId: store.id } });
    await tx.domain.createMany({
      data: hostnames.map((hostname) => ({
        storeId: store.id,
        hostname,
        isPrimary: hostname === storeParsed.data.primaryDomain.toLowerCase(),
      })),
    });
  });

  revalidatePath(`/s/${slug}`, "layout");
  revalidatePath("/admin/stores");
  revalidatePath(`/admin/stores/${slug}/edit`);

  return { ok: true, error: null, message: "Store saved." };
}

```


---

## src/lib/actions/admin.ts

```ts
"use server";

import { redirect } from "next/navigation";
import { loginAdmin, logoutAdmin } from "@/lib/admin/auth";

export async function adminLoginAction(
  _previousState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const password = ***REDACTED***"password") ?? "");
  const ok = await loginAdmin(password);
  if (!ok) {
    return { error: "Wrong password." };
  }
  redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
  await logoutAdmin();
  redirect("/admin/login");
}

```


---

## src/lib/actions/checkout.ts

```ts
"use server";

import { prisma } from "@/lib/db";
import { persistOrderFromCheckout } from "@/lib/orders/persist-order";
import { prepareCheckout } from "@/lib/orders/prepare-checkout";
import { routeOrder } from "@/lib/orders/route-order";
import { isMockCheckoutEnabled } from "@/lib/payments/stripe-client";
import { toJson } from "@/lib/utils/json";

export interface CheckoutResult {
  ok: boolean;
  orderRef?: string;
  orderId?: string;
  total?: number;
  currency?: string;
  message: string;
  fieldErrors?: Record<string, string>;
  clientSecret?: string;
  publishableKey?: string;
  useStripe?: boolean;
}

/**
 * Mock checkout path (MOCK_CHECKOUT=true): validates, persists Order + Customer,
 * routes fulfillment, records analytics. Stripe checkout uses
 * /api/checkout/create-payment-intent instead.
 */
export async function placeOrder(input: unknown): Promise<CheckoutResult> {
  if (!isMockCheckoutEnabled()) {
    return {
      ok: false,
      message: "Mock checkout is disabled. Complete payment with Stripe on this page.",
      useStripe: true,
    };
  }

  const prepared = await prepareCheckout(input);
  if (!prepared.ok) {
    return {
      ok: false,
      message: prepared.message,
      fieldErrors: prepared.fieldErrors,
    };
  }

  const checkout = prepared.checkout;
  const { order } = await persistOrderFromCheckout(prisma, checkout, {
    paymentProvider: "mock",
    paymentStatus: "AUTHORIZED",
    orderStatus: "CONFIRMED",
  });

  const routed = await routeOrder(order.id);
  if (!routed.ok) {
    return {
      ok: false,
      orderRef: order.orderNumber,
      orderId: order.id,
      message: routed.error ?? "Fulfillment failed for this order.",
    };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: "CAPTURED" },
  });

  await prisma.cartEvent.create({
    data: {
      storeId: checkout.storeId,
      sessionId: "server",
      eventName: "checkout_success",
      payload: toJson({
        orderRef: order.orderNumber,
        orderId: order.id,
        subtotal: checkout.subtotal,
        shipping: checkout.shippingTotal,
        total: checkout.grandTotal,
        currency: checkout.currency,
        itemCount: checkout.lines.reduce((sum, line) => sum + line.quantity, 0),
        paymentProvider: "mock",
      }),
    },
  });

  return {
    ok: true,
    orderRef: order.orderNumber,
    orderId: order.id,
    total: checkout.grandTotal,
    currency: checkout.currency,
    message: "Order placed successfully.",
  };
}

```


---

## src/lib/actions/form.ts

```ts
import type { FaqItem, SpecItem } from "@/lib/types";

/**
 * Small helpers for reading admin FormData in server actions. They normalise
 * the loosely-typed FormData values into the shapes our Zod schemas expect.
 */

export function getString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function getOptionalString(formData: FormData, key: string): string | null {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

export function getNumber(formData: FormData, key: string, fallback = 0): number {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

/** Unchecked checkboxes are absent from FormData entirely. */
export function getBoolean(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

/** Split a textarea into trimmed, non-empty lines. */
export function getLines(formData: FormData, key: string): string[] {
  return getString(formData, key)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Split a comma-separated input into trimmed, non-empty values. */
export function getCsv(formData: FormData, key: string): string[] {
  return getString(formData, key)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/** Parse "label | value" lines into SpecItem[]. */
export function getPipePairs(formData: FormData, key: string): SpecItem[] {
  return getLines(formData, key)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: label.trim(), value: rest.join("|").trim() };
    })
    .filter((item) => item.label && item.value);
}

/** Parse "question | answer" lines into FaqItem[]. */
export function getFaqPairs(formData: FormData, key: string): FaqItem[] {
  return getLines(formData, key)
    .map((line) => {
      const [question, ...rest] = line.split("|");
      return { question: question.trim(), answer: rest.join("|").trim() };
    })
    .filter((item) => item.question && item.answer);
}

```


---

## src/lib/actions/generator.ts

```ts
"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import {
  generateProductCopy,
  generateStoreBlueprint,
  storeBlueprintInputSchema,
  type BlueprintResult,
  type ProductCopyResult,
} from "@/lib/ai/store-blueprint";
import { prisma } from "@/lib/db";
import {
  createStoreFromBlueprint,
  type CreateStoreFromBlueprintResult,
} from "@/lib/stores/create-from-blueprint";

export interface GeneratorActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function generateBlueprintAction(
  input: unknown
): Promise<GeneratorActionResult<BlueprintResult>> {
  try {
    await requireAdmin();
    const data = await generateStoreBlueprint(input);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
    }
    console.error("blueprint generation failed", error);
    return { ok: false, error: "Generation failed. Check the server logs." };
  }
}

export async function generateProductCopyAction(
  input: unknown
): Promise<GeneratorActionResult<ProductCopyResult>> {
  try {
    await requireAdmin();
    const data = await generateProductCopy(input);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
    }
    console.error("product copy generation failed", error);
    return { ok: false, error: "Generation failed. Check the server logs." };
  }
}

export async function createStoreFromBlueprintAction(options: {
  blueprintInput: unknown;
  importProducts?: boolean;
  autoPublishScored?: boolean;
}): Promise<GeneratorActionResult<CreateStoreFromBlueprintResult>> {
  try {
    await requireAdmin();
    const input = storeBlueprintInputSchema.parse(options.blueprintInput);
    const { blueprint, guardrails } = await generateStoreBlueprint(input);

    if (!guardrails.passed) {
      return {
        ok: false,
        error:
          "Blueprint blocked by content guardrails. Fix the flagged issues or adjust your niche copy, then try again.",
      };
    }

    const result = await createStoreFromBlueprint({
      blueprint,
      input,
      importProducts: options.importProducts ?? true,
      autoPublishScored: options.autoPublishScored ?? true,
    });

    revalidatePath("/admin/stores");
    revalidatePath("/admin/products");
    revalidatePath("/admin/generator");
    revalidatePath(`/s/${result.storeSlug}`, "layout");

    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
    }
    console.error("create store from blueprint failed", error);
    const message = error instanceof Error ? error.message : "Create failed.";
    return { ok: false, error: message };
  }
}

export async function markStoreLiveAction(
  slug: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return { ok: false, error: "Store not found." };
    if (!store.plannedDomain && !store.primaryDomain.includes(".")) {
      return { ok: false, error: "Set a planned domain before going live." };
    }

    await prisma.store.update({
      where: { id: store.id },
      data: {
        launchStatus: "LIVE",
        primaryDomain: store.plannedDomain ?? store.primaryDomain,
      },
    });

    revalidatePath("/admin/stores");
    revalidatePath(`/admin/stores/${slug}/edit`);
    revalidatePath(`/s/${slug}`, "layout");
    return { ok: true };
  } catch (error) {
    console.error("mark store live failed", error);
    return { ok: false, error: "Could not update launch status." };
  }
}

```


---

## src/lib/actions/newsletter.ts

```ts
"use server";

import { prisma } from "@/lib/db";
import { newsletterSchema } from "@/lib/validation/schemas";
import { toJson } from "@/lib/utils/json";

export interface NewsletterResult {
  ok: boolean;
  message: string;
}

export async function subscribeToNewsletter(
  input: unknown
): Promise<NewsletterResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const store = await prisma.store.findUnique({
    where: { slug: parsed.data.storeSlug },
  });
  if (!store) {
    return { ok: false, message: "Unknown store" };
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: {
        storeId_email: { storeId: store.id, email: parsed.data.email.toLowerCase() },
      },
      create: {
        storeId: store.id,
        email: parsed.data.email.toLowerCase(),
        source: parsed.data.source,
        preferences: parsed.data.preferences
          ? toJson(parsed.data.preferences)
          : null,
      },
      update: { source: parsed.data.source },
    });

    await prisma.cartEvent.create({
      data: {
        storeId: store.id,
        sessionId: "server",
        eventName: "newsletter_signup",
        payload: toJson({ source: parsed.data.source }),
      },
    });

    return { ok: true, message: "You're on the list. We email rarely and usefully." };
  } catch (error) {
    console.error("newsletter subscription failed", error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

```


---

## src/lib/admin/auth.ts

```ts
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Minimal admin protection for local/staging use: a session cookie holding a
 * salted hash of ADMIN_PASSWORD. Replace with a real auth provider before
 * exposing /admin on the public internet.
 */

const COOKIE_NAME = "msdf_admin";

function expectedToken(): string {
  const password = ***REDACTED***"changeme";
  return createHash("sha256").update(`msdf-admin:${password}`).digest("hex");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === expectedToken();
}

/** Call at the top of every admin page. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function loginAdmin(password: ***REDACTED***
  if (password !== (process.env.ADMIN_PASSWORD ?? "changeme")) {
    return false;
  }
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return true;
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

```


---

## src/lib/admin/commerce-dashboard.ts

```ts
import { prisma } from "@/lib/db";
import { getCommerceProviders } from "@/lib/suppliers/providers/registry";
import type { ProviderHealth } from "@/lib/suppliers/providers/types";

export interface AdminProviderRow {
  key: string;
  name: string;
  health: ProviderHealth;
  enabledStores: number;
  lastSync: string | null;
  orderApiStatus: string;
}

export async function getAdminProviderDashboard(): Promise<AdminProviderRow[]> {
  const providers = getCommerceProviders();
  const storeSettings = await prisma.storeSupplierSettings.findMany({
    where: { isEnabled: true },
    select: { providerKey: true, storeId: true, fulfillmentMode: true },
  });

  const syncRuns = await prisma.catalogSyncRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 100,
    select: { providerKey: true, startedAt: true, status: true },
  });

  const rows: AdminProviderRow[] = [];
  for (const provider of providers) {
    const health = await provider.getHealth();
    const enabledStores = new Set(
      storeSettings.filter((setting) => setting.providerKey === provider.key).map((s) => s.storeId)
    ).size;
    const lastRun = syncRuns.find((run) => run.providerKey === provider.key);

    let orderApiStatus = "Not supported";
    if (health.capabilities.checkout && provider.createDropshipOrder) {
      orderApiStatus = health.status === "OK" ? "Ready" : "Configured but unhealthy";
    } else if (provider.key === "cj") {
      orderApiStatus =
        process.env.CJ_ORDER_API_ENABLED === "true"
          ? "Enabled flag set, missing health/config"
          : "Disabled until CJ_ORDER_API_ENABLED=true";
    } else if (provider.key === "doba") {
      orderApiStatus = "Scaffold only";
    }

    rows.push({
      key: provider.key,
      name: provider.name,
      health,
      enabledStores,
      lastSync: lastRun?.startedAt.toISOString() ?? null,
      orderApiStatus,
    });
  }

  return rows;
}

export async function getAdminOrders(limit = 50) {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      store: { select: { slug: true, name: true } },
      customer: { select: { email: true, name: true } },
      supplierOrders: true,
      items: { select: { titleSnapshot: true, quantity: true, status: true, fulfillmentMode: true } },
    },
  });
}

```


---

## src/lib/ai/content-guardrails.ts

```ts
/**
 * Content guardrails.
 *
 * Every piece of generated (or imported) content is screened before it can
 * be published. The guardrails enforce the platform's honesty rules:
 * no fake reviews, no fabricated claims, no implied local stock when
 * fulfillment is from a remote supplier, mandatory shipping/return
 * transparency, and a minimum quality bar (thin/duplicate content gets a
 * noindex recommendation instead of polluting the index).
 */

export type GuardrailSeverity = "BLOCK" | "WARN" | "INFO";

export interface GuardrailFlag {
  rule: string;
  severity: GuardrailSeverity;
  message: string;
}

export interface GuardrailReport {
  passed: boolean;
  recommendNoindex: boolean;
  flags: GuardrailFlag[];
}

const FAKE_REVIEW_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:out of\s*5|\/\s*5)\s*stars?\b/i,
  /\bthousands of (?:5|five)[- ]star reviews\b/i,
  /\bour customers rate (?:us|it)\b/i,
  /\bverified reviews?\b/i,
];

const FAKE_CLAIM_PATTERNS = [
  /\b(?:clinically|scientifically|lab)[- ]proven\b/i,
  /\bguaranteed to (?:cure|fix|eliminate)\b/i,
  /\b#1 (?:best[- ]?seller|rated)\b/i,
  /\bdoctor[- ]recommended\b/i,
  /\baward[- ]winning\b/i,
];

const LOCAL_STOCK_PATTERNS = [
  /\bships? (?:today|same[- ]day) from our (?:local )?warehouse\b/i,
  /\bin stock locally\b/i,
  /\blocal (?:stock|inventory|warehouse)\b/i,
  /\bdispatched from our store\b/i,
];

const SCARCITY_PATTERNS = [
  /\bonly \d+ left\b/i,
  /\bselling out fast\b/i,
  /\bhurry[,!]? (?:before|while)\b/i,
  /\boffer ends (?:tonight|today|soon)\b/i,
];

const THIN_CONTENT_MIN_WORDS = 120;

export interface ContentCheckInput {
  text: string;
  /** Pages from the same store to compare against for near-duplicates. */
  siblingTexts?: string[];
  /** Whether the surrounding page already shows shipping transparency. */
  pageShowsShippingDisclosure?: boolean;
  /** Whether the surrounding page already links/states the return policy. */
  pageShowsReturnPolicy?: boolean;
}

export function checkContent(input: ContentCheckInput): GuardrailReport {
  const flags: GuardrailFlag[] = [];
  const text = input.text;

  for (const pattern of FAKE_REVIEW_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({
        rule: "no-fake-reviews",
        severity: "BLOCK",
        message: `Review-like claim detected (${pattern}). Reviews may only come from real collected data.`,
      });
    }
  }

  for (const pattern of FAKE_CLAIM_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({
        rule: "no-unverifiable-claims",
        severity: "BLOCK",
        message: `Unverifiable claim detected (${pattern}). Remove or substantiate with a citable source.`,
      });
    }
  }

  for (const pattern of LOCAL_STOCK_PATTERNS) {
    if (pattern.test(text) && !isNegatedLocalStockMention(text)) {
      flags.push({
        rule: "no-implied-local-stock",
        severity: "BLOCK",
        message:
          "Copy implies local stock. Fulfillment is via third-party suppliers; use the store's shipping disclosure instead.",
      });
    }
  }

  for (const pattern of SCARCITY_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({
        rule: "no-fake-scarcity",
        severity: "BLOCK",
        message: "Fake-scarcity pattern detected. Remove urgency copy that is not backed by real inventory data.",
      });
    }
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < THIN_CONTENT_MIN_WORDS) {
    flags.push({
      rule: "thin-content",
      severity: "WARN",
      message: `Only ${wordCount} words (minimum ${THIN_CONTENT_MIN_WORDS}). Recommend noindex until expanded.`,
    });
  }

  if (input.siblingTexts && input.siblingTexts.length > 0) {
    for (const sibling of input.siblingTexts) {
      const similarity = jaccardSimilarity(text, sibling);
      if (similarity > 0.7) {
        flags.push({
          rule: "duplicate-ish-content",
          severity: "WARN",
          message: `Content is ${(similarity * 100).toFixed(0)}% similar to an existing page. Rewrite with a unique, store-specific angle or noindex.`,
        });
        break;
      }
    }
  }

  if (input.pageShowsShippingDisclosure === false) {
    flags.push({
      rule: "shipping-transparency",
      severity: "WARN",
      message: "Page does not show a shipping disclosure. Add realistic delivery windows and fulfillment origin.",
    });
  }

  if (input.pageShowsReturnPolicy === false) {
    flags.push({
      rule: "return-transparency",
      severity: "WARN",
      message: "Page does not surface the return policy. Link or summarize it near the buying decision.",
    });
  }

  const hasBlocker = flags.some((flag) => flag.severity === "BLOCK");
  const recommendNoindex = flags.some(
    (flag) => flag.rule === "thin-content" || flag.rule === "duplicate-ish-content"
  );

  return { passed: !hasBlocker, recommendNoindex, flags };
}

/** Allow honest disclosures like "we do not claim local stock". */
function isNegatedLocalStockMention(text: string): boolean {
  return /\b(?:never|not|don't|do not|without|instead of)\b[^.]{0,60}\blocal stock\b/i.test(
    text
  );
}

/** Cheap shingle-based similarity for duplicate-ish detection. */
function jaccardSimilarity(a: string, b: string): number {
  const shinglesA = shingles(a);
  const shinglesB = shingles(b);
  if (shinglesA.size === 0 || shinglesB.size === 0) return 0;
  let intersection = 0;
  for (const shingle of shinglesA) {
    if (shinglesB.has(shingle)) intersection += 1;
  }
  return intersection / (shinglesA.size + shinglesB.size - intersection);
}

function shingles(text: string, size = 3): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const result = new Set<string>();
  for (let i = 0; i <= words.length - size; i++) {
    result.add(words.slice(i, i + size).join(" "));
  }
  return result;
}

```


---

## src/lib/ai/mock-ai-provider.ts

```ts
import type {
  AiProvider,
  CategoryPlan,
  CategoryPlanInput,
  GuideOutline,
  GuideOutlineInput,
  ProductCopy,
  ProductCopyInput,
  StoreBlueprint,
  StoreBlueprintInput,
} from "@/lib/ai/types";

/**
 * Deterministic mock AI provider. Produces structured, guardrail-compliant
 * output from templates + a seeded hash, so the admin generator works fully
 * offline. Replace via getAiProvider() in store-blueprint.ts when wiring a
 * real LLM.
 */

const PALETTES: StoreBlueprint["themeColors"][] = [
  { primary: "#0f766e", secondary: "#134e4a", accent: "#f59e0b", background: "#fafaf9", text: "#1c1917" },
  { primary: "#1d4ed8", secondary: "#1e293b", accent: "#06b6d4", background: "#f8fafc", text: "#0f172a" },
  { primary: "#9d174d", secondary: "#4c0519", accent: "#fb923c", background: "#fff7f5", text: "#27141a" },
  { primary: "#3f6212", secondary: "#1a2e05", accent: "#eab308", background: "#f7fee7", text: "#1a2e05" },
  { primary: "#7c3aed", secondary: "#2e1065", accent: "#10b981", background: "#faf5ff", text: "#1e1b4b" },
  { primary: "#b45309", secondary: "#451a03", accent: "#0ea5e9", background: "#fffbeb", text: "#292524" },
];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value: string): string {
  return value
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export class MockAiProvider implements AiProvider {
  readonly name = "mock-deterministic";

  async generateStoreBlueprint(
    input: StoreBlueprintInput
  ): Promise<StoreBlueprint> {
    const domainKey = input.domain ?? input.niche;
    const seed = hash(domainKey + input.niche);
    const nicheTitle = titleCase(input.niche);
    const brandName = `${nicheTitle.split(" ")[0]} ${["Haven", "Hub", "Studio", "Works", "Atelier", "Supply"][seed % 6]}`;
    const keywords = input.productKeywords.length > 0 ? input.productKeywords : [input.niche];

    return {
      storeSlug: slugify(input.niche),
      brandName,
      tagline: `${nicheTitle} chosen for ${input.audience}, explained honestly.`,
      categories: keywords.slice(0, 4).map((keyword) => ({
        slug: slugify(keyword),
        name: titleCase(keyword),
        description: `Curated ${keyword} picks for ${input.audience}, compared on real specs, shipping time and value.`,
      })),
      homepageSections: [
        "Hero with niche value proposition",
        "Trust bar (shipping window, returns, support)",
        "Featured categories",
        "Top products by product score",
        "How-to-choose guide block",
        "Product finder quiz CTA",
        "Comparison CTA",
        "Newsletter capture",
        "FAQ",
        "Shipping & returns disclosure",
      ],
      seoTitle: `${brandName} — ${nicheTitle} for ${input.audience}`,
      seoDescription: `Compare ${input.niche} on specs, shipping time and price. Honest pros and cons, transparent supplier shipping, ${input.country} support.`,
      guideIdeas: [
        `How to choose ${input.niche}: a practical buyer's guide`,
        `${nicheTitle} under $100: what you actually get`,
        `Beginner mistakes to avoid when buying ${input.niche}`,
        `${nicheTitle} comparison: budget vs. premium`,
        `How long does ${input.niche} shipping really take?`,
        `${nicheTitle} care and maintenance basics`,
        `Which ${input.niche} fits ${input.audience}?`,
        `${nicheTitle} specs decoded: what matters and what is marketing`,
        `Gift guide: ${input.niche} for every budget`,
        `Sustainability and ${input.niche}: what to look for`,
      ],
      faqIdeas: [
        "How long does delivery take?",
        "Where do products ship from?",
        "What is the return policy?",
        "Do prices include taxes and import fees?",
        "How do I track my order?",
        "What happens if my item arrives damaged?",
        "Do you offer warranties?",
        "How do I choose between models?",
        "Can I cancel or change my order?",
        "How do I contact support?",
      ],
      productImportQueries: keywords.map((keyword) => `${keyword} best sellers`),
      themeColors: PALETTES[seed % PALETTES.length],
      trustCopy: [
        `Every product at ${brandName} is reviewed against our quality checklist before it appears in the catalog.`,
        `We compare specs, realistic shipping windows, return terms and margin sustainability — not hype.`,
        `Orders ship from vetted partner suppliers; delivery estimates on each product page reflect typical transit, not marketing promises.`,
        `Support replies within one business day at the email on our policies pages.`,
        `We do not publish star ratings until verified customer reviews exist.`,
      ].join(" "),
      shippingDisclosure: `Orders are fulfilled by partner suppliers and typically arrive within a realistic window for ${input.country}. Fulfillment is remote — we publish honest delivery estimates instead of implying same-day dispatch from a warehouse we do not operate.`,
      monetizationIdeas: [
        "Bundle complementary accessories at a small discount",
        "Subscription for consumable refills where applicable",
        "Email flows: quiz result follow-up, guide digests",
        "Affiliate fallback links for low-margin hero products",
        "Premium support / extended warranty upsell",
      ],
      qualityChecklist: [
        "Shipping window stated on every product page",
        "Return policy linked near every add-to-cart",
        "No review markup without real review data",
        "Category pages have 3+ published products or noindex",
        "Each guide answers the query in the first 120 words",
        "All images have descriptive alt text",
        "Margin >= 25% or affiliate fallback configured",
        "Supplier reliability >= 0.7 for featured products",
      ],
    };
  }

  async generateCategoryPlan(input: CategoryPlanInput): Promise<CategoryPlan> {
    const keywords = input.keywords.length > 0 ? input.keywords : [input.niche];
    return {
      categories: keywords.slice(0, 5).map((keyword) => ({
        slug: slugify(keyword),
        name: titleCase(keyword),
        description: `${titleCase(keyword)} selected for ${input.audience}: compared on real specs, shipping speed and price-to-value.`,
        seoTitle: `Best ${titleCase(keyword)} for ${input.audience}`,
        targetQueries: [
          `best ${keyword}`,
          `${keyword} for ${input.audience}`,
          `${keyword} buying guide`,
        ],
      })),
    };
  }

  async generateBuyingGuideOutline(
    input: GuideOutlineInput
  ): Promise<GuideOutline> {
    return {
      title: `${titleCase(input.topic)}: A Practical Guide for ${titleCase(input.audience)}`,
      slug: slugify(input.topic),
      directAnswer: `The short answer: match the ${input.niche} to your actual use case and budget first, then compare the two or three models that fit. This guide shows exactly how.`,
      sections: [
        { heading: "The short answer", points: ["Direct recommendation up front", "Who should buy what"] },
        { heading: "What actually matters", points: ["3-5 decision criteria", "Specs that are marketing noise"] },
        { heading: "Best for each use case", points: ["Budget pick", "Best overall", "Premium pick"] },
        { heading: "Comparison table", points: ["Side-by-side specs from the catalog"] },
        { heading: "Shipping and returns", points: ["Realistic delivery windows", "Return process"] },
        { heading: "FAQ", points: ["4-6 real buyer questions"] },
      ],
      faqIdeas: [
        `How much should I spend on ${input.niche}?`,
        `What is the most common mistake when buying ${input.niche}?`,
        "How long does shipping take?",
        "Can I return it if it does not fit my needs?",
      ],
    };
  }

  async generateProductCopy(input: ProductCopyInput): Promise<ProductCopy> {
    const specLine = input.specs
      .slice(0, 3)
      .map((spec) => `${spec.label}: ${spec.value}`)
      .join(", ");

    return {
      title: input.productTitle,
      subtitle: `Built for ${input.audience}`,
      shortDescription: `${input.productTitle} for ${input.audience}. Key specs — ${specLine || "see full table below"}. Ships in ${input.shippingDaysMin}-${input.shippingDaysMax} business days from our partner supplier.`,
      description: [
        `${input.productTitle} is selected for ${input.audience} in the ${input.niche} niche. We list it because the spec-to-price ratio holds up against alternatives we compared, not because of hype.`,
        specLine ? `Key specifications: ${specLine}.` : "",
        `Like everything in this store, it ships from a partner supplier with a realistic ${input.shippingDaysMin}-${input.shippingDaysMax} business day delivery window — we publish the real estimate instead of promising next-day delivery we cannot guarantee.`,
        `If it is not right for you, the standard return policy applies; the process is described on the returns page.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      pros: [
        "Strong spec-to-price ratio in its class",
        "Clear, published shipping window",
        "Covered by the standard return policy",
      ],
      cons: [
        `Ships from a partner supplier (${input.shippingDaysMin}-${input.shippingDaysMax} business days), not locally`,
        "Not the premium option if budget is unlimited",
      ],
      useCases: ["everyday", input.audience.toLowerCase().split(" ")[0] || "general"],
      faq: [
        {
          question: "How long does delivery take?",
          answer: `Typically ${input.shippingDaysMin}-${input.shippingDaysMax} business days. The order confirmation includes tracking as soon as the supplier hands the parcel to the carrier.`,
        },
        {
          question: "Can I return it?",
          answer: "Yes — the standard return policy applies. See the returns page for the exact window and process.",
        },
      ],
      seoTitle: `${input.productTitle} — Specs, Price & Honest Review-Free Assessment`,
      seoDescription: `${input.productTitle} for ${input.audience}: real specs, transparent ${input.shippingDaysMin}-${input.shippingDaysMax} day shipping, honest pros and cons.`,
    };
  }
}

export const mockAiProvider = new MockAiProvider();

```


---

## src/lib/ai/store-blueprint.ts

```ts
import { z } from "zod";
import { checkContent, type GuardrailReport } from "@/lib/ai/content-guardrails";
import { mockAiProvider } from "@/lib/ai/mock-ai-provider";
import type {
  AiProvider,
  CategoryPlan,
  CategoryPlanInput,
  GuideOutline,
  GuideOutlineInput,
  ProductCopy,
  ProductCopyInput,
  StoreBlueprint,
  StoreBlueprintInput,
} from "@/lib/ai/types";

/**
 * Store blueprint orchestration: validates input with Zod, calls the active
 * AI provider, then runs guardrails over the generated copy. The admin
 * generator consumes this; persisting a blueprint to the database is a
 * deliberate future step (the output shape already matches the seed format).
 */

export function getAiProvider(): AiProvider {
  // Swap in a real LLM-backed provider here (e.g. OpenAiProvider) once an
  // API key is configured. All output still flows through the guardrails.
  return mockAiProvider;
}

export const storeBlueprintInputSchema = z.object({
  domain: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  niche: z.string().min(3, "Describe the niche, e.g. 'espresso gear'"),
  audience: z.string().min(3, "Describe the audience, e.g. 'home baristas'"),
  productKeywords: z
    .union([
      z.array(z.string().min(2)).max(10),
      z.string().transform((value) =>
        value
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean)
          .slice(0, 10)
      ),
    ])
    .default([]),
  brandVoice: z.string().min(3).default("clear, honest, practical"),
  locale: z.string().min(2).default("en-US"),
  country: z.string().min(2).default("United States"),
}).superRefine((data, ctx) => {
  if (data.domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(data.domain)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a bare domain like 'example.com' or leave empty for test-only preview",
      path: ["domain"],
    });
  }
});

export type ValidatedBlueprintInput = z.infer<typeof storeBlueprintInputSchema>;

export interface BlueprintResult {
  blueprint: StoreBlueprint;
  guardrails: GuardrailReport;
}

export async function generateStoreBlueprint(
  rawInput: unknown
): Promise<BlueprintResult> {
  const input: StoreBlueprintInput = storeBlueprintInputSchema.parse(rawInput);
  const provider = getAiProvider();
  const blueprint = await provider.generateStoreBlueprint(input);

  const guardrails = checkContent({
    text: [
      blueprint.tagline,
      blueprint.seoDescription,
      blueprint.trustCopy,
      blueprint.shippingDisclosure,
      ...blueprint.categories.map((category) => category.description),
    ].join("\n"),
    pageShowsShippingDisclosure: blueprint.shippingDisclosure.length > 0,
    pageShowsReturnPolicy: true,
  });

  return { blueprint, guardrails };
}

export async function generateCategoryPlan(
  input: CategoryPlanInput
): Promise<CategoryPlan> {
  return getAiProvider().generateCategoryPlan(input);
}

export async function generateBuyingGuideOutline(
  input: GuideOutlineInput
): Promise<GuideOutline> {
  return getAiProvider().generateBuyingGuideOutline(input);
}

export const productCopyInputSchema = z.object({
  productTitle: z.string().min(3),
  niche: z.string().min(2),
  audience: z.string().min(2),
  brandVoice: z.string().min(2).default("clear, honest, practical"),
  specs: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .default([]),
  shippingDaysMin: z.coerce.number().int().min(1).default(5),
  shippingDaysMax: z.coerce.number().int().min(1).default(12),
});

export interface ProductCopyResult {
  copy: ProductCopy;
  guardrails: GuardrailReport;
}

export async function generateProductCopy(
  rawInput: unknown
): Promise<ProductCopyResult> {
  const input: ProductCopyInput = productCopyInputSchema.parse(rawInput);
  const copy = await getAiProvider().generateProductCopy(input);

  const guardrails = checkContent({
    text: [copy.description, copy.shortDescription, ...copy.pros, ...copy.cons].join("\n"),
    pageShowsShippingDisclosure: true,
    pageShowsReturnPolicy: true,
  });

  return { copy, guardrails };
}

```


---

## src/lib/ai/types.ts

```ts
/**
 * AI content generation contracts. The default implementation is a
 * deterministic mock (mock-ai-provider.ts); a real LLM-backed provider can be
 * dropped in by implementing AiProvider and switching getAiProvider().
 * All provider output must pass content-guardrails.ts before publication.
 */

export interface StoreBlueprintInput {
  /** Planned production domain. Optional — preview works without one. */
  domain?: string;
  niche: string;
  audience: string;
  productKeywords: string[];
  brandVoice: string;
  locale: string;
  country: string;
}

export interface StoreBlueprint {
  storeSlug: string;
  brandName: string;
  tagline: string;
  categories: { slug: string; name: string; description: string }[];
  homepageSections: string[];
  seoTitle: string;
  seoDescription: string;
  guideIdeas: string[];
  faqIdeas: string[];
  productImportQueries: string[];
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  trustCopy: string;
  shippingDisclosure: string;
  monetizationIdeas: string[];
  qualityChecklist: string[];
}

export interface CategoryPlanInput {
  niche: string;
  audience: string;
  keywords: string[];
}

export interface CategoryPlan {
  categories: {
    slug: string;
    name: string;
    description: string;
    seoTitle: string;
    targetQueries: string[];
  }[];
}

export interface GuideOutlineInput {
  niche: string;
  topic: string;
  audience: string;
}

export interface GuideOutline {
  title: string;
  slug: string;
  directAnswer: string;
  sections: { heading: string; points: string[] }[];
  faqIdeas: string[];
}

export interface ProductCopyInput {
  productTitle: string;
  niche: string;
  audience: string;
  brandVoice: string;
  specs: { label: string; value: string }[];
  shippingDaysMin: number;
  shippingDaysMax: number;
}

export interface ProductCopy {
  title: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  pros: string[];
  cons: string[];
  useCases: string[];
  faq: { question: string; answer: string }[];
  seoTitle: string;
  seoDescription: string;
}

export interface AiProvider {
  readonly name: string;
  generateStoreBlueprint(input: StoreBlueprintInput): Promise<StoreBlueprint>;
  generateCategoryPlan(input: CategoryPlanInput): Promise<CategoryPlan>;
  generateBuyingGuideOutline(input: GuideOutlineInput): Promise<GuideOutline>;
  generateProductCopy(input: ProductCopyInput): Promise<ProductCopy>;
}

```


---

## src/lib/analytics/events.ts

```ts
/**
 * Analytics event taxonomy. Keep this list as the single source of truth so
 * event names stay consistent across client tracking, server actions and the
 * CartEvent table.
 */

export const ANALYTICS_EVENTS = [
  "page_view",
  "product_view",
  "add_to_cart",
  "affiliate_click",
  "begin_checkout",
  "checkout_success",
  "quiz_start",
  "quiz_complete",
  "newsletter_signup",
  "guide_view",
  "merchant_feed_view",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export function isAnalyticsEvent(value: string): value is AnalyticsEventName {
  return (ANALYTICS_EVENTS as readonly string[]).includes(value);
}

export interface AnalyticsEvent {
  storeSlug: string;
  eventName: AnalyticsEventName;
  sessionId: string;
  payload?: Record<string, unknown>;
}

```


---

## src/lib/analytics/track.ts

```ts
"use client";

import type { AnalyticsEventName } from "@/lib/analytics/events";
import { getCookieConsent } from "@/lib/consent";

/**
 * Client-side tracking. Events are logged to the console in development and
 * POSTed to /api/track, which persists them as CartEvent rows.
 *
 * Consent rules: page_view and commerce funnel events are first-party,
 * cookieless analytics (necessary for operating the shop). Anything that
 * would feed marketing tools must check `analytics` consent first — the
 * gate below blocks all network tracking until the visitor has decided,
 * keeping the default behavior conservative.
 */

const SESSION_KEY = "msdf_session";

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let sessionId = window.sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function track(
  storeSlug: string,
  eventName: AnalyticsEventName,
  payload: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;

  const event = {
    storeSlug,
    eventName,
    sessionId: getSessionId(),
    payload,
  };

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.info("[analytics]", eventName, event);
  }

  const consent = getCookieConsent();
  if (consent?.analytics !== true) {
    // Visitor declined (or hasn't decided): keep the event local only.
    return;
  }

  const body = JSON.stringify(event);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
  } else {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* tracking must never break the storefront */
    });
  }
}

```


---

## src/lib/cart/cart-context.tsx

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Local cart state, persisted per store in localStorage. Prices shown in the
 * cart are display values; the checkout server action re-reads authoritative
 * prices from the database before "charging".
 */

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  imageAlt: string;
  shippingDaysMin: number;
  shippingDaysMax: number;
  quantity: number;
}

interface CartContextValue {
  storeSlug: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  currency: string;
  isDrawerOpen: boolean;
  isHydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  storeSlug,
  currency,
  children,
}: {
  storeSlug: string;
  currency: string;
  children: ReactNode;
}) {
  const storageKey = `msdf_cart_${storeSlug}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* corrupted cart -> start fresh */
    }
    setIsHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      /* storage full/unavailable: cart stays in memory */
    }
  }, [items, isHydrated, storageKey]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((current) => {
        const existing = current.find((entry) => entry.productId === item.productId);
        if (existing) {
          return current.map((entry) =>
            entry.productId === item.productId
              ? { ...entry, quantity: Math.min(entry.quantity + quantity, 99) }
              : entry
          );
        }
        return [...current, { ...item, quantity }];
      });
      setIsDrawerOpen(true);
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((entry) => entry.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((entry) => entry.productId !== productId)
        : current.map((entry) =>
            entry.productId === productId
              ? { ...entry, quantity: Math.min(quantity, 99) }
              : entry
          )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce(
      (sum, entry) => sum + entry.price * entry.quantity,
      0
    );
    const itemCount = items.reduce((sum, entry) => sum + entry.quantity, 0);
    return {
      storeSlug,
      items,
      itemCount,
      subtotal,
      currency,
      isDrawerOpen,
      isHydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openDrawer,
      closeDrawer,
    };
  }, [
    storeSlug,
    items,
    currency,
    isDrawerOpen,
    isHydrated,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openDrawer,
    closeDrawer,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

/** Flat-rate shipping estimate; mirrors the server-side checkout logic. */
export function estimateShippingCost(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= 50 ? 0 : 5.95;
}

```


---

## src/lib/catalog/candidate-service.ts

```ts
import { prisma } from "@/lib/db";
import { ingestProductMedia } from "@/lib/media/ingest-product-media";
import { syncProductGallery } from "@/lib/media/sync-product-gallery";
import { calculatePrice } from "@/lib/pricing/calculate-price";
import { evaluateCandidateQuality } from "@/lib/catalog/quality-gates";
import { getCommerceProvider, syncProviderRegistryToDb } from "@/lib/suppliers/providers/registry";
import type { ProductSearchResult, ProviderKey, SupplierMedia } from "@/lib/suppliers/providers/types";
import { scoreCandidate } from "@/lib/suppliers/catalog/score-candidate";
import { toJson } from "@/lib/utils/json";

export interface DiscoverProductsForStoreInput {
  storeId: string;
  providerKey: ProviderKey | string;
  query: string;
  categoryId?: string;
  limit?: number;
}

export interface DiscoverProductsForStoreResult {
  discovered: number;
  enriched: number;
  rejected: number;
  errors: string[];
}

export async function discoverProductsForStore(
  input: DiscoverProductsForStoreInput
): Promise<DiscoverProductsForStoreResult> {
  await syncProviderRegistryToDb();
  const store = await prisma.store.findUnique({ where: { id: input.storeId } });
  if (!store) throw new Error(`Unknown store: ${input.storeId}`);

  const provider = getCommerceProvider(input.providerKey);
  const providerRecord = await prisma.supplierProvider.findUnique({ where: { key: provider.key } });
  const settings = await prisma.storeSupplierSettings.findUnique({
    where: { storeId_providerKey: { storeId: store.id, providerKey: provider.key } },
  });

  const results = await provider.searchProducts({
    query: input.query,
    storeId: store.id,
    categoryId: input.categoryId,
    locale: store.locale,
    currency: store.currency,
    limit: input.limit ?? 12,
  });

  const existingProducts = await prisma.product.findMany({
    where: { storeId: store.id },
    select: { title: true },
    take: 500,
  });

  const summary: DiscoverProductsForStoreResult = {
    discovered: results.length,
    enriched: 0,
    rejected: 0,
    errors: [],
  };

  for (const result of results) {
    try {
      const candidate = await upsertCandidateFromResult({
        storeId: store.id,
        categoryId: input.categoryId,
        providerKey: provider.key,
        result,
        providerReliability: providerRecord?.reliabilityScore ?? 0.75,
        existingTitles: existingProducts.map((product) => product.title),
        minScore: settings?.minProductScore ?? 50,
        minMarginPercent: settings?.minMarginPercent ?? 25,
      });

      if (candidate.status === "ENRICHED") summary.enriched += 1;
      if (candidate.status === "REJECTED") summary.rejected += 1;

      if (result.media.length > 0) {
        await ingestProductMedia({
          candidateId: candidate.id,
          providerKey: provider.key,
          externalId: result.externalId,
          title: result.title,
          media: result.media,
        });
      }
    } catch (error) {
      summary.errors.push(error instanceof Error ? error.message : "Unknown candidate error");
    }
  }

  return summary;
}

export async function upsertCandidateFromResult(input: {
  storeId: string;
  categoryId?: string;
  providerKey: ProviderKey;
  result: ProductSearchResult;
  providerReliability: number;
  existingTitles?: string[];
  minScore?: number;
  minMarginPercent?: number;
}) {
  const scored = scoreCandidate({
    result: input.result,
    providerReliability: input.providerReliability,
    existingTitles: input.existingTitles,
  });
  const quality = evaluateCandidateQuality({
    title: input.result.title,
    description: input.result.description,
    sourceUrl: input.result.sourceUrl,
    externalId: input.result.externalId,
    shippingDaysMin: input.result.shippingDaysMin,
    shippingDaysMax: input.result.shippingDaysMax,
    mediaCount: input.result.media.filter((media) => media.mediaType === "IMAGE").length,
    score: scored.score,
    minScore: input.minScore,
    marginPercent: scored.marginPercent,
    minMarginPercent: input.minMarginPercent,
  });

  return prisma.productCandidate.upsert({
    where: {
      storeId_providerKey_externalId: {
        storeId: input.storeId,
        providerKey: input.providerKey,
        externalId: input.result.externalId,
      },
    },
    update: {
      categoryId: input.categoryId,
      sourceUrl: input.result.sourceUrl,
      affiliateUrl: input.result.affiliateUrl,
      titleRaw: input.result.title,
      descriptionRaw: input.result.description,
      brandRaw: input.result.brand,
      priceRaw: input.result.price,
      currencyRaw: input.result.currency,
      supplierCost: input.result.supplierCost,
      shippingCost: input.result.shippingCost,
      marginPercent: scored.marginPercent,
      stockStatus: input.result.stockStatus,
      shippingDaysMin: input.result.shippingDaysMin,
      shippingDaysMax: input.result.shippingDaysMax,
      countryOfOrigin: input.result.countryOfOrigin,
      gtin: input.result.gtin,
      skuCandidate: input.result.sku,
      specsJson: toJson(input.result.specs),
      variantsJson: toJson(input.result.variants),
      mediaJson: toJson(input.result.media),
      signalsJson: toJson({ ...scored.signals, raw: input.result.rawData }),
      riskJson: toJson(quality.risk),
      score: scored.score,
      status: quality.status,
      rejectionReason: quality.reasons.join(" "),
      lastSeenAt: new Date(),
    },
    create: {
      storeId: input.storeId,
      categoryId: input.categoryId,
      providerKey: input.providerKey,
      externalId: input.result.externalId,
      sourceUrl: input.result.sourceUrl,
      affiliateUrl: input.result.affiliateUrl,
      titleRaw: input.result.title,
      descriptionRaw: input.result.description,
      brandRaw: input.result.brand,
      priceRaw: input.result.price,
      currencyRaw: input.result.currency,
      supplierCost: input.result.supplierCost,
      shippingCost: input.result.shippingCost,
      marginPercent: scored.marginPercent,
      stockStatus: input.result.stockStatus,
      shippingDaysMin: input.result.shippingDaysMin,
      shippingDaysMax: input.result.shippingDaysMax,
      countryOfOrigin: input.result.countryOfOrigin,
      gtin: input.result.gtin,
      skuCandidate: input.result.sku,
      specsJson: toJson(input.result.specs),
      variantsJson: toJson(input.result.variants),
      mediaJson: toJson(input.result.media),
      signalsJson: toJson({ ...scored.signals, raw: input.result.rawData }),
      riskJson: toJson(quality.risk),
      score: scored.score,
      status: quality.status,
      rejectionReason: quality.reasons.join(" "),
    },
  });
}

export async function approveCandidate(candidateId: string): Promise<void> {
  await prisma.productCandidate.update({
    where: { id: candidateId },
    data: { status: "APPROVED", rejectionReason: null },
  });
}

export async function rejectCandidate(candidateId: string, reason: string): Promise<void> {
  await prisma.productCandidate.update({
    where: { id: candidateId },
    data: { status: "REJECTED", rejectionReason: reason || "Rejected by admin." },
  });
}

export async function importApprovedCandidates(storeId: string, limit = 20): Promise<{ imported: number; errors: string[] }> {
  const candidates = await prisma.productCandidate.findMany({
    where: { storeId, status: "APPROVED" },
    orderBy: { score: "desc" },
    take: limit,
  });
  const result = { imported: 0, errors: [] as string[] };
  for (const candidate of candidates) {
    try {
      await importCandidateToProduct(candidate.id);
      result.imported += 1;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Unknown import error");
    }
  }
  return result;
}

export async function importCandidateToProduct(candidateId: string): Promise<string> {
  const candidate = await prisma.productCandidate.findUnique({
    where: { id: candidateId },
    include: { store: true, category: true, mediaAssets: true },
  });
  if (!candidate) throw new Error(`Unknown candidate: ${candidateId}`);
  if (candidate.importedProductId) return candidate.importedProductId;
  if (candidate.status !== "APPROVED") {
    throw new Error(`Candidate ${candidate.id} must be approved before import.`);
  }

  const category =
    candidate.category ??
    (await prisma.category.findFirst({
      where: { storeId: candidate.storeId },
      orderBy: { sortOrder: "asc" },
    }));
  if (!category) throw new Error("Store has no category for imported product.");

  const media = parseSupplierMedia(candidate.mediaJson);
  const storedPrimary = candidate.mediaAssets.find(
    (asset) => asset.mediaType === "IMAGE" && asset.ingestionStatus === "STORED" && asset.storageUrl
  );
  const title = candidate.titleEnhanced ?? candidate.titleRaw;
  const description =
    candidate.descriptionEnhanced ??
    candidate.descriptionRaw ??
    `${title} selected for ${candidate.store.name}. Supplier details are pending editorial review.`;
  const price =
    candidate.priceRaw ??
    calculatePrice({
      supplierCost: candidate.supplierCost ?? 10,
      shippingCost: candidate.shippingCost ?? 0,
      targetMargin: 0.35,
    }).price;
  const cost = candidate.supplierCost ?? Math.round(price * 0.55 * 100) / 100;
  const shippingCost = candidate.shippingCost ?? 0;
  const marginPercent =
    candidate.marginPercent ?? Math.round(((price - cost - shippingCost) / price) * 1000) / 10;
  const slug = await uniqueProductSlug(candidate.storeId, slugify(title));
  const sku = candidate.skuCandidate ?? `${candidate.providerKey.toUpperCase()}-${candidate.externalId.slice(-10)}`;

  const product = await prisma.product.create({
    data: {
      storeId: candidate.storeId,
      categoryId: category.id,
      slug,
      title,
      subtitle: candidate.brandRaw ? `Supplier: ${candidate.brandRaw}` : "",
      description,
      shortDescription: description.slice(0, 160),
      brand: candidate.brandRaw ?? candidate.store.name,
      sku,
      gtin: candidate.gtin,
      imageUrl: storedPrimary?.storageUrl ?? media[0]?.url ?? `/api/placeholder?label=${encodeURIComponent(title)}`,
      imageAlt: storedPrimary?.alt ?? title,
      price,
      currency: candidate.currencyRaw ?? candidate.store.currency,
      cost,
      shippingCost,
      marginPercent,
      stockStatus: normalizeStockStatus(candidate.stockStatus),
      supplierName: candidate.providerKey,
      supplierProductId: candidate.externalId,
      supplierSource: candidate.providerKey,
      supplierUrl: candidate.sourceUrl,
      supplierSearchQuery: title,
      providerKey: candidate.providerKey,
      externalId: candidate.externalId,
      sourceUrl: candidate.sourceUrl,
      affiliateUrl: candidate.affiliateUrl,
      fulfillmentMode: fulfillmentModeForCandidate(candidate.providerKey),
      lastSupplierSyncAt: new Date(),
      supplierDataJson: toJson({
        candidateId: candidate.id,
        signals: candidate.signalsJson,
        risk: candidate.riskJson,
      }),
      mediaStatus: storedPrimary ? "OK" : "PENDING",
      qualityStatus: "NEEDS_REVIEW",
      shippingDaysMin: candidate.shippingDaysMin ?? candidate.store.defaultShippingDaysMin,
      shippingDaysMax: candidate.shippingDaysMax ?? candidate.store.defaultShippingDaysMax,
      countryOfOrigin: candidate.countryOfOrigin,
      specs: candidate.specsJson,
      useCases: toJson([]),
      faq: toJson([]),
      pros: toJson([]),
      cons: toJson([]),
      seoTitle: `${title} | ${candidate.store.name}`,
      seoDescription: description.slice(0, 155),
      productScore: candidate.score,
      isPublished: false,
      noindex: true,
    },
  });

  const storedAssets = candidate.mediaAssets.filter((asset) => asset.ingestionStatus === "STORED");
  if (storedAssets.length > 0) {
    await prisma.productMediaAsset.createMany({
      data: storedAssets.map((asset) => ({
        productId: product.id,
        providerKey: asset.providerKey,
        externalId: asset.externalId,
        mediaType: asset.mediaType,
        sourceUrl: asset.sourceUrl,
        storageUrl: asset.storageUrl,
        storageKey: asset.storageKey,
        thumbnailUrl: asset.thumbnailUrl,
        alt: asset.alt,
        sortOrder: asset.sortOrder,
        isPrimary: asset.isPrimary,
        width: asset.width,
        height: asset.height,
        contentType: asset.contentType,
        contentHash: asset.contentHash,
        fileSize: asset.fileSize,
        licenseStatus: asset.licenseStatus,
        ingestionStatus: asset.ingestionStatus,
        enhancementStatus: asset.enhancementStatus,
      })),
    });
    await syncProductGallery(product.id);
  } else if (media.length > 0) {
    await ingestProductMedia({
      productId: product.id,
      providerKey: candidate.providerKey,
      externalId: candidate.externalId,
      title,
      media,
    });
  }

  await prisma.productCandidate.update({
    where: { id: candidate.id },
    data: { status: "IMPORTED", importedProductId: product.id },
  });

  return product.id;
}

function parseSupplierMedia(raw: string): SupplierMedia[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SupplierMedia[]) : [];
  } catch {
    return [];
  }
}

function normalizeStockStatus(value: string): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER" {
  if (value === "LOW_STOCK" || value === "OUT_OF_STOCK" || value === "PREORDER") return value;
  return "IN_STOCK";
}

function fulfillmentModeForCandidate(providerKey: string): "AFFILIATE" | "MANUAL" | "MOCK" | "DROPSHIP" {
  if (providerKey === "mock") return "MOCK";
  if (providerKey === "cj" || providerKey === "doba") return "DROPSHIP";
  if (providerKey === "ebay" || providerKey === "amazon" || providerKey === "aliexpress" || providerKey === "temu") return "AFFILIATE";
  return "MANUAL";
}

async function uniqueProductSlug(storeId: string, baseSlug: string): Promise<string> {
  const base = baseSlug || "product";
  let slug = base.slice(0, 60);
  let suffix = 2;
  while (await prisma.product.findUnique({ where: { storeId_slug: { storeId, slug } } })) {
    slug = `${base.slice(0, 52)}-${suffix++}`;
  }
  return slug;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

```


---

## src/lib/catalog/publish-product.ts

```ts
import { prisma } from "@/lib/db";

export async function publishProductIfReady(productId: string): Promise<{ published: boolean; reason?: string }> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { mediaAssets: true },
  });
  if (!product) throw new Error(`Unknown product: ${productId}`);
  const imageCount = product.mediaAssets.filter(
    (asset) => asset.mediaType === "IMAGE" && asset.ingestionStatus === "STORED"
  ).length;

  if (product.qualityStatus !== "READY") {
    return { published: false, reason: "Product qualityStatus is not READY." };
  }
  if (imageCount < 3 && product.mediaStatus !== "OK") {
    return { published: false, reason: "Product media is incomplete." };
  }
  if (!product.sourceUrl || !product.externalId) {
    return { published: false, reason: "Missing supplier source info." };
  }

  await prisma.product.update({
    where: { id: productId },
    data: { isPublished: true, noindex: false },
  });
  return { published: true };
}


```


---

## src/lib/catalog/quality-gates.ts

```ts
import type { ProductCandidate } from "@prisma/client";
import { parseJsonObject } from "@/lib/utils/json";

const restrictedTerms = [
  "supplement",
  "gummy",
  "cbd",
  "medical",
  "acne",
  "skin whitening",
  "baby",
  "infant",
  "child safety",
  "drone",
  "battery",
  "charger",
  "weapon",
  "knife",
  "self defense",
  "adult",
  "replica",
  "designer",
  "trademark",
];

export interface QualityGateResult {
  passes: boolean;
  status: "ENRICHED" | "REJECTED";
  reasons: string[];
  risk: Record<string, unknown>;
}

export function evaluateCandidateQuality(input: {
  title: string;
  description?: string | null;
  sourceUrl?: string | null;
  externalId?: string | null;
  shippingDaysMin?: number | null;
  shippingDaysMax?: number | null;
  mediaCount: number;
  score: number;
  minScore?: number;
  marginPercent?: number | null;
  minMarginPercent?: number;
}): QualityGateResult {
  const reasons: string[] = [];
  const risk: Record<string, unknown> = {};
  const haystack = `${input.title} ${input.description ?? ""}`.toLowerCase();
  const matchedRestrictedTerms = restrictedTerms.filter((term) => haystack.includes(term));

  if (matchedRestrictedTerms.length > 0) {
    reasons.push(`Manual review required for restricted/risky terms: ${matchedRestrictedTerms.join(", ")}`);
    risk.restrictedTerms = matchedRestrictedTerms;
  }
  if (!input.sourceUrl || !input.externalId) {
    reasons.push("Missing source URL or external supplier ID.");
  }
  if (input.shippingDaysMin == null || input.shippingDaysMax == null) {
    reasons.push("Missing supplier shipping estimate.");
  }
  if (input.mediaCount < 2) {
    reasons.push("Fewer than 2 usable supplier media assets.");
  }
  if (input.marginPercent != null && input.minMarginPercent != null && input.marginPercent < input.minMarginPercent) {
    reasons.push(`Estimated margin ${input.marginPercent.toFixed(1)}% is below ${input.minMarginPercent}%.`);
  }
  if (input.score < (input.minScore ?? 50)) {
    reasons.push(`Candidate score ${input.score.toFixed(1)} is below minimum ${(input.minScore ?? 50).toFixed(1)}.`);
  }

  return {
    passes: reasons.length === 0,
    status: reasons.length === 0 ? "ENRICHED" : "REJECTED",
    reasons,
    risk,
  };
}

export function evaluateImportedProductReadiness(candidate: ProductCandidate): QualityGateResult {
  const parsedRisk = parseJsonObject(candidate.riskJson);
  const result = evaluateCandidateQuality({
    title: candidate.titleEnhanced ?? candidate.titleRaw,
    description: candidate.descriptionEnhanced ?? candidate.descriptionRaw,
    sourceUrl: candidate.sourceUrl,
    externalId: candidate.externalId,
    shippingDaysMin: candidate.shippingDaysMin,
    shippingDaysMax: candidate.shippingDaysMax,
    mediaCount: safeArrayLength(candidate.mediaJson),
    score: candidate.score,
    minScore: 75,
    marginPercent: candidate.marginPercent,
    minMarginPercent: 25,
  });
  return { ...result, risk: { ...parsedRisk, ...result.risk } };
}

function safeArrayLength(raw: string): number {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}


```


---

## src/lib/catalog/refresh-existing-products.ts

```ts
import { prisma } from "@/lib/db";

export async function markStaleSupplierProducts(storeId: string, olderThanDays = 2): Promise<number> {
  const threshold = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const result = await prisma.product.updateMany({
    where: {
      storeId,
      providerKey: { not: null },
      OR: [{ lastSupplierSyncAt: null }, { lastSupplierSyncAt: { lt: threshold } }],
    },
    data: { qualityStatus: "NEEDS_REVIEW" },
  });
  return result.count;
}


```


---

## src/lib/consent.ts

```ts
/**
 * Cookie consent state, persisted in localStorage. Necessary cookies are
 * always allowed; analytics/marketing require an explicit opt-in. Marketing
 * scripts must check this before loading (see CookieConsent component).
 */

export interface CookieConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
}

const CONSENT_KEY = "msdf_cookie_consent";

export function getCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentState;
    if (typeof parsed.analytics !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setCookieConsent(options: {
  analytics: boolean;
  marketing: boolean;
}): CookieConsentState {
  const state: CookieConsentState = {
    necessary: true,
    analytics: options.analytics,
    marketing: options.marketing,
    decidedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("msdf-consent-changed"));
  }
  return state;
}

```


---

## src/lib/content/markdown.tsx

```tsx
import type { ReactNode } from "react";

/**
 * Minimal, dependency-free markdown renderer for guide bodies. Supports the
 * subset the seed content uses: ## / ### headings, paragraphs, unordered
 * lists and **bold**. Headings get stable ids so the table of contents can
 * deep-link to them.
 */

export interface TocEntry {
  id: string;
  title: string;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractToc(markdown: string): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const line of markdown.split("\n")) {
    const match = /^##\s+(.+)$/.exec(line.trim());
    if (match) {
      entries.push({ id: slugifyHeading(match[1]), title: match[1] });
    }
  }
  return entries;
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) return <strong key={index}>{bold[1]}</strong>;
    return <span key={index}>{part}</span>;
  });
}

export function MarkdownContent({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className="prose-guide">
      {blocks.map((block, index) => {
        const h2 = /^##\s+(.+)$/.exec(block);
        if (h2) {
          return (
            <h2 key={index} id={slugifyHeading(h2[1])}>
              {h2[1]}
            </h2>
          );
        }
        const h3 = /^###\s+(.+)$/.exec(block);
        if (h3) {
          return <h3 key={index}>{h3[1]}</h3>;
        }
        if (block.split("\n").every((line) => line.trim().startsWith("- "))) {
          return (
            <ul key={index}>
              {block.split("\n").map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line.trim().slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{renderInline(block.replace(/\n/g, " "))}</p>;
      })}
    </div>
  );
}

```


---

## src/lib/db.ts

```ts
import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";

if (typeof window === "undefined") {
  // Match Next.js development env resolution when Prisma is imported outside
  // the Next runtime (scripts, tests, early server imports).
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
}

// Reuse a single Prisma client across hot reloads in development to avoid
// exhausting database connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

```


---

## src/lib/db/dev-guard.ts

```ts
import { Prisma } from "@prisma/client";
import { getSanitizedDatabaseTarget } from "@/lib/db/env-sanitize";

const DEV_DB_COMMANDS = [
  "pnpm run db:doctor",
  "pnpm run dev:local",
  "pnpm run db:push:local",
  "pnpm run db:seed:local",
] as const;

export function isMissingTableError(error: unknown, tableName: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021" &&
    error.message.includes(tableName)
  );
}

export function formatDevMissingTableError(tableName: string): Error {
  const target = getSanitizedDatabaseTarget();
  const lines = [
    `[dev db] Table "${tableName}" is missing on ${target.host}${target.pathname}.`,
    "The app is connected to a database without your schema/data.",
    "",
    "Sanitized target:",
    `  ${target.redacted}`,
    target.isPooler ? "  (pooled host — expected for DATABASE_URL on serverless)" : "",
    "",
    "Recommended:",
    ...DEV_DB_COMMANDS.map((command) => `  ${command}`),
    "",
    "Also check .env.local for duplicate DATABASE_URL lines — the last value wins.",
  ].filter(Boolean);

  return new Error(lines.join("\n"));
}

export function rethrowDevMissingTableError(error: unknown, tableName: string): never {
  if (process.env.NODE_ENV === "development" && isMissingTableError(error, tableName)) {
    throw formatDevMissingTableError(tableName);
  }
  throw error;
}

```


---

## src/lib/db/env-sanitize.ts

```ts
const DB_ENV_KEYS = [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "DIRECT_URL",
] as const;

export type DatabaseEnvKey = (typeof DB_ENV_KEYS)[number];

export interface SanitizedDatabaseTarget {
  host: string;
  pathname: string;
  isPooler: boolean;
  redacted: string;
}

export interface DatabaseEnvAssignment {
  key: DatabaseEnvKey;
  line: number;
  value: string;
}

export const CORE_TABLES = [
  "Store",
  "Supplier",
  "Product",
  "ProductImage",
  "StoreSettings",
  "Order",
] as const;

export function sanitizeDatabaseUrl(raw: string | undefined | null): SanitizedDatabaseTarget | null {
  if (!raw?.trim()) return null;

  try {
    const normalized = raw.trim().replace(/^["']|["']$/g, "");
    const parsed = new URL(
      normalized.replace(/^postgresql:\/\//, "https://").replace(/^postgres:\/\//, "https://")
    );
    const host = parsed.hostname || "unknown-host";
    const pathname = parsed.pathname || "/";
    const user = parsed.username ? decodeURIComponent(parsed.username) : "";
    const redactedUser = user ? `${user.slice(0, 2)}***` : "user";
    return {
      host,
      pathname,
      isPooler: host.includes("pooler"),
      redacted: `postgresql://${redactedUser}:***@${host}${pathname}`,
    };
  } catch {
    return {
      host: "invalid-url",
      pathname: "/",
      isPooler: false,
      redacted: "postgresql://***:***@invalid-url/",
    };
  }
}

export function getSanitizedDatabaseTarget(
  env: NodeJS.ProcessEnv = process.env
): SanitizedDatabaseTarget {
  return (
    sanitizeDatabaseUrl(env.DATABASE_URL) ?? {
      host: "missing",
      pathname: "/",
      isPooler: false,
      redacted: "DATABASE_URL is not set",
    }
  );
}

export function extractDatabaseAssignmentsFromText(text: string): DatabaseEnvAssignment[] {
  const entries: DatabaseEnvAssignment[] = [];
  const lines = text.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    let line = lines[index]?.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("export ")) line = line.slice("export ".length).trim();

    for (const key of DB_ENV_KEYS) {
      const prefix = `${key}=`;
      if (!line.startsWith(prefix)) continue;
      const value = line.slice(prefix.length).trim().replace(/^["']|["']$/g, "");
      entries.push({ key, line: index + 1, value });
    }
  }

  return entries;
}

export function extractDatabaseUrlsFromText(text: string): Array<{
  key: DatabaseEnvKey;
  line: number;
  url: string;
}> {
  return extractDatabaseAssignmentsFromText(text)
    .filter((entry) => entry.value.trim())
    .map((entry) => ({ key: entry.key, line: entry.line, url: entry.value }));
}

export function uniqueUrlKey(url: string): string {
  const sanitized = sanitizeDatabaseUrl(url);
  return sanitized ? `${sanitized.host}${sanitized.pathname}` : url;
}

export { DB_ENV_KEYS };

```


---

## src/lib/images/enhance-pipeline.ts

```ts
import { resolveProductImages } from "@/lib/images/resolve-product-images";
import type {
  ImageEnhanceInput,
  ImageEnhanceResult,
  ProductCopyEnhanceInput,
  ProductCopyEnhanceResult,
} from "@/lib/images/types";

/**
 * Image enhancement pipeline (stub).
 *
 * Future flow:
 *   1. Scrape supplier gallery (Ali/Temu/eBay adapter)
 *   2. enhanceProductImages() → background removal, upscale, lifestyle composites
 *   3. generateSalesImages() → hero banners, comparison strips, social crops
 *   4. Persist to CDN + ProductImage rows
 *
 * Wire a real provider (Replicate, OpenAI Images, etc.) behind enhanceProductImages().
 */

export async function enhanceProductImages(
  input: ImageEnhanceInput
): Promise<ImageEnhanceResult> {
  // Mock: pass through scraped URLs or fall back to curated stock until AI is configured.
  const resolved = resolveProductImages({
    title: input.productTitle,
    slug: input.productTitle.toLowerCase().replace(/\s+/g, "-").slice(0, 40),
    sku: input.productTitle.slice(0, 12),
    niche: input.niche,
    scrapedImages: input.sourceUrls.map((url, index) => ({
      url,
      source: "other",
      supplierProductId: `mock-${index}`,
      sortOrder: index,
    })),
  });

  return {
    urls: resolved.galleryUrls,
    provider: "mock",
    notes:
      "Mock enhancer: returns curated/scraped URLs unchanged. Connect REPLICATE_API_TOKEN or an image API for real upscaling and lifestyle generation.",
  };
}

export async function enhanceProductCopy(
  input: ProductCopyEnhanceInput
): Promise<ProductCopyEnhanceResult> {
  const seoTitle = `${input.title} | ${input.niche} — specs & honest buying guide`.slice(
    0,
    60
  );
  const seoDescription = input.description.slice(0, 155);

  return {
    title: input.title,
    subtitle: `Selected for ${input.audience}`,
    shortDescription: input.description.slice(0, 220),
    description: input.description,
    seoTitle,
    seoDescription,
    specs: input.specs,
    pros: [
      "Transparent shipping window published on the product page",
      "Specs verified against supplier listing",
      "Standard return policy applies",
    ],
    cons: [
      "Ships from a partner supplier — not local same-day dispatch",
      "Compare alternatives in our buying guides before purchasing",
    ],
  };
}

```


---

## src/lib/images/photo-catalog.ts

```ts
/**
 * Curated product photography per commerce niche.
 *
 * Source photos are verified Unsplash IDs, downloaded once into
 * `public/catalog/{tag}/` by `npm run catalog:download` so storefronts
 * serve stable self-hosted URLs (required before AI enhancement / re-hosting
 * scraped supplier images).
 */

/** Verified Unsplash photo IDs — must return HTTP 200 before adding here. */
export const CATALOG_SOURCE_BY_TAG: Record<string, string[]> = {
  drone: [
    "1724406096690-9fdf908faa87",
    "1706380003139-7471c33ca2b2",
    "1581092160607-ee22621dd758",
    "1511707171634-5f897ff02aa9",
    "1516035069371-29a1b244cc32",
  ],
  fpv: [
    "1724406096690-9fdf908faa87",
    "1581092160607-ee22621dd758",
    "1706380003139-7471c33ca2b2",
  ],
  camera: [
    "1516035069371-29a1b244cc32",
    "1511707171634-5f897ff02aa9",
    "1526170375885-4d8ecf77b99f",
  ],
  battery: [
    "1526170375885-4d8ecf77b99f",
    "1560472354-b33ff0c44a43",
    "1527864550417-7fd91fc51a46",
  ],
  bamboo: [
    "1542601906990-b4d3fb778b09",
    "1556742049-0cfed4f6a45d",
    "1441974231531-c6227db76b6e",
  ],
  toothbrush: [
    "1542601906990-b4d3fb778b09",
    "1556742049-0cfed4f6a45d",
    "1526170375885-4d8ecf77b99f",
  ],
  eco: [
    "1542601906990-b4d3fb778b09",
    "1441974231531-c6227db76b6e",
    "1556742049-0cfed4f6a45d",
  ],
  office: [
    "1497366216548-37526070297c",
    "1586023492125-27b2c045efd7",
    "1527864550417-7fd91fc51a46",
    "1441986300917-64674bd600d8",
  ],
  ergonomic: [
    "1586023492125-27b2c045efd7",
    "1497366216548-37526070297c",
    "1527864550417-7fd91fc51a46",
  ],
  chair: [
    "1586023492125-27b2c045efd7",
    "1497366216548-37526070297c",
    "1485827404703-89b55fcc595e",
  ],
  desk: [
    "1497366216548-37526070297c",
    "1527864550417-7fd91fc51a46",
    "1441986300917-64674bd600d8",
  ],
  pet: [
    "1601758228041-f3b2795255f1",
    "1552053831-71594a27632d",
    "1438761681033-6461ffad8d80",
    "1534528741775-53994a69daeb",
  ],
  grooming: [
    "1601758228041-f3b2795255f1",
    "1552053831-71594a27632d",
    "1438761681033-6461ffad8d80",
  ],
  dog: [
    "1601758228041-f3b2795255f1",
    "1552053831-71594a27632d",
    "1534528741775-53994a69daeb",
  ],
  cat: [
    "1601758228041-f3b2795255f1",
    "1552053831-71594a27632d",
    "1438761681033-6461ffad8d80",
  ],
  hiking: [
    "1551698618-1dfe5d97d256",
    "1506905925346-21bda4d32df4",
    "1519681393784-d120267933ba",
    "1470071459604-3b5ec3a7fe05",
  ],
  backpack: [
    "1506905925346-21bda4d32df4",
    "1519681393784-d120267933ba",
    "1551698618-1dfe5d97d256",
  ],
  camping: [
    "1519681393784-d120267933ba",
    "1470071459604-3b5ec3a7fe05",
    "1441974231531-c6227db76b6e",
  ],
  poles: [
    "1551698618-1dfe5d97d256",
    "1506905925346-21bda4d32df4",
    "1470071459604-3b5ec3a7fe05",
  ],
  product: [
    "1523275335684-37898b6baf30",
    "1505740420928-5e560c06d30e",
    "1542291026-7eec264c27ff",
    "1560472354-b33ff0c44a43",
    "1556742049-0cfed4f6a45d",
  ],
};

export function unsplashPhotoUrl(photoId: string, width = 800, height = 800): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

export function catalogPhotoPath(tag: string, fileIndex: number): string {
  const num = String(fileIndex + 1).padStart(2, "0");
  return `/catalog/${tag}/${num}.jpg`;
}

export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Score photo tags against tokenized product text; return best-matching tag. */
export function matchPhotoTag(text: string): string {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  let bestTag = "product";
  let bestScore = 0;

  for (const tag of Object.keys(CATALOG_SOURCE_BY_TAG)) {
    let score = 0;
    if (tokens.includes(tag)) score += 3;
    if (text.toLowerCase().includes(tag)) score += 2;
    for (const token of tokens) {
      if (tag.includes(token) || token.includes(tag)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestTag = tag;
    }
  }

  return bestTag;
}

/** Pick self-hosted catalog paths for a product (stable per sku+slug seed). */
export function pickCatalogPaths(tag: string, seed: string, count: number): string[] {
  const poolTag = tag in CATALOG_SOURCE_BY_TAG ? tag : "product";
  const poolSize = CATALOG_SOURCE_BY_TAG[poolTag].length;
  const start = hashString(seed) % poolSize;
  const paths: string[] = [];

  for (let index = 0; index < count; index++) {
    const fileIndex = (start + index) % poolSize;
    paths.push(catalogPhotoPath(poolTag, fileIndex));
  }

  return [...new Set(paths)];
}

```


---

## src/lib/images/resolve-product-images.ts

```ts
import {
  hashString,
  matchPhotoTag,
  pickCatalogPaths,
} from "@/lib/images/photo-catalog";
import type { ResolveProductImagesInput, ResolvedProductImages } from "@/lib/images/types";

/**
 * Resolve a primary image + gallery for a product.
 * Uses scraped URLs when present; otherwise picks niche-matched stock photography.
 */
export function resolveProductImages(input: ResolveProductImagesInput): ResolvedProductImages {
  const primaryAlt = buildImageAlt(input);

  if (input.scrapedImages && input.scrapedImages.length > 0) {
    const sorted = [...input.scrapedImages].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
    const urls = sorted.map((image) => image.url).filter(Boolean);
    return {
      primaryUrl: urls[0],
      primaryAlt,
      galleryUrls: urls.slice(0, 4),
      sourceKind: "scraped",
      sourceUrls: urls,
    };
  }

  const searchText = [
    input.niche,
    input.title,
    input.subtitle,
    input.brand,
    ...(input.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  const tag = matchPhotoTag(searchText);
  const galleryUrls = pickCatalogPaths(tag, `${input.sku}-${input.slug}`, 3);

  return {
    primaryUrl: galleryUrls[0],
    primaryAlt,
    galleryUrls,
    sourceKind: "curated",
  };
}

export function buildImageAlt(input: Pick<ResolveProductImagesInput, "title" | "subtitle" | "brand">): string {
  const parts = [input.title, input.subtitle, input.brand ? `by ${input.brand}` : ""]
    .filter(Boolean)
    .join(" — ");
  return parts.slice(0, 180);
}

/** Stable variation index 0..n for A/B image tests or multi-angle placeholders. */
export function imageVariantIndex(seed: string, modulo: number): number {
  return hashString(seed) % modulo;
}

```


---

## src/lib/images/sync-product-images.ts

```ts
import type { PrismaClient } from "@prisma/client";
import type { ScrapedSupplierImage } from "@/lib/images/types";
import { resolveProductImages } from "@/lib/images/resolve-product-images";

type DbClient = Pick<PrismaClient, "product" | "productImage" | "store">;

/**
 * Write resolved images onto a product: updates imageUrl/imageAlt and rebuilds
 * ProductImage gallery rows (used by seed, refresh script and import pipeline).
 */
export async function syncProductImages(
  db: DbClient,
  productId: string,
  options: {
    title: string;
    subtitle?: string;
    slug: string;
    sku: string;
    niche: string;
    brand?: string;
    keywords?: string[];
    scrapedImages?: ScrapedSupplierImage[];
  }
): Promise<{ primaryUrl: string; galleryCount: number }> {
  const resolved = resolveProductImages(options);

  await db.productImage.deleteMany({ where: { productId } });

  await db.productImage.createMany({
    data: resolved.galleryUrls.map((url, index) => ({
      productId,
      url,
      alt: index === 0 ? resolved.primaryAlt : `${resolved.primaryAlt} — view ${index + 1}`,
      sortOrder: index,
      isPrimary: index === 0,
    })),
  });

  await db.product.update({
    where: { id: productId },
    data: {
      imageUrl: resolved.primaryUrl,
      imageAlt: resolved.primaryAlt,
    },
  });

  return { primaryUrl: resolved.primaryUrl, galleryCount: resolved.galleryUrls.length };
}

```


---

## src/lib/images/types.ts

```ts
/**
 * Product image pipeline contracts.
 *
 * Legacy seeded products may still use curated catalog images.
 * New supplier imports should use provider-supplied media via ProductMediaAsset.
 */

export type ImageSourceKind = "curated" | "scraped" | "enhanced" | "generated";

export interface ScrapedSupplierImage {
  url: string;
  source: "aliexpress" | "temu" | "ebay" | "amazon" | "wish" | "alibaba" | "other";
  supplierProductId: string;
  sortOrder?: number;
}

export interface ResolvedProductImages {
  primaryUrl: string;
  primaryAlt: string;
  galleryUrls: string[];
  sourceKind: ImageSourceKind;
  /** When provider/enhanced, keep the original for audit/compliance. */
  sourceUrls?: string[];
}

export interface ResolveProductImagesInput {
  title: string;
  subtitle?: string;
  slug: string;
  sku: string;
  niche: string;
  brand?: string;
  keywords?: string[];
  /** Raw URLs from an authorized supplier/provider source. */
  scrapedImages?: ScrapedSupplierImage[];
}

export interface ImageEnhanceInput {
  sourceUrls: string[];
  productTitle: string;
  niche: string;
  brandVoice?: string;
  /** hero = white-bg catalog, lifestyle = in-use scene, detail = close-up */
  variants?: Array<"hero" | "lifestyle" | "detail" | "comparison">;
}

export interface ImageEnhanceResult {
  urls: string[];
  provider: "mock" | "replicate" | "openai" | "manual";
  notes?: string;
}

export interface ProductCopyEnhanceInput {
  title: string;
  description: string;
  specs: Array<{ label: string; value: string }>;
  niche: string;
  audience: string;
  brandVoice: string;
  locale: string;
}

export interface ProductCopyEnhanceResult {
  title: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  specs: Array<{ label: string; value: string }>;
  pros: string[];
  cons: string[];
}

```


---

## src/lib/jobs/catalog-jobs.ts

```ts
import { importApprovedCandidates } from "@/lib/catalog/candidate-service";
import { markStaleSupplierProducts } from "@/lib/catalog/refresh-existing-products";
import { discoverProductsForStore } from "@/lib/suppliers/catalog/discover-products";
import { parseJsonObject } from "@/lib/utils/json";

export async function runCatalogJob(job: {
  storeId: string;
  providerKey: string;
  jobType: string;
  payloadJson: string;
}): Promise<Record<string, unknown>> {
  const payload = parseJsonObject(job.payloadJson);

  if (job.jobType === "DISCOVER") {
    const query = typeof payload.query === "string" ? payload.query : "";
    if (!query) throw new Error("DISCOVER job requires payload.query.");
    const result = await discoverProductsForStore({
      storeId: job.storeId,
      providerKey: job.providerKey,
      query,
      categoryId: typeof payload.categoryId === "string" ? payload.categoryId : undefined,
      limit: typeof payload.limit === "number" ? payload.limit : 12,
    });
    return { ...result };
  }

  if (job.jobType === "IMPORT_APPROVED") {
    return importApprovedCandidates(job.storeId, typeof payload.limit === "number" ? payload.limit : 20);
  }

  if (job.jobType === "REFRESH_EXISTING") {
    const stale = await markStaleSupplierProducts(job.storeId);
    return { stale };
  }

  return { skipped: true, reason: `No runner implemented for ${job.jobType}.` };
}

```


---

## src/lib/jobs/queue.ts

```ts
import { prisma } from "@/lib/db";
import { toJson } from "@/lib/utils/json";

export interface EnqueueCatalogJobInput {
  storeId: string;
  providerKey: string;
  jobType: "DISCOVER" | "ENRICH" | "IMPORT_APPROVED" | "REFRESH_EXISTING" | "MEDIA_SYNC";
  payload?: unknown;
  runAfter?: Date;
}

export async function enqueueCatalogJob(input: EnqueueCatalogJobInput): Promise<string> {
  const job = await prisma.catalogJob.create({
    data: {
      storeId: input.storeId,
      providerKey: input.providerKey,
      jobType: input.jobType,
      payloadJson: toJson(input.payload ?? {}),
      runAfter: input.runAfter ?? new Date(),
    },
  });
  return job.id;
}

export async function claimCatalogJobs(workerId: string, limit: number) {
  const jobs = await prisma.catalogJob.findMany({
    where: {
      status: { in: ["QUEUED", "RETRY"] },
      runAfter: { lte: new Date() },
    },
    orderBy: { runAfter: "asc" },
    take: limit,
  });

  const claimed = [];
  for (const job of jobs) {
    const updated = await prisma.catalogJob.updateMany({
      where: {
        id: job.id,
        status: job.status,
        lockedAt: null,
      },
      data: {
        status: "RUNNING",
        lockedAt: new Date(),
        lockedBy: workerId,
        attempts: { increment: 1 },
      },
    });
    if (updated.count === 1) {
      const claimedJob = await prisma.catalogJob.findUnique({ where: { id: job.id } });
      if (claimedJob) claimed.push(claimedJob);
    }
  }
  return claimed;
}

export async function completeCatalogJob(jobId: string): Promise<void> {
  await prisma.catalogJob.update({
    where: { id: jobId },
    data: { status: "SUCCESS", lockedAt: null, lockedBy: null, lastError: null },
  });
}

export async function failCatalogJob(jobId: string, error: string): Promise<void> {
  const job = await prisma.catalogJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  const shouldRetry = job.attempts < job.maxAttempts;
  await prisma.catalogJob.update({
    where: { id: jobId },
    data: {
      status: shouldRetry ? "RETRY" : "FAILED",
      lockedAt: null,
      lockedBy: null,
      lastError: error,
      runAfter: new Date(Date.now() + Math.min(job.attempts + 1, 5) * 60 * 1000),
    },
  });
}


```


---

## src/lib/jobs/runner.ts

```ts
import { prisma } from "@/lib/db";
import { completeCatalogJob, failCatalogJob, claimCatalogJobs } from "@/lib/jobs/queue";
import { runCatalogJob } from "@/lib/jobs/catalog-jobs";

export interface RunCatalogJobsOptions {
  batchSize?: number;
  timeboxMs?: number;
  workerId?: string;
}

export async function runQueuedCatalogJobs(options: RunCatalogJobsOptions = {}) {
  const workerId = options.workerId ?? `catalog-${Date.now()}`;
  const batchSize = options.batchSize ?? Number(process.env.CATALOG_SYNC_BATCH_SIZE ?? 20);
  const deadline = Date.now() + (options.timeboxMs ?? 25_000);
  const summary = { processed: 0, succeeded: 0, failed: 0, errors: [] as string[] };

  while (Date.now() < deadline && summary.processed < batchSize) {
    const jobs = await claimCatalogJobs(workerId, Math.min(5, batchSize - summary.processed));
    if (jobs.length === 0) break;

    for (const job of jobs) {
      summary.processed += 1;
      try {
        await runCatalogJob(job);
        await completeCatalogJob(job.id);
        summary.succeeded += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown job error";
        await failCatalogJob(job.id, message);
        summary.failed += 1;
        summary.errors.push(message);
      }
      if (Date.now() >= deadline) break;
    }
  }

  await prisma.catalogSyncRun.create({
    data: {
      status: summary.failed > 0 ? (summary.succeeded > 0 ? "PARTIAL" : "FAILED") : "SUCCESS",
      finishedAt: new Date(),
      requestedBy: workerId,
      summaryJson: JSON.stringify(summary),
      errorMessage: summary.errors.join(" "),
    },
  });

  return summary;
}


```


---

## src/lib/media/fetch-media.ts

```ts
import { sha256 } from "@/lib/media/hash";

const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

export interface FetchedMedia {
  body: Buffer;
  contentHash: string;
  contentType: string;
  fileSize: number;
  extension: string;
  mediaType: "IMAGE" | "VIDEO";
}

export interface FetchMediaOptions {
  timeoutMs?: number;
  maxFileMb?: number;
}

export async function fetchMedia(
  sourceUrl: string,
  options: FetchMediaOptions = {}
): Promise<FetchedMedia> {
  const url = validateMediaUrl(sourceUrl);
  const timeoutMs = options.timeoutMs ?? Number(process.env.SUPPLIER_FETCH_TIMEOUT_MS ?? 15000);
  const maxBytes = (options.maxFileMb ?? Number(process.env.MAX_MEDIA_FILE_MB ?? 12)) * 1024 * 1024;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: Array.from(allowedContentTypes).join(", "),
        "User-Agent": "multistore-media-ingestion/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Media fetch failed (${response.status})`);
    }

    const contentType = normalizeContentType(response.headers.get("content-type"));
    if (!allowedContentTypes.has(contentType)) {
      throw new Error(`Unsupported media type: ${contentType || "unknown"}`);
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new Error(`Media exceeds max size (${Math.round(contentLength / 1024 / 1024)} MB).`);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > maxBytes) {
      throw new Error(`Media exceeds max size (${Math.round(arrayBuffer.byteLength / 1024 / 1024)} MB).`);
    }

    const body = Buffer.from(arrayBuffer);
    return {
      body,
      contentHash: sha256(body),
      contentType,
      fileSize: body.byteLength,
      extension: extensionForContentType(contentType),
      mediaType: contentType.startsWith("video/") ? "VIDEO" : "IMAGE",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function validateMediaUrl(sourceUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new Error("Media URL must be absolute.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Rejected media URL protocol: ${parsed.protocol}`);
  }

  return parsed.toString();
}

function normalizeContentType(value: string | null): string {
  return (value ?? "").split(";")[0].trim().toLowerCase();
}

function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    default:
      return "bin";
  }
}


```


---

## src/lib/media/hash.ts

```ts
import crypto from "node:crypto";

export function sha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

```


---

## src/lib/media/ingest-product-media.ts

```ts
import { prisma } from "@/lib/db";
import { fetchMedia } from "@/lib/media/fetch-media";
import { syncProductGallery } from "@/lib/media/sync-product-gallery";
import { getStorageProvider } from "@/lib/storage/storage-provider";
import type { SupplierMedia } from "@/lib/suppliers/providers/types";

export interface IngestProductMediaInput {
  productId?: string;
  candidateId?: string;
  providerKey?: string;
  externalId?: string;
  title: string;
  media: SupplierMedia[];
}

export interface IngestProductMediaResult {
  stored: number;
  failed: number;
  skipped: number;
}

export async function ingestProductMedia(
  input: IngestProductMediaInput
): Promise<IngestProductMediaResult> {
  if (!input.productId && !input.candidateId) {
    throw new Error("ingestProductMedia requires productId or candidateId.");
  }

  const storage = getStorageProvider();
  const result: IngestProductMediaResult = { stored: 0, failed: 0, skipped: 0 };
  const sortedMedia = [...input.media].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  for (const [index, item] of sortedMedia.entries()) {
    try {
      const fetched = await fetchMedia(item.url);
      const existingByHash = await prisma.productMediaAsset.findFirst({
        where: {
          contentHash: fetched.contentHash,
          storageUrl: { not: null },
          ingestionStatus: "STORED",
        },
        orderBy: { createdAt: "asc" },
      });

      const storageKey =
        existingByHash?.storageKey ??
        `media/${fetched.contentHash}.${fetched.extension}`;
      const storageUrl =
        existingByHash?.storageUrl ??
        (await storage.putObject({
          key: storageKey,
          body: fetched.body,
          contentType: fetched.contentType,
        })).url;

      await prisma.productMediaAsset.create({
        data: {
          productId: input.productId,
          candidateId: input.candidateId,
          providerKey: input.providerKey,
          externalId: input.externalId,
          mediaType: item.mediaType ?? fetched.mediaType,
          sourceUrl: item.url,
          storageUrl,
          storageKey,
          alt: item.alt ?? `${input.title} image ${index + 1}`,
          sortOrder: item.sortOrder ?? index,
          isPrimary: index === 0,
          width: item.width,
          height: item.height,
          contentType: fetched.contentType,
          contentHash: fetched.contentHash,
          fileSize: fetched.fileSize,
          ingestionStatus: "STORED",
        },
      });
      result.stored += 1;
    } catch (error) {
      await prisma.productMediaAsset.create({
        data: {
          productId: input.productId,
          candidateId: input.candidateId,
          providerKey: input.providerKey,
          externalId: input.externalId,
          mediaType: item.mediaType ?? "IMAGE",
          sourceUrl: item.url,
          alt: item.alt ?? `${input.title} image ${index + 1}`,
          sortOrder: item.sortOrder ?? index,
          isPrimary: index === 0,
          ingestionStatus: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown media ingestion error",
        },
      });
      result.failed += 1;
    }
  }

  if (input.productId) {
    await syncProductGallery(input.productId);
  }

  return result;
}


```


---

## src/lib/media/sync-product-gallery.ts

```ts
import { prisma } from "@/lib/db";

export async function syncProductGallery(productId: string): Promise<void> {
  const assets = await prisma.productMediaAsset.findMany({
    where: {
      productId,
      mediaType: "IMAGE",
      ingestionStatus: "STORED",
      storageUrl: { not: null },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  if (assets.length === 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { mediaStatus: "NEEDS_ENHANCEMENT" },
    });
    return;
  }

  const primary = assets.find((asset) => asset.isPrimary) ?? assets[0];

  await prisma.$transaction([
    prisma.productImage.deleteMany({
      where: { productId, ingestionStatus: { not: "LEGACY" } },
    }),
    prisma.productImage.createMany({
      data: assets.map((asset, index) => ({
        productId,
        url: asset.storageUrl ?? asset.sourceUrl,
        alt: asset.alt,
        sortOrder: index,
        isPrimary: asset.id === primary.id,
        sourceUrl: asset.sourceUrl,
        storageKey: asset.storageKey,
        providerKey: asset.providerKey,
        externalId: asset.externalId,
        contentHash: asset.contentHash,
        width: asset.width,
        height: asset.height,
        contentType: asset.contentType,
        ingestionStatus: asset.ingestionStatus,
      })),
    }),
    prisma.product.update({
      where: { id: productId },
      data: {
        imageUrl: primary.storageUrl ?? primary.sourceUrl,
        imageAlt: primary.alt,
        mediaStatus: assets.length >= 2 ? "OK" : "NEEDS_ENHANCEMENT",
      },
    }),
  ]);
}


```


---

## src/lib/monetization/bundles.ts

```ts
import type { Product } from "@prisma/client";
import { parseStringArray } from "@/lib/utils/json";
import { round2 } from "@/lib/pricing/calculate-price";

/**
 * Bundle suggestions for admin: pairs of products from the same store whose
 * use cases overlap and whose combined margin can absorb a small bundle
 * discount. Internal tooling only.
 */

export interface BundleSuggestion {
  anchorProductId: string;
  anchorTitle: string;
  companionProductId: string;
  companionTitle: string;
  combinedPrice: number;
  suggestedBundlePrice: number;
  combinedMarginPercent: number;
  sharedUseCases: string[];
}

const BUNDLE_DISCOUNT = 0.08;

export function suggestBundles(
  products: Product[],
  maxSuggestions = 10
): BundleSuggestion[] {
  const suggestions: BundleSuggestion[] = [];

  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const anchor = products[i];
      const companion = products[j];
      if (anchor.categoryId === companion.categoryId) continue; // bundles should cross categories

      const shared = intersect(
        parseStringArray(anchor.useCases),
        parseStringArray(companion.useCases)
      );
      if (shared.length === 0) continue;

      const combinedPrice = round2(anchor.price + companion.price);
      const suggestedBundlePrice = round2(combinedPrice * (1 - BUNDLE_DISCOUNT));
      const combinedCost =
        anchor.cost + anchor.shippingCost + companion.cost + companion.shippingCost;
      const combinedMarginPercent = round2(
        ((suggestedBundlePrice - combinedCost) / suggestedBundlePrice) * 100
      );
      if (combinedMarginPercent < 20) continue; // discount would eat the margin

      suggestions.push({
        anchorProductId: anchor.id,
        anchorTitle: anchor.title,
        companionProductId: companion.id,
        companionTitle: companion.title,
        combinedPrice,
        suggestedBundlePrice,
        combinedMarginPercent,
        sharedUseCases: shared,
      });
    }
  }

  return suggestions
    .sort((a, b) => b.combinedMarginPercent - a.combinedMarginPercent)
    .slice(0, maxSuggestions);
}

function intersect(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return a.filter((value) => setB.has(value));
}

```


---

## src/lib/monetization/margin.ts

```ts
import type { Product } from "@prisma/client";
import { round2 } from "@/lib/pricing/calculate-price";

/**
 * Margin analysis used by admin tooling. These numbers are internal — they
 * are never rendered on the storefront.
 */

export interface MarginBreakdown {
  price: number;
  cost: number;
  shippingCost: number;
  estimatedPaymentFee: number;
  grossMarginAmount: number;
  grossMarginPercent: number;
  health: "HEALTHY" | "ACCEPTABLE" | "AT_RISK";
}

const PAYMENT_FEE_RATE = 0.029;
const PAYMENT_FEE_FIXED = 0.3;

/** Below this margin, recommend an affiliate fallback instead of stocking. */
export const AFFILIATE_FALLBACK_MARGIN_THRESHOLD = 15;
/** Below this margin, surface an internal warning in cart/checkout logs. */
export const MARGIN_SAFE_THRESHOLD = 10;

export function calculateGrossMargin(
  product: Pick<Product, "price" | "cost" | "shippingCost">
): MarginBreakdown {
  const estimatedPaymentFee = round2(
    product.price * PAYMENT_FEE_RATE + PAYMENT_FEE_FIXED
  );
  const grossMarginAmount = round2(
    product.price - product.cost - product.shippingCost - estimatedPaymentFee
  );
  const grossMarginPercent =
    product.price > 0 ? round2((grossMarginAmount / product.price) * 100) : 0;

  return {
    price: product.price,
    cost: product.cost,
    shippingCost: product.shippingCost,
    estimatedPaymentFee,
    grossMarginAmount,
    grossMarginPercent,
    health:
      grossMarginPercent >= 30
        ? "HEALTHY"
        : grossMarginPercent >= AFFILIATE_FALLBACK_MARGIN_THRESHOLD
          ? "ACCEPTABLE"
          : "AT_RISK",
  };
}

```


---

## src/lib/monetization/recommendations.ts

```ts
import type { Product, Store } from "@prisma/client";
import {
  AFFILIATE_FALLBACK_MARGIN_THRESHOLD,
  calculateGrossMargin,
} from "@/lib/monetization/margin";
import { parseStringArray } from "@/lib/utils/json";

/**
 * Commercial recommendations for the admin dashboard. None of this is shown
 * to shoppers; it informs catalog strategy per store.
 */

export interface ProductInsight {
  productId: string;
  title: string;
  marginPercent: number;
  upsellCandidates: { productId: string; title: string; price: number }[];
  subscriptionSuitable: boolean;
  subscriptionReason: string | null;
  affiliateFallbackRecommended: boolean;
}

const CONSUMABLE_HINTS = [
  "toothbrush",
  "brush head",
  "refill",
  "floss",
  "filter",
  "shampoo",
  "wipes",
  "treats",
  "pads",
  "blade",
  "soap",
  "replacement",
];

/** Consumable niches where replenishment subscriptions usually work. */
const SUBSCRIPTION_FRIENDLY_NICHES = ["oral care", "pet care", "grooming"];

export function buildProductInsights(
  store: Store,
  products: Product[]
): ProductInsight[] {
  return products.map((product) => {
    const margin = calculateGrossMargin(product);

    const upsellCandidates = recommendUpsells(product, products).map(
      (candidate) => ({
        productId: candidate.id,
        title: candidate.title,
        price: candidate.price,
      })
    );

    const subscription = assessSubscriptionSuitability(store, product);

    return {
      productId: product.id,
      title: product.title,
      marginPercent: margin.grossMarginPercent,
      upsellCandidates,
      subscriptionSuitable: subscription.suitable,
      subscriptionReason: subscription.reason,
      affiliateFallbackRecommended:
        margin.grossMarginPercent < AFFILIATE_FALLBACK_MARGIN_THRESHOLD,
    };
  });
}

/**
 * Upsells: same category, 15-80% more expensive, decent score. The classic
 * "spend a little more, get meaningfully more" ladder.
 */
export function recommendUpsells(
  product: Product,
  catalog: Product[],
  limit = 3
): Product[] {
  return catalog
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.categoryId === product.categoryId &&
        candidate.isPublished &&
        candidate.price > product.price * 1.15 &&
        candidate.price < product.price * 1.8
    )
    .sort((a, b) => b.productScore - a.productScore)
    .slice(0, limit);
}

export function assessSubscriptionSuitability(
  store: Store,
  product: Product
): { suitable: boolean; reason: string | null } {
  const haystack = `${product.title} ${product.description}`.toLowerCase();
  const useCases = parseStringArray(product.useCases);

  const isConsumable =
    CONSUMABLE_HINTS.some((hint) => haystack.includes(hint)) ||
    useCases.includes("subscription");
  const nicheFriendly = SUBSCRIPTION_FRIENDLY_NICHES.some((niche) =>
    store.niche.toLowerCase().includes(niche)
  );

  if (isConsumable && product.price <= 60) {
    return {
      suitable: true,
      reason: nicheFriendly
        ? "Consumable in a replenishment-friendly niche; offer a 2-3 month refill cadence."
        : "Consumable product; test a refill subscription with a small discount.",
    };
  }
  return { suitable: false, reason: null };
}

```


---

## src/lib/orders/persist-order.ts

```ts
import type { PrismaClient } from "@prisma/client";
import type { PreparedCheckout } from "@/lib/orders/types";
import { toJson } from "@/lib/utils/json";

type Db = Pick<PrismaClient, "customer" | "order" | "orderItem">;

export interface PersistOrderOptions {
  paymentProvider: string;
  paymentStatus: string;
  orderStatus?: string;
  stripePaymentIntentId?: string | null;
  paymentError?: string | null;
}

export async function persistOrderFromCheckout(
  db: Db,
  checkout: PreparedCheckout,
  options: PersistOrderOptions
) {
  const customer = await db.customer.upsert({
    where: {
      storeId_email: {
        storeId: checkout.storeId,
        email: checkout.customer.email.toLowerCase(),
      },
    },
    update: {
      name: checkout.customer.name,
    },
    create: {
      storeId: checkout.storeId,
      email: checkout.customer.email.toLowerCase(),
      name: checkout.customer.name,
    },
  });

  const order = await db.order.create({
    data: {
      storeId: checkout.storeId,
      customerId: customer.id,
      orderNumber: checkout.orderNumber,
      status: options.orderStatus ?? "DRAFT",
      paymentStatus: options.paymentStatus,
      fulfillmentStatus: "NOT_STARTED",
      paymentProvider: options.paymentProvider,
      stripePaymentIntentId: options.stripePaymentIntentId ?? null,
      paymentError: options.paymentError ?? null,
      currency: checkout.currency,
      subtotal: checkout.subtotal,
      shippingTotal: checkout.shippingTotal,
      taxTotal: 0,
      grandTotal: checkout.grandTotal,
      shippingAddressJson: toJson(checkout.customer),
      billingAddressJson: toJson(checkout.customer),
      items: {
        create: checkout.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          titleSnapshot: line.title,
          skuSnapshot: line.sku,
          unitPrice: line.unitPrice,
          unitCost: line.unitCost,
          providerKey: line.providerKey,
          externalId: line.externalId,
          fulfillmentMode: line.fulfillmentMode,
          status: "PENDING",
        })),
      },
    },
    include: { items: true },
  });

  return { customer, order };
}

```


---

## src/lib/orders/prepare-checkout.ts

```ts
import { prisma } from "@/lib/db";
import { MARGIN_SAFE_THRESHOLD, calculateGrossMargin } from "@/lib/monetization/margin";
import { round2 } from "@/lib/pricing/calculate-price";
import type {
  CheckoutCustomerInput,
  FulfillmentMode,
  PreparedCheckout,
} from "@/lib/orders/types";
import { getCommerceProvider } from "@/lib/suppliers/providers/registry";
import { checkoutSchema } from "@/lib/validation/schemas";

function shippingCostFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= 50 ? 0 : 5.95;
}

function generateOrderNumber(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function parseFulfillmentMode(value: string): FulfillmentMode {
  if (value === "DROPSHIP" || value === "AFFILIATE" || value === "MANUAL" || value === "MOCK") {
    return value;
  }
  return "MANUAL";
}

function manualFulfillmentEnabled(): boolean {
  return process.env.MANUAL_FULFILLMENT_ENABLED === "true";
}

export async function prepareCheckout(input: unknown): Promise<
  | { ok: true; checkout: PreparedCheckout }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }
> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  const data = parsed.data;
  const store = await prisma.store.findUnique({ where: { slug: data.storeSlug } });
  if (!store) return { ok: false, message: "Unknown store." };

  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
      id: { in: data.items.map((item) => item.productId) },
      isPublished: true,
    },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const lines = [];
  let subtotal = 0;
  for (const item of data.items) {
    const product = productById.get(item.productId);
    if (!product) {
      return { ok: false, message: "An item in your cart is no longer available." };
    }
    if (product.stockStatus === "OUT_OF_STOCK") {
      return { ok: false, message: `"${product.title}" is currently out of stock.` };
    }

    const fulfillmentMode = parseFulfillmentMode(product.fulfillmentMode);
    if (fulfillmentMode === "AFFILIATE") {
      return {
        ok: false,
        message: `"${product.title}" is sold via an external partner link — use View deal on the product page.`,
      };
    }
    if (fulfillmentMode === "MANUAL" && !manualFulfillmentEnabled()) {
      return {
        ok: false,
        message: `"${product.title}" is not available for checkout at this time.`,
      };
    }
    if (fulfillmentMode === "DROPSHIP") {
      if (!product.externalId) {
        return {
          ok: false,
          message: `"${product.title}" is missing supplier fulfillment data.`,
        };
      }

      const providerKey = product.providerKey ?? "mock";
      let provider;
      try {
        provider = getCommerceProvider(providerKey);
      } catch {
        return {
          ok: false,
          message: `"${product.title}" uses an unknown fulfillment provider.`,
        };
      }

      if (!provider.capabilities.checkout || !provider.createDropshipOrder) {
        return {
          ok: false,
          message: `"${product.title}" cannot be sold through checkout until ${provider.name} checkout is enabled.`,
        };
      }
    }

    subtotal += product.price * item.quantity;
    lines.push({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      sku: product.sku,
      quantity: item.quantity,
      unitPrice: product.price,
      unitCost: product.cost,
      fulfillmentMode,
      providerKey: product.providerKey,
      externalId: product.externalId,
      shippingDaysMin: product.shippingDaysMin,
      shippingDaysMax: product.shippingDaysMax,
      countryOfOrigin: product.countryOfOrigin,
    });

    const margin = calculateGrossMargin(product);
    if (margin.grossMarginPercent < MARGIN_SAFE_THRESHOLD) {
      console.warn(
        `[margin-safe] Checkout line below ${MARGIN_SAFE_THRESHOLD}% margin: ` +
          `${store.slug}/${product.slug} at ${margin.grossMarginPercent}%`
      );
    }
  }

  subtotal = round2(subtotal);
  const shippingTotal = shippingCostFor(subtotal);
  const grandTotal = round2(subtotal + shippingTotal);

  const customer: CheckoutCustomerInput = {
    name: data.name,
    email: data.email,
    addressLine1: data.addressLine1,
    city: data.city,
    postalCode: data.postalCode,
    country: data.country,
  };

  return {
    ok: true,
    checkout: {
      storeId: store.id,
      storeSlug: store.slug,
      currency: store.currency,
      subtotal,
      shippingTotal,
      grandTotal,
      orderNumber: generateOrderNumber(),
      customer,
      lines,
    },
  };
}

```


---

## src/lib/orders/route-order.ts

```ts
import { prisma } from "@/lib/db";
import { getStripeClient, paymentCaptureMode } from "@/lib/payments/stripe-client";
import { getCommerceProvider } from "@/lib/suppliers/providers/registry";
import { UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";
import { toJson } from "@/lib/utils/json";

export interface RouteOrderResult {
  ok: boolean;
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  error?: string;
  supplierOrders: number;
}

function manualFulfillmentEnabled(): boolean {
  return process.env.MANUAL_FULFILLMENT_ENABLED === "true";
}

export async function routeOrder(orderId: string): Promise<RouteOrderResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      store: true,
    },
  });

  if (!order) {
    return {
      ok: false,
      orderId,
      orderNumber: "unknown",
      status: "ERROR",
      paymentStatus: "FAILED",
      fulfillmentStatus: "ERROR",
      error: "Order not found",
      supplierOrders: 0,
    };
  }

  if (
    order.status === "SUPPLIER_ORDERED" ||
    order.status === "FULFILLMENT_PENDING" ||
    order.status === "ERROR" ||
    order.status === "CANCELLED"
  ) {
    const supplierOrders = await prisma.supplierOrder.count({ where: { orderId: order.id } });
    return {
      ok: order.status === "SUPPLIER_ORDERED" || order.status === "FULFILLMENT_PENDING",
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      error: order.paymentError ?? undefined,
      supplierOrders,
    };
  }

  const shippingAddress = JSON.parse(order.shippingAddressJson) as Record<string, unknown>;
  const errors: string[] = [];
  let supplierOrdersCreated = 0;
  let pendingSupplierOrders = 0;

  for (const item of order.items) {
    if (item.fulfillmentMode === "AFFILIATE") {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { status: "AFFILIATE", fulfillmentMode: "AFFILIATE" },
      });
      continue;
    }

    if (item.fulfillmentMode === "MANUAL") {
      if (!manualFulfillmentEnabled()) {
        errors.push(`Manual fulfillment disabled for ${item.titleSnapshot}`);
        continue;
      }
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { status: "MANUAL_QUEUED" },
      });
      continue;
    }

    if (item.fulfillmentMode === "MOCK") {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { status: "MOCK_FULFILLED" },
      });
      continue;
    }

    if (item.fulfillmentMode !== "DROPSHIP") {
      errors.push(`Unsupported fulfillment mode ${item.fulfillmentMode} for ${item.titleSnapshot}`);
      continue;
    }

    const providerKey = item.providerKey ?? item.product.providerKey ?? "mock";
    let provider;
    try {
      provider = getCommerceProvider(providerKey);
    } catch {
      errors.push(`Unknown provider ${providerKey} for ${item.titleSnapshot}`);
      continue;
    }

    if (!provider.capabilities.checkout || !provider.createDropshipOrder) {
      errors.push(
        `Provider ${provider.name} does not support checkout API for ${item.titleSnapshot}`
      );
      continue;
    }

    if (!item.externalId) {
      errors.push(`Missing supplier external id for ${item.titleSnapshot}`);
      continue;
    }

    try {
      const result = await provider.createDropshipOrder({
        orderId: order.id,
        items: [
          {
            externalId: item.externalId,
            quantity: item.quantity,
            title: item.titleSnapshot,
            unitPrice: item.unitPrice,
          },
        ],
        shippingAddress,
      });

      if (result.status === "ERROR") {
        errors.push(result.errorMessage ?? `Supplier order failed for ${item.titleSnapshot}`);
        continue;
      }

      const supplierOrder = await prisma.supplierOrder.create({
        data: {
          orderId: order.id,
          providerKey: provider.key,
          externalOrderId: result.externalOrderId ?? null,
          status: result.status === "PLACED" ? "PLACED" : "PENDING",
          requestJson: toJson(result.requestJson ?? {}),
          responseJson: toJson(result.responseJson ?? {}),
          errorMessage: result.errorMessage ?? null,
        },
      });

      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          supplierOrderId: supplierOrder.id,
          status: result.status === "PLACED" ? "SUPPLIER_ORDERED" : "PENDING",
        },
      });
      supplierOrdersCreated += 1;
      if (result.status === "PENDING") pendingSupplierOrders += 1;
    } catch (error) {
      const message =
        error instanceof UnsupportedCapabilityError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Supplier order failed";
      errors.push(`${item.titleSnapshot}: ${message}`);
    }
  }

  const hasBlockingErrors = errors.length > 0;
  const captureMode = paymentCaptureMode();

  if (hasBlockingErrors) {
    if (order.stripePaymentIntentId && captureMode === "manual") {
      try {
        const stripe = getStripeClient();
        await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
      } catch (cancelError) {
        console.error("[route-order] Failed to cancel PaymentIntent:", cancelError);
      }
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "ERROR",
        paymentStatus:
          order.stripePaymentIntentId && captureMode === "manual"
            ? "CANCELLED"
            : order.paymentStatus === "CAPTURED"
              ? "CAPTURED"
              : "FAILED",
        fulfillmentStatus: "ERROR",
        paymentError: errors.join("; "),
      },
    });

    return {
      ok: false,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      fulfillmentStatus: updated.fulfillmentStatus,
      error: errors.join("; "),
      supplierOrders: supplierOrdersCreated,
    };
  }

  if (pendingSupplierOrders > 0) {
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "FULFILLMENT_PENDING",
        paymentStatus:
          order.stripePaymentIntentId && captureMode === "manual"
            ? "AUTHORIZED"
            : order.stripePaymentIntentId
              ? "CAPTURED"
              : order.paymentStatus,
        fulfillmentStatus: "PENDING",
        paymentError:
          "Supplier order was created but still requires provider confirmation before capture.",
      },
    });

    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      fulfillmentStatus: updated.fulfillmentStatus,
      supplierOrders: supplierOrdersCreated,
    };
  }

  if (
    order.stripePaymentIntentId &&
    captureMode === "manual" &&
    order.paymentStatus !== "CAPTURED"
  ) {
    try {
      const stripe = getStripeClient();
      await stripe.paymentIntents.capture(order.stripePaymentIntentId);
    } catch (captureError) {
      const message =
        captureError instanceof Error ? captureError.message : "Payment capture failed";
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "ERROR",
          paymentStatus: "FAILED",
          fulfillmentStatus: "ERROR",
          paymentError: message,
        },
      });
      return {
        ok: false,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: "ERROR",
        paymentStatus: "FAILED",
        fulfillmentStatus: "ERROR",
        error: message,
        supplierOrders: supplierOrdersCreated,
      };
    }
  }

  const fulfillmentStatus =
    order.items.some((item) => item.fulfillmentMode === "MANUAL") && manualFulfillmentEnabled()
      ? "MANUAL"
      : "SUPPLIER_ORDERED";

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "SUPPLIER_ORDERED",
      paymentStatus: order.stripePaymentIntentId ? "CAPTURED" : "CAPTURED",
      fulfillmentStatus,
    },
  });

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: updated.status,
    paymentStatus: updated.paymentStatus,
    fulfillmentStatus: updated.fulfillmentStatus,
    supplierOrders: supplierOrdersCreated,
  };
}

```


---

## src/lib/orders/types.ts

```ts
export const ORDER_STATUSES = [
  "DRAFT",
  "CONFIRMED",
  "FULFILLMENT_PENDING",
  "SUPPLIER_ORDERED",
  "ERROR",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "UNPAID",
  "AUTHORIZED",
  "CAPTURED",
  "CANCELLED",
  "FAILED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const FULFILLMENT_STATUSES = [
  "NOT_STARTED",
  "PENDING",
  "SUPPLIER_ORDERED",
  "MANUAL",
  "AFFILIATE",
  "ERROR",
] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const FULFILLMENT_MODES = ["DROPSHIP", "AFFILIATE", "MANUAL", "MOCK"] as const;
export type FulfillmentMode = (typeof FULFILLMENT_MODES)[number];

export interface CheckoutLineInput {
  productId: string;
  quantity: number;
}

export interface CheckoutCustomerInput {
  name: string;
  email: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface PreparedCheckoutLine {
  productId: string;
  title: string;
  slug: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  fulfillmentMode: FulfillmentMode;
  providerKey: string | null;
  externalId: string | null;
  shippingDaysMin: number;
  shippingDaysMax: number;
  countryOfOrigin: string | null;
}

export interface PreparedCheckout {
  storeId: string;
  storeSlug: string;
  currency: string;
  subtotal: number;
  shippingTotal: number;
  grandTotal: number;
  orderNumber: string;
  customer: CheckoutCustomerInput;
  lines: PreparedCheckoutLine[];
}

```


---

## src/lib/payments/payment-provider.ts

```ts
/**
 * Payment provider abstraction.
 *
 * Checkout talks only to this interface, so adding Stripe (or Klarna, Vipps,
 * PayPal, ...) is a matter of implementing PaymentProvider and switching the
 * export at the bottom — no storefront changes required.
 *
 * Stripe sketch:
 *   class StripeProvider implements PaymentProvider {
 *     async createPayment(input) {
 *       const intent = await stripe.paymentIntents.create({
 *         amount: Math.round(input.amountTotal * 100),
 *         currency: input.currency.toLowerCase(),
 *         receipt_email: input.customer.email,
 *         metadata: { storeId: input.storeId, orderRef: input.orderRef },
 *       });
 *       return { status: "REQUIRES_ACTION", clientSecret: ***REDACTED***, ... };
 *     }
 *   }
 */

export interface PaymentCustomer {
  name: string;
  email: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface PaymentLineItem {
  productId: string;
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePaymentInput {
  storeId: string;
  orderRef: string;
  currency: string;
  amountSubtotal: number;
  amountShipping: number;
  amountTotal: number;
  customer: PaymentCustomer;
  lineItems: PaymentLineItem[];
}

export type PaymentStatus = "SUCCEEDED" | "REQUIRES_ACTION" | "FAILED";

export interface PaymentResult {
  status: PaymentStatus;
  providerName: string;
  /** Provider transaction id (mock generates a fake one). */
  transactionId: string;
  /** For redirect/confirm flows (e.g. Stripe client secret). */
  clientSecret?: string;
  errorMessage?: string;
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
}

/** Simulates an always-successful payment. Active while MOCK_CHECKOUT=true. */
class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    if (input.amountTotal <= 0) {
      return {
        status: "FAILED",
        providerName: this.name,
        transactionId: "",
        errorMessage: "Order total must be greater than zero.",
      };
    }
    return {
      status: "SUCCEEDED",
      providerName: this.name,
      transactionId: `mock_${input.orderRef}_${Date.now().toString(36)}`,
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (process.env.MOCK_CHECKOUT !== "false") {
    return new MockPaymentProvider();
  }
  return new MockPaymentProvider();
}

```


---

## src/lib/payments/stripe-client.ts

```ts
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
}

export function isMockCheckoutEnabled(): boolean {
  return process.env.MOCK_CHECKOUT !== "false";
}

export function paymentCaptureMode(): "automatic" | "manual" {
  return process.env.PAYMENT_CAPTURE_MODE === "manual" ? "manual" : "automatic";
}

```


---

## src/lib/pricing/calculate-price.ts

```ts
/**
 * Pricing engine.
 *
 * Computes a margin-safe retail price from real cost inputs. Used by the
 * supplier import pipeline and by admin tooling; the seeded catalog stores
 * the resulting marginPercent so the storefront never has to recompute it.
 */

export interface PriceInput {
  /** What the supplier charges us per unit. */
  supplierCost: number;
  /** What we pay to ship one unit to the customer. */
  shippingCost: number;
  /** Payment processor fee, e.g. 0.029 for 2.9%. */
  paymentFeeRate?: number;
  /** Fixed payment fee per transaction, e.g. 0.30. */
  paymentFeeFixed?: number;
  /** Expected fraction of orders returned, e.g. 0.04 for 4%. */
  expectedReturnRate?: number;
  /** Target gross margin as a fraction of price, e.g. 0.35 for 35%. */
  targetMargin?: number;
}

export interface PriceResult {
  price: number;
  landedCost: number;
  estimatedFees: number;
  grossMarginAmount: number;
  grossMarginPercent: number;
}

const DEFAULTS = {
  paymentFeeRate: 0.029,
  paymentFeeFixed: 0.3,
  expectedReturnRate: 0.04,
  targetMargin: 0.35,
};

/**
 * Solves price P such that:
 *   P - landedCost - feeRate*P - feeFixed - returnRate*landedCost = targetMargin * P
 */
export function calculatePrice(input: PriceInput): PriceResult {
  const paymentFeeRate = input.paymentFeeRate ?? DEFAULTS.paymentFeeRate;
  const paymentFeeFixed = input.paymentFeeFixed ?? DEFAULTS.paymentFeeFixed;
  const expectedReturnRate =
    input.expectedReturnRate ?? DEFAULTS.expectedReturnRate;
  const targetMargin = input.targetMargin ?? DEFAULTS.targetMargin;

  const landedCost = input.supplierCost + input.shippingCost;
  const effectiveCost =
    landedCost * (1 + expectedReturnRate) + paymentFeeFixed;

  const denominator = 1 - paymentFeeRate - targetMargin;
  if (denominator <= 0) {
    throw new Error(
      "Target margin plus payment fees exceed 100% of price; lower the target margin."
    );
  }

  const rawPrice = effectiveCost / denominator;
  const price = toCharmPrice(rawPrice);

  const estimatedFees = price * paymentFeeRate + paymentFeeFixed;
  const grossMarginAmount = price - landedCost - estimatedFees;
  const grossMarginPercent = price > 0 ? (grossMarginAmount / price) * 100 : 0;

  return {
    price,
    landedCost,
    estimatedFees: round2(estimatedFees),
    grossMarginAmount: round2(grossMarginAmount),
    grossMarginPercent: round2(grossMarginPercent),
  };
}

/**
 * compareAtPrice is only honest if the product genuinely sold at that price.
 * This helper validates a configured compare-at value instead of inventing
 * one; it returns null when the value would be misleading.
 */
export function honestCompareAtPrice(
  price: number,
  configuredCompareAt: number | null | undefined
): number | null {
  if (!configuredCompareAt) return null;
  if (configuredCompareAt <= price) return null;
  // Reject implausible anchor prices (> 60% discount looks like fake urgency).
  if ((configuredCompareAt - price) / configuredCompareAt > 0.6) return null;
  return round2(configuredCompareAt);
}

/** Round to .95 / .00 endings without inflating the price. */
function toCharmPrice(raw: number): number {
  const whole = Math.ceil(raw);
  const charm = whole - 0.05;
  return charm >= raw ? round2(charm) : round2(whole);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale = "en-US"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

```


---

## src/lib/products/product-score.ts

```ts
import type { StockStatus } from "@/lib/types";

/**
 * Product scoring (0-100).
 *
 * The productScore drives which products get featured on homepages, the
 * default category sort, and quiz recommendations. It blends commercial
 * health (margin, shipping, supplier) with content quality so the platform
 * naturally promotes products that are both profitable and well-presented.
 */

export interface ProductScoreInput {
  /** Gross margin as a percent of price (0-100). */
  marginPercent: number;
  shippingDaysMin: number;
  shippingDaysMax: number;
  /** Supplier reliability 0-1 (from the Supplier table). */
  supplierReliability: number;
  stockStatus: StockStatus;
  /** Fraction of orders expected to be returned (0-1). */
  returnRiskRate: number;
  content: {
    descriptionLength: number;
    prosCount: number;
    consCount: number;
    specsCount: number;
    faqCount: number;
    useCasesCount: number;
    hasImageAlt: boolean;
  };
  /**
   * Placeholder for real search-demand data (e.g. keyword volume from an SEO
   * API). 0-1; defaults to neutral 0.5 until a data source is connected.
   */
  seoDemand?: number;
  /**
   * Placeholder for compliance screening (certifications, restricted
   * categories, IP risk). 0 = no known risk, 1 = high risk.
   */
  complianceRisk?: number;
}

const WEIGHTS = {
  margin: 25,
  shipping: 15,
  supplier: 15,
  stock: 10,
  returnRisk: 10,
  content: 15,
  seoDemand: 5,
  compliance: 5,
};

export function computeProductScore(input: ProductScoreInput): number {
  // Margin: 0% -> 0, >=45% -> full marks.
  const marginScore = clamp01(input.marginPercent / 45);

  // Shipping: <=4 days avg -> full marks, >=21 days -> 0.
  const avgDays = (input.shippingDaysMin + input.shippingDaysMax) / 2;
  const shippingScore = clamp01(1 - (avgDays - 4) / 17);

  const supplierScore = clamp01(input.supplierReliability);

  const stockScore =
    input.stockStatus === "IN_STOCK"
      ? 1
      : input.stockStatus === "LOW_STOCK"
        ? 0.6
        : input.stockStatus === "PREORDER"
          ? 0.4
          : 0;

  // Return risk: 0% -> full marks, >=15% -> 0.
  const returnScore = clamp01(1 - input.returnRiskRate / 0.15);

  const contentScore = computeContentRichness(input.content);

  const seoScore = clamp01(input.seoDemand ?? 0.5);
  const complianceScore = clamp01(1 - (input.complianceRisk ?? 0));

  const total =
    marginScore * WEIGHTS.margin +
    shippingScore * WEIGHTS.shipping +
    supplierScore * WEIGHTS.supplier +
    stockScore * WEIGHTS.stock +
    returnScore * WEIGHTS.returnRisk +
    contentScore * WEIGHTS.content +
    seoScore * WEIGHTS.seoDemand +
    complianceScore * WEIGHTS.compliance;

  return Math.round(total * 10) / 10;
}

function computeContentRichness(
  content: ProductScoreInput["content"]
): number {
  let points = 0;
  if (content.descriptionLength >= 300) points += 2;
  else if (content.descriptionLength >= 120) points += 1;
  if (content.prosCount >= 3) points += 1;
  if (content.consCount >= 2) points += 1; // honest cons are quality content
  if (content.specsCount >= 5) points += 2;
  else if (content.specsCount >= 3) points += 1;
  if (content.faqCount >= 2) points += 1;
  if (content.useCasesCount >= 2) points += 1;
  if (content.hasImageAlt) points += 1;
  return clamp01(points / 9);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

```


---

## src/lib/quiz/quiz-config.ts

```ts
/**
 * Product-finder quiz configuration per niche.
 *
 * Option `tags` match the `useCases` tags on seeded products; the quiz
 * scores each product by tag overlap + productScore, optionally capped by
 * the selected budget. Stores without a bespoke quiz get a generic one
 * derived from their categories.
 */

export interface QuizOption {
  value: string;
  label: string;
  tags: string[];
  /** When set, products above this price are excluded. */
  priceMax?: number;
}

export interface QuizQuestion {
  id: string;
  label: string;
  options: QuizOption[];
}

export const QUIZ_CONFIGS: Record<string, QuizQuestion[]> = {
  drones: [
    {
      id: "experience",
      label: "How much flying experience do you have?",
      options: [
        { value: "none", label: "None — total beginner", tags: ["beginner", "easy-fly"] },
        { value: "some", label: "Some — flown a few times", tags: ["beginner", "camera"] },
        { value: "lots", label: "Experienced pilot", tags: ["pro", "performance"] },
      ],
    },
    {
      id: "camera",
      label: "How important is camera quality?",
      options: [
        { value: "essential", label: "Essential — it is for photo/video", tags: ["camera", "4k"] },
        { value: "nice", label: "Nice to have", tags: ["camera"] },
        { value: "no", label: "Not important — I just want to fly", tags: ["racing", "easy-fly"] },
      ],
    },
    {
      id: "where",
      label: "Where will you fly most?",
      options: [
        { value: "indoor", label: "Indoors", tags: ["indoor", "compact"] },
        { value: "outdoor", label: "Outdoors", tags: ["outdoor", "gps"] },
        { value: "both", label: "Both", tags: ["compact", "outdoor"] },
      ],
    },
    {
      id: "budget",
      label: "What is your budget?",
      options: [
        { value: "low", label: "Under $150", tags: ["budget"], priceMax: 150 },
        { value: "mid", label: "$150-$400", tags: [], priceMax: 400 },
        { value: "high", label: "Above $400", tags: ["pro", "performance"] },
      ],
    },
  ],
  "bamboo-toothbrushes": [
    {
      id: "household",
      label: "Who is brushing?",
      options: [
        { value: "solo", label: "Just me", tags: ["adult"] },
        { value: "couple", label: "Two adults", tags: ["adult", "multipack"] },
        { value: "family", label: "Family with kids", tags: ["family", "kids", "multipack"] },
      ],
    },
    {
      id: "softness",
      label: "Which bristle feel do you prefer?",
      options: [
        { value: "soft", label: "Soft — sensitive gums", tags: ["soft", "sensitive"] },
        { value: "medium", label: "Medium", tags: ["medium"] },
        { value: "unsure", label: "Not sure", tags: ["soft"] },
      ],
    },
    {
      id: "subscription",
      label: "Would you like automatic replacements?",
      options: [
        { value: "yes", label: "Yes — remind/replace on schedule", tags: ["subscription"] },
        { value: "no", label: "No — I will reorder myself", tags: [] },
      ],
    },
    {
      id: "sustainability",
      label: "How far do you want to go on zero-waste?",
      options: [
        { value: "max", label: "As plastic-free as possible", tags: ["zero-waste", "compostable"] },
        { value: "balanced", label: "Balanced — practical and greener", tags: ["eco"] },
      ],
    },
  ],
  "ergonomic-office": [
    {
      id: "pain",
      label: "What bothers you most after a workday?",
      options: [
        { value: "back", label: "Lower back", tags: ["back-pain", "lumbar"] },
        { value: "neck", label: "Neck and shoulders", tags: ["neck-pain", "monitor-height"] },
        { value: "wrists", label: "Wrists and forearms", tags: ["wrist-pain", "typing"] },
        { value: "fatigue", label: "General fatigue from sitting", tags: ["standing", "movement"] },
      ],
    },
    {
      id: "setup",
      label: "What does your desk setup look like?",
      options: [
        { value: "laptop", label: "Laptop only", tags: ["laptop", "monitor-height"] },
        { value: "monitor", label: "External monitor + keyboard", tags: ["typing", "lumbar"] },
        { value: "small", label: "Small or shared desk", tags: ["compact", "laptop"] },
      ],
    },
    {
      id: "budget",
      label: "How much do you want to spend right now?",
      options: [
        { value: "low", label: "Under $50", tags: ["budget"], priceMax: 50 },
        { value: "mid", label: "$50-$150", tags: [], priceMax: 150 },
        { value: "high", label: "Whatever fixes it", tags: ["premium"] },
      ],
    },
  ],
  "pet-grooming": [
    {
      id: "pet",
      label: "Who are we grooming?",
      options: [
        { value: "dog", label: "Dog", tags: ["dog"] },
        { value: "cat", label: "Cat", tags: ["cat"] },
        { value: "both", label: "Both", tags: ["dog", "cat"] },
      ],
    },
    {
      id: "coat",
      label: "What kind of coat?",
      options: [
        { value: "long", label: "Long or double coat", tags: ["long-coat", "deshedding"] },
        { value: "short", label: "Short coat", tags: ["short-coat"] },
        { value: "curly", label: "Curly or wiry", tags: ["long-coat", "detangling"] },
      ],
    },
    {
      id: "sensitivity",
      label: "Is your pet sensitive about grooming?",
      options: [
        { value: "very", label: "Very — we need gentle tools", tags: ["sensitive-skin", "quiet"] },
        { value: "somewhat", label: "A little fidgety", tags: ["sensitive-skin"] },
        { value: "no", label: "Not at all", tags: [] },
      ],
    },
  ],
  "hiking-gear": [
    {
      id: "trip",
      label: "What kind of trips are you doing?",
      options: [
        { value: "day", label: "Day hikes", tags: ["day-hike"] },
        { value: "weekend", label: "Overnighters and weekends", tags: ["multi-day"] },
        { value: "long", label: "Multi-day treks", tags: ["multi-day", "expedition"] },
      ],
    },
    {
      id: "weather",
      label: "What conditions do you usually face?",
      options: [
        { value: "fair", label: "Mostly fair weather", tags: ["summer"] },
        { value: "wet", label: "Rain and wind", tags: ["rain", "waterproof"] },
        { value: "cold", label: "Cold or shoulder season", tags: ["winter", "insulation"] },
      ],
    },
    {
      id: "weight",
      label: "How much do you care about pack weight?",
      options: [
        { value: "ultralight", label: "Count every gram", tags: ["ultralight"] },
        { value: "balanced", label: "Balance weight and comfort", tags: ["comfort"] },
        { value: "comfort", label: "Comfort first", tags: ["comfort", "padded"] },
      ],
    },
  ],
};

export function getQuizQuestions(
  storeSlug: string,
  categoryNames: string[]
): QuizQuestion[] {
  const config = QUIZ_CONFIGS[storeSlug];
  if (config) return config;

  // Generic fallback for stores generated after launch.
  return [
    {
      id: "category",
      label: "What are you shopping for?",
      options: categoryNames.slice(0, 4).map((name) => ({
        value: name.toLowerCase().replace(/\s+/g, "-"),
        label: name,
        tags: [name.toLowerCase()],
      })),
    },
    {
      id: "budget",
      label: "What is your budget?",
      options: [
        { value: "low", label: "Entry level", tags: ["budget"], priceMax: 75 },
        { value: "mid", label: "Mid range", tags: [], priceMax: 200 },
        { value: "high", label: "Premium", tags: ["premium"] },
      ],
    },
  ];
}

export interface QuizAnswerMap {
  [questionId: string]: string;
}

export interface ScoredRecommendation<T> {
  product: T;
  matchScore: number;
  matchedTags: string[];
}

export function recommendProducts<
  T extends { price: number; useCases: string[]; productScore: number },
>(
  questions: QuizQuestion[],
  answers: QuizAnswerMap,
  products: T[],
  limit = 4
): ScoredRecommendation<T>[] {
  const selectedTags: string[] = [];
  let priceMax: number | undefined;

  for (const question of questions) {
    const answer = answers[question.id];
    const option = question.options.find((candidate) => candidate.value === answer);
    if (!option) continue;
    selectedTags.push(...option.tags);
    if (option.priceMax !== undefined) {
      priceMax = priceMax === undefined ? option.priceMax : Math.min(priceMax, option.priceMax);
    }
  }

  return products
    .filter((product) => priceMax === undefined || product.price <= priceMax)
    .map((product) => {
      const matchedTags = selectedTags.filter((tag) => product.useCases.includes(tag));
      return {
        product,
        matchedTags,
        matchScore: matchedTags.length * 3 + product.productScore / 20,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

```


---

## src/lib/seo/canonical.ts

```ts
import type { Store } from "@prisma/client";
import { getDeploymentHost, getDeploymentProtocol, isLiveStore } from "@/lib/stores/preview-url";

/**
 * Canonical URLs always point at the store's primary domain with clean paths
 * (never the internal /s/[storeSlug] path) once LIVE. Preview stores use the
 * deployment host with an explicit /s/[slug] prefix so each tenant has a
 * unique, honest URL while noindexed.
 */

export type StoreForCanonical = Pick<
  Store,
  "primaryDomain" | "slug" | "launchStatus" | "plannedDomain"
>;

export function getCanonicalBaseUrl(store: StoreForCanonical): string {
  if (!isLiveStore(store.launchStatus)) {
    const host = getDeploymentHost();
    const protocol = getDeploymentProtocol(host);
    return `${protocol}://${host}/s/${store.slug}`;
  }

  const domain = (store.plannedDomain ?? store.primaryDomain)
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  return `https://${domain}`;
}

export function canonicalUrl(store: StoreForCanonical, path: string): string {
  const base = getCanonicalBaseUrl(store);
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Make a possibly-relative asset URL absolute against the store domain. */
export function absoluteUrl(store: StoreForCanonical, urlOrPath: string): string {
  if (/^https?:\/\//.test(urlOrPath)) return urlOrPath;
  return canonicalUrl(store, urlOrPath);
}

```


---

## src/lib/seo/jsonld.ts

```ts
import type { ContentPage, Product, Store } from "@prisma/client";
import { absoluteUrl, canonicalUrl } from "@/lib/seo/canonical";
import { parseFaq } from "@/lib/utils/json";
import type { FaqItem, StockStatus } from "@/lib/types";

/**
 * Structured data builders.
 *
 * Honesty rules enforced here:
 * - AggregateRating is ONLY emitted when both ratingAverage and a positive
 *   ratingCount exist. We never fabricate review data.
 * - FAQPage is only built from FAQ content that is actually visible on the
 *   page (callers pass the same array they render).
 * - Availability mirrors the real stockStatus field.
 */

type JsonLd = Record<string, unknown>;

const AVAILABILITY: Record<StockStatus, string> = {
  IN_STOCK: "https://schema.org/InStock",
  LOW_STOCK: "https://schema.org/LimitedAvailability",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
  PREORDER: "https://schema.org/PreOrder",
};

export function organizationJsonLd(store: Store): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.legalName,
    url: canonicalUrl(store, "/"),
    email: store.supportEmail,
    ...(store.supportPhone ? { telephone: store.supportPhone } : {}),
  };
}

export function webSiteJsonLd(store: Store): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: store.name,
    url: canonicalUrl(store, "/"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${canonicalUrl(store, "/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function productJsonLd(
  store: Store,
  product: Product,
  galleryUrls?: string[]
): JsonLd {
  const availability =
    AVAILABILITY[product.stockStatus as StockStatus] ??
    "https://schema.org/InStock";

  const imageList = (galleryUrls?.length ? galleryUrls : [product.imageUrl]).map((url) =>
    absoluteUrl(store, url)
  );

  const jsonLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription,
    image: imageList.length === 1 ? imageList[0] : imageList,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    ...(product.gtin ? { gtin: product.gtin } : {}),
    offers: {
      "@type": "Offer",
      url: canonicalUrl(store, `/p/${product.slug}`),
      price: product.price.toFixed(2),
      priceCurrency: product.currency,
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: store.legalName },
    },
  };

  // Never emit AggregateRating without real rating data.
  if (product.ratingAverage !== null && product.ratingCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.ratingAverage,
      reviewCount: product.ratingCount,
    };
  }

  return jsonLd;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(
  store: Store,
  items: BreadcrumbItem[]
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(store, item.path),
    })),
  };
}

export function itemListJsonLd(
  store: Store,
  name: string,
  products: Product[]
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: canonicalUrl(store, `/p/${product.slug}`),
      name: product.title,
    })),
  };
}

export function articleJsonLd(store: Store, guide: ContentPage): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt,
    ...(guide.heroImageUrl
      ? { image: absoluteUrl(store, guide.heroImageUrl) }
      : {}),
    datePublished: guide.createdAt.toISOString(),
    dateModified: guide.updatedAt.toISOString(),
    author: { "@type": "Organization", name: store.name },
    publisher: { "@type": "Organization", name: store.legalName },
    mainEntityOfPage: canonicalUrl(store, `/guides/${guide.slug}`),
  };
}

/**
 * Only call this with FAQ items that are rendered visibly on the same page;
 * emitting FAQ markup for hidden content violates search guidelines.
 */
export function faqPageJsonLd(faq: FaqItem[]): JsonLd | null {
  if (faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function productFaq(product: Product): FaqItem[] {
  return parseFaq(product.faq);
}

```


---

## src/lib/seo/metadata.ts

```ts
import type { Metadata } from "next";
import type { Category, ContentPage, Product, Store } from "@prisma/client";
import { absoluteUrl, canonicalUrl, getCanonicalBaseUrl } from "@/lib/seo/canonical";
import { isLiveStore } from "@/lib/stores/preview-url";

/**
 * Centralized metadata builders. Every storefront page calls one of these so
 * titles, descriptions, canonicals, Open Graph and Twitter cards stay
 * consistent across all tenants.
 */

const FALLBACK_OG_IMAGE = "/api/placeholder?label=Store&seed=og-fallback";

interface BuildArgs {
  store: Store;
  title: string;
  description: string;
  path: string;
  ogImage?: string | null;
  ogType?: "website" | "article";
  noindex?: boolean;
}

export function buildMetadata({
  store,
  title,
  description,
  path,
  ogImage,
  ogType = "website",
  noindex = false,
}: BuildArgs): Metadata {
  const canonical = canonicalUrl(store, path);
  const image = absoluteUrl(store, ogImage || FALLBACK_OG_IMAGE);
  const shouldNoindex = noindex || !isLiveStore(store.launchStatus);

  return {
    title,
    description,
    metadataBase: new URL(getCanonicalBaseUrl(store)),
    alternates: { canonical },
    robots: shouldNoindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: store.name,
      locale: store.locale.replace("-", "_"),
      type: ogType,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function buildStoreMetadata(store: Store): Metadata {
  return buildMetadata({
    store,
    title: `${store.name} — ${store.valueProposition}`,
    description: store.positioning,
    path: "/",
  });
}

export function buildProductMetadata(store: Store, product: Product): Metadata {
  return buildMetadata({
    store,
    title: product.seoTitle || `${product.title} | ${store.name}`,
    description: product.seoDescription || product.shortDescription,
    path: `/p/${product.slug}`,
    ogImage: product.imageUrl,
    noindex: product.noindex || !product.isPublished,
  });
}

export function buildCategoryMetadata(
  store: Store,
  category: Category,
  publishedProductCount: number
): Metadata {
  // Thin categories (< 3 published products) are kept out of the index until
  // they have enough depth to be worth ranking.
  const noindex = publishedProductCount < 3;
  return buildMetadata({
    store,
    title: category.seoTitle || `${category.name} | ${store.name}`,
    description: category.seoDescription || category.description,
    path: `/c/${category.slug}`,
    noindex,
  });
}

export function buildGuideMetadata(store: Store, guide: ContentPage): Metadata {
  return buildMetadata({
    store,
    title: guide.seoTitle || `${guide.title} | ${store.name}`,
    description: guide.seoDescription || guide.excerpt,
    path: `/guides/${guide.slug}`,
    ogImage: guide.heroImageUrl,
    ogType: "article",
    noindex: guide.noindex || !guide.isPublished,
  });
}

```


---

## src/lib/seo/sitemap.ts

```ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { canonicalUrl } from "@/lib/seo/canonical";
import type { StoreWithTheme } from "@/lib/tenant/resolve-tenant";

/**
 * Builds the sitemap for a single store. Each domain serves only its own
 * store's URLs; unpublished and noindex'd pages are excluded, and categories
 * with fewer than 3 published products are excluded to mirror the noindex
 * rule applied on the page itself.
 */
export async function buildStoreSitemap(
  store: StoreWithTheme
): Promise<MetadataRoute.Sitemap> {
  const [categories, products, guides] = await Promise.all([
    prisma.category.findMany({
      where: { storeId: store.id },
      include: {
        _count: { select: { products: { where: { isPublished: true } } } },
      },
    }),
    prisma.product.findMany({
      where: { storeId: store.id, isPublished: true, noindex: false },
      select: { slug: true, updatedAt: true },
    }),
    prisma.contentPage.findMany({
      where: {
        storeId: store.id,
        type: "GUIDE",
        isPublished: true,
        noindex: false,
      },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [
    {
      url: canonicalUrl(store, "/"),
      lastModified: store.updatedAt,
      changeFrequency: "daily",
      priority: 1,
    },
    { url: canonicalUrl(store, "/compare"), changeFrequency: "weekly", priority: 0.6 },
    { url: canonicalUrl(store, "/quiz"), changeFrequency: "monthly", priority: 0.5 },
  ];

  for (const category of categories) {
    if (category._count.products < 3) continue;
    entries.push({
      url: canonicalUrl(store, `/c/${category.slug}`),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const product of products) {
    entries.push({
      url: canonicalUrl(store, `/p/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const guide of guides) {
    entries.push({
      url: canonicalUrl(store, `/guides/${guide.slug}`),
      lastModified: guide.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  for (const policy of ["shipping", "returns", "privacy", "terms"]) {
    entries.push({
      url: canonicalUrl(store, `/policies/${policy}`),
      changeFrequency: "yearly",
      priority: 0.3,
    });
  }

  return entries;
}

```


---

## src/lib/settings/store-settings.ts

```ts
import { z } from "zod";

/**
 * Per-store settings.
 *
 * Stored as a JSON-encoded string on StoreSettings.settings (SQLite has no
 * native JSON). Every field has a default, so `parseStoreSettings` always
 * returns a fully-populated object even for stores created before a field
 * existed — callers never have to null-check individual settings.
 *
 * These settings drive mass-production: SEO defaults applied to every page,
 * homepage layout, monetization targets used by the pricing/score tooling,
 * marketing pixel IDs, personalization weights, automation thresholds for
 * auto-publishing imported products, and compliance disclosures.
 */

export const HERO_VARIANTS = ["default", "video", "split"] as const;
export type HeroVariant = (typeof HERO_VARIANTS)[number];

export const HERO_VARIANT_OPTIONS = HERO_VARIANTS.map((value) => ({
  value,
  label: value,
}));

export const storeSettingsSchema = z.object({
  seo: z
    .object({
      defaultOgImage: z.string().default(""),
      googleSiteVerification: z.string().default(""),
      robotsExtraDisallow: z.array(z.string()).default([]),
      hreflangLocales: z.array(z.string()).default([]),
    })
    .default({}),
  homepage: z
    .object({
      heroVariant: z.enum(HERO_VARIANTS).default("default"),
      featuredCollectionSlug: z.string().default("featured"),
      showQuizCta: z.boolean().default(true),
      showComparisonCta: z.boolean().default(true),
      trustBarItems: z.array(z.string()).default([]),
    })
    .default({}),
  monetization: z
    .object({
      targetMarginPercent: z.number().min(0).max(95).default(35),
      minMarginPercent: z.number().min(0).max(95).default(15),
      enableCompareAtPrice: z.boolean().default(true),
      bundleDiscountPercent: z.number().min(0).max(90).default(8),
      subscriptionSkus: z.array(z.string()).default([]),
    })
    .default({}),
  marketing: z
    .object({
      metaPixelId: z.string().default(""),
      googleAdsId: z.string().default(""),
      utmDefaultSource: z.string().default(""),
    })
    .default({}),
  personalization: z
    .object({
      enabled: z.boolean().default(true),
      quizWeight: z.number().min(0).max(10).default(2),
      browseHistoryWeight: z.number().min(0).max(10).default(1),
    })
    .default({}),
  automation: z
    .object({
      autoPublishMinScore: z.number().min(0).max(100).default(70),
      autoNoindexBelowScore: z.number().min(0).max(100).default(40),
      importDefaultSupplier: z.string().default("MockSupply Co"),
      importKeywords: z.array(z.string()).default([]),
    })
    .default({}),
  compliance: z
    .object({
      showDropshipDisclosure: z.boolean().default(true),
      importTaxDisclaimer: z
        .string()
        .default(
          "Import duties or taxes may apply on delivery depending on your country."
        ),
      cookiePolicyUrl: z.string().default(""),
    })
    .default({}),
});

export type StoreSettings = z.infer<typeof storeSettingsSchema>;

/** Fully-defaulted settings, used as the base for new stores and the editor. */
export const DEFAULT_STORE_SETTINGS: StoreSettings = storeSettingsSchema.parse({});

/**
 * Parse a JSON-encoded settings string into a fully-defaulted object. Unknown
 * or malformed input degrades to defaults rather than throwing, mirroring the
 * resilience of src/lib/utils/json.ts.
 */
export function parseStoreSettings(raw: string | null | undefined): StoreSettings {
  if (!raw) return DEFAULT_STORE_SETTINGS;
  try {
    const parsed = storeSettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_STORE_SETTINGS;
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export function serializeStoreSettings(settings: StoreSettings): string {
  return JSON.stringify(settings);
}

```


---

## src/lib/storage/local-storage-provider.ts

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import type { PutObjectInput, StorageProvider, StoredObject } from "@/lib/storage/types";

const UPLOAD_PREFIX = "/uploads/dev-media";

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local" as const;
  private readonly rootDir: string;

  constructor(rootDir = path.join(process.cwd(), "public", "uploads", "dev-media")) {
    this.rootDir = rootDir;
  }

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    const key = sanitizeKey(input.key);
    const fullPath = path.join(this.rootDir, key);
    if (!fullPath.startsWith(this.rootDir)) {
      throw new Error("Invalid storage key.");
    }

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, input.body);

    return { key, url: this.publicUrl(key) };
  }

  async existsByHash(hash: string): Promise<StoredObject | null> {
    const safeHash = hash.replace(/[^a-f0-9]/gi, "");
    if (!safeHash) return null;
    const hit = await findFileByPrefix(this.rootDir, safeHash).catch(() => null);
    return hit ? { key: hit, url: this.publicUrl(hit) } : null;
  }

  publicUrl(key: string): string {
    return `${UPLOAD_PREFIX}/${sanitizeKey(key)}`;
  }
}

function sanitizeKey(key: string): string {
  return key
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

async function findFileByPrefix(rootDir: string, prefix: string): Promise<string | null> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      const child = await findFileByPrefix(fullPath, prefix);
      if (child) return path.join(entry.name, child).replace(/\\/g, "/");
    } else if (entry.name.startsWith(prefix)) {
      return entry.name;
    }
  }
  return null;
}

```


---

## src/lib/storage/storage-provider.ts

```ts
import { LocalStorageProvider } from "@/lib/storage/local-storage-provider";
import type { StorageProvider } from "@/lib/storage/types";
import { VercelBlobStorageProvider } from "@/lib/storage/vercel-blob-provider";

export function getStorageProvider(): StorageProvider {
  const requested = process.env.MEDIA_STORAGE_PROVIDER;
  const hasBlobAuth = Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      process.env.VERCEL_OIDC_TOKEN?.trim() ||
      process.env.VERCEL
  );

  if (requested === "vercel-blob" || (!requested && hasBlobAuth)) {
    return new VercelBlobStorageProvider();
  }

  if (process.env.NODE_ENV === "production" && requested !== "local") {
    throw new Error(
      "Production media ingestion requires Vercel Blob auth or MEDIA_STORAGE_PROVIDER=local."
    );
  }

  return new LocalStorageProvider();
}

```


---

## src/lib/storage/types.ts

```ts
export interface PutObjectInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface StoredObject {
  url: string;
  key: string;
}

export interface StorageProvider {
  readonly name: "local" | "vercel-blob";
  putObject(input: PutObjectInput): Promise<StoredObject>;
  existsByHash(hash: string): Promise<StoredObject | null>;
  publicUrl(key: string): string;
}

```


---

## src/lib/storage/vercel-blob-provider.ts

```ts
import { list, put } from "@vercel/blob";
import type { PutObjectInput, StorageProvider, StoredObject } from "@/lib/storage/types";

type BlobAuthOptions = {
  token?: string;
  oidcToken?: string;
  storeId?: string;
};

export class VercelBlobStorageProvider implements StorageProvider {
  readonly name = "vercel-blob" as const;
  private readonly authOptions: BlobAuthOptions;

  constructor(authOptions = getVercelBlobAuthOptions()) {
    if (!hasVercelBlobAuth()) {
      throw new Error(
        "Vercel Blob storage requires BLOB_READ_WRITE_TOKEN, VERCEL_OIDC_TOKEN, or a Vercel runtime."
      );
    }
    this.authOptions = authOptions;
  }

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    const blob = await put(input.key, input.body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: input.contentType,
      ...this.authOptions,
    });

    return { key: input.key, url: blob.url };
  }

  async existsByHash(hash: string): Promise<StoredObject | null> {
    const result = await list({
      prefix: `media/${hash}`,
      limit: 1,
      ...this.authOptions,
    });
    const blob = result.blobs[0];
    return blob ? { key: blob.pathname, url: blob.url } : null;
  }

  publicUrl(key: string): string {
    const storeId = process.env.BLOB_STORE_ID?.trim().replace(/^store_/, "");
    if (storeId) {
      return `https://${storeId}.public.blob.vercel-storage.com/${key}`;
    }
    return key;
  }
}

export function getVercelBlobAuthOptions(): BlobAuthOptions {
  const token = ***REDACTED***
  if (token) return { token };

  const oidcToken = ***REDACTED***
  const storeId = process.env.BLOB_STORE_ID?.trim();
  return {
    ...(oidcToken ? { oidcToken } : {}),
    ...(storeId ? { storeId } : {}),
  };
}

export function hasVercelBlobAuth(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      process.env.VERCEL_OIDC_TOKEN?.trim() ||
      process.env.VERCEL
  );
}

```


---

## src/lib/stores/create-from-blueprint.ts

```ts
import { prisma } from "@/lib/db";
import type { StoreBlueprint, StoreBlueprintInput } from "@/lib/ai/types";
import { generateBuyingGuideOutline } from "@/lib/ai/store-blueprint";
import {
  defaultPrivacyPolicy,
  defaultTermsOfSale,
  type SeedStoreInfo,
} from "../../../prisma/seed-data/types";
import { importProductsForStore } from "@/lib/suppliers/import-products";
import { resolveLocaleCurrency } from "@/lib/stores/locale-defaults";
import {
  getStorePreviewUrl,
  getStoreQueryPreviewUrl,
} from "@/lib/stores/preview-url";
import {
  DEFAULT_STORE_SETTINGS,
  serializeStoreSettings,
  type StoreSettings,
} from "@/lib/settings/store-settings";

export interface CreateStoreFromBlueprintOptions {
  blueprint: StoreBlueprint;
  input: StoreBlueprintInput;
  /** Import mock supplier products into each category. Default true. */
  importProducts?: boolean;
  /** Publish imported products that meet the auto-publish score threshold. */
  autoPublishScored?: boolean;
}

export interface CreateStoreFromBlueprintResult {
  storeSlug: string;
  storeName: string;
  previewUrl: string;
  previewQueryUrl: string;
  plannedDomain: string | null;
  launchStatus: "PREVIEW";
  categoriesCreated: number;
  productsImported: number;
  productsPublished: number;
  guidesCreated: number;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || "store";
  let suffix = 2;
  while (await prisma.store.findUnique({ where: { slug } })) {
    slug = `${slugify(base).slice(0, 40)}-${suffix++}`;
  }
  return slug;
}

function normalizeDomain(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

function buildStoreSettings(
  blueprint: StoreBlueprint,
  input: StoreBlueprintInput
): StoreSettings {
  return {
    ...DEFAULT_STORE_SETTINGS,
    homepage: {
      ...DEFAULT_STORE_SETTINGS.homepage,
      showQuizCta: true,
      showComparisonCta: blueprint.categories.length >= 2,
      trustBarItems: blueprint.homepageSections
        .filter((section) => section.toLowerCase().includes("trust"))
        .slice(0, 3),
    },
    automation: {
      ...DEFAULT_STORE_SETTINGS.automation,
      importKeywords: blueprint.productImportQueries,
      importDefaultSupplier: "MockSupply Co",
    },
    compliance: {
      ...DEFAULT_STORE_SETTINGS.compliance,
      showDropshipDisclosure: true,
      importTaxDisclaimer: `Import duties or taxes may apply on delivery in ${input.country}.`,
    },
  };
}

function storeInfoForPolicies(
  slug: string,
  blueprint: StoreBlueprint,
  input: StoreBlueprintInput,
  plannedDomain: string | null,
  locale: string,
  currency: string
): SeedStoreInfo {
  const primaryDomain = plannedDomain ?? `${slug}.preview.example`;
  const supportDomain = plannedDomain ?? `${slug}.preview.example`;
  return {
    slug,
    name: blueprint.brandName,
    legalName: `${blueprint.brandName} (Preview)`,
    primaryDomain,
    locale,
    currency,
    niche: input.niche,
    positioning: blueprint.tagline,
    audience: input.audience,
    valueProposition: blueprint.tagline,
    brandVoice: input.brandVoice,
    logoText: blueprint.brandName.slice(0, 24),
    supportEmail: `support@${supportDomain}`,
    shippingOriginDisclosure: blueprint.shippingDisclosure,
    defaultShippingDaysMin: 5,
    defaultShippingDaysMax: 14,
    returnPolicySummary:
      "Return within 30 days of delivery if the item is unused and in original packaging. Contact support to start a return.",
  };
}

/**
 * Persist a generated blueprint as a real tenant: store, theme, settings,
 * categories, optional product import, FAQ and a starter buying guide.
 * New stores launch in PREVIEW mode (noindex) until a production domain is connected.
 */
export async function createStoreFromBlueprint(
  options: CreateStoreFromBlueprintOptions
): Promise<CreateStoreFromBlueprintResult> {
  const { blueprint, input } = options;
  const importProducts = options.importProducts ?? true;
  const autoPublishScored = options.autoPublishScored ?? true;

  const storeSlug = await ensureUniqueSlug(blueprint.storeSlug);
  const plannedDomain = normalizeDomain(input.domain);
  const { locale, currency } = resolveLocaleCurrency(input.locale, input.country);
  const policyInfo = storeInfoForPolicies(
    storeSlug,
    blueprint,
    input,
    plannedDomain,
    locale,
    currency
  );

  const categories = blueprint.categories.slice(0, 4);
  if (categories.length === 0) {
    categories.push({
      slug: slugify(input.niche) || "catalog",
      name: input.niche,
      description: blueprint.tagline,
    });
  }

  const store = await prisma.store.create({
    data: {
      slug: storeSlug,
      name: blueprint.brandName,
      legalName: policyInfo.legalName,
      primaryDomain: policyInfo.primaryDomain,
      plannedDomain,
      launchStatus: "PREVIEW",
      locale,
      currency,
      niche: input.niche,
      positioning: blueprint.tagline,
      audience: input.audience,
      valueProposition: blueprint.tagline,
      brandVoice: input.brandVoice,
      logoText: policyInfo.logoText,
      supportEmail: policyInfo.supportEmail,
      shippingOriginDisclosure: blueprint.shippingDisclosure,
      defaultShippingDaysMin: 5,
      defaultShippingDaysMax: 14,
      returnPolicySummary: policyInfo.returnPolicySummary,
      privacyPolicy: defaultPrivacyPolicy(policyInfo),
      termsOfSale: defaultTermsOfSale(policyInfo),
      isActive: true,
      theme: {
        create: {
          primaryColor: blueprint.themeColors.primary,
          secondaryColor: blueprint.themeColors.secondary,
          accentColor: blueprint.themeColors.accent,
          backgroundColor: blueprint.themeColors.background,
          textColor: blueprint.themeColors.text,
          borderRadius: "0.75rem",
          fontHeading: locale.startsWith("nb") ? "humanist" : "system-ui",
          fontBody: "system-ui",
        },
      },
      settings: {
        create: {
          settings: serializeStoreSettings(buildStoreSettings(blueprint, input)),
        },
      },
      domains: {
        create: [
          ...(plannedDomain
            ? [{ hostname: plannedDomain, isPrimary: true }]
            : []),
          ...(plannedDomain
            ? [{ hostname: `www.${plannedDomain}`, isPrimary: false }]
            : []),
        ],
      },
    },
  });

  let productsImported = 0;
  let productsPublished = 0;

  for (let index = 0; index < categories.length; index++) {
    const categorySeed = categories[index];
    const category = await prisma.category.create({
      data: {
        storeId: store.id,
        slug: categorySeed.slug,
        name: categorySeed.name,
        description: categorySeed.description,
        seoTitle: `${categorySeed.name} | ${blueprint.brandName}`,
        seoDescription: categorySeed.description.slice(0, 155),
        heroTitle: categorySeed.name,
        heroSubtitle: categorySeed.description.slice(0, 120),
        sortOrder: index,
      },
    });

    if (importProducts) {
      const query =
        blueprint.productImportQueries[index] ??
        blueprint.productImportQueries[0] ??
        categorySeed.name;
      const imported = await importProductsForStore({
        storeSlug: store.slug,
        categorySlug: category.slug,
        query,
        targetMargin: 0.35,
      });
      productsImported += imported.imported;

      if (autoPublishScored && imported.imported > 0) {
        const settings = buildStoreSettings(blueprint, input);
        const threshold = settings.automation.autoPublishMinScore;
        const publishResult = await prisma.product.updateMany({
          where: {
            storeId: store.id,
            categoryId: category.id,
            productScore: { gte: threshold },
            qualityStatus: "READY",
            mediaStatus: "OK",
          },
          data: { isPublished: true, noindex: false },
        });
        productsPublished += publishResult.count;
      }
    }
  }

  const faqBody = JSON.stringify(
    blueprint.faqIdeas.slice(0, 8).map((question) => ({
      question,
      answer: blueprint.shippingDisclosure,
    }))
  );

  await prisma.contentPage.create({
    data: {
      storeId: store.id,
      slug: "faq",
      type: "FAQ",
      title: `${blueprint.brandName} — FAQ`,
      excerpt: `Common questions about ${input.niche}, shipping and returns.`,
      body: faqBody,
      seoTitle: `FAQ | ${blueprint.brandName}`,
      seoDescription: blueprint.seoDescription.slice(0, 155),
      isPublished: true,
      noindex: true,
    },
  });

  let guidesCreated = 0;
  const guideTopic = blueprint.guideIdeas[0] ?? `How to choose ${input.niche}`;
  const outline = await generateBuyingGuideOutline({
    niche: input.niche,
    topic: guideTopic,
    audience: input.audience,
  });

  const guideBody = [
    `## ${outline.directAnswer}`,
    "",
    outline.sections
      .map(
        (section) =>
          `## ${section.heading}\n\n${section.points.map((point) => `- ${point}`).join("\n")}`
      )
      .join("\n\n"),
    "",
    "## Shipping & returns",
    "",
    blueprint.shippingDisclosure,
    "",
    blueprint.trustCopy,
  ].join("\n");

  await prisma.contentPage.create({
    data: {
      storeId: store.id,
      slug: outline.slug || slugify(guideTopic),
      type: "GUIDE",
      title: outline.title,
      excerpt: outline.directAnswer,
      body: guideBody,
      seoTitle: `${outline.title} | ${blueprint.brandName}`,
      seoDescription: outline.directAnswer.slice(0, 155),
      heroImageUrl: `/api/placeholder?label=${encodeURIComponent(blueprint.brandName)}&seed=guide`,
      relatedProductIds: "[]",
      isPublished: true,
      noindex: true,
    },
  });
  guidesCreated += 1;

  const topProducts = await prisma.product.findMany({
    where: { storeId: store.id, isPublished: true },
    orderBy: { productScore: "desc" },
    take: 4,
    select: { id: true },
  });

  if (topProducts.length > 0) {
    await prisma.collection.create({
      data: {
        storeId: store.id,
        slug: "featured",
        title: "Featured picks",
        description: `Top-scoring ${input.niche} products at ${blueprint.brandName}.`,
        productIds: JSON.stringify(topProducts.map((product) => product.id)),
        seoTitle: `Featured | ${blueprint.brandName}`,
        seoDescription: blueprint.seoDescription.slice(0, 155),
      },
    });
  }

  return {
    storeSlug: store.slug,
    storeName: store.name,
    previewUrl: getStorePreviewUrl(store.slug),
    previewQueryUrl: getStoreQueryPreviewUrl(store.slug),
    plannedDomain,
    launchStatus: "PREVIEW",
    categoriesCreated: categories.length,
    productsImported,
    productsPublished,
    guidesCreated,
  };
}

```


---

## src/lib/stores/locale-defaults.ts

```ts
/** Map generator country input to store locale + currency defaults. */

const COUNTRY_DEFAULTS: Record<string, { locale: string; currency: string }> = {
  norway: { locale: "nb-NO", currency: "NOK" },
  norge: { locale: "nb-NO", currency: "NOK" },
  "united states": { locale: "en-US", currency: "USD" },
  usa: { locale: "en-US", currency: "USD" },
  "united kingdom": { locale: "en-GB", currency: "GBP" },
  uk: { locale: "en-GB", currency: "GBP" },
  germany: { locale: "de-DE", currency: "EUR" },
  sweden: { locale: "sv-SE", currency: "SEK" },
  denmark: { locale: "da-DK", currency: "DKK" },
};

export function resolveLocaleCurrency(
  localeInput: string,
  countryInput: string
): { locale: string; currency: string } {
  const countryKey = countryInput.trim().toLowerCase();
  const fromCountry = COUNTRY_DEFAULTS[countryKey];
  if (fromCountry) return fromCountry;

  if (localeInput.trim()) {
    const locale = localeInput.trim();
    const currency =
      locale.startsWith("nb") || locale.startsWith("no")
        ? "NOK"
        : locale.startsWith("en-GB")
          ? "GBP"
          : locale.startsWith("de")
            ? "EUR"
            : "USD";
    return { locale, currency };
  }

  return { locale: "en-US", currency: "USD" };
}

```


---

## src/lib/stores/preview-url.ts

```ts
/**
 * Preview URL helpers for stores that are not yet on their planned production domain.
 * On Vercel, all preview stores share the deployment host and are reached via /s/[slug].
 */

export function getDeploymentHost(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "") ??
    process.env.VERCEL_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "") ??
    "localhost:3000";
  return fromEnv;
}

export function getDeploymentProtocol(host = getDeploymentHost()): "http" | "https" {
  return host.includes("localhost") ? "http" : "https";
}

/** Direct internal path — always works on any deployment host. */
export function getStorePreviewPath(slug: string): string {
  return `/s/${slug}`;
}

export function getStorePreviewUrl(slug: string): string {
  const host = getDeploymentHost();
  const protocol = getDeploymentProtocol(host);
  return `${protocol}://${host}${getStorePreviewPath(slug)}`;
}

/** Clean URL with ?store= — sets the tenant cookie via middleware. */
export function getStoreQueryPreviewUrl(slug: string): string {
  const host = getDeploymentHost();
  const protocol = getDeploymentProtocol(host);
  return `${protocol}://${host}/?store=${encodeURIComponent(slug)}`;
}

export type LaunchStatus = "DRAFT" | "PREVIEW" | "LIVE";

export function isLiveStore(launchStatus: string): boolean {
  return launchStatus === "LIVE";
}

export function launchStatusLabel(launchStatus: string): string {
  switch (launchStatus) {
    case "LIVE":
      return "Live";
    case "DRAFT":
      return "Draft";
    default:
      return "Preview";
  }
}

```


---

## src/lib/stores/queries.ts

```ts
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStoreBySlug, type StoreWithTheme } from "@/lib/tenant/resolve-tenant";
import { parseStringArray } from "@/lib/utils/json";
import type { ClientProduct } from "@/lib/types";
import type { Product } from "@prisma/client";

/**
 * Data access layer for storefront pages. All queries are store-scoped so a
 * tenant can never leak another tenant's data, and wrapped in React cache()
 * to dedupe within a single render.
 */

export const requireStore = cache(async (slug: string): Promise<StoreWithTheme> => {
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  return store;
});

export const getCategories = cache(async (storeId: string) => {
  return prisma.category.findMany({
    where: { storeId },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: { where: { isPublished: true } } } },
    },
  });
});

export const getCategoryWithProducts = cache(
  async (storeId: string, slug: string) => {
    return prisma.category.findUnique({
      where: { storeId_slug: { storeId, slug } },
      include: {
        products: {
          where: { isPublished: true },
          orderBy: { productScore: "desc" },
        },
      },
    });
  }
);

export const getProductBySlug = cache(async (storeId: string, slug: string) => {
  return prisma.product.findUnique({
    where: { storeId_slug: { storeId, slug } },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
});

export const getFeaturedProducts = cache(
  async (storeId: string, limit = 8) => {
    return prisma.product.findMany({
      where: { storeId, isPublished: true },
      orderBy: { productScore: "desc" },
      take: limit,
    });
  }
);

export const getRelatedProducts = cache(
  async (storeId: string, categoryId: string, excludeProductId: string, limit = 4) => {
    const sameCategory = await prisma.product.findMany({
      where: {
        storeId,
        categoryId,
        isPublished: true,
        id: { not: excludeProductId },
      },
      orderBy: { productScore: "desc" },
      take: limit,
    });
    if (sameCategory.length >= limit) return sameCategory;

    const filler = await prisma.product.findMany({
      where: {
        storeId,
        isPublished: true,
        id: { notIn: [excludeProductId, ...sameCategory.map((product) => product.id)] },
      },
      orderBy: { productScore: "desc" },
      take: limit - sameCategory.length,
    });
    return [...sameCategory, ...filler];
  }
);

export const getGuides = cache(async (storeId: string) => {
  return prisma.contentPage.findMany({
    where: { storeId, type: "GUIDE", isPublished: true },
    orderBy: { createdAt: "asc" },
  });
});

export const getGuideBySlug = cache(async (storeId: string, slug: string) => {
  return prisma.contentPage.findUnique({
    where: { storeId_slug: { storeId, slug } },
  });
});

export const getComparisonPage = cache(async (storeId: string) => {
  return prisma.contentPage.findFirst({
    where: { storeId, type: "COMPARISON", isPublished: true },
  });
});

export const getHomepageFaq = cache(async (storeId: string) => {
  return prisma.contentPage.findFirst({
    where: { storeId, type: "FAQ", isPublished: true },
  });
});

export const getProductsByIds = cache(
  async (storeId: string, ids: string[]) => {
    if (ids.length === 0) return [];
    const products = await prisma.product.findMany({
      where: { storeId, id: { in: ids }, isPublished: true },
    });
    // Preserve the order of the ids array.
    const byId = new Map(products.map((product) => [product.id, product]));
    return ids
      .map((id) => byId.get(id))
      .filter((product): product is Product => Boolean(product));
  }
);

export async function searchProducts(storeId: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return prisma.product.findMany({
    where: {
      storeId,
      isPublished: true,
      OR: [
        { title: { contains: trimmed } },
        { description: { contains: trimmed } },
        { brand: { contains: trimmed } },
        { subtitle: { contains: trimmed } },
      ],
    },
    orderBy: { productScore: "desc" },
    take: 24,
  });
}

/** Strip server-only fields (cost, margin) before sending to the client. */
export function toClientProduct(product: Product): ClientProduct {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle: product.subtitle,
    brand: product.brand,
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currency: product.currency,
    stockStatus: product.stockStatus,
    shippingDaysMin: product.shippingDaysMin,
    shippingDaysMax: product.shippingDaysMax,
    countryOfOrigin: product.countryOfOrigin,
    useCases: parseStringArray(product.useCases),
    productScore: product.productScore,
    fulfillmentMode: product.fulfillmentMode,
    affiliateUrl: product.affiliateUrl,
    providerKey: product.providerKey,
    checkoutAvailable: checkoutAvailableForProduct(product),
  };
}

function checkoutAvailableForProduct(product: Product): boolean {
  if (product.fulfillmentMode === "AFFILIATE") return false;
  if (product.fulfillmentMode === "MOCK") return true;
  if (product.fulfillmentMode === "MANUAL") {
    return process.env.MANUAL_FULFILLMENT_ENABLED === "true";
  }
  if (product.fulfillmentMode !== "DROPSHIP") return false;
  if (!product.externalId) return false;

  switch (product.providerKey) {
    case "cj":
      return (
        process.env.CJ_ENABLED === "true" &&
        process.env.CJ_ORDER_API_ENABLED === "true" &&
        Boolean(process.env.CJ_LOGISTIC_NAME) &&
        Boolean(process.env.CJ_FROM_COUNTRY_CODE)
      );
    case "mock":
      return true;
    default:
      return false;
  }
}

```


---

## src/lib/suppliers/aliexpress/api-client.ts

```ts
import crypto from "node:crypto";

const API_URL = process.env.ALIEXPRESS_API_URL ?? "https://api-sg.aliexpress.com/sync";

export interface AliExpressApiProduct {
  productId: string;
  title: string;
  salePrice: string;
  imageUrl: string;
  galleryUrls: string[];
  productUrl: string;
}

export function isAliExpressApiConfigured(): boolean {
  return Boolean(process.env.ALIEXPRESS_APP_KEY && process.env.ALIEXPRESS_APP_SECRET);
}

function signParams(params: Record<string, string>, appSecret: ***REDACTED***
  const sortedKeys = Object.keys(params).sort();
  const concatenated = sortedKeys.map((key) => `${key}${params[key]}`).join("");
  const payload = `${appSecret}${concatenated}${appSecret}`;
  return crypto.createHash("md5").update(payload, "utf8").digest("hex").toUpperCase();
}

function timestampGmt8(): string {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Shanghai", hour12: false })
    .replace("T", " ");
}

async function callAliExpressApi(
  method: string,
  businessParams: Record<string, string>
): Promise<unknown> {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = ***REDACTED***
  if (!appKey || !appSecret) {
    throw new Error("ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET are required");
  }

  const payload: Record<string, string> = {
    method,
    app_key: appKey,
    sign_method: "md5",
    timestamp: timestampGmt8(),
    format: "json",
    v: "2.0",
    ...businessParams,
  };

  payload.sign = signParams(payload, appSecret);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams(payload),
  });

  if (!response.ok) {
    throw new Error(`AliExpress API HTTP ${response.status}`);
  }

  return response.json();
}

function parseGallery(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string" && item.startsWith("http"));
  }
  if (typeof raw === "string") {
    return raw
      .split(/[;,]/)
      .map((part) => part.trim())
      .filter((part) => part.startsWith("http"));
  }
  return [];
}

function mapProduct(item: Record<string, unknown>): AliExpressApiProduct | null {
  const productId = String(item.product_id ?? item.productId ?? "");
  const title = String(item.product_title ?? item.title ?? "");
  const imageUrl = String(
    item.product_main_image_url ?? item.product_main_image ?? item.image_url ?? ""
  );
  if (!productId || !imageUrl) return null;

  const galleryUrls = [
    imageUrl,
    ...parseGallery(item.product_small_image_urls),
    ...parseGallery(item.product_video_url),
  ].filter(Boolean);

  return {
    productId,
    title,
    salePrice: String(item.sale_price ?? item.target_sale_price ?? ""),
    imageUrl,
    galleryUrls: [...new Set(galleryUrls)],
    productUrl: String(
      item.product_detail_url ??
        item.promotion_link ??
        `https://www.aliexpress.com/item/${productId}.html`
    ),
  };
}

export async function searchAliExpressProductsApi(
  keywords: string,
  pageSize = 5
): Promise<AliExpressApiProduct[]> {
  const trackingId = process.env.ALIEXPRESS_TRACKING_ID;
  const data = (await callAliExpressApi("aliexpress.affiliate.product.query", {
    keywords,
    page_no: "1",
    page_size: String(pageSize),
    target_currency: "USD",
    target_language: "EN",
    ship_to_country: "US",
    ...(trackingId ? { tracking_id: trackingId } : {}),
  })) as Record<string, unknown>;

  const response =
    (data.aliexpress_affiliate_product_query_response as Record<string, unknown> | undefined) ??
    (data as Record<string, unknown>);
  const result = (response.resp_result as Record<string, unknown> | undefined) ?? response;
  const productsContainer = result.result as Record<string, unknown> | undefined;
  const products = productsContainer?.products as Record<string, unknown> | undefined;
  const list = products?.product;

  const items = Array.isArray(list) ? list : list ? [list] : [];
  return items
    .map((item) => mapProduct(item as Record<string, unknown>))
    .filter((item): item is AliExpressApiProduct => item !== null);
}

export async function getAliExpressProductDetailApi(
  productId: string
): Promise<AliExpressApiProduct | null> {
  const trackingId = process.env.ALIEXPRESS_TRACKING_ID;
  const data = (await callAliExpressApi("aliexpress.affiliate.productdetail.get", {
    product_ids: productId,
    target_currency: "USD",
    target_language: "EN",
    ...(trackingId ? { tracking_id: trackingId } : {}),
  })) as Record<string, unknown>;

  const response =
    (data.aliexpress_affiliate_productdetail_get_response as Record<string, unknown> | undefined) ??
    (data as Record<string, unknown>);
  const result = (response.resp_result as Record<string, unknown> | undefined) ?? response;
  const productsContainer = result.result as Record<string, unknown> | undefined;
  const products = productsContainer?.products as Record<string, unknown> | undefined;
  const list = products?.product;
  const item = Array.isArray(list) ? list[0] : list;
  if (!item || typeof item !== "object") return null;
  return mapProduct(item as Record<string, unknown>);
}

```


---

## src/lib/suppliers/aliexpress/find-images.ts

```ts
import {
  getAliExpressProductDetailApi,
  isAliExpressApiConfigured,
  searchAliExpressProductsApi,
} from "@/lib/suppliers/aliexpress/api-client";

export interface SupplierImageSearchResult {
  listingUrl: string | null;
  imageUrls: string[];
  productId: string | null;
  provider: "aliexpress-api";
}

/** Official AliExpress API image lookup only. No reader/scraping fallback. */
export async function findSupplierImages(
  query: string,
  options?: { productId?: string | null }
): Promise<SupplierImageSearchResult> {
  if (!isAliExpressApiConfigured()) {
    return { listingUrl: null, imageUrls: [], productId: null, provider: "aliexpress-api" };
  }

  if (options?.productId) {
    const detail = await getAliExpressProductDetailApi(options.productId);
    if (detail && detail.galleryUrls.length > 0) {
      return {
        listingUrl: detail.productUrl,
        imageUrls: detail.galleryUrls.slice(0, 6),
        productId: detail.productId,
        provider: "aliexpress-api",
      };
    }
  }

  const results = await searchAliExpressProductsApi(query, 3);
  const best = results[0];
  if (!best) {
    return { listingUrl: null, imageUrls: [], productId: null, provider: "aliexpress-api" };
  }

  const detail = await getAliExpressProductDetailApi(best.productId);
  const gallery = detail?.galleryUrls.length ? detail.galleryUrls : best.galleryUrls;
  return {
    listingUrl: best.productUrl,
    imageUrls: gallery.slice(0, 6),
    productId: best.productId,
    provider: "aliexpress-api",
  };
}


```


---

## src/lib/suppliers/catalog/discover-products.ts

```ts
import { discoverProductsForStore, type DiscoverProductsForStoreInput } from "@/lib/catalog/candidate-service";

export { discoverProductsForStore };
export type { DiscoverProductsForStoreInput };


```


---

## src/lib/suppliers/catalog/enrich-candidate.ts

```ts
import { prisma } from "@/lib/db";
import { ingestProductMedia } from "@/lib/media/ingest-product-media";
import { upsertCandidateFromResult } from "@/lib/catalog/candidate-service";
import { getCommerceProvider } from "@/lib/suppliers/providers/registry";

export async function enrichCandidate(candidateId: string): Promise<void> {
  const candidate = await prisma.productCandidate.findUnique({ where: { id: candidateId } });
  if (!candidate) throw new Error(`Unknown candidate: ${candidateId}`);
  const provider = getCommerceProvider(candidate.providerKey);
  const details = await provider.getProductDetails({
    externalId: candidate.externalId,
    sourceUrl: candidate.sourceUrl ?? undefined,
  });
  const updated = await upsertCandidateFromResult({
    storeId: candidate.storeId,
    categoryId: candidate.categoryId ?? undefined,
    providerKey: provider.key,
    result: details,
    providerReliability: 0.75,
  });
  if (details.media.length > 0) {
    await ingestProductMedia({
      candidateId: updated.id,
      providerKey: provider.key,
      externalId: details.externalId,
      title: details.title,
      media: details.media,
    });
  }
}


```


---

## src/lib/suppliers/catalog/import-candidate.ts

```ts
export {
  approveCandidate,
  importApprovedCandidates,
  importCandidateToProduct,
  rejectCandidate,
} from "@/lib/catalog/candidate-service";


```


---

## src/lib/suppliers/catalog/provider-health.ts

```ts
import { getCommerceProviders, syncProviderRegistryToDb } from "@/lib/suppliers/providers/registry";

export async function getProviderHealthReport() {
  await syncProviderRegistryToDb();
  return Promise.all(getCommerceProviders().map((provider) => provider.getHealth()));
}


```


---

## src/lib/suppliers/catalog/score-candidate.ts

```ts
import type { ProductSearchResult } from "@/lib/suppliers/providers/types";

export interface CandidateScoreResult {
  score: number;
  marginPercent: number | null;
  signals: Record<string, unknown>;
}

export function scoreCandidate(input: {
  result: ProductSearchResult;
  providerReliability: number;
  existingTitles?: string[];
}): CandidateScoreResult {
  const { result } = input;
  const marginPercent = estimateMarginPercent(result);
  const avgShipping =
    result.shippingDaysMin != null && result.shippingDaysMax != null
      ? (result.shippingDaysMin + result.shippingDaysMax) / 2
      : null;

  const marginScore = marginPercent == null ? 0.45 : clamp01(marginPercent / 45);
  const shippingScore = avgShipping == null ? 0 : clamp01(1 - (avgShipping - 4) / 20);
  const mediaScore = clamp01(result.media.filter((media) => media.mediaType === "IMAGE").length / 4);
  const completenessScore = completeness(result);
  const stockScore = result.stockStatus === "IN_STOCK" ? 1 : result.stockStatus === "LOW_STOCK" ? 0.6 : result.stockStatus === "UNKNOWN" ? 0.35 : 0;
  const uniquenessScore = estimateUniqueness(result.title, input.existingTitles ?? []);

  const total =
    marginScore * 22 +
    shippingScore * 16 +
    clamp01(input.providerReliability) * 14 +
    mediaScore * 16 +
    completenessScore * 16 +
    stockScore * 8 +
    uniquenessScore * 4 +
    0.5 * 4;

  return {
    score: Math.round(total * 10) / 10,
    marginPercent,
    signals: {
      marginScore,
      shippingScore,
      mediaScore,
      completenessScore,
      stockScore,
      uniquenessScore,
      seoPotential: "placeholder",
      sourceSignals: result.signals,
    },
  };
}

function estimateMarginPercent(result: ProductSearchResult): number | null {
  if (!result.price || result.supplierCost == null) return null;
  const shippingCost = result.shippingCost ?? 0;
  return Math.round(((result.price - result.supplierCost - shippingCost) / result.price) * 1000) / 10;
}

function completeness(result: ProductSearchResult): number {
  let points = 0;
  if (result.title.length > 10) points += 1;
  if ((result.description?.length ?? 0) > 80) points += 1;
  if (result.specs.length >= 2) points += 1;
  if (result.sourceUrl) points += 1;
  if (result.price && result.currency) points += 1;
  if (result.shippingDaysMin != null && result.shippingDaysMax != null) points += 1;
  return clamp01(points / 6);
}

function estimateUniqueness(title: string, existingTitles: string[]): number {
  const normalized = new Set(title.toLowerCase().split(/\W+/).filter((word) => word.length > 3));
  if (normalized.size === 0 || existingTitles.length === 0) return 0.75;
  const bestOverlap = existingTitles.reduce((best, existing) => {
    const words = existing.toLowerCase().split(/\W+/).filter((word) => normalized.has(word));
    return Math.max(best, words.length / normalized.size);
  }, 0);
  return clamp01(1 - bestOverlap);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}


```


---

## src/lib/suppliers/import-products.ts

```ts
import { prisma } from "@/lib/db";
import {
  approveCandidate,
  discoverProductsForStore,
  importCandidateToProduct,
} from "@/lib/catalog/candidate-service";
import type { SupplierAdapter } from "@/lib/suppliers/types";

/**
 * Compatibility wrapper for the old generator/admin flow.
 *
 * Supplier search now writes ProductCandidate rows first. This wrapper uses
 * the mock commerce provider, approves enriched candidates and imports them as
 * unpublished/noindex Product drafts so existing generator code keeps working.
 */

export interface ImportResult {
  imported: number;
  skipped: number;
  slugs: string[];
}

export async function importProductsForStore(options: {
  storeSlug: string;
  categorySlug: string;
  query: string;
  adapter?: SupplierAdapter;
  targetMargin?: number;
}): Promise<ImportResult> {
  void options.adapter;
  void options.targetMargin;

  const store = await prisma.store.findUnique({
    where: { slug: options.storeSlug },
  });
  if (!store) throw new Error(`Unknown store: ${options.storeSlug}`);

  const category = await prisma.category.findUnique({
    where: { storeId_slug: { storeId: store.id, slug: options.categorySlug } },
  });
  if (!category) {
    throw new Error(`Unknown category: ${options.categorySlug}`);
  }

  await discoverProductsForStore({
    storeId: store.id,
    categoryId: category.id,
    providerKey: "mock",
    query: options.query,
    limit: 8,
  });

  const candidates = await prisma.productCandidate.findMany({
    where: {
      storeId: store.id,
      categoryId: category.id,
      providerKey: "mock",
      status: "ENRICHED",
      importedProductId: null,
    },
    orderBy: { score: "desc" },
    take: 8,
  });

  const result: ImportResult = { imported: 0, skipped: 0, slugs: [] };
  for (const candidate of candidates) {
    await approveCandidate(candidate.id);
    const productId = await importCandidateToProduct(candidate.id);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { slug: true },
    });
    if (product) {
      result.imported += 1;
      result.slugs.push(product.slug);
    }
  }

  result.skipped = Math.max(0, candidates.length - result.imported);
  return result;
}


```


---

## src/lib/suppliers/mock-supplier.ts

```ts
import type {
  LandedCost,
  NormalizedSupplierProduct,
  RawSupplierProduct,
  ShippingEstimate,
  SupplierAdapter,
} from "@/lib/suppliers/types";
import { resolveProductImages } from "@/lib/images/resolve-product-images";

/**
 * Deterministic mock supplier used for local development and tests.
 * Swap in a real adapter (same interface) to integrate an actual supplier
 * API without touching the import pipeline or storefront.
 */

const MOCK_CATALOG: RawSupplierProduct[] = [
  {
    id: "MS-1001",
    title: "Foldable 4K Camera Drone",
    description:
      "Compact foldable drone with stabilized 4K camera, GPS return-to-home and 28 minute flight time.",
    imageUrl: "/api/placeholder?label=4K%20Drone&seed=ms-1001",
    costUsd: 96,
    shippingCostUsd: 9.5,
    shipsFromCountry: "CN",
    estimatedShippingDaysMin: 7,
    estimatedShippingDaysMax: 14,
    stockQuantity: 230,
    attributes: { weight: "249 g", battery: "2453 mAh", range: "6 km" },
    keywords: ["drone", "camera", "4k", "foldable"],
  },
  {
    id: "MS-1002",
    title: "Bamboo Toothbrush 8-Pack, Soft Bristles",
    description:
      "Biodegradable moso bamboo handles with BPA-free soft nylon bristles, plastic-free packaging.",
    imageUrl: "/api/placeholder?label=Bamboo%208-Pack&seed=ms-1002",
    costUsd: 4.2,
    shippingCostUsd: 2.1,
    shipsFromCountry: "CN",
    estimatedShippingDaysMin: 6,
    estimatedShippingDaysMax: 12,
    stockQuantity: 1800,
    attributes: { bristles: "soft nylon-6", handle: "moso bamboo" },
    keywords: ["toothbrush", "bamboo", "eco", "sustainable"],
  },
  {
    id: "MS-1003",
    title: "Memory Foam Lumbar Support Cushion",
    description:
      "Contoured memory foam lumbar cushion with breathable mesh cover and adjustable straps for office chairs.",
    imageUrl: "/api/placeholder?label=Lumbar%20Cushion&seed=ms-1003",
    costUsd: 11.4,
    shippingCostUsd: 4.8,
    shipsFromCountry: "CN",
    estimatedShippingDaysMin: 8,
    estimatedShippingDaysMax: 15,
    stockQuantity: 540,
    attributes: { material: "memory foam", cover: "mesh, washable" },
    keywords: ["ergonomic", "lumbar", "office", "back pain"],
  },
  {
    id: "MS-1004",
    title: "Self-Cleaning Pet Slicker Brush",
    description:
      "Slicker brush with retractable stainless pins and one-click hair release, suitable for medium and long coats.",
    imageUrl: "/api/placeholder?label=Slicker%20Brush&seed=ms-1004",
    costUsd: 4.9,
    shippingCostUsd: 2.6,
    shipsFromCountry: "CN",
    estimatedShippingDaysMin: 6,
    estimatedShippingDaysMax: 13,
    stockQuantity: 950,
    attributes: { pins: "stainless steel", release: "one-click" },
    keywords: ["pet", "grooming", "brush", "deshedding"],
  },
  {
    id: "MS-1005",
    title: "Ultralight Packable Daypack 20L",
    description:
      "Water-resistant ripstop nylon daypack that folds into its own pocket, 280 g total weight.",
    imageUrl: "/api/placeholder?label=Daypack%2020L&seed=ms-1005",
    costUsd: 8.7,
    shippingCostUsd: 3.4,
    shipsFromCountry: "CN",
    estimatedShippingDaysMin: 7,
    estimatedShippingDaysMax: 14,
    stockQuantity: 720,
    attributes: { volume: "20 L", weight: "280 g", fabric: "ripstop nylon" },
    keywords: ["hiking", "backpack", "ultralight", "packable"],
  },
];

export class MockSupplierAdapter implements SupplierAdapter {
  readonly name = "MockSupply Co";
  readonly reliabilityScore = 0.85;

  async searchProducts(query: string): Promise<RawSupplierProduct[]> {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [...MOCK_CATALOG];
    return MOCK_CATALOG.filter((product) =>
      terms.some(
        (term) =>
          product.title.toLowerCase().includes(term) ||
          product.keywords.some((keyword) => keyword.includes(term))
      )
    );
  }

  async getProduct(id: string): Promise<RawSupplierProduct | null> {
    return MOCK_CATALOG.find((product) => product.id === id) ?? null;
  }

  normalizeProduct(raw: RawSupplierProduct): NormalizedSupplierProduct {
    const shipping = this.estimateShipping(raw);
    const resolved = resolveProductImages({
      title: raw.title,
      slug: raw.id.toLowerCase(),
      sku: raw.id,
      niche: raw.keywords.join(" "),
      keywords: raw.keywords,
      scrapedImages: raw.galleryUrls?.length
        ? raw.galleryUrls.map((url, index) => ({
            url,
            source: "other" as const,
            supplierProductId: raw.id,
            sortOrder: index,
          }))
        : undefined,
    });
    return {
      supplierName: this.name,
      supplierProductId: raw.id,
      title: raw.title,
      description: raw.description,
      imageUrl: resolved.primaryUrl,
      galleryUrls: resolved.galleryUrls,
      supplierUrl: raw.supplierUrl,
      supplierSource: raw.supplierSource ?? "aliexpress",
      supplierSearchQuery: raw.supplierSearchQuery ?? raw.title,
      cost: raw.costUsd,
      shippingCost: shipping.costUsd,
      shippingDaysMin: shipping.daysMin,
      shippingDaysMax: shipping.daysMax,
      countryOfOrigin: raw.shipsFromCountry,
      stockStatus:
        raw.stockQuantity === 0
          ? "OUT_OF_STOCK"
          : raw.stockQuantity < 50
            ? "LOW_STOCK"
            : "IN_STOCK",
      specs: Object.entries(raw.attributes).map(([label, value]) => ({
        label,
        value,
      })),
      keywords: raw.keywords,
    };
  }

  estimateShipping(raw: RawSupplierProduct): ShippingEstimate {
    // A real adapter would call the supplier's shipping API per destination;
    // the mock adds a small buffer to the supplier's optimistic estimate.
    return {
      daysMin: raw.estimatedShippingDaysMin,
      daysMax: raw.estimatedShippingDaysMax + 2,
      costUsd: raw.shippingCostUsd,
    };
  }

  calculateLandedCost(raw: RawSupplierProduct): LandedCost {
    const shipping = this.estimateShipping(raw);
    // Duties/VAT vary by destination; 0 is a placeholder until a tax engine
    // is connected for the target market.
    const estimatedDuties = 0;
    return {
      unitCost: raw.costUsd,
      shippingCost: shipping.costUsd,
      estimatedDuties,
      total: raw.costUsd + shipping.costUsd + estimatedDuties,
    };
  }
}

export const mockSupplier = new MockSupplierAdapter();

```


---

## src/lib/suppliers/providers/alibaba-provider.ts

```ts
import { ProviderAuthMissingError, UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";
import {
  BASE_UNCONFIGURED_CAPABILITIES,
  type CommerceProvider,
  type CreateDropshipOrderInput,
  type CreateSupplierOrderResult,
  type ProductDetailsInput,
  type ProductMediaInput,
  type ProductSearchInput,
  type ProductSearchResult,
  type ProviderCapabilities,
  type ProviderHealth,
  type SupplierMedia,
} from "@/lib/suppliers/providers/types";

export class AlibabaProvider implements CommerceProvider {
  key = "alibaba" as const;
  name = "Alibaba supplier integration";
  defaultFulfillmentMode = "MANUAL" as const;

  get capabilities(): ProviderCapabilities {
    const enabled = process.env.ALIBABA_ENABLED === "true";
    return {
      ...BASE_UNCONFIGURED_CAPABILITIES,
      search: enabled,
      details: enabled,
      images: enabled,
      pricing: enabled,
      inventory: enabled,
      checkout: false,
    };
  }

  async getHealth(): Promise<ProviderHealth> {
    const missing = ["ALIBABA_APP_KEY", "ALIBABA_APP_SECRET", "ALIBABA_ACCESS_TOKEN"].filter((key) => !process.env[key]);
    return {
      key: this.key,
      name: this.name,
      status: missing.length || process.env.ALIBABA_ENABLED !== "true" ? "NOT_CONFIGURED" : "OK",
      message: missing.length
        ? "Alibaba remains manual mode until authorized supplier/API credentials are configured."
        : "Alibaba credentials are present. Checkout is disabled until a supplier order integration is approved.",
      missingEnv: missing.length ? missing : undefined,
      capabilities: this.capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(_input: ProductSearchInput): Promise<ProductSearchResult[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["ALIBABA_ENABLED", "ALIBABA_ACCESS_TOKEN"]);
  }

  async getProductDetails(_input: ProductDetailsInput): Promise<ProductSearchResult> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["ALIBABA_ENABLED", "ALIBABA_ACCESS_TOKEN"]);
  }

  async getProductMedia(_input: ProductMediaInput): Promise<SupplierMedia[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["ALIBABA_ENABLED", "ALIBABA_ACCESS_TOKEN"]);
  }

  async createDropshipOrder(_input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    void _input;
    throw new UnsupportedCapabilityError(this.key, "checkout");
  }
}

export const alibabaProvider = new AlibabaProvider();

```


---

## src/lib/suppliers/providers/aliexpress-provider.ts

```ts
import crypto from "node:crypto";
import { ProviderAuthMissingError, UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";
import {
  type CommerceProvider,
  type CreateSupplierOrderResult,
  type CreateDropshipOrderInput,
  type ProductDetailsInput,
  type ProductMediaInput,
  type ProductSearchInput,
  type ProductSearchResult,
  type ProviderCapabilities,
  type ProviderHealth,
  type SupplierMedia,
  validateSearchResults,
} from "@/lib/suppliers/providers/types";

export class AliExpressProvider implements CommerceProvider {
  key = "aliexpress" as const;
  name = "AliExpress Affiliate/Open Platform";
  defaultFulfillmentMode = "AFFILIATE" as const;

  get capabilities(): ProviderCapabilities {
    const configured = hasAliExpressCredentials();
    const checkout = process.env.ALIEXPRESS_DROPSHIP_ENABLED === "true";
    return {
      search: configured,
      details: configured,
      images: configured,
      video: false,
      pricing: configured,
      inventory: configured,
      checkout,
      tracking: checkout,
      returns: false,
      affiliateLinks: Boolean(process.env.ALIEXPRESS_TRACKING_ID),
    };
  }

  async getHealth(): Promise<ProviderHealth> {
    const missing = ["ALIEXPRESS_APP_KEY", "ALIEXPRESS_APP_SECRET"].filter((key) => !process.env[key]);
    if (missing.length) {
      return {
        key: this.key,
        name: this.name,
        status: "NOT_CONFIGURED",
        message: "AliExpress credentials are missing. Fixture mode is available for pipeline testing only.",
        missingEnv: missing,
        capabilities: { ...this.capabilities, search: false, details: false, images: false, pricing: false, inventory: false },
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    if (!process.env.ALIEXPRESS_API_ENDPOINT || !process.env.ALIEXPRESS_SEARCH_METHOD) {
      return {
        key: this.key,
        name: this.name,
        status: "DEGRADED",
        message: "AliExpress credentials exist, but endpoint/method env vars are not configured. Fixture mode remains active.",
        capabilities: this.capabilities,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    return {
      key: this.key,
      name: this.name,
      status: "OK",
      message: "AliExpress API configuration is present.",
      capabilities: this.capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(input: ProductSearchInput): Promise<ProductSearchResult[]> {
    if (!hasAliExpressCredentials() || !process.env.ALIEXPRESS_API_ENDPOINT || !process.env.ALIEXPRESS_SEARCH_METHOD) {
      return validateSearchResults(this.key, aliExpressFixtures(input.query, input.limit ?? 12));
    }

    throw new Error(
      "AliExpress signed API transport is scaffolded, but product method mapping must be configured before live imports."
    );
  }

  async getProductDetails(input: ProductDetailsInput): Promise<ProductSearchResult> {
    const match = aliExpressFixtures("", 12).find((item) => item.externalId === input.externalId);
    if (!match) throw new ProviderAuthMissingError(this.key, ["ALIEXPRESS_PRODUCT_METHOD"]);
    return validateSearchResults(this.key, [match])[0];
  }

  async getProductMedia(input: ProductMediaInput): Promise<SupplierMedia[]> {
    const details = await this.getProductDetails(input);
    return details.media;
  }

  async createDropshipOrder(_input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    void _input;
    throw new UnsupportedCapabilityError(this.key, "checkout");
  }
}

export function signAliExpressParams(
  params: Record<string, string | number | boolean | undefined>,
  appSecret: ***REDACTED***
): string {
  const canonical = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}${String(value)}`)
    .join("");

  return crypto
    .createHmac("sha256", appSecret)
    .update(canonical)
    .digest("hex")
    .toUpperCase();
}

function hasAliExpressCredentials(): boolean {
  return Boolean(process.env.ALIEXPRESS_APP_KEY && process.env.ALIEXPRESS_APP_SECRET);
}

function aliExpressFixtures(query: string, limit: number): Omit<ProductSearchResult, "providerKey">[] {
  const items: Omit<ProductSearchResult, "providerKey">[] = [
    fixture("ae-mock-cable-organizer", "Magnetic Cable Organizer Set", "Desk cable clips and magnetic cable anchors for cleaner workstations."),
    fixture("ae-mock-bike-light", "USB Rechargeable Bike Light Kit", "Front and rear LED safety lights with weather-resistant housings."),
    fixture("ae-mock-kitchen-scale", "Compact Digital Kitchen Scale", "Slim kitchen scale with tare function and stainless weighing surface."),
  ];
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = terms.length
    ? items.filter((item) => terms.some((term) => item.title.toLowerCase().includes(term) || item.description?.toLowerCase().includes(term)))
    : items;
  return filtered.slice(0, limit);
}

function fixture(externalId: string, title: string, description: string): Omit<ProductSearchResult, "providerKey"> {
  return {
    externalId,
    sourceUrl: `https://www.aliexpress.com/item/${externalId}.html`,
    affiliateUrl: `https://www.aliexpress.com/item/${externalId}.html?aff_fcid=mock`,
    title,
    description,
    brand: "AliExpress supplier",
    price: 29,
    currency: "USD",
    supplierCost: 9,
    shippingCost: 3.5,
    stockStatus: "IN_STOCK",
    shippingDaysMin: 8,
    shippingDaysMax: 16,
    countryOfOrigin: "CN",
    sku: externalId.toUpperCase(),
    specs: [{ label: "Mode", value: "AliExpress fixture" }],
    variants: [],
    media: [0, 1, 2].map((index) => ({
      url: `https://placehold.co/1000x1000/png?text=${encodeURIComponent(`${title} ${index + 1}`)}`,
      mediaType: "IMAGE" as const,
      alt: `${title} image ${index + 1}`,
      sortOrder: index,
    })),
    signals: { source: "aliexpress_fixture", fixtureMode: true },
    risk: {},
    fulfillmentMode: "AFFILIATE",
  };
}

export const aliexpressProvider = new AliExpressProvider();

```


---

## src/lib/suppliers/providers/amazon-provider.ts

```ts
import { ProviderAuthMissingError, UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";
import {
  BASE_UNCONFIGURED_CAPABILITIES,
  type CommerceProvider,
  type CreateDropshipOrderInput,
  type CreateSupplierOrderResult,
  type ProductDetailsInput,
  type ProductMediaInput,
  type ProductSearchInput,
  type ProductSearchResult,
  type ProviderCapabilities,
  type ProviderHealth,
  type SupplierMedia,
} from "@/lib/suppliers/providers/types";

export class AmazonProvider implements CommerceProvider {
  key = "amazon" as const;
  name = "Amazon Associates/SP-API";
  defaultFulfillmentMode = "AFFILIATE" as const;

  get capabilities(): ProviderCapabilities {
    const affiliate = Boolean(process.env.AMAZON_ASSOCIATE_TAG);
    const spApi = process.env.AMAZON_SP_API_ENABLED === "true";
    return {
      ...BASE_UNCONFIGURED_CAPABILITIES,
      search: affiliate || spApi,
      details: affiliate || spApi,
      images: affiliate || spApi,
      pricing: affiliate || spApi,
      inventory: spApi,
      checkout: false,
      affiliateLinks: affiliate,
    };
  }

  async getHealth(): Promise<ProviderHealth> {
    const missing = ["AMAZON_CREATOR_CREDENTIAL_ID", "AMAZON_CREATOR_CREDENTIAL_SECRET", "AMAZON_ASSOCIATE_TAG"].filter((key) => !process.env[key]);
    return {
      key: this.key,
      name: this.name,
      status: missing.length ? "NOT_CONFIGURED" : "OK",
      message: missing.length
        ? "Amazon defaults to affiliate mode and needs Associates/API credentials before discovery."
        : "Amazon affiliate credentials are present. Direct checkout remains disabled.",
      missingEnv: missing.length ? missing : undefined,
      capabilities: this.capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(_input: ProductSearchInput): Promise<ProductSearchResult[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["AMAZON_ASSOCIATE_TAG"]);
  }

  async getProductDetails(_input: ProductDetailsInput): Promise<ProductSearchResult> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["AMAZON_ASSOCIATE_TAG"]);
  }

  async getProductMedia(_input: ProductMediaInput): Promise<SupplierMedia[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["AMAZON_ASSOCIATE_TAG"]);
  }

  async createDropshipOrder(_input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    void _input;
    throw new UnsupportedCapabilityError(this.key, "checkout");
  }
}

export const amazonProvider = new AmazonProvider();

```


---

## src/lib/suppliers/providers/cj-auth.ts

```ts
const CJ_API_BASE = process.env.CJ_API_BASE ?? "https://developers.cjdropshipping.com/api2.0/v1";

interface CjTokenResponse {
  accessToken: ***REDACTED***
  refreshToken: ***REDACTED***
  accessTokenExpiryDate?: string;
}

let cachedToken: ***REDACTED***

function isEnabled(): boolean {
  return process.env.CJ_ENABLED === "true";
}

function requiredEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.CJ_API_KEY && !process.env.CJ_ACCESS_TOKEN) {
    missing.push("CJ_API_KEY");
  }
  return missing;
}

async function cjFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = ***REDACTED***
  const response = await fetch(`${CJ_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": ***REDACTED***,
      ...(process.env.CJ_PLATFORM_TOKEN ? { platformToken: ***REDACTED***,
      ...(init?.headers ?? {}),
    },
  });

  const json = (await response.json()) as {
    code?: number;
    result?: T | boolean;
    message?: string;
    data?: T;
  };
  if (!response.ok || (json.code !== undefined && json.code !== 200 && json.code !== 0)) {
    throw new Error(json.message ?? `CJ API error (${response.status})`);
  }
  if (json.data !== undefined) return json.data as T;
  if (typeof json.result === "object" && json.result !== null) return json.result as T;
  return json as T;
}

export async function getCjAccessToken(): Promise<string> {
  if (!isEnabled()) {
    throw new Error("CJ_ENABLED is not true");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  if (process.env.CJ_REFRESH_TOKEN) {
    try {
      const refreshed = await refreshCjToken(process.env.CJ_REFRESH_TOKEN);
      return refreshed.accessToken;
    } catch {
      // Fall through to a static token or API-key auth.
    }
  }

  if (process.env.CJ_ACCESS_TOKEN) {
    cachedToken = ***REDACTED***
      accessToken: ***REDACTED***,
      refreshToken: ***REDACTED***"",
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    };
    return process.env.CJ_ACCESS_TOKEN;
  }

  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) {
    throw new Error("CJ_API_KEY or CJ_ACCESS_TOKEN is required");
  }

  try {
    const response = await requestToken({ apiKey });
    cacheToken(response);
    return response.accessToken;
  } catch (error) {
    if (!process.env.CJ_EMAIL) throw error;
  }

  const legacyResponse = await requestToken({
    email: process.env.CJ_EMAIL,
    password: ***REDACTED***,
  });
  cacheToken(legacyResponse);
  return legacyResponse.accessToken;
}

async function requestToken(body: Record<string, string>): Promise<CjTokenResponse> {
  const response = await fetch(`${CJ_API_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as {
    code?: number;
    result?: CjTokenResponse | boolean;
    data?: CjTokenResponse;
    message?: string;
  };
  const token = ***REDACTED***"object" ? json.result : undefined);

  if (!response.ok || !token?.accessToken) {
    throw new Error(json.message ?? "CJ authentication failed");
  }

  return token;
}

async function refreshCjToken(refreshToken: ***REDACTED***
  const response = await fetch(`${CJ_API_BASE}/authentication/refreshAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const json = (await response.json()) as {
    code?: number;
    result?: CjTokenResponse | boolean;
    data?: CjTokenResponse;
    message?: string;
  };
  const token = ***REDACTED***"object" ? json.result : undefined);

  if (!response.ok || !token?.accessToken) {
    throw new Error(json.message ?? "CJ token refresh failed");
  }

  cacheToken(token);
  return token;
}

function cacheToken(result: CjTokenResponse): void {
  const expiresAt = result.accessTokenExpiryDate
    ? new Date(result.accessTokenExpiryDate).getTime()
    : Date.now() + 12 * 60 * 60 * 1000;
  cachedToken = ***REDACTED***
    accessToken: ***REDACTED***,
    refreshToken: ***REDACTED***,
    expiresAt,
  };
}

export function getCjHealthInfo(): {
  enabled: boolean;
  missingEnv: string[];
  configured: boolean;
} {
  const missingEnv = isEnabled() ? requiredEnv() : ["CJ_ENABLED"];
  return {
    enabled: isEnabled(),
    missingEnv,
    configured: isEnabled() && missingEnv.length === 0,
  };
}

export function isCjOrderApiEnabled(): boolean {
  return process.env.CJ_ORDER_API_ENABLED === "true";
}

export function getCjOrderConfig(): {
  enabled: boolean;
  missingEnv: string[];
  logisticName: string | null;
  fromCountryCode: string | null;
  payType: 2 | 3;
} {
  const logisticName = process.env.CJ_LOGISTIC_NAME?.trim() || null;
  const fromCountryCode = process.env.CJ_FROM_COUNTRY_CODE?.trim().toUpperCase() || null;
  const missingEnv: string[] = [];
  if (!logisticName) missingEnv.push("CJ_LOGISTIC_NAME");
  if (!fromCountryCode) missingEnv.push("CJ_FROM_COUNTRY_CODE");
  return {
    enabled: isCjOrderApiEnabled() && missingEnv.length === 0,
    missingEnv,
    logisticName,
    fromCountryCode,
    payType: process.env.CJ_ORDER_PAY_TYPE === "2" ? 2 : 3,
  };
}

export { cjFetch, isEnabled as isCjEnabled };

```


---

## src/lib/suppliers/providers/cj-provider.ts

```ts
import {
  cjFetch,
  getCjHealthInfo,
  getCjOrderConfig,
  isCjEnabled,
} from "@/lib/suppliers/providers/cj-auth";
import {
  BASE_UNCONFIGURED_CAPABILITIES,
  type CommerceProvider,
  type CreateDropshipOrderInput,
  type CreateSupplierOrderResult,
  type ProductDetailsInput,
  type ProductMediaInput,
  type ProductSearchInput,
  type ProductSearchResult,
  type ProviderCapabilities,
  type ProviderHealth,
  type SupplierMedia,
  validateSearchResults,
} from "@/lib/suppliers/providers/types";

const baseCapabilities: ProviderCapabilities = {
  search: true,
  details: true,
  images: true,
  video: false,
  pricing: true,
  inventory: false,
  checkout: false,
  tracking: true,
  returns: false,
  affiliateLinks: false,
};

interface CjProductListItem {
  id?: string;
  pid?: string;
  sku?: string;
  spu?: string;
  nameEn?: string;
  productName?: string;
  productNameEn?: string;
  productSku?: string;
  sellPrice?: number;
  nowPrice?: string;
  discountPrice?: string;
  bigImage?: string;
  productImage?: string;
  productImageSet?: string[];
  videoList?: string[];
  productVideo?: string[];
  description?: string;
  categoryName?: string;
  deliveryCycle?: string;
  listedNum?: number;
  warehouseInventoryNum?: number;
  totalVerifiedInventory?: number;
  variants?: CjVariant[];
  rawData?: unknown;
}

interface CjVariant {
  vid?: string;
  variantSku?: string;
  variantNameEn?: string;
  variantImage?: string;
  variantSellPrice?: number;
  inventories?: Array<{ totalInventory?: number; countryCode?: string }>;
}

interface CjListV2Response {
  content?: Array<{ productList?: CjProductListItem[] }>;
  list?: CjProductListItem[];
}

export class CjDropshippingProvider implements CommerceProvider {
  key = "cj" as const;
  name = "CJdropshipping";
  defaultFulfillmentMode = "DROPSHIP" as const;

  get capabilities(): ProviderCapabilities {
    return {
      ...baseCapabilities,
      checkout: getCjOrderConfig().enabled,
    };
  }

  async getHealth(): Promise<ProviderHealth> {
    const info = getCjHealthInfo();
    const orderConfig = getCjOrderConfig();
    if (!info.enabled) {
      return {
        key: this.key,
        name: this.name,
        status: "NOT_CONFIGURED",
        message: "Set CJ_ENABLED=true to activate CJdropshipping.",
        missingEnv: info.missingEnv,
        capabilities: BASE_UNCONFIGURED_CAPABILITIES,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    if (!info.configured) {
      return {
        key: this.key,
        name: this.name,
        status: "NOT_CONFIGURED",
        message: "CJ credentials missing.",
        missingEnv: info.missingEnv,
        capabilities: BASE_UNCONFIGURED_CAPABILITIES,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    try {
      await cjFetch<CjListV2Response>(
        `/product/listV2?page=1&size=1&keyWord=${encodeURIComponent("brush")}`
      );
      return {
        key: this.key,
        name: this.name,
        status: "OK",
        message: orderConfig.enabled
          ? `CJ API reachable. Order API enabled with payType=${orderConfig.payType}.`
          : orderConfig.missingEnv.length > 0 && process.env.CJ_ORDER_API_ENABLED === "true"
            ? `CJ API reachable. Order API flag is on, but missing ${orderConfig.missingEnv.join(", ")}.`
            : "CJ API reachable. Order API remains disabled until explicitly enabled.",
        missingEnv:
          process.env.CJ_ORDER_API_ENABLED === "true" && orderConfig.missingEnv.length > 0
            ? orderConfig.missingEnv
            : undefined,
        capabilities: this.capabilities,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    } catch (error) {
      return {
        key: this.key,
        name: this.name,
        status: "ERROR",
        message: error instanceof Error ? error.message : "CJ health check failed",
        missingEnv: info.missingEnv,
        capabilities: this.capabilities,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }
  }

  async searchProducts(input: ProductSearchInput): Promise<ProductSearchResult[]> {
    if (!isCjEnabled()) return [];
    const limit = Math.max(1, Math.min(input.limit ?? 12, 100));
    const data = await cjFetch<CjListV2Response>(
      `/product/listV2?page=1&size=${limit}&keyWord=${encodeURIComponent(input.query)}&features=enable_description,enable_video`
    );
    const list =
      data.list ??
      data.content?.flatMap((group) => group.productList ?? []) ??
      [];
    return validateSearchResults(
      this.key,
      list.map((item) => mapCjProduct(item, item)).filter(Boolean)
    );
  }

  async getProductDetails(input: ProductDetailsInput): Promise<ProductSearchResult> {
    if (!isCjEnabled()) throw new Error("CJ is not enabled");
    const data = await cjFetch<CjProductListItem>(
      `/product/query?pid=${encodeURIComponent(input.externalId)}&features=enable_video`
    );
    const mapped = mapCjProduct(data, data);
    if (!mapped) throw new Error(`CJ product not found: ${input.externalId}`);
    return validateSearchResults(this.key, [mapped])[0];
  }

  async getProductMedia(input: ProductMediaInput): Promise<SupplierMedia[]> {
    const details = await this.getProductDetails(input);
    return details.media;
  }

  async createDropshipOrder(input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    const orderConfig = getCjOrderConfig();
    if (!orderConfig.enabled) {
      return {
        status: "ERROR",
        errorMessage:
          process.env.CJ_ORDER_API_ENABLED === "true"
            ? `CJ order API is missing ${orderConfig.missingEnv.join(", ")}.`
            : "CJ order API is not enabled. Set CJ_ORDER_API_ENABLED=true only after verifying the Create Order V2 contract in your CJ account.",
        requestJson: input,
      };
    }

    try {
      const products = await Promise.all(
        input.items.map(async (item) => {
          const variant = await resolveCjVariant(item.externalId);
          return {
            vid: variant.vid,
            sku: variant.vid ? undefined : variant.sku,
            quantity: item.quantity,
            storeLineItemId: item.externalId,
          };
        })
      );
      const missingVariant = products.find((product) => !product.vid && !product.sku);
      if (missingVariant) {
        return {
          status: "ERROR",
          errorMessage: "CJ order requires a variant id (vid) or SKU for every line item.",
          requestJson: input,
        };
      }

      const countryCode = normalizeCountryCode(input.shippingAddress.country);
      if (!countryCode) {
        return {
          status: "ERROR",
          errorMessage: "CJ order requires a two-letter ISO shipping country code.",
          requestJson: input,
        };
      }

      const response = await cjFetch<{ orderId?: string; orderNum?: string }>(
        "/shopping/order/createOrderV2",
        {
          method: "POST",
          body: JSON.stringify({
            orderNumber: input.orderId,
            shippingZip: input.shippingAddress.postalCode,
            shippingCountryCode: countryCode,
            shippingCountry: countryCode,
            shippingProvince: input.shippingAddress.city,
            shippingCity: input.shippingAddress.city,
            shippingAddress: input.shippingAddress.addressLine1,
            shippingCustomerName: input.shippingAddress.name,
            email: input.shippingAddress.email,
            payType: orderConfig.payType,
            logisticName: orderConfig.logisticName,
            fromCountryCode: orderConfig.fromCountryCode,
            platform: "api",
            orderFlow: 1,
            products,
          }),
        }
      );

      return {
        status: orderConfig.payType === 2 ? "PLACED" : "PENDING",
        externalOrderId: response.orderId ?? response.orderNum,
        requestJson: input,
        responseJson: response,
      };
    } catch (error) {
      return {
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "CJ order placement failed",
        requestJson: input,
      };
    }
  }
}

async function resolveCjVariant(externalId: string): Promise<{ vid?: string; sku?: string }> {
  try {
    const details = await cjFetch<CjProductListItem>(
      `/product/query?pid=${encodeURIComponent(externalId)}`
    );
    const variant = details.variants?.find((entry) => entry.vid || entry.variantSku);
    return { vid: variant?.vid, sku: variant?.variantSku };
  } catch {
    return { vid: externalId };
  }
}

function mapCjProduct(item: CjProductListItem, rawData?: unknown): Record<string, unknown> | null {
  const externalId = item.pid ?? item.id;
  const title = item.productNameEn ?? item.nameEn ?? item.productName;
  const image = item.bigImage ?? item.productImage;
  if (!externalId || !title || !image) return null;

  const gallery = [...new Set([image, ...(item.productImageSet ?? [])].filter(Boolean))];
  const videos = [...(item.productVideo ?? []), ...(item.videoList ?? [])].filter(Boolean);
  const delivery = parseDeliveryCycle(item.deliveryCycle);
  const inventory = item.totalVerifiedInventory ?? item.warehouseInventoryNum;
  const firstVariant = item.variants?.find((variant) => variant.vid || variant.variantSku);
  const price = parsePrice(
    item.sellPrice ?? firstVariant?.variantSellPrice ?? item.nowPrice ?? item.discountPrice
  );

  return {
    externalId,
    title,
    description: item.description ?? title,
    price,
    currency: "USD",
    stockStatus: inventory === 0 ? "OUT_OF_STOCK" : "IN_STOCK",
    shippingDaysMin: delivery?.min ?? 7,
    shippingDaysMax: delivery?.max ?? 18,
    countryOfOrigin: "CN",
    sourceUrl: `https://cjdropshipping.com/product/${externalId}.html`,
    fulfillmentMode: "DROPSHIP",
    sku: item.productSku ?? item.sku ?? item.spu ?? firstVariant?.variantSku,
    variants: (item.variants ?? []).map((variant) => ({
      vid: variant.vid,
      sku: variant.variantSku,
      title: variant.variantNameEn,
      image: variant.variantImage,
      price: variant.variantSellPrice,
      inventories: variant.inventories,
    })),
    media: gallery.map((url, index) => ({
      url,
      mediaType: "IMAGE",
      alt: title,
      sortOrder: index,
    })).concat(
      videos.map((url, index) => ({
        url,
        mediaType: "VIDEO",
        alt: title,
        sortOrder: gallery.length + index,
      }))
    ),
    signals: {
      source: "cj_api",
      listedNum: item.listedNum,
      defaultVariantId: firstVariant?.vid,
    },
    risk: {},
    rawData,
  };
}

function parsePrice(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const first = value.split("-")[0];
    const parsed = Number.parseFloat(first);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function parseDeliveryCycle(value: string | undefined): { min: number; max: number } | null {
  if (!value) return null;
  const matches = value.match(/\d+/g)?.map((entry) => Number.parseInt(entry, 10)) ?? [];
  if (matches.length === 0) return null;
  return { min: matches[0], max: matches[1] ?? matches[0] };
}

function normalizeCountryCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(trimmed) ? trimmed : null;
}

export const cjProvider = new CjDropshippingProvider();

```


---

## src/lib/suppliers/providers/doba-provider.ts

```ts
import {
  BASE_UNCONFIGURED_CAPABILITIES,
  type CommerceProvider,
  type CreateDropshipOrderInput,
  type CreateSupplierOrderResult,
  type ProductSearchInput,
  type ProductSearchResult,
  type ProviderCapabilities,
  type ProviderHealth,
  type SupplierMedia,
} from "@/lib/suppliers/providers/types";
import { UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";

const capabilities: ProviderCapabilities = {
  search: false,
  details: false,
  images: false,
  video: false,
  pricing: false,
  inventory: false,
  checkout: false,
  tracking: false,
  returns: false,
  affiliateLinks: false,
};

function isEnabled(): boolean {
  return process.env.DOBA_ENABLED === "true";
}

function missingEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.DOBA_ACCESS_KEY) missing.push("DOBA_ACCESS_KEY");
  if (!process.env.DOBA_APP_KEY) missing.push("DOBA_APP_KEY");
  if (!process.env.DOBA_APP_SECRET) missing.push("DOBA_APP_SECRET");
  return missing;
}

export class DobaProvider implements CommerceProvider {
  key = "doba" as const;
  name = "Doba";
  capabilities = capabilities;
  defaultFulfillmentMode = "DROPSHIP" as const;

  async getHealth(): Promise<ProviderHealth> {
    if (!isEnabled()) {
      return {
        key: this.key,
        name: this.name,
        status: "NOT_CONFIGURED",
        message: "Set DOBA_ENABLED=true to activate Doba integration scaffold.",
        missingEnv: ["DOBA_ENABLED", ...missingEnv()],
        capabilities: BASE_UNCONFIGURED_CAPABILITIES,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    const missing = missingEnv();
    if (missing.length > 0) {
      return {
        key: this.key,
        name: this.name,
        status: "NOT_CONFIGURED",
        message: "Doba credentials missing.",
        missingEnv: missing,
        capabilities: BASE_UNCONFIGURED_CAPABILITIES,
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    return {
      key: this.key,
      name: this.name,
      status: "DEGRADED",
      message:
        "Doba scaffold is configured but product/order endpoints are not wired until the API contract is confirmed.",
      capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(_input: ProductSearchInput): Promise<ProductSearchResult[]> {
    void _input;
    return [];
  }

  async getProductDetails(): Promise<ProductSearchResult> {
    throw new UnsupportedCapabilityError(this.key, "details");
  }

  async getProductMedia(): Promise<SupplierMedia[]> {
    return [];
  }

  async createDropshipOrder(input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    return {
      status: "ERROR",
      errorMessage:
        "Doba order API is not implemented yet. Confirm Doba endpoint contract before enabling checkout.",
      requestJson: input,
    };
  }
}

export const dobaProvider = new DobaProvider();

```


---

## src/lib/suppliers/providers/ebay-provider.ts

```ts
import { ProviderAuthMissingError, UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";
import {
  type CommerceProvider,
  type CreateSupplierOrderResult,
  type CreateDropshipOrderInput,
  type ProductDetailsInput,
  type ProductMediaInput,
  type ProductSearchInput,
  type ProductSearchResult,
  type ProviderCapabilities,
  type ProviderHealth,
  type SupplierMedia,
  validateSearchResults,
} from "@/lib/suppliers/providers/types";

const EBAY_SCOPE = "https://api.ebay.com/oauth/api_scope";

export class EbayProvider implements CommerceProvider {
  key = "ebay" as const;
  name = "eBay Browse API";
  defaultFulfillmentMode = "AFFILIATE" as const;

  get capabilities(): ProviderCapabilities {
    const checkout = process.env.EBAY_BUY_ORDER_ENABLED === "true";
    return {
      search: true,
      details: true,
      images: true,
      video: false,
      pricing: true,
      inventory: true,
      checkout,
      tracking: checkout,
      returns: false,
      affiliateLinks: true,
    };
  }

  async getHealth(): Promise<ProviderHealth> {
    const missing = requiredEnv(["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET"]);
    if (missing.length) {
      return {
        key: this.key,
        name: this.name,
        status: "NOT_CONFIGURED",
        message: "eBay search requires OAuth client credentials.",
        missingEnv: missing,
        capabilities: { ...this.capabilities, search: false, details: false, images: false, pricing: false, inventory: false },
        defaultFulfillmentMode: this.defaultFulfillmentMode,
      };
    }

    return {
      key: this.key,
      name: this.name,
      status: "OK",
      message:
        process.env.EBAY_BUY_ORDER_ENABLED === "true"
          ? "eBay Browse API is configured. Buy/order capability flag is enabled; verify account approval before routing orders."
          : "eBay Browse API is configured in affiliate/search mode.",
      capabilities: this.capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(input: ProductSearchInput): Promise<ProductSearchResult[]> {
    assertConfigured(this.key, ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET"]);
    const token = ***REDACTED***
    const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
    url.searchParams.set("q", input.query);
    url.searchParams.set("limit", String(Math.min(input.limit ?? 20, 50)));

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": process.env.EBAY_MARKETPLACE_ID ?? "EBAY_US",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`eBay search failed (${response.status}): ${await response.text()}`);
    }

    const body = (await response.json()) as { itemSummaries?: unknown[] };
    return validateSearchResults(
      this.key,
      (body.itemSummaries ?? []).map((item) => normalizeEbayItem(item))
    );
  }

  async getProductDetails(input: ProductDetailsInput): Promise<ProductSearchResult> {
    assertConfigured(this.key, ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET"]);
    const token = ***REDACTED***
    const response = await fetch(
      `https://api.ebay.com/buy/browse/v1/item/${encodeURIComponent(input.externalId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": process.env.EBAY_MARKETPLACE_ID ?? "EBAY_US",
        },
        cache: "no-store",
      }
    );
    if (!response.ok) {
      throw new Error(`eBay details failed (${response.status}): ${await response.text()}`);
    }
    return validateSearchResults(this.key, [normalizeEbayItem(await response.json())])[0];
  }

  async getProductMedia(input: ProductMediaInput): Promise<SupplierMedia[]> {
    const details = await this.getProductDetails(input);
    return details.media;
  }

  async createDropshipOrder(_input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    void _input;
    throw new UnsupportedCapabilityError(this.key, "checkout");
  }

  private async fetchToken(): Promise<string> {
    const credentials = Buffer.from(
      `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
    ).toString("base64");
    const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: EBAY_SCOPE,
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`eBay OAuth failed (${response.status}): ${await response.text()}`);
    }
    const body = (await response.json()) as { access_token?: string };
    if (!body.access_token) throw new Error("eBay OAuth response did not include access_token.");
    return body.access_token;
  }
}

interface EbayRawItem {
  itemId?: string;
  legacyItemId?: string;
  itemWebUrl?: string;
  itemAffiliateWebUrl?: string;
  title?: string;
  shortDescription?: string;
  brand?: string;
  price?: { value?: string | number; currency?: string };
  shippingOptions?: Array<{ shippingCost?: { value?: string | number } }>;
  additionalImages?: Array<{ imageUrl?: string }>;
  image?: { imageUrl?: string };
  estimatedAvailabilities?: Array<{ availabilityThresholdType?: string }>;
  localizedAspects?: Array<{ name?: string; value?: string }>;
  condition?: string;
  seller?: unknown;
  buyingOptions?: unknown;
  itemLocation?: unknown;
}

function normalizeEbayItem(item: unknown): Omit<ProductSearchResult, "providerKey"> {
  const raw = item as EbayRawItem;
  const priceValue = Number(raw.price?.value);
  const shipping = Array.isArray(raw.shippingOptions) ? raw.shippingOptions[0] : undefined;
  const shippingCost = Number(shipping?.shippingCost?.value);
  const additionalImages = Array.isArray(raw.additionalImages) ? raw.additionalImages : [];
  const media: SupplierMedia[] = [
    raw.image?.imageUrl,
    ...additionalImages.map((image: { imageUrl?: string }) => image.imageUrl),
  ]
    .filter((url): url is string => typeof url === "string" && url.startsWith("http"))
    .map((url, index) => ({
      url,
      mediaType: "IMAGE",
      alt: raw.title ? `${raw.title} image ${index + 1}` : `eBay image ${index + 1}`,
      sortOrder: index,
    }));

  return {
    externalId: String(raw.itemId ?? raw.legacyItemId ?? raw.itemWebUrl),
    sourceUrl: raw.itemWebUrl,
    affiliateUrl: raw.itemAffiliateWebUrl,
    title: String(raw.title ?? "Untitled eBay item"),
    description: raw.shortDescription,
    brand: raw.brand,
    price: Number.isFinite(priceValue) ? priceValue : undefined,
    currency: raw.price?.currency,
    shippingCost: Number.isFinite(shippingCost) ? shippingCost : undefined,
    stockStatus: raw.estimatedAvailabilities?.[0]?.availabilityThresholdType === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : "UNKNOWN",
    specs: Array.isArray(raw.localizedAspects)
      ? raw.localizedAspects.map((aspect: { name?: string; value?: string }) => ({
          label: String(aspect.name ?? "Attribute"),
          value: String(aspect.value ?? ""),
        }))
      : [],
    variants: [],
    media,
    signals: {
      source: "ebay_browse_api",
      condition: raw.condition,
      seller: raw.seller,
      buyingOptions: raw.buyingOptions,
      itemLocation: raw.itemLocation,
      shippingOptions: raw.shippingOptions,
    },
    risk: {},
    rawData: raw,
    fulfillmentMode: "AFFILIATE",
  };
}

function requiredEnv(keys: string[]): string[] {
  return keys.filter((key) => !process.env[key]);
}

function assertConfigured(providerKey: string, keys: string[]): void {
  const missing = requiredEnv(keys);
  if (missing.length) throw new ProviderAuthMissingError(providerKey, missing);
}

export const ebayProvider = new EbayProvider();

```


---

## src/lib/suppliers/providers/errors.ts

```ts
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly providerKey: string,
    readonly code: string
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export class ProviderAuthMissingError extends ProviderError {
  constructor(providerKey: string, missingEnv: string[]) {
    super(
      `${providerKey} is not configured. Missing: ${missingEnv.join(", ")}`,
      providerKey,
      "AUTH_MISSING"
    );
    this.name = "ProviderAuthMissingError";
  }
}

export class UnsupportedCapabilityError extends ProviderError {
  constructor(providerKey: string, capability: string) {
    super(`${providerKey} does not support ${capability} in this configuration.`, providerKey, "UNSUPPORTED_CAPABILITY");
    this.name = "UnsupportedCapabilityError";
  }
}

export function isProviderError(error: unknown): error is ProviderError {
  return error instanceof ProviderError;
}


```


---

## src/lib/suppliers/providers/mock-provider.ts

```ts
import { UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";
import {
  type CommerceProvider,
  type CreateSupplierOrderResult,
  type CreateDropshipOrderInput,
  type ProductDetailsInput,
  type ProductMediaInput,
  type ProductSearchInput,
  type ProductSearchResult,
  type ProviderCapabilities,
  type ProviderHealth,
  type SupplierMedia,
  validateSearchResults,
} from "@/lib/suppliers/providers/types";

const capabilities: ProviderCapabilities = {
  search: true,
  details: true,
  images: true,
  video: false,
  pricing: true,
  inventory: true,
  checkout: false,
  tracking: false,
  returns: false,
  affiliateLinks: true,
};

const fixtureProducts = [
  {
    externalId: "mock-ergonomic-lumbar-cushion",
    title: "Contour Memory Foam Lumbar Cushion",
    description:
      "A supportive lumbar cushion with a washable mesh cover, designed for long desk sessions and compact office chairs.",
    brand: "MockSupply Studio",
    price: 39,
    currency: "USD",
    supplierCost: 12,
    shippingCost: 4.5,
    stockStatus: "IN_STOCK" as const,
    shippingDaysMin: 6,
    shippingDaysMax: 12,
    countryOfOrigin: "CN",
    sku: "MOCK-LUMBAR-001",
    specs: [
      { label: "Material", value: "Memory foam, breathable mesh" },
      { label: "Cover", value: "Removable and washable" },
      { label: "Fit", value: "Office chairs, car seats, home workstations" },
    ],
    variants: [],
    risk: {},
    signals: { source: "mock_fixture" },
    media: mockMedia("Contour Lumbar Cushion"),
  },
  {
    externalId: "mock-packable-daypack",
    title: "20L Packable Ripstop Daypack",
    description:
      "A lightweight daypack that folds into its own pocket, with water-resistant ripstop fabric and side bottle pockets.",
    brand: "MockSupply Studio",
    price: 34,
    currency: "USD",
    supplierCost: 9,
    shippingCost: 3.8,
    stockStatus: "IN_STOCK" as const,
    shippingDaysMin: 7,
    shippingDaysMax: 14,
    countryOfOrigin: "CN",
    sku: "MOCK-PACK-020",
    specs: [
      { label: "Volume", value: "20 L" },
      { label: "Weight", value: "280 g" },
      { label: "Fabric", value: "Water-resistant ripstop nylon" },
    ],
    variants: [],
    risk: {},
    signals: { source: "mock_fixture" },
    media: mockMedia("Packable Daypack"),
  },
  {
    externalId: "mock-pet-slicker-brush",
    title: "Self-Cleaning Pet Slicker Brush",
    description:
      "A grooming brush with retractable stainless pins and one-click release for medium and long coats.",
    brand: "MockSupply Studio",
    price: 24,
    currency: "USD",
    supplierCost: 5,
    shippingCost: 2.7,
    stockStatus: "IN_STOCK" as const,
    shippingDaysMin: 6,
    shippingDaysMax: 11,
    countryOfOrigin: "CN",
    sku: "MOCK-PET-004",
    specs: [
      { label: "Pins", value: "Stainless steel" },
      { label: "Release", value: "One-click hair release" },
      { label: "Use", value: "Medium and long coats" },
    ],
    variants: [],
    risk: {},
    signals: { source: "mock_fixture" },
    media: mockMedia("Pet Slicker Brush"),
  },
] satisfies Omit<ProductSearchResult, "providerKey">[];

export class MockCommerceProvider implements CommerceProvider {
  key = "mock" as const;
  name = "Mock Supplier";
  capabilities = capabilities;
  defaultFulfillmentMode = "MOCK" as const;

  async getHealth(): Promise<ProviderHealth> {
    return {
      key: this.key,
      name: this.name,
      status: "OK",
      message: "Mock provider is enabled for local product discovery and media ingestion.",
      capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(input: ProductSearchInput): Promise<ProductSearchResult[]> {
    const terms = input.query.toLowerCase().split(/\s+/).filter(Boolean);
    const results = terms.length
      ? fixtureProducts.filter((product) =>
          terms.some((term) =>
            [product.title, product.description, product.brand, product.sku]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(term)
          )
        )
      : fixtureProducts;

    return validateSearchResults(
      this.key,
      results.slice(0, input.limit ?? 12).map((result) => ({
        ...result,
        sourceUrl: `https://mock-supplier.example/products/${result.externalId}`,
        affiliateUrl: `https://mock-supplier.example/deals/${result.externalId}`,
        fulfillmentMode: "MOCK",
      }))
    );
  }

  async getProductDetails(input: ProductDetailsInput): Promise<ProductSearchResult> {
    const product = fixtureProducts.find((item) => item.externalId === input.externalId);
    if (!product) throw new Error(`Mock product not found: ${input.externalId}`);
    return validateSearchResults(this.key, [
      {
        ...product,
        sourceUrl: input.sourceUrl ?? `https://mock-supplier.example/products/${product.externalId}`,
        affiliateUrl: `https://mock-supplier.example/deals/${product.externalId}`,
        fulfillmentMode: "MOCK",
      },
    ])[0];
  }

  async getProductMedia(input: ProductMediaInput): Promise<SupplierMedia[]> {
    const details = await this.getProductDetails(input);
    return details.media;
  }

  async createDropshipOrder(_input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    void _input;
    throw new UnsupportedCapabilityError(this.key, "checkout");
  }
}

function mockMedia(label: string): SupplierMedia[] {
  return [0, 1, 2].map((index) => ({
    url: `https://placehold.co/1000x1000/png?text=${encodeURIComponent(`${label} ${index + 1}`)}`,
    mediaType: "IMAGE",
    alt: `${label} product image ${index + 1}`,
    sortOrder: index,
  }));
}

export const mockCommerceProvider = new MockCommerceProvider();

```


---

## src/lib/suppliers/providers/registry.ts

```ts
import { prisma } from "@/lib/db";
import { alibabaProvider } from "@/lib/suppliers/providers/alibaba-provider";
import { aliexpressProvider } from "@/lib/suppliers/providers/aliexpress-provider";
import { amazonProvider } from "@/lib/suppliers/providers/amazon-provider";
import { cjProvider } from "@/lib/suppliers/providers/cj-provider";
import { dobaProvider } from "@/lib/suppliers/providers/doba-provider";
import { ebayProvider } from "@/lib/suppliers/providers/ebay-provider";
import { mockCommerceProvider } from "@/lib/suppliers/providers/mock-provider";
import { temuProvider } from "@/lib/suppliers/providers/temu-provider";
import type { CommerceProvider, ProviderKey } from "@/lib/suppliers/providers/types";
import { wishProvider } from "@/lib/suppliers/providers/wish-provider";
import { toJson } from "@/lib/utils/json";

const providers: CommerceProvider[] = [
  mockCommerceProvider,
  cjProvider,
  dobaProvider,
  ebayProvider,
  aliexpressProvider,
  temuProvider,
  amazonProvider,
  wishProvider,
  alibabaProvider,
];

const providerMap = new Map<ProviderKey, CommerceProvider>(
  providers.map((provider) => [provider.key, provider])
);

export function getCommerceProvider(providerKey: ProviderKey | string): CommerceProvider {
  const provider = providerMap.get(providerKey as ProviderKey);
  if (!provider) throw new Error(`Unknown provider: ${providerKey}`);
  return provider;
}

export function getCommerceProviders(): CommerceProvider[] {
  return providers;
}

export async function syncProviderRegistryToDb(): Promise<void> {
  for (const provider of providers) {
    const health = await provider.getHealth();
    await prisma.supplierProvider.upsert({
      where: { key: provider.key },
      update: {
        name: provider.name,
        type: provider.key === "mock" ? "MOCK" : health.defaultFulfillmentMode === "AFFILIATE" ? "AFFILIATE" : "MARKETPLACE",
        isEnabled: provider.key === "mock" || health.status === "OK",
        supportsSearch: health.capabilities.search,
        supportsProductDetails: health.capabilities.details,
        supportsImages: health.capabilities.images,
        supportsVideo: health.capabilities.video,
        supportsInventory: health.capabilities.inventory,
        supportsPricing: health.capabilities.pricing,
        supportsCheckout: health.capabilities.checkout,
        supportsTracking: health.capabilities.tracking,
        supportsReturns: health.capabilities.returns,
        defaultFulfillmentMode: health.defaultFulfillmentMode,
        reliabilityScore: provider.key === "mock" ? 0.85 : 0.75,
        averageShippingDays: provider.key === "mock" ? 10 : 14,
        configJson: toJson({ health }),
      },
      create: {
        key: provider.key,
        name: provider.name,
        type: provider.key === "mock" ? "MOCK" : health.defaultFulfillmentMode === "AFFILIATE" ? "AFFILIATE" : "MARKETPLACE",
        isEnabled: provider.key === "mock" || health.status === "OK",
        supportsSearch: health.capabilities.search,
        supportsProductDetails: health.capabilities.details,
        supportsImages: health.capabilities.images,
        supportsVideo: health.capabilities.video,
        supportsInventory: health.capabilities.inventory,
        supportsPricing: health.capabilities.pricing,
        supportsCheckout: health.capabilities.checkout,
        supportsTracking: health.capabilities.tracking,
        supportsReturns: health.capabilities.returns,
        defaultFulfillmentMode: health.defaultFulfillmentMode,
        reliabilityScore: provider.key === "mock" ? 0.85 : 0.75,
        averageShippingDays: provider.key === "mock" ? 10 : 14,
        configJson: toJson({ health }),
      },
    });
  }
}


```


---

## src/lib/suppliers/providers/temu-provider.ts

```ts
import { ProviderAuthMissingError, UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";
import {
  BASE_UNCONFIGURED_CAPABILITIES,
  type CommerceProvider,
  type CreateDropshipOrderInput,
  type CreateSupplierOrderResult,
  type ProductDetailsInput,
  type ProductMediaInput,
  type ProductSearchInput,
  type ProductSearchResult,
  type ProviderCapabilities,
  type ProviderHealth,
  type SupplierMedia,
} from "@/lib/suppliers/providers/types";

export class TemuProvider implements CommerceProvider {
  key = "temu" as const;
  name = "Temu authorized provider";
  defaultFulfillmentMode = "AFFILIATE" as const;

  get capabilities(): ProviderCapabilities {
    const enabled = process.env.TEMU_ENABLED === "true";
    return {
      ...BASE_UNCONFIGURED_CAPABILITIES,
      search: enabled,
      details: enabled,
      images: enabled,
      pricing: enabled,
      inventory: enabled,
      affiliateLinks: enabled,
      checkout: false,
    };
  }

  async getHealth(): Promise<ProviderHealth> {
    const missing = ["TEMU_APP_KEY", "TEMU_APP_SECRET", "TEMU_ACCESS_TOKEN"].filter((key) => !process.env[key]);
    return {
      key: this.key,
      name: this.name,
      status: missing.length || process.env.TEMU_ENABLED !== "true" ? "NOT_CONFIGURED" : "OK",
      message: missing.length
        ? "Temu is disabled until authorized API credentials are configured."
        : "Temu credentials are present. Keep checkout disabled unless an approved seller/provider order API is active.",
      missingEnv: missing.length ? missing : undefined,
      capabilities: this.capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(_input: ProductSearchInput): Promise<ProductSearchResult[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["TEMU_ENABLED", "TEMU_ACCESS_TOKEN"]);
  }

  async getProductDetails(_input: ProductDetailsInput): Promise<ProductSearchResult> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["TEMU_ENABLED", "TEMU_ACCESS_TOKEN"]);
  }

  async getProductMedia(_input: ProductMediaInput): Promise<SupplierMedia[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["TEMU_ENABLED", "TEMU_ACCESS_TOKEN"]);
  }

  async createDropshipOrder(_input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    void _input;
    throw new UnsupportedCapabilityError(this.key, "checkout");
  }
}

export const temuProvider = new TemuProvider();

```


---

## src/lib/suppliers/providers/types.ts

```ts
import { z } from "zod";

export const providerKeys = [
  "mock",
  "cj",
  "doba",
  "ebay",
  "aliexpress",
  "temu",
  "amazon",
  "wish",
  "alibaba",
] as const;

export type ProviderKey = (typeof providerKeys)[number];

export interface ProviderCapabilities {
  search: boolean;
  details: boolean;
  images: boolean;
  video: boolean;
  pricing: boolean;
  inventory: boolean;
  checkout: boolean;
  tracking: boolean;
  returns: boolean;
  affiliateLinks: boolean;
}

export type ProviderHealthStatus = "OK" | "NOT_CONFIGURED" | "DEGRADED" | "ERROR";

export interface ProviderHealth {
  key: ProviderKey;
  name: string;
  status: ProviderHealthStatus;
  message: string;
  missingEnv?: string[];
  capabilities: ProviderCapabilities;
  defaultFulfillmentMode: "DROPSHIP" | "AFFILIATE" | "MANUAL" | "MOCK";
}

export interface ProductSearchInput {
  query: string;
  storeId?: string;
  categoryId?: string;
  locale?: string;
  currency?: string;
  limit?: number;
}

export interface ProductDetailsInput {
  externalId: string;
  sourceUrl?: string;
}

export interface ProductMediaInput {
  externalId: string;
  sourceUrl?: string;
}

export interface InventoryResult {
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER" | "UNKNOWN";
  quantity?: number;
  rawData?: unknown;
}

export interface PriceResult {
  price: number;
  currency: string;
  rawData?: unknown;
}

export interface CreateSupplierOrderResult {
  externalOrderId?: string;
  status: "PLACED" | "PENDING" | "ERROR";
  requestJson?: unknown;
  responseJson?: unknown;
  errorMessage?: string;
}

export interface TrackingResult {
  status: string;
  trackingNumber?: string;
  carrier?: string;
  events?: Array<{ date: string; description: string }>;
  rawData?: unknown;
}

export const supplierMediaSchema = z.object({
  url: z.string().url(),
  mediaType: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
  alt: z.string().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  contentType: z.string().optional(),
});

export type SupplierMedia = z.infer<typeof supplierMediaSchema>;

export const productSearchResultSchema = z.object({
  providerKey: z.enum(providerKeys),
  externalId: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  affiliateUrl: z.string().url().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  brand: z.string().optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(3).optional(),
  supplierCost: z.number().nonnegative().optional(),
  shippingCost: z.number().nonnegative().optional(),
  stockStatus: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "PREORDER", "UNKNOWN"]).default("UNKNOWN"),
  shippingDaysMin: z.number().int().nonnegative().optional(),
  shippingDaysMax: z.number().int().nonnegative().optional(),
  countryOfOrigin: z.string().optional(),
  gtin: z.string().optional(),
  sku: z.string().optional(),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  variants: z.array(z.record(z.unknown())).default([]),
  media: z.array(supplierMediaSchema).default([]),
  signals: z.record(z.unknown()).default({}),
  risk: z.record(z.unknown()).default({}),
  rawData: z.unknown().optional(),
  fulfillmentMode: z.enum(["DROPSHIP", "AFFILIATE", "MANUAL", "MOCK"]).optional(),
});

export type ProductSearchResult = z.infer<typeof productSearchResultSchema>;
export type ProductDetailsResult = ProductSearchResult;

export interface CreateDropshipOrderInput {
  orderId: string;
  items: Array<{
    externalId: string;
    quantity: number;
    title: string;
    unitPrice: number;
  }>;
  shippingAddress: Record<string, unknown>;
}

export interface CommerceProvider {
  key: ProviderKey;
  name: string;
  capabilities: ProviderCapabilities;
  defaultFulfillmentMode: ProviderHealth["defaultFulfillmentMode"];
  getHealth(): Promise<ProviderHealth>;
  searchProducts(input: ProductSearchInput): Promise<ProductSearchResult[]>;
  getProductDetails(input: ProductDetailsInput): Promise<ProductDetailsResult>;
  getProductMedia(input: ProductMediaInput): Promise<SupplierMedia[]>;
  getInventory?(input: ProductDetailsInput): Promise<InventoryResult>;
  getPrice?(input: ProductDetailsInput): Promise<PriceResult>;
  createDropshipOrder?(input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult>;
  getTracking?(input: ProductDetailsInput): Promise<TrackingResult>;
}

export const BASE_UNCONFIGURED_CAPABILITIES: ProviderCapabilities = {
  search: false,
  details: false,
  images: false,
  video: false,
  pricing: false,
  inventory: false,
  checkout: false,
  tracking: false,
  returns: false,
  affiliateLinks: false,
};

export function validateSearchResults(
  providerKey: ProviderKey,
  results: unknown[]
): ProductSearchResult[] {
  return results.map((result) => {
    const objectResult =
      typeof result === "object" && result !== null
        ? (result as Record<string, unknown>)
        : {};
    return productSearchResultSchema.parse({ providerKey, ...objectResult });
  });
}

```


---

## src/lib/suppliers/providers/wish-provider.ts

```ts
import { ProviderAuthMissingError, UnsupportedCapabilityError } from "@/lib/suppliers/providers/errors";
import {
  BASE_UNCONFIGURED_CAPABILITIES,
  type CommerceProvider,
  type CreateDropshipOrderInput,
  type CreateSupplierOrderResult,
  type ProductDetailsInput,
  type ProductMediaInput,
  type ProductSearchInput,
  type ProductSearchResult,
  type ProviderCapabilities,
  type ProviderHealth,
  type SupplierMedia,
} from "@/lib/suppliers/providers/types";

export class WishProvider implements CommerceProvider {
  key = "wish" as const;
  name = "Wish Merchant API";
  defaultFulfillmentMode = "MANUAL" as const;

  get capabilities(): ProviderCapabilities {
    const enabled = process.env.WISH_ENABLED === "true";
    return {
      ...BASE_UNCONFIGURED_CAPABILITIES,
      search: enabled,
      details: enabled,
      images: enabled,
      pricing: enabled,
      inventory: enabled,
      checkout: false,
    };
  }

  async getHealth(): Promise<ProviderHealth> {
    const missing = ["WISH_CLIENT_ID", "WISH_CLIENT_SECRET", "WISH_ACCESS_TOKEN"].filter((key) => !process.env[key]);
    return {
      key: this.key,
      name: this.name,
      status: missing.length || process.env.WISH_ENABLED !== "true" ? "NOT_CONFIGURED" : "OK",
      message: missing.length
        ? "Wish remains manual mode until merchant API credentials are configured."
        : "Wish credentials are present. Checkout is still disabled until an approved order flow is added.",
      missingEnv: missing.length ? missing : undefined,
      capabilities: this.capabilities,
      defaultFulfillmentMode: this.defaultFulfillmentMode,
    };
  }

  async searchProducts(_input: ProductSearchInput): Promise<ProductSearchResult[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["WISH_ENABLED", "WISH_ACCESS_TOKEN"]);
  }

  async getProductDetails(_input: ProductDetailsInput): Promise<ProductSearchResult> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["WISH_ENABLED", "WISH_ACCESS_TOKEN"]);
  }

  async getProductMedia(_input: ProductMediaInput): Promise<SupplierMedia[]> {
    void _input;
    throw new ProviderAuthMissingError(this.key, ["WISH_ENABLED", "WISH_ACCESS_TOKEN"]);
  }

  async createDropshipOrder(_input: CreateDropshipOrderInput): Promise<CreateSupplierOrderResult> {
    void _input;
    throw new UnsupportedCapabilityError(this.key, "checkout");
  }
}

export const wishProvider = new WishProvider();

```


---

## src/lib/suppliers/scrape/aliexpress.ts

```ts
export interface AliExpressScrapeResult {
  listingUrl: string | null;
  productId: string | null;
  imageUrls: string[];
}

export async function scrapeAliExpressProduct(_productId: string): Promise<AliExpressScrapeResult> {
  void _productId;
  return { listingUrl: null, productId: null, imageUrls: [] };
}

export async function searchAliExpressProducts(_query: string): Promise<AliExpressScrapeResult[]> {
  void _query;
  return [];
}

export async function scrapeAliExpressListing(_listingUrl: string): Promise<AliExpressScrapeResult> {
  void _listingUrl;
  return { listingUrl: null, productId: null, imageUrls: [] };
}

```


---

## src/lib/suppliers/scrape/ebay.ts

```ts
export interface EbayScrapeResult {
  listingUrl: string | null;
  imageUrls: string[];
}

export async function scrapeEbayListing(_listingUrl: string): Promise<EbayScrapeResult> {
  void _listingUrl;
  return { listingUrl: null, imageUrls: [] };
}

export async function searchEbayProducts(_query: string): Promise<EbayScrapeResult[]> {
  void _query;
  return [];
}

```


---

## src/lib/suppliers/scrape/image-urls.ts

```ts
import type { ScrapedSupplierImage } from "@/lib/images/types";

const MARKETPLACE_IMAGE_HOST =
  /(?:alicdn\.com|aliexpress-media\.com|ebayimg\.com|temu\.com|wish\.com|alibaba\.com)/i;

const SKIP_IMAGE_PATTERN =
  /(?:logo|icon|avatar|badge|banner|sprite|payment|flag|\/48x48|\/20x20|\/702x72|-tps-\d+-\d+|imgextra\/i\d+\/O1CN)/i;

/** Strip markdown artifacts from a raw URL token. */
export function cleanRawImageUrl(raw: string): string {
  let url = raw.trim();
  const markdownSplit = url.indexOf("](");
  if (markdownSplit > 0) url = url.slice(0, markdownSplit);
  url = url.replace(/^[\[(]+/, "").replace(/[)\]"',]+$/, "");
  url = url.replace(/(\.(?:jpg|jpeg|png|webp|avif))(?:_\.\w+)?[^a-zA-Z0-9./-]*$/i, "$1");
  return url.split("?")[0];
}

/** Normalize AliExpress/eBay thumbnail URLs to full-size CDN URLs. */
export function normalizeMarketplaceImageUrl(url: string): string {
  let normalized = cleanRawImageUrl(url);
  if (!normalized) return "";

  normalized = normalized.replace(/\.(jpg|jpeg|png|webp|avif)_\d+x\d+q?\d*\.(?:jpg|jpeg|avif)$/i, ".$1");
  normalized = normalized.replace(/_(?:\d+x\d+q?\d*)\.(jpg|jpeg|png|webp|avif)$/i, ".$1");
  normalized = normalized.replace(/\.avif$/i, ".jpg");
  normalized = normalized.replace(/\.(jpg|jpeg|png|webp)\.(jpg|jpeg|png|webp)$/i, ".$1");

  if (SKIP_IMAGE_PATTERN.test(normalized)) return "";
  if (normalized.includes("imgextra/")) return "";
  if (/\/\d{1,2}x\d{1,2}\.(png|jpg|webp)$/i.test(normalized)) return "";

  return normalized;
}

function scoreImageUrl(url: string): number {
  let score = 0;
  if (url.includes("aliexpress-media.com/kf/")) score += 50;
  if (url.includes("ae-pic-")) score += 30;
  if (url.includes("ae01.alicdn.com/kf/")) score += 25;
  if (url.includes("ebayimg.com")) score += 20;
  if (url.includes("_220x220") || url.includes("_480x480")) score -= 20;
  if (url.includes(".png")) score -= 5;
  return score;
}

export function rankMarketplaceImageUrls(urls: string[]): string[] {
  return [...new Set(urls)].sort((a, b) => scoreImageUrl(b) - scoreImageUrl(a));
}

export function extractMarketplaceImageUrls(text: string): string[] {
  const pattern =
    /https?:\/\/[^\s"'<>]+(?:alicdn\.com|aliexpress-media\.com|ebayimg\.com|temu\.com|wish\.com|alibaba\.com)[^\s"'<>]*\.(?:jpg|jpeg|png|webp|avif)(?:[^\s"'<>]*)?/gi;
  const matches = text.match(pattern) ?? [];
  const urls: string[] = [];

  for (const raw of matches) {
    const normalized = normalizeMarketplaceImageUrl(raw);
    if (!normalized || !MARKETPLACE_IMAGE_HOST.test(normalized)) continue;
    urls.push(normalized);
  }

  return rankMarketplaceImageUrls(urls);
}

export function extractAliExpressProductIds(text: string): string[] {
  const ids = new Set<string>();
  const pathMatches = text.matchAll(/\/item\/(\d{10,20})\.html/gi);
  for (const match of pathMatches) {
    ids.add(match[1]);
  }
  const looseMatches = text.matchAll(/\b(100500\d{10,13}|3256\d{10,13})\b/g);
  for (const match of looseMatches) {
    ids.add(match[1]);
  }
  return [...ids];
}

export function toScrapedImages(
  urls: string[],
  source: ScrapedSupplierImage["source"],
  supplierProductId: string,
  max = 6
): ScrapedSupplierImage[] {
  return urls.slice(0, max).map((url, index) => ({
    url,
    source,
    supplierProductId,
    sortOrder: index,
  }));
}

export function aliExpressItemUrl(productId: string): string {
  return `https://www.aliexpress.com/item/${productId}.html`;
}

export function aliExpressSearchUrl(query: string): string {
  return `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`;
}

export function ebaySearchUrl(query: string): string {
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`;
}

export function temuSearchUrl(query: string): string {
  return `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(query)}`;
}

```


---

## src/lib/suppliers/scrape/index.ts

```ts
import type { ScrapedSupplierImage } from "@/lib/images/types";

export type SupplierMarketplace = "aliexpress" | "temu" | "ebay" | "wish" | "alibaba";

export interface ScrapeSupplierImagesInput {
  source: SupplierMarketplace;
  searchQuery: string;
  supplierProductId: string;
  listingUrl?: string | null;
}

export interface ScrapeSupplierImagesResult {
  listingUrl: string | null;
  scrapedImages: ScrapedSupplierImage[];
  imageUrls: string[];
  provider?: string;
}

/**
 * Deprecated compatibility shim. Marketplace scraping and reader-based access
 * are disabled; use official provider adapters and media ingestion instead.
 */
export async function scrapeSupplierImages(
  _input: ScrapeSupplierImagesInput
): Promise<ScrapeSupplierImagesResult> {
  void _input;
  return {
    listingUrl: null,
    scrapedImages: [],
    imageUrls: [],
    provider: "disabled",
  };
}

```


---

## src/lib/suppliers/scrape/jina-reader.ts

```ts
export async function fetchReadablePage(_targetUrl: string): Promise<string> {
  void _targetUrl;
  throw new Error("Reader-based marketplace fetching is disabled. Use official provider APIs.");
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

```


---

## src/lib/suppliers/scrape/temu.ts

```ts
export interface TemuScrapeResult {
  listingUrl: string | null;
  imageUrls: string[];
}

export async function scrapeTemuListing(_listingUrl: string): Promise<TemuScrapeResult> {
  void _listingUrl;
  return { listingUrl: null, imageUrls: [] };
}

export async function searchTemuProducts(_query: string): Promise<TemuScrapeResult[]> {
  void _query;
  return [];
}

```


---

## src/lib/suppliers/sync-supplier-images.ts

```ts
import type { PrismaClient } from "@prisma/client";

type DbClient = Pick<PrismaClient, "product" | "store">;

export interface SyncSupplierImagesResult {
  productId: string;
  slug: string;
  imageCount: number;
  listingUrl: string | null;
  skipped?: boolean;
  error?: string;
}

/**
 * Deprecated safety shim.
 *
 * The old image sync used marketplace page scraping. Runtime supplier media now
 * flows through provider adapters and src/lib/media/ingest-product-media.ts.
 */
export async function syncSupplierImagesForProduct(
  db: DbClient,
  productId: string,
  _options?: { delayMs?: number }
): Promise<SyncSupplierImagesResult> {
  void _options;
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { slug: true, supplierUrl: true },
  });
  return {
    productId,
    slug: product?.slug ?? "unknown",
    imageCount: 0,
    listingUrl: product?.supplierUrl ?? null,
    skipped: true,
    error: "Deprecated scraping sync is disabled. Use provider media ingestion instead.",
  };
}

export async function syncSupplierImagesForStore(
  db: DbClient,
  storeSlug: string,
  options?: { delayMs?: number; limit?: number }
): Promise<SyncSupplierImagesResult[]> {
  const store = await db.store.findUnique({ where: { slug: storeSlug }, select: { id: true } });
  if (!store) throw new Error(`Unknown store: ${storeSlug}`);
  const products = await db.product.findMany({
    where: { storeId: store.id, isPublished: true },
    select: { id: true },
    orderBy: { updatedAt: "asc" },
    take: options?.limit,
  });
  return Promise.all(products.map((product) => syncSupplierImagesForProduct(db, product.id)));
}

export async function syncSupplierImagesForAllStores(
  db: DbClient,
  options?: { delayMs?: number; limitPerStore?: number }
): Promise<{ storeSlug: string; results: SyncSupplierImagesResult[] }[]> {
  const stores = await db.store.findMany({
    where: { isActive: true },
    select: { slug: true },
    orderBy: { slug: "asc" },
  });
  const output = [];
  for (const store of stores) {
    output.push({
      storeSlug: store.slug,
      results: await syncSupplierImagesForStore(db, store.slug, { limit: options?.limitPerStore }),
    });
  }
  return output;
}

```


---

## src/lib/suppliers/types.ts

```ts
/**
 * Supplier adapter contract.
 *
 * Every fulfillment source (AliExpress-style aggregator, EU warehouse,
 * print-on-demand, ...) is integrated through this interface so stores can
 * import products from any supplier with the same pipeline
 * (see import-products.ts).
 */

export interface RawSupplierProduct {
  /** Supplier's own product id. */
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  /** Full supplier gallery when scraped from Ali/Temu/eBay. */
  galleryUrls?: string[];
  /** Direct listing URL for image re-sync cron. */
  supplierUrl?: string;
  supplierSource?: "aliexpress" | "temu" | "ebay" | "wish" | "alibaba";
  supplierSearchQuery?: string;
  /** Unit cost charged by the supplier, in USD. */
  costUsd: number;
  /** Supplier's shipping charge to typical destination, in USD. */
  shippingCostUsd: number;
  shipsFromCountry: string;
  estimatedShippingDaysMin: number;
  estimatedShippingDaysMax: number;
  stockQuantity: number;
  attributes: Record<string, string>;
  keywords: string[];
}

export interface NormalizedSupplierProduct {
  supplierName: string;
  supplierProductId: string;
  title: string;
  description: string;
  imageUrl: string;
  galleryUrls?: string[];
  supplierUrl?: string;
  supplierSource?: "aliexpress" | "temu" | "ebay" | "wish" | "alibaba";
  supplierSearchQuery?: string;
  cost: number;
  shippingCost: number;
  shippingDaysMin: number;
  shippingDaysMax: number;
  countryOfOrigin: string;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  specs: { label: string; value: string }[];
  keywords: string[];
}

export interface ShippingEstimate {
  daysMin: number;
  daysMax: number;
  costUsd: number;
}

export interface LandedCost {
  unitCost: number;
  shippingCost: number;
  /** Placeholder for duties/VAT handling per destination market. */
  estimatedDuties: number;
  total: number;
}

export interface SupplierAdapter {
  readonly name: string;
  /** 0-1, feeds into productScore. */
  readonly reliabilityScore: number;

  searchProducts(query: string): Promise<RawSupplierProduct[]>;
  getProduct(id: string): Promise<RawSupplierProduct | null>;
  normalizeProduct(raw: RawSupplierProduct): NormalizedSupplierProduct;
  estimateShipping(raw: RawSupplierProduct): ShippingEstimate;
  calculateLandedCost(raw: RawSupplierProduct): LandedCost;
}

```


---

## src/lib/tenant/resolve-tenant.ts

```ts
import { cache } from "react";
import { prisma } from "@/lib/db";
import { rethrowDevMissingTableError } from "@/lib/db/dev-guard";
import {
  DEFAULT_STORE_SLUG,
  resolveStoreSlugFromHost,
} from "@/config/domain-map";
import type { Prisma } from "@prisma/client";

export type StoreWithTheme = Prisma.StoreGetPayload<{
  include: { theme: true };
}>;

/**
 * Server-side tenant resolution. Unlike the edge middleware (which only has
 * the static domain map), this also consults the Domain table, so domains
 * added at runtime resolve correctly for sitemaps/feeds/robots.
 */

export const getStoreBySlug = cache(
  async (slug: string): Promise<StoreWithTheme | null> => {
    try {
      return await prisma.store.findFirst({
        where: { slug, isActive: true },
        include: { theme: true },
      });
    } catch (error) {
      rethrowDevMissingTableError(error, "Store");
    }
  }
);

export async function resolveStoreSlugFromHostname(
  hostname: string
): Promise<string | null> {
  const host = hostname.toLowerCase().split(":")[0];

  const mapped = resolveStoreSlugFromHost(host);
  if (mapped) return mapped;

  const domain = await prisma.domain.findUnique({
    where: { hostname: host },
    include: { store: { select: { slug: true, isActive: true } } },
  });
  if (domain?.store.isActive) return domain.store.slug;

  return null;
}

/**
 * Resolve a store for request-handler contexts (robots, sitemap, feeds) that
 * receive a Host header and optionally an explicit ?store= override.
 */
export async function resolveStoreForRequest(options: {
  host?: string | null;
  storeParam?: string | null;
}): Promise<StoreWithTheme | null> {
  if (options.storeParam) {
    const bySlug = await getStoreBySlug(options.storeParam);
    if (bySlug) return bySlug;
  }
  if (options.host) {
    const slug = await resolveStoreSlugFromHostname(options.host);
    if (slug) {
      const byHost = await getStoreBySlug(slug);
      if (byHost) return byHost;
    }
  }
  return getStoreBySlug(DEFAULT_STORE_SLUG);
}

```


---

## src/lib/theme.ts

```ts
import type { StoreTheme } from "@prisma/client";
import type { CSSProperties } from "react";

/**
 * Converts a StoreTheme row into the CSS custom properties consumed by
 * Tailwind (see tailwind.config.ts). Applied on the store layout wrapper so
 * every tenant gets its own palette from one stylesheet.
 */

const FONT_STACKS: Record<string, string> = {
  "system-ui":
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  rounded:
    'ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace',
  humanist:
    'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", system-ui, sans-serif',
  geometric:
    'Avenir, Montserrat, Corbel, "URW Gothic", source-sans-pro, system-ui, sans-serif',
};

function fontStack(name: string): string {
  return FONT_STACKS[name] ?? FONT_STACKS["system-ui"];
}

function hexChannels(hex: string): [number, number, number] {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const value = match ? parseInt(match[1], 16) : 0;
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** #rrggbb -> "r g b" channel triple for Tailwind <alpha-value> colors. */
function hexToRgbChannels(hex: string): string {
  return hexChannels(hex).join(" ");
}

/** #rrggbb -> rgba() string with the given alpha (for soft tints). */
function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexChannels(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function buildThemeStyle(theme: StoreTheme | null): CSSProperties {
  const primary = theme?.primaryColor ?? "#1d4ed8";
  const secondary = theme?.secondaryColor ?? "#1e293b";
  const accent = theme?.accentColor ?? "#f59e0b";
  const background = theme?.backgroundColor ?? "#f8fafc";
  const text = theme?.textColor ?? "#0f172a";
  const radius = theme?.borderRadius ?? "0.75rem";

  return {
    "--color-primary": primary,
    "--color-primary-rgb": hexToRgbChannels(primary),
    "--color-primary-soft": hexToRgba(primary, 0.08),
    "--color-secondary": secondary,
    "--color-secondary-rgb": hexToRgbChannels(secondary),
    "--color-accent": accent,
    "--color-accent-rgb": hexToRgbChannels(accent),
    "--color-background": background,
    "--color-background-rgb": hexToRgbChannels(background),
    "--color-text": text,
    "--color-text-rgb": hexToRgbChannels(text),
    "--radius": radius,
    "--font-heading": fontStack(theme?.fontHeading ?? "system-ui"),
    "--font-body": fontStack(theme?.fontBody ?? "system-ui"),
  } as CSSProperties;
}

```


---

## src/lib/types.ts

```ts
/**
 * Domain-level types shared across the app. SQLite cannot store native enums
 * or JSON, so these constants + types are the single source of truth for the
 * string values persisted in the database.
 */

export const STOCK_STATUSES = [
  "IN_STOCK",
  "LOW_STOCK",
  "OUT_OF_STOCK",
  "PREORDER",
] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const CONTENT_PAGE_TYPES = [
  "GUIDE",
  "COMPARISON",
  "FAQ",
  "LANDING",
  "POLICY",
] as const;
export type ContentPageType = (typeof CONTENT_PAGE_TYPES)[number];

export interface SpecItem {
  label: string;
  value: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Out of stock",
  PREORDER: "Pre-order",
};

export function isStockStatus(value: string): value is StockStatus {
  return (STOCK_STATUSES as readonly string[]).includes(value);
}

/** Minimal product shape that is safe to serialize to client components. */
export interface ClientProduct {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  brand: string;
  imageUrl: string;
  imageAlt: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stockStatus: string;
  shippingDaysMin: number;
  shippingDaysMax: number;
  countryOfOrigin: string | null;
  useCases: string[];
  productScore: number;
  fulfillmentMode: string;
  affiliateUrl: string | null;
  providerKey: string | null;
  checkoutAvailable: boolean;
}

```


---

## src/lib/uploads/save-upload.ts

```ts
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Local image upload helper. In development (and simple single-server
 * deployments) uploads are written under public/uploads/<storeSlug>/ and served
 * statically. For multi-instance production, swap the body of `saveUpload` for
 * an S3/R2 put and return the CDN URL — the call sites and return shape stay
 * the same.
 */

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export interface SaveUploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

function sanitizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60);
}

export async function saveUpload(
  file: File,
  storeSlug: string
): Promise<SaveUploadResult> {
  const safeSlug = sanitizeSlug(storeSlug);
  if (!safeSlug) return { ok: false, error: "Invalid store." };

  const extension = EXTENSION_BY_TYPE[file.type];
  if (!extension) {
    return { ok: false, error: "Unsupported image type. Use PNG, JPEG, WebP, GIF or AVIF." };
  }
  if (file.size === 0) return { ok: false, error: "File is empty." };
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image is larger than 5 MB." };
  }

  const directory = path.join(process.cwd(), "public", "uploads", safeSlug);
  await mkdir(directory, { recursive: true });

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(directory, filename), buffer);

  return { ok: true, url: `/uploads/${safeSlug}/${filename}` };
}

```


---

## src/lib/utils/json.ts

```ts
import { z } from "zod";
import type { FaqItem, SpecItem } from "@/lib/types";

/**
 * SQLite stores our JSON columns as strings. These helpers parse them safely
 * with Zod so malformed data degrades to an empty value instead of crashing
 * a page render.
 */

const stringArraySchema = z.array(z.string());

const specArraySchema = z.array(
  z.object({ label: z.string(), value: z.string() })
);

const faqArraySchema = z.array(
  z.object({ question: z.string(), answer: z.string() })
);

function safeParse<T>(raw: string | null | undefined, schema: z.ZodType<T>, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

export function parseStringArray(raw: string | null | undefined): string[] {
  return safeParse(raw, stringArraySchema, []);
}

export function parseSpecs(raw: string | null | undefined): SpecItem[] {
  return safeParse(raw, specArraySchema, []);
}

export function parseFaq(raw: string | null | undefined): FaqItem[] {
  return safeParse(raw, faqArraySchema, []);
}

export function parseJsonObject(
  raw: string | null | undefined
): Record<string, unknown> {
  return safeParse(raw, z.record(z.unknown()), {});
}

export function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

```


---

## src/lib/validation/schemas.ts

```ts
import { z } from "zod";
import { CONTENT_PAGE_TYPES, STOCK_STATUSES } from "@/lib/types";

/** Shared Zod schemas for forms, server actions and seed data. */

export const stockStatusSchema = z.enum(STOCK_STATUSES);
export const contentPageTypeSchema = z.enum(CONTENT_PAGE_TYPES);

export const newsletterSchema = z.object({
  storeSlug: z.string().min(1),
  email: z.string().email("Enter a valid email address"),
  source: z.string().min(1).max(60).default("homepage"),
  preferences: z.record(z.unknown()).optional(),
});

export const checkoutSchema = z.object({
  storeSlug: z.string().min(1),
  name: z.string().min(2, "Enter your full name").max(120),
  email: z.string().email("Enter a valid email address"),
  addressLine1: z.string().min(4, "Enter your street address").max(200),
  city: z.string().min(1, "Enter your city").max(100),
  postalCode: z.string().min(2, "Enter your postal code").max(20),
  country: z.string().min(2, "Enter your country").max(60),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1, "Your cart is empty"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const trackEventSchema = z.object({
  storeSlug: z.string().min(1),
  eventName: z.string().min(1),
  sessionId: z.string().min(1).max(80),
  payload: z.record(z.unknown()).default({}),
});

/** Seed-time product validation: catches typos in the big seed data files. */
export const seedProductSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  subtitle: z.string(),
  description: z.string().min(80),
  shortDescription: z.string().min(20).max(300),
  brand: z.string().min(1),
  sku: z.string().min(3),
  gtin: z.string().nullable().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().nullable().optional(),
  cost: z.number().positive(),
  shippingCost: z.number().min(0),
  stockStatus: stockStatusSchema,
  supplierName: z.string().min(1),
  supplierProductId: z.string().min(1),
  supplierSource: z
    .enum(["aliexpress", "temu", "ebay", "wish", "alibaba"])
    .optional(),
  supplierUrl: z.string().url().optional(),
  supplierSearchQuery: z.string().min(3).optional(),
  shippingDaysMin: z.number().int().min(1),
  shippingDaysMax: z.number().int().min(1),
  countryOfOrigin: z.string().nullable().optional(),
  materials: z.string().nullable().optional(),
  warranty: z.string().nullable().optional(),
  returnable: z.boolean(),
  pros: z.array(z.string()).min(2),
  cons: z.array(z.string()).min(1),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).min(3),
  useCases: z.array(z.string()).min(1),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  seoTitle: z.string().min(10),
  seoDescription: z.string().min(40),
});

export type SeedProduct = z.infer<typeof seedProductSchema>;

```


---

## src/middleware.ts

```ts
import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_STORE_SLUG,
  STORE_COOKIE,
  resolveStoreSlugFromHost,
} from "@/config/domain-map";

/**
 * Multi-tenant routing.
 *
 * Storefront pages live under /s/[storeSlug] internally, but visitors always
 * see clean URLs (/, /p/some-product, /guides/foo). This middleware rewrites
 * every storefront request to the internal path based on, in priority order:
 *
 *   1. ?store=<slug>      local development convenience
 *   2. Host header        production domain -> slug via src/config/domain-map.ts
 *   3. msdf_store cookie  remembers the tenant across clean-URL navigation
 *   4. NEXT_PUBLIC_DEFAULT_STORE
 *
 * Direct /s/[slug] access is allowed (useful in dev) but is never the
 * canonical URL: every page emits a canonical tag pointing at the store's
 * primary domain with the clean path.
 */

const PASSTHROUGH_PREFIXES = ["/api", "/admin", "/_next", "/s/"];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Static files (robots.txt, sitemap.xml, favicon.ico, images, ...) and
  // metadata routes resolve their own tenant from the Host header.
  if (/\.[A-Za-z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Direct internal-path access: pass through but remember the store so that
  // subsequent clean-URL navigation stays on the same tenant in dev.
  if (pathname === "/s" || pathname.startsWith("/s/")) {
    const slug = pathname.split("/")[2];
    const response = NextResponse.next();
    if (slug) {
      response.cookies.set(STORE_COOKIE, slug, { path: "/", sameSite: "lax" });
    }
    return response;
  }

  for (const prefix of PASSTHROUGH_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  const queryStore = searchParams.get("store");
  const host = request.headers.get("host") ?? "";
  const hostStore = resolveStoreSlugFromHost(host);
  const cookieStore = request.cookies.get(STORE_COOKIE)?.value;

  const slug = queryStore || hostStore || cookieStore || DEFAULT_STORE_SLUG;

  const url = request.nextUrl.clone();
  url.pathname = `/s/${slug}${pathname === "/" ? "" : pathname}`;
  url.searchParams.delete("store");

  const response = NextResponse.rewrite(url);
  response.cookies.set(STORE_COOKIE, slug, { path: "/", sameSite: "lax" });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

```


---

## tailwind.config.ts

```ts
import type { Config } from "tailwindcss";

/**
 * Theme colors map to CSS variables that are set per-store in
 * src/app/s/[store]/layout.tsx, so a single Tailwind build serves
 * every tenant with its own palette.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // RGB channel variables so Tailwind opacity modifiers (e.g. ink/60)
        // work with per-store dynamic palettes.
        primary: "rgb(var(--color-primary-rgb) / <alpha-value>)",
        "primary-soft": "var(--color-primary-soft)",
        secondary: "rgb(var(--color-secondary-rgb) / <alpha-value>)",
        accent: "rgb(var(--color-accent-rgb) / <alpha-value>)",
        surface: "rgb(var(--color-background-rgb) / <alpha-value>)",
        ink: "rgb(var(--color-text-rgb) / <alpha-value>)",
      },
      borderRadius: {
        theme: "var(--radius)",
        "theme-lg": "calc(var(--radius) * 1.5)",
      },
      fontFamily: {
        heading: "var(--font-heading)",
        body: "var(--font-body)",
      },
      maxWidth: {
        site: "80rem",
      },
    },
  },
  plugins: [],
};

export default config;

```


---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUncheckedIndexedAccess": false,
    "forceConsistentCasingInFileNames": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```


---

## vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron/catalog-sync",
      "schedule": "0 3 * * *"
    }
  ]
}

```
