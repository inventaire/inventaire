# using a different linkify for server or client
module.exports = (linkify)->
  # used by String::replace to pass text -> $1 and url -> $2 values
  dynamicLink = linkify '$1', '$2'

  convertMarkdownLinks = (text)->
    if text?
      text
      # Replacing local links first
      # that is links starting by / or a variable starting with %
      # Example:
      # - "your_item_was_requested_subject": "%{username} requested your book [%{title}](%{link})"
      .replace /\[([^\]]+)\]\(((\/|%)[^\)]+)\)/g, dynamicLink
      # Remove the target on those local links
      .replace " target='_blank'", ''
      # Then replace other links and keep the target='_blank'
      .replace /\[([^\]]+)\]\(([^\)]+)\)/g, dynamicLink


  convertMarkdownBold = (text)->
    text?.replace /\*\*([^*]+)\*\*/g, '<strong>$1</strong>'

  return converter = (text)-> convertMarkdownLinks convertMarkdownBold(text)
