import defineReactive from './defineReactive';
import observe from './observe';
import def from './def';
import Dep from './Dep';

export default class Observer {
  constructor(value) {
    this.value = value;
    this.dep = new Dep();

    // 给 value 设置 __ob__ 不可枚举属性，构造函数中的 this 指的是构造函数的实例，实际是把 Observer 构造出的对象赋值给了 value
    def(value, '__ob__', this);

    if (Array.isArray(value)) {
      value.__proto__ = arrayMethods;
      this.observeArray(value);
    } else {
      this.walk(value);
    }
  }

  // 处理对象
  walk(value) {
    for (let k in value) {
      defineReactive(value, k);
    }
  }

  // 处理数组
  observeArray(value) {
    for (let i = 0; i < value.length; i++) {
      observe(value[i]);
    }
  }
}

let arrayMethods = Object.create(Array.prototype);
let methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'sort',
  'splice',
  'reverce'
];

methodsToPatch.forEach(function (method) {
  const original = arrayMethods[method];

  def(arrayMethods, method, function () {
    const args = [...arguments];
    const result = original.apply(this, args);
    const ob = this.__ob__;

    let inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break;
      case 'splice':
        inserted = args.slice(2);
        break;
    }

    if (inserted) {
      ob.observeArray(inserted);
    }
    ob.dep.notify();

    return result;
  })

})

