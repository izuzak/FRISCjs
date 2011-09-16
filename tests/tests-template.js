console.log("Running " + __filename + "...");

var T = require("./node-test-framework.js");

var tests = [
  new T.Test("sampleTest", function() {
  }),
];

T.runTests(tests, function() {console.log("setup");}, function() {console.log("teardown");});
