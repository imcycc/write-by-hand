import parseAttrs from './parseAttrs'


export default function (template) {
    let startTagRe = /^\<([a-z]+[1-6]?)(\s+[^\<\>]*)?\>/
    let endTagRe = /^\<\/([a-z]+[1-6]?)\>/
    let textRe = /^([^\<]+)\<\/[a-z]+[1-6]?\>/
    let index = 0
    let tail = template  // 尾部

    let stack = [{ children: [] }]

    while (index < template.length) {
        tail = template.substring(index)

        if (startTagRe.test(tail)) {
            let match = tail.match(startTagRe)
            let tag = match[1]
            let attrsStr = match[2]
            stack.push({ tag, attrs: attrsStr ? parseAttrs(attrsStr) : [], children: [] })
            index += match[0].length
        } else if (endTagRe.test(tail)) {
            let tag = tail.match(endTagRe)[1]
            let curr = stack.pop()
            stack[stack.length - 1].children.push(curr)
            index += tag.length + 3
        } else if (textRe.test(tail)) {
            let text = tail.match(textRe)[1]
            stack[stack.length - 1].children.push({ text })
            index += text.length
        } else {
            index++
        }
    }

    return stack[0].children
}