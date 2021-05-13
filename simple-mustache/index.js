import writer from './src/Writer'
import Mustache from 'mustache'
import parseTemplate from './src/parseTemplate'

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


// var str = '啊哈哈{{ab}}呵呵{{cd}}啦啦'
// writer.render(template, { bb: '11' })


var t = `
  <div>
    {{#stooges}}
    <b>{{name}}</b>
    {{/stooges}}
  </div>
`
console.log(JSON.stringify(writer.render(t)))


var v = {
  "stooges": [
    { "name": "Moe" },
    { "name": "Larry" },
    { "name": "Curly" }
  ]
}

var cc = [
  ["text", "\n  <div>\n    "],
  ["name", "#stooges"],
  ["text", "\n    <b>"],
  ["name", "name"],
  ["text", "</b>\n    "],
  ["name", "/stooges"],
  ["text", "\n  </div>\n"]
]



// var vv = Mustache.parse("我叫{{name}}，今年{{age}}岁。")
// console.log(JSON.stringify(vv))


