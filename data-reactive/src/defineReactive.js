// 为什么要封装 defineReactive 函数
// 答：getter setter 需要变量周转才能工作 例如下面 temp 变量

// var obj = {};
// var temp;
// Object.defineProperty(obj, 'a', {
//     // getter
//     get() {
//         return temp;
//     },
//     // setter
//     set(newValue) {
//         temp = newValue;
//     }
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
export default function defineReactive(data, key, val) {
  if (arguments.length === 2) {
    val = data[key]
  }

  let childOb = observe(val)

  Object.defineProperty(data, key, {
    // 可枚举
    enumerable: true,
    // 可配置
    configurable: true,
    // getter
    get() {
      console.log('getter', key, val)
      return val
    },
    // setter
    set(newValue) {
      console.log('setter', key, newValue)
      if (val === newValue) {
        return
      }
      val = newValue
      childOb = observe(newValue)
    }
  })
}