---
description: Prepare a tagged release — bump version everywhere, replace @since tokens, update the readme.txt changelog, build the distribution zip, commit, and tag (stops before pushing).
argument-hint: <version> (e.g. 2.0.0, no leading "v")
allowed-tools: Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(git tag:*), Bash(git log:*), Bash(git diff:*), Bash(grep:*), Bash(date:*), Bash(npm:*), Bash(composer:*), Bash(ls:*), Edit, Read
---

Prepare release **$1** for this WordPress plugin (TryAura — AI virtual try-on,
product visualization and product videos for WooCommerce, slug `tryaura`).

Pushing a `v$1` tag triggers `.github/workflows/deploy.yml`, which rebuilds the
plugin, deploys it to the WordPress.org SVN repo (`SLUG: tryaura`) and publishes a
GitHub release with the generated zip attached. This command prepares everything
locally — bump the version everywhere, replace `PLUGIN_SINCE` tokens, regenerate
the translation template, update the changelog, build the zip as a **pre-flight
check**, commit, and tag — then **stops before pushing**. The user pushes the tag
to fire the live release.

`npm run zip` (`bin/make-zip.js`) produces `dist/tryaura-$1.zip` from a curated
file list. The WP.org deploy itself uses `.distignore`, not that zip — the local
build is only to confirm the build is green before tagging.

**CI does not run `npm run version` or `npm run makepot`.** `deploy.yml` runs only
`composer install`, `composer install --no-dev -o`, `npm install`, `npm run build`.
So the `PLUGIN_SINCE` replacement and the `.pot` file must be generated **locally
and committed** — otherwise raw `PLUGIN_SINCE` tokens and a stale `languages/tryaura.pot`
ship to WP.org. Steps 2 and 3 below exist for exactly this reason.

## Preconditions — verify first, abort with a clear message if any fail

1. A version argument was given in `$1`. If empty, stop and ask for one.
2. `$1` is a valid semver `X.Y.Z` with **no** leading `v`. If it has a `v`, strip it.
3. The working tree is clean (`git status --porcelain` is empty). If not, stop and
   show what's dirty — do not bundle unrelated changes into a release commit.
4. The tag `v$1` does not already exist (`git tag -l v$1` is empty).
5. `$1` is greater than the current version (read from the `Version:` header in
   `tryaura.php`). If it is lower or equal, warn and ask to confirm.
6. `vendor/` currently has dev dependencies installed. Note for later: step 4 runs
   `composer install --no-dev -o`, which strips them — step 8 restores them.

## Steps

1. Bump the version in **all four** locations. Use Edit on each so the change is
   exact, and keep them in lockstep — a mismatch is the most common release bug here:
   - `package.json` — the top-level `"version":` field. **This is the source of
     truth**: `bin/version-replace.js` and `bin/make-zip.js` both read it, and it
     names the zip.
   - `tryaura.php` — the ` * Version:` plugin header.
   - `inc/Plugin.php` — the `private $version = '...';` property. **Edit this one by
     hand and do not trust the build to do it**: `bin/make-zip.js` tries to sync it
     with a regex matching `public\s+\$version`, but the property is declared
     `private`, so the replacement silently no-ops. It drives `TRYAURA_PLUGIN_VERSION`.
   - `readme.txt` — the `Stable tag:` line.

2. Replace the `@since PLUGIN_SINCE` placeholders: `npm run version`. This rewrites
   `PLUGIN_SINCE` → `$1` across `inc/**`, `src/**`, `templates/**` and `tryaura.php`,
   and **modifies tracked source files that must be committed**. Confirm none are
   left: `grep -rn "PLUGIN_SINCE" inc/ src/ templates/ tryaura.php` should print
   nothing.

3. Regenerate the translation template: `npm run makepot` (writes
   `languages/tryaura.pot`). Requires `wp-cli` on PATH; if it is missing, stop and
   say so rather than tagging a release with a stale `.pot`.

4. Confirm every version location now reads `$1` and nothing unrelated changed:
   `grep -n "Version:\|Stable tag:\|\$version\|\"version\"" tryaura.php inc/Plugin.php readme.txt package.json`

5. Update the changelog. There is **no `CHANGELOG.md`** — the changelog lives in
   `readme.txt` under `== Changelog ==`. Insert a new section directly beneath that
   heading, above the most recent existing entry:

   ```
   = v$1 ( <today's date, "Mon DD, YYYY" from `date "+%b %d, %Y"`> ) =
   - **new:** <…>
   - **update:** <…>
   - **fix:** <…>
   ```

   Generate the bullets from commits since the last tag:
   `git log v<previous-version>..HEAD --pretty=format:'- %s'`
   Drop noise (merge commits, lockfile-only chores, pure formatting). Keep
   `feat:` / `fix:` lines, rewritten as user-facing prose. Match the existing
   `**new:** / **update:** / **fix:**` bullet style exactly.

   If the release is worth calling out to existing users, also add a matching entry
   to the `== Upgrade Notice ==` section further down (`= $1 =` + one sentence).

6. Pre-flight build: `npm run release`
   (= `composer install` + `composer install --no-dev -o` + `npm install` +
   `npm run build` + `npm run makepot` + `npm run version` + `npm run zip`). On
   success, list the artifact with `ls -lh dist/*.zip` — expect `tryaura-$1.zip`.
   If the build fails, stop and surface the error; do not commit or tag a broken
   build — CI runs the same build steps and would fail too. `dist/` and `build/`
   are git-ignored; CI rebuilds and deploys the shipping artifact when the tag is
   pushed.

7. Commit the version, `@since`, `.pot` and changelog changes:
   `git commit -am "chore(release): v$1"`.
   Sanity-check the staged set with `git diff --cached --stat` first — it should
   contain the four version files, the `PLUGIN_SINCE`-touched sources,
   `languages/tryaura.pot`, and nothing from `build/`, `dist/`, `vendor/` or
   `node_modules/`.

8. Restore dev dependencies stripped by step 6: `composer install`. This must leave
   the working tree clean — if `composer.lock` changed, investigate before tagging.

9. Create an annotated tag: `git tag -a v$1 -m "Release v$1"`.

10. **Stop.** Do not push. Print the exact command for the user to run when ready,
    and remind them that pushing the tag triggers `deploy.yml`, which builds the
    plugin, pushes it to WordPress.org SVN and publishes the GitHub release
    automatically:

    ```
    git push origin main && git push origin v$1
    ```

    (Adjust the branch name if not on `main`.)

## Notes

- The release is published by `.github/workflows/deploy.yml` on tag push. Its
  trigger is `tags: - "*"` — **any** tag fires a live WP.org deploy, so do not
  push throwaway tags to `origin`. Existing tags follow `vX.Y.Z`.
- WP.org deployment is done by `10up/action-wordpress-plugin-deploy`, which honours
  `.distignore` to decide what ships — not the include list in `bin/make-zip.js`.
  If you add a new top-level dir that must not ship, add it to `.distignore` (and
  `.svnignore`), not just to the zip script.
- Keep all four version strings in lockstep. `tryaura.php` / `inc/Plugin.php` /
  `readme.txt` drive the installed plugin's reported version and what WP.org
  considers stable; `package.json` drives the zip filename and the `PLUGIN_SINCE`
  replacement value.
- `readme.txt`'s `Stable tag:` is what makes a WP.org release go live. If it does
  not match the deployed tag, users get the old version.
- `npm run version` is **one-way**: once `PLUGIN_SINCE` is replaced it is gone from
  the source. New code added after this release should use `PLUGIN_SINCE` again so
  the next run stamps it.
