import defineReactive from './src/defineReactive'
import Observer from './src/Observer'

var obj = {
  a: {
    b: {}
  },
  m: 20
}

// defineReactive(obj)



function observe(value) {
  if (typeof value !== 'object') return

  var ob
  if (typeof value.__ob__ !== 'undefined') {
    ob = value.__ob__
  } else {
    ob = new Observer(value)
  }

  return ob
}


observe(obj)

console.log(obj)
obj.a.b.c = 20
// obj.a.b.c.d = 40
console.log(obj)