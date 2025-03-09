import type { Req, Res } from '#types/server'

interface MemoryCachePublicControllerParams <T> {
  before?: (res: Res) => unknown
  controller: (params: T) => unknown
  getCacheKey: (params: T) => string
  cacheTtl?: number
}

const cache: Record<string, { body: string, timeout: NodeJS.Timeout }> = {}

export function memoryCachePublicController <T> ({ before, controller, getCacheKey, cacheTtl = 30 * 1000 }: MemoryCachePublicControllerParams<T>) {
  return async function cachedController (params: T, req: Req, res: Res) {
    if (before != null) before(res)
    let stringifiedBody
    const cacheKey = getCacheKey(params)
    if (cache[cacheKey] == null) {
      const body = await controller(params)
      stringifiedBody = JSON.stringify(body)
    } else {
      const { body, timeout } = cache[cacheKey]
      // Reset the timeout on cache hit, making it behave like a debounce
      clearTimeout(timeout)
      stringifiedBody = body
    }
    setCache(cacheKey, stringifiedBody, cacheTtl)
    res.send(stringifiedBody)
  }
}

function setCache (cacheKey: string, body: string, cacheTtl: number) {
  const timeout = setTimeout(() => delete cache[cacheKey], cacheTtl)
  cache[cacheKey] = { body, timeout }
}
