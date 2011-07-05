//
//  Helper functions
//

/* Converts integer value to binary, specifying the length in bits of output */
function convertIntToBinary(value, numberOfBits) {
  var retVal = [numberOfBits];
  
  for (var i=0; i<numberOfBits; i++) {
    retVal[numberOfBits-i-1] = (Math.pow(2, i) & value) ? 1 : 0; 
  }
  
  return retVal.join("");
}

/* Converts binary value to integer, specifying if the binary value is signed */
function convertBinaryToInt(value, signed) {
  var retVal = 0;
  
  if (typeof signed === "undefined") {
    signed = 0;
  }
  
  for (var i=0, numberOfBits=value.length; i<numberOfBits-signed; i++) {
    retVal += (value[numberOfBits - i - 1] === "1") * Math.pow(2, i);
  }
  
  return (signed && value[0] === "1") ? ( Math.pow(2, value.length-1) - retVal) * -1 : (retVal);
}

/* Get bits from position X to postition Y */
function getBitString(number, start, end) {
  if (typeof number === "string") {
    return number.substring(number.length - end - 1, number.length - start);
  } else if (typeof number === "int") {
    return getBitString(convertIntToBinary(number, 32));
  } else {
    return null;
  }
}

//
//  FRISC memory component
//

FRISC.MEM = {
  /* Memory has size 256KB, i.e. from 0x00000000 to 0x0003FFFF */
  _size: 256*1024,
  _memory: [],
  
  /* Read 8-bit byte from a given address */
  readb: function(addr) { 
    return 0xFF & this._memory[addr];
  },
  
  /* Read 16-bit word from a given address */
  readw: function(addr) {
    return this.readb(addr) + (this.readb(addr+1) << 8);
  },
  
  /* Read 32-bit word from a given address */
  read: function(addr) {
    return this.readw(addr) + (this.readw(addr+2) << 16);
  },
  
  /* Write 8-bit byte to a given address */
  writeb: function(addr, val) {
    this._memory[addr] = 0xFF & val;
  },
  
  /* Write 16-bit word to a given address */
  writew: function(addr, val) {
    this.writeb(addr, val);
    this.writeb(addr+1, val >> 8);
  },
  
  /* Write 32-bit word to a given address */
  write: {
    this.writew(addr, val);
    this.writew(addr+2, val >> 16);
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
    this._reset();
    
    for (var i=0; i<str.length; i++) {
      this.writeb(str.charCodeAt(i));
    }
  };
  
  /* Load memory with some program, byte by byte */
  loadBytes: function(bytes) {
    this._reset();
    
    for (var i=0; i<bytes.length; i++) {
      this.writeb(bytes(i));
    }
  };
  
  /* Load memory with some program, int by int */
  loadIntegers: function(ints) {
    this._reset();
    
    for (var i=0; i<ints.length; i+=4) {
      this.write(ints(i));
    }
  };
  
  /* Load memory with some program, binary string by binary string*/
  loadBinaryString: function(binaryStrings) {
    this._reset();
    
    for (var i=0; i<binaryStrings.length; i++) {
      this.write(convertBinaryToInt(binaryStrings[i], 0));
    }
  };
};

//
//  FRISC CPU component
//

FRISC.CPU = {
  // Internal state
  _r: {r0:0, r1:0, r2:0, r3:0, r4:0, r5:0, r6:0, r7:0, pc:0, sr:0, iif:1},
  _regMap: { "000" : "r0", "001" : "r1", "010" : "r2", "011" : "r3", "100" : "r4", "101" : "r5", "110" : "r6", "111" : "r7" },
  _f: {INT2:1024, INT1:512, INT0:256, GIE:128, EINT2:64, EINT1:32, EINT0:16, Z:8, V:4, C:2, N:1},   //C=prijenos, V=preljev, Z=ništica, N=predznak
  _frequency : 10*000*000,
  
  _setFlag: function(flag, value) {
    FRISC.CPU._r.sr = value ? (FRISC.CPU._r.sr | flag) : (FRISC.CPU._r.sr & ~(flag));
  },
  
  _getFlag: function(flag) {
    return ((FRISC.CPU._r.sr & flag) !== 0) + 0;
  },
  
  _testcond: function(cond) {
    var result = true;
    
    if (cond === "") {                // **** Unconditional   TRUE
      result = true;
    } else if (cond === "_N/M") {     // ******** N,M         N=1
      result = !!(FRISC.CPU._getFlag(FRISC.CPU._f.N));
    } else if (cond === "_NN/P") {    // ******** NN,P        N=0
      result = !(FRISC.CPU._getFlag(FRISC.CPU._f.N));
    } else if (cond === "_C/ULT") {   // ******** C,ULT       C=1
      result = !!(FRISC.CPU._getFlag(FRISC.CPU._f.C));
	  } else if (cond === "_NC/UGE") {  // ******** NC,UGE      C=0
	    result = !(FRISC.CPU._getFlag(FRISC.CPU._f.C));
	  } else if (cond === "_V") {       // ******** V           V=1
	    result = !!(FRISC.CPU._getFlag(FRISC.CPU._f.V));
	  } else if (cond === "_NV") {      // ******** NV          V=0
	    result = !(FRISC.CPU._getFlag(FRISC.CPU._f.V));
	  } else if (cond === "_Z/EQ") {    // ******** Z,EQ        Z=1
	    result = !!(FRISC.CPU._getFlag(FRISC.CPU._f.Z));
	  } else if (cond === "_NZ/NE") {   // ******** NZ,NE       Z=0
	    result = !(FRISC.CPU._getFlag(FRISC.CPU._f.Z));
	  } else if (cond === "_ULE") {     // ******** ULE         C=1 ili Z=1
	    result = !!(FRISC.CPU._getFlag(FRISC.CPU._f.C)) ||
	             !!(FRISC.CPU._getFlag(FRISC.CPU._f.Z));
	  } else if (cond === "_UGT") {     // ******** UGT         C=0 i Z=0
	    result = !(FRISC.CPU._getFlag(FRISC.CPU._f.C)) ||
	             !(FRISC.CPU._getFlag(FRISC.CPU._f.Z));
	  } else if (cond === "_SLT") {     // ******** SLT         (N xor V)=1
      result = !!(FRISC.CPU._getFlag(FRISC.CPU._f.N)) !== 
               !!(FRISC.CPU._getFlag(FRISC.CPU._f.V));
	  } else if (cond === "_SLE") {     // ******** SLE         (N xor V)=1 ili Z=1
	    result = (!!(FRISC.CPU._getFlag(FRISC.CPU._f.N)) !==
	              !!(FRISC.CPU._getFlag(FRISC.CPU._f.V))) ||
	              !!(FRISC.CPU._getFlag(FRISC.CPU._f.Z));
	  } else if (cond === "_SGE") {     // ******** SGE         (N xor V)=0
	    result = !!(FRISC.CPU._getFlag(FRISC.CPU._f.N)) ===
	             !!(FRISC.CPU._getFlag(FRISC.CPU._f.V));
	  } else if (cond === "_SGT") {     // ******** SGT         (N xor V)=0 i Z=0
	    result = (!!(FRISC.CPU._getFlag(FRISC.CPU._f.N)) ===
	              !!(FRISC.CPU._getFlag(FRISC.CPU._f.V))) && 
	               !(FRISC.CPU._getFlag(FRISC.CPU._f.Z));
	  } else {
	    throw "Undefined test condition.";
	  }
	  
	  return result;
  },
  
  _decode: function(statement) {
    var opCode = getBitString(statement, 27, 31);
    var op = _instructionMap[opCode];
    var args = [];
    
    if (typeof op === "undefined") {
      return { op : null, args : null };  
    }
    
    if (op === "MOVE") {
      var src = getBitString(statement, 21, 22);
      
      if (src === "1") {
        src = "sr";
      } else {
			  src = getBitString(statement, 26, 27);
			  
			  if (src === "0") {
  				src = getBitString(statement, 17, 19);
  				src = FRISC.CPU._regMap[src];
	  		} else {
	  			src = getBitString(statement, 0, 19);
	  			src = extend(source2, 32, 1);
          src = convertBinaryToInt(source2, 1);
	  		}
		  }
      
      var dest = getBitString(statement, 20, 21);
      
      if (dest === "1") {
        dest = "sr";
      } else {    
        var dest = getBitString(statement, 23, 25);
        dest = FRISC.CPU._regMap[dest];
      }
      
      args.push(src);
      args.push(dest);
    } else if (op === "OR" || op === "AND" || op === "XOR" || op === "ADD" || op === "ADC" || op === "SUB" || op === "SBC" || op === "ROTL" || op === "ROTR" || op === "SHL" || op === "SHR" || op === "ASHR") {
    	var source1 = getBitString(statement, 20, 22);
    	source1 = FRISC.CPU._regMap[source1];
    	
      var source2 = getBitString(statement, 26, 27);
      
      if (source2 === "0") {
        source2 = getBitString(statement, 17, 19); // Rx
        source2 = FRISC.CPU._regMap[source2];
      } else {
        source2 = getBitString(statement, 0, 19); // number
        source2 = extend(source2, 32, 1);
        source2 = convertBinaryToInt(source2, 1);
      }
      
      var dest = getBitString(statement, 23, 25); // Rx
      dest = FRISC.CPU._regMap[dest];
      
      args.push(source1);
      args.push(source2);
      args.push(dest);
    } else if (op === "CMP") {
      var source1 = getBitString(statement, 20, 22);
    	source1 = FRISC.CPU._regMap[source1];
    	
      var source2 = getBitString(statement, 26, 27);
      
      if (source2 === "0") {
        source2 = getBitString(statement, 17, 19); // Rx
        source2 = FRISC.CPU._regMap[source2];
      } else {
        source2 = getBitString(statement, 0, 19); // number
        source2 = extend(source2, 32, 1);
        source2 = convertBinaryToInt(source2, 1);
      }
      
      args.push(source1);
      args.push(source2);
    } else if (op === "JP" || op === "CALL") {
      var cond = getBitString(statement, 22, 25);
      cond = FRISC.CPU._conditionMap(cond);
      
      if (typeof cond === "undefined") {
        args = null;
      } else {  
        var dest = getBitString(statement, 26, 27);
        
        if (dest === "0") {
          dest = getBitString(statement, 17, 19); // Rx
          dest = FRISC.CPU._regMap[dest];
        } else {
          dest = getBitString(statement, 0, 19); // number
          dest = extend(dest, 32, 1);
          dest = convertBinaryToInt(dest, 1);
        }
        
        args.push(cond);
        args.push(dest);
      }
    } else if (op === "JR") {
      var cond = getBitString(statement, 22, 25);
      cond = FRISC.CPU._conditionMap(cond);
      
      if (typeof cond === "undefined") {
        args = null;
      } else { 
        dest = getBitString(statement, 0, 19); // number
        dest = extend(dest, 32, 1);
        dest = convertBinaryToInt(dest, 1);
      
        args.push(cond);
        args.push(dest);
      }
    } else if (op === "RET") {     
      var cond = getBitString(statement, 22, 25);
      cond = FRISC.CPU._conditionMap(cond);
      
      if (typeof cond === "undefined") {
        args = null;
      } else {
        var isRETI = getBitString(statement, 0, 1) === "1" && getBitString(statement, 1, 2) === "0";
        var isRETN = getBitString(statement, 0, 1) === "1" && getBitString(statement, 1, 2) === "1";
        
        args.push(cond);
        args.push(isRETI);
        args.push(isRETN);
      }
    } else if (op === "LOAD" || op === "STORE" || op === "LOADB" || op === "STOREB" || op === "LOADH" || op === "STOREH") {
      var addr = getBitString(statement, 26, 27);
      var offset = 0;
      
      if (addr === "0") {
        addr = getBitString(statement, 0, 19); // number
        addr = extend(dest, 32, 1);
        addr = convertBinaryToInt(dest, 1);
      } else {
        addr = getBitString(statement, 20, 22); // Rx
        addr = FRISC.CPU._regMap[dest];
        
        offset = getBitString(statement, 0, 19); // number
        offset = extend(dest, 32, 1);
        offset = convertBinaryToInt(dest, 1);
      }
      
      var reg = getBitString(statement, 23, 25);
      reg = FRISC.CPU._regMap[dest];
      
      args.push(addr);
      args.push(offset);
      args.push(reg);
    } else if (op === "POP" || op === "PUSH") {
      var reg = getBitString(statement, 23, 25);
      dest = FRISC.CPU._regMap[dest];
      
      args.push(reg);
    } else if (op === "HALT") {
      var cond = getBitString(statement, 22, 25);
      cond = FRISC.CPU._conditionMap(cond);
      
      if (typeof cond === "undefined") {
        args = null;
      } else {
        args.push(cond);
      }
    }
    
    return { op : op, args : args };  
  },
  
  _i: {
    POP: function(dest) {
      FRISC.CPU._r[dest] = FRISC.MEM.read(FRISC.CPU._r.r7 & 0x03);
      FRISC.CPU._r.r7 += 4;
    },
    
    PUSH: function(src) {
      FRISC.CPU._r.r7 -= 4;
      FRISC.MEM.write(FRISC.CPU._r.r7, FRISC.CPU._r[src] & 0x03);
    },
    
    ADD: function(src1, src2, dest) {        
      var src1 = FRISC.CPU._r[src1];
      var src2 = typeof src2 === 'number' ? src2 : FRISC.CPU._r[src2];
      var carry = 0;
      
      var res = src1 + src2 + carry;
      
      var t1 = src1 & 0x7FFFFFF;
      var t2 = src2 & 0x7FFFFFF;
      
      var c_predzadnji = ((t1+t2+carry)>>31) & 1 > 0 ? 1 : 0;
      
      var b1 = (src1>>31) & 1;
      var b2 = (src2>>31) & 1;
      
      var c_zadnji = (b1+b2+c_predzadnji > 1 ? 1 : 0);
      
      var V = c_predzadnji ^ c_zadnji;
      var C = c_zadnji;
      
      FRISC.CPU._setFlag(FRISC.CPU._f.C, C;
      FRISC.CPU._setFlag(FRISC.CPU._f.V, V;
      FRISC.CPU._setFlag(FRISC.CPU._f.N, !!(res & 0x80000000) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.Z, !(res & 0xFFFFFFFF) + 0);
      
      FRISC.CPU._r[dest] = res & 0xFFFFFFFF;         
    },
    
    ADC: function(src1, src2, dest) {
      var src1 = FRISC.CPU._r[src1];
      var src2 = typeof src2 === 'number' ? src2 : FRISC.CPU._r[src2];
      var carry = FRISC.CPU._getFlag(FRISC.CPU._f.C);
      
      var res = src1 + src2 + carry;
      
      var t1 = src1 & 0x7FFFFFF;
      var t2 = src2 & 0x7FFFFFF;
      
      var c_predzadnji = ((t1+t2+carry)>>31) & 1 > 0 ? 1 : 0;
      
      var b1 = (src1>>31) & 1;
      var b2 = (src2>>31) & 1;
      
      var c_zadnji = (b1+b2+c_predzadnji > 1 ? 1 : 0);
      
      var V = c_predzadnji ^ c_zadnji;
      var C = c_zadnji;
      
      FRISC.CPU._setFlag(FRISC.CPU._f.C, C;
      FRISC.CPU._setFlag(FRISC.CPU._f.V, V;
      FRISC.CPU._setFlag(FRISC.CPU._f.N, !!(res & 0x80000000) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.Z, !(res & 0xFFFFFFFF) + 0);
      
      FRISC.CPU._r[dest] = res & 0xFFFFFFFF;                
    },
    
    SUB: function(src1, src2, dest) {
      var src1 = FRISC.CPU._r[src1];
      var src2 = typeof src2 === 'number' ? src2 : FRISC.CPU._r[src2];
      var carry = 0;
      
      var res = src1 - src2 - carry;
      
      src2 = (~(src2)+1) & 0xFFFFFFFF;
      carry = (~(carry)+1) & 0xFFFFFFFF;
      
      var t1 = src1 & 0x7FFFFFF;
      var t2 = src2 & 0x7FFFFFF;
      
      var c_predzadnji = ((t1+t2+carry)>>31) & 1 > 0 ? 1 : 0;
      
      var b1 = (src1>>31) & 1;
      var b2 = (src2>>31) & 1;
      
      var c_zadnji = (b1+b2+c_predzadnji > 1 ? 1 : 0);
      
      var V = c_predzadnji ^ c_zadnji;
      var C = c_zadnji;
      
      FRISC.CPU._setFlag(FRISC.CPU._f.C, (res > 0xFFFFFFFF) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.V, (res > 0xFFFFFFFF) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.N, !!(res & 0x80000000) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.Z, !(res & 0xFFFFFFFF) + 0);
      
      FRISC.CPU._r[dest] = res & 0xFFFFFFFF;     
    },
    
    SBC: function(src1, src2, dest) {
      var src1 = FRISC.CPU._r[src1];
      var src2 = typeof src2 === 'number' ? src2 : FRISC.CPU._r[src2];
      var carry = FRISC.CPU._getFlag(FRISC.CPU._f.C);
      
      var res = src1 - src2 - carry;
      
      src2 = (~(src2)+1) & 0xFFFFFFFF;
      carry = (~(carry)+1) & 0xFFFFFFFF;
      
      var t1 = src1 & 0x7FFFFFF;
      var t2 = src2 & 0x7FFFFFF;
      
      var c_predzadnji = ((t1+t2+carry)>>31) & 1 > 0 ? 1 : 0;
      
      var b1 = (src1>>31) & 1;
      var b2 = (src2>>31) & 1;
      
      var c_zadnji = (b1+b2+c_predzadnji > 1 ? 1 : 0);
      
      var V = c_predzadnji ^ c_zadnji;
      var C = c_zadnji;
      
      FRISC.CPU._setFlag(FRISC.CPU._f.C, C;
      FRISC.CPU._setFlag(FRISC.CPU._f.V, V;
      FRISC.CPU._setFlag(FRISC.CPU._f.N, !!(res & 0x80000000) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.Z, !(res & 0xFFFFFFFF) + 0);
      
      FRISC.CPU._r[dest] = res & 0xFFFFFFFF;     
    },
    
    CMP: function(src1, src2) {
      var res = FRISC.CPU._r[src1] - (typeof src2 === 'number' ? src2 : FRISC.CPU._r[src2]);
      
      FRISC.CPU._setFlag(FRISC.CPU._f.C, (res > 0xFFFFFFFF) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.V, (res > 0xFFFFFFFF) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.N, !!(res & 0x80000000) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.Z, !(res & 0xFFFFFFFF) + 0);
    },
    
    AND:  function(src1, src2, dest) {
      var res = FRISC.CPU._r[src1] & (typeof src2 === 'number' ? src2 : FRISC.CPU._r[src2]);
      
      FRISC.CPU._setFlag(FRISC.CPU._f.C, 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.V, 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.N, !!(res & 0x80000000) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.Z, !(res & 0xFFFFFFFF) + 0);
      
      FRISC.CPU._r[dest] = res & 0xFFFFFFFF;     
    },
    
    OR:  function(src1, src2, dest) {
      var res = FRISC.CPU._r[src1] | (typeof src2 === 'number' ? src2 : FRISC.CPU._r[src2]);
      
      FRISC.CPU._setFlag(FRISC.CPU._f.C, 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.V, 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.N, !!(res & 0x80000000) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.Z, !(res & 0xFFFFFFFF) + 0);
      
      FRISC.CPU._r[dest] = res & 0xFFFFFFFF;     
    },
    
    XOR:  function(src1, src2, dest) {
      var res = FRISC.CPU._r[src1] ^ (typeof src2 === 'number' ? src2 : FRISC.CPU._r[src2]);
      
      FRISC.CPU._setFlag(FRISC.CPU._f.C, 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.V, 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.N, !!(res & 0x80000000) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.Z, !(res & 0xFFFFFFFF) + 0);
      
      FRISC.CPU._r[dest] = res & 0xFFFFFFFF;     
    },
    
    SHL: function(src1, src2, dest) {
      var res = FRISC.CPU._r[src1] << (typeof src2 === 'number' ? src2 : FRISC.CPU._r[src2]);

      FRISC.CPU._setFlag(FRISC.CPU._f.C, !!(res & 0x100000000) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.V, 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.N, !!(res & 0x80000000) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.Z, !(res & 0xFFFFFFFF) + 0);
      
      FRISC.CPU._r[dest] = res & 0xFFFFFFFF; 
    },
    
    SHR: function(src1, src2, dest) {
      var src1 = FRISC.CPU._r[src1] << 32;
      
      var res = src1 >> (typeof src2 === 'number' ? src2 : FRISC.CPU._r[src2]);

      FRISC.CPU._setFlag(FRISC.CPU._f.C, !!(res & 0x80000000) + 0);
      
      res = (res >> 32);
      
      FRISC.CPU._setFlag(FRISC.CPU._f.V, 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.N, !!(res & 0x80000000) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.C, !(res & 0xFFFFFFFF) + 0);
      
      FRISC.CPU._r[dest] = res & 0xFFFFFFFF; 
    },
    
    ASHR: function(src1, src2, dest) {
      var src1 = FRISC.CPU._r[src1] << 32;
      var sign = FRISC.CPU._r[src1] & 0x80000000;
      
      var res = src1 >> (typeof src2 === 'number' ? src2 : FRISC.CPU._r[src2]);

      FRISC.CPU._setFlag(FRISC.CPU._f.C, !!(res & 0x80000000) + 0);
      
      res = (src1 >> 32);
      res = res | sign;
      
      FRISC.CPU._setFlag(FRISC.CPU._f.V, 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.N, !!(res & 0x80000000) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.Z, !(res & 0xFFFFFFFF) + 0);
      
      FRISC.CPU._r[dest] = res & 0xFFFFFFFF; 
    },
    
    ROTL: function(src1, src2, dest) {
      var res = FRISC.CPU._r[src1] << (typeof src2 === 'number' ? src2 : FRISC.CPU._r[src2]);
      
      FRISC.CPU._setFlag(FRISC.CPU._f.C, !!(res & 0x100000000) + 0);
      
      var res = (res & 0xFFFFFFFF) | ((res & 0xFFFFFFFF00000000) >> 32);
      
      FRISC.CPU._setFlag(FRISC.CPU._f.V, 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.N, !!(res & 0x80000000) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.Z, !(res & 0xFFFFFFFF) + 0);
      
      FRISC.CPU._r[dest] = res & 0xFFFFFFFF; 
    },
    
    ROTR: function(src1, src2, dest) {
      var src1 = FRISC.CPU._r[src1] << 32;
      
      var res = src1 >> (typeof src2 === 'number' ? src2 : FRISC.CPU._r[src2]);

      FRISC.CPU._setFlag(FRISC.CPU._f.C, !!(res & 0x80000000) + 0);
      
      res = (((res & 0xFFFFFFFF) << 32) | (res & 0xFFFFFFFF00000000)) >> 32;
      
      FRISC.CPU._setFlag(FRISC.CPU._f.V, 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.N, !!(res & 0x80000000) + 0);
      FRISC.CPU._setFlag(FRISC.CPU._f.Z, !(res & 0xFFFFFFFF) + 0);
      
      FRISC.CPU._r[dest] = res & 0xFFFFFFFF; 
    },
    
    MOVE: function(src, dest) {
      if (src === "sr") {
        FRISC.CPU._r[dest] = FRISC.CPU._r[src] & 0xFF; 
      } else if (dest === "sr") {
        FRISC.CPU._r[dest] = (typeof src === 'number' ? src : FRISC.CPU._r[src]) & 0xFF; 
      } else {    
        FRISC.CPU._r[dest] = (typeof src === 'number' ? src : FRISC.CPU._r[src]); 
      }
    },
    
    LOAD: function(addr, offset, reg) {
      var destAddr = (typeof addr === 'string' ? FRISC.CPU._r[addr] : 0) + (typeof offset === 'number' ? offset : 0);
      destAddr &= ~(0x03);
      FRISC.CPU._r[reg] = FRISC.MEM.read(destAddr);
    }, 

    LOADH: function(addr, offset, reg) {
      var destAddr = (typeof addr === 'string' ? FRISC.CPU._r[addr] : 0) + (typeof offset === 'number' ? offset : 0);
      destAddr &= ~(0x01);
      FRISC.CPU._r[reg] = FRISC.MEM.readw(destAddr);
    }, 
    
    LOADB: function(addr, offset, reg) {
      var destAddr = (typeof addr === 'string' ? FRISC.CPU._r[addr] : 0) + (typeof offset === 'number' ? offset : 0);
      FRISC.CPU._r[reg] = FRISC.MEM.readb(destAddr);
    }, 
    
    STORE: function(addr, offset, reg) {
      var destAddr = (typeof addr === 'string' ? FRISC.CPU._r[addr] : 0) + (typeof offset === 'number' ? offset : 0);
      destAddr &= ~(0x03);
      FRISC.MEM.write(destAddr, FRISC.CPU._r[reg]);
    },
    
    STOREH: function(addr, offset, reg) {
      var destAddr = (typeof addr === 'string' ? FRISC.CPU._r[addr] : 0) + (typeof offset === 'number' ? offset : 0);
      destAddr &= ~(0x01);
      FRISC.MEM.write(destAddr, FRISC.CPU._r[reg]);
    },
    
    STOREB: function(addr, offset, reg) {
      var destAddr = (typeof addr === 'string' ? FRISC.CPU._r[addr] : 0) + (typeof offset === 'number' ? offset : 0);
      FRISC.MEM.write(destAddr, FRISC.CPU._r[reg]);
    },
    
    JP: function(cond, dest) {
      if (FRISC.CPU._testCond(cond)) {
        FRISC.CPU._r._pc = (typeof dest === 'string' ? FRISC.CPU._r[dest] : dest) & ~(0x03);
      }
    },
     
    JR: function(cond, dest) {
      if (FRISC.CPU._testCond(cond)) {
        FRISC.CPU._r._pc = (FRISC.CPU._r._pc + dest) & ~(0x03);
      }
    },
    
    CALL: function(cond, dest) {
      if (FRISC.CPU._testCond(cond)) {
        FRISC.CPU._r.r7 -= 4;
        FRISC.MEM.write(FRISC.CPU._r.r7, FRISC.CPU._r._pc & ~(0x03));
        FRISC.CPU._r._pc = (typeof dest === 'string' ? FRISC.CPU._r[dest] : dest) & ~(0x03);
      }
    },
    
    RET: function(cond, isRETI, isRETN) {
      if (FRISC.CPU._testCond(cond)) {
        FRISC.CPU._r._pc = FRISC.MEM.read(FRISC.CPU._r.r7) & ~(0x03);
        FRISC.CPU._r.r7 += 4;
        
        if (isRETI) {
          FRISC.CPU._setFlag(FRISC.CPU._f.GIE, 1);
        } else if (isRETN) {
          FRISC.CPU._setFlag(FRISC.CPU._f.IIF, 1);
        }
      }
    },
    
    HALT: function(cond) {
      if (FRISC.CPU._testCond(cond)) {
        FRISC.CPU._stop();
      }
    }
  },

  run: function() {
    FRISC.CPU._runTimer = setInterval(performCycle, 1000);
  },

  pause: function() {
    clearInterval(FRISC.CPU._runTimer);
  },

  stop: function() {
    clearInterval(FRISC.CPU._runTimer);
  },

  performCycle: function() {
    // trigger events onBeforeCycle
    var instruction = FRISC.MEM.read(FRISC.CPU._r.pc);
    var decodedInstruction = FRISC.CPU._decode(instruction);
    
    if (decodedInstruction.op !== null && decodedInstruction.args !== null) {
      FRISC.CPU._i[decodedInstruction.op].apply(FRISC.CPU, decodedInstruction.args);
      FRISC.CPU._r.pc += 4;
      // trigger events onAfterCylce
    } else {
      FRISC.CPU.stop();
      // trigger events onAfterCylce + onError
    }
  },

  reset: function() {
    this._r = {r0:0, r1:0, r2:0, r3:0, r4:0, r5:0, r6:0, r7:0, pc:0, sr:0, iif:1};
  },

  _instructionMap: {
    "00000" : "MOVE",
    "00001" : "OR",
    "00010" : "AND",
    "00011" : "XOR",
    "00100" : "ADD",
    "00101" : "ADC",
    "00110" : "SUB",
    "00111" : "SBC",
    "01000" : "ROTL",
    "01001" : "ROTR",
    "01010" : "SHL",
    "01011" : "SHR",
    "01100" : "ASHR",
    "01101" : "CMP",
    // 01110 Not used
    // 01111 Not used
    "11000" : "JP",
    "11001" : "CALL",
    "11010" : "JR",
    "11011" : "RET",
    "10110" : "LOAD",
    "10111" : "STORE",
    "10010" : "LOADB",
    "10011" : "STOREB",
    "10100" : "LOADH",
    "10101" : "STOREH",
    "10000" : "POP",
    "10001" : "PUSH",
    "11111" : "HALT"
  },

  _conditionMap : {
	  "0000" : "",
	  "0001" : "_N/M",
	  "0010" : "_NN/P",
	  "0011" : "_C/ULT",
	  "0100" : "_NC/UGE",
	  "0101" : "_V",
	  "0110" : "_NV",
	  "0111" : "_Z/EQ",
	  "1000" : "_NZ/NE",
	  "1001" : "_ULE",
	  "1010" : "_UGT",
	  "1011" : "_SLT",
	  "1100" : "_SLE",
	  "1101" : "_SGE",
	  "1110" : "_SGT"
  }
}
