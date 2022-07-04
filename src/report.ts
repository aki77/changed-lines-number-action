import * as core from '@actions/core'
import * as github from '@actions/github'
import {markdownTable} from 'markdown-table'
import {Language} from './language'
import {sumOf} from './utils'

const REPLACE_PATTERN =
  /<!-- start changed-lines-number-action -->[\s\S]*?<!-- end changed-lines-number-action -->/m

export const report = async (languages: readonly Language[]): Promise<void> => {
  const token = core.getInput('token', {required: true})
  const octokit = github.getOctokit(token)

  const additions = sumOf(languages, l => l.additions).toLocaleString('en-US')
  const deletions = sumOf(languages, l => l.deletions).toLocaleString('en-US')

  const languageTable = markdownTable(
    [
      ['Language', 'Line Ratio', 'Files', 'Additions', 'Deletions'],
      ...languages.map(l => [
        l.language,
        `${l.lineRatio}%`,
        l.files.toLocaleString('en-US'),
        `+${l.additions.toLocaleString('en-US')}`,
        `-${l.deletions.toLocaleString('en-US')}`
      ])
    ],
    {
      align: ['l', 'r', 'r', 'r', 'r']
    }
  )

  const {
    data: {body}
  } = await octokit.rest.pulls.get({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: github.context.issue.number
  })

  const header =
    core.getInput('hideLink') === 'true'
      ? 'Changes Lines'
      : '[Changes Lines](https://github.com/aki77/changed-lines-number-action)'

  const content = `<!-- start changed-lines-number-action -->
### ${header}
_+${additions} additions, -${deletions} deletions_

${languageTable}
<!-- end changed-lines-number-action -->
`

  const newBody =
    body && REPLACE_PATTERN.test(body)
      ? body.replace(REPLACE_PATTERN, content)
      : [body ?? '', content].join('\n')

  await octokit.rest.pulls.update({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: github.context.issue.number,
    body: newBody.trim()
  })
}
