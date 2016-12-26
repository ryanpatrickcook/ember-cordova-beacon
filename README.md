# ember-cordova-beacon

This addon is built to work with [ember-cordova](https://github.com/isleofcode/ember-cordova) and uses [cordova-plugin-ibeacon](https://github.com/petermetz/cordova-plugin-ibeacon).

## Usage
Service Injection
```javascript
beaconService: Ember.inject.service('ember-cordova/beacon')
```

Begin ranging beacon
```javascript
 let uuid = '00000000-0000-0000-0000-000000000000';
 let identifier = 'somePlace';
 let major = 1;
 let minor = 2;
 this.get('beaconService').startRangingBeacon(identifier, uuid, major, minor);
```

Stop ranging all known beacons
```javascript
 this.get('beaconService').stopRangingBeacons();
```

Stop ranging beacon
```javascript
 let uuid = '00000000-0000-0000-0000-000000000000';
 let identifier = 'somePlace';
 let major = 1;
 let minor = 2;
 this.get('beaconService').stopRangingBeacon(identifier, uuid, major, minor);
```

Begin monitoring beacon
```javascript
 let uuid = '00000000-0000-0000-0000-000000000000';
 let identifier = 'somePlace';
 let major = 1;
 let minor = 2;
 this.get('beaconService').startMonitoringBeacon(identifier, uuid, major, minor);
```

Stop monitoring all known beacons
```javascript
 this.get('beaconService').stopMonitoringBeacons();
```

Stop monitoring beacon
```javascript
 let uuid = '00000000-0000-0000-0000-000000000000';
 let identifier = 'somePlace';
 let major = 1;
 let minor = 2;
 this.get('beaconService').stopMonitoringBeacon(identifier, uuid, major, minor);
```

Add callback events
```javascript
let service = this.get('beaconService');
service.on('didEnterRegion', function(beacon, result) { ... });
service.on('didExitRegion', function(beacon, result) { ... });
service.on('didStartMonitoringForRegion', function(beacon, result) { ... });
service.on('didDetermineStateForRegion', function(beacon, result) { ... });
service.on('didRangeBeaconInRegion', function(beacon) { ... });
```

Get monitored beacon regions
```javascript
this.get('beaconService').getMonitoredRegions().then(regions => { ... });
```

Log a message to the view
```javascript
this.get('beaconService').logToDom("HEY!");
```

Log a message to the device log
```javascript
this.get('beaconService').appendToDeviceLog("Logged!");
```
