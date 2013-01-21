var fs = require("fs");
var EventEmitter = require("events").EventEmitter;


// aggregate stats
var total = 0;
var succ = 0;
// file errors
var errs = [];


// makeshift joiner... don't try this at home :-)
var EVENT_FILE_PROCESSED = "fileProcessed";
var join = {
  counter: 0,
  emitter: new EventEmitter(),
};

join.emitter.on(EVENT_FILE_PROCESSED, function() {
  if (--join.counter === 0) {
    console.log("\nRan %d tests: %d succeeded, %d failed", total, succ, total-succ);
    if (errs.length > 0) {
      console.error("File errors:");
      errs.forEach(function(err) { console.error(err); });
    }
  }
});


function endsWith(s, what) {
  return s.length>=what.length && (what.length==0 || s.substring(s.length-what.length)===what);
}

fs.readdir(".", function(err, files) {
  var stats;

  if (err !== null) {
    console.error(err);
  } else {
    join.counter = files.length; // this initializes the joiner

    files.forEach(function(filename) {
      // only run "*-tests.js" files
      if (!endsWith(filename, "-tests.js")) {
        join.emitter.emit(EVENT_FILE_PROCESSED);
        return;
      }

      fs.stat(filename, function(err, stats) {
        if (err !== null) {
          errs.push(err);
        } else {
          if (stats.isFile()) {
            stats = require("./" + filename).stats;
            total += stats.total;
            succ += stats.succ;
            require("./" + filename).stats;
          }
        }

        join.emitter.emit(EVENT_FILE_PROCESSED);
      });
    });
  }
});
