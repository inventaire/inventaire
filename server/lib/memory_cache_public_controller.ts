import type { Req, Res } from '#types/server'

interface MemoryCachePublicControllerParams <T> {
  before?: (res: Res) => unknown
  controller: (params: T) => Promise<unknown>
  getCacheKey: (params: T) => string
  cacheTtl?: number
}

const cache: Record<string, { stringifiedBodyPromise: Promise<string>, timeout: NodeJS.Timeout }> = {}

export function memoryCachePublicController <T> ({ before, controller, getCacheKey, cacheTtl = 30 * 1000 }: MemoryCachePublicControllerParams<T>) {
  return async function cachedController (params: T, req: Req, res: Res) {
    if (before != null) before(res)
    let stringifiedBodyPromise
    const cacheKey = getCacheKey(params)
    if (cache[cacheKey] == null) {
      stringifiedBodyPromise = getStringifiedBody(controller(params))
    } else {
      ;({ stringifiedBodyPromise } = cache[cacheKey])
      // Reset the timeout on cache hit, making it behave like a debounce
      clearTimeout(cache[cacheKey].timeout)
    }
    // Cache the promise, so that parallel initial requests do not trigger
    // parallel calls to the controller function
    setCache(cacheKey, stringifiedBodyPromise, cacheTtl)
    const body = await stringifiedBodyPromise
    res.send(body)
  }
}

async function getStringifiedBody (bodyPromise: Promise<unknown>) {
  const body = await bodyPromise
  return JSON.stringify(body)
}

function setCache (cacheKey: string, stringifiedBodyPromise: Promise<string>, cacheTtl: number) {
  const timeout = setTimeout(() => delete cache[cacheKey], cacheTtl)
  cache[cacheKey] = { stringifiedBodyPromise, timeout }
}
