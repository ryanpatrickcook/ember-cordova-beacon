import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
let { RSVP } = Ember;
const { Promise } = RSVP;

moduleFor('service:ember-cordova/beacon', 'Unit | Service | ember-cordova/beacon', {
  unit: true,
  beforeEach() {
    this.subject({
      locationManager() {
        let lm = {
          startMonitoringForRegion(beaconRegion) {
            return Promise.resolve(beaconRegion);
          },
          stopMonitoringForRegion(beaconRegion) {
            return Promise.resolve(beaconRegion);
          },
          startRangingBeaconsInRegion(beaconRegion) {
            return Promise.resolve(beaconRegion);
          },
          stopRangingBeaconsInRegion(beaconRegion) {
            return Promise.resolve(beaconRegion);
          }
        };
        return Promise.resolve(lm);
      },
      _locationManager: {
        BeaconRegion(identifier, uuid, major, minor) {
          return {
            identifier: identifier,
            uuid: uuid,
            major: major,
            minor: minor,
            type: 'BeaconRegion'
          };
        }
      }
    });
  }
});

test('it adds beacon to be monitored', function(assert) {
  let service = this.subject();
  let done = assert.async();

  let beacon = {
    identifier: 'My Monitoring Beacon',
    uuid: 'mon-xxx-xxx',
    major: 1,
    minor: 2
  };

  service.startMonitoringBeacon(
    beacon.identifier,
    beacon.uuid,
    beacon.major,
    beacon.minor
  ).then(function(result) {
    assert.equal(result.identifier, beacon.identifier, 'beacon identifier should be set');
    assert.equal(result.major, beacon.major, 'beacon major should be set');
    assert.equal(result.minor, beacon.minor, 'beacon minor should be set');
    assert.equal(result.uuid, beacon.uuid, 'beacon uuid should be set');
    assert.notEqual(result.region, null, 'beacon region should be set');
    assert.equal(result.rssi, 0, 'beacon rssi should be set');
    assert.equal(result.accuracy, 0, 'beacon accuracy should be set');

    assert.equal(this.get('monitoringBeacons.length'), 1, '1 beacon should be assigned');
    done();
  }.bind(service));

  assert.ok(service);
  assert.equal(service.get('monitoringBeacons.length'), 0, 'no beacons should be assigned');
});


test('it adds beacon to be ranged', function(assert) {
  let service = this.subject();
  let done = assert.async();

  let beacon = {
    identifier: 'My Ranging Beacon',
    uuid: 'rng-xxx-xxx',
    major: 1,
    minor: 3
  };

  service.startRangingBeacon(
    beacon.identifier,
    beacon.uuid,
    beacon.major,
    beacon.minor
  ).then(function(result) {
    assert.equal(result.identifier, beacon.identifier, 'beacon identifier should be set');
    assert.equal(result.major, beacon.major, 'beacon major should be set');
    assert.equal(result.minor, beacon.minor, 'beacon minor should be set');
    assert.equal(result.uuid, beacon.uuid, 'beacon uuid should be set');
    assert.notEqual(result.region, null, 'beacon region should be set');
    assert.equal(result.rssi, 0, 'beacon rssi should be set');
    assert.equal(result.accuracy, 0, 'beacon accuracy should be set');

    assert.equal(this.get('rangingBeacons.length'), 1, '1 ranging beacon should be assigned');
    done();
  }.bind(service));

  assert.equal(service.get('rangingBeacons.length'), 0, 'no ranging beacons should be assigned');
});


test('it stops beacon from being monitored', function(assert) {
  let service = this.subject();
  let done = assert.async();

  let beacon = {
    identifier: 'My Monitoring Beacon',
    uuid: 'mon-xxx-xxx',
    major: 1,
    minor: 2
  };

  service.startMonitoringBeacon(
    beacon.identifier,
    beacon.uuid,
    beacon.major,
    beacon.minor
  );

  service.stopMonitoringBeacon(
    beacon.uuid,
    beacon.major,
    beacon.minor
  ).then(function(result) {
    assert.equal(result.identifier, beacon.identifier, 'beacon identifier should be set');
    assert.equal(result.major, beacon.major, 'beacon major should be set');
    assert.equal(result.minor, beacon.minor, 'beacon minor should be set');
    assert.equal(result.uuid, beacon.uuid, 'beacon uuid should be set');
    assert.notEqual(result.region, null, 'beacon region should be set');
    assert.equal(result.rssi, 0, 'beacon rssi should be set');
    assert.equal(result.accuracy, 0, 'beacon accuracy should be set');

    assert.equal(this.get('monitoringBeacons.length'), 0, '0 beacons should be monitoring');
    done();
  }.bind(service));
});

test('it stops beacon to be ranged', function(assert) {
  let service = this.subject();
  let done = assert.async();

  let beacon = {
    identifier: 'My Ranging Beacon',
    uuid: 'rng-xxx-xxx',
    major: 1,
    minor: 3
  };

  service.startRangingBeacon(
    beacon.identifier,
    beacon.uuid,
    beacon.major,
    beacon.minor
  );

  service.stopRangingBeacon(
    beacon.uuid,
    beacon.major,
    beacon.minor
  ).then(function(result) {
    assert.equal(result.identifier, beacon.identifier, 'beacon identifier should be set');
    assert.equal(result.major, beacon.major, 'beacon major should be set');
    assert.equal(result.minor, beacon.minor, 'beacon minor should be set');
    assert.equal(result.uuid, beacon.uuid, 'beacon uuid should be set');
    assert.notEqual(result.region, null, 'beacon region should be set');
    assert.equal(result.rssi, 0, 'beacon rssi should be set');
    assert.equal(result.accuracy, 0, 'beacon accuracy should be set');

    assert.equal(this.get('rangingBeacons.length'), 0, '0 beacons should be ranging');
    done();
  }.bind(service));
});
