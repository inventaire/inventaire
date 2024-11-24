import type { CouchDoc, DatabaseName, DesignDocName, Views } from '#types/couchdb'

export interface DatabaseConfig {
  name: string
  designDocs: Record<DesignDocName, Views<CouchDoc>>
}

interface DesignDocOperationsSummary {
  created?: boolean
  updated?: boolean
}

interface SecurityDocOperationsSummary {
  created: boolean
}

export interface DatabaseOperationsSummary {
  created?: boolean
  updated?: boolean
  designDocs?: Record<DesignDocName, DesignDocOperationsSummary>
  securityDoc?: SecurityDocOperationsSummary
}

export type OperationsSummary = Record<DatabaseName, DatabaseOperationsSummary>
