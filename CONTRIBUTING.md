# Contributing

Production updates land only when a pull request is merged into `main`.

1. Branch from `main`. Name the branch after the change, for example `fix-footer-spacing`.
2. Push the branch and open a pull request. Vercel builds a preview and posts the preview URL on the pull request.
3. Test on that preview. Preview, development, and any other non-production deployment send `noindex` on every page and serve a `robots.txt` that disallows all crawlers. The production deployment is unchanged.
4. GitHub Actions runs `npm ci`, lint, the content build, and the production build on the pull request. That check has to pass before the pull request can merge.
5. Merge the pull request. Vercel deploys that commit to production.

## Roll back

In the [Vercel dashboard](https://vercel.com/dashboard), open this project, then **Deployments**. Find the last good production deployment, open its **⋯** menu, and choose **Instant Rollback**. Vercel points the production domains at that deployment. The git history stays as it is; ship the fix forward with a new pull request.
