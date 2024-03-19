export default doc => {
  if (doc.position != null) {
    const [ lat, lon ] = doc.position
    doc.position = { lat, lon }
  }
  return doc
}
