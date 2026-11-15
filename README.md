# OSAKA TOOL

Website, product catalogue and operations dashboard for **OSAKA TOOL**: test and measurement instruments, electronics laboratory equipment, industrial tools and documented medical diagnostic devices for professional buyers worldwide.

## Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| API | Node.js 22, Express 4 |
| Database | MongoDB (Mongoose), database `osaka_tool` |
| Media | Cloudinary (images and PDF documents) |
| Deployment | Docker Compose on Coolify |

The browser talks to the API through the website's own `/api` proxy, so the site needs **one public domain** and the session cookie is first-party.

## Features

**Public site**: editorial homepage, catalogue with search by name, model or SKU, category, manufacturer and specification filters, product comparison, an RFQ list with bulk quantities, category buyer guides, technical articles, a verified documentation library, and industry, technology, distribution, about and contact pages.

**Operations dashboard** (`/admin`):
- Analytics and an attention queue.
- Products: editor, bulk actions, publication workflow, specification editor, multi-image and PDF management, compliance and medical-market fields, SEO controls and change history.
- Categories, brands, imports, documents and evidence, RFQs and inquiries, organizations, articles, users and roles, audit log, and search indexing.

**Integrity rules enforced by the API**:
- Every product names its actual manufacturer.
- Publishing requires an image, a manufacturer and a description.
- Medical devices need a registered market backed by a verified evidence document.
- OSAKA TOOL private-label branding needs verified evidence.
- Only verified documents can be shown publicly.
- Origin is displayed only when verified.

**SEO**:
- Canonical URLs, Product, BreadcrumbList, Organization, TechArticle and CollectionPage JSON-LD, with no invented prices, ratings or reviews.
- A database-driven sitemap, dynamic Open Graph images, and noindex on filtered URLs.
- IndexNow, active in production only.
- Staging is fully noindex through the meta tag, the `X-Robots-Tag` header and `robots.txt`.

## Roles

| Role | Can |
| --- | --- |
| owner | everything, including users |
| admin | publish, delete, verify documents, commit imports, audit log |
| editor | create and edit catalogue, articles and documents; preview imports |
| sales | manage inquiries and organizations |
| viewer | read-only dashboard |

The first owner is created from `ADMIN_USERNAME` / `ADMIN_PASSWORD` when no users exist.

## Local development

```bash
npm install && npm run install:all
cp backend/.env.example backend/.env       # fill in values
printf 'NEXT_PUBLIC_SITE_URL=http://localhost:3000\nAPI_INTERNAL_URL=http://localhost:5000/api\n' > frontend/.env.local
npm run seed            # taxonomy + engineering articles (idempotent)
npm run import:preview  # dry run of the Prime Gadgets import
npm run import:commit   # import relevant products
npm run dev             # http://localhost:3000, admin at /admin
```

## Tests

```bash
npm test                          # backend: auth/RBAC, CSRF, DB isolation, import pipeline, publication rules
npm run lint --prefix frontend
npm run build --prefix frontend
```

## Product import

`backend/src/services/importers/primegadgets.js` reads the Prime Gadgets UAE product API. It does the following:
- Keeps only products that fit the OSAKA TOOL taxonomy.
- Extracts model numbers and specifications from the source data. Nothing is invented.
- Preserves the source manufacturer.
- Deduplicates by source ID, model and SKU, and stores provenance (`source.*`) on every record.
- Copies images into Cloudinary.

Medical devices always land in review. Add more sources by adding an adapter with `fetchAll()` and `normalize()`.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md).
