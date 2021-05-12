import writer from './src/Writer'

const template = `
<div>
  {{ dataName }}
  {{#list}}
    <div>{{key}}</div>
    <div>
      {{#values}}
        <div>{{aa}}</div>
      {{/values}}
    </div>
  {{/list}}
</div>
`

const data = {
  dataName: '啊哈哈',
  list: [{
    key: '1',
    values: [
      { aa: '1111' },
      { aa: '1222' },
    ]
  }, {
    key: '2',
    values: [
      { aa: '2111' },
      { aa: '2222' },
    ]
  }]
}

// var tokens = parseTemplate(template)
// console.log(tokens)
// var writer = new Writer()
// var html = writer.renderTokens(tokens, data)

// console.log(html)

writer.render('啊哈哈{{ab}}呵呵{{cd}}啦啦', { bb: '11' })