const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { wait } = __.require('lib', 'promises')
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

      if (attemptsCount > 1) {
        // Avoid logging user document
        const contextArgs = args.filter(arg => arg != null && arg.type !== 'user')
        _.warn({ updateFn, contextArgs }, 'retrying after conflict')
      }

      return updateFn.apply(null, args)
      .catch(err => {
        // Retry only if the conflict comes from then entity
        if (err.statusCode === 409 && err.type !== 'patch_creation_failed') {
          return runAfterDelay(run, attemptsCount, err)
        } else {
          throw err
        }
      })
    }

    return run(1)
  }
}

const runAfterDelay = async (run, attemptsCount, err) => {
  const delay = (attemptsCount * 100) + Math.trunc(Math.random() * 100)
  await wait(delay)
  return run(attemptsCount)
}
