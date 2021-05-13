

class Scanner {
  constructor(string) {
    this.string = string
    this.tail = string
  }

  eos() {
    return this.tail === ''
  }

  // 返回匹配值（匹配值必须在开头）
  scan (re) {
    let match = this.tail.match(re)

    if (!match || match.index !== 0) {
      return ''
    }

    let string = match[0]
    this.tail = this.tail.substring(string.length)

    return match[0]
  }

  // 返回匹配值之前的值
  scanUtil (re) {
    let index = this.tail.search(re), match

    switch (index) {
      case -1:
        match = this.tail
        this.tail = ''
        break;
      case 0:
        match = ''
        break;
      default:
        match = this.tail.substring(0, index)
        this.tail = this.tail.substring(index)
    }

    return match
  }
}

export default Scanner