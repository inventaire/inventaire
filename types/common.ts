import isbn3 from 'isbn3'
import type { uploadContainersNames } from '#controllers/images/lib/containers'

const { parse: isbnParser } = isbn3

export type LatLng = [ number, number ]

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'options' | 'head'
export type HttpHeaderKey =
  'accept' |
  'authorization' |
  'cache-control' |
  'content-type' |
  'cookie' |
  'date' |
  'digest' |
  'host' |
  'signature' |
  'user-agent' |
  `x-${string}`

export type HttpHeaders = Partial<Record<HttpHeaderKey, string>>

export type AbsoluteUrl = `http${string}`
export type RelativeUrl = `/${string}`
export type Url = AbsoluteUrl | RelativeUrl
export type Path = string

export type ImageHash = string
export type ImageContainer = typeof uploadContainersNames[number]
export type ImagePath = `/img/${ImageContainer}/${ImageHash}`

export type HighResolutionTime = [ number, number ]

export type ISODate = string

export type StringifiedHashedSecretData = `{${string}}`
