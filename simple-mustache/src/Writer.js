import parseTemplate from './parseTemplate'

class Writer {



  parse(template) {
    return parseTemplate(template)
  }

  

  render(template, view) {
    var tokens = this.parse(template)
  }

  renderTokens() {

  }

  // 循环
  renderSection() {

  }

  renderInverted() {

  }
}

export default new Writer()