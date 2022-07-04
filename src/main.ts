import * as core from '@actions/core'
import * as github from '@actions/github'
import {filterFiles, readGitAttributes} from './filter'
import {analyzeLanguage, installEnry} from './language'
import {report} from './report'

async function run(): Promise<void> {
  try {
    if (!github.context.issue.number) {
      core.warning('Cannot find the PR id.')
      return
    }
    const token = core.getInput('token', {required: true})
    const octokit = github.getOctokit(token)

    const files = await octokit.paginate(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}/files',
      {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: github.context.issue.number,
        per_page: 100
      }
    )

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

    await installEnry(process.env.RUNNER_OS || 'linux')
    const languages = await analyzeLanguage(filteredFiles)

    await report(languages)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
