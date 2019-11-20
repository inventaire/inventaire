module.exports = attributes => ({
  solveConstraint: (model, attribute) => {
    const { possibilities, defaultValue } = attributes.constrained[attribute]
    if (possibilities.includes(model[attribute])) {
      return model[attribute]
    } else {
      return defaultValue
    }
  }
})
