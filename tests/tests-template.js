var T = require("./node-test-framework.js");
var tests = [
    { name: "sampleTest", run: function() {
    }},
];
T.runTests(tests, function() {console.log("setup");}, function() {console.log("teardown");});
