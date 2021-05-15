import Mustache from 'mustache'
import render from './src/render'

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
const view = {
  dataName: '啊哈哈',
  list: [{
    key: 'key1',
    values: [
      { aa: '1111' },
      { aa: '1222' },
    ]
  }, {
    key: 'key2',
    values: [
      { aa: '2111' },
      { aa: '2222' },
    ]
  }]
}


const template1 = "我叫{{name}}，今年{{age}}岁。"
const view1 = {
  name: "王大锤",
  age: 18,
}


var template2 = `
  <div>
    {{#stooges}}
    <b>{{name}}</b>
    {{/stooges}}
  </div>
`
var view2 = {
  "stooges": [
    { "name": "Moe" },
    { "name": "Larry" },
    { "name": "Curly" }
  ]
}




// const htmlStr = render(template, view)
// console.log(htmlStr)


const htmlStr = render(template1, view1)
console.log(htmlStr)

// const htmlStr = render(template2, view2)
// console.log(htmlStr)