console.log("Running " + __filename + "...");

var T = require("./node-test-framework.js");

var tests = [
  new T.Test("sampleTest", function() {
  }),
];

T.runTests(tests, {
  suiteSetUp: function() {console.log("suite setup");},
  suiteTearDown: function() {console.log("suite teardown");},
  testSetUp: function() {console.log("test setup");},
  testTearDown: function() {console.log("test teardown");},
});
