
// Open a new issue in a dedicated Gitlab repo if the error is a new error
const CONFIG = require('config')

if (!CONFIG.gitlabLogging.enabled) {
  module.exports = () => {}
} else {
  const gitlabLogging = require('gitlab-logging')
  gitlabLogging.configure(CONFIG.gitlabLogging)
  module.exports = err => {
    if ((err != null ? err.stack : undefined) instanceof Array) { err.stack = err.stack.join('\n') }
    gitlabLogging.handle(err)
  }
}
