import nestTokens from './nestTokens'

/**
 * 将 模板 解析为 tokens 嵌套树结构
 * @param {*} template 
 * @returns 
 */
export default function parseTemplate (template) {
  let tokens = []

  console.log(template)

  return nestTokens(tokens)
}