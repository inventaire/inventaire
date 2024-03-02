export type CouchUuid = string
export type CouchRevId = `${number}-${string}`

export interface CouchDoc {
  _id: CouchUuid
  _rev: CouchRevId
}

export type LatLng = [ number, number ]

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'options' | 'head'
export type HttpHeaderKey = 'accept' | 'authorization' | 'cache-control' | 'content-type' | 'cookie' | 'user-agent' | `x-${string}`
export type HttpHeaders = Partial<Record<HttpHeaderKey, string>>

export type AbsoluteUrl = `http${string}`
export type RelativeUrl = `/${string}`
export type Url = AbsoluteUrl | RelativeUrl

export type ImageHash = string