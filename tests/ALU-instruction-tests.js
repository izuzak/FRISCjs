console.log("Running " + __filename + "...");

var T = require("./node-test-framework.js");
var FRISC = require("../friscjs.js").FRISC;
var util = require("../friscjs.js").util;

// global test state
var simulator;
var I, R, F;

var tests = [
  new T.Test("Test cpu XOR instruction", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");
    R.r2 = util.convertBinaryToInt("10000101010100010111110111010111");
    
    I.XOR("r1", "r2", "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "11001100100100010111110111010100");
    T.assertEquals(simulator.CPU._getFlag(F.C), 0);
    T.assertEquals(simulator.CPU._getFlag(F.V), 0);
    T.assertEquals(simulator.CPU._getFlag(F.Z), 0);
    T.assertEquals(simulator.CPU._getFlag(F.N), 1);
  }),
];

module.exports.stats = T.runTests(tests, {
  testSetUp: function() {
    var instr;
    simulator = new FRISC();
    simulator.CPU.reset();
    R = simulator.CPU._r;
    F = simulator.CPU._f;
    I = {};
    for (instr in simulator.CPU._i) {
      I[instr] = simulator.CPU._i[instr].bind(simulator.CPU);
    }
  },
});
