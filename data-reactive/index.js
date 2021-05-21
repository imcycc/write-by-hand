import observer from './src/observe'

var obj = {
  a: {
    b: 10
  },
  arr: [
    { id: 1, name: '111' },
    { id: 2, name: '222' },
    { id: 3, name: '333' },
  ]
}

observer(obj)
obj.a.b = 20
console.log(obj)


// 设置新属性
obj.a.c = 30
console.log(obj)

