var fs = require("fs");
var parser = require("./friscasm.js");
var sim = require("./friscjs.js").FRISC;
simulator = new sim();

var frisc_asmsource = fs.readFileSync("frisc_test1.asm");

console.log(frisc_asmsource.toString());

var result = parser.parse(frisc_asmsource.toString());

console.log(result.ast);

simulator.CPU.onBeforeRun = function() {
  console.log("Starting (or continuing) simulation!");
  console.log(simulator.CPU._r);
};

simulator.CPU.onBeforeCycle = function() {
  console.log("New FRISC cycle starting!");
  console.log(simulator.CPU._r);
};

simulator.CPU.onBeforeExecute = function(instruction) {
  console.log("Executing FRISC instruction!");
  console.log(instruction);
};

simulator.CPU.onStop = function() {
  console.log("FRISC processor stopped!");
  console.log(simulator.CPU._r);
};

simulator.MEM.loadBinaryString(result.mem);
simulator.CPU.run();
