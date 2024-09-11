import { debounce } from 'lodash-es'
import { logError } from '#lib/utils/logs'

export function debounceByKey <T extends string> (fn: (key: T) => unknown, debounceDelay: number) {
  const debouncersByKey = {} as Record<T, ReturnType<typeof debounce>>
  return function debouncedFn (key: T) {
    debouncersByKey[key] ??= debounce(async () => {
      // When it gets to be called, remove the lazy updater
      // to prevent blocking memory undefinitely
      delete debouncersByKey[key]
      try {
        await fn(key)
      } catch (err) {
        logError(err, `debounced ${fn.name} (key: ${key}) error`)
      }
    }, debounceDelay)
    debouncersByKey[key]()
  }
}
