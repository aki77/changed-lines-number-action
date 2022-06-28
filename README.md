# changed-lines-number-action

Add the number of changed lines to the PR body, considering `.gitattributes`.

![Demo](https://i.gyazo.com/71499e1dc4eaef7b9a84b8bdf958eae2.png)

### Inputs

- `token` - The GITHUB_TOKEN secret.

## Example

```yaml
name: Tests
on:
  pull_request:

jobs:
  build:
    steps:
      - uses: actions/checkout@v3

      - uses: aki77/changed-lines-number-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```
