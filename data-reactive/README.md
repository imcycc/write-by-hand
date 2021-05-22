# 深入 Vue 响应式原理 - 数据处理

众所周知，Vue 最独特的特性之一，是其非侵入性的响应式系统。数据模型仅仅是普通的 JavaScript 对象。而当你修改它们时，视图会进行更新。

接下来，在本文中，我们将**介绍** Vue 如何追踪变化，以及**实现**响应式数据。

## 如何追踪变化

当你把一个普通的 JavaScript 对象传入 Vue 实例作为 data 选项，Vue 将遍历此对象所有的 property，并使用 Object.defineProperty 把这些 property 全部转为 getter/setter。

### 何为 Object.defineProperty

[Object.defineProperty()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) 方法会直接在一个对象上定义一个新属性，或者修改一个对象的现有属性，并返回此对象。

例如把 obj 的 a 属性转为 getter/setter：

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

如果获取 a 属性，就会调用 get 方法；如果修改 a 属性，就会调用 set 方法。 修改并打印 a 属性如下：

```js
obj.a = 10
console.log(obj.a)

// ---控制台会出现----

// 设置a属性10
// 获取a属性
// 10
```

根据上面代码，我们可以看到，Object.defineProperty 需要变量周转才能工作（aValue 变量），使用起来很不方便。在 Vue 源码中，被封装成 defineReactive 函数。

### 封装好用的 defineReactive 函数

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

然后我们来遍历处理对象的每一个属性。

## 递归侦测对象全部属性

具体实现涉及到 两个函数 和 一个类，他们之间循环调用，大概流程如下：

* observe 函数：如果没有 \_\_ob\_\_ </code>，调用构造函数 Observer；
* Observer 类：实例赋值给对象的 \_\_ob\_\_ ；如果是数组，便利循环调用 observe ；如果是对象，便利属性循环调用 defineReactive；
* defineReactive 函数：设置属性的 get 、 set ，用值调用 observe。

\_\_ob\_\_ 是 Observer 构造函数的实例，可以标识对象是否被响应式处理过。

### observe 入口函数

源码中，只需要 observe(obj)，obj 就会被处理为响应式数据。

observe 是入口函数，只需要 observe(obj) ，obj 就变成了了响应式数据。

```js
function observe (value) {
  if (typeof value !== 'object') return

  if (typeof value.__ob__ === 'undefined') {
    new Observer(value)
  }
}
```

### Observer 构造器

Observer 构造器执行时候把实例指向了传入 value 的 \_\_ob\_\_ ，且 \_\_ob\_\_ 是不可枚举的。

```js
class Observer {
  constructor(value) {
    this.value = value

    // 给 value 设置 __ob__ 不可枚举属性，构造函数中的 this 指的是构造函数的实例，实际是把 Observer 构造出的对象赋值给了 value
    def(value, '__ob__', this, false)

    this.walk(value)
  }

  // 处理对象
  walk (value) {
    for (let k in value) {
      defineReactive(value, k)
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

### defineReactive 调用 observe

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

## 数组的响应式处理

对象的属性类型可能是数组，需要特殊处理。

在 Observer 类的 constructor 中添加判断，如果是数组，就调用 observeArray 方法，并在 Observer 中添加新方法 observeArray。

```js
// 处理数组
observeArray (value) {
  for (let i = 0; i < value.length; i++) {
    observe(value[i])
  }
}
```

现在，数组中如果有对象，对象也会变为响应式。但是，数组本身的修改却没有被监听到。

**在 Vue 中，数组的直接修改是不会被监听的，但数组方法的调用会被间听到。因为 Vue 对数组的 7 个方法进行了重写。**

```js
// 模板
<div v-for="item in arr">{{item}}</div>

// data
arr: ['1']

// 这种方式视图不会更新
this.arr[0] = '1111'
// 这种方式视图会更新
this.arr.push('2')
```

### 重写数组的 7 个方法

重写的七个方法分别是 push、pop、shift、unshift、splice、sort、reverse。在方法执行结束后，会触发视图更新的动作。

其中 push、unshift、splice 方法新插入的元素会被响应式处理。

```js
var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);

var methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];

methodsToPatch.forEach(function (method) {
  var original = arrayProto[method];
  def(arrayMethods, method, function mutator() {
    var result = original.apply(this, args);
    var ob = this.__ob__;
    var inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = [...arguments];
        break
      case 'splice':
        inserted = [...arguments].slice(2);
        break
    }
    if (inserted) { ob.observeArray(inserted); }
    // ... 此处更新视图
    return result
  });
});
```

在 Observer 类的 constructor 中添加判断如果是数组，就把 value.\_\_proto\_\_ = arrayMethods 。

## 整体实现

```js
var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);

var methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];

methodsToPatch.forEach(function (method) {
  var original = arrayProto[method];
  def(arrayMethods, method, function mutator() {
    var result = original.apply(this, args);
    var ob = this.__ob__;
    var inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = [...arguments];
        break
      case 'splice':
        inserted = [...arguments].slice(2);
        break
    }
    if (inserted) { ob.observeArray(inserted); }
    // ... 此处更新视图
    return result
  });
});


// 给对象添加是否可枚举的属性
function def(obj, key, value, enumerable) {
  Object.defineProperty(obj, key, {
    value,
    enumerable,
    writable: true,
    configurable: true,
  })
}


class Observer {
  constructor(value) {
    this.value = value

    // 给 value 设置 __ob__ 不可枚举属性，构造函数中的 this 指的是构造函数的实例，实际是把 Observer 构造出的对象赋值给了 value
    def(value, '__ob__', this, false)

    if (Array.isArray(value)) {
      value.__proto__ = arrayMethods
      this.observeArray(value)
    } else {
      this.walk(value)
    }

  }

  // 处理对象
  walk(value) {
    for (let k in value) {
      defineReactive(value, k)
    }
  }

  // 处理数组
  observeArray(value) {
    for (let i = 0; i < value.length; i++) {
      observe(value[i])
    }
  }
}


// 添加响应式属性，封装 defineProperty
function defineReactive(data, key, val) {
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
    get() {
      return val
    },
    // setter
    set(newValue) {
      if (val === newValue) {
        return
      }
      val = newValue
      // 把新数据变为响应式
      observe(newValue)
    }
  })
}


function observe(value) {
  if (typeof value !== 'object') return

  var ob
  if (typeof value.__ob__ !== 'undefined') {
    ob = value.__ob__
  } else {
    ob = new Observer(value)
  }

  return ob
}

```

### 测试用例

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

## Vue 不能检测数组和对象的变化

代码已经完成，通过代码可以看出，Vue 只能监听到对象属性的变化、数组方法的调用，并不能检测到数组和对象的变化。例如：

```html
<!-- emplate -->
<div>
  <div>{{obj.a}}</div>
  <div>{{arr[0]}}</div>
</div>
```

```js
// data
data() {
  return {
    obj: {},
    arr: ['1']
  }
}

// 视图不改变，obj 的 a 属性并没有 getter/setter
this.obj.a = 1
// 视图不改变，无法检测数组的直接修改
this.arr[0] = '2'
```

在开发时候应该注意修改方式。可以使用 Vue 提供的 this.$set 进行修改，$set 方法实际也是调用了 defineReactive 重新绑定新的属性。
