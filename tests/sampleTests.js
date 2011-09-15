var T = require("./node-test-framework.js");
var tests = [
    new T.Test("sampleTest", function() {
        T.assertEquals("abc", "xyz");
    }),
    new T.Test("sampleTest2", function() {
        T.assertEquals(0, "xyz");
    }),
    new T.Test("sampleTest3", function() {
        T.assertEquals("xyz", "xyz");
    }),
];
T.runTests(tests, function() {console.log("setup");}, function() {console.log("teardown");});
