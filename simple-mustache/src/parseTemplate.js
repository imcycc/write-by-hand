import Scanner from './Scanner'
import nestTokens from './nestTokens'

/**
 * 将 模板 解析为 tokens 嵌套树结构
 * @param {*} template 
 * @returns 
 */
export default function parseTemplate (template) {
  const openingTagRe = /\{\{\s*/
  const closingTagRe = /\s*\}\}/
  let tokens = []

  const scanner = new Scanner(template)

  let text, name
  while (!scanner.eos()) {
    text = scanner.scanUtil(openingTagRe)
    if (text) {
      tokens.push(['text', text])
    }

    if (!scanner.scan(openingTagRe)) {
      break
    }

    name = scanner.scanUtil(closingTagRe)
    if (name) {
      tokens.push(['name', name])
    }

    scanner.scan(closingTagRe)
  }
  console.log(tokens)
  return nestTokens(tokens)
}