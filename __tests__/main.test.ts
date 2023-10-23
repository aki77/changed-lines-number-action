import {expect, test} from '@jest/globals'
import {filterFiles} from '../src/filter'
import {installEnry, analyzeLanguage} from '../src/language'

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', async () => {
  const files = [
    {filename: 'dist/index.js', additions: 1, deletions: 1},
    {filename: 'src/index.ts', additions: 1, deletions: 1},
    {filename: 'doc/example/example.md', additions: 1, deletions: 1}
  ]
  const gitattributes = `dist/** -diff linguist-generated=true
doc/** linguist-documentation
`

  const result = filterFiles(files, gitattributes)
  expect(result.length).toEqual(1)
})

test('analyze', async () => {
  await installEnry(process.env.RUNNER_OS || 'macOS')
  const result = await analyzeLanguage([
    {filename: 'src/main.ts', additions: 1, deletions: 1},
    {filename: 'src/utils.ts', additions: 3, deletions: 1},
    {filename: 'package.json', additions: 30, deletions: 10}
  ])
  expect(result).toEqual([
    {additions: 30, deletions: 10, files: 1, language: 'JSON', lineRatio: 87},
    {
      additions: 4,
      deletions: 2,
      files: 2,
      language: 'TypeScript',
      lineRatio: 13
    }
  ])
}, 20000)
