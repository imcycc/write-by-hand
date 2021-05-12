# 实现一个简易版的 snabbdom

官方描述：A virtual DOM library with focus on simplicity, modularity, powerful features and performance.

官方 demo 中，使用 h 函数创建虚拟 DOM，使用 patch 函数更新到视图。

```js
import {
  init,
  classModule,
  propsModule,
  styleModule,
  eventListenersModule,
  h,
} from "snabbdom";

const patch = init([
  // Init patch function with chosen modules
  classModule, // makes it easy to toggle classes
  propsModule, // for setting properties on DOM elements
  styleModule, // handles styling on elements with support for animations
  eventListenersModule, // attaches event listeners
]);

const container = document.getElementById("container");

const vnode = h("div#container.two.classes", { on: { click: someFn } }, [
  h("span", { style: { fontWeight: "bold" } }, "This is bold"),
  " and this is just normal text",
  h("a", { props: { href: "/foo" } }, "I'll take you places!"),
]);
// Patch into empty DOM element – this modifies the DOM as a side effect
patch(container, vnode);

const newVnode = h(
  "div#container.two.classes",
  { on: { click: anotherEventHandler } },
  [
    h(
      "span",
      { style: { fontWeight: "normal", fontStyle: "italic" } },
      "This is now italic type"
    ),
    " and this is still just normal text",
    h("a", { props: { href: "/bar" } }, "I'll take you places!"),
  ]
);
// Second `patch` invocation
patch(vnode, newVnode); // Snabbdom efficiently updates the old view to the new state
```

## 简易版实现

### h: 快捷创建虚拟 DOM 节点

源码中 h 函数支持四种传参方式，通过判断参数类型、替换，实现了多态。简易版只简单判断第三个参数的类型，返回 Vnode。

children 和 text 用于渲染，children 优先于 text。此函数返回的 children 和 text 也有可能同时为空，代表空标签。

children.length === 0 会返回 undefined，方便后续节点判断。

```js
/**
 * 创建虚拟 DOM 节点
 * @param {String} sel 标签名
 * @param {Object} data key、标签属性等
 * @param {Vnode[] | String | Vnode} c text 或 children
 * @returns Vnode
 */
function h (sel, data, c) {
  let children, text
  if (Array.isArray(c) && c.length > 0) {
    children = c
  } else if (typeof c === 'string' || typeof c === 'number') {
    text = c
  } else if (c && c.sel) {
    children = [c]
  }

  return vnode(sel, data, children, text, undefined)
}
```

### vnode: 整合入参，返回 Vnode 对象

Vnode 类型 是虚拟 DOM 的类型

```js
/**
 * 
 * @param {*} sel 标签名
 * @param {*} data key、标签属性等
 * @param {*} children 子节点
 * @param {*} text 标签内文本
 * @param {*} elm 真实节点
 * @returns Vnode
 */
function vnode (sel, data, children, text, elm) {
  const key = data.key
  return { sel, data, children, text, elm, key }
}
```

### patch: 更新入口函数

patch 函数接收 oldVnode 和 newVnode，如果不是同一个节点，使用 createElm 函数创建真实 DOM 并插入对应位置，如果是同一个节点，则调用 patchVnode 对比更新。

```js
function patch (oldVnode, newVnode) {
  // 如果第一个节点为真实 DOm 节点，将它包装成 vnode
  if (oldVnode.sel === undefined) {
    oldVnode = vnode(oldVnode.tagName.toLowerCase, {}, undefined, undefined, oldVnode)
  }

  if (isSameVnode(oldVnode, newVnode)) {
    // 是同一个节点 对比更新
    patchVnode(oldVnode, newVnode)
  } else {
    // 不是同一个节点 暴力插入新节点，删除老节点
    createElm(newVnode)
    oldVnode.elm.parentNode.insertBefore(newVnode.elm, oldVnode.elm)
    oldVnode.elm.remove()
  }

}
```

### sameVnode: 判断两个 vnode 是否为同一个节点

判断 sel 和 key 是否相同。源码中还判断了 vnode.data.is 是否相同，简易版不做判断。

```js
function sameVnode (vnode1, vnode2) {
  return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel
}
```

### createElm: 创建真实 DOM 节点

优先渲染 children，其次渲染 text。

```js
/**
 * 创建真实 DOM 节点
 * @param {*} vnode 
 * @returns element
 */
function createElm (vnode) {
  const elm = vnode.elm = document.createElement(vnode.sel)

  if (vnode.children && vnode.children.length > 0) {
    vnode.children.forEach(ch => {
      elm.append(createElm(ch))
    })
  } else if (vnode.text !== undefined) {
    elm.innerText = vnode.text
  }

  return vnode.elm
}
```

### patchVnode: 更新相同的 vnode

如果两个 vnode 相似，则判断新老 vnode 的 children 和 text 进行更新。更新过程中，children 优先于 text。

源码中 patchVnode 新老 vnode 的对比判断更加优雅，但是难以理解。下面判断先后顺序做了调整，以 newVnode 为主导（因为 newVnode 决定 oldVnode 如何渲染，例如 newVnode 如果为 text， 只需将 oldVnode 的节点暴力替换，不需要关心 oldVnode 是 children 还是 text）。

如果 oldVnode.children 和 newVnode.children 都有值，则调用 updateChildren 函数更新，diff算法就在此阶段，也是最难的一个函数。

```js
function patchVnode (oldVnode, newVnode) {
  const elm = newVnode.elm = oldVnode.elm
  const oldCh = oldVnode.children
  const newCh = newVnode.children

  // newVnode 没有 children 也没有 text ，是空标签
  if (newCh === undefined && newVnode.text === undefined) {
    elm.innerHTML = null
    return;
  }

  if (newCh !== undefined) {
    if (oldCh !== undefined) {
      updateChildren(elm, oldCh, newCh)
    } else {
      elm.innerHTML = null
      elm.append(createElm(ch))
    }
  } else {
    if (newVnode.text !== oldVnode.text) {
      elm.innerHTML = newVnode.text
    }
  }

}

```

**注意**：<code>const elm = newVnode.elm = oldVnode.elm</code> 对比渲染前将 旧的真实 DOM 赋值给了 新的 vnode。使 newVnode 也有了真实 DOM。

### updateChildren: 更新 children

updateChildren 是最后一个函数，也是最复杂的一个函数。

虚拟 DOM 的 diff 算法的核心是四个指针：旧前、旧后、新前和新后。

实现是 循环按下列顺序对比并移动指针，如果指针交叉，则停止循环。

* 旧前 和 新前
* 旧后 和 新后
* 旧前 和 新后
* 旧后 和 新前
* 新前 在旧列表中找的到或者找不到

雏形如下（仅描述了指针的移动方向）：

```js
function updateChildren (oldCh, newCh) {
  let oldStartIdx = 0
  let oldEndIdx = oldCh.length - 1
  let newStartIdx = 0
  let newEndIdx = newCh.length - 1

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (sameVnode(oldCh[oldStartIdx], newCh[newStartIdx])) {
      ++oldStartIdx
      ++newStartIdx
    } else if (sameVnode(oldCh[oldEndIdx], newCh[newEndIdx])) {
      --oldEndIdx
      --newEndIdx
    } else if (sameVnode(oldCh[oldStartIdx], newCh[newEndIdx])) {
      ++oldStartIdx
      --newEndIdx
    } else if (sameVnode(oldCh[oldEndIdx], newCh[newStartIdx])) {
      --oldEndIdx
      ++newStartIdx
    } else {
      ++newStartIdx
    }
  }

}
```

然后加上更新逻辑：

循环如下

1. 旧前 和 新前 匹配到，将 新前 更新到 旧前
2. 旧后 和 新后 匹配到，将 新后 更新到 旧后
3. 旧前 和 新后 匹配到，将 新后 更新到 旧前，将 旧前 的真实节点插入到 旧后 的后面
4. 旧后 和 新前 匹配到，将 新前 更新到 旧后，将 旧后 的真实节点插入到 旧前 的前面
5. 在旧中找到 新前，将 新前 更新到找到的旧中，将 找到的旧 的真是节点插入到 旧前 的前面，将找到的旧重置为 undefined
6. 在旧中找不到 新前，创建 新前真实节点并插入到 旧前 的前面

因为循环中会把节点重置成 undefined，所以需要判断遇到 undefined 则跳过。

节省内存提取变量，将 oldCh[oldStartIdx] 提取为 oldStartVnode 等四个 vnode。

循环结束后

* 如果 旧 有剩余，说明剩余是多余节点，需要删除。（旧 有剩余说明：新全部查找或添加完毕）
* 如果 新 有剩余，说明剩余是连续新节点，需要循环添加至 新列表 新旧 的下一个指针对应的真实 DOM 的前面。（新 有剩余说明：旧节点全部在 新 中找到）

实现如下：

```js
function updateChildren (parentNode, oldCh, newCh) {
  let oldStartIdx = 0
  let oldEndIdx = oldCh.length - 1
  let newStartIdx = 0
  let newEndIdx = newCh.length - 1
  let oldStartVnode = oldCh[oldStartIdx]
  let oldEndVnode = oldCh[oldEndIdx]
  let newStartVnode = newCh[newStartIdx]
  let newEndVnode = newCh[newEndIdx]

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (oldStartVnode === undefined) {
      oldStartVnode = oldCh[++oldStartIdx]
    } else if (newStartVnode === undefined) {
      newStartVnode = newCh[++newStartIdx]
    } else if (oldEndVnode === undefined) {
      oldEndVnode = oldCh[--oldEndIdx]
    } else if (newEndVnode === undefined) {
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode)
      oldStartVnode = oldCh[++oldStartIdx]
      newStartVnode = newCh[++newStartIdx]
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode)
      oldEndVnode = oldCh[--oldEndIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      patchVnode(oldStartVnode, newEndVnode)
      parentNode.insertBefore(oldStartVnode.elm, oldEndVnode.elm.nextSibling)
      oldStartVnode = oldCh[++oldStartIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      patchVnode(oldEndVnode, newStartVnode)
      parentNode.insertBefore(oldEndVnode.elm, oldStartVnode.elm)
      oldEndVnode = oldCh[--oldEndIdx]
      newStartVnode = newCh[++newStartIdx]
    } else {
      var idx = oldCh.findIndex(ch => sameVnode(ch, newStartVnode))
      if (idx > -1) {
        parentNode.insertBefore(oldCh[idx].elm, oldStartVnode.elm)
        oldCh[idx] = undefined
      } else {
        parentNode.insertBefore(createElm(newStartVnode), oldStartVnode.elm)
      }
      newStartVnode = newCh[++newStartIdx]
    }
  }

  if (oldStartIdx <= oldEndIdx) {
    // 删除 老 多余的部分
    oldCh.slice(oldStartIdx, oldEndIdx + 1).forEach(ch => {
      ch.elm.remove()
    })
  }

  if (newStartIdx <= newEndIdx) {
    // 添加 新 剩余的
    newCh.slice(newStartIdx, newEndIdx + 1).forEach(ch => {
      parentNode.insertBefore(createElm(ch), newCh[newEndIdx + 1]?.elm)
    })
  }

}
```

**注意**：最后一步添加新， 使用 newCh[newEndIdx + 1]?.elm 是因为 patchVnode 把 newVnode.elm = oldVnode.elm


### 测试

页面上放个 id 为 btn 的按钮，和 id 为 container 的 div。

```js
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
  f1()
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
```