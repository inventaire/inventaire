module.exports = (str)->
  str.trim().toLowerCase()
  # Remove reserved characters
  .replace /[\/?!=$<>&:#()\|\[\]]+/g, ''
  # Replace spaces and points with -
  .replace /(\s+|\.)/g, '-'
  # Replace multiple - with a single -
  .replace /\-+/g, '-'
