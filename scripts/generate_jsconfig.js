#!/usr/bin/env node

// Generate jsconfig.json to please developers using VSCode/Codium
// (see https://code.visualstudio.com/docs/languages/jsconfig)
// while not duplicating module aliases

const { _moduleAliases } = require('../package.json')
const filename = __filename.replace(`${process.cwd()}/`, '')

const jsconfig = {
  __generatedBy: filename,
  compilerOptions: {
    target: 'es2020',
    module: 'commonJS',
    moduleResolution: 'node',
    baseUrl: '.',
    paths: {}
  },
  include: [
    'config/**/*',
    'server/**/*',
    'scripts/**/*',
    'tests/**/*',
  ],
}

for (const alias in _moduleAliases) {
  let aliasPath = _moduleAliases[alias]
  if (aliasPath.match(/^\w+/)) aliasPath = `./${aliasPath}`
  aliasPath = aliasPath === '.' ? '*' : `${aliasPath}/*`
  jsconfig.compilerOptions.paths[`${alias}/*`] = [ aliasPath ]
}

process.stdout.write(`${JSON.stringify(jsconfig, null, 2)}\n`)
