FRISCjs
=======

FRISCjs is a [FRISC processor](http://www.fer.hr/rasip/knjige/frisc) simulator written in JavaScript.

<img src="https://raw.github.com/izuzak/FRISCjs/master/friscjs-screenshot.png" />

The FRISCjs simulator has two parts: a [FRISC assembler](https://github.com/izuzak/FRISCjs/blob/master/friscasm.pegjs) (built using PEGjs) which translates FRISC assembly code to machine code and a [FRISC CPU simulator](https://github.com/izuzak/FRISCjs/blob/master/friscjs.js) which executes machine code.

Furthermore, there are two user interfaces to the simulator: a [Web application graphical interface](https://github.com/izuzak/FRISCjs/blob/master/main.html) and a [NodeJS command-line interface](https://github.com/izuzak/FRISCjs/blob/master/main.js). 
The Web application interface is available [here](https://izuzak.github.com/FRISCjs/main.html) and supports many cool features like breakpoints and step-by-step execution.

## FRISCjs API

The API of the core FRISCjs components is described [here](https://github.com/izuzak/FRISCjs/blob/master/API.markdown).

## Similar projects

This project was inspired by the [GameBoy emulator in JavaScript](http://imrannazar.com/GameBoy-Emulation-in-JavaScript:-The-CPU) and [jsLinux](http://bellard.org/jslinux/tech.html) projects.
There are many other processor simulators in JavaScript, such as the [visual transistor-level simulation of the 6502 CPU](http://www.visual6502.org/JSSim/expert.html), [6502 compatible assembler and emulator](http://www.6502asm.com/) and this [other 6502 CPU simulator](http://skilldrick.github.com/easy6502/).

## Credits

FRISCjs was developed by [Ivan Zuzak](http://ivanzuzak.info). Contributors: [Ivan Budiselic](https://github.com/ibudiselic), [Stanko Krtalic](https://github.com/Stankec).

FRISCjs is built with many open-source projects: 

 * [PegJS](https://github.com/dmajda/pegjs) - used for generating the FRISC assembly code parser. 
 * [NodeJS](https://github.com/joyent/node) - used for the command-line version of the simulator.
 * [jQuery](http://jquery.com) - used for the Web application version of the simulator.
 * [Bootstrap](http://twitter.github.com/bootstrap) - used for the Web application version of the simulator.
 * [Ace](http://ace.ajax.org/) - used as the editor for the Web application version of the simulator.
 * [Mustache](https://github.com/janl/mustache.js/) - used for client-side templates. 
 * [Keymaster](https://github.com/madrobby/keymaster) - used for reconfiguring/disabling keyboard shortcuts. 

## License

Licensed under the [Apache 2.0 License](https://github.com/izuzak/FRISCjs/blob/master/LICENSE.markdown).
