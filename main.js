var fs = require("fs");
var parser = require("./friscasm.js");
var sim = require("./friscjs.js").FRISC;
simulator = new sim();

var frisc_asmsource = fs.readFileSync("frisc_test1.asm");

console.log(frisc_asmsource.toString());

var result = parser.parse(frisc_asmsource.toString());

console.log(result.ast);

simulator.MEM.loadBinaryString(result.mem);
simulator.CPU.run();
