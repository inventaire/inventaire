import type { User } from './user'
import type Express from 'express'

export interface AuthentifiedReq extends Express.Request {
  user: User
}

export type Req = Express.Request | AuthentifiedReq

export type Res = Express.Response

export type Next = () => void
