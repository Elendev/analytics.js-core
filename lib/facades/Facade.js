import clone from 'clone';
import traverse from '@segment/isodate-traverse';

export default class Facade {
  constructor(obj, opts) {
    opts = opts || {};
    if (!('clone' in opts)) opts.clone = true;
    if (opts.clone) obj = clone(obj);
    if (!('traverse' in opts)) opts.traverse = true;
    obj.timestamp = new Date();
    if (opts.traverse) traverse(obj);
    this.opts = opts;
    this.obj = obj;

    if (!('options' in obj)) obj.options = {};

    this.properties = obj.properties || {};
  }

  options(integration) {
    const obj = this.obj.options || this.obj.context || {};
    const options = this.opts.clone ? clone(obj) : obj;
    if (!integration) return options;
    if (!this.enabled(integration)) return;
    const integrations = this.integrations();
    return integrations[integration] || options[integration] || {};
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
