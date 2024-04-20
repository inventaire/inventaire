import type { User, UserId } from '#types/user'
import type Express from 'express'

export interface AuthentifiedReq extends Express.Request {
  user: User
}

export type Req = Express.Request | AuthentifiedReq

export type Res = Express.Response

export type Next = () => void

export type Sanitized<Params> = Params & { reqUserId?: UserId }
