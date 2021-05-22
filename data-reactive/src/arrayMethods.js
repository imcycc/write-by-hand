import def from './def'

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

export default methodsToPatch