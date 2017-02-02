# Open a new issue in a dedicated Gitlab repo if the error is a new error
CONFIG = require 'config'

unless CONFIG.gitlabLogging.enabled
  module.exports = ->
  return

gitlabLogging = require 'gitlab-logging'
gitlabLogging.configure CONFIG.gitlabLogging
module.exports = (err)->
  if err?.stack instanceof Array then err.stack = err.stack.join('\n')
  gitlabLogging.handle err
  return
