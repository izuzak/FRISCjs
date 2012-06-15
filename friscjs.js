//
//  Helper functions
//

/* Converts integer value to binary, specifying the length in bits of output */
function convertIntToBinary(value, numberOfDigits) {
  var retVal = new Array(numberOfDigits);
  
  for (var i=0; i<numberOfDigits; i++) {
    retVal[numberOfDigits-i-1] = (value & (1<<i)) ? 1 : 0; 
  }
  
  return retVal.join('');
}

/* Returns the integer represented by 'value'.
 * - value is a string of ones and zeroes. If it is empty or contains another digit, an exception is thrown.
 * - [signed=false] can be either true, false, 0 or 1. For any other value, an exception is thrown as it is 
 * likely a silent error. */
function convertBinaryToInt(value, signed) {
  if (value.length === 0) {
    throw "'value' must be nonempty";
  }

  var retVal = 0, bit;
  
  if (typeof signed === 'undefined') {
    signed = 0;
  }
  if (signed!==0 && signed!==1 && signed!==true && signed!==false) {
    throw "invalid 'signed' value " + signed.toString();
  }
  
  for (var i=0, numberOfBits=value.length; i<numberOfBits-signed; i++) {
    bit = value[numberOfBits - 1 - i];
    if (bit !== '0' && bit !== '1') {
      throw "invalid bit in binary string 'value' at position " + (numberOfBits - 1 - i) + ' (' + bit + ')';
    }
    // using Math.pow here since 'i' can be >30
    retVal += (value[numberOfBits - i - 1] === '1') * Math.pow(2, i);
  }
  
  return (signed && value[0] === '1') ? ( Math.pow(2, value.length-1) - retVal) * -1 : (retVal);
}

/* Returns a bit string representing bits from 'start' to 'end' (inclusive) of 'number'.
 * The bits are counted from right to left, i.e. the LSB is the bit 0.
 * The returned string contains bits with indices 'end', 'end'-1, ... 'start'.
 * - number is either a bit string or a number object that is converted into a
 * 32-bit bit string - otherwise, null is returned
 * - start is a valid 0-based index of the lowest requested bit
 * - end is a valid 0-based index of the highest requested bit */
function getBitString(number, start, end) {
  if (typeof number === 'string') {
    return number.substring(number.length - end - 1, number.length - start);
  } else if (typeof number === 'number') {
    return getBitString(convertIntToBinary(number, 32), start, end);
  } else {
    return null;
  }
}

/* Returns 'binaryString' sign-extended to 'numberOfBits' bits.
 * - binaryString is a string of ones and zeroes
 * - numberOfBits is the desired number of bits for the extended number. If
 * it is less than or eqaul to binaryString.length, binaryString is returned unchanged.
 * - [signed=false] is a flag signaling if binaryString is signed or unsigned */
function extend(binaryString, numberOfBits, signed) {
  var bit = signed ? binaryString[0] : '0';
  var len = binaryString.length;
  var prefix = '';

  for (var i=0; i<numberOfBits-len; i++) {
    prefix += bit;
  }
  
  return prefix + binaryString;
}

/* Returns the two's complement of 'value' with respect to the specified
 * 'mask' that must be an all ones bitmask defining the word size.
 *
 * - value is an integer
 * - mask is an all ones bitmask of word size bits */
function twosComplement(value, mask) {
  // 'mask' is defined as a bitmask instead of the word size as a number
  // because ((1<<i)-1) will not work if i==32 since (1<<32) is a no-op
  return (~value + 1) & mask;
}

/* Returns a string of length 'stringLength' of characters 'character'.
 *
 * - character is any character
 * - stringLength is a non-negative integer */

function generateStringOfCharacters(character, stringLength) {
  var retVal = [];
  
  if (typeof stringLength !== 'number' || stringLength < 0) {
    throw new Error('stringLength must be a non-negative integer');
  }

  for (var i=0; i<stringLength; i++) {
    retVal.push(character);
  }

  return retVal.join('');
}

var FRISC = function() {

  //
  //  FRISC memory component
  //

  var MEM = {
    /* Memory has size 256KB, i.e. from 0x00000000 to 0x0003FFFF */
    _size: 256*1024,
    _memory: [],

    /* Read 8-bit byte from a given address */
    readb: function(addr) { 
      if (addr < 0) {
        addr = convertBinaryToInt(convertIntToBinary(addr, 32), 0);
      }
      
      var ioUnit = IO.testMemoryOverlap(addr);

      if (ioUnit === null) {
        return 0xFF & this._memory[addr];
      } else {
        return 0xFF & ioUnit.readb(addr);
      }
    },
  
    /* Read 16-bit word from a given address */
    readw: function(addr) {
      if (addr < 0) {
        addr = convertBinaryToInt(convertIntToBinary(addr, 32), 0);
      }
      
      var ioUnit = IO.testMemoryOverlap(addr);

      if (ioUnit === null) {
        var v1 = (0xFF & this._memory[addr+0]) << 0;
        var v2 = (0xFF & this._memory[addr+1]) << 8;
        return v1 + v2
      } else {
        return 0xFFFF & ioUnit.readw(addr);
      }
    },
  
    /* Read 32-bit word from a given address */
    read: function(addr) {
      if (addr < 0) {
        addr = convertBinaryToInt(convertIntToBinary(addr, 32), 0);
      }
      
      var ioUnit = IO.testMemoryOverlap(addr);

      if (ioUnit === null) {
        var v1 = (0xFF & this._memory[addr+0]) << 0;
        var v2 = (0xFF & this._memory[addr+1]) << 8;
        var v3 = (0xFF & this._memory[addr+2]) << 16;
        var v4 = (0xFF & this._memory[addr+3]) << 24;

        return v1 + v2 + v3 + v4;
      } else {
        return 0xFFFFFFFF & ioUnit.read(addr);
      }
    },
  
    /* Write 8-bit byte to a given address */
    writeb: function(addr, val) {
      if (addr < 0) {
        addr = convertBinaryToInt(convertIntToBinary(addr, 32), 0);
      }
      
      var ioUnit = IO.testMemoryOverlap(addr);

      if (ioUnit === null) {
        this._memory[addr] = 0xFF & val;
      } else {
        ioUnit.writeb(addr, 0xFF & val);
      }

      if (typeof this.onMemoryWrite !== 'undefined') {
        this.onMemoryWrite(addr, 0xFF & val, 1);
      }
    },
    
    /* Write 16-bit word to a given address */
    writew: function(addr, val) {
      if (addr < 0) {
        addr = convertBinaryToInt(convertIntToBinary(addr, 32), 0);
      }
      
      var ioUnit = IO.testMemoryOverlap(addr);

      if (ioUnit === null) {
        this._memory[addr+0] = 0xFF & (val >> 0);
        this._memory[addr+1] = 0xFF & (val >> 8);
      } else {
        ioUnit.writew(addr, 0xFFFF & val);
      }

      if (typeof this.onMemoryWrite !== 'undefined') {
        this.onMemoryWrite(addr, 0xFFFF & val, 2);
      }
    },
    
    /* Write 32-bit word to a given address */
    write: function(addr, val) {
      if (addr < 0) {
        addr = convertBinaryToInt(convertIntToBinary(addr, 32), 0);
      }
      
      var ioUnit = IO.testMemoryOverlap(addr);

      if (ioUnit === null) {
        this._memory[addr+0] = 0xFF & (val >> 0);
        this._memory[addr+1] = 0xFF & (val >> 8);
        this._memory[addr+2] = 0xFF & (val >> 16);
        this._memory[addr+3] = 0xFF & (val >> 24);
      } else {
        ioUnit.write(addr, 0xFFFFFFFF & val);
      }
      
      if (typeof this.onMemoryWrite !== 'undefined') {
        this.onMemoryWrite(addr, 0xFFFFFFFF & val, 4);
      }
    },
    
    /* Reset memory to initial state */
    reset: function() {
      this._memory = [];
      
      for (var i=0; i<this._size; i++) {
        this._memory[i] = 0;
      }
    },
    
    /* Load memory with some program enocoded as string, byte by byte */
    loadByteString: function(str) {
      this.reset();
      
      if (this._size < str.length) {
        throw new Error('Memory too small to fit program.');
      }
 
      for (var i=0; i<str.length; i++) {
        this._memory[i] = str.charCodeAt(i);
      }
    },
    
    /* Load memory with some program, byte by byte */
    loadBytes: function(bytes) {
      this.reset();

      if (this._size < bytes.length) {
        throw new Error('Memory too small to fit program.');
      }
      
      for (var i=0; i<bytes.length; i++) {
        this._memory[i] = bytes[i];
      }
    },
    
    /* Load memory with some program, binary string by binary string */
    loadBinaryString: function(binaryStrings) {
      this.reset();

      if (this._size < binaryStrings.length) {
        throw new Error('Memory too small to fit program.');
      }
      
      for (var i=0; i<binaryStrings.length; i++) {
        this._memory[i] = parseInt(binaryStrings[i], 2);
      }
    }
  };
  
  //
  //  FRISC CPU component
  //
  
  var CPU = {
    // Internal state
    _r: {r0:0, r1:0, r2:0, r3:0, r4:0, r5:0, r6:0, r7:0, pc:0, sr:0, iif:1},
    _regMap: { '000' : 'r0', '001' : 'r1', '010' : 'r2', '011' : 'r3', '100' : 'r4', '101' : 'r5', '110' : 'r6', '111' : 'r7' },
    _f: {INT2:1024, INT1:512, INT0:256, GIE:128, EINT2:64, EINT1:32, EINT0:16, Z:8, V:4, C:2, N:1},
    _frequency : 1,

    // bitmasks
    _SIGN_BIT: 0x80000000,
    _NONSIGN_BITS: 0x7FFFFFFF,
    _WORD_BITS: 0xFFFFFFFF,
    _SHIFT_BITS: 0x0000001F,
    
    _setFlag: function(flag, value) {
      this._r.sr = value ? (this._r.sr | flag) : (this._r.sr & ~(flag));
    },
    
    _getFlag: function(flag) {
      return ((this._r.sr & flag) !== 0) + 0;
    },
    
    _testCond: function(cond) {
      var result = true;
      
      if (cond === '') {                // **** Unconditional   TRUE
        result = true;
      } else if (cond === '_N/M') {     // ******** N,M         N=1
        result = !!(this._getFlag(this._f.N));
      } else if (cond === '_NN/P') {    // ******** NN,P        N=0
        result = !(this._getFlag(this._f.N));
      } else if (cond === '_C/ULT') {   // ******** C,ULT       C=1
        result = !!(this._getFlag(this._f.C));
      } else if (cond === '_NC/UGE') {  // ******** NC,UGE      C=0
        result = !(this._getFlag(this._f.C));
      } else if (cond === '_V') {       // ******** V           V=1
        result = !!(this._getFlag(this._f.V));
      } else if (cond === '_NV') {      // ******** NV          V=0
        result = !(this._getFlag(this._f.V));
      } else if (cond === '_Z/EQ') {    // ******** Z,EQ        Z=1
        result = !!(this._getFlag(this._f.Z));
      } else if (cond === '_NZ/NE') {   // ******** NZ,NE       Z=0
        result = !(this._getFlag(this._f.Z));
      } else if (cond === '_ULE') {     // ******** ULE         C=1 ili Z=1
        result = !!(this._getFlag(this._f.C)) ||
                 !!(this._getFlag(this._f.Z));
      } else if (cond === '_UGT') {     // ******** UGT         C=0 i Z=0
        result = !(this._getFlag(this._f.C)) ||
                 !(this._getFlag(this._f.Z));
      } else if (cond === '_SLT') {     // ******** SLT         (N xor V)=1
        result = !!(this._getFlag(this._f.N)) !== 
                 !!(this._getFlag(this._f.V));
      } else if (cond === '_SLE') {     // ******** SLE         (N xor V)=1 ili Z=1
        result = (!!(this._getFlag(this._f.N)) !==
                  !!(this._getFlag(this._f.V))) ||
                  !!(this._getFlag(this._f.Z));
      } else if (cond === '_SGE') {     // ******** SGE         (N xor V)=0
        result = !!(this._getFlag(this._f.N)) ===
                 !!(this._getFlag(this._f.V));
      } else if (cond === '_SGT') {     // ******** SGT         (N xor V)=0 i Z=0
        result = (!!(this._getFlag(this._f.N)) ===
                  !!(this._getFlag(this._f.V))) && 
                   !(this._getFlag(this._f.Z));
      } else {
        throw new Error('Undefined test condition.');
      }
      
      return result;
    },
    
    _decode: function(statement) {
      var opCode = getBitString(statement, 27, 31);
      var op = this._instructionMap[opCode];
      var args = [];

      if (typeof op === 'undefined') {
        return { op : null, args : null };  
      }
      
      if (op === 'MOVE') {
        var src = getBitString(statement, 21, 21);
        
        if (src === '1') {
          src = 'sr';
        } else {
          src = getBitString(statement, 26, 26);
          
          if (src === '0') {
            src = getBitString(statement, 17, 19);
            src = this._regMap[src];
          } else {
            src = getBitString(statement, 0, 19);
            src = extend(src, 32, 1);
            src = convertBinaryToInt(src, 1);
          }
        }
        
        var dest = getBitString(statement, 20, 20);
        
        if (dest === '1') {
          dest = 'sr';
        } else {    
          dest = getBitString(statement, 23, 25);
          dest = this._regMap[dest];
        }
        
        args.push(src);
        args.push(dest);
      } else if (op === 'OR' || op === 'AND' || op === 'XOR' || op === 'ADD' || op === 'ADC' || op === 'SUB' || op === 'SBC' || op === 'ROTL' || op === 'ROTR' || op === 'SHL' || op === 'SHR' || op === 'ASHR') {
        var source1 = getBitString(statement, 20, 22);

        source1 = this._regMap[source1];
        
        var source2 = getBitString(statement, 26, 26);
        
        if (source2 === '0') {
          source2 = getBitString(statement, 17, 19); // Rx
          source2 = this._regMap[source2];
        } else {
          source2 = getBitString(statement, 0, 19); // number
          source2 = extend(source2, 32, 1);
          source2 = convertBinaryToInt(source2, 1);
        }
        
        var dest = getBitString(statement, 23, 25); // Rx
        dest = this._regMap[dest];
        
        args.push(source1);
        args.push(source2);
        args.push(dest);
      } else if (op === 'CMP') {
        var source1 = getBitString(statement, 20, 22);
        source1 = this._regMap[source1];
        
        var source2 = getBitString(statement, 26, 26);
        
        if (source2 === '0') {
          source2 = getBitString(statement, 17, 19); // Rx
          source2 = this._regMap[source2];
        } else {
          source2 = getBitString(statement, 0, 19); // number
          source2 = extend(source2, 32, 1);
          source2 = convertBinaryToInt(source2, 1);
        }
        
        args.push(source1);
        args.push(source2);
      } else if (op === 'JP' || op === 'CALL') {
        var cond = getBitString(statement, 22, 25);
        cond = this._conditionMap[cond];

        if (typeof cond === 'undefined') {
          args = null;
        } else {  
          var dest = getBitString(statement, 26, 26);
          
          if (dest === '0') {
            dest = getBitString(statement, 17, 19); // Rx
            dest = this._regMap[dest];
          } else {
            dest = getBitString(statement, 0, 19); // number
            dest = extend(dest, 32, 1);
            dest = convertBinaryToInt(dest, 1);
          }
          
          args.push(cond);
          args.push(dest);
        }
      } else if (op === 'JR') {
        var cond = getBitString(statement, 22, 25);
        cond = this._conditionMap[cond];
        
        if (typeof cond === 'undefined') {
          args = null;
        } else { 
          var dest = getBitString(statement, 0, 19); // number
          dest = extend(dest, 32, 1);
          dest = convertBinaryToInt(dest, 1);
        
          args.push(cond);
          args.push(dest);
        }
      } else if (op === 'RET') {     
        var cond = getBitString(statement, 22, 25);
        cond = this._conditionMap[cond];
        
        if (typeof cond === 'undefined') {
          args = null;
        } else {
          var isRETI = getBitString(statement, 0, 0) === '1' && getBitString(statement, 1, 1) === '0';
          var isRETN = getBitString(statement, 0, 0) === '1' && getBitString(statement, 1, 1) === '1';
          
          args.push(cond);
          args.push(isRETI);
          args.push(isRETN);
        }
      } else if (op === 'LOAD' || op === 'STORE' || op === 'LOADB' || op === 'STOREB' || op === 'LOADH' || op === 'STOREH') {
        var addr = getBitString(statement, 26, 26);
        var offset = 0;
        
        if (addr === '0') {
          addr = 0;
        } else {
          addr = getBitString(statement, 20, 22);
          addr = this._regMap[addr];
        }
        
        offset = getBitString(statement, 0, 19);
        offset = extend(offset, 32, 1);
        offset = convertBinaryToInt(offset, 1);
        
        var reg = getBitString(statement, 23, 25);
        reg = this._regMap[reg];
        
        args.push(reg);
        args.push(addr);
        args.push(offset);
      } else if (op === 'POP' || op === 'PUSH') {
        var reg = getBitString(statement, 23, 25);
        reg = this._regMap[reg];
        
        args.push(reg);
      } else if (op === 'HALT') {
        var cond = getBitString(statement, 22, 25);
        cond = this._conditionMap[cond];
        
        if (typeof cond === 'undefined') {
          args = null;
        } else {
          args.push(cond);
        }
      }
      
      return { op : op, args : args };  
    },

    // Simulates the addition 'v1'+'v2'+'v3' and stores the result in the 
    // register specified by 'dest' and updates flags.
    _ADD_three: function(v1, v2, v3, dest) {
      // the & just forces ToInt32 from ECMA-262
      // v1+v2+v3 can be represented exactly by Number as it is <=2^53
      // so there is no loss of precision
      var res = (v1+v2+v3) & this._WORD_BITS; 
      
      // calculate carry on the next-to-last bit
      var t1 = v1 & this._NONSIGN_BITS;
      var t2 = v2 & this._NONSIGN_BITS;
      var t3 = v3 & this._NONSIGN_BITS;
      // (t1+t2+t3) can't overflow 32 bits by construction of t1, t2 and t3
      var c_ntl = ((t1+t2+t3)>>31) & 1;
      
      // calculate carry on the last bit
      var b1 = (v1>>31) & 1;
      var b2 = (v2>>31) & 1;
      var b3 = (v3>>31) & 1;
      var c_last = b1+b2+b3+c_ntl>1 ? 1 : 0;
        
      this._setFlag(this._f.C, c_last);
      this._setFlag(this._f.V, c_ntl ^ c_last);
      this._setFlag(this._f.N, !!(res & this._SIGN_BIT) + 0);
      this._setFlag(this._f.Z, !(res & this._WORD_BITS) + 0);

      this._r[dest] = res;
    },

    _SUB_internal: function(src1, src2, carry, dest) {
      // do the three-way add with two's complements of src2 and the carry bit
      this._ADD_three(this._r[src1],
          twosComplement(typeof src2==='number' ? src2 : this._r[src2], this._WORD_BITS),
          twosComplement(carry, this._WORD_BITS),
          dest);
      // invert the carry bit so that C=1 indicates unsigned underflow
      // which makes it consistent with SBC
      this._setFlag(this._f.C, 1 - this._getFlag(this._f.C))
    },
    
    _i: {
      POP: function(dest) {
        this._r[dest] = MEM.read(this._r.r7 & ~(0x03));
        this._r.r7 += 4;
      },
      
      PUSH: function(src) {
        this._r.r7 -= 4;
        MEM.write(this._r.r7 & ~(0x03), this._r[src]);
      },
      
      ADD: function(src1, src2, dest) {        
        this._ADD_three(this._r[src1],
            typeof src2==='number' ? src2 : this._r[src2],
            0,
            dest);
      },
      
      ADC: function(src1, src2, dest) {
        this._ADD_three(this._r[src1],
            typeof src2==='number' ? src2 : this._r[src2],
            this._getFlag(this._f.C),
            dest);
      },
      
      SUB: function(src1, src2, dest) {
        this._SUB_internal(src1, src2, 0, dest);
      },
      
      SBC: function(src1, src2, dest) {
        this._SUB_internal(src1, src2, this._getFlag(this._f.C), dest);
      },
      
      CMP: function(src1, src2) {
        var res = this._r[src1] - (typeof src2 === 'number' ? src2 : this._r[src2]);
        
        this._setFlag(this._f.C, (res > this._WORD_BITS) + 0);
        this._setFlag(this._f.V, (res > this._WORD_BITS) + 0);
        this._setFlag(this._f.N, !!(res & this._SIGN_BIT) + 0);
        this._setFlag(this._f.Z, !(res & this._WORD_BITS) + 0);
      },
      
      AND:  function(src1, src2, dest) {
        var res = this._r[src1] & (typeof src2 === 'number' ? src2 : this._r[src2]);
        
        this._setFlag(this._f.C, 0);
        this._setFlag(this._f.V, 0);
        this._setFlag(this._f.N, !!(res & this._SIGN_BIT) + 0);
        this._setFlag(this._f.Z, !(res & this._WORD_BITS) + 0);
        
        this._r[dest] = res & this._WORD_BITS;     
      },
      
      OR:  function(src1, src2, dest) {
        var res = this._r[src1] | (typeof src2 === 'number' ? src2 : this._r[src2]);
        
        this._setFlag(this._f.C, 0);
        this._setFlag(this._f.V, 0);
        this._setFlag(this._f.N, !!(res & this._SIGN_BIT) + 0);
        this._setFlag(this._f.Z, !(res & this._WORD_BITS) + 0);
        
        this._r[dest] = res & this._WORD_BITS;     
      },
      
      XOR:  function(src1, src2, dest) {
        var res = this._r[src1] ^ (typeof src2 === 'number' ? src2 : this._r[src2]);
        
        this._setFlag(this._f.C, 0);
        this._setFlag(this._f.V, 0);
        this._setFlag(this._f.N, !!(res & this._SIGN_BIT) + 0);
        this._setFlag(this._f.Z, !(res & this._WORD_BITS) + 0);
        
        this._r[dest] = res & this._WORD_BITS;     
      },
      
      SHL: function(src1, src2, dest) {
        src2 = (typeof src2 === 'number' ? src2 : this._r[src2]);
        src2 = src2 & this._SHIFT_BITS;
        
        src1 = convertIntToBinary(this._r[src1], 32);
        src1 = src1 + generateStringOfCharacters('0', src2); 

        var carry = src2 === 0 ? 0 : (src1[src2-1] === '1' ? 1 : 0);
        var res = convertBinaryToInt(src1.substring(src2));

        this._setFlag(this._f.C, carry);
        this._setFlag(this._f.V, 0);
        this._setFlag(this._f.N, !!(res & this._SIGN_BIT) + 0);
        this._setFlag(this._f.Z, !(res & this._WORD_BITS) + 0);
        
        this._r[dest] = res & this._WORD_BITS; 
      },
      
      SHR: function(src1, src2, dest) {
        src2 = (typeof src2 === 'number' ? src2 : this._r[src2]);
        src2 = src2 & this._SHIFT_BITS;

        src1 = convertIntToBinary(this._r[src1], 32);
        src1 = generateStringOfCharacters('0', src2) + src1;

        var carry = src2 === 0 ? 0 : (src1[32] === '1' ? 1 : 0);
        var res = convertBinaryToInt(src1.substring(0, 32));
        
        this._setFlag(this._f.C, carry);
        this._setFlag(this._f.V, 0);
        this._setFlag(this._f.N, !!(res & this._SIGN_BIT) + 0);
        this._setFlag(this._f.Z, !(res & this._WORD_BITS) + 0);
        
        this._r[dest] = res & this._WORD_BITS; 
      },
      
      ASHR: function(src1, src2, dest) {
        src2 = (typeof src2 === 'number' ? src2 : this._r[src2]);
        src2 = src2 & this._SHIFT_BITS;

        src1 = convertIntToBinary(this._r[src1], 32);        
        src1 = generateStringOfCharacters(src1[0], src2) + src1;

        var carry = src2 === 0 ? 0 : (src1[32] === '1' ? 1 : 0);
        var res = convertBinaryToInt(src1.substring(0, 32));
        
        this._setFlag(this._f.C, carry);
        this._setFlag(this._f.V, 0);
        this._setFlag(this._f.N, !!(res & this._SIGN_BIT) + 0);
        this._setFlag(this._f.Z, !(res & this._WORD_BITS) + 0);
        
        this._r[dest] = res & this._WORD_BITS; 
      },
      
      ROTL: function(src1, src2, dest) {
        src2 = (typeof src2 === 'number' ? src2 : this._r[src2]);
        src2 = src2 & this._SHIFT_BITS;

        src1 = convertIntToBinary(this._r[src1], 32);
        var carry = src2 === 0 ? 0 : (src1[(src2-1)%32] === '1' ? 1 : 0);

        src2 = src2 % 32; 
        var res = convertBinaryToInt(src1.substring(src2) + src1.substring(0, src2));

        this._setFlag(this._f.C, carry);
        this._setFlag(this._f.V, 0);
        this._setFlag(this._f.N, !!(res & this._SIGN_BIT) + 0);
        this._setFlag(this._f.Z, !(res & this._WORD_BITS) + 0);
        
        this._r[dest] = res & this._WORD_BITS; 
      },
      
      ROTR: function(src1, src2, dest) {
        src2 = (typeof src2 === 'number' ? src2 : this._r[src2]);
        src2 = src2 & this._SHIFT_BITS;
        
        src1 = convertIntToBinary(this._r[src1], 32);
        var carry = src2 === 0 ? 0 : (src1[32-src2] === '1' ? 1 : 0);

        src2 = src2 % 32; 
        var res = convertBinaryToInt(src1.substring(32-src2) + src1.substring(0, 32-src2));

        this._setFlag(this._f.C, carry);
        this._setFlag(this._f.V, 0);
        this._setFlag(this._f.N, !!(res & this._SIGN_BIT) + 0);
        this._setFlag(this._f.Z, !(res & this._WORD_BITS) + 0);
        
        this._r[dest] = res & this._WORD_BITS; 
      },
      
      MOVE: function(src, dest) {
        if (src === 'sr') {
          this._r[dest] = this._r[src] & 0xFF; 
        } else if (dest === 'sr') {
          this._r[dest] = (typeof src === 'number' ? src : this._r[src]) & 0xFF; 
        } else {    
          this._r[dest] = (typeof src === 'number' ? src : this._r[src]); 
        }
      },
      
      LOAD: function(reg, addr, offset) {
        var destAddr = (typeof addr === 'string' ? this._r[addr] : 0) + (typeof offset === 'number' ? offset : 0);
        destAddr &= ~(0x03);
        this._r[reg] = MEM.read(destAddr);
      }, 
  
      LOADH: function(reg, addr, offset) {
        var destAddr = (typeof addr === 'string' ? this._r[addr] : 0) + (typeof offset === 'number' ? offset : 0);
        destAddr &= ~(0x01);
        this._r[reg] = MEM.readw(destAddr);
      }, 
      
      LOADB: function(reg, addr, offset) {
        var destAddr = (typeof addr === 'string' ? this._r[addr] : 0) + (typeof offset === 'number' ? offset : 0);
        this._r[reg] = MEM.readb(destAddr);
      }, 
      
      STORE: function(reg, addr, offset) {
        var destAddr = (typeof addr === 'string' ? this._r[addr] : 0) + (typeof offset === 'number' ? offset : 0);
        destAddr &= ~(0x03);
        MEM.write(destAddr, this._r[reg]);
      },
      
      STOREH: function(reg, addr, offset) {
        var destAddr = (typeof addr === 'string' ? this._r[addr] : 0) + (typeof offset === 'number' ? offset : 0);
        destAddr &= ~(0x01);
        MEM.writew(destAddr, this._r[reg]);
      },
      
      STOREB: function(reg, addr, offset) {
        var destAddr = (typeof addr === 'string' ? this._r[addr] : 0) + (typeof offset === 'number' ? offset : 0);
        MEM.writeb(destAddr, this._r[reg]);
      },
      
      JP: function(cond, dest) {
        if (this._testCond(cond)) {
          this._r.pc = ((typeof dest === 'string' ? this._r[dest] : dest) & ~(0x03)) - 4;
        }
      },
       
      JR: function(cond, dest) {
        if (this._testCond(cond)) {
          this._r.pc = ((this._r.pc + dest) & ~(0x03)) - 4;
        }
      },
      
      CALL: function(cond, dest) {
        if (this._testCond(cond)) {
          this._r.r7 -= 4;
          MEM.write(this._r.r7, this._r.pc & ~(0x03));
          this._r.pc = ((typeof dest === 'string' ? this._r[dest] : dest) & ~(0x03)) - 4;
        }
      },
      
      RET: function(cond, isRETI, isRETN) {
        if (this._testCond(cond)) {
          this._r.pc = MEM.read(this._r.r7) & ~(0x03);
          this._r.r7 += 4;
          
          if (isRETI) {
            this._setFlag(this._f.GIE, 1);
          } else if (isRETN) {
            this._r.iif = 1;
          }
        }
      },
      
      HALT: function(cond) {
        if (this._testCond(cond)) {
          this.stop();
        }
      }
    },
        
    acceptNonmaskableInterrupt: function() {
      IO.sendIack();
      this._r.iif = 1;
      this._r.r7 -= 4;
      MEM.write(this._r.r7 & ~(0x03), this._r.pc - 4);
      this._r.pc = MEM.read(12);
    },
    
    acceptMaskableInterrupt: function() {
      this._setFlag(this._f.GIE, 0);
      this._r.r7 -= 4;
      MEM.write(this._r.r7 & ~(0x03), this._r.pc - 4);
      this._r.pc = MEM.read(8);
    },
    
    acceptInterrupt: function() {
      this._setFlag(this._f.INT2, IO.testInterrupt(2));
      this._setFlag(this._f.INT1, IO.testInterrupt(1));
      this._setFlag(this._f.INT0, IO.testInterrupt(0));
    
      if (this._r.iif === 0) {
        return;
      } else {
        if (IO.testInterrupt(3)) {
          this.acceptNonmaskableInterrupt();
        } else {
          if (this._getFlag(this._f.GIE) === 0) {
            return;
          } else {            
            if ((this._getFlag(this._f.INT2) && this._getFlag(this._f.EINT2)) ||
                (this._getFlag(this._f.INT1) && this._getFlag(this._f.EINT1)) || 
                (this._getFlag(this._f.INT0) && this._getFlag(this._f.EINT0))) {
              this.acceptMaskableInterrupt();
            }
          }
        }
      }
    },
  
    run: function() {
      if (typeof this.onBeforeRun !== 'undefined') {
        this.onBeforeRun();
      }

      this._runTimer = setInterval(this.performCycle.bind(this), (1 / this._frequency) * 1000);
    },
  
    pause: function() {
      if (typeof this._runTimer !== 'undefined') {
        clearInterval(this._runTimer);
      }
    },
  
    stop: function() {
      if (typeof this._runTimer !== 'undefined') {
        clearInterval(this._runTimer);
      }
      
      if (typeof this.onStop !== 'undefined') {
        this.onStop();
      }
    },
  
    performCycle: function() {
      if (typeof this.onBeforeCycle !== 'undefined') {
        var val = this.onBeforeCycle();
        if (typeof val !== 'undefined' && val === false) {
          return;
        }
      }

      var instruction = MEM.read(this._r.pc);
      var decodedInstruction = this._decode(instruction);
      
      if (decodedInstruction.op !== null && decodedInstruction.args !== null) {
        if (typeof this.onBeforeExecute !== 'undefined') {
          this.onBeforeExecute(decodedInstruction);
        }

        this._i[decodedInstruction.op].apply(this, decodedInstruction.args);
        this._r.pc += 4;
        
        this.acceptInterrupt();
        
        if (typeof this.onAfterCycle !== 'undefined') {
          this.onAfterCycle();
        }
      } else {
        this.stop();

        throw new Error('undefined operation code or wrongly defined arguments');
      }
    },
  
    reset: function() {
      this._r = {r0:0, r1:0, r2:0, r3:0, r4:0, r5:0, r6:0, r7:0, pc:0, sr:0, iif:1};
    },
  
    _instructionMap: {
      '00000' : 'MOVE',
      '00001' : 'OR',
      '00010' : 'AND',
      '00011' : 'XOR',
      '00100' : 'ADD',
      '00101' : 'ADC',
      '00110' : 'SUB',
      '00111' : 'SBC',
      '01000' : 'ROTL',
      '01001' : 'ROTR',
      '01010' : 'SHL',
      '01011' : 'SHR',
      '01100' : 'ASHR',
      '01101' : 'CMP',
      // 01110 Not used
      // 01111 Not used
      '11000' : 'JP',
      '11001' : 'CALL',
      '11010' : 'JR',
      '11011' : 'RET',
      '10110' : 'LOAD',
      '10111' : 'STORE',
      '10010' : 'LOADB',
      '10011' : 'STOREB',
      '10100' : 'LOADH',
      '10101' : 'STOREH',
      '10000' : 'POP',
      '10001' : 'PUSH',
      '11111' : 'HALT'
    },
  
    _conditionMap : {
      '0000' : '',
      '0001' : '_N/M',
      '0010' : '_NN/P',
      '0011' : '_C/ULT',
      '0100' : '_NC/UGE',
      '0101' : '_V',
      '0110' : '_NV',
      '0111' : '_Z/EQ',
      '1000' : '_NZ/NE',
      '1001' : '_ULE',
      '1010' : '_UGT',
      '1011' : '_SLT',
      '1100' : '_SLE',
      '1101' : '_SGE',
      '1110' : '_SGT'
    }
  };
  
  //
  //  FRISC IO components
  //
  
  var IO = {
  
    // units stored in arrays by interrupt level
    _units : {
      interrupt : [[], [], [], []],
      noninterrupt : []
    },
    
    // if processor sends iack, find io unit hooked up to int3 and clear interrupt state
    sendIack: function() {
      if (typeof this._units.interrupt[3][0] !== 'undefined') {
        this._units.interrupt[3][0].interruptState = 0;
        this._units.interrupt[3][0].onStateChangeInternal();
      }
    },
    
    // test if any unit of level intLevel has signaled an interrupt
    testInterrupt: function(intLevel) {
      var intSet = 0;
      
      for (var i=0; i<this._units.interrupt[intLevel].length; i++) {
        intSet = intSet | this._units.interrupt[intLevel][i].interruptState;
      }
      
      return intSet;
    },

    // create FRISC CT io unit
    createFriscCtIoUnit: function(id, options) {
      var ioUnit = this.createIoUnit(id, options);
      
      if (typeof options.frequency === 'undefined') {
        throw new Error('FRISC CT unit must be defined with a frequency parameter.');
      }

      if (options.frequency < 1 || options.frequency > 10000) {
        throw new Error('FRISC CT unit must have frequency < 10000 and > 0.');
      }

      ioUnit.frequency = options.frequency;

      ioUnit.onStateChangeInternal = function(addr, val) {
        if (typeof ioUnit.onStateChange !== 'undefined' && ioUnit.onStateChange !== null) {
          ioUnit.onStateChange();
        }
      };

      ioUnit.determineLocationAndOffset = function(addr) {
        return { location : (addr - ioUnit.memMapAddrStart)/4, offset : (addr%4) };
      };

      ioUnit.readb = function(addr) {
        var val = ioUnit.read(addr);
        var loc = ioUnit.determineLocationAndOffset(addr);

        return 0xFF & (val >> loc.offset*8);
      };

      ioUnit.readw = function(addr) {
        var val = ioUnit.read(addr);
        var loc = ioUnit.determineLocationAndOffset(addr);

        return 0xFFFF & (val >> loc.offset*8);
      };

      ioUnit.read = function(addr) {
        var loc = ioUnit.determineLocationAndOffset(addr);

        if (loc.location === 0) {
          return ioUnit.dc;
        } else if (loc.location === 1) {
          return ioUnit.readyStatus;
        } else if (loc.location === 2 || loc.location === 3) {
          return 0;
        }
      };

      ioUnit.writeb = function(addr, val) {
        var loc = ioUnit.determineLocationAndOffset(addr);
        
        ioUnit.write(addr, val << loc.offset*8);
      };

      ioUnit.writew = function(addr, val) {
        var loc = ioUnit.determineLocationAndOffset(addr);

        ioUnit.write(addr, val << loc.offset*8);
      };

      ioUnit.write = function(addr, val) {
        var loc = ioUnit.determineLocationAndOffset(addr);

        if (loc.location === 0) {
          ioUnit.lr = 0xFFFF & val;
          ioUnit.dc = 0xFFFF & val;
        } else if (loc.location === 1) {
          ioUnit.cr = val;
          ioUnit.shouldInterrupt = ((ioUnit.cr & 0x01) !== 0)+0;
          ioUnit.shouldCount = ((ioUnit.cr & 0x02) !== 0)+0;
        } else if (loc.location === 2) {
          ioUnit.readyStatus = 0;
          ioUnit.interruptState = 0;
        } else if (loc.location === 3) {
          ioUnit.shouldEndBeSignaled = 0;
        }

        ioUnit.onStateChangeInternal(addr, val);
      };
      
      ioUnit.init = function() {
        ioUnit.counterThread = setInterval(function() {
          if (ioUnit.shouldCount === 1) {
            ioUnit.dc -= 1;
    
            if (ioUnit.dc === 0) {
              ioUnit.dc = ioUnit.lr;
    
              if (ioUnit.shouldEndBeSignaled === 0) {
                ioUnit.readyStatus = 1;
                ioUnit.shouldEndBeSignaled = 1;
    
                if (ioUnit.shouldInterrupt) {
                  ioUnit.interruptState = 1;
                }
              }
            }
  
            ioUnit.onStateChangeInternal();
          }
        }, 1 / ioUnit.frequency);
      };
        
      ioUnit.reset = function() {
        for (var i=0; i<ioUnit.memMapAddrCount*4; i+=1) {
          ioUnit._memory[i] = 0;
        }
  
        ioUnit.interruptState = 0;
        ioUnit.readyStatus = 0;
        ioUnit.cr = 0;
        ioUnit.lr = 0;
        ioUnit.dc = 0;
        ioUnit.shouldInterrupt = 0;
        ioUnit.shouldEndBeSignaled = 0;
        ioUnit.shouldCount = 0;

        ioUnit.onStateChangeInternal();
      };
      
      ioUnit.remove = function() {
        clearInterval(ioUnit.counterThread);
      };
      
      ioUnit.reset();

      return ioUnit;
    },
    
    // create FRISC PIO io unit
    createFriscPioIoUnit: function(id, options) {
      var ioUnit = this.createIoUnit(id, options);
      
      ioUnit.onStateChangeInternal = function(addr, val) {
        if (typeof ioUnit.onStateChange !== 'undefined' && ioUnit.onStateChange !== null) {
          ioUnit.onStateChange();
        }
      };
      
      ioUnit.determineLocationAndOffset = function(addr) {
        return { location : (addr - ioUnit.memMapAddrStart)/4, offset : (addr%4) };
      };

      ioUnit.readb = function(addr) {
        var val = ioUnit.read(addr);
        var loc = ioUnit.determineLocationAndOffset(addr);

        return 0xFF & (val >> loc.offset*8);
      };

      ioUnit.readw = function(addr) {
        var val = ioUnit.read(addr);
        var loc = ioUnit.determineLocationAndOffset(addr);

        return 0xFFFF & (val >> loc.offset*8);
      };

      ioUnit.read = function(addr) {
        var loc = ioUnit.determineLocationAndOffset(addr);

        if (loc.location === 0) {
          return ioUnit.readyStatus;
        } else if (loc.location === 1) {
          return 0xFF & ioUnit.dr;
        } else if (loc.location === 2 || loc.location === 3) {
          return 0;
        }
      };
      
      ioUnit.writeb = function(addr, val) {
        var loc = ioUnit.determineLocationAndOffset(addr);
        
        ioUnit.write(addr, val << loc.offset*8);
      };

      ioUnit.writew = function(addr, val) {
        var loc = ioUnit.determineLocationAndOffset(addr);

        ioUnit.write(addr, val << loc.offset*8);
      };

      ioUnit.write = function(addr, val) {
        var loc = ioUnit.determineLocationAndOffset(addr);

        if (loc.location === 0) {
          if (ioUnit.maskFollows === 1) {
            ioUnit.maskFollows = 0;
            
            ioUnit.mask = val;
          } else {
            ioUnit.cr = val;
            
            ioUnit.isInputMode = ((ioUnit.cr & 0x01) !== 0)+0;
            ioUnit.shouldInterrupt = ((ioUnit.cr & 0x02) !== 0)+0;
            ioUnit.transferMode = ((ioUnit.cr & 0x04) !== 0)+0;
            
            if (ioUnit.isInputMode === 1 && ioUnit.transferMode === 1) {
              ioUnit.maskFollows = ((ioUnit.cr & 0x08) !== 0)+0;
              ioUnit.activeBit = ((ioUnit.cr & 0x010) !== 0)+0;
              ioUnit.andOrOr = ((ioUnit.cr & 0x020) !== 0)+0;
            }
          }
        } else if (loc.location === 1) {
          ioUnit.dr = 0xFF & val;
        } else if (loc.location === 2) {
          ioUnit.readyStatus = 0;
          ioUnit.interruptState = 0;
        } else if (loc.location === 3) {
          ioUnit.shouldEndBeSignaled = 0;
        }

        ioUnit.onStateChangeInternal(addr, val);
      };
      
      ioUnit.init = function() {
        ioUnit.dataThread = setInterval(function() {
          if (ioUnit.isInputMode === 1) {
            if (ioUnit.transferMode === 0) {
              if (ioUnit.shouldEndBeSignaled === 0) {
                ioUnit.dr = 0xFF & parseInt(Math.random()*256);
                ioUnit.readyStatus = 1;
                
                if (ioUnit.shouldInterrupt === 1) {
                  ioUnit.interruptState = 1;
                }
                
                ioUnit.shouldEndBeSignaled = 1;
              }
            } else {
              if (ioUnit.shouldEndBeSignaled === 0) {
                ioUnit.dr = 0xFF & parseInt(Math.random()*256);
                
                var v = (ioUnit.activeBit === 0) ? (0xFF & ~dr) : dr;
                
                if (ioUnit.andOrOr === 1) {
                  v = ((v & ioUnit.mask) ^ ioUnit.mask) !== 0;
                } else {
                  v = (v & ioUnit.mask) !== 0;
                }
                
                if (v === true) {
                  ioUnit.readyStatus = 1;
                
                  if (ioUnit.shouldInterrupt === 1) {
                    ioUnit.interruptState = 1;
                  }
                
                  ioUnit.shouldEndBeSignaled = 1;
                }
              }
            }
          } else if (ioUnit.isInputMode === 0) {
            if (ioUnit.transferMode === 0) {
              if (ioUnit.shouldEndBeSignaled === 0) {
                ioUnit.readyStatus = 1;
                
                if (ioUnit.shouldInterrupt === 1) {
                  ioUnit.interruptState = 1;
                }
                
                ioUnit.shouldEndBeSignaled = 1;
              }        
            }
          }
          
          ioUnit.onStateChangeInternal();
        }, 1 / ioUnit.frequency);
      };
      
      ioUnit.reset = function() {
        ioUnit.isInputMode = null;
        ioUnit.shouldInterrupt = 0;
        ioUnit.transferMode = 0;
        ioUnit.maskFollows = 0;
        ioUnit.mask = 0;
        ioUnit.activeBit = 0;
        ioUnit.andOrOr = 0;
        ioUnit.dr = 0;
        ioUnit.cr = 0;
        ioUnit.readyStatus = 0;
        ioUnit.interruptState = 0;
        ioUnit.shouldEndBeSignaled = 0;
        
        ioUnit.onStateChangeInternal();
      };
      
      ioUnit.remove = function() {
        clearInterval(ioUnit.dataThread);
      };
      
      ioUnit.reset();
      
      return ioUnit;
    },

    // create FRISC DMA io unit
    createFriscDmaIoUnit: function(id, options) {
      var ioUnit = this.createGenericIoUnit(id, options);

      ioUnit.onStateChangeInternal = function(addr, val) {
        if (typeof ioUnit.onStateChange !== 'undefined' && ioUnit.onStateChange !== null) {
          ioUnit.onStateChange();
        }
      };
          
      ioUnit.determineLocationAndOffset = function(addr) {
        return { location : (addr - ioUnit.memMapAddrStart)/4, offset : (addr%4) };
      };

      ioUnit.readb = function(addr) {
        var val = ioUnit.read(addr);
        var loc = ioUnit.determineLocationAndOffset(addr);

        return 0xFF & (val >> loc.offset*8);
      };

      ioUnit.readw = function(addr) {
        var val = ioUnit.read(addr);
        var loc = ioUnit.determineLocationAndOffset(addr);

        return 0xFFFF & (val >> loc.offset*8);
      };

      ioUnit.read = function(addr) {
        var loc = ioUnit.determineLocationAndOffset(addr);

        if (loc.location === 0) {
          return ioUnit.srcAddr;
        } else if (loc.location === 1) {
          return ioUnit.destAddr;
        } else if (loc.location === 2) {
          return ioUnit.counter;
        } else if (loc.location === 3) {
          return ioUnit.readyStatus;
        } else if (loc.location === 4) {
          return 0;
        } else if (loc.location === 5) {
          return 0;
        }
      };

      ioUnit.writeb = function(addr, val) {
        var loc = ioUnit.determineLocationAndOffset(addr);
        
        ioUnit.write(addr, val << loc.offset*8);
      };

      ioUnit.writew = function(addr, val) {
        var loc = ioUnit.determineLocationAndOffset(addr);

        ioUnit.write(addr, val << loc.offset*8);
      };
      
      ioUnit.write = function(addr, val) {
        var loc = ioUnit.determineLocationAndOffset(addr);

        if (loc.location === 0) {
          ioUnit.srcAddr = val;
        } else if (loc.location === 1) {
          ioUnit.destAddr = val;
        } else if (loc.location === 2) {
          ioUnit.counter = val;
        } else if (loc.location === 3) {
          ioUnit.cr = val;
          ioUnit.shouldInterrupt = ((ioUnit.cr & 0x01) !== 0)+0;
          ioUnit.transferMode = ((ioUnit.cr & 0x02) !== 0)+0;
          ioUnit.srcType = ((ioUnit.cr & 0x04) !== 0)+0;
          ioUnit.destType = ((ioUnit.cr & 0x08) !== 0)+0;
        } else if (loc.location === 4) {
          if (ioUnit.transferMode === 0) {  // halting
            while (ioUnit.counter > 0) {
              ioUnit.transferData();
            }
            
            ioUnit.readyStatus = 1;  
            if (ioUnit.shouldInterrupt) {
              ioUnit.interruptState = 1;
            }
          } else { // cycle stealing
            var freq = CPU._frequency;
            
            if (ioUnit.counter > 0) {
              ioUnit.transferData();
            }
            
            if (ioUnit.counter === 0) {
              ioUnit.readyStatus = 1;  
              if (ioUnit.shouldInterrupt) {
                ioUnit.interruptState = 1;
              }
            } else {              
              ioUnit.counterThread = setInterval(function() {
                if (ioUnit.counter > 0) {
                  ioUnit.transferData();
                } else {
                  ioUnit.readyStatus = 1;  
                  if (ioUnit.shouldInterrupt) {
                    ioUnit.interruptState = 1;
                  }
                  clearInterval(ioUnit.counterThread);
                  ioUnit.counterThread = null;
                }
                
                ioUnit.onStateChangeInternal();
              }, 1 / freq);
            }
          }          
        } else if (loc.location === 5) {
          ioUnit.readyStatus = 0;
          ioUnit.interruptState = 0;
        }

        ioUnit.onStateChangeInternal(addr, val);
      };
      
      ioUnit.transferData = function() {
        var val = MEM.read(ioUnit.srcAddr);
        MEM.write(ioUnit.destAddr, val);
        
        if (ioUnit.srcType === 0) {
          ioUnit.srcAddr += 4;
        }
        
        if (ioUnit.destType === 0) {
          ioUnit.destAddr += 4;
        }
        
        ioUnit.counter -= 1;
      };
      
      ioUnit.init = function() {
      };
      
      ioUnit.reset = function() {
        for (var i=0; i<ioUnit.memMapAddrCount*4; i+=1) {
          ioUnit._memory[i] = 0;
        }
  
        ioUnit.interruptState = 0;
        ioUnit.readyStatus = 0;
        ioUnit.counter = 0;
        ioUnit.cr = 0;
        ioUnit.shouldInterrupt = 0;
        ioUnit.transferMode = 0;
        ioUnit.srcType = 0;
        ioUnit.destType = 0;
        ioUnit.srcAddr = 0;
        ioUnit.destAddr = 0;
        
        if (ioUnit.counterThread !== null) {
          clearInterval(ioUnit.counterThread);
          ioUnit.counterThread = null;
        }

        ioUnit.onStateChangeInternal();
      };
      
      ioUnit.remove = function() {
      };

      ioUnit.reset();

      return ioUnit;
    },

    // create generic FRISC io unit through which the end-user can simulate data send and receive
    createGenericIoUnit: function(id, options) {
      var ioUnit = this.createIoUnit(id, options);
      
      ioUnit.onStateChangeInternal = function(addr, val) {
        if (typeof ioUnit.onStateChange !== 'undefined') {
          ioUnit.onStateChange();
        }
      };

      ioUnit.readb = function(addr) {
        return 0xFF & this._memory[addr-this.memMapAddrStart];
      };

      ioUnit.readw = function(addr) {
        var v1 = (0xFF & this._memory[addr+0-this.memMapAddrStart]) << 0;
        var v2 = (0xFF & this._memory[addr+1-this.memMapAddrStart]) << 8;

        return v1 + v2;
      };

      ioUnit.read = function(addr) {
        var v1 = (0xFF & this._memory[addr+0-this.memMapAddrStart]) << 0;
        var v2 = (0xFF & this._memory[addr+1-this.memMapAddrStart]) << 8;
        var v3 = (0xFF & this._memory[addr+2-this.memMapAddrStart]) << 16;
        var v4 = (0xFF & this._memory[addr+3-this.memMapAddrStart]) << 24;

        return v1 + v2 + v3 + v4;
      };

      ioUnit.writeb = function(addr, val) {
        this._memory[addr-this.memMapAddrStart] = 0xFF & val;

        ioUnit.onStateChangeInternal(addr, val);
      };

      ioUnit.writew = function(addr, val) {
        this._memory[addr+0-this.memMapAddrStart] = 0xFF & (val >> 0);
        this._memory[addr+1-this.memMapAddrStart] = 0xFF & (val >> 8);

        ioUnit.onStateChangeInternal(addr, val);
      };

      ioUnit.write = function(addr, val) {
        this._memory[addr+0-this.memMapAddrStart] = 0xFF & (val >> 0);
        this._memory[addr+1-this.memMapAddrStart] = 0xFF & (val >> 8);
        this._memory[addr+2-this.memMapAddrStart] = 0xFF & (val >> 16);
        this._memory[addr+3-this.memMapAddrStart] = 0xFF & (val >> 24);

        ioUnit.onStateChangeInternal(addr, val);
      };
      
      ioUnit.init = function() {
      };
      
      ioUnit.reset = function() {
        for (var i=0; i<ioUnit.memMapAddrCount*4; i+=1) {
          ioUnit._memory[i] = 0;
        }
  
        ioUnit.interruptState = 0;

        ioUnit.onStateChangeInternal();
      };
      
      ioUnit.remove = function() {
      };
      
      ioUnit.reset();

      return ioUnit;
    },
    
    // generic code for creating all io units
    createIoUnit: function(id, options) {
      if (typeof options.memMapAddrCount !== 'undefined' &&
          options.memMapAddrCount < 0) {
        throw new Error('Number of memory mapped locations must be non-negative.');
      } else if (typeof options.memMapAddrCount === 'undefined') {
        options.memMapAddrCount = 0;
      }
      
      if (typeof options.memMapAddrStart !== 'undefined' &&
          options.memMapAddrStart < 0) {
        throw new Error('Memory mapping for io unit is out of addressable memory range.');
      } else 
      if (typeof options.memMapAddrStart === 'undefined' &&
                 options.memMapAddrCount === 0) {
        throw new Error('Memory mapping for io unit must be defined.');
      } else if (typeof options.memMapAddrStart === 'undefined') {
        options.memMapAddrStart = parseInt("0FFFF0000", 16);
      }
           
      if (options.memMapAddrStart % 4 !== 0) {
        throw new Error('Memory mapping for io unit must start from an address that is divisible by 4.');
      }
      
      if (typeof options.intLevel !== 'undefined' &&
          (options.intLevel < 0 || options.intLevel > 3)) {
        throw new Error('IO unit must have interrupt level of 0, 1, 2 or 3.');
      } else if (typeof options.intLevel === 'undefined') {
        options.intLevel = null;
      }

      var ioUnit = {
        id : id,
        _memory : [],
        memMapAddrCount : options.memMapAddrCount,
        memMapAddrStart : options.memMapAddrStart,
        intLevel : options.intLevel,
        interruptState : 0
      };
      
      for (var i=0; i<options.memMapAddrCount*4; i+=1) {
        ioUnit._memory[i] = 0;
      }
      
      return ioUnit;
    },
      
    // add io unit to the system and initialize unit  
    addIoUnit: function(ioUnit) {
      // provjeriti da se memorijske lokacije ne preklapaju
      var mappedUnit = this.testMemoryOverlap(ioUnit.memMapAddrStart);
      
      if (mappedUnit !== null) {
        throw new Error('Memory mapping of IO unit overlaps with already connected IO unit:' + mappedUnit.id);
      }
      
      mappedUnit = this.testMemoryOverlap(ioUnit.memMapAddrStart + ioUnit.memMapAddrCount*4 - 1);
      
      if (mappedUnit !== null) {
        throw new Error('Memory mapping of IO unit overlaps with already connected IO unit:' + mappedUnit.id);
      }
      
      // provjeriti da nemaju isti id
      if (this.getIoUnit(ioUnit.id) !== null) {
        throw new Error('IO unit with same id already exists.');
      }
      
      if (ioUnit.intLevel !== null) {
        // zabraniti da ima vise od jedne jedinice spojene na INT3
        if (ioUnit.intLevel === 3 && this._units.interrupt[3].length > 0) {
          throw new Error('There can only be one io unit connected to INT3.');
        } else {
          this._units.interrupt[ioUnit.intLevel].push(ioUnit);
        }
      } else {
        this._units.noninterrupt.push(ioUnit);
      }
      
      ioUnit.init();
    },
    
    getIoUnit: function(id) {
      for (var i=0; i<this._units.interrupt.length; i++) {
        for (var j=0; j<this._units.interrupt[i].length; j++) {
          if (id === this._units.interrupt[i][j].id) {
            return this._units.interrupt[i][j];
          }
        }
      }
      
      for (var i=0; i<this._units.noninterrupt.length; i++) {
        if (id === this._units.noninterrupt[i].id) {
          return this._units.noninterrupt[i];
        }
      }
      
      return null;
    },

    getIoUnits: function() {
      var ioUnits = [];

      for (var i=0; i<this._units.interrupt.length; i++) {
        for (var j=0; j<this._units.interrupt[i].length; j++) {
          ioUnits.push(this._units.interrupt[i][j].id);
        }
      }
      
      for (var i=0; i<this._units.noninterrupt.length; i++) {
        if (id === this._units.noninterrupt[i].id) {
          ioUnits.push(this._units.noninterrupt[i].id);
        }
      }
      
      return ioUnits;
    },
    
    removeIoUnit: function(id) {
      var ioUnit = this.getIoUnit(id);
      
      ioUnit.remove();
      
      var unitArray = ioUnit.intLevel === null ? 
                      this._units.noninterrupt : 
                      this._units.interrupt[ioUnit.intLevel];

      for (var i=0; i<unitArray.length; i++) {
        if (unitArray[i].id === ioUnit.id) {
          unitArray.splice(i, 1);
          break;
        }
      }
    },
    
    generateInterrupt: function(id) {
      var ioUnit = this.getIoUnit(id);
      
      ioUnit.interruptState = 1;
    },
    
    setState: function(id, addr, data) {
      var ioUnit = this.getIoUnit(id);
      
      ioUnit._memory[addr + ioUnit.offset] = data;
    },
    
    // test if memory address memAddr overlaps with existing io units
    testMemoryOverlap: function(memAddr) {
      for (var i=0; i<this._units.interrupt.length; i++) {
        for (var j=0; j<this._units.interrupt[i].length; j++) {
          if (memAddr >= this._units.interrupt[i][j].memMapAddrStart && 
              (memAddr <= (this._units.interrupt[i][j].memMapAddrStart +
              this._units.interrupt[i][j].memMapAddrCount*4))) {
            return this._units.interrupt[i][j];
          }
        }
      }
      
      for (var i=0; i<this._units.noninterrupt.length; i++) {
        if (memAddr >= this._units.noninterrupt[i].memMapAddrStart && 
            (memAddr <= (this._units.noninterrupt[i].memMapAddrStart +
            this._units.noninterrupt[i].memMapAddrCount*4))) {
          return this._units.noninterrupt[i];
        }
      }
      
      return null;
    }
  };

  return {MEM : MEM, CPU : CPU, IO : IO};
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports.FRISC = FRISC;
  module.exports.util = {
    convertIntToBinary: convertIntToBinary, 
    convertBinaryToInt: convertBinaryToInt,
    getBitString: getBitString,
    extend: extend,
    twosComplement: twosComplement,
    generateStringOfCharacters: generateStringOfCharacters
  };
} else if (typeof document !== 'undefined' && typeof document.window !== 'undefined') {
  document.window.FRISC = FRISC;
}
