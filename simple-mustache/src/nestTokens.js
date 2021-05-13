/**
 * 将 tokens 处理成嵌套树结构
 * @param {*} tokens 
 * @returns 
 */
export default function nestTokens(tokens) {
  let nestedTokens = []
  let collector = nestedTokens  // 当前层级
  let sections = []  // 栈模型，记录当前遍利层级

  tokens.forEach(token => {
    switch (token[0]) {
      case '#':
        collector.push(token)
        sections.push[token]  // 入栈
        collector = token[2] = []  // 移动指针到栈顶
        break;
      case '/':
        sections.pop()  // 出栈
        collector = sections.length ? sections[sections.length - 1][2] : nestedTokens  // 移动当指针到栈顶 空栈则指向 nestedTokens
        break;
      default:
        collector.push(token)
        break;
    }
  })

  return nestedTokens
}
