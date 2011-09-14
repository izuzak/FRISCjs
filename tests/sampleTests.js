var T = require("./node-test-framework.js");
var tests = [
    { name: "sampleTest", run: function() {
        T.assertEquals("abc", "xyz");
    }},
    { name: "sampleTest2", run: function() {
        T.assertEquals(0, "xyz");
    }},
    { name: "sampleTest3", run: function() {
        T.assertEquals("xyz", "xyz");
    }},
];
T.runTests(tests, function() {console.log("setup");}, function() {console.log("teardown");});
