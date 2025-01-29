import type { MinimalRemoteUser } from '#lib/federation/remote_user'
import type { RelativeUrl, Host } from '#types/common'
import type { User, UserId } from '#types/user'
import type Express from 'express'
import type { SetOptional } from 'type-fest'

export interface AuthentifiedReq extends Express.Request {
  user: User
}

/** See https://en.wikipedia.org/wiki/Acct_URI_scheme */
export type UserAccountUri = `${UserId}@${Host}`

export interface SignedReq extends Express.Request {
  signed: {
    host: Host
  }
  mute?: boolean
}

export type MaybeSignedReq = SetOptional<SignedReq, 'signed'>

export interface RemoteUserAuthentifiedReq extends SignedReq {
  remoteUser: MinimalRemoteUser
}

export type Req = (Express.Request | AuthentifiedReq | SignedReq) & {
  _startAt?: ReturnType<typeof process.hrtime>
}

export type Res = Express.Response & { warnings?: string[] }

export type Next = () => void

export type Sanitized<Params> = Params & { reqUserId?: UserId }

export type Middleware = (req: Req, res: Res, next: Next) => void

export type PathSpecificMiddleware = [ RelativeUrl, Middleware ]
