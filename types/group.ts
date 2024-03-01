import type { CouchDoc, CouchUuid } from '#types/common'

export type GroupId = CouchUuid

export interface Group extends CouchDoc {
  name: string
  picture
}
