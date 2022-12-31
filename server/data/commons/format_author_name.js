const formatAuthorName = name => {
  if (name.includes(', ')) {
    const [ lastName, firstName ] = name.split(', ')
    return `${firstName} ${lastName}`
  } else {
    return name
  }
}

export default { formatAuthorName }
