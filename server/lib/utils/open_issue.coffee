# Open a new issue in a dedicated Gitlab repo if the error is a new error
CONFIG = require 'config'
if CONFIG.gitlabLogging.enabled
  gitlabLogging = require 'gitlab-logging'
  gitlabLogging.configure CONFIG.gitlabLogging
  module.exports = gitlabLogging.handle
else
  module.exports = ->
