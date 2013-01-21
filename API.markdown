# FRISC API

## Introduction

FRISCjs user interfaces (the [browser Web app](https://github.com/izuzak/FRISCjs/blob/master/main.html) and [NodeJs console app](https://github.com/izuzak/FRISCjs/blob/master/main.js)) are built as a layer on top of two generic, pure-JavaScript libraries.
This document describes the API of these two libraries: the FRISC assembler and the FRISC simulator.
Using this API, other user interfaces may be built for any platform supporting JavaScript.

## Installation

In node, install using npm:

    npm install friscjs

and then access the assembler and simulator:

    var friscjs = require("friscjs");
    var asm = friscjs.assembler;
    var sim = friscjs.simulator;

In a browser, link to the browser script that contains both the assembler and simulator:

    <script src="lib/friscjs-browser.js"></script>

and then access the assembler and simulator:

    var asm = friscjs.assembler;
    var sim = friscjs.simulator;

## FRISC assembler

The assembler used for assembling FRISC source code using the ``parse()`` method:

``var result = asm.parse(frisc_code_string);``

where ``frisc_code_string`` is a single string containing FRISC code.
E.g.:

    lab1 ADD R1, R2, R3
    lab2 ADD r2, 5, r5

The result of invoking ``parse()`` is a ``result`` object containing two properties: ``result.mem`` and ``result.ast``.

``result.ast`` is the parser AST output and should be used for debugging purposes only.
It is an array of parse objects, one for each instruction in the source code.
E.g.:

    [ { op: 'ADD',
       optype: 'aluop',
       alusrc1: { type: 'reg', value: [ 'R', '1' ] },
       alusrc2: { type: 'reg', value: [ 'R', '2' ] },
       aludest: { type: 'reg', value: [ 'R', '3' ] },
       curloc: 0,
       line: 2,
       machineCode: '00100000000000000000000000000000' },
     { op: 'ADD',
       optype: 'aluop',
       alusrc1: { type: 'reg', value: [ 'r', '2' ] },
       alusrc2: { type: 'num', value: 5 },
       aludest: { type: 'reg', value: [ 'r', '5' ] },
       curloc: 4,
       line: 3,
       machineCode: '00100100000000000000000000000101' },
    ]

``result.mem`` is the binary code of the assembled program, which should be loaded into the FRISC simulator.
The binary code is an array of 8-character strings, each string representing the binary value to be stored in FRISC memory at that location.
E.g.:

``[ '00000000', '00000000', '00000000', '00100000', '00000101', '00000000', '00000000', '00100100' ]``

In case of parsing errors, the ``parse()`` method will throw an exception which contains ``line`` and ``column`` properties which denote the line and column at which the parsing error occured:

    try {
      var result = asm.parse(frisc_code_string);
    } catch (e) {
      console.log("Parsing error on line " + e.line + " column " + e.column + " -- " + e.toString());
    }

## FRISC simulator

The simulator is a constructor for instantiating FRISCjs simulator objects:

``var simulator = new sim();``

A simulator instance object exposes two FRISC components: FRISC memory (`simulator.MEM`) and FRISC cpu (`simulator.MEM`).

### FRISC memory component

The FRISC memory component exposes the following data properties and functions:

* ``MEM._size`` - the size of the memory defined as the number of 1-byte locations. By default, the memory has 256*1024 locations, or 256K.
* ``MEM._memory`` - the memory array itself, containing integers representing bytes at specific locations.

* ``MEM.reset()`` - helper function that sets the value of each memory location to 0.

* ``MEM.loadByteString(program)``, ``MEM.loadBytes(program)``, ``MEM.loadBinaryString(program)`` - helper functions for loading binary FRISC code into memory. ``loadBinaryString`` should be used to load the result of the FRISC assember into the memory:
``simulator.MEM.loadBinaryString(result.mem);``

* ``MEM.readb(addr)``, ``MEM.readw(addr)``, ``MEM.read(addr)`` - helper functions for reading a 1B, 2B or 4B integer value from locations starting from addr.

* ``MEM.writeb(addr, val)``, ``MEM.writeb(addr, val)``, ``MEM.write(addr, val)`` - helper functions for writing a 1B, 2B or 4B integer value val to locations starting from addr.

### FRISC cpu component

The FRISC cpu component exposes the following data properties and functions:

* ``CPU._r`` - a map of the registers of the FRISC cpu: ``{r0:0, r1:0, r2:0, r3:0, r4:0, r5:0, r6:0, r7:0, pc:0, sr:0, iif:1}``
* ``CPU._frequency`` - an integer defining the frequency of the cpu in Hz, by default 1 (Hz).

* ``CPU.run()`` - starts or resumes the cpu, periodically calling ``CPU.performCylce``
* ``CPU.pause()`` - pauses cpu execution
* ``CPU.stop()`` - stops cpu execution
* ``CPU.performCycle()`` - executes one FRISC instruction pointed to by the program counter
* ``CPU.reset()`` - resets the state of the cpu, setting register values to 0 and iif to 1
* ``CPU._decode(instruction)`` - decodes a FRISC instruction (passed as an integer) and returns the instruction's operation name and parameters

The FRISC cpu component also invokes the following event handlers, if they are specified:

* ``CPU.onStop()`` - invoked after the ``CPU.stop()`` method was called
* ``CPU.onBeforeRun()`` - invoked after the ``CPU.run()`` method was called
* ``CPU.onBeforeCycle()`` - invoked at the start of every invocation of ``CPU.performCycle()``
* ``CPU.onBeforeExecute(instruction)`` - invoked during every invocation of ``CPU.performCycle()``, after the instruction to be executed was decoded, but before its execution
* ``CPU.onAfterCycle()`` - invoked at the end of every invocation of ``CPU.performCylce()``

Here is an example of setting an event handler that outputs the FRISC cpu register state after the cpu was stopped:

    simulator.CPU.onStop = function() {
      console.log("FRISC processor stopped!");
      console.log("STATUS of registers:", simulator.CPU._r);
    };
