import Dep from "./Dep";

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