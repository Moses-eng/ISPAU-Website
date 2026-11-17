# Public ISP profile SEO

The public directory now uses crawlable links such as `/members/isp-42/example-isp/`. Each approved profile has its own title, description, canonical URL, social sharing metadata and ProfilePage/Organization JSON-LD. The build emits real HTML content for directory/profile URLs and a public-only sitemap, so discovery does not depend solely on executing React. Private accounts, application data, invoices and Trade Credit complaints are never included in that export.

## Preview and publication

Local sample profiles remain noindex. No real ISP is published merely because its name appears in a sample or was mentioned as an example. Only profiles marked active, approved, eligible and publication-consented are accepted from the build export. A known company name is not publication permission.

Until the client supplies the public domain, leave `VITE_PUBLIC_SITE_URL` blank and `VITE_PUBLIC_INDEXING=false`. Before the connected production release, supply an authoritative public-profile export using `PUBLIC_DIRECTORY_FILE`, set the HTTPS public origin, and enable indexing. These settings are read by Vite's profile-page plugin. Do not put private application exports or credentials in Vite variables.

Example environment configuration (substitute the client's real domain):

```dotenv
VITE_PUBLIC_SITE_URL=https://www.example.org
VITE_PUBLIC_INDEXING=true
PUBLIC_DIRECTORY_FILE=approved-members.json
```

The JSON file is a backend-supplied array. Example shape only; use approved real company data:

```json
[
  {
    "id": "isp-42",
    "name": "Example ISP",
    "description": "Approved company introduction.",
    "services": ["Business internet"],
    "coverage": ["Kampala"],
    "website": "https://www.example.com",
    "city": "Kampala",
    "district": "Kampala",
    "active": true,
    "approved": true,
    "eligible": true,
    "consent": true
  }
]
```

Optional public fields are `logoSrc`, `email` and `phone`. IDs must be stable letters/numbers/hyphens/underscores. Unapproved records are discarded; output fields are explicitly allowlisted. The React directory and generated HTML consume the same approved dataset. Development without this file continues to use locally published sample profiles, marked as preview.

## Backend and hosting connection

- Produce this export from the approved public directory, not from the private membership workspace.
- Rebuild/redeploy on publication, approved profile changes, membership ineligibility or consent withdrawal. Remove obsolete profile files from the deployed release; never retain withdrawn pages from an older build.
- Serve generated `/members/.../index.html` files before the SPA fallback. Serve a real 404/410 for unknown, removed or withdrawn member URLs; don't rewrite those URLs to the homepage. Private `/portal` routes may still use the SPA fallback.
- Supply permanent redirects when changing a canonical company slug. Browser navigation canonicalizes legacy hash links, but hosting redirects are needed for old path URLs.
- Keep authentication and private API access enforced by the backend. `robots.txt` and `noindex` are discovery controls, not access controls.
- Once deployed, submit `/sitemap.xml` in Google Search Console and inspect a published profile's live URL. Validate the initial HTML, canonical URL and structured data. Search discovery/ranking is not guaranteed, particularly for broad names already associated with the company's own website.

`src/features/directory/services/profileSeo.ts` owns URL generation, data projection and markup helpers. `ProfileMetadata.tsx` updates metadata during React navigation and removes profile-specific metadata when leaving. `build/profilePages.ts` emits HTML, sitemap and production robots instructions. Preview builds remain blocked from indexing. `tests/profile-seo.test.ts` covers publication gates, data minimisation, URL generation, escaping and emitted HTML.
