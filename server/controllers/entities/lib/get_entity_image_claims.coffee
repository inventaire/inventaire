# Test claims existance to prevent crash when used on meta entities
# for which entities claims were deleted
module.exports = (entity)-> entity.claims?['wdt:P18']
