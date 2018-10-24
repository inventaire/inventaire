__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

module.exports = (params)->
  { updateFn, maxAttempts } = params
  maxAttempts or= 10
  return (args...)->
    run = (attemptsCount)->
      if attemptsCount > maxAttempts
        throw error_.new 'maximum attempt reached', 400, { updateFn, maxAttempts, args }

      attemptsCount += 1

      updateFn.apply null, args
      .catch (err)->
        if err.statusCode is 409 then runAfterDelay run, attemptsCount, err
        else throw err

    return run 1

runAfterDelay = (run, attemptsCount, err)->
  delay = attemptsCount * 100 + Math.random() * 100

  promises_.resolve()
  .delay delay
  .then -> run attemptsCount
