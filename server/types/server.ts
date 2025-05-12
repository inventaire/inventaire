import type { MinimalRemoteUser } from '#lib/federation/remote_user'
import type { RelativeUrl, Host, Origin, HttpMethodUpperCased } from '#types/common'
import type { User, UserId } from '#types/user'
import type Express from 'express'
import type { OverrideProperties, SetOptional } from 'type-fest'

type IncomingRequest = OverrideProperties<Express.Request, {
  // Narrow down from type 'string'
  method: HttpMethodUpperCased
}>

export interface AuthentifiedReq extends IncomingRequest {
  user: User
}

/** See https://en.wikipedia.org/wiki/Acct_URI_scheme */
export type UserAccountUri = `${UserId}@${Host}`

export interface SignedReq extends IncomingRequest {
  signed: {
    host: Host
    origin: Origin
  }
  mute?: boolean
}

export type MaybeSignedReq = SetOptional<SignedReq, 'signed'>

export interface RemoteUserAuthentifiedReq extends SignedReq {
  remoteUser: MinimalRemoteUser
}

export type Req = (IncomingRequest | AuthentifiedReq | MaybeSignedReq) & {
  _startAt?: ReturnType<typeof process.hrtime>
}

export type Res = Express.Response & { warnings?: string[] }

export type Next = () => void

export type Sanitized<Params> = Params & { reqUserId?: UserId }

export type Middleware = (req: Req, res: Res, next: Next) => void

export type PathSpecificMiddleware = [ RelativeUrl, Middleware ]
