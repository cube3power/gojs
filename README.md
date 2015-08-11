go.js, Golang like channels, goroutine and go.
====

```javascript
var Channel = require('gojs').Channel;
var go = require('gojs').go;
var bind = require('gojs').bind;
var then = require('gojs').then;

// Ref: http://swannodette.github.io/2013/08/24/es6-generators-and-csp/
//
go(function* (ch) {
  var r1 = yield db.query('SELECT 1', ch);
  var r2 = yield db.query('SELECT 2', ch);

  redis.hget('k1', ch);
  redis.get('k2', ch);
  var rk1 = yield;
  var rk2 = yield;

  request('http://www.google.com', ch);
  var [resp, body] = yield ch;

  go(function* (ch2) {
    db.query('SELECT 1', bind(ch2, 'r3'));
    db2.query('SELECT 3', bind(ch2, 'r4'));
    var rx = yield;
    var ry = yield;
    ch(null, rx[1] + ry[1]);
  });

  try {
    var rz = yield ch;
  } catch (e) {}

  // Free channel
  var ch3 = Channel();

  db.query('SELECT 1 FROM dummy', then(ch, function (res) { ch(null, res[0]); }));
  db2.query('SELECT 3', ch3);
  var r3 = yield;
  var r4 = yield ch3;

  // ES6 Promise
  var prms = db.queryPromise('SELECT 1').then(print);
  var rp = yield prms;
  var rp2 = yield prms;
  var rp3 = yield ES.readFilePromise('/etc/hosts');
});
```
