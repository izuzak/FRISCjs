console.log("Running " + __filename + "...");

var T = require("./node-test-framework.js");
var FRISC = require("../friscjs.js").FRISC;
var util = require("../friscjs.js").util;

// global test state
var simulator;

var tests = [
  new T.Test("Test cpu flag getter", function() {
    simulator.CPU._r.sr = util.convertBinaryToInt("00101101010");

    T.assertEquals(simulator.CPU._getFlag(simulator.CPU._f["INT2"]), 0);
    T.assertEquals(simulator.CPU._getFlag(simulator.CPU._f["INT2"]), 0);
    T.assertEquals(simulator.CPU._getFlag(simulator.CPU._f["INT1"]), 0);
    T.assertEquals(simulator.CPU._getFlag(simulator.CPU._f["INT0"]), 1);
    T.assertEquals(simulator.CPU._getFlag(simulator.CPU._f["GIE"]), 0);
    T.assertEquals(simulator.CPU._getFlag(simulator.CPU._f["EINT2"]), 1);
    T.assertEquals(simulator.CPU._getFlag(simulator.CPU._f["EINT1"]), 1);
    T.assertEquals(simulator.CPU._getFlag(simulator.CPU._f["EINT0"]), 0);
    T.assertEquals(simulator.CPU._getFlag(simulator.CPU._f["Z"]), 1);
    T.assertEquals(simulator.CPU._getFlag(simulator.CPU._f["V"]), 0);
    T.assertEquals(simulator.CPU._getFlag(simulator.CPU._f["C"]), 1);
    T.assertEquals(simulator.CPU._getFlag(simulator.CPU._f["N"]), 0);
  }),
  new T.Test("Test cpu flag setter", function() {
    simulator.CPU._setFlag(simulator.CPU._f["INT2"], 0);
    simulator.CPU._setFlag(simulator.CPU._f["INT1"], 0);
    simulator.CPU._setFlag(simulator.CPU._f["INT0"], 1);
    simulator.CPU._setFlag(simulator.CPU._f["INT0"], 1);
    simulator.CPU._setFlag(simulator.CPU._f["GIE"], 0);
    simulator.CPU._setFlag(simulator.CPU._f["EINT2"], 1);
    simulator.CPU._setFlag(simulator.CPU._f["EINT1"], 1);
    simulator.CPU._setFlag(simulator.CPU._f["EINT0"], 0);
    simulator.CPU._setFlag(simulator.CPU._f["Z"], 1);
    simulator.CPU._setFlag(simulator.CPU._f["V"], 0);
    simulator.CPU._setFlag(simulator.CPU._f["C"], 1);
    simulator.CPU._setFlag(simulator.CPU._f["N"], 0);
   
    T.assertEquals(util.convertIntToBinary(simulator.CPU._r.sr, 11), "00101101010");
  }),
  new T.Test("Test cpu condition tester", function() {
    simulator.CPU._r.sr = util.convertBinaryToInt("00101101010");

    T.assertEquals(simulator.CPU._testCond(""), true);
    T.assertEquals(simulator.CPU._testCond("_N/M"), false);
    T.assertEquals(simulator.CPU._testCond("_NN/P"), true);
    T.assertEquals(simulator.CPU._testCond("_C/ULT"), true);
    T.assertEquals(simulator.CPU._testCond("_NC/UGE"), false);
    T.assertEquals(simulator.CPU._testCond("_V"), false);
    T.assertEquals(simulator.CPU._testCond("_NV"), true);
    T.assertEquals(simulator.CPU._testCond("_Z/EQ"), true);
    T.assertEquals(simulator.CPU._testCond("_NZ/NE"), false);
    T.assertEquals(simulator.CPU._testCond("_ULE"), true);
    T.assertEquals(simulator.CPU._testCond("_UGT"), false);
    T.assertEquals(simulator.CPU._testCond("_SLT"), false);
    T.assertEquals(simulator.CPU._testCond("_SLE"), true);
    T.assertEquals(simulator.CPU._testCond("_SGE"), true);
    T.assertEquals(simulator.CPU._testCond("_SGT"), false);
  }),
  new T.Test("Test cpu decoder", function() {
  }),
];

module.exports.stats = T.runTests(tests, {
  testSetUp: function() {
    simulator = new FRISC();
    simulator.CPU.reset();
  },
});
