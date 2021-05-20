import { def } from './utils'
import defineReactive from './defineReactive'

export default class Observer {
  constructor(value) {
    this.value = value

    def(value, '__ob__', this, false)
    this.walk(value)
  }

  walk(value) {
    for (let k in value) {
      defineReactive(value, k)
    }
  }
}