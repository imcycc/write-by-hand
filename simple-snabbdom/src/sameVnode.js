
export default function sameVnode (vnode1, vnode2) {
  return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel
}