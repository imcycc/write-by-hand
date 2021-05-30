# 深入 Vue 响应式原理 - 依赖收集

上一篇讲了如何处理数据，递归给数据设置 getter/setter ，这一篇讲如何依赖收集和通知。

## 何为依赖

需要用到数据的地方，叫做依赖。

每个组件实例都对应一个 watcher 实例，它会在组件渲染的过程中把“接触”过的数据 property 记录为**依赖**。之后当依赖项的 setter 触发时，会通知 watcher，从而使它关联的组件重新渲染。

<img style="width: 500px;" src="http://storage.icyc.cc/p/a20dea5ebee9a98b.png" />

当我们使用 $watch api 监听数据变化时，也会创建一个 watcher 实例，和上述的组件 watcher 实例一块儿存放在 dep 实例的 dep.subs 中。

## Watcher 类和 Dep 类

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

观察者解析表达式，收集依赖项，并在表达式值更改时激发回调。它用于 $watch() api和指令。

### Dep






