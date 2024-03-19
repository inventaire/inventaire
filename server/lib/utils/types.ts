export function typeOf (obj) {
  // just handling what differes from typeof
  const type = typeof obj
  if (type === 'object') {
    if (obj === null) return 'null'
    if (obj instanceof Array) return 'array'
    if (obj instanceof Promise) return 'promise'
  }
  if (type === 'number') {
    if (Number.isNaN(obj)) return 'NaN'
  }
  return type
}

// Source: https://www.totaltypescript.com/tips/create-your-own-objectkeys-function-using-generics-and-the-keyof-operator
export function objectKeys <Obj> (obj: Obj): (keyof Obj)[] {
  return Object.keys(obj) as (keyof Obj)[]
}
