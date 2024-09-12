import { newError } from '#lib/error/error'
import { wait } from '#lib/promises'
import { warn } from '#lib/utils/logs'

type SomeAsyncFunction = <T> (...args: unknown[]) => Promise<T | T[] | void>

export function retryOnConflict <F extends SomeAsyncFunction> (updateFn: F, maxAttempts?: number) {
  return function (...args: Parameters<F>): ReturnType<F> {
    async function run (attemptsCount: number) {
      if (attemptsCount > maxAttempts) {
        throw newError('maximum attempt reached', 400, { updateFn, maxAttempts, args })
      }

      if (attemptsCount > 1) {
        // Avoid logging user document
        const contextArgs = args.filter(arg => arg != null && typeof arg === 'object' && 'type' in arg && arg.type !== 'user')
        warn({ updateFn, contextArgs }, 'retrying after conflict')
      }

      attemptsCount += 1
      try {
        return await updateFn(...args)
      } catch (err) {
        // Retry only if the conflict comes from then entity
        if (err.statusCode === 409 && err.name !== 'patch_creation_failed') {
          // @ts-expect-error [TS2345] Type 'Promise<unknown>' is not assignable to type 'Promise<void | T | T[]>'
          return runAfterDelay(run, attemptsCount)
        } else {
          throw err
        }
      }
    }

    return run(1) as ReturnType<F>
  }
}

async function runAfterDelay <F extends SomeAsyncFunction> (run: F, attemptsCount: number) {
  const delay = (attemptsCount * 100) + Math.trunc(Math.random() * 100)
  await wait(delay)
  return run(attemptsCount)
}
