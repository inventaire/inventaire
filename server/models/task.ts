import { round } from 'lodash-es'
import { assertType, assertObject, assertString } from '#lib/utils/assert_types'
import type { Task } from '#types/task'
import type { UserId } from '#types/user'
import taskValidations from './validations/task.js'

type NewTask = Omit<Task, 'reporters'> & { reporter: UserId }

export function createTaskDoc (newTask: NewTask) {
  assertObject(newTask)
  const { type, entitiesType, suspectUri, suggestionUri, externalSourcesOccurrences, reporter, clue } = newTask
  let { lexicalScore } = newTask

  taskValidations.pass('type', type)
  taskValidations.pass('suspectUri', suspectUri)

  const task = {
    type,
    suspectUri,
    suggestionUri,
    created: Date.now(),
  }

  if (lexicalScore) lexicalScore = round(lexicalScore, 2)

  validateAndAssign(task, 'entitiesType', entitiesType)
  validateAndAssign(task, 'lexicalScore', lexicalScore)
  validateAndAssign(task, 'externalSourcesOccurrences', externalSourcesOccurrences)
  validateAndAssign(task, 'clue', clue)
  if (reporter) {
    taskValidations.pass('reporter', reporter)
    assignArrayOrConcatValue(task, 'reporters', reporter)
  }
  return task
}

export function updateTaskDoc (task: Task, attribute, value) {
  assertObject(task)
  assertString(attribute)
  // Accept an undefined state value as that's the default state
  if (value || attribute !== 'state') assertType('string|number', value)

  taskValidations.pass('attribute', attribute)
  taskValidations.pass(attribute, value)

  if (attribute === 'reporter') {
    assignArrayOrConcatValue(task, 'reporters', value)
  } else {
    task[attribute] = value
  }

  const now = Date.now()
  task.updated = now
  return task
}

function validateAndAssign (task, name, attribute) {
  if (attribute) {
    taskValidations.pass(name, attribute)
    task[name] = attribute
  }
}

function assignArrayOrConcatValue (task, attribute, value) {
  task[attribute] ??= []
  if (!task[attribute].includes(value)) {
    task[attribute].push(value)
  }
}
