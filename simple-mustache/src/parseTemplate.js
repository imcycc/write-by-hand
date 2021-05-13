import Scanner from './Scanner'
import nestTokens from './nestTokens'

/**
 * 将 模板 解析为 tokens 嵌套树结构
 * @param {*} template 
 * @returns 
 */
export default function parseTemplate(template) {
  const openingTagRe = /\{\{\s*/
  const closingTagRe = /\s*\}\}/
  const tagRe = /#|\//
  let tokens = []

  const scanner = new Scanner(template)

  let value, type
  while (!scanner.eos()) {
    // 获取 text
    value = scanner.scanUtil(openingTagRe)
    if (value) {
      tokens.push(['text', value])
    }

    // 跳过开始符号，没有找到开始符号则跳过当前循环
    if (!scanner.scan(openingTagRe)) {
      break
    }

    // 获取类型 # / name
    type = scanner.scan(tagRe) || 'name';
    // 获取 name
    value = scanner.scanUtil(closingTagRe)
    if (value) {
      tokens.push([type, value])
    }

    // 跳过结束符号
    scanner.scan(closingTagRe)
  }

  return nestTokens(tokens)
}
