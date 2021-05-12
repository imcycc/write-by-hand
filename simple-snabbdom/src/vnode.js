
/**
 * 
 * @param {*} sel 标签名
 * @param {*} data key、标签属性等
 * @param {*} children 子节点
 * @param {*} text 标签内文本
 * @param {*} elm 真实节点
 * @returns Vnode
 */
export default function vnode (sel, data, children, text, elm) {
  const key = data.key
  return { sel, data, children, text, elm, key }
}