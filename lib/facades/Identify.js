import Facade from './Facade';

export default class Identify extends Facade {
  action() {
    return 'identify';
  }

  userId() {
    return this.obj.userId;
  }
}
