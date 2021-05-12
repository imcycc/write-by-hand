import vnode from './vnode'
import sameVnode from './sameVnode'
import createElm from './createElm'
import patchVnode from './patchVnode'

export default function patch (oldVnode, newVnode) {
  // 如果第一个节点为真实 DOm 节点，将它包装成 vnode
  if (oldVnode.sel === undefined) {
    oldVnode = vnode(oldVnode.tagName.toLowerCase, {}, undefined, undefined, oldVnode)
  }

  if (sameVnode(oldVnode, newVnode)) {
    // 是同一个节点 策略更新
    patchVnode(oldVnode, newVnode)
  } else {
    // 不是同一个节点 暴力插入新节点，删除老节点
    createElm(newVnode)
    oldVnode.elm.parentNode.insertBefore(newVnode.elm, oldVnode.elm)
    oldVnode.elm.remove()
  }

}