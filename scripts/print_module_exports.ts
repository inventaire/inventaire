#!/usr/bin/env -S node --loader ts-node/esm --no-warnings
import { get } from 'lodash-es'
import { absolutePath, projectRoot } from '#lib/absolute_path'
import { newError } from '#lib/error/error'
import { ignorePipedProcessErrors } from '#scripts/scripts_utils'

ignorePipedProcessErrors()

let [ filePath, exportPath ] = process.argv.slice(2)
filePath = filePath.replace(projectRoot, '')
const absoluteFilePath = absolutePath('root', filePath)
const exports = await import(absoluteFilePath)
const data = exportPath ? get(exports, exportPath) : exports
const json = JSON.stringify(data)

if (json) {
  process.stdout.write(json)
} else {
  const context = { data, filePath, exportPath, availableExports: Object.keys(exports) }
  throw newError('can not print module export', 500, context)
}
