import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { absolutePath } from '#lib/absolute_path'
import { requireJson } from '#lib/utils/json'

const execAsync = promisify(exec)
const pkg = requireJson(absolutePath('root', 'package.json'))

export const softwareName = pkg.name
export const version = pkg.version

export const gitHeadRev = await execAsync('git rev-parse --short HEAD').then(({ stdout }) => stdout.trim())
