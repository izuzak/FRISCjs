console.log("Running " + __filename + "...");

var T = require("./node-test-framework.js");
var code = require("../friscjs.js").util;

var tests = [
  new T.Test("convertIntToBinary values", function() {
    T.assertEquals(code.convertIntToBinary(0x5, 4), "0101");
    T.assertEquals(code.convertIntToBinary(0xf, 5), "01111");
    T.assertEquals(code.convertIntToBinary(0x0, 6), "000000");

    T.assertEquals(code.convertIntToBinary(0x5, 8), "00000101");
    T.assertEquals(code.convertIntToBinary(0xab, 8), "10101011");

    T.assertEquals(code.convertIntToBinary(0xdeadbeef, 32), "11011110101011011011111011101111");
  }),
  new T.Test("convertIntToBinary high bits truncated", function() {
    T.assertEquals(code.convertIntToBinary(0x1234, 4), "0100");
    T.assertEquals(code.convertIntToBinary(0x1234, 6), "110100");
    T.assertEquals(code.convertIntToBinary(0x1234, 8), "00110100");
  }),
  new T.Test("convertIntToBinary negative numbers => two's complement", function() {
    T.assertEquals(code.convertIntToBinary(-1, 4), "1111");
    T.assertEquals(code.convertIntToBinary(-33, 8), "11011111");
    T.assertEquals(code.convertIntToBinary(-32, 16), "1111111111100000");
  }),

  new T.Test("convertBinaryToInt unsigned", function() {
    T.assertEquals(code.convertBinaryToInt("0"), 0);
    T.assertEquals(code.convertBinaryToInt("1"), 1);
    T.assertEquals(code.convertBinaryToInt("101"), 5);
    T.assertEquals(code.convertBinaryToInt("10100101"), 0xa5);
  }),
  new T.Test("convertBinaryToInt signed nonegative", function() {
    T.assertEquals(code.convertBinaryToInt("00", true), 0);
    T.assertEquals(code.convertBinaryToInt("01", true), 1);
    T.assertEquals(code.convertBinaryToInt("0101", true), 5);
    T.assertEquals(code.convertBinaryToInt("010100101", true), 0xa5);
  }),
  new T.Test("convertBinaryToInt signed negative", function() {
    T.assertEquals(code.convertBinaryToInt("10", true), -2);
    T.assertEquals(code.convertBinaryToInt("111", true), -1);
    T.assertEquals(code.convertBinaryToInt("111111111111111", true), -1);
    T.assertEquals(code.convertBinaryToInt("1111111111100000", true), -32);
  }),
  new T.Test("convertBinaryToInt error conditions", function() {
    T.assertThrows(function() { code.convertBinaryToInt(""); });
    T.assertThrows(function() { code.convertBinaryToInt("10", 2); });
    T.assertThrows(function() { code.convertBinaryToInt("12"); });
  }),
];

T.runTests(tests);
