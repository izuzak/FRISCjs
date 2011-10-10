console.log("Running " + __filename + "...");

var T = require("./node-test-framework.js");
var FRISC = require("../friscjs.js").FRISC;
var util = require("../friscjs.js").util;

// global test state
var simulator;
var I, R, F;

// Asserts flags as specified by 'o'
// - o is either a string specifying all the flag values
// in CVZN order (e.g. "0001") or an object with flag-value pairs
// where the key is a one-char string ("C", "V", "Z" or "N") and 
// the value is the expected flag value (e.g. {C:0, V:1}).
function assertFlags(o) {
  var flag;
  if (typeof o === "string") {
    T.assertEquals(simulator.CPU._getFlag(F.C), +o[0]); // + converts str->num
    T.assertEquals(simulator.CPU._getFlag(F.V), +o[1]);
    T.assertEquals(simulator.CPU._getFlag(F.Z), +o[2]);
    T.assertEquals(simulator.CPU._getFlag(F.N), +o[3]);
  } else {
    for (flag in o) {
      T.assertEquals(simulator.CPU._getFlag(F[flag]), o[flag]);
    }
  }
}

function assertConditionTrue(cond) {
  T.assertTrue(simulator.CPU._testCond(cond));
}
function assertConditionFalse(cond) {
  T.assertFalse(simulator.CPU._testCond(cond));
}

var tests = [
  new T.Test("ADD reg-reg", function() {
    R.r0 = 12;
    R.r1 = 18;
    I.ADD("r0", "r1", "r2");

    T.assertEquals(R.r2, 30);
    assertFlags("0000");
  }),
  new T.Test("ADD reg-immediate", function() {
    R.r0 = 12;
    I.ADD("r0", 18, "r2");

    T.assertEquals(R.r2, 30);
    assertFlags("0000");
  }),
  new T.Test("ADD large", function() {
    R.r0 = (1<<30);
    R.r1 = (1<<30);
    I.ADD("r0", "r1", "r2");

    T.assertEquals(R.r2, (1<<31));
    // javascript doesn't have unsigned ints so (1<<31) is a negative number
    T.assertEquals(R.r2, -2147483648); 
    T.assertEquals(util.convertIntToBinary(R.r2, 32), "10000000000000000000000000000000");
    // this is how you get the unsigned value from the representation
    T.assertEquals(util.convertBinaryToInt(util.convertIntToBinary(R.r2, 32)), 2147483648);
  }),
  new T.Test("ADD unsigned overflow", function() {
    R.r0 = util.convertBinaryToInt("10000000000000000000000000000001");
    R.r1 = util.convertBinaryToInt("10000000000000000000000000000010");
    I.ADD("r0", "r1", "r2");

    T.assertEquals(R.r2, 3); // make sure it is mod 2^32
    assertFlags({C:1});
  }),
  new T.Test("ADD signed overflow", function() {
    // these are two large-magnitude negative numbers
    R.r0 = util.convertBinaryToInt("10000000000000000000000000000001");
    R.r1 = util.convertBinaryToInt("10000000000000000000000000000010");
    I.ADD("r0", "r1", "r2");

    // result is still 3 as above, but now the interpretation is wrap-around instead of mod 2^32
    T.assertEquals(R.r2, 3); 
    assertFlags({V:1});

    R.r0 = (1<<30);
    R.r1 = (1<<30);
    I.ADD("r0", "r1", "r2");
    assertFlags("0101");
  }),
  new T.Test("ADD to zero", function() {
    R.r0 = 1;
    R.r1 = -1;
    I.ADD("r0", "r1", "r2");
    
    T.assertEquals(R.r2, 0);
    assertFlags({Z:1});
  }),
  new T.Test("ADD unaffected by carry", function() {
    R.r0 = 123;
    R.r1 = 345;
    simulator.CPU._setFlag(F.C, 0);
    I.ADD("r0", "r1", "r2");
    simulator.CPU._setFlag(F.C, 1);
    I.ADD("r0", "r1", "r3");
    T.assertEquals(R.r2, R.r3);
  }),

  new T.Test("ADC affected by carry", function() {
    R.r0 = 123;
    R.r1 = 345;
    simulator.CPU._setFlag(F.C, 0);
    I.ADC("r0", "r1", "r2");
    simulator.CPU._setFlag(F.C, 1);
    I.ADC("r0", "r1", "r3");
    T.assertNotEquals(R.r2, R.r3);
  }),

  new T.Test("XOR", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");
    R.r2 = util.convertBinaryToInt("10000101010100010111110111010111");
    
    I.XOR("r1", "r2", "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "11001100100100010111110111010100");
    assertFlags("0001"); // first bit zero = negative
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
