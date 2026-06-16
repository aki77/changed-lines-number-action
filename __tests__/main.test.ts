import {expect, test} from '@jest/globals'
import {filterFiles} from '../src/filter.js'
import {
  analyzeLanguage,
  detectLanguageByName,
  UNKNOWN_LABEL
} from '../src/language.js'

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
})

test('detectLanguageByName', () => {
  // extension based
  expect(detectLanguageByName('src/main.ts')).toEqual('TypeScript')
  expect(detectLanguageByName('package.json')).toEqual('JSON')
  expect(detectLanguageByName('app/models/user.rb')).toEqual('Ruby')
  // ambiguous extension resolved by override
  expect(detectLanguageByName('src/foo.h')).toEqual('C')
  // filename without extension
  expect(detectLanguageByName('Dockerfile')).toEqual('Dockerfile')
  // deleted files are still detected by extension
  expect(detectLanguageByName('old/removed.rb')).toEqual('Ruby')
  // unknown extension
  expect(detectLanguageByName('foo.zzzunknown')).toBeUndefined()
})

test('analyze treats unknown files as Unknown', async () => {
  const result = await analyzeLanguage([
    {filename: 'mystery.zzzunknown', additions: 1, deletions: 1}
  ])
  expect(result).toEqual([
    {
      additions: 1,
      deletions: 1,
      files: 1,
      language: UNKNOWN_LABEL,
      lineRatio: 100
    }
  ])
})
