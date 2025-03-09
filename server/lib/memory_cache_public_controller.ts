import type { Req, Res } from '#types/server'

interface MemoryCachePublicControllerParams <T> {
  before?: (res: Res) => unknown
  controller: (params: T) => unknown
  getCacheKey: (params: T) => string
  cacheTtl: number
}

const cache = {}

export function memoryCachePublicController <T> ({ before, controller, getCacheKey, cacheTtl }: MemoryCachePublicControllerParams<T>) {
  return async function cachedController (params: T, req: Req, res: Res) {
    if (before != null) before(res)
    const cacheKey = getCacheKey(params)
    if (cache[cacheKey] == null) {
      const body = await controller(params)
      cache[cacheKey] = JSON.stringify(body)
      setTimeout(() => delete cache[cacheKey], cacheTtl)
    }
    res.send(cache[cacheKey])
  }
}
