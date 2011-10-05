var util = require('util');

module.exports = {

// Test constructor.
// - name must be a string
// - run is a function that defines the test
Test: function(name, run) {
  this.name = name;
  this.run = run;
},

// Runs all tests and returns an object describing the results.
//
// {
//  total, // number of tests run
//  succ, // number of tests that completed successfully
// }
//
// - tests is an array of Test objects
// - [cfg] is a configuration object with the following properties
//    - [suiteSetUp] is a function to be called before the first test is run
//    - [suiteTearDown] is a function to be called after the last test is run
//    - [testSetUp] is a function to be called before every test
//    - [testTearDown] is a function to be called after every test
runTests: function(tests, cfg) {
  var ok;
  var cnt_tests = tests.length;
  var i;
  var total = 0;
  var succ = 0;

  cfg = cfg || {};

  if (cfg.suiteSetUp) {
    cfg.suiteSetUp();
  }

  for (i=0; i<cnt_tests; ++i) {
    console.log("Running test: %s", tests[i].name);

    if (cfg.testSetUp) {
      cfg.testSetUp();
    }

    ok = true;
    try {
      tests[i].run();
    } catch (err) {
      ok = false;
      console.log("FAILURE: " + err);
      console.log(err.stack.split("\n")[1]);
    }
    ++total;
    if (ok) {
      console.log("SUCCESS!");
      ++succ;
    }

    if (cfg.testTearDown) {
      cfg.testTearDown();
    }
  }

  if (cfg.suiteTearDown) {
    cfg.suiteTearDown();
  }

  console.log("Ran %d tests: %d succeeded, %d failed", total, succ, total-succ);

  return {
    "total": total,
    "succ": succ,
  };
},

// Use this for items that can be directly compared for equality.
assertEquals: function(left, right) {
  if (!_equals(left, right)) {
    throw new Error(util.format("got", left, "expected", right));
  }
},

// Use this for items that can be directly compared for equality.
assertNotEquals: function(left, right) {
  if (_equals(left, right)) {
    throw new Error(util.format(left, "is equal to", right));
  }
},

// Use this for arrays whose items can directly compared for equality. 
assertValueArrayEquals: function(left, right) {
  if (!_valueArrayEquals(left, right)) {
    throw new Error(util.format("array mismatch: [", left.toString(), "] [", right.toString(), "]"));
  }
},

// Use this for arrays whose items can directly compared for equality. 
assertValueArrayNotEquals: function(left, right) {
  if (_valueArrayEquals(left, right)) {
    throw new Error(util.format("arrays are equal: [", left.toString(), "] [", right.toString(), "]"));
  }
},

// Use this to test error conditions that the code checks for (part of the API).
// - 'fun' should be a function that wraps whatever is expected to throw
assertThrows: function(fun) {
  var threw = false;
  try {
    fun();
  } catch(err) {
    threw = true;
  }
  if (!threw) {
    throw new Error(util.format("expected a throw from", fun.toString()));
  }
},

};

function _equals(left, right) {
  return left === right;
}

function _valueArrayEquals(left, right) {
  var i;
  var len = left.length;
  if (len !== right.length) {
    return false;
  }

  for (i=0; i<len; ++i) {
    if (left[i] !== right[i]) {
      return false;
    }
  }
  
  return true;
}
