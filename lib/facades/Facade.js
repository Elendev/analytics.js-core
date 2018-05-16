import clone from '@ndhoule/clone';
import traverse from '@segment/isodate-traverse';
import newDate from 'new-date';

export default class Facade {
  constructor(obj, opts) {
    opts = opts || {};
    if (!('clone' in opts)) opts.clone = true;
    if (opts.clone) obj = clone(obj);
    if (!('traverse' in opts)) opts.traverse = true;
    if (!('timestamp' in obj)) obj.timestamp = new Date();
    else obj.timestamp = newDate(obj.timestamp);
    if (opts.traverse) traverse(obj);
    this.opts = opts;
    this.obj = obj;

    this.properties = obj.properties || {};
    this.options = obj.options || {};
  }

  options(option) {
    return this.options[option];
  }

  properties() {
    return this.properties;
  }

  type() {
    return this.action();
  }

  json() {
    var ret = this.obj;
    if (this.type) ret.type = this.type();
    return ret;
  }
}
