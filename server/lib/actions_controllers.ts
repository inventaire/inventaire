import { objectEntries } from '#lib/utils/base'
import type { HttpMethod } from '#types/common'
import type { ActionController, ActionsControllers, MethodsAndActionsControllers } from '#types/controllers'
import type { Req, Res } from '#types/server'
import { controllerWrapper, validateControllerWrapperParams } from './controller_wrapper.js'
import { bundleMissingQueryError, bundleUnknownAction } from './error/pre_filled.js'
import { type AccessLevel } from './user_access_levels.js'

// A function to route requests to an endpoint to sub-endpoints identified by their 'action' names

export function actionsControllersFactory (controllers: ActionsControllers) {
  const actionsControllersParams = getActionsControllersParams(controllers)
  return async (req: Req, res: Res) => {
    // Accepting the action to be passed either as a query string
    // or as a body parameter for more flexibility
    const action = req.query.action || req.body.action || 'default'

    if (action === 'default' && !('default' in actionsControllersParams)) {
      return bundleMissingQueryError(req, res, 'action')
    }

    const controllerParams = actionsControllersParams[action]
    if (controllerParams == null) return bundleUnknownAction(req, res)

    return controllerWrapper(controllerParams, req, res)
  }
}

function getActionsControllersParams (controllers: ActionsControllers) {
  const actionsControllersParams = {}
  for (const [ accessLevel, actionControllers ] of objectEntries(controllers)) {
    for (const [ actionName, actionData ] of objectEntries(actionControllers)) {
      actionsControllersParams[actionName] = getActionControllerParams(accessLevel, actionData)
    }
  }
  return actionsControllersParams
}

function getActionControllerParams (access: AccessLevel, actionData: ActionController) {
  let controller, sanitization, track
  if (typeof actionData === 'function') {
    controller = actionData
  } else {
    ({ controller, sanitization, track } = actionData)
  }
  const controllerParams = { access, controller, sanitization, track }
  validateControllerWrapperParams(controllerParams)
  return controllerParams
}

type ControllersByMethodsAndActions = Partial<Record<HttpMethod, ReturnType<typeof actionsControllersFactory>>>

export function methodAndActionsControllersFactory (methodsAndActionsControllers: MethodsAndActionsControllers) {
  const controllersByMethodsAndActions: ControllersByMethodsAndActions = {}
  for (const [ method, actionsControllersParams ] of objectEntries(methodsAndActionsControllers)) {
    controllersByMethodsAndActions[method] = actionsControllersFactory(actionsControllersParams)
  }
  return controllersByMethodsAndActions
}
