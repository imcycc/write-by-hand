import parse from './src/parse'

const template = `<div>
  <h3 id="title" class="a b c">标题</h3>
  <ul>
    <li>A</li>
    <li>B</li>
    <li>C</li>
  </ul>
</div>`

const ast = parse(template)
console.log(ast)