import { fileURLToPath } from 'url'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))

const folders = {
  root: projectRoot,
  client: `${projectRoot}client`,
  tests: `${projectRoot}tests`,
  lib: `${projectRoot}server/lib`,
  db: `${projectRoot}server/db`,
  i18nDist: `${projectRoot}inventaire-i18n/dist/server`,
  i18nSrc: `${projectRoot}inventaire-i18n/original`,
}

export function absolutePath (folderAlias, filePath) {
  const folder = folders[folderAlias]
  if (!folder) throw new Error(`folder not found: ${folderAlias}`)
  return `${folderAlias}/${filePath}`
}
