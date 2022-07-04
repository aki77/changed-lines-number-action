import {promises as fs} from 'fs'
import * as core from '@actions/core'
import {isMatch} from 'picomatch'
import {GithubFile} from './types'

const IGNORE_PATTERN =
  /(linguist-vendored|linguist-documentation|linguist-generated)(=true)?$/

export const readGitAttributes = async (
  path: string
): Promise<string | undefined> => {
  try {
    return fs.readFile(path, 'utf8')
  } catch (error) {
    return undefined
  }
}

export function filterFiles<T extends GithubFile>(
  files: readonly T[],
  gitattributes: string
): readonly T[] {
  const patterns = gitattributes
    .split('\n')
    .filter(line => line.trim().match(IGNORE_PATTERN))
    .map(line => line.split(' ')[0])
  core.debug(`Found ${patterns.length} patterns: ${patterns.join(', ')}`)
  return files.filter(f => !isMatch(f.filename, patterns))
}
