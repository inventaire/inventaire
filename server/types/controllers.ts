import type { AccessLevel } from '#lib/user_access_levels'
import type { HttpMethod } from '#types/common'
import type { ControllerInputSanitization } from '#types/controllers_input_sanitization'
import type { Req, Res } from '#types/server'

export type StandaloneControllerFunction <Response = unknown | void> = (req: Req, res: Res) => Response
export type SanitizedControllerFunction <Response = unknown | void> = (params: unknown, req: Req, res: Res) => Response

export interface ActionControllerObject {
  sanitization: ControllerInputSanitization
  controller: SanitizedControllerFunction
  track?: string[]
  metadata?: {
    summary: string
  }
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
