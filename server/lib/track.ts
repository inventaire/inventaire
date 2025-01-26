// Doc: http://developer.matomo.org/api-reference/tracking-api
import { LogError } from '#lib/utils/logs'
import { buildUrl } from '#lib/utils/url'
import config, { publicOrigin } from '#server/config'
import type { LocalActorUrl } from '#types/activity'
import type { Req, Res } from '#types/server'
import { requests_ } from './requests.js'

const { enabled, endpoint, idsite, rec } = config.matomo
const placeholderUrl = '/unknown'

interface PseudoReq {
  user: { _id: LocalActorUrl }
}

export function track (req: Req | PseudoReq, actionArray: string[]) {
  if (!enabled) return

  let userId, language
  if ('user' in req) {
    ;({ _id: userId } = req.user)
    if ('language' in req.user) {
      ;({ language } = req.user)
    }
  }
  let ua, al, url
  if ('headers' in req) {
    ;({ 'user-agent': ua, 'accept-language': al, referer: url } = req.headers)
  }
  const [ category, action, name, value ] = actionArray

  // a url is required so we use a placeholder if not provided in parameter
  if (!url) url = placeholderUrl
  // allow to pass a relative path to let this module turn it into the expected full url
  if (url[0] === '/') url = `${publicOrigin}${url}`

  const data = {
    idsite,
    rec,
    url,
    uid: userId,
    e_c: category,
    // prefixing the action with the category
    // as Matomo don't allow multicriteria Objectifs such as
    // Category is a and Action is b
    e_a: `${category}:${action}`,
    e_n: name,
    e_v: value,
    ua,
    lang: language || al,
  }

  requests_.get(buildUrl(endpoint, data), { parseJson: false })
  .catch(LogError('track error'))

  // Do not return the promise as a failing track request
  // should not make the rest of operations fail
}

export function trackActor (actorUri, actionArray) {
  const pseudoReq: PseudoReq = {
    user: { _id: actorUri },
  }
  track(pseudoReq, actionArray)
}

export const Track = (req: Req, actionArray: string[]) => (res: Res) => {
  // Do not wait for the track action
  track(req, actionArray)
  return res
}
