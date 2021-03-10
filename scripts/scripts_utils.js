const _ = require('builders/utils')
const { red } = require('chalk')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

module.exports = {
  logErrorAndExit: (label, err) => {
    makeSureLogsAreWrittenBeforeExit()
    if (err) _.error(err, label)
    else console.error(red(label))
    process.exit(1)
  },

  logSuccessAndExit: (label, res) => {
    makeSureLogsAreWrittenBeforeExit()
    _.success(res, label)
    process.exit(0)
  },

  shellExec: async (cmd, args) => {
    if (args.length > 0) cmd = `${cmd} ${args.join(' ')}`
    const { stdout, stderr } = await exec(cmd)
    return {
      stdout: stdout.trim(),
      stderr: stderr.trim()
    }
  }
}

const makeSureLogsAreWrittenBeforeExit = () => {
  process.stdout._handle.setBlocking(true)
  process.stderr._handle.setBlocking(true)
}
