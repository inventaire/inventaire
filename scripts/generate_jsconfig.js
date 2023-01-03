#!/usr/bin/env node

// Generate jsconfig.json to please developers using VSCode/Codium
// (see https://code.visualstudio.com/docs/languages/jsconfig)
// while not duplicating module aliases

import { fileURLToPath } from 'node:url'
import { absolutePath } from '#lib/absolute_path'
import { requireJson } from '#lib/utils/json'

const pkg = requireJson(absolutePath('root', 'package.json'))

const filename = fileURLToPath(import.meta.url)

const jsconfig = {
  __generatedBy: filename,
  compilerOptions: {
    target: 'esnext',
    module: 'esnext',
    moduleResolution: 'node',
    baseUrl: '.',
    paths: {},
  },
  include: [
    'config/**/*',
    'server/**/*',
    'scripts/**/*',
    'tests/**/*',
  ],
}

for (let [ alias, aliasPath ] of Object.entries(pkg.imports)) {
  if (aliasPath.match(/^\w+/)) aliasPath = `./${aliasPath}`
  jsconfig.compilerOptions.paths[`${alias}`] = [ aliasPath ]
}

process.stdout.write(`${JSON.stringify(jsconfig, null, 2)}\n`)
