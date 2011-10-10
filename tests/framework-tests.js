console.log("Running " + __filename + "...");

var T = require("./node-test-framework.js");

var tests = [
  new T.Test("different strings", function() {
    T.assertNotEquals("abc", "xyz");
  }),
  new T.Test("equal strings", function() {
    T.assertEquals("xyz", "xyz");
  }),
  new T.Test("number !== string", function() {
    T.assertNotEquals(0, "xyz");
  }),
  new T.Test("different length arrays", function() {
    T.assertValueArrayNotEquals([1,2], [1,2,3]);
  }),
  new T.Test("same length different arrays", function() {
    T.assertValueArrayNotEquals([1,2,4], [1,2,3]);
  }),
  new T.Test("equal int arrays", function() {
    T.assertValueArrayEquals([1,2,3], [1,2,3]);
  }),
  new T.Test("equal mixed type arrays", function() {
    T.assertValueArrayEquals([1,"2",3], [1,"2",3]);
  }),
  new T.Test("truthy", function() {
      T.assertTrue(1);
      T.assertTrue(-1);
      T.assertTrue(true);
      T.assertTrue("false");
      T.assertTrue({});
  }),
  new T.Test("falsy", function() {
      T.assertFalse(0);
      T.assertFalse(false);
      T.assertFalse(undefined);
      T.assertFalse(null);
      T.assertFalse("");
  }),
  new T.Test("throwing", function() {
    T.assertThrows(function() { throw "test"; });
  }),
];

module.exports.stats = T.runTests(tests);
