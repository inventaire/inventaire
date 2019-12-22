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
