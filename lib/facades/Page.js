import Facade from './Facade';
import Track from './Track';

export default class Page extends Facade {
  category() {
    return this.fields.category;
  }

  name() {
    return this.fields.name;
  }

  /**
   * Get the facade's action.
   *
   * @return {string}
   */
  type() {
    return 'page';
  }

  /**
   * Get the page fullName.
   *
   * @return {string}
   */
  fullName() {
    var category = this.category();
    var name = this.name();
    return name && category ? category + ' ' + name : name;
  }

  /**
   * Convert this Page to a Track facade with `name`.
   *
   * @param {string} name
   * @return {Track}
   */
  track(name) {
    var json = this.json();
    json.event = this.event(name);
    json.timestamp = this.timestamp();
    json.properties = this.properties();
    return new Track(json, this.opts);
  }
}
