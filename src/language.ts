import * as linguistLanguages from 'linguist-languages'
import type {GithubFile} from './types.js'
import {groupBy, sumOf} from './utils.js'

// Mirror of linguist-languages' public `Language` type narrowed to the fields
// we read. We keep `type` as a union (the package exposes it as `string`) so it
// can index TYPE_RANK directly.
type LinguistLanguage = Omit<linguistLanguages.Language, 'type'> & {
  type: 'data' | 'markup' | 'programming' | 'prose'
}

export const UNKNOWN_LABEL = 'Unknown'

// Manual overrides for extensions shared by multiple languages. Detection is by
// extension only (no file contents), so for ambiguous extensions we pin the
// language GitHub conventionally reports instead of relying on languageId order.
const EXTENSION_OVERRIDES: Record<string, string> = {
  '.ts': 'TypeScript',
  '.h': 'C',
  '.m': 'Objective-C',
  '.r': 'R',
  '.pl': 'Perl',
  '.md': 'Markdown'
}

const TYPE_RANK: Record<LinguistLanguage['type'], number> = {
  programming: 0,
  markup: 1,
  prose: 2,
  data: 3
}

// A language wins an extension/filename if it has a higher-priority `type`,
// then the smaller `languageId` (always unique, so the result is deterministic).
function isHigherPriority(
  candidate: LinguistLanguage,
  current: LinguistLanguage
): boolean {
  if (TYPE_RANK[candidate.type] !== TYPE_RANK[current.type]) {
    return TYPE_RANK[candidate.type] < TYPE_RANK[current.type]
  }
  return candidate.languageId < current.languageId
}

function buildMaps(): {
  extensionMap: Map<string, string>
  filenameMap: Map<string, string>
} {
  // Track both the winning language (for tie-breaking) and its name in one map.
  const extWinner = new Map<string, LinguistLanguage>()
  const filenameWinner = new Map<string, LinguistLanguage>()

  const claim = (
    map: Map<string, LinguistLanguage>,
    key: string,
    lang: LinguistLanguage
  ): void => {
    const current = map.get(key)
    if (current === undefined || isHigherPriority(lang, current)) {
      map.set(key, lang)
    }
  }

  for (const lang of Object.values(linguistLanguages) as LinguistLanguage[]) {
    for (const ext of lang.extensions ?? [])
      claim(extWinner, ext.toLowerCase(), lang)
    for (const filename of lang.filenames ?? [])
      claim(filenameWinner, filename, lang)
  }

  const toNameMap = (
    winners: Map<string, LinguistLanguage>
  ): Map<string, string> =>
    new Map([...winners].map(([key, lang]) => [key, lang.name]))

  const extensionMap = toNameMap(extWinner)
  for (const [ext, name] of Object.entries(EXTENSION_OVERRIDES)) {
    extensionMap.set(ext, name)
  }

  return {extensionMap, filenameMap: toNameMap(filenameWinner)}
}

const {extensionMap, filenameMap} = buildMaps()

export function detectLanguageByName(filename: string): string | undefined {
  const basename = filename.split('/').pop() ?? filename
  const byFilename = filenameMap.get(basename)
  if (byFilename) return byFilename

  // Try each extension candidate, longest (compound, e.g. `.html.erb`) first,
  // lowercased to match the map keys. Scanned inline to avoid allocating a
  // candidate array per file.
  for (
    let index = basename.indexOf('.');
    index !== -1;
    index = basename.indexOf('.', index + 1)
  ) {
    const byExtension = extensionMap.get(basename.slice(index).toLowerCase())
    if (byExtension) return byExtension
  }

  return undefined
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
  const results = files.map(file => ({
    ...file,
    language: detectLanguageByName(file.filename) ?? UNKNOWN_LABEL
  }))

  const totalLines = sumOf(
    files,
    ({additions, deletions}) => additions + deletions
  )

  return Object.entries(groupBy(results, ({language}) => language))
    .map(([language, groupedFiles = []]) => {
      const lines = sumOf(
        groupedFiles,
        ({additions, deletions}) => additions + deletions
      )

      return {
        language,
        lineRatio: Math.round((lines / totalLines) * 1000) / 10,
        files: groupedFiles.length,
        additions: sumOf(groupedFiles, ({additions}) => additions),
        deletions: sumOf(groupedFiles, ({deletions}) => deletions)
      }
    })
    .sort((a, b) => b.lineRatio - a.lineRatio)
}
