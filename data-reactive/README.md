# 数据响应式

响应式数据的实现原理是重写 对象 的 getter 和 setter，当对象的属性读取或修改的时候，就可以做自定义的操作。

这篇文章主要讨论如何让对象变为响应式，也是 vue 源码数据响应式的实现原理。

## 响应式原理

[Object.defineProperty()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) 方法会直接在一个对象上定义一个新属性，或者修改一个对象的现有属性，并返回此对象。

用 defineProperty 设置 obj 的 a 属性，设置 getter 和 setter ：

```js
var obj = {};
var aValue;
Object.defineProperty(obj, 'a', {
  // getter
  get () {
    console.log('获取a属性');
    return aValue;
  },
  // setter
  set (newValue) {
    console.log('设置a属性' + newValue);
    aValue = newValue;
  }
})
```

修改并打印 a 属性：

```js
obj.a = 10
console.log(obj.a)

// ---控制台会出现----

// 设置a属性10
// 获取a属性
// 10
```

Object.defineProperty 需要变量周转才能工作，例如上边的 aValue 变量，使用起来不方便，所以把它封装成一个函数：

### defineReactive

defineReactive 利用了闭包的特性， val 作为周转的变量。

```js
function defineReactive (data, key, val) {
  if (arguments.length === 2) {
    val = data[key]
  }

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
    }
  })
}
```

下面我们就用这个原理，递归设置每个属性的 getter 和 setter，实现响应式。

## 实现响应式

上面的 defineReactive 函数只实现了给一个属性添加响应式。

实现整个对象响应式主要涉及到 两个函数 和 一个类，他们之间循环调用，大概流程如下：

* observe ：如果没有 __ob__ ，调用构造函数 Observer
* Observer ：实例赋值给对象的 __ob__ ；如果是数组，便利循环调用 observe ；如果是对象，便利属性循环调用 defineReactive
* defineReactive ：设置属性的 get 、 set ，用值调用 observe

__ob__ 是 Observer 构造函数的实例，可以标识对象是否被响应式处理过。

### observe

observe 是入口函数，只需要 observe(obj) ，obj 就变成了了响应式数据。

```js
function observe (value) {
  if (typeof value !== 'object') return

  if (typeof value.__ob__ === 'undefined') {
    new Observer(value)
  }
}
```


### Observer

Observer 构造器执行时候把实例指向了传入 value 的 __ob__ ，且 __ob__ 是不可枚举的。

```js
class Observer {
  constructor(value) {
    this.value = value

    // 给 value 设置 __ob__ 不可枚举属性，构造函数中的 this 指的是构造函数的实例，实际是把 Observer 构造出的对象赋值给了 value
    def(value, '__ob__', this, false)

    if (Array.isArray(value)) {
      this.observeArray(value)
    } else {
      this.walk(value)
    }

  }

  // 处理对象
  walk (value) {
    for (let k in value) {
      defineReactive(value, k)
    }
  }

  // 处理数组
  observeArray (value) {
    for (let i = 0; i < value.length; i++) {
      observe(value[i])
    }
  }
}

// 给对象添加是否可枚举的属性
function def (obj, key, value, enumerable) {
  Object.defineProperty(obj, key, {
    value,
    enumerable,
    writable: true,
    configurable: true,
  })
}
```

### defineReactive

Observer 的 walk 调用了 defineReactive ，把每一个属性变为响应式，每一个属性值也调用 observe 函数，也就是把下一层也变为响应式，这就实现了整个对象的响应式。当然，新值 set 的时候也需要调用一下 observe 函数。

上面的 defineReactive 添加调用 observe 。

```js
defineReactive (data, key, val) {
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
```

然后测试一下

```js
var obj = {
  a: {
    b: 10
  },
  arr: [
    { id: 1, name: '111' },
    { id: 2, name: '222' },
    { id: 3, name: '333' },
  ]
}

observer(obj)
obj.a.b = 20
console.log(obj)
```

我们看到了 obj 变为了响应式。

然而我们发现了一个问题， obj.a.c = 30 ，c 属性并没有变成响应式。（可以在 get set 方法中打印验证）

原因是什么呢？ obj.a.b 的 b 属性是原本就存在的，赋值时候可以被监听到，c 属性是新的属性，并没有 get 和 set 方法。

所以，**如果要添加新属性，需要用 defineReactive 添加，即 defineReactive(obj.a, 'c', 30) ，我们 vue 中常用的 $set 方法本质也是调用的 defineReactive** 。
