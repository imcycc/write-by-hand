import createElm from './createElm'
import updateChildren from './updateChildren'

export default function patchVnode (oldVnode, newVnode) {
  const elm = newVnode.elm = oldVnode.elm
  const oldCh = oldVnode.children
  const newCh = newVnode.children

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