# Release Checklist

## 1. Deploy Concierge

This may have been deployed outside of the app release cycle, but reflect if this is needed.

## 2. Build Tandem.app

In the `tandem` repo:
1. Bump version in package.json & elm-package.json
1. Commit version changes with message 'Bump version <version>'
1. `git tag v<version>`
1. `yarn build` && `yarn dist`
1. `shasum -a 256 dist/Tandem-<version>.dmg`

## 3. Deploy to Github Releases

In the `tandem-releases` repo:
1. Add entry to README.md
1. `git commit -m “v<version> released”`
1. `git tag v<version>`
1. `git push —tags`
1. In repo releases, create a new release, copy the title and body from README.md
1. Upload the dmg

## 4. Update Homebrew tap

In homebrew-tap repo
1. Update version and Sha in `vi Casks/tandem.rb`
1. `git commit -m "Update Tandem.app to v<version>”`
