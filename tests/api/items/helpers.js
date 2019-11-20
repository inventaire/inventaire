
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

module.exports = {
  newItemBase: () => ({ entity: 'wd:Q3548806', lang: 'fr' }),

  CountChange: (snapBefore, snapAfter) => {
    return section => {
      const before = snapBefore[section]['items:count']
      const after = snapAfter[section]['items:count']
      return after - before
    }
  }
}
