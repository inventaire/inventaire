import { fileURLToPath } from 'node:url'

export const projectRoot = fileURLToPath(new URL('../..', import.meta.url))

const directories = {
  root: projectRoot.replace(/\/$/, ''),
  client: `${projectRoot}client`,
  server: `${projectRoot}server`,
  tests: `${projectRoot}tests`,
  lib: `${projectRoot}server/lib`,
  db: `${projectRoot}server/db`,
}

export function absolutePath (directoryAlias: keyof typeof directories, filePath: string) {
  const directory = directories[directoryAlias]
  if (!directory) throw new Error(`directory not found: ${directoryAlias}`)
  return `${directory}/${filePath}`
}

// Allow to be called from scripts as:
//   node server/lib/absolute_path.js directoryAlias filePath
if (import.meta.url.includes(process.argv[1])) {
  const [ directoryAlias, filePath ] = process.argv.slice(2)
  // @ts-expect-error
  console.log(absolutePath(directoryAlias, filePath))
}
