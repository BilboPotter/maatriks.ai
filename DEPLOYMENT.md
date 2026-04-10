# Deployment

## GitHub Pages

This repo now deploys the Astro static build:

```bash
npm run astro:build
```

The legacy builder is still run in CI as a parity baseline:

```bash
node build.js
npm run astro:verify
```

Recommended GitHub Pages setup:

1. Push this repo to GitHub.
2. In GitHub, enable Pages for the repository.
3. Use the GitHub Actions workflow in `.github/workflows/deploy-pages.yml`.
4. Set the custom domain to `maatriks.ai`.
5. Enable HTTPS in Pages settings after DNS resolves.
6. Verify the custom domain in GitHub Pages settings.

The GitHub Actions workflow now:

1. installs dependencies with `npm ci`
2. builds the legacy baseline into `dist/`
3. verifies auth output
4. builds Astro into `astro-dist/`
5. verifies Astro matches the legacy output
6. uploads `astro-dist/` to GitHub Pages

## DNS For `maatriks.ai`

If you are pointing the apex domain directly to GitHub Pages, GitHub’s current docs say to use these `A` records:

- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

Optional `AAAA` records GitHub documents for IPv6:

- `2606:50c0:8000::153`
- `2606:50c0:8001::153`
- `2606:50c0:8002::153`
- `2606:50c0:8003::153`

If you also want `www.maatriks.ai`, point `www` to the GitHub Pages hostname for the repo with a `CNAME`.

Important:

- keep existing mail records unless you intentionally change email providers
- do not remove unrelated verification TXT records
- the Astro deployment build writes `astro-dist/CNAME` from `site.config.json`

## Veebimajutus Notes

In Veebimajutus DNS:

1. leave `NS` records alone
2. add the GitHub Pages `A` records for the apex domain
3. optionally add the GitHub Pages `AAAA` records
4. add a `CNAME` for `www` if you want the subdomain too
5. leave existing `MX` and mail-related `TXT` records unless you are intentionally changing mail

## References

- GitHub Pages custom domains: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- GitHub Pages domain verification: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
