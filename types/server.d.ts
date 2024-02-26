import type Express from 'express'

export interface Req extends Express.Request {
  // user?: User
  user?: unknown
}

export type Res = Express.Response

export type Next = () => void
