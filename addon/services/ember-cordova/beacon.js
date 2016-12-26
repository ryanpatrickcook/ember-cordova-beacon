import Ember from 'ember';

const {
  A,
  Evented,
  RSVP,
  Service,
  inject,
  isPresent,
  isEmpty
} = Ember;

const { Promise } = RSVP;

export default Service.extend(Evented, {
  cordova: inject.service('cordova'),
  beacons: A(),
  _locationManager: null,
  _delegate: null,

  locationManager() {
    if (this._locationManager) {
      return Promise.resolve(this._locationManager);
    }

    return this.get('cordova').ready().then(() => {
      this._locationManager = cordova.plugins.locationManager;
      this._delegate = new this._locationManager.Delegate();
      this.setup();
      return this._locationManager;
    });
  },

  setup() {
    this._delegate.didDetermineStateForRegion = function(pluginResult) {
      let { uuid, major, minor } = pluginResult.region;
      let beacon = this._selectBeacon(uuid, major, minor);
      this.trigger('didDetermineStateForRegion', beacon, pluginResult);
    }.bind(this);

    this._delegate.didStartMonitoringForRegion = function(pluginResult) {
      let { uuid, major, minor } = pluginResult.region;
      let beacon = this._selectBeacon(uuid, major, minor);
      this.trigger('didStartMonitoringForRegion', beacon, pluginResult);
    }.bind(this);

    this._delegate.didEnterRegion = function(pluginResult) {
      let { uuid, major, minor } = pluginResult.region;
      let beacon = this._selectBeacon(uuid, major, minor);
      this.trigger('didEnterRegion', beacon, pluginResult);
    }.bind(this);

    this._delegate.didExitRegion = function(pluginResult) {
      let { uuid, major, minor } = pluginResult.region;
      let beacon = this._selectBeacon(uuid, major, minor);
      this.trigger('didExitRegion', beacon, pluginResult);
    }.bind(this);

    this._delegate.didRangeBeaconsInRegion = function(pluginResult) {
      for (let i = 0; i < pluginResult.beacons.length; i++) {
        let beacon = pluginResult.beacons[i];
        this._updateBeacon(beacon);
        this.trigger('didRangeBeaconInRegion', beacon);
      }
    }.bind(this);

    this._locationManager.setDelegate(this._delegate);

    // required in iOS 8+
    this._locationManager.requestWhenInUseAuthorization();
  },

  getMonitoredRegions() {
    return this.locationManager().then(lm => {
      return lm.getMonitoredRegions();
    });
  },

  startMonitoringBeacon(identifier, uuid, major, minor) {
    return this.locationManager().then(lm => {
      let beacon = this._addBeacon(identifier, uuid, major, minor);
      beacon = beacon || {};
      return lm.startMonitoringForRegion(beacon.region).then(() => {
        return beacon;
      });
    }.bind(this));
  },

  stopMonitoringBeacon(uuid, major, minor) {
    return this.locationManager().then(lm => {
      let beacon = this._selectBeacon(uuid, major, minor);
      beacon = beacon || {};
      return lm.stopMonitoringForRegion(beacon.region).then(() => {
        return beacon;
      });
    }.bind(this));
  },

  stopMonitoringBeacons(beacons) {
    var beaconsToStop = isPresent(beacons) ? beacons : this.get('beacons');

    return this.locationManager().then(lm => {
      let promises = A();
      beaconsToStop.forEach(beacon => {
        let { uuid, major, minor } = beacon;
        promises.pushObject(this.stopMonitoringBeacon(uuid, major, minor));
      });

      return Promise.all(promises);
    });
  },

  startRangingBeacon(identifier, uuid, major, minor) {
    return this.locationManager().then(lm => {
      let beacon = this._addBeacon(identifier, uuid, major, minor);
      beacon = beacon || {};
      return lm.startRangingBeaconsInRegion(beacon.region).then(() => {
        return beacon;
      });
    }.bind(this));
  },

  stopRangingBeacon(uuid, major, minor) {
    return this.locationManager().then(lm => {
      let beacon = this._selectBeacon(uuid, major, minor);
      beacon = beacon || {};
      return lm.stopRangingBeaconsInRegion(beacon.region).then(() => {
        return beacon;
      });
    }.bind(this));
  },

  stopRangingBeacons(beacons) {
    var beaconsToStop = isPresent(beacons) ? beacons : this.get('beacons');

    return this.locationManager().then(lm => {
      let promises = A();
      beaconsToStop.forEach(beacon => {
        let { uuid, major, minor } = beacon;
        promises.pushObject(this.stopRangingBeacon(uuid, major, minor));
      });

      return Promise.all(promises);
    });
  },

  getRange(txCalibratedPower, rssi) {
    var ratioDb = txCalibratedPower - rssi;
    var ratioLinear = Math.pow(10, ratioDb / 10);
    var r = Math.sqrt(ratioLinear);
    return r;
  },

  getProximity(range) {
    var name = 'unknown';
    if (range < 3) {
      name = 'immediate';
    }
    else if (range < 10) {
      name = 'near';
    }
    else if (range < 30) {
      name = 'far';
    }
    return name;
  },

  _addBeacon(identifier, uuid, major, minor) {
    let currentBeacon = this._selectBeacon(uuid, major, minor);
    if (currentBeacon) {
      return currentBeacon;
    }

    let beaconRegion = new this._locationManager.BeaconRegion(identifier, uuid, major, minor);

    let beacon = Ember.Object.create({
      identifier: identifier,
      uuid: uuid,
      major: major,
      minor: minor,
      region: beaconRegion,
      accuracy: 0,
      rssi: 0,
    });

    this.get('beacons').pushObject(beacon);
    return beacon;
  },

  _updateBeacon(beacon) {
    let beacons = this._selectBeacons(beacon.uuid, beacon.major, beacon.minor);
    beacons.forEach(item => {
      item.set('accuracy', beacon.accuracy);
      item.set('rssi', beacon.rssi);

      let range = this.getRange(-59, beacon.rssi);
      item.set('range', range);

      let rangeSet = item.get('rangeSet') || [];
      rangeSet.pushObject(range);

      if (isEmpty(item.get('proximity')) || rangeSet.length >= 10) {
        var sum = rangeSet.reduce(function(a, b) { return a + b; });
        var avgRange = sum / rangeSet.length;

        item.set('rangeSet', []);
        item.set('proximity', this.getProximity(avgRange));
      }
    });
  },

  _selectBeacons(uuid, major, minor) {
    return this.get('beacons').filter(item => {
      return (uuid === item.uuid) && (major === item.major) && (minor === item.minor);
    });
  },

  _selectBeacon(uuid, major, minor) {
    let existingBeacons = this._selectBeacons(uuid, major, minor);
    return existingBeacons.get('firstObject');
  },

  appendToDeviceLog(message) {
    this.locationManager().then(lm => {
      lm.appendToDeviceLog(message);
    }.bind(this));
  },

  logToDom(message) {
    var e = document.createElement('label');
    e.innerText = message;

    document.body.appendChild(e);
    document.body.appendChild(document.createElement('br'));
    document.body.appendChild(document.createElement('br'));

    window.scrollTo(0, window.document.height);
  }
});
