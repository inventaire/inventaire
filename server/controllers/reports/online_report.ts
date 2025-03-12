import { getLangFromHeaders } from '#lib/headers'
import { isBotRequest } from '#lib/incoming_requests'
import { responses_ } from '#lib/responses'
import type { Req, Res } from '#types/server'
import onlineUsers from './lib/online_users.js'

export default function (req: Req, res: Res) {
  const { headers } = req

  // Excluding bots from online counts
  if (isBotRequest(req)) return responses_.ok(res)

  onlineUsers({
    userId: 'user' in req ? req.user._id : null,
    // For production, when behind a Nginx proxy
    ip: headers['x-forwarded-for'],
    userAgent: headers['user-agent'],
    lang: getLangFromHeaders(headers),
  })

  responses_.ok(res)
}
