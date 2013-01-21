if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = {};

    module.exports.assembler = require('./../src/friscasm.js');
    var simulator = require('./../src/friscsim.js');

    module.exports.simulator = simulator.FRISC;
    module.exports.util = simulator.util;
} else if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    friscjs = {};

    friscjs.assembler = frisc_asm;
    friscjs.simulator = FRISC;
    friscjs.util = {
        convertIntToBinary: convertIntToBinary,
        convertBinaryToInt: convertBinaryToInt,
        getBitString: getBitString,
        extend: extend,
        twosComplement: twosComplement,
        generateStringOfCharacters: generateStringOfCharacters
    };
}
