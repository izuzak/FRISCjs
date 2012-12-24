var fs = require("fs");
var path = require("path");
var parser = require("./friscasm.js");
var sim = require("./friscjs.js").FRISC;

var argv = process.argv;
var isVerboseMode = argv.indexOf("-v") > -1;

if (isVerboseMode) {
  argv.splice(argv.indexOf("-v"), 1);
}

var debug = function(str) {
  if (isVerboseMode) {
    console.error(str);
  }
};

var cpufreq = 1000;

if (argv.indexOf("-cpufreq") > -1) {
  cpufreq = parseInt(argv[argv.indexOf("-cpufreq") + 1]);
  argv.splice(argv.indexOf("-cpufreq") + 1, 1);
  argv.splice(argv.indexOf("-cpufreq"), 1);
}

var memsize = 256*1024;

if (argv.indexOf("-memsize") > -1) {
  memsize = 1024*parseInt(argv[argv.indexOf("-memsize") + 1]);
  argv.splice(argv.indexOf("-memsize") + 1, 1);
  argv.splice(argv.indexOf("-memsize"), 1);
}

console.error("");
console.error("*********************************************************");
console.error("** FRISCjs - FRISC simulator in JavaScript");
console.error("** ");
console.error("** Usage instructions:");
console.error("** ");
console.error("**   pass filename argument with the FRISC program:");
console.error("**     > node main.js filename");
console.error("**   or input the FRISC program via stdin:");
console.error("**     > cat filename | node main.js");
console.error("** ");
console.error("** Note: the simulator has a memory module of 256KB,");
console.error("**       i.e. from 0x00000000 to 0x0003FFFF.");
console.error("** ");
console.error("** Verbose debugging mode can be turned on by passing");
console.error("**   specifying the -v flag, e.g.:");
console.error("** ");
console.error("**     > node main.js -v filename");
console.error("**   or");
console.error("**     > cat filename | node main.js -v");
console.error("** ");
console.error("** The CPU frequency (in Hz) can be set with the -cpufreq");
console.error("**   flag argument (default value is 1000):");
console.error("** ");
console.error("**     > node main.js -cpufreq 2 filename");
console.error("**   or");
console.error("**     > cat filename | node main.js -cpufreq 2");
console.error("** ");
console.error("** Memory size (in number of 1K locations) can be set with");
console.error("**   the -memsize flag argument (default value is 256):");
console.error("** ");
console.error("**     > node main.js -memsize 64 filename");
console.error("**   or");
console.error("**     > cat filename | node main.js -memsize 64");
console.error("** ");
console.error("** Execution flow:");
console.error("** ");
console.error("**   1) compilation of the FRISC program to machine code ");
console.error("**   2) step-by-step execution of FRISC program ");
console.error("**      with logging of processor state at each step  ");
console.error("**      to stderr (if in verbose mode)");
console.error("**   3) output of r6 to stdout after program execution");
console.error("** ");
console.error("** GUI version of FRISC simulator is available at:");
console.error("** ");
console.error("**   http://fer-ppj.github.com/FRISCjs/main.html");
console.error("** ");
console.error("** Bug reports:");
console.error("** ");
console.error("**   mailto:ppj@zemris.fer.hr, or ");
console.error("**   http://github.com/fer-ppj/FRISCjs/issues");
console.error("*********************************************************");
console.error("");

// determine method for acquiring the input program
if (argv.length > 2) {
  // the process is passed an argument which points to a filename with the
  // program
  var filename = path.normalize(argv[2]);

  console.error("");
  console.error("*********************************************************");
  console.error("Reading program from file: " + filename); 
  console.error("*********************************************************");
  console.error("");

  if (!(fs.existsSync(filename))) {
    console.error("ERROR: File does not exist!");
    console.log("ERROR");
  } else {
    var program = fs.readFileSync(filename);
    runProgram(program);
  }
} else {
  // the process should read the program from process.stdin

  console.error("");
  console.error("*********************************************************");
  console.error("Reading program from stdin, line-by-line.");
  console.error("Press CTRL+D to stop reading and execute program.");
  console.error("*********************************************************");
  console.error("");
  
  var program = "";
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', function (chunk) {
    program += chunk;
  });
  
  process.stdin.on('end', function () {
    runProgram(program);
  });
}

function cpuStateToString(simulator) {
  var retVal = "";
  
  for (var key in simulator.CPU._r) {
    if (key !== 'sr') {
      retVal += key + ": " + simulator.CPU._r[key].toString() + " ";
    } else {
      retVal += key + ": " + simulator.CPU._r[key].toString() + " ( ";
      for (var flag in simulator.CPU._f) {
        retVal += flag + ": " + simulator.CPU._getFlag(simulator.CPU._f[flag]) + " ";
      }
      retVal += ") ";
    }
  }

  return retVal;
}

function instructionToString(instruction) {
  if (typeof instruction.args === 'undefined' || instruction.args === null) {
    return instruction.op;
  } else {
    return instruction.op + " " + instruction.args.join(" ");
  }
}

function runProgram(frisc_asmsource) {
  console.error("");
  console.error("*********************************************************");
  console.error("Input FRISC program:");
  console.error("*********************************************************");
  console.error("");

  console.error(frisc_asmsource.toString());

  console.error("");
  console.error("*********************************************************");
  console.error("Parsing input FRISC program.");
  console.error("*********************************************************");
  console.error("");

  try {
    var result = parser.parse(frisc_asmsource.toString());
  } catch (e) { 
    console.error("Parsing error on line " + e.line + " column " + e.column + " -- " + e.toString());
    return;
  }

  simulator = new sim();
  simulator.MEM._size = memsize;
  simulator.CPU._frequency = cpufreq;

  simulator.CPU.onBeforeRun = function() {
    console.error("");
    console.error("*********************************************************");
    console.error("Starting simulation!");
    console.error("*********************************************************");
    console.error("");
  };
  
  simulator.CPU.onBeforeCycle = function() {
    debug("");
    debug("*********************************************************");
    debug("New CPU cycle starting!");
    debug("*********************************************************");
    debug("");
    debug("## CPU state: " + cpuStateToString(simulator));
  };

  simulator.CPU.onAfterCycle = function() {
    debug("## CPU state: " + cpuStateToString(simulator));
  };
  
  simulator.CPU.onBeforeExecute = function(instruction) {
    debug("## Executing FRISC instruction: " + instructionToString(instruction));
  };
  
  simulator.CPU.onStop = function() {
    console.error("");
    console.error("*********************************************************");
    console.error("FRISC processor stopped! Status of CPU R6: " + simulator.CPU._r.r6);
    console.error("*********************************************************");
    console.error("");
    console.log(simulator.CPU._r.r6);
  };
  
  try {
    simulator.MEM.loadBinaryString(result.mem);
  } catch (e) {
    console.error("Loading error -- " + e.toString());
    return;
  }
  
  simulator.CPU.run();
} 
