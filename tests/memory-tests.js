console.log("Running " + __filename + "...");

var T = require("./node-test-framework.js");
var FRISC = require("../friscjs.js").FRISC;
var util = require("../friscjs.js").util;

var tests = [
  new T.Test("Test memory single byte read", function() {
    var simulator = new FRISC();
    simulator.MEM.reset();
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
    var simulator = new FRISC();
    simulator.MEM.reset();
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
    var simulator = new FRISC();
    simulator.MEM.reset();
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
    var simulator = new FRISC();
    simulator.MEM.reset();

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
    var simulator = new FRISC();
    simulator.MEM.reset();

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
    var simulator = new FRISC();
    simulator.MEM.reset();

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
];

T.runTests(tests);
