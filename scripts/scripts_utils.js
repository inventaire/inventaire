const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { red } = require('chalk')

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
  }
}

const makeSureLogsAreWrittenBeforeExit = () => {
  process.stdout._handle.setBlocking(true)
}
