var util = require('util');

module.exports = {

// Test constructor.
// - name must be a string
// - run is a function that defines the test
Test: function(name, run) {
  this.name = name;
  this.run = run;
},

// Test driver.
// - tests is an array of Test objects
// - [setUp=nop] is a function that is run exactly once before all the tests are run
// - [tearDown=nop] is a function that is run exactly once after all tests are run
runTests: function(tests, setUp, tearDown) {
  var ok;
  var cnt_tests = tests.length;
  var i;
  var total = 0;
  var succ = 0;

  if (setUp) {
    setUp();
  }

  for (i=0; i<cnt_tests; ++i) {
    console.log("Running test: %s", tests[i].name);
    ok = true;
    try {
      tests[i].run();
    } catch (err) {
      ok = false;
      console.log("FAILURE: " + err);
    }
    ++total;
    if (ok) {
      console.log("SUCCESS!");
      ++succ;
    }
  }
  console.log("Ran %d tests: %d succeeded, %d failed", total, succ, total-succ);

  if (tearDown) {
    tearDown();
  }
},

// Use this for items that can be directly compared for equality.
assertEquals: function(left, right) {
  if (!_equals(left, right)) {
    throw util.format("got", left, "expected", right);
  }
},

// Use this for items that can be directly compared for equality.
assertNotEquals: function(left, right) {
  if (_equals(left, right)) {
    throw util.format(left, "is equal to", right);
  }
},

// Use this for arrays whose items can directly compared for equality. 
assertValueArrayEquals: function(left, right) {
  if (!_valueArrayEquals(left, right)) {
    throw util.format("array mismatch: [", left.toString(), "] [", right.toString(), "]");
  }
},

// Use this for arrays whose items can directly compared for equality. 
assertValueArrayNotEquals: function(left, right) {
  if (_valueArrayEquals(left, right)) {
    throw util.format("arrays are equal: [", left.toString(), "] [", right.toString(), "]");
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
    throw util.format("expected a throw from", fun.toString());
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
