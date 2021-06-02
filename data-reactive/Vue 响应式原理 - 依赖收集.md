# 深入 Vue 响应式原理 - 依赖收集

上一篇讲了如何处理数据，递归给数据设置 getter/setter ，这一篇讲如何依赖收集和通知。

[github](https://github.com/imcycc/write-by-hand/tree/main/data-reactive)

## 何为依赖

需要用到数据的地方，叫做依赖。

每个组件实例都对应一个 watcher 实例，它会在组件渲染的过程中把“接触”过的数据 property 记录为**依赖**。之后当依赖项的 setter 触发时，会通知 watcher，从而使它关联的组件重新渲染。

<img style="width: 500px;" src="http://storage.icyc.cc/p/a20dea5ebee9a98b.png" />

当我们使用 $watch api 监听数据变化时，也会创建一个 watcher 实例，和上述的组件 watcher 实例一块儿存放在 dep 实例的 dep.subs 中。

## 如何收集和通知

模板绑定数据 或 $watcher 都会调用一次 new Watcher() 构造函数， Watcher 的 constructor 会获取当前 获取一次当前绑定的数据， 例如 obj.a.b.c ，则每一次获取属性，都会调用 getter 方法。在 getter 方法里，调用 dep.depend 收集 watcher。当属性改变时候，则调用 dep.notify 通知 watcher 。

defineReactive 添加 dep ：

```js
function defineReactive(data, key, val) {
  const dep = new Dep();
  if (arguments.length === 2) {
    val = data[key];
  }

  // 把 val 变为响应式
  let childOb = observe(val);

  Object.defineProperty(data, key, {
    // 可枚举
    enumerable: true,
    // 可配置
    configurable: true,
    // getter
    get() {
      if (Dep.target) {
        // 闭包中的 dep 添加依赖，收集 watcher
        dep.depend();
        if (childOb) {
          // data 对象中的 dep 添加依赖，收集 watcher
          childOb.dep.depend();
        }
      }
      return val;
    },
    // setter
    set(newValue) {
      if (val === newValue) {
        return;
      }
      val = newValue;
      // 把新数据变为响应式
      childOb = observe(newValue);
      // 通知 watcher
      dep.notify();
    }
  })
}
```

## Watcher 类和 Dep 类

**dep.subs 存放了当前对象或属性的订阅者 watcher 。 watcher.deps 存放了发布者 dep 。**

dep 的作用是管理依赖。watcher 实例化时，对应数据的 getter 会被触发，把当前 watcher 依次放进数据和 defineReactive 的 subs 中；数据 setter 触发时， dep 会通知每一个 subs 中的 watcher 。

Dep 的实例存在于两个地方。一个是 data 中每一个对象的 \_\_ob\_\_.dep ，另一个是 defineReactive 的闭包中。

例如 data 中的 obj 编译后如下：

```js
obj: {
  key1: 1,  // 闭包中存在 dep
  key2: 2,  // 闭包中存在 dep
  __ob__: {  // Observer 实例 （不可枚举）
    dep: {  // Dep 实例
      subs: []  // 存放 Watcher 实例
      ...
    },
    ...
  },
  ...
}
```

### Watcher

观察者解析表达式，收集依赖项，并在表达式值更改时激发回调。它用于 $watch() api 和指令。

Watcher 构造函数的第二个参数是 exp 或 fn ，先来写一个解析 exp 的方法。调用方式为 val = parsePath('a.b.c')(obj) .

```js
function parsePath(path) {
  const segments = path.split('.');
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return;
      obj = obj[segments[i]];
    }
    return obj;
  }
}

var obj = {
  a: {
    b: {
      c: 1,
    }
  }
}
console.log(parsePath('a.b.c')(obj));
// 1
```

Watcher 代码如下

```js
let uid = 0;
export default class Watcher {
  constructor(vm, exp, cb) {
    this.id = uid++;
    this.vm = vm;
    this.cb = cb;
    this.getter = parsePath(exp);

    // deps newDeps depIds newDepIds 记录此次和上次 get 相关的 dep。
    this.deps = [];
    this.newDeps = [];
    this.depIds = new Set();
    this.newDepIds = new Set();

    // 首次收集依赖
    this.value = this.get();
  }

  // 取值 并 收集依赖
  get() {
    // 设置 Dep.target 为当前 watcher 。
    Dep.target = this;
    let value;
    try {
      // defineReactive 中每一次 getter 都会调用 dep.depend 收集依赖。
      value = this.getter(this.vm);
    } finally {
      // 此次收集依赖结束，清除上次 dep 用到而这次没用到的 watcher ，还原 Dep.target。
      this.cleanupDep();
      Dep.target = undefined;
    }
  }

  // 此方法在 dep.depend 中调用，判断防止重复添加 watcher 。
  // 为什么不在 dep.depend 中判断？因为 dep.depend 只能判断 watcher 是否重复，不能判断 watcher 是否不再使用。在 watcher 中 get 方法最后会调用 cleanupDep 清除不再使用的 watcher 。
  addDep(dep) {
    if (!this.newDepIds.has(dep.id)) {
      this.newDeps.push(dep);
      this.newDeps.add(dep.id);
      if (!this.depIds.has(dep.id)) {
        dep.addSub(this);
      }
    }
  }

  // 清除上次 dep 用到而这次没用到的 watcher 。替换为新记录。
  cleanupDep() {
    this.deps.forEach(dep => {
      if (!this.newDepIds.has(dep.id)) {
        dep.remove(this);
      }
    })

    let tem = this.depIds;
    this.depIds = this.newDepIds;
    this.newDepIds = tem;
    this.newDepIds.clear();
    tem = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tem;
    this.newDeps.length = 0;
  }

  // dep.notify 会调用此函数，通知 watcher 数据改变。
  update() {
    this.run();
  }

  run() {
    // 重置依赖
    const value = this.getter(this.vm);
    if (value !== this.value) {
      const oldValue = this.value;
      this.value = value;
      this.cb(value, oldValue);
    }
  }
}
```

### Dep

Dep 类的主要工作是管理 watcher。主要有四个方法：添加、删除、收集、通知。

属性触发 getter 的时候，会调用 depend 方法。

```js
let uid = 0;
export default class Dep {
  constructor() {
    this.id = uid++;

    // watcher 实例
    this.subs = [];
  }

  // 添加 sub
  addSub(sub) {
    this.subs.push(sub);
  }

  // 移除 sub
  removeSub(sub) {
    const index = this.subs.indexOf(sub);
    if (index > -1) {
      this.subs.splice(index, 1);
    }
  }

  // 收集 watcher
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }

  // 通知 watcher
  notify() {
    this.subs.forEach(sub => sub.update());
  }

}
```
