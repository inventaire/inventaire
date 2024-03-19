#!/usr/bin/env tsx
import { absolutePath } from '#lib/absolute_path'
import { requireJson } from '#lib/utils/json'

const { engines } = requireJson(absolutePath('root', 'package.json'))
const nodejsVersion = process.version
const [ , actualMajor, actualMinor, actualPatch ] = nodejsVersion.match(/^v(\d+)\.(\d+)\.(\d+)$/).map(num => parseInt(num))
const parseVersionNumber = num => num ? parseInt(num) : 0
let [ , comparator, requiredMajor, requiredMinor, requiredPatch ] = engines.node.match(/([=><]+) (\d+)\.?(\d+)?\.?(\d+)?$/)
requiredMajor = parseVersionNumber(requiredMajor)
requiredMinor = parseVersionNumber(requiredMinor)
requiredPatch = parseVersionNumber(requiredPatch)

const normalizeVersion = (...versionParts) => {
  return versionParts.map(num => num.toString().padStart(2, '0')).join('.')
}

const nodeVersionIsTooLow = comparator.startsWith('>') && (normalizeVersion(requiredMajor, requiredMinor, requiredPatch) > normalizeVersion(actualMajor, actualMinor, actualPatch))
const nodeVersionIsTooHigh = comparator === '=' && actualMajor !== requiredMajor

if (nodeVersionIsTooLow || nodeVersionIsTooHigh) {
  console.error(`Invalid NodeJS version:
  Expected: ${engines.node}
  Found: ${nodejsVersion} (${process.execPath})

If you installed NodeJS from a package manager, you could try to uninstall it and reinstall it with NVM https://github.com/nvm-sh/nvm instead:

   nvm install ${requiredMajor}

Then rerun the dependency installation:

   npm installation

[${import.meta.url}]`)

  process.exit(1)
}
