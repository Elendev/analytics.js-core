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
    return option ? this.options[option] : this.options;
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

  integrations() {
    return this.obj.integrations || this.options();
  }

  enabled(integration) {
    var enabled = true;
    var options = this.integrations();
  
    // Next, check for the integration's existence in 'options' to enable it.
    // If the settings are a boolean, use that, otherwise it should be enabled.
    if (options.hasOwnProperty(integration)) {
      var settings = options[integration];
      if (typeof settings === 'boolean') {
        enabled = settings;
      } else {
        enabled = true;
      }
    }
  
    return !!enabled;
  }
}
