import isbn3 from 'isbn3'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { parse: isbnParser } = isbn3

export type LatLng = [ number, number ]
export type BBox = [ LatLng, LatLng ]
export type Bounds = [ number, number, number, number ]

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
export type Origin = AbsoluteUrl
export type Host = string
export type Path = string

export type HighResolutionTime = [ number, number ]

export type ISODate = string

export type StringifiedHashedSecretData = `{${string}}`

export type IsbnData = ReturnType<typeof isbnParser> & {
  groupPrefix?: string
  publisherPrefix?: string
  groupLang?: string
  groupLangUri?: string
}

export type ColorHexCode = `#${number}`

export type SortFunction<T> = (a: T, b: T) => number

// Source: https://stackoverflow.com/questions/69850324/omit-never-types-in-typescript#answer-69852402
export type OmitNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K]
}
