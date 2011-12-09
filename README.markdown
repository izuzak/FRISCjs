FRISCjs
=======

FRISCjs is a [FRISC processor](http://www.fer.hr/rasip/knjige/frisc) simulator written in JavaScript.
This project was inspited by the [GameBoy emulator in JavaScript](http://imrannazar.com/GameBoy-Emulation-in-JavaScript:-The-CPU) and [jsLinux](http://bellard.org/jslinux/tech.html).

## 

The FRISCjs simulator has two parts: a [FRISC assembler](https://github.com/izuzak/FRISCjs/blob/master/friscasm.pegjs) (built using PEGjs) which translates FRISC assembly code to machine code and a [FRISC CPU simulator](https://github.com/izuzak/FRISCjs/blob/master/friscjs.js) which executes machine code.

Furthermore, there are two user interfaces to the simulator: a [Web application graphical interface](https://github.com/izuzak/FRISCjs/blob/master/main.html) and a [NodeJS command-line interface](https://github.com/izuzak/FRISCjs/blob/master/main.js). 
The Web application interface is available [here](https://izuzak.github.com/FRISCjs/main.html).

## Credits

FRISCjs was developed by [Ivan Zuzak](http://ivanzuzak.info). Contributors: [Ivan Budiselic](https://github.com/ibudiselic).

FRISCjs is built with many open-source projects: 

 * [PegJS](https://github.com/dmajda/pegjs) - used for generating the FRISC assembly code parser. 
 * [NodeJS](https://github.com/joyent/node) - used for the command-line version of the simulator.
 * [jQuery](http://jquery.com) - used for the Web application version of the simulator.
 * [Bootstrap](http://twitter.github.com/bootstrap) - used for the Web application version of the simulator.
 * [Ace](http://ace.ajax.org/) - used as the editor for the Web application version of the simulator.

## License

Licensed under the [Apache 2.0 License](https://github.com/izuzak/FRISCjs/blob/master/LICENSE.markdown).
