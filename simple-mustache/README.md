# 实现一个简易版的 mustache 模板引擎

官网地址: [github: mustache](https://github.com/janl/mustache.js)

mustache 是模版语法的开山鼻祖。本文将讲解 mustache 实现原理，和手写一个简易版的 mustache。

**注意**：mustache 源码中用 view 表示需要渲染的数据，本文也用 view 来表示。

先来看下 mustache 的模板语法和循环语法，下文也主要实现这两种基础语法。

```js
// ----------------模板语法----------------
const template = "我叫{{name}}，今年{{age}}岁。"
const view = {
  name: "王大锤",
  age: 18,
}
const output = Mustache.render(template, view)
// "我叫王大锤，今年18岁"


// ----------------循环语法----------------
const template = `
  <div>
    {{#stooges}}
    <b>{{name}}</b>
    {{/stooges}}
  </div>
`
const view = {
  "stooges": [
    { "name": "Moe" },
    { "name": "Larry" },
    { "name": "Curly" }
  ]
}
const output = Mustache.render(template, view)
// `
//   <div>
//     {{#stooges}}
//     <b>{{name}}</b>
//     {{/stooges}}
//   </div>
// `
```

由上面两个例子可以看出，mustache 专注与 将模板字符串和数据渲染为静态 html。

原理是：将模板字符串通过标识符分割，转换成嵌套树结构，其层级和数据层级相同，然后组合生成字符串。

## 实现

实现的代码地址：[github: simple-mustache](https://github.com/imcycc/write-by-hand/tree/main/simple-mustache)

mustache api 实现了很多用法，我们挑选其中最经典的两个语法进行实现。

* <code>{{a}}</code> 双括号插值语法
* <code># /</code> 循环符号

实现的步骤主要分为 3 大块：

1. 将模板转为 tokens
2. 将 tokens 转为嵌套树结构的 tokens
3. tokens + view 生成 htmlStr

首先来看一下什么叫 tokens

### 何为 tokens

tokens 是模板字符串解析后的嵌套树结构数据。

#### 模板字符串和 tokens 解析前后对比

先来看下模板语法和循环语法解析前后如下：

```js
// 解析前 模板字符串
"我叫{{name}}，今年{{age}}岁。"
// 解析后 tokens
[
  ["text", "我叫", 0, 2],
  ["name", "name", 2, 10],
  ["text", "，今年", 10, 13],
  ["name", "age", 13, 20],
  ["text", "岁。", 20, 22]
]


// 解析前 模板字符串
`
  <div>
    {{#stooges}}
    <b>{{name}}</b>
    {{/stooges}}
  </div>
`
// 解析后 tokens
[
  ["text", "\n  <div>\n", 0, 9],
  ["#", "stooges", 13, 25, [
    ["text", "    <b>", 26, 33],
    ["name", "name", 33, 41],
    ["text", "</b>\n", 41, 46]
  ], 50],
  ["text", "  </div>\n", 63, 72]
]
```

**注意**：源码中 token 下标 2 和 3 代表当前 token 在原始模板中的开始位置和结束位置，仅仅表示了位置，我们简易版不实现。

我们要实现的 token 的结构为 <code>['类型', '文本或变量名称', '循环体 children 数组']</code>。

#### token 的第一个位置：类型

源码中 token 类型有很多，我们只实现四种类型：

* text：文本
* name：变量
* <code>#</code> 循环开始符号
* <code>/</code> 循环结束符号（这个符号在单层 tokens 会出现，后面讲）

#### token 的第二个位置：值

如果类型是 text ，值为文本；如果类型是 name 、 # 、 / ，值为变量名。

#### token 的第三个位置：children

如果类型是 # ，children 为循环体，也可以看做是下一层的 tokens。

模板分割为 tokens ，是通过标识符 {{ 和 }} 分割后组合。实现模板分割，源码中实现了 Scanner 类。

### Scanner 扫描器

如果是普通模板语法我们可以通过字符串的 replace 方法 加 正则匹配替换，但是 # / 这种循环语法正则替换就无能为力了。

mustache 源码封装了 Scanner 类来优雅的分割模板。

我们要实现的 Scanner 类有2个属性和3个方法。（源码中 Scanner 类还有属性 pos 是记录字符串的位置，下面不做实现。）

属性：

* string 模板字符串
* tail 剩余字符串

方法：

* eos 判断是否结束
* scan 返回匹配到的字符串，设置剩余字符串为匹配到的字符串的下一个位置到结束
* scanUtil 返回匹配到字符串之前的字符串，设置剩余字符串为匹配到字符串前一个位置到结束

循环穿插调用 scan 和 scanUtil 可完成扫描字符串。（后面讲）

```js
class Scanner {
  constructor(string) {
    this.string = string
    this.tail = string
  }

  // 判断是否扫描结束
  eos() {
    return this.tail === ''
  }

  // 返回匹配值（匹配值必须在开头）
  scan(re) {
    let match = this.tail.match(re)

    if (!match || match.index !== 0) {
      return ''
    }

    let string = match[0]
    this.tail = this.tail.substring(string.length)

    return match[0]
  }

  // 返回匹配值之前的值
  scanUtil(re) {
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
```

### 生成 tokens

生成 tokens 可以简化为两个步骤

1. 将模板字符串转化为单层 tokens
2. 将单层 tokens 处理成 嵌套树结构

函数结构如下：

```js
parseTemplate (template) {
  // 此处 tokens 为单层
  let tokens = []

  // ...

  // nestTokens 将单层 tokens 处理成 嵌套树结构
  return nestTokens(tokens)
}
```

#### parseTemplate 方法

parseTemplate 方法调用 Scanner 分割字符串，这里会传入3个正则：

* <code>/\{\{\s*/</code> 开始符号
* <code>/\s*\}\}/</code> 结束符号
* <code>/#|\//</code> 类型符号

源码思路清晰，每一次 while 循环，执行4个步骤：

1. 调用 scanUtil 获取文本
2. 调用 scan 跳过开始符号（如果没有，跳过本次循环）
3. 调用 scanUtil 获取变量名
4. 调用 scan 跳过结束符号

当然获取变量名时，也通过 scan 获取了类型。

巧妙的使用 scanUtil 和 scan 两个方法和两个正则就完成了单层 tokens。

实现如下：

```js
/**
 * 将 模板 解析为 tokens 嵌套树结构
 * @param {*} template 
 * @returns 
 */
function parseTemplate(template) {
  const openingTagRe = /\{\{\s*/
  const closingTagRe = /\s*\}\}/
  const tagRe = /#|\//
  let tokens = []

  const scanner = new Scanner(template)

  let value, type
  while (!scanner.eos()) {
    // 获取 text
    value = scanner.scanUtil(openingTagRe)
    if (value) {
      tokens.push(['text', value])
    }

    // 跳过开始符号，没有找到开始符号则跳过当前循环
    if (!scanner.scan(openingTagRe)) {
      break
    }

    // 获取类型 # / name
    type = scanner.scan(tagRe) || 'name';
    // 获取 name
    value = scanner.scanUtil(closingTagRe)
    if (value) {
      tokens.push([type, value])
    }

    // 跳过结束符号
    scanner.scan(closingTagRe)
  }

  return nestTokens(tokens)
}
```

此时可以传入最开始的循环语法模板看看单层 tokens 结构

```js
[
  ["text", "\n  <div>\n    "],
  ["#", "stooges"],
  ["text", "\n    <b>"],
  ["name", "name"],
  ["text", "</b>\n    "],
  ["/", "stooges"],
  ["text", "\n  </div>\n"]
]
```

下一步，识别 # / 符号，转化为嵌套结构。

#### nestTokens 方法

nestTokens 方法将 单层 tokens 转换为 嵌套树结构。精髓在于运用了栈结构记录层级，用对象引用类型的特性记录当前操作项。此方法也是最不容易理解的一部分。代码如下：

```js
/**
 * 将 tokens 处理成嵌套树结构
 * @param {*} tokens 
 * @returns 
 */
function nestTokens(tokens) {
  let nestedTokens = []
  let collector = nestedTokens  // 当前层级
  let sections = []  // 栈模型，记录当前遍利层级

  tokens.forEach(token => {
    switch (token[0]) {
      case '#':
        collector.push(token)
        sections.push[token]  // 入栈
        collector = token[2] = []  // 当前层级 指向 栈顶
        break;
      case '/':
        sections.pop()  // 出栈
        collector = sections.length ? sections[sections.length -1][2] : nestedTokens  // 当前层级 指向 栈顶，空栈则指向 nestedTokens
        break;
      default:
        collector.push(token)
        break;
    }
  })

  return tokens
}
```

此时打印看看嵌套树结构的 tokens

```js
[
  ["text", "\n  <div>\n    "],
  ["#", "stooges", [
    ["text", "\n    <b>"],
    ["name", "name"],
    ["text", "</b>\n    "]
  ]],
  ["text", "\n  </div>\n"]
]
```

tokens 处理完成！

### tokens + view 生成 htmlStr

上一步 tokens 生成好了，接下来写一个 renderTokens 函数，传入 tokens 和 view，返回最终结果 htmlStr。

备注：源码中用 Writer 构造函数处理这一个步骤，里面有很多变量和方法，实现了缓存等功能，咱这是简易版，不考虑缓存，一个函数搞定。

#### renderTokens 方法

renderTokens 循环遍历了 tokens，根据 token 类型拼接不同的值，如果是 # 就循环遍历下一层。这个方法也比较好理解，代码如下：

```js
function renderTokens (tokens, view) {
  let buffer = ''

  tokens.forEach(token => {
    const type = token[0]
    const value = token[1]

    if (type === 'text') {
      buffer += value
    } else if (type === 'name') {
      buffer += view[value]
    } else if (type === '#') {
      const subTokens = token[2]
      const subViews = view[value]
      subViews.forEach(subView => {
        buffer += renderTokens(subTokens, subView)
      })
    }

  })

  return buffer
}
```

用文章开头的循环结构数据测试一下：

```js
const tokens = parseTemplate(template)
const htmlStr = renderTokens(tokens, view)
console.log(htmlStr)
// `
//   <div>
//
//     <b>Moe</b>
//
//     <b>Larry</b>
//
//     <b>Curly</b>
//
//   </div>
// `
```

输出正确，中间有很丑的空格和换行符，没啥影响，就不处理了。

获取 htmlStr 得调用两个方法，不方便，写个 render 函数整合起来。

#### render 方法

```js
function render(template, view) {
  const tokens = parseTemplate(template)
  return renderTokens(tokens, view)
}
```

调用：

```js
const htmlStr = render(template, view)
console.log(htmlStr)
```

搞定。到这里，mustache 基础功能已经实现好了。

