import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { assertString, assertType } from '#lib/utils/assert_types'

const stringify = data => JSON.stringify(data, null, 2)

export function readJsonFile (path) {
  assertString(path)
  return readFile(path, 'utf-8')
  .then(JSON.parse)
}

export function writeJsonFile (path, data) {
  assertString(path)
  assertType('object|array', data)
  const json = stringify(data)
  return writeFile(path, json)
}

// Importing JSON is experimental until Node v23.1.0 https://nodejs.org/api/esm.html#import-assertions
// so ESlint doesn't support it and complains with "Parsing error: Unexpected token assert"
// thus this work around to require json files the old CommonJS way
// See https://www.stefanjudis.com/snippets/how-to-import-json-files-in-es-modules-node-js/
// Expects an absolute path
export const requireJson = createRequire(import.meta.url)
