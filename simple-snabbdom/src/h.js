import vnode from './vnode'

/**
 * 创建虚拟 DOM 节点
 * @param {String} sel 标签名
 * @param {Object} data key、标签属性等
 * @param {Vnode[] | String | Vnode} c text 或 children
 * @returns Vnode
 */
export default function h (sel, data, c) {
  let children, text
  if (Array.isArray(c) && c.length > 0) {
    children = c
  } else if (typeof c === 'string' || typeof c === 'number') {
    text = c
  } else if (c && c.sel) {
    // 
    children = [c]
  }

  return vnode(sel, data, children, text, undefined)
}
