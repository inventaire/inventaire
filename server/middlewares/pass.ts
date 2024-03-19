import type { Next, Req, Res } from '#types/server'

export function pass (req: Req, res: Res, next: Next) {
  next()
}
