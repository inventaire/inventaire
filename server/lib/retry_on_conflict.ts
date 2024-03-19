import { newError } from '#lib/error/error'
import { wait } from '#lib/promises'
import { warn } from '#lib/utils/logs'

export function retryOnConflict (params) {
  let { updateFn, maxAttempts } = params
  if (!maxAttempts) maxAttempts = 10
  return (...args) => {
    const run = attemptsCount => {
      if (attemptsCount > maxAttempts) {
        throw newError('maximum attempt reached', 400, { updateFn, maxAttempts, args })
      }

      if (attemptsCount > 1) {
        // Avoid logging user document
        const contextArgs = args.filter(arg => arg != null && arg.type !== 'user')
        warn({ updateFn, contextArgs }, 'retrying after conflict')
      }

      attemptsCount += 1

      return updateFn(...args)
      .catch(err => {
        // Retry only if the conflict comes from then entity
        if (err.statusCode === 409 && err.name !== 'patch_creation_failed') {
          return runAfterDelay(run, attemptsCount)
        } else {
          throw err
        }
      })
    }

    return run(1)
  }
}

const runAfterDelay = async (run, attemptsCount) => {
  const delay = (attemptsCount * 100) + Math.trunc(Math.random() * 100)
  await wait(delay)
  return run(attemptsCount)
}
