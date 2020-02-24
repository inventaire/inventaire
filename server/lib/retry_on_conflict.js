const __ = require('config').universalPath
const { Wait } = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')

module.exports = params => {
  let { updateFn, maxAttempts } = params
  if (!maxAttempts) maxAttempts = 10
  return (...args) => {
    const run = attemptsCount => {
      if (attemptsCount > maxAttempts) {
        throw error_.new('maximum attempt reached', 400, { updateFn, maxAttempts, args })
      }

      attemptsCount += 1

      return updateFn.apply(null, args)
      .catch(err => {
        if (err.statusCode === 409) {
          return runAfterDelay(run, attemptsCount, err)
        } else {
          throw err
        }
      })
    }

    return run(1)
  }
}

const runAfterDelay = (run, attemptsCount, err) => {
  const delay = (attemptsCount * 100) + Math.trunc(Math.random() * 100)

  return Promise.resolve()
  .then(Wait(delay))
  .then(() => run(attemptsCount))
}
