/* Copyright 2015, Wang Wenlin */

exports.Channel = Channel;
exports.go = go;
exports.bind = bind;
exports.then = then;

// Ref: http://swannodette.github.io/2013/08/24/es6-generators-and-csp/
//
// go(function* (chan) {
//   var ch2 = Channel();
//
//   var r1 = yield db.query('SELECT 1', chan);
//   var r2 = yield request('http://www.google.com', chan);
//
//   db1.query('SELECT 1 FROM dummy', then(ch2, function (res) { ch2(null, res[0]); }));
//   db2.query('SELECT 3', chan);
//   var r3 = yield ch2;
//   var r4 = yield;
//
//   go(function* (ch3) {
//     db1.query('SELECT 1', bind(ch3, 'r5'));
//     db2.query('SELECT 3', bind(ch3, 'r6'));
//     var rx = yield;
//     var ry = yield;
//     chan(null, rx[1] + ry[1]);
//   });
//
//   try {
//     var r5 = yield;
//   } catch (e) {}
//
//   redis.get('k1', chan);
//   redis.hget('k2', chan);
//   var rk1 = yield;
//   var rk2 = yield;
// });

function Channel(arg0) {
  var q_ = new Array(arguments.length);
  var readable_ = [];
  for (var i in arguments) q_[i] = arguments[i];

  chan.ctor_ = Channel;
  chan.poll = poll;
  chan.read = function () { return q_.shift(); }
  return chan;

  function chan(arg0) {
    var args = new Array(arguments.length);
    for (var i in arguments) args[i] = arguments[i];
    return write(args);
  }

  function write(msg) {
    q_.push(msg);
    while (readable_.length) process.nextTick(readable_.shift());
  }

  function poll(cb) {
    if (q_.length) return cb();
    return readable_.push(cb);
  }
}

function go(machine) {
  var inst;
  var chan = Channel([]);
  var runq = chan;

  if (arguments.length <= 1) {
    inst = machine(chan);
  } else if (arguments.length <= 2) {
    inst = machine(chan, arguments[1]);
  } else {
    var l = arguments.length;
    var args = new Array(l - 1);
    for (var i = 1; i < l; i++) args[i-1] = arguments[i];
    inst = machine.apply(null, [].concat(chan, args));
  }

  (function loop() {
    for (;;) {
      var msg = runq.read();
      if (!msg) return runq.poll(loop);
      var iter = next(msg);
      if (iter.done) return;
      runq = iter.value || chan;
      if (runq.ctor_ !== Channel) runq = chan;
    }
  })();

  return chan;

  function next(msg) {
    if (msg[0]) {
      return inst.throw(msg[0]);
    } else if (msg.length <= 2) {
      return inst.next(msg[1]);
    } else {
      return inst.next(msg.slice(1));
    }
  }
}

function bind(chan, bind0) {
  var l = arguments.length;
  var binds = new Array(l - 1);
  for (var i = 1; i < l; i++) binds[i-1] = arguments[i];

  return function (err_, arg0, arg1) {
    if (err_) {
      err_.extra = (binds.length <= 1) ? binds[0] : binds;
      chan(err_);
    } else if (arguments.length <= 2) {
      chan.apply(null, [].concat(err_, binds, arg0));
    } else if (arguments.length <= 3) {
      chan.apply(null, [].concat(err_, binds, arg0, arg1));
    } else {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i-1] = arguments[i];
      chan.apply(null, [].concat(err_, binds, args));
    }
  };
}

function then(err, cb) {
  return function (err_, arg0, arg1) {
    if (err_) {
      err(err_);
    } else if (arguments.length <= 2) {
      cb(arg0);
    } else if (arguments.length <= 3) {
      cb(arg0, arg1);
    } else {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i-1] = arguments[i];
      cb.apply(null, args);
    }
  };
}
