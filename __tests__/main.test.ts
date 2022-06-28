import {expect, test} from '@jest/globals'
import {filterFiles} from '../src//main'
// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', async () => {
  const files = [{filename: 'dist/index.js'}, {filename: 'src/index.ts'}]
  const gitattributes = `dist/** -diff linguist-generated=true `

  const result = filterFiles(files, gitattributes)
  expect(result.length).toEqual(1)
})
