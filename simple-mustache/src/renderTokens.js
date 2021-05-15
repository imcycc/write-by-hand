export default function renderTokens (tokens, view) {
  let buffer = ''

  tokens.forEach(token => {
    const type = token[0]
    const value = token[1]

    if (type === 'text') {
      buffer += value
    } else if (type === 'name') {
      buffer += view[value]
    } else if (type === '#') {
      const subTokens = token[2]
      const subViews = view[value]
      subViews.forEach(subView => {
        buffer += renderTokens(subTokens, subView)
      })
    }

  })

  return buffer
}