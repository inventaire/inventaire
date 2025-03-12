import type { Req } from '#types/server'

export function getUserAgent (req: Req) {
  return req.headers['user-agent']
}

const botUserAgentPattern = /(bot|prerender|headless)/i

export function isBotRequest (req: Req) {
  const userAgent = getUserAgent(req)
  return botUserAgentPattern.test(userAgent)
}
