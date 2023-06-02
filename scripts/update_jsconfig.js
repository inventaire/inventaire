#!/usr/bin/env node

// jsconfig.json serves multiple purposes:
// - Used by customize TypeScript type checking
// - Used by VSCode/Codium IntelliSense, see https://code.visualstudio.com/docs/languages/jsconfig

import { readFile, writeFile } from 'node:fs/promises'
import { absolutePath } from '#lib/absolute_path'
import { requireJson } from '#lib/utils/json'
import { info, success } from '#lib/utils/logs'

const pkg = requireJson(absolutePath('root', 'package.json'))
const jsconfigPath = absolutePath('root', 'jsconfig.json')
const jsconfigJson = await readFile(jsconfigPath, 'utf-8')
const jsconfig = JSON.parse(jsconfigJson)

jsconfig.compilerOptions.paths = {}
for (let [ alias, aliasPath ] of Object.entries(pkg.imports)) {
  if (aliasPath.match(/^\w+/)) aliasPath = `./${aliasPath}`
  jsconfig.compilerOptions.paths[`${alias}`] = [ aliasPath ]
}

const updatedJsconfigJson = JSON.stringify(jsconfig, null, 2) + '\n'

if (updatedJsconfigJson !== jsconfigJson) {
  await writeFile(jsconfigPath, updatedJsconfigJson)
  success('jsconfig.json updated')
} else {
  info('jsconfig.json is already up-to-date')
}
