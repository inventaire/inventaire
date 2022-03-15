import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { red } from 'tiny-chalk'
import { logError } from '#lib/utils/logs'

const execAsync = promisify(exec)

export const logErrorAndExit = (label, err) => {
  makeSureLogsAreWrittenBeforeExit()
  if (err) logError(err, label)
  else console.error(red(label))
  process.exit(1)
}

export async function shellExec (cmd, args) {
  if (args.length > 0) cmd = `${cmd} ${args.join(' ')}`
  const { stdout, stderr } = await execAsync(cmd)
  return {
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  }
}

const makeSureLogsAreWrittenBeforeExit = () => {
  process.stdout._handle.setBlocking(true)
  process.stderr._handle.setBlocking(true)
}

export function ignorePipedProcessErrors () {
  process.stdout.on('error', err => {
    if (err.code === 'EPIPE') process.exit(0)
  })
}
