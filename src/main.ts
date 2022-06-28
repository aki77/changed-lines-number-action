import {promises as fs} from 'fs'
import * as core from '@actions/core'
import * as github from '@actions/github'
import {isMatch} from 'picomatch'
import {sumOf} from './utils'

type GithubFile = {
  filename: string
}

const IGNORE_PATTERN =
  /(linguist-vendored|linguist-documentation|linguist-generated)(=true)?$/

const readGitAttributes = async (path: string): Promise<string | undefined> => {
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

async function run(): Promise<void> {
  try {
    if (!github.context.issue.number) {
      core.warning('Cannot find the PR id.')
      return
    }
    const token = core.getInput('token', {required: true})
    const octokit = github.getOctokit(token)

    const {
      data: {body}
    } = await octokit.rest.pulls.get({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: github.context.issue.number
    })

    // TODO: 100 files over the limit
    const {data: files} = await octokit.rest.pulls.listFiles({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: github.context.issue.number,
      per_page: 100
    })

    core.debug(
      `Found ${files.length} files: ${files.map(f => f.filename).join(', ')}`
    )

    const gitattributes = await readGitAttributes('.gitattributes')
    const filteredFiles = gitattributes
      ? filterFiles(files, gitattributes)
      : files

    core.debug(
      `Filtered ${filteredFiles.length} files: ${filteredFiles
        .map(f => f.filename)
        .join(', ')}`
    )
    const additions = sumOf(filteredFiles, f => f.additions).toLocaleString(
      'en-US'
    )
    const deletions = sumOf(filteredFiles, f => f.deletions).toLocaleString(
      'en-US'
    )

    const origBody = body
      ? body.trim().replace(/_\+[\d,]+ additions, -[\d,]+ deletions_$/m, '')
      : ''

    const newBody = [
      origBody,
      `_+${additions} additions, -${deletions} deletions_`
    ]
      .join('\n\n')
      .trim()

    await octokit.rest.pulls.update({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: github.context.issue.number,
      body: newBody
    })
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
