
/**
 * 创建真实 DOM 节点
 * @param {*} vnode 
 * @returns element
 */
export default function createElm (vnode) {
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