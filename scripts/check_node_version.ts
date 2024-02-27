#!/usr/bin/env -S node --loader ts-node/esm --no-warnings

import { absolutePath } from '#lib/absolute_path'
import { requireJson } from '#lib/utils/json'

const { engines } = requireJson(absolutePath('root', 'package.json'))
const nodejsVersion = process.version
const [ , actualMajor, actualMinor, actualPatch ] = nodejsVersion.match(/^v(\d+)\.(\d+)\.(\d+)$/).map(num => parseInt(num))
const [ , requiredMajor, requiredMinor, requiredPatch ] = engines.node.match(/ (\d+)\.(\d+)?\.?(\d+)?$/).map(num => num ? parseInt(num) : 0)

const normalizeVersion = (...versionParts) => {
  return versionParts.map(num => num.toString().padStart(2, '0')).join('.')
}

if (normalizeVersion(requiredMajor, requiredMinor, requiredPatch) > normalizeVersion(actualMajor, actualMinor, actualPatch)) {
  console.error(`Invalid NodeJS version:
  Expected: ${engines.node}
  Found: ${nodejsVersion} (${process.execPath})

If you installed NodeJS from a package manager, you could try to uninstall it and reinstall it with NVM https://github.com/nvm-sh/nvm instead:

   nvm install --lts

Then rerun the dependency installation:

   npm installation

[${import.meta.url}]`)

  process.exit(1)
}
