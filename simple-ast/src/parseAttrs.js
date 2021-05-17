export default function (attrsStr) {
    let result = []

    let prev = 0
    let isYh = false

    for (let i = 0; i < attrsStr.length; i++) {
        const char = attrsStr[i];
        if (char === '"') {
            isYh = !isYh
        } else if (char === ' ' && !isYh) {
            console.log(prev, i)
            result.push(attrsStr.substring(prev, i).trim())
            prev = i
        }
    }

    result.push(attrsStr.substring(prev).trim())

    result = result
        .filter(v => v)
        .map(v => {
            var match = v.match(/^(.+)="(.+)"$/)
            return { name: match(1), value: match(2) }
        })

    return result
}