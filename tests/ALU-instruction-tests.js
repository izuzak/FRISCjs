console.log("Running " + __filename + "...");

var T = require("./node-test-framework.js");
var FRISC = require("./../lib/index.js").simulator;
var util = require("./../lib/index.js").util;

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
  new T.Test("ADD to negative", function() {
    R.r0 = 123;
    R.r1 = -321;
    I.ADD("r0", "r1", "r2");

    assertFlags({N:1});
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

  new T.Test("ADC reg-reg", function() {
    R.r0 = 123;
    R.r1 = 345;
    simulator.CPU._setFlag(F.C, 0);
    I.ADC("r0", "r1", "r2");
    T.assertEquals(R.r2, 468);
    simulator.CPU._setFlag(F.C, 1);
    I.ADC("r0", "r1", "r2");
    T.assertEquals(R.r2, 469);
  }),
  new T.Test("ADC reg-immediate", function() {
    R.r0 = 123;
    simulator.CPU._setFlag(F.C, 0);
    I.ADC("r0", 345, "r2");
    T.assertEquals(R.r2, 468);
    simulator.CPU._setFlag(F.C, 1);
    I.ADC("r0", 345, "r2");
    T.assertEquals(R.r2, 469);
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

  new T.Test("SUB reg-reg", function() {
    R.r0 = 123;
    R.r1 = 23;
    I.SUB("r0", "r1", "r2");
    T.assertEquals(R.r2, 100);
  }),
  new T.Test("SUB reg-immediate", function() {
    R.r0 = 123;
    I.SUB("r0", 23, "r2");
    T.assertEquals(R.r2, 100);
  }),
  new T.Test("SUB large", function() {
    R.r0 = 1234567890;
    R.r1 = 234567890;
    I.SUB("r0", "r1", "r2");
    T.assertEquals(R.r2, 1000000000);
  }),
  new T.Test("SUB unsigned underflow", function() {
    R.r0 = 123;
    R.r1 = 124;
    I.SUB("r0", "r1", "r2");
    assertFlags({C:1, V:0});
  }),
  new T.Test("SUB signed underflow", function() {
    R.r0 = -1234567890;
    R.r1 = 1234567890;
    I.SUB("r0", "r1", "r2");
    assertFlags({C:0, V:1});
  }),
  new T.Test("SUB to zero", function() {
    R.r0 = 12345;
    R.r1 = 12345;
    I.SUB("r0", "r1", "r2");
    assertFlags({Z:1});
  }),
  new T.Test("SUB to negative", function() {
    R.r0 = 123;
    R.r1 = 223;
    I.SUB("r0", "r1", "r2");
    assertFlags({N:1});
  }),
  new T.Test("SUB unaffected by carry", function() {
    R.r0 = 123;
    R.r1 = 345;
    simulator.CPU._setFlag(F.C, 0);
    I.SUB("r0", "r1", "r2");
    simulator.CPU._setFlag(F.C, 1);
    I.SUB("r0", "r1", "r3");
    T.assertEquals(R.r2, R.r3);
  }),

  new T.Test("SBC reg-reg", function() {
    R.r0 = 123;
    R.r1 = 120;
    I.SBC("r0", "r1", "r2");
    T.assertEquals(R.r2, 3);
  }),
  new T.Test("SBC reg-immediate", function() {
    R.r0 = 123;
    I.SBC("r0", 120, "r2");
    T.assertEquals(R.r2, 3);
  }),
  new T.Test("SBC affected by carry", function() {
    R.r0 = 123;
    R.r1 = 120;
    simulator.CPU._setFlag(F.C, 0);
    I.SBC("r0", "r1", "r2");
    T.assertEquals(R.r2, 3);
    simulator.CPU._setFlag(F.C, 1);
    I.SBC("r0", "r1", "r2");
    T.assertEquals(R.r2, 2);
  }),
  new T.Test("AND instruction with reg", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");
    R.r2 = util.convertBinaryToInt("10000101010100010111110111010111");

    I.AND("r1", "r2", "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "00000001010000000000000000000011");
    assertFlags("0000");
  }),
  new T.Test("AND instruction with num", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.AND("r1", util.convertBinaryToInt("10000101010100010111110111010111"), "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "00000001010000000000000000000011");
    assertFlags("0000");
  }),
  new T.Test("OR instruction with reg", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");
    R.r2 = util.convertBinaryToInt("10000101010100010111110111010111");

    I.OR("r1", "r2", "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "11001101110100010111110111010111");
    assertFlags("0001");
  }),
  new T.Test("OR instruction with num", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.OR("r1", util.convertBinaryToInt("10000101010100010111110111010111"), "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "11001101110100010111110111010111");
    assertFlags("0001");
  }),
  new T.Test("XOR instruction with reg", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");
    R.r2 = util.convertBinaryToInt("10000101010100010111110111010111");

    I.XOR("r1", "r2", "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "11001100100100010111110111010100");
    assertFlags("0001");
  }),
  new T.Test("XOR instruction with num", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.XOR("r1", util.convertBinaryToInt("10000101010100010111110111010111"), "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "11001100100100010111110111010100");
    assertFlags("0001");
  }),
  new T.Test("SHL instruction with reg", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");
    R.r2 = 5;

    I.SHL("r1", "r2", "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "00111000000000000000000001100000");
    assertFlags("1000");
  }),
  new T.Test("SHL instruction with num", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.SHL("r1", 5, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "00111000000000000000000001100000");
    assertFlags("1000");
  }),
  new T.Test("SHL instruction with 0", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.SHL("r1", 0, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "01001001110000000000000000000011");
    assertFlags("0000");
  }),
  new T.Test("SHL instruction with 32", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.SHL("r1", 32, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "01001001110000000000000000000011");
    assertFlags("0000");
  }),
  new T.Test("SHL instruction with >32", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.SHL("r1", 35, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "01001110000000000000000000011000");
    assertFlags("0000");
  }),
  new T.Test("SHR instruction with reg", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");
    R.r2 = 5;

    I.SHR("r1", "r2", "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "00000010010011100000000000000000");
    assertFlags("0000");
  }),
  new T.Test("SHR instruction with num", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.SHR("r1", 5, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "00000010010011100000000000000000");
    assertFlags("0000");
  }),
  new T.Test("SHR instruction with 0", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.SHR("r1", 0, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "01001001110000000000000000000011");
    assertFlags("0000");
  }),
  new T.Test("SHR instruction with 32", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.SHR("r1", 32, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "01001001110000000000000000000011");
    assertFlags("0000");
  }),
  new T.Test("SHR instruction with >32", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.SHR("r1", 35, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "00001001001110000000000000000000");
    assertFlags("0000");
  }),
  new T.Test("ASHR instruction with reg", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");
    R.r2 = 5;

    I.ASHR("r1", "r2", "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "00000010010011100000000000000000");
    assertFlags("0000");
  }),
  new T.Test("ASHR instruction with num", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.ASHR("r1", 5, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "00000010010011100000000000000000");
    assertFlags("0000");
  }),
  new T.Test("ASHR instruction with 0", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.ASHR("r1", 0, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "01001001110000000000000000000011");
    assertFlags("0000");
  }),
  new T.Test("ASHR instruction with 32", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.ASHR("r1", 32, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "01001001110000000000000000000011");
    assertFlags("0000");
  }),
  new T.Test("ASHR instruction with >32", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.ASHR("r1", 35, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "00001001001110000000000000000000");
    assertFlags("0000");
  }),
  new T.Test("ASHR instruction with 1 sign bit and >32", function() {
    R.r1 = util.convertBinaryToInt("11001001110000000000000000000011");

    I.ASHR("r1", 35, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "11111001001110000000000000000000");
    assertFlags("0001");
  }),
  new T.Test("ROTL instruction with reg", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");
    R.r2 = 5;

    I.ROTL("r1", "r2", "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "00111000000000000000000001101001");
    assertFlags("1000");
  }),
  new T.Test("ROTL instruction with num", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.ROTL("r1", 5, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "00111000000000000000000001101001");
    assertFlags("1000");
  }),
  new T.Test("ROTL instruction with 0", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.ROTL("r1", 0, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "01001001110000000000000000000011");
    assertFlags("0000");
  }),
  new T.Test("ROTL instruction with 32", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.ROTL("r1", 32, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "01001001110000000000000000000011");
    assertFlags("0000");
  }),
  new T.Test("ROTL instruction with >32", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.ROTL("r1", 35, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "01001110000000000000000000011010");
    assertFlags("0000");
  }),
  new T.Test("ROTR instruction with reg", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");
    R.r2 = 5;

    I.ROTR("r1", "r2", "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "00011010010011100000000000000000");
    assertFlags("0000");
  }),
  new T.Test("ROTR instruction with num", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.ROTR("r1", 5, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "00011010010011100000000000000000");
    assertFlags("0000");
  }),
  new T.Test("ROTR instruction with 0", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.ROTR("r1", 0, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "01001001110000000000000000000011");
    assertFlags("0000");
  }),
  new T.Test("ROTR instruction with 32", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.ROTR("r1", 32, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "01001001110000000000000000000011");
    assertFlags("0000");
  }),
  new T.Test("ROTR instruction with >32", function() {
    R.r1 = util.convertBinaryToInt("01001001110000000000000000000011");

    I.ROTR("r1", 35, "r3");

    T.assertEquals(util.convertIntToBinary(R.r3, 32), "01101001001110000000000000000000");
    assertFlags("0000");
  }),
  new T.Test("MOVE instruction reg->reg", function() {
    R.r1 = 2;
    R.r2 = 5;

    I.MOVE("r1", "r2");

    T.assertEquals(R.r2, 2);
  }),
  new T.Test("MOVE instruction num->reg", function() {
    R.r2 = 5;

    I.MOVE(2, "r2");

    T.assertEquals(R.r2, 2);
  }),
  new T.Test("MOVE instruction reg->sr", function() {
    R.r1 = 2;
    R.sr = 5;

    I.MOVE("r1", "sr");

    T.assertEquals(R.sr, 2);
  }),
  new T.Test("MOVE instruction num->sr", function() {
    R.sr = 5;

    I.MOVE(2, "sr");

    T.assertEquals(R.sr, 2);
  }),
  new T.Test("MOVE instruction num->sr >8 bits", function() {
    R.sr = 5;

    I.MOVE(util.convertBinaryToInt("01100100100"), "sr");

    T.assertEquals(R.sr, util.convertBinaryToInt("00000100100"));
  }),
  new T.Test("MOVE instruction sr->reg", function() {
    R.sr = 2;
    R.r1 = 5;

    I.MOVE("sr", "r1");

    T.assertEquals(R.sr, 2);
  }),

  new T.Test("LOAD instruction reg+off", function() {
    simulator.MEM.write(8, util.convertBinaryToInt("01010101111100001111000001010101"));
    R.r2 = 4;

    I.LOAD("r1", "r2", 4);

    T.assertEquals(R.r1, util.convertBinaryToInt("01010101111100001111000001010101"));
  }),
  new T.Test("LOAD instruction reg", function() {
    simulator.MEM.write(8, util.convertBinaryToInt("01010101111100001111000001010101"));
    R.r2 = 8;

    I.LOAD("r1", "r2", 0);

    T.assertEquals(R.r1, util.convertBinaryToInt("01010101111100001111000001010101"));
  }),
  new T.Test("LOAD instruction off", function() {
    simulator.MEM.write(8, util.convertBinaryToInt("01010101111100001111000001010101"));

    I.LOAD("r1", 0, 8);

    T.assertEquals(R.r1, util.convertBinaryToInt("01010101111100001111000001010101"));
  }),
  new T.Test("LOAD instruction from wrongly aligned address", function() {
    simulator.MEM.write(8, util.convertBinaryToInt("01010101111100001111000001010101"));

    I.LOAD("r1", 0, 6);
    T.assertEquals(R.r1, 0);

    I.LOAD("r1", 0, 10);
    T.assertEquals(R.r1, util.convertBinaryToInt("01010101111100001111000001010101"));
  }),

  new T.Test("LOADH instruction reg+off", function() {
    simulator.MEM.writew(8, util.convertBinaryToInt("0101010111110000"));
    R.r2 = 4;

    I.LOADH("r1", "r2", 4);

    T.assertEquals(R.r1, util.convertBinaryToInt("0101010111110000"));
  }),
  new T.Test("LOADH instruction reg", function() {
    simulator.MEM.writew(8, util.convertBinaryToInt("0101010111110000"));
    R.r2 = 8;

    I.LOADH("r1", "r2", 0);

    T.assertEquals(R.r1, util.convertBinaryToInt("0101010111110000"));
  }),
  new T.Test("LOADH instruction off", function() {
    simulator.MEM.writew(8, util.convertBinaryToInt("0101010111110000"));

    I.LOADH("r1", 0, 8);

    T.assertEquals(R.r1, util.convertBinaryToInt("0101010111110000"));
  }),
  new T.Test("LOADH instruction from wrongly aligned address", function() {
    simulator.MEM.writew(8, util.convertBinaryToInt("0101010111110000"));

    I.LOADH("r1", 0, 7);
    T.assertEquals(R.r1, 0);

    I.LOADH("r1", 0, 9);
    T.assertEquals(R.r1, util.convertBinaryToInt("0101010111110000"));
  }),

  new T.Test("LOADB instruction reg+off", function() {
    simulator.MEM.writeb(7, util.convertBinaryToInt("01010101"));
    R.r2 = 3;

    I.LOADB("r1", "r2", 4);

    T.assertEquals(R.r1, util.convertBinaryToInt("01010101"));
  }),
  new T.Test("LOADB instruction reg", function() {
    simulator.MEM.writeb(7, util.convertBinaryToInt("01010101"));
    R.r2 = 7;

    I.LOADB("r1", "r2", 0);

    T.assertEquals(R.r1, util.convertBinaryToInt("01010101"));
  }),
  new T.Test("LOADB instruction off", function() {
    simulator.MEM.writew(7, util.convertBinaryToInt("01010101"));

    I.LOADB("r1", 0, 7);

    T.assertEquals(R.r1, util.convertBinaryToInt("01010101"));
  }),

  new T.Test("STORE instruction reg+off", function() {
    R.r2 = 4;
    R.r1 = util.convertBinaryToInt("01010101111100001111000001010101");
    I.STORE("r1", "r2", 4);

    T.assertEquals(simulator.MEM.read(8), util.convertBinaryToInt("01010101111100001111000001010101"));
  }),
  new T.Test("STORE instruction reg", function() {
    R.r2 = 8;
    R.r1 = util.convertBinaryToInt("01010101111100001111000001010101");
    I.STORE("r1", "r2", 0);

    T.assertEquals(simulator.MEM.read(8), util.convertBinaryToInt("01010101111100001111000001010101"));
  }),
  new T.Test("STORE instruction off", function() {
    R.r1 = util.convertBinaryToInt("01010101111100001111000001010101");

    I.STORE("r1", 0, 8);

    T.assertEquals(simulator.MEM.read(8), util.convertBinaryToInt("01010101111100001111000001010101"))
  }),
  new T.Test("STORE instruction from wrongly aligned address", function() {
    R.r1 = util.convertBinaryToInt("01010101111100001111000001010101");

    I.STORE("r1", 0, 6);
    T.assertEquals(simulator.MEM.read(8), 0);

    I.STORE("r1", 0, 10);
    T.assertEquals(simulator.MEM.read(8), util.convertBinaryToInt("01010101111100001111000001010101"));
  }),

  new T.Test("STOREH instruction reg+off", function() {
    R.r2 = 4;
    R.r1 = util.convertBinaryToInt("0101010111110000");
    I.STOREH("r1", "r2", 4);

    T.assertEquals(simulator.MEM.read(8), util.convertBinaryToInt("0101010111110000"));
  }),
  new T.Test("STOREH instruction reg", function() {
    R.r2 = 8;
    R.r1 = util.convertBinaryToInt("0101010111110000");
    I.STOREH("r1", "r2", 0);

    T.assertEquals(simulator.MEM.read(8), util.convertBinaryToInt("0101010111110000"));
  }),
  new T.Test("STOREH instruction off", function() {
    R.r1 = util.convertBinaryToInt("0101010111110000");

    I.STOREH("r1", 0, 8);

    T.assertEquals(simulator.MEM.read(8), util.convertBinaryToInt("0101010111110000"))
  }),
  new T.Test("STOREH instruction from wrongly aligned address", function() {
    R.r1 = util.convertBinaryToInt("0101010111110000");

    I.STOREH("r1", 0, 7);
    T.assertEquals(simulator.MEM.read(8), 0);

    I.STOREH("r1", 0, 9);
    T.assertEquals(simulator.MEM.read(8), util.convertBinaryToInt("0101010111110000"));
  }),

  new T.Test("STOREB instruction reg+off", function() {
    R.r2 = 4;
    R.r1 = util.convertBinaryToInt("01010101");
    I.STOREB("r1", "r2", 4);

    T.assertEquals(simulator.MEM.read(8), util.convertBinaryToInt("01010101"));
  }),
  new T.Test("STOREB instruction reg", function() {
    R.r2 = 8;
    R.r1 = util.convertBinaryToInt("01010101");
    I.STOREB("r1", "r2", 0);

    T.assertEquals(simulator.MEM.read(8), util.convertBinaryToInt("01010101"));
  }),
  new T.Test("STOREB instruction off", function() {
    R.r1 = util.convertBinaryToInt("01010101");

    I.STOREB("r1", 0, 8 );

    T.assertEquals(simulator.MEM.read(8), util.convertBinaryToInt("01010101"))
  }),

  new T.Test("JP instruction with cond=true", function() {
    R.pc = 8;

    I.JP("_NN/P", 16);

    T.assertEquals(R.pc, 12);
  }),
  new T.Test("JP instruction with cond=false", function() {
    R.pc = 8;

    I.JP("_N/M", 16);

    T.assertEquals(R.pc, 8);
  }),
  new T.Test("JP instruction with register", function() {
    R.pc = 8;
    R.r1 = 16;

    I.JP("", "r1");

    T.assertEquals(R.pc, 12);
  }),
  new T.Test("JP instruction with wrongly aligned address", function() {
    R.pc = 8;

    I.JP("", 18);

    T.assertEquals(R.pc, 12);
  }),

  new T.Test("JR instruction with cond=true", function() {
    R.pc = 8;

    I.JR("_NN/P", 8);

    T.assertEquals(R.pc, 12);
  }),
  new T.Test("JR instruction with cond=false", function() {
    R.pc = 8;

    I.JR("_N/M", 8);

    T.assertEquals(R.pc, 8);
  }),
  new T.Test("JR instruction with wrongly aligned address", function() {
    R.pc = 8;

    I.JR("", 10);

    T.assertEquals(R.pc, 12);
  }),

  new T.Test("CALL instruction with cond=true", function() {
    R.pc = 8;
    R.r7 = 128;

    I.CALL("_NN/P", 16);

    T.assertEquals(R.pc, 12);
    T.assertEquals(R.r7, 124);
    T.assertEquals(simulator.MEM.read(124), 8);
  }),
  new T.Test("CALL instruction with cond=false", function() {
    R.pc = 8;
    R.r7 = 128;

    I.CALL("_N/M", 16);

    T.assertEquals(R.pc, 8);
    T.assertEquals(R.r7, 128);
    T.assertEquals(simulator.MEM.read(124), 0);
  }),
  new T.Test("CALL instruction with wrongly aligned address", function() {
    R.pc = 8;
    R.r7 = 128;

    I.CALL("", 18);

    T.assertEquals(R.pc, 12);
    T.assertEquals(R.r7, 124);
    T.assertEquals(simulator.MEM.read(124), 8);
  }),
  new T.Test("Call instruction with register", function() {
    R.pc = 8;
    R.r7 = 128;
    R.r1 = 16;

    I.CALL("_N/M", "r1");

    T.assertEquals(R.pc, 8);
    T.assertEquals(R.r7, 128);
    T.assertEquals(simulator.MEM.read(124), 0);
  }),

  new T.Test("RET instruction with cond=true", function() {
    R.pc = 12;
    R.r7 = 124;
    simulator.MEM.write(124, 8);

    I.RET("_NN/P", false, false);

    T.assertEquals(R.pc, 8);
    T.assertEquals(R.r7, 128);
    T.assertEquals(simulator.MEM.read(124), 8);
    T.assertEquals(simulator.CPU._getFlag(F.GIE), 0);
    T.assertEquals(R.iif, 1);
  }),
  new T.Test("RET instruction with cond=false", function() {
    R.pc = 12;
    R.r7 = 124;
    simulator.MEM.write(124, 8);

    I.RET("_N/M", false, false);

    T.assertEquals(R.pc, 12);
    T.assertEquals(R.r7, 124);
    T.assertEquals(simulator.MEM.read(124), 8);
    T.assertEquals(simulator.CPU._getFlag(F.GIE), 0);
    T.assertEquals(R.iif, 1);
  }),
  new T.Test("RETI instruction", function() {
    R.pc = 12;
    R.r7 = 124;
    simulator.MEM.write(124, 8);

    I.RET("", true, false);

    T.assertEquals(R.pc, 8);
    T.assertEquals(R.r7, 128);
    T.assertEquals(simulator.MEM.read(124), 8);
    T.assertEquals(simulator.CPU._getFlag(F.GIE), 1);
    T.assertEquals(R.iif, 1);
  }),
  new T.Test("RETN instruction", function() {
    R.pc = 12;
    R.r7 = 124;
    R.sr = 0;
    simulator.MEM.write(124, 8);

    I.RET("", false, true);

    T.assertEquals(R.pc, 8);
    T.assertEquals(R.r7, 128);
    T.assertEquals(simulator.MEM.read(124), 8);
    T.assertEquals(simulator.CPU._getFlag(F.GIE), 0);
    T.assertEquals(R.iif, 1);
  }),

  new T.Test("HALT instruction with cond=true", function() {
    var onStop = false;

    simulator.CPU.onStop = function() {
      onStop = true;
    };

    I.HALT("_NN/P");

    T.assertEquals(onStop, true);
  }),
  new T.Test("HALT instruction with cond=false", function() {
    var onStop = false;

    simulator.CPU.onStop = function() {
      onStop = true;
    };

    I.HALT("_N/M");

    T.assertEquals(onStop, false);
  }),

];

module.exports.stats = T.runTests(tests, {
  testSetUp: function() {
    var instr;
    simulator = new FRISC();
    simulator.CPU.reset();
    simulator.MEM.reset();
    R = simulator.CPU._r;
    F = simulator.CPU._f;
    I = {};
    for (instr in simulator.CPU._i) {
      I[instr] = simulator.CPU._i[instr].bind(simulator.CPU);
    }
  },
});
