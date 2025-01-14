import type { ParsedForm } from '#controllers/images/lib/parse_form'
import type { RelativeUrl } from '#types/common'
import type { User, UserId } from '#types/user'
import type Express from 'express'

export interface AuthentifiedReq extends Express.Request {
  user: User
}

export type Req = Express.Request | AuthentifiedReq
export type SignedReq = Req

export type Res = Express.Response & { warnings?: string[] }

export type Next = () => void

export type Sanitized<Params> = Params & { reqUserId?: UserId }

export interface FormReq extends AuthentifiedReq {
  form: ParsedForm
}

export type Middleware = (req: Req, res: Res, next: Next) => void

export type PathSpecificMiddleware = [ RelativeUrl, Middleware ]
