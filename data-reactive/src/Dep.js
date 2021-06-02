
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
