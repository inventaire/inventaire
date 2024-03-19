export const newItemBase = () => ({ entity: 'wd:Q3548806' })

export function CountChange (snapBefore, snapAfter) {
  return section => {
    const before = snapBefore[section]['items:count']
    const after = snapAfter[section]['items:count']
    return after - before
  }
}
