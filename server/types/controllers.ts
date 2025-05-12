import type { AccessLevel } from '#lib/user_access_levels'
import type { Req, Res } from '#types/server'

type SanitizationObject = Record<string, unknown>

export type StandaloneControllerFunction <Response = unknown | void> = (req: Req, res: Res) => Response
export type SanitizedControllerFunction <Response = unknown | void> = (params: unknown, req: Req, res: Res) => Response

export interface ActionControllerObject {
  sanitization: SanitizationObject
  controller: SanitizedControllerFunction
  track?: string[]
}

export type ActionController = StandaloneControllerFunction | ActionControllerObject

type ActionName = string

interface AccessLevelControllers {
  [key: ActionName]: ActionController
}

export type ActionsControllers = {
  [K in AccessLevel]?: AccessLevelControllers
}

export type MethodsAndActionsControllers = Partial<Record<HttpMethod, ActionsControllers>>
