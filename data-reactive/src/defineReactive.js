// 为什么要封装 defineReactive 函数
// 答：getter setter 需要变量周转才能工作 例如下面 temp 变量

// var obj = {};
// var aValue;
// Object.defineProperty(obj, 'a', {
//   // getter
//   get () {
//     return aValue;
//   },
//   // setter
//   set (newValue) {
//     aValue = newValue;
//   }
// })
// obj.a = 1;
// console.log(obj.a)
// obj.a++;
// console.log(obj.a)

import observe from './observe'

/**
 * 定义响应式数据，封装 defineProperty
 * @param {*} data 
 * @param {*} key 
 * @param {*} val 
 */
export default function defineReactive (data, key, val) {
  if (arguments.length === 2) {
    val = data[key]
  }

  // 把 val 变为响应式
  observe(val)

  Object.defineProperty(data, key, {
    // 可枚举
    enumerable: true,
    // 可配置
    configurable: true,
    // getter
    get () {
      return val
    },
    // setter
    set (newValue) {
      if (val === newValue) {
        return
      }
      val = newValue
      // 把新数据变为响应式
      observe(newValue)
    }
  })
}