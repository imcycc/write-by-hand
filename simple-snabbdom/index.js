import h from './src/h'
import patch from './src/patch'

var container = document.getElementById('container')

var vnode = h('ul', { key: "ul" }, [
  h('li', { key: "A" }, 'A'),
  h('li', { key: "B" }, 'B'),
  h('li', { key: "C" }, 'C'),
])

var vnode1 = h('ul', { key: "ul1" }, [
  h('li', { key: "A" }, 'A'),
  h('li', { key: "B" }, 'B'),
  h('li', { key: "C" }, 'C'),
])

var vnode2 = h('ul', { key: "ul" }, [
  h('li', { key: "A" }, 'A'),
  h('li', { key: "B" }, 'B'),
  h('li', { key: "C" }, 'C'),
  h('li', { key: "D" }, 'D'),
  h('li', { key: "E" }, 'E'),
])

var vnode3 = h('ul', { key: "ul" }, [
  h('li', { key: "A" }, 'A'),
  h('li', { key: "C" }, 'C'),
])

var vnode4 = h('ul', { key: "ul" }, [
  h('li', { key: "D" }, 'D'),
  h('li', { key: "A" }, 'A'),
  h('li', { key: "C" }, 'C'),
  h('li', { key: "E" }, 'E'),
  h('li', { key: "F" }, 'F'),
  h('li', { key: "G" }, 'G'),
  h('li', { key: "B" }, 'B'),
])

patch(container, vnode)

document.getElementById('btn').onclick = function () {
  f4()
}

// 暴力删除
function f1() {
  patch(vnode, vnode1)
}

// 新节点添加
function f2() {
  patch(vnode, vnode2)
}

// 旧节点删除
function f3() {
  patch(vnode, vnode3)
}

// 随意修改
function f4() {
  patch(vnode, vnode4)
}
 