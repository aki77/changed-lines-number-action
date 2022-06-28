import {expect, test} from '@jest/globals'
import {filterFiles} from '../src//main'
// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', async () => {
  const files = [
    {filename: 'dist/index.js'},
    {filename: 'src/index.ts'},
    {filename: 'doc/example/example.md'}
  ]
  const gitattributes = `dist/** -diff linguist-generated=true
doc/** linguist-documentation
`

  const result = filterFiles(files, gitattributes)
  expect(result.length).toEqual(1)
})
