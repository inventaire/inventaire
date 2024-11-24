import type dbFactory from '#db/couchdb/base'
import type { DocumentViewResponse } from 'blue-cot/types/nano.js'
import type { NewDoc, ViewKey, ViewName } from 'blue-cot/types/types.js'
import type { AsyncReturnType } from 'type-fest'

export type CouchUuid = string
export type CouchRevId = `${number}-${string}`

export interface CouchDoc {
  _id: string
  _rev: CouchRevId
}

export type NewCouchDoc <Doc extends CouchDoc> = Omit<Doc, '_id' | '_rev'> & NewDoc

export type DatabaseBaseName = string
export type DatabaseName = string
export type DesignDocName = string
export type DesignDocFilePath = string

export type SimpleMapFunction<D extends CouchDoc> = (doc: D) => void
export type MapFunctionHelper = unknown
export type MapFunction<D extends CouchDoc> = SimpleMapFunction<D> | MapFunctionHelper

export type BuiltInReduce = '_count' | '_sum' | '_stats'
export type CustomReduceFunction = (key: ViewKey, values, rereduce) => unknown

export interface View<D extends CouchDoc> {
  map: SimpleMapFunction<D> | MapFunction<D>[]
  reduce?: BuiltInReduce | CustomReduceFunction
}

export type Views<D extends CouchDoc> = Record<ViewName, View<D>>

export type DbHandler = AsyncReturnType<typeof dbFactory>

export type UnknownDocumentViewResponse = DocumentViewResponse<CouchDoc, ViewKey, unknown>
