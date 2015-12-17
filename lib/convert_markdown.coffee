# using a different linkify for server or client
module.exports = (linkify)->
  # used by String::replace to pass text -> $1 and url -> $2 values
  dynamicLink = linkify '$1', '$2'

  convertMarkdownLinks = (text)->
    text?.replace /\[([^\]]+)\]\(([^\)]+)\)/g, dynamicLink

  convertMarkdownBold = (text)->
    text?.replace /\*\*([^*]+)\*\*/g, '<strong>$1</strong>'

  return converter = (text)-> convertMarkdownLinks convertMarkdownBold(text)
