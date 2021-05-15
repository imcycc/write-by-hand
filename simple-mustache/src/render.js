import parseTemplate from './parseTemplate'
import renderTokens from './renderTokens'

export default function render(template, view) {
  const tokens = parseTemplate(template)
  return renderTokens(tokens, view)
}