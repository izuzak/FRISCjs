console.log("Running " + __filename + "...");

var T = require("./node-test-framework.js");
var FRISC = require("./../lib/index.js").simulator;
var util = require("./../lib/index.js").util;

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
    var instruction = "00100001100101000000000000000000";
    var decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "ADD");
    T.assertValueArrayEquals(decoded.args, ["r1", "r2", "r3"]);

    instruction = "00110110101000000000000000000101";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "SUB");
    T.assertValueArrayEquals(decoded.args, ["r2", 5, "r5"]);

    instruction = "01101000000101000000000000000000";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "CMP");
    T.assertValueArrayEquals(decoded.args, ["r1", "r2"]);

    instruction = "01101100000100000000000000000101";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "CMP");
    T.assertValueArrayEquals(decoded.args, ["r1", 5]);

    instruction = "00000010100010000000000000000000";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "MOVE");
    T.assertValueArrayEquals(decoded.args, ["r4", "r5"]);

    instruction = "00000000000110100000000000000000";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "MOVE");
    T.assertValueArrayEquals(decoded.args, ["r5", "sr"]);

    instruction = "00000010101000000000000000000000";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "MOVE");
    T.assertValueArrayEquals(decoded.args, ["sr", "r5"]);

    instruction = "00000110000000000000000000010000";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "MOVE");
    T.assertValueArrayEquals(decoded.args, [16, "r4"]);

    instruction = "00000100000100000000000000010100";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "MOVE");
    T.assertValueArrayEquals(decoded.args, [20, "sr"]);

    instruction = "11000100000000000000000000000100";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "JP");
    T.assertValueArrayEquals(decoded.args, ["", 4]);

    instruction = "11000100010000000000000000110110";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "JP");
    T.assertValueArrayEquals(decoded.args, ["_N/M", 54]);

    instruction = "11000001000000100000000000000000";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "JP");
    T.assertValueArrayEquals(decoded.args, ["_NC/UGE", "r1"]);

    instruction = "11011000010000000000000000000001";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "RET");
    T.assertValueArrayEquals(decoded.args, ["_N/M", true, false]);

    instruction = "10111100101000000000000000000000";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "STORE");
    T.assertValueArrayEquals(decoded.args, ["r1", "r2", 0]);

    instruction = "10111110001100000000000000100011";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "STORE");
    T.assertValueArrayEquals(decoded.args, ["r4", "r3", 35]);

    instruction = "10111010000000000000000000111100";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "STORE");
    T.assertValueArrayEquals(decoded.args, ["r4", 0, 60]);

    instruction = "10000001100000000000000000000000";
    decoded = simulator.CPU._decode(instruction);

    T.assertEquals(decoded.op, "POP");
    T.assertValueArrayEquals(decoded.args, ["r3"]);
  }),
];

module.exports.stats = T.runTests(tests, {
  testSetUp: function() {
    simulator = new FRISC();
    simulator.CPU.reset();
  },
});
