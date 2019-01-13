console.log("Running " + __filename + "...");

var T = require("./node-test-framework.js");
var assembler = require("./../lib/index.js").assembler;
var FRISC = require("./../lib/index.js").simulator;
var util = require("./../lib/index.js").util;

// global test state
var simulator;

// Parses, assembles and runs the program, and expects the final value of R6.
function expectR6(r6Val, program) {
  var parsed = assembler.parse(program);
  simulator.MEM._size = 256 * 1024; // 256 KiB
  simulator.MEM.loadBinaryString(parsed.mem);
  simulator.CPU.reset();
  simulator.CPU.run(true);

  T.assertEquals(r6Val, simulator.CPU._r.r6);
}

// Runs a simple program which tests the specified jump condition after
// calling CMP with the left-hand side and right-hand side values.
// The values are first put into registers via MOVE.
function testCondition(cond, lhs, rhs, expectTrue) {
  // The program puts either 1 or 2 into R6 and halts.
  // 1 is put into R6 if the condition is true (the jump happens), and 2
  // otherwise.
  expectR6(expectTrue ? 1 : 2,
    "      MOVE   " + lhs + ",   R0 \n" +
    "      MOVE   " + rhs + ",   R1 \n" +
    "      CMP             R0,   R1 \n" +
    "      JP_" + cond + " L0       \n" +
    "      MOVE             2,   R6 \n" +
    "      JP           L_END       \n" +
    "L0    MOVE             1,   R6 \n" +
    "L_END HALT                     \n"
  );
}

var tests = [
  ///////////////////////////
  // Unsigned comparisons.
  ///////////////////////////

  // ULT
  new T.Test("-1 < 2", function() {
    testCondition("ULT", -1, 2, false);
  }),
  new T.Test("1 < 2", function() {
    testCondition("ULT", 1, 2, true);
  }),
  new T.Test("2 < 2", function() {
    testCondition("ULT", 2, 2, false);
  }),
  new T.Test("3 < 2", function() {
    testCondition("ULT", 3, 2, false);
  }),
  new T.Test("3 < -1", function() {
    testCondition("ULT", 3, -1, true);
  }),

  // ULE
  new T.Test("-1 <= 2", function() {
    testCondition("ULE", -1, 2, false);
  }),
  new T.Test("1 <= 2", function() {
    testCondition("ULE", 1, 2, true);
  }),
  new T.Test("2 <= 2", function() {
    testCondition("ULE", 2, 2, true);
  }),
  new T.Test("3 <= 2", function() {
    testCondition("ULE", 3, 2, false);
  }),
  new T.Test("3 <= -1", function() {
    testCondition("ULE", 3, -1, true);
  }),

  // UGE
  new T.Test("-1 >= 2", function() {
    testCondition("UGE", -1, 2, true);
  }),
  new T.Test("1 >= 2", function() {
    testCondition("UGE", 1, 2, false);
  }),
  new T.Test("2 >= 2", function() {
    testCondition("UGE", 2, 2, true);
  }),
  new T.Test("3 >= 2", function() {
    testCondition("UGE", 3, 2, true);
  }),
  new T.Test("3 >= -1", function() {
    testCondition("UGE", 3, -1, false);
  }),

  // UGT
  new T.Test("-1 > 2", function() {
    testCondition("UGT", -1, 2, true);
  }),
  new T.Test("1 > 2", function() {
    testCondition("UGT", 1, 2, false);
  }),
  new T.Test("2 > 2", function() {
    testCondition("UGT", 2, 2, false);
  }),
  new T.Test("3 > 2", function() {
    testCondition("UGT", 3, 2, true);
  }),
  new T.Test("3 > -1", function() {
    testCondition("UGT", 3, -1, false);
  }),


  ///////////////////////////
  // Signed comparisons.
  ///////////////////////////

  // SLT
  new T.Test("-1 < 2", function() {
    testCondition("SLT", -1, 2, true);
  }),
  new T.Test("1 < 2", function() {
    testCondition("SLT", 1, 2, true);
  }),
  new T.Test("2 < 2", function() {
    testCondition("SLT", 2, 2, false);
  }),
  new T.Test("3 < 2", function() {
    testCondition("SLT", 3, 2, false);
  }),
  new T.Test("3 < -1", function() {
    testCondition("SLT", 3, -1, false);
  }),

  // SLE
  new T.Test("-1 <= 2", function() {
    testCondition("SLE", -1, 2, true);
  }),
  new T.Test("1 <= 2", function() {
    testCondition("SLE", 1, 2, true);
  }),
  new T.Test("2 <= 2", function() {
    testCondition("SLE", 2, 2, true);
  }),
  new T.Test("3 <= 2", function() {
    testCondition("SLE", 3, 2, false);
  }),
  new T.Test("3 <= -1", function() {
    testCondition("SLE", 3, -1, false);
  }),

  // SGE
  new T.Test("-1 >= 2", function() {
    testCondition("SGE", -1, 2, false);
  }),
  new T.Test("1 >= 2", function() {
    testCondition("SGE", 1, 2, false);
  }),
  new T.Test("2 >= 2", function() {
    testCondition("SGE", 2, 2, true);
  }),
  new T.Test("3 >= 2", function() {
    testCondition("SGE", 3, 2, true);
  }),
  new T.Test("3 >= -1", function() {
    testCondition("SGE", 3, -1, true);
  }),

  // SGT
  new T.Test("-1 > 2", function() {
    testCondition("SGT", -1, 2, false);
  }),
  new T.Test("1 > 2", function() {
    testCondition("SGT", 1, 2, false);
  }),
  new T.Test("2 > 2", function() {
    testCondition("SGT", 2, 2, false);
  }),
  new T.Test("3 > 2", function() {
    testCondition("SGT", 3, 2, true);
  }),
  new T.Test("3 > -1", function() {
    testCondition("SGT", 3, -1, true);
  }),
];

module.exports.stats = T.runTests(tests, {
  testSetUp: function() {
    simulator = new FRISC();
    simulator.CPU.reset();
  },
});
