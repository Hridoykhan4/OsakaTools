# Deploying OSAKA TOOL on Coolify

The stack is one Docker Compose resource with two services:

| Service | Port | Public? |
| --- | --- | --- |
| `frontend` (Next.js) | 3000 | **Yes**, assign the domain here |
| `backend` (Express API) | 5000 | No. It is reached by the frontend at `http://backend:5000/api`, and browsers call `/api` on the site's own domain. |

Only **one domain** is required.

## 1. Create the resource (staging)

1. Coolify → Project **OsakaTool** → environment **production** → **+ New resource**.
2. Choose **Public Git Repository**. The repo is public, so no GitHub App is needed.
   - Repository: `https://github.com/Hridoykhan4/OsakaTools`, branch `main`.
3. Build pack: **Docker Compose**. Base directory `/`, compose file `/docker-compose.yml`.
4. Domains:
   - **frontend**: a staging hostname, for example the Coolify-generated `sslip.io` URL or `staging.<your-domain>`. Use `https`, port 3000 (`https://staging.example.com:3000` in Coolify's domain field syntax).
   - **backend**: leave empty. It does not need a public domain.

## 2. Environment variables (Coolify → Environment Variables)

Mark the database, admin, session and Cloudinary values as **secrets**.

```dotenv
NEXT_PUBLIC_SITE_URL=https://<staging-host>        # no trailing slash; baked in at build time
FRONTEND_ORIGIN=https://<staging-host>              # must equal the site origin (CSRF allow-list)
SITE_INDEXABLE=false                                # staging stays out of search engines
NEXT_PUBLIC_CONTACT_EMAIL=sales@osakatool.com

MONGODB_URI=<the new connection string>             # same value as backend/.env
MONGODB_DB=osaka_tool                               # the API refuses osaka_toyo
ADMIN_USERNAME=<owner username>
ADMIN_PASSWORD=<10+ characters>                     # creates the first owner when no users exist
ADMIN_SESSION_SECRET=<48+ random characters>        # e.g. openssl rand -hex 32

CLOUDINARY_CLOUD_NAME=<...>
CLOUDINARY_API_KEY=<...>
CLOUDINARY_API_SECRET=<...>
CLOUDINARY_FOLDER=OsakaTool

DEPLOYMENT_ENV=staging
INDEXNOW_ENABLED=false
PUBLIC_SITE_URL=https://osakatool.com
```

On MongoDB Atlas → Network Access, allow the Coolify server's outbound IP.

## 3. Deploy and verify

Click **Deploy**. Startup order: the backend becomes healthy (MongoDB connected), then the frontend starts. The frontend health check calls `/api/health` through the proxy, so a healthy frontend also proves backend connectivity.

Check:

- `https://<staging-host>/api/health` returns `"status":"ok"` and `"dbName":"osaka_tool"`.
- `https://<staging-host>/`, `/products` and `/admin/login`: sign in with the owner account.
- `https://<staging-host>/robots.txt` returns `Disallow: /`, and responses carry `X-Robots-Tag: noindex`.

The database already contains the taxonomy, 6 articles and 4 imported products. Startup seeding is idempotent and never overwrites edits.

## 4. Production activation (after buying osakatool.com)

1. **DNS** at the registrar:
   - `A osakatool.com → <Coolify server IP>`
   - `CNAME www → osakatool.com` (or an A record to the same IP)
2. Coolify → frontend domains: `https://osakatool.com:3000,https://www.osakatool.com:3000`. Next.js redirects `www` to the apex.
3. Update the environment variables, then **redeploy**. A rebuild is required because `NEXT_PUBLIC_*` and `SITE_INDEXABLE` are baked in at build time.
   ```dotenv
   NEXT_PUBLIC_SITE_URL=https://osakatool.com
   FRONTEND_ORIGIN=https://osakatool.com,https://www.osakatool.com
   SITE_INDEXABLE=true
   DEPLOYMENT_ENV=production
   INDEXNOW_ENABLED=true
   ```
4. Verify:
   - `https://osakatool.com/robots.txt` lists the sitemap.
   - `/sitemap.xml` loads.
   - `/53520aeff9312b8cfdfb30a6563c853fd21d206b17b2b8af.txt` (IndexNow key) returns the key as plain text.
5. **Google Search Console**: add a Domain property for `osakatool.com` (DNS TXT verification), then submit `https://osakatool.com/sitemap.xml`. Alternatively, set `GOOGLE_SITE_VERIFICATION` for the HTML-tag method and redeploy.
6. **Bing Webmaster Tools**: import from Search Console, or set `BING_SITE_VERIFICATION`. Then in Admin → Search indexing, click **Queue full catalogue**.
7. Run Lighthouse or PageSpeed on `/`, `/products` and one product page, and record the real field data (CrUX) after 28 days.

## Backups

- MongoDB Atlas: enable continuous cloud backup or scheduled snapshots for the cluster. Before bulk changes, take an on-demand `mongodump --db osaka_tool`.
- Cloudinary assets live in the `OsakaTool/` folder. Product and document records store each `publicId`.
- To restore: `mongorestore --nsInclude 'osaka_tool.*' <dump>`, then redeploy.
