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
      this.trigger('didDetermineStateForRegion', pluginResult);
    }.bind(this);

    this._delegate.didStartMonitoringForRegion = function(pluginResult) {
      this.trigger('didStartMonitoringForRegion', pluginResult);
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

  startRangingBeacon(identifier, uuid, major, minor) {
    this.locationManager().then(lm => {
      let beacon = this._addBeacon(identifier, uuid, major, minor);
      lm.startRangingBeaconsInRegion(beacon.region)
        .fail(function(e) { console.error(e); })
        .done();
    }.bind(this));
  },

  stopRangingBeacons(beacons) {
    var stopBeacons = isPresent(beacons) ? beacons : this.get('beacons');

    this.locationManager().then(lm => {
      stopBeacons.forEach(beacon => {
        lm.stopRangingBeaconsInRegion(beacon.region)
          .fail(function(e) { console.error(e); })
          .done();
      });
    });
  },

  stopRangingBeacon(uuid, major, minor) {
    this.locationManager().then(() => {
      let existingBeacons = this._selectBeacons(uuid, major, minor);
      this.stopRangingBeacons(existingBeacons);
    }.bind(this));
  },

  getRange(txCalibratedPower, rssi) {
    var ratioDb = txCalibratedPower - rssi;
    var ratioLinear = Math.pow(10, ratioDb / 10);
    var r = Math.sqrt(ratioLinear);
    return r;
  },

  getProximity(range) {
    var name = 'Unknown';
    if (range < 3) {
      name = 'Immediate';
    }
    else if (range < 10) {
      name = 'Near';
    }
    else if (range < 30) {
      name = 'Far';
    }
    return name;
  },

  _addBeacon(identifier, uuid, major, minor) {
    let existingBeacons = this._selectBeacons(uuid, major, minor);
    if (existingBeacons.length) {
      return existingBeacons.get('firstObject');
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

  _appendToDeviceLog(message) {
    this.locationManager().then(lm => {
      lm.appendToDeviceLog(message);
    }.bind(this));
  },

  _logToDom(message) {
    var e = document.createElement('label');
    e.innerText = message;

    document.body.appendChild(e);
    document.body.appendChild(document.createElement('br'));
    document.body.appendChild(document.createElement('br'));

    window.scrollTo(0, window.document.height);
  }
});
