# Deployment

## Current Deployment Target

The production site is deployed from Astro static output:

```bash
npm run build
```

Deployable output:

- `astro-dist/`

## Important Build Notes

- `npm run astro:dev` and `npm run astro:build` both run `npm run astro:prepare` first
- `astro:prepare` generates `astro-public/`
- `astro-public/` is generated build input, not a source directory
- do not edit generated files in `astro-public/` manually

## GitHub Pages

The repo uses `.github/workflows/deploy-pages.yml`.

That workflow currently:

1. installs dependencies with `npm ci`
2. builds the Astro site into `astro-dist/`
3. verifies the Astro output
4. uploads `astro-dist/` to GitHub Pages

## Recommended Release Checklist

Before pushing a production change:

1. run `npm run build`
2. run `npm run verify`
3. push the branch to GitHub

## Custom Domain

The Astro deployment writes `astro-dist/CNAME` from `site.config.json`.

Current production domain:

- `maatriks.ai`

## DNS For GitHub Pages

If the apex domain points directly to GitHub Pages, GitHub currently documents these `A` records:

- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

Optional IPv6 `AAAA` records:

- `2606:50c0:8000::153`
- `2606:50c0:8001::153`
- `2606:50c0:8002::153`
- `2606:50c0:8003::153`

If `www.maatriks.ai` is also needed, point `www` to the GitHub Pages hostname with a `CNAME`.

## DNS Safety Notes

- leave existing mail-related `MX` and `TXT` records alone unless mail is being moved intentionally
- leave unrelated verification records alone
- verify the custom domain inside GitHub Pages settings after DNS resolves
- enable HTTPS in GitHub Pages after the domain verifies

## References

- GitHub Pages custom domains: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- GitHub Pages domain verification: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
