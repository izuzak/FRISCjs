console.log("Running " + __filename + "...");

var T = require("./node-test-framework.js");
var FRISC = require("./../lib/index.js").simulator;
var util = require("./../lib/index.js").util;

// global test state
var simulator;

var tests = [
  new T.Test("Test memory single byte read", function() {
    simulator.MEM._memory[2] = util.convertBinaryToInt("00000110");
    simulator.MEM._memory[3] = util.convertBinaryToInt("00000111");
    simulator.MEM._memory[4] = util.convertBinaryToInt("00001000");
    simulator.MEM._memory[5] = util.convertBinaryToInt("00001001");

    T.assertEquals(simulator.MEM.readb(2), util.convertBinaryToInt("00000110"));
    T.assertEquals(simulator.MEM.readb(3), util.convertBinaryToInt("00000111"));
    T.assertEquals(simulator.MEM.readb(4), util.convertBinaryToInt("00001000"));
    T.assertEquals(simulator.MEM.readb(5), util.convertBinaryToInt("00001001"));
    T.assertEquals(simulator.MEM.readb(0), 0);
    T.assertEquals(simulator.MEM.readb(1), 0);
    T.assertEquals(simulator.MEM.readb(6), 0);
    T.assertEquals(simulator.MEM.readb(7), 0);
  }),
  new T.Test("Test memory half-word read", function() {
    simulator.MEM._memory[2] = util.convertBinaryToInt("00000110");
    simulator.MEM._memory[3] = util.convertBinaryToInt("00000111");
    simulator.MEM._memory[4] = util.convertBinaryToInt("00001000");
    simulator.MEM._memory[5] = util.convertBinaryToInt("00001001");

    T.assertEquals(simulator.MEM.readw(2), util.convertBinaryToInt("0000011100000110"));
    T.assertEquals(simulator.MEM.readw(3), util.convertBinaryToInt("0000100000000111"));
    T.assertEquals(simulator.MEM.readw(4), util.convertBinaryToInt("0000100100001000"));
    T.assertEquals(simulator.MEM.readw(0), 0);
    T.assertEquals(simulator.MEM.readw(1), util.convertBinaryToInt("0000011000000000"));
    T.assertEquals(simulator.MEM.readw(5), util.convertBinaryToInt("0000000000001001"));
    T.assertEquals(simulator.MEM.readw(6), 0);
  }),
  new T.Test("Test memory word read", function() {
    simulator.MEM._memory[2] = util.convertBinaryToInt("00000110");
    simulator.MEM._memory[3] = util.convertBinaryToInt("00000111");
    simulator.MEM._memory[4] = util.convertBinaryToInt("00001000");
    simulator.MEM._memory[5] = util.convertBinaryToInt("00001001");

    T.assertEquals(simulator.MEM.read(2), util.convertBinaryToInt("00001001000010000000011100000110"));
    T.assertEquals(simulator.MEM.read(0), util.convertBinaryToInt("00000111000001100000000000000000"));
    T.assertEquals(simulator.MEM.read(4), util.convertBinaryToInt("00000000000000000000100100001000"));
    T.assertEquals(simulator.MEM.read(6), 0);
  }),
  new T.Test("Test memory single byte write", function() {
    simulator.MEM.writeb(2, util.convertBinaryToInt("00000110"));
    simulator.MEM.writeb(3, util.convertBinaryToInt("00000111"));

    T.assertEquals(simulator.MEM._memory[2], util.convertBinaryToInt("00000110"));
    T.assertEquals(simulator.MEM._memory[3], util.convertBinaryToInt("00000111"));
    T.assertEquals(simulator.MEM._memory[0], 0);
    T.assertEquals(simulator.MEM._memory[1], 0);
    T.assertEquals(simulator.MEM._memory[4], 0);
    T.assertEquals(simulator.MEM._memory[5], 0);
  }),
  new T.Test("Test memory half-word write", function() {
    simulator.MEM.writew(2, util.convertBinaryToInt("0000011100000110"));
    simulator.MEM.writew(4, util.convertBinaryToInt("0000100100001000"));

    T.assertEquals(simulator.MEM._memory[2], util.convertBinaryToInt("00000110"));
    T.assertEquals(simulator.MEM._memory[3], util.convertBinaryToInt("00000111"));
    T.assertEquals(simulator.MEM._memory[4], util.convertBinaryToInt("00001000"));
    T.assertEquals(simulator.MEM._memory[5], util.convertBinaryToInt("00001001"));
    T.assertEquals(simulator.MEM._memory[0], 0);
    T.assertEquals(simulator.MEM._memory[1], 0);
    T.assertEquals(simulator.MEM._memory[6], 0);
    T.assertEquals(simulator.MEM._memory[7], 0);
  }),
  new T.Test("Test memory word write", function() {
    simulator.MEM.write(2, util.convertBinaryToInt("00001001000010000000011100000110"));

    T.assertEquals(simulator.MEM._memory[2], util.convertBinaryToInt("00000110"));
    T.assertEquals(simulator.MEM._memory[3], util.convertBinaryToInt("00000111"));
    T.assertEquals(simulator.MEM._memory[4], util.convertBinaryToInt("00001000"));
    T.assertEquals(simulator.MEM._memory[5], util.convertBinaryToInt("00001001"));
    T.assertEquals(simulator.MEM._memory[0], 0);
    T.assertEquals(simulator.MEM._memory[1], 0);
    T.assertEquals(simulator.MEM._memory[6], 0);
    T.assertEquals(simulator.MEM._memory[7], 0);
  }),
  new T.Test("Test memory load loadByteString", function() {
    var data1 = ["00000000", "00000000", "00000110", "00000111", "00001000", "00001001"];
    var data2 = [];

    for (var i=0; i<data1.length; i++) {
      data2[i] = String.fromCharCode(util.convertBinaryToInt(data1[i]));
    }

    simulator.MEM.loadByteString(data2.join(""));

    T.assertEquals(simulator.MEM._memory[2], util.convertBinaryToInt("00000110"));
    T.assertEquals(simulator.MEM._memory[3], util.convertBinaryToInt("00000111"));
    T.assertEquals(simulator.MEM._memory[4], util.convertBinaryToInt("00001000"));
    T.assertEquals(simulator.MEM._memory[5], util.convertBinaryToInt("00001001"));
    T.assertEquals(simulator.MEM._memory[0], 0);
    T.assertEquals(simulator.MEM._memory[1], 0);
    T.assertEquals(simulator.MEM._memory[6], 0);
    T.assertEquals(simulator.MEM._memory[7], 0);
  }),
  new T.Test("Test memory load loadBytes", function() {
    var data1 = ["00000000", "00000000", "00000110", "00000111", "00001000", "00001001"];
    var data2 = [];

    for (var i=0; i<data1.length; i++) {
      data2[i] = util.convertBinaryToInt(data1[i]);
    }

    simulator.MEM.loadBytes(data2);

    T.assertEquals(simulator.MEM._memory[2], util.convertBinaryToInt("00000110"));
    T.assertEquals(simulator.MEM._memory[3], util.convertBinaryToInt("00000111"));
    T.assertEquals(simulator.MEM._memory[4], util.convertBinaryToInt("00001000"));
    T.assertEquals(simulator.MEM._memory[5], util.convertBinaryToInt("00001001"));
    T.assertEquals(simulator.MEM._memory[0], 0);
    T.assertEquals(simulator.MEM._memory[1], 0);
    T.assertEquals(simulator.MEM._memory[6], 0);
    T.assertEquals(simulator.MEM._memory[7], 0);
  }),
  new T.Test("Test memory load loadBinaryString", function() {
    var data1 = ["00000000", "00000000", "00000110", "00000111", "00001000", "00001001"];
    var data2 = [];

    for (var i=0; i<data1.length; i++) {
      data2[i] = data1[i];
    }

    simulator.MEM.loadBinaryString(data2);

    T.assertEquals(simulator.MEM._memory[2], util.convertBinaryToInt("00000110"));
    T.assertEquals(simulator.MEM._memory[3], util.convertBinaryToInt("00000111"));
    T.assertEquals(simulator.MEM._memory[4], util.convertBinaryToInt("00001000"));
    T.assertEquals(simulator.MEM._memory[5], util.convertBinaryToInt("00001001"));
    T.assertEquals(simulator.MEM._memory[0], 0);
    T.assertEquals(simulator.MEM._memory[1], 0);
    T.assertEquals(simulator.MEM._memory[6], 0);
    T.assertEquals(simulator.MEM._memory[7], 0);
  }),
];

module.exports.stats = T.runTests(tests, {
  testSetUp: function() {
    simulator = new FRISC();
    simulator.MEM.reset();
  },
});
