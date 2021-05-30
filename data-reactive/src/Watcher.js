import Dep from "./Dep";

let uid = 0;
export default class Watcher {
  constructor(vm, exp, cb) {
    this.id = uid++;
    this.vm = vm;
    this.cb = cb;
    this.getter = parsePath(exp);

    this.deps = [];
    this.newDeps = [];
    this.depIds = new Set();
    this.newDepIds = new Set();

    this.value = this.get();
  }

  get() {
    Dep.target = this;
    let value;
    try {
      value = this.getter(this.vm);
    } finally {
      this.cleanupDep();
      Dep.target = undefined;
    }
  }

  addDep(dep) {
    if (!this.newDepIds.has(dep.id)) {
      this.newDeps.push(dep);
      this.newDeps.add(dep.id);
      if (!this.depIds.has(dep.id)) {
        dep.addSub(this);
      }
    }
  }

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

  update() {
    this.run();
  }

  run() {
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