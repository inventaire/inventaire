import type { ViewKey, ViewName } from 'blue-cot/types/types.js'

export type CouchUuid = string
export type CouchRevId = `${number}-${string}`

export interface CouchDoc {
  _id: string
  _rev: CouchRevId
}

export type DatabaseName = string
export type DesignDocName = string
export type DesignDocFilePath = string

export type SimpleMapFunction<D> = (doc: D) => void
export type MapFunctionHelper = unknown
export type MapFunction<D> = SimpleMapFunction<D> | MapFunctionHelper

export type BuiltInReduce = '_count' | '_sum' | '_stats'
export type CustomReduceFunction = (key: ViewKey, values, rereduce) => unknown

export interface View<D> {
  map: SimpleMapFunction<D> | MapFunction<D>[]
  reduce?: BuiltInReduce | CustomReduceFunction
}

export type Views<D> = Record<ViewName, View<D>>
