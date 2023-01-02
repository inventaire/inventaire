#!/usr/bin/env node
import { get } from 'lodash-es'
import { absolutePath, projectRoot } from '#lib/absolute_path'
import { error_ } from '#lib/error/error'
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
  throw error_.new('can not print module export', 500, { data })
}
