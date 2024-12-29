FRISCjs
=======

FRISCjs is a [FRISC processor](http://www.fer.hr/rasip/knjige/frisc) simulator written in JavaScript.

<img src="https://raw.github.com/izuzak/FRISCjs/master/friscjs-screenshot.png" />

The FRISCjs simulator has two parts: a [FRISC assembler](src/friscasm.peg) (built using PEGjs) which translates FRISC assembly code to machine code and a [FRISC CPU simulator](src/friscsim.js) which executes machine code.

Furthermore, there are two user interfaces to the simulator: a [Web application graphical interface](webapp/index.html) and a [NodeJS command-line interface](consoleapp/frisc-console.js).
The Web application interface is available [here](http://izuzak.github.com/FRISCjs/webapp/) and supports many cool features like breakpoints and step-by-step execution.

## Usage

### Using the assembler and simulator libraries

In node, install using npm:

    > npm install friscjs

and then access the assembler and simulator:

    var friscjs = require("friscjs");
    var asm = friscjs.assembler;
    var sim = friscjs.simulator;

In a browser, link to the browser script that contains both the assembler and simulator:

    <script src="lib/friscjs-browser.js"></script>

and then access the assembler and simulator:

    var asm = friscjs.assembler;
    var sim = friscjs.simulator;

After installing the libraries, check out the [FRISCjs API docs](API.markdown) for instructions on using them.

### Using the simulator console and Web applications

To use the Web-based simulator, launch the `webapp/index.html` page in a browser or access the on-line version at [http://izuzak.github.com/FRISCjs/webapp/](https://izuzak.github.com/FRISCjs/webapp/).

To use the console-based simulator application, clone the FRISCjs repo:

    > git clone https://github.com/izuzak/FRISCjs.git

and then run the app with node to see the instructions:

    > node ./consoleapp/frisc-console.js

## Development

1. Fork and/or clone repo: `git clone https://github.com/izuzak/FRISCjs.git`
2. Change dir to noam: `cd FRISCjs`
3. Install dependencies: `npm install`
4. Make changes to noam sources (`./src`), tests (`./tests`) or apps (`./webapp/*` and `./consoleapp/*`)
5. Build using grunt: `grunt` (on linux), `grunt.cmd` (on windows)
6. Run tests: `npm test`
7. Fix issues reported by grunt and tests, and then repeat 5)
8. Commit, push and make a pull request, or send a git patch by e-mail
9. E-mail me if you have questions (e-mail address is below)

## Similar projects

This project was inspired by the [GameBoy emulator in JavaScript](http://imrannazar.com/GameBoy-Emulation-in-JavaScript:-The-CPU) and [jsLinux](http://bellard.org/jslinux/tech.html) projects.
There are many other processor simulators in JavaScript, such as the [GameBoy Color emulator](https://github.com/grantgalitz/GameBoy-Online), [visual transistor-level simulation of the 6502 CPU](http://www.visual6502.org/JSSim/expert.html), [6502 compatible assembler and emulator](http://www.6502asm.com/), [PicoBlaze Assembler and Emulator in JavaScript](https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS), and this [other 6502 CPU simulator](http://skilldrick.github.com/easy6502/).

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

[![gaugestracking alpha](https://secure.gaug.es/track.gif?h[site_id]=5162c171f5a1f5418800004a&h[resource]=http%3A%2F%2Fgithub.com%2Fizuzak%2FFRISCjs&h[title]=FRISCjs%20%28GitHub%29&h[unique]=1&h[unique_hour]=1&h[unique_day]=1&h[unique_month]=1&h[unique_year]=1 "ivanzuzak.info")](http://ivanzuzak.info/)
