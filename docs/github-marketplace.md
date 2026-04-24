# GitHub Marketplace Publishing

Comet can be listed in GitHub Marketplace, but not directly from this repository.

## Why Not From This Repo

GitHub's Marketplace requirements for actions include:

- the action must be in a public repository
- the repository must contain a single root `action.yml`
- the repository must not contain workflow files

This repository already includes `.github/workflows`, so it should remain the main product repository and npm package source.

## Recommended Setup

Use two repositories:

- `arseno25/comet`
  - source code for the CLI
  - npm package source
  - CI and release workflows
- `arseno25/comet-action`
  - GitHub Marketplace wrapper
  - public repository
  - root `action.yml`
  - no workflow files

## Included Template

Use the scaffold in:

- `templates/github-marketplace-action/action.yml`
- `templates/github-marketplace-action/README.md`

Copy those files into the root of a separate `comet-action` repository.

## Publish Flow

1. Create a public repository, for example `arseno25/comet-action`.
2. Copy the template files from `templates/github-marketplace-action/`.
3. Push to GitHub.
4. Open the repository's `action.yml`.
5. Draft a new release.
6. Select `Publish this Action to the GitHub Marketplace`.
7. Fill in Marketplace metadata and publish.

## Suggested Marketplace Metadata

- Name: `Comet AI Commit`
- Short description: `Generate production-ready Conventional Commit messages with AI`
- Category: `Continuous integration`
- Category: `Utilities`

## Suggested Versioning

- Tag the action repo with immutable tags such as `v1.0.0`
- Move the major tag `v1` forward on each compatible release
- Pin `@arseno25/comet` inside the action when you want deterministic behavior
