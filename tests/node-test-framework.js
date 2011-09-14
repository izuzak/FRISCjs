var util = require('util');

module.exports = {

// - 'tests' is an array of test objects that have
// a 'name' property and the test function 'run'
// - 'setUp' is an optional setup function that is run
// exactly once before all the tests are run
// - 'tearDown' is an optional tear-down function that is
// run exactly once after all tests are run
runTests: function(tests, setUp, tearDown) {
    var ok;
    var cnt_tests = tests.length;
    var i;
    var total = 0;
    var succ = 0;
    setUp = setUp || function() {}
    tearDown = tearDown || function() {}

    setUp();

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

    tearDown();
},

assertEquals: function(left, right) {
    if (left !== right) {
        throw(util.format("got", left, "expected", right));
    }
},

};
