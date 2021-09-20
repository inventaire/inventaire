const formatAuthorName = name => {
  if (name.includes(', ')) {
    const [ lastName, firstName ] = name.split(', ')
    return `${firstName} ${lastName}`
  } else {
    return name
  }
}

module.exports = { formatAuthorName }
