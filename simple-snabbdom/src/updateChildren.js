import createElm from './createElm'
import sameVnode from './sameVnode'
import patchVnode from './patchVnode'

export default function updateChildren (parentNode, oldCh, newCh) {
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
    // 删除老children多余的部分
    oldCh.slice(oldStartIdx, oldEndIdx + 1).forEach(ch => {
      ch.elm.remove()
    })
  }

  if (newStartIdx <= newEndIdx) {
    // 添加新children剩余的
    newCh.slice(newStartIdx, newEndIdx + 1).forEach(ch => {
      parentNode.insertBefore(createElm(ch), newCh[newEndIdx + 1]?.elm)
    })
  }

}




