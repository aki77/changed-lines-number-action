/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as core from '@actions/core'
import {exec} from 'child_process'
import {promisify} from 'util'
import {GithubFile} from './types'
import {groupBy, sumOf} from './utils'

const execAsync = promisify(exec)

export async function installEnry(os: string): Promise<void> {
  const prefix = os.toLowerCase().replace('macos', 'darwin')
  const url = `https://github.com/go-enry/enry/releases/download/v1.2.0/enry-v1.2.0-${prefix}-amd64.tar.gz`
  await execAsync(`curl -L ${url} | tar -xz -C /tmp/`)
}

export async function detectLanguage(
  filename: string
): Promise<string | undefined> {
  try {
    const {stdout} = await execAsync(`/tmp/enry -json ${filename}`)
    const json = JSON.parse(stdout.toString())
    return json.language
  } catch (error) {
    if (error instanceof Error) core.debug(error.message)
  }
}

export type Language = {
  language: string
  lineRatio: number
  files: number
  additions: number
  deletions: number
}

export async function analyzeLanguage(
  files: readonly GithubFile[]
): Promise<readonly Language[]> {
  const promises = files.map(async file => {
    const language = await detectLanguage(file.filename)
    return {
      ...file,
      language: language ?? 'Unknown (Deleted)'
    }
  })

  const results = await Promise.all(promises)
  const totalLines = sumOf(
    files,
    ({additions, deletions}) => additions + deletions
  )

  return Object.entries(groupBy(results, ({language}) => language))
    .map(([language, groupedFiles]) => {
      const lines = sumOf(
        groupedFiles!,
        ({additions, deletions}) => additions + deletions
      )

      return {
        language,
        lineRatio: Math.round((lines / totalLines) * 1000) / 10,
        files: groupedFiles!.length,
        additions: sumOf(groupedFiles!, ({additions}) => additions),
        deletions: sumOf(groupedFiles!, ({deletions}) => deletions)
      }
    })
    .sort((a, b) => b.lineRatio - a.lineRatio)
}
