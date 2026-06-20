# changed-lines-number-action

Summarize a pull request's changed lines **per language** and post the table to the PR body, considering `.gitattributes`.

![Demo](https://i.gyazo.com/ce3ac6b9c10507a08f6798f5ffa0e88d.png)

## Why

A pull request's raw changed-line count also includes auto-generated files (build output, lock files, generated code) and documentation, so reviewers can't tell how much code actually needs reviewing. This action excludes those files via `.gitattributes` and breaks the count down by language, so reviewers can grasp the real size of a review at a glance.

## What it does

- Classifies changed files by language and appends a table (Line Ratio / Files / Additions / Deletions) to the PR body.
- Updates the same section on re-runs instead of appending duplicates.
- Excludes files marked with linguist attributes in `.gitattributes`.
- Detects languages by filename and extension — no external binary, works on any runner and architecture.

## Excluding files

Files with any of the following attributes are excluded from the count:

- `linguist-documentation`
- `linguist-generated`
- `linguist-vendored`

`.gitattributes` example:

```
docs/** linguist-documentation
dist/** linguist-generated
vendor/** linguist-vendored
jquery.js -linguist-vendored
```

See [Change Linguist's behaviour with overrides](https://github.com/github/linguist/blob/master/docs/overrides.md) for details.

## Inputs

| Name       | Description               | Required | Default |
| ---------- | ------------------------- | -------- | ------- |
| `token`    | The `GITHUB_TOKEN` secret | Yes      | -       |
| `hideLink` | Hide the link in the heading | No    | `false` |

## Example

```yaml
name: Changed lines
on:
  pull_request:

permissions:
  pull-requests: write

jobs:
  changed-lines:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - uses: aki77/changed-lines-number-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```
