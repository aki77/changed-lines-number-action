# changed-lines-number-action

Add the number of changed lines to the PR body, considering `.gitattributes`.

![Demo](https://i.gyazo.com/ce3ac6b9c10507a08f6798f5ffa0e88d.png)

## Usage

Files with the following attributes are excluded from the count.

- `linguist-documentation`
- `linguist-generated`
- `linguist-vendored`

`.gitattributes` example
```
# Apply override to all files in the directory
project-docs/* linguist-documentation
# Apply override to a specific file
docs/formatter.rb -linguist-documentation
# Apply override to all files and directories in the directory
ano-dir/** linguist-documentation

Api.elm linguist-generated

# Apply override to all files in the directory
special-vendored-path/* linguist-vendored
# Apply override to a specific file
jquery.js -linguist-vendored
# Apply override to all files and directories in the directory
ano-dir/** linguist-vendored
```

**Related Documents**

[Change Linguist's behaviour with overrides](https://github.com/github/linguist/blob/master/docs/overrides.md)

## Inputs

- `token` - The GITHUB_TOKEN secret.
- `hideLink` - Hide the link. (default: `false`)

## Example

```yaml
name: Tests
on:
  pull_request:

jobs:
  build:
    steps:
      - uses: actions/checkout@v3

      - uses: aki77/changed-lines-number-action@v3
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```
