module.exports = {
  newItemBase: () => ({ entity: 'wd:Q3548806' }),

  CountChange: (snapBefore, snapAfter) => {
    return section => {
      const before = snapBefore[section]['items:count']
      const after = snapAfter[section]['items:count']
      return after - before
    }
  }
}
