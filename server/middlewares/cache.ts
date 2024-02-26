import CONFIG from 'config'
import { pass } from './pass.js'

const { noCache } = CONFIG

export let cacheControl

// Applies to both API and static files requests
if (noCache) {
  cacheControl = (req, res, next) => {
    res.header('cache-control', 'no-cache, no-store, must-revalidate')
    next()
  }
} else {
  cacheControl = pass
}
