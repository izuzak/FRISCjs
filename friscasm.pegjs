{
  var defaultBase = 16;
  var curloc = 0;
  var labels = {};
  var instructions = [];
  var instruction = {};
  var linecounter = 1;
  
  var moveops = {  
    "MOVE"   : "00000"
  };
  
  var aluops = {
    "OR"     : "00001",
    "AND"    : "00010",
    "XOR"    : "00011",
    "ADD"    : "00100",
    "ADC"    : "00101",
    "SUB"    : "00110",
    "SBC"    : "00111",
    "ROTL"   : "01000", 
    "ROTR"   : "01001",
    "SHL"    : "01010",
    "SHR"    : "01011",
    "ASHR"   : "01100"
  };
  
  var cmpops = {
    "CMP"    : "01101"
  };
    // 01110 Not used
    // 01111 Not used
  
  var rethaltops = {
    "RET"    : "11011",
    "RETI"   : "11011",
    "RETN"   : "11011",
    "HALT"   : "11111"
  };
  
  var jmpops = {
    "JP"     : "11000",
    "CALL"   : "11001",
    "JR"     : "11010"
  };
  
  var memops = {
    "LOAD"   : "10110",
    "STORE"  : "10111",
    "LOADB"  : "10010",
    "STOREB" : "10011",
    "LOADH"  : "10100",
    "STOREH" : "10101"
  };
  
  var stackops = {
    "POP"    : "10000",
    "PUSH"   : "10001"
  };
  
  var orgops = {
    "`ORG" : ""
  };
  
  var dwops = {
    "`DW" : ""
  };
  
  var equops = {
    "`EQU" : ""
  };
  
  var dsops = {
    "`DS" : ""
  };
  
  var endops = {
    "`END" : ""
  };
  
  var baseops = {
    "`BASE" : ""
  };
  
  var dwhbops = {
    "DW" : "",
    "DH" : "",
    "DB" : ""
  };
  
  var flags = {
    ""   : "0000",
    "N"  : "0001",   "M"   : "0001",
    "NN" : "0010",   "P"   : "0010",
    "C"  : "0011",   "ULT" : "0011",
    "NC" : "0100",   "UGE" : "0100",
    "V"  : "0101",
    "NV" : "0110",
    "Z"  : "0111",   "EQ"  : "0111",
    "NZ" : "1000",   "NE"  : "1000",

    "ULE"  : "1001",
    "UGT"  : "1010",
    "SLT"  : "1011",
    "SLE"  : "1100",
    "SGE"  : "1101",
    "SGT"  : "1110"
  };

  var allops = {
    aluop : aluops, moveop : moveops, cmpop : cmpops, memop : memops, stackop : stackops,
    jmpop : jmpops, rethaltop : rethaltops, equop : equops, dwop : dwops, orgop : orgops, dsop : dsops, 
    endop : endops, dwhbop : dwhbops, baseop : baseops
  };

  var generateMachineCode = function(node) {
    if (typeof node === 'undefined' || typeof node.op === 'undefined' || typeof node.optype === 'undefined' ||
        typeof allops[node.optype] === 'undefined' || typeof allops[node.optype][node.op] === 'undefined') {
      throw new Error("Undefined instruction, operation or operation type." + JSON.stringify(node));
    }

    var machineCode = null;

    if (node.optype in {cmpop : null, aluop : null, moveop : null, memop : null, stackop : null, jmpop : null, rethaltop: null}) {
      // set opcode
      machineCode = "00000000000000000000000000000000".split("");
      setBits(machineCode, 27, 31, allops[node.optype][node.op]);
    } else {
      machineCode = [];
    }

    switch(node.optype) {
      case 'cmpop':
      case 'aluop':
        if (node.optype === 'aluop') {
          setBits(machineCode, 23, 25, convertIntToBinary(node.aludest.value, 3));
        }
        setBits(machineCode, 20, 22, convertIntToBinary(node.alusrc1.value, 3));
        
        if (node.alusrc2.type === "reg") {
          setBits(machineCode, 26, 26, "0");
          setBits(machineCode, 17, 19, convertIntToBinary(node.alusrc2.value, 3));
          setBits(machineCode, 0, 16, "00000000000000000");
        } else {
          setBits(machineCode, 26, 26, "1");
          setBits(machineCode, 0, 19, convertIntToBinary(node.alusrc2.value, 20));
        }

        break;
      case 'moveop':
        if (node.aludest.type === "reg" && (node.alusrc2.type === "reg" || node.alusrc2.type === "num")) {
          // Kada je odredište opći registar, a izvor opći registar ili podatak:
          setBits(machineCode, 23, 25, convertIntToBinary(node.aludest.value, 3));
          setBits(machineCode, 20, 22, "000");
          if (node.alusrc2.type === "reg") {
            setBits(machineCode, 26, 26, "0");
            setBits(machineCode, 17, 19, convertIntToBinary(node.alusrc2.value, 3));
          } else {
            setBits(machineCode, 26, 26, "1");
            setBits(machineCode, 0, 19, convertIntToBinary(node.alusrc2.value, 20));
          }
        } else if (node.aludest.type === "sr") {
          // Kada je odredište registar SR:
          setBits(machineCode, 20, 22, "001");
          if (node.alusrc2.type === "reg") {
            setBits(machineCode, 26, 26, "0");
            setBits(machineCode, 17, 19, convertIntToBinary(node.alusrc2.value, 3));
          } else {
            setBits(machineCode, 26, 26, "1");
            setBits(machineCode, 0, 19, convertIntToBinary(node.alusrc2.value, 20));
          }
        } else if (node.alusrc2.type === "sr") {
          // Kada je izvor registar SR:
          setBits(machineCode, 20, 22, "010");
          setBits(machineCode, 23, 25, convertIntToBinary(node.aludest.value, 3));
          setBits(machineCode, 0, 19, "00000000000000000000");
        }

        break;
      case 'jmpop':
        setBits(machineCode, 20, 21, "00");
        setBits(machineCode, 22, 25, flags[node.flag]);
        if (node.addr.type === "num") {
          setBits(machineCode, 26, 26, "1");
          setBits(machineCode, 0, 19, convertIntToBinary(node.addr.value, 20));
        } else { 
          setBits(machineCode, 26, 26, "0");
          setBits(machineCode, 17, 19, convertIntToBinary(node.addr.value, 3));
        }
        break;
      case 'rethaltop':
        setBits(machineCode, 22, 25, flags[node.flag]);
        if (node.op === 'RET') {
          setBits(machineCode, 0, 0, "0");
          setBits(machineCode, 1, 1, "0");
        } else if (node.op === 'RETI') {
          setBits(machineCode, 0, 0, "1");
          setBits(machineCode, 1, 1, "0");
        } else if (node.op === 'RETN') {
          setBits(machineCode, 0, 0, "1");
          setBits(machineCode, 1, 1, "1");
        }

        break;
      case 'memop':
        setBits(machineCode, 23, 25, convertIntToBinary(node.reg.value, 3));
        if (node.mem.type === "regoff") {
          setBits(machineCode, 26, 26, "1");
          setBits(machineCode, 20, 22, convertIntToBinary(node.mem.value, 3));
          setBits(machineCode, 0, 19, convertIntToBinary(node.mem.offset, 20));
        } else {
          setBits(machineCode, 26, 26, "0");
          setBits(machineCode, 0, 19, convertIntToBinary(node.mem.value, 20));
        }
        break;
      case 'stackop':
        setBits(machineCode, 23, 25, convertIntToBinary(node.reg.value, 3));
        break;
      case 'dwop':
        for (var i=0; i<node.values.length; i++) {
          machineCode.push(convertIntToBinary(node.values[i], 8));
        }
        break;
      case 'dsop':
        for (var i=0; i<node.value; i++) {
          machineCode.push(convertIntToBinary(0, 8));
        }
        break;
      case 'dwhbop':
        for (var i=0; i<node.values.length; i++) {
          machineCode.push(convertIntToBinary(node.values[i], node.size*8));
        }
        break;
    }
    if (node.optype in {cmpop : null, aluop : null, moveop : null, memop : null, stackop : null, jmpop : null, rethaltop : null}) {
      node.machineCode = machineCode.join("");
    } else {
      node.machineCode = machineCode;
    }
  };

  var setBits = function(oldBits, from, to, newBits) {
    var len = oldBits.length;
    
    for (var i=0; i<from-to+1 || i<newBits.length; i++) {
      oldBits[len-to-1+i] = newBits[i];
    }

    return oldBits;
  };

  /* Converts integer value to binary, specifying the length in bits of output */
  function convertIntToBinary(value, numberOfBits) {
    var retVal = new Array(numberOfBits);
    
    for (var i=0; i<numberOfBits; i++) {
      retVal[numberOfBits-i-1] = (Math.pow(2, i) & value) ? 1 : 0; 
    }
    
    return retVal.join("");
  }  
}

instructions
  = i1:instruction_or_end i2:(nl:newline &{linecounter++; return true;} i3:instruction_or_end )* {
    var instrs = [];
    var machinecode = [];
    var unknownlabels = [];

    if (typeof i1.op !== "undefined" && i1.op !== "") {
      instrs.push(i1);
    }
    
    for (var i=0; i<i2.length; i++) {
      if (typeof i2[i][2].op !== "undefined" && i2[i][2].op !== "") {
        instrs.push(i2[i][2]);
      }
    }

    function replaceLabel(element) {
      if (element.type === "label") {
        var labelValue = labels[element.value];

        if (typeof labelValue !== "undefined") {
          element.type = "num";
          element.value = labelValue;
        } else {
          unknownlabels.push(element.value);
          element.value = null;
        }
      }
    }
    
    // replace labels
    for (var i=0; i<instrs.length; i++) {
      if (instrs[i].op in aluops || instrs[i].op in cmpops || instrs[i].op in moveops) {
        replaceLabel(instrs[i].alusrc2);
      } else if (instrs[i].op in jmpops) {
        replaceLabel(instrs[i].addr);
      } else if (instrs[i].op in memops) {
        replaceLabel(instrs[i].mem);
      } else if (instrs[i].op in dwhbops) {
        var vals = [];
        
        for (var j=0; j<instrs[i].values.length; j++) {
          replaceLabel(instrs[i].values[j]);
          vals.push(instrs[i].values[j].value);
        }

        instrs[i].values = vals;
      }
    }
    
    // check if all labels are defined
    if (unknownlabels.length > 0) {
      throw new Error("Unknown labels:" + unknownlabels.toString());
    }
   
    // generate machine code
    for (var i=0; i<instrs.length; i++) {
      generateMachineCode(instrs[i]);
      machinecode.push(instrs[i]);
    }
    
    // generate memory model
    var mem = [];
    
    var writeToMemory = function(bitString, startPosition, memoryArray) {
      if (bitString.length % 8 !== 0) {
        throw new Error("Memory string has wrong length");
      }

      var elems = bitString.match(/.{8}/g);

      for (var i=0; i<elems.length; i++) {
        memoryArray[startPosition+i] = elems[elems.length - i - 1];
      }
      
      return startPosition + elems.length;
    };
    
    for (var opCount=0, memCount=0; opCount<machinecode.length; ) {
      if (typeof machinecode[opCount].curloc === "undefined") {
        opCount++;
      } else {
        if (machinecode[opCount].curloc !== memCount) {
          memCount = writeToMemory("00000000", memCount, mem);
        } else {
          if (typeof machinecode[opCount].machineCode === "string") {
            memCount = writeToMemory(machinecode[opCount].machineCode, memCount, mem);
          } else {
            for (var j=0; j<machinecode[opCount].machineCode.length; j++) {
              memCount = writeToMemory(machinecode[opCount].machineCode[j], memCount, mem);
            }
          }
          opCount += 1;
        }
      }
    }
   
    return { ast : machinecode, mem : mem};
  }

newline
  = "\n" / "\r\n" / "\r" / "\n\r"

instruction_or_end
  = i:instruction_end { var ins = i; ins.line = linecounter-1; return {}} /
    i:instruction { var ins = i; ins.line = linecounter; return ins;} 

instruction_end
  = l:labelPart? whitespace+ o:endop c:commentPart? (newline .*)? {
      return o;
    }
 
instruction
  = l:labelPart? o:operationPart? c:commentPart? {
    if (o === "") {
      if (l !== "") {
        labels[l] = curloc;
      }

      return {};
    }

    if (!(o.op in dwops || o.op in equops || o.op in endops)) {
      curloc = curloc % 4 === 0 ? curloc : curloc + (4-curloc%4);
    }
    
    if (l !== "") {
      if (!(o.op in baseops || o.op in endops || o.op in orgops || o.op in equops)) {
        labels[l] = curloc;
      } else if (o.op in equops) {
        labels[l] = o.value;
      }
    }
    
    o.curloc = curloc;
    
    if (o.op in aluops || o.op in cmpops || o.op in moveops || o.op in jmpops || o.op in rethaltops || o.op in memops || o.op in stackops) {
      curloc += 4;
    } else if (o.op in orgops) {
      curloc = o.value;
    } else if (o.op in dwops) {
      curloc += o.values.length;
    } else if (o.op in equops) {
      curloc = curloc;
    } else if (o.op in endops) {
      curloc = curloc;
    } else if (o.op in dsops) {
      curloc += o.value;
    } else if (o.op in dwhbops) {   
      curloc += o.size*o.values.length;
    }

    if (o.op in baseops) {
      defaultBase = o.value;
    }    

    if (o.op in endops || o.op in equops || o.op in orgops || o.op in baseops) {
      return {};
    } else {
      return o;
    }
  }
  
labelPart
  = label;
  
label
  = &[a-zA-Z] l:([0-9a-zA-Z_]*) {
    return l.join("");
  }
  
operationPart
  = whitespace+ o:operation {return o;}
  
operation
  = dwhbop / baseop / dsop / equop / dwop / orgop / stackop / memop / uprop / moveop / cmpop / aluop

regaddr = value:register { return {type : "reg", value : value}; }

sraddr = value:([sS][rR]) { return {type : "sr", value : "sr"}; }

immaddr = value:number { return {type : "num", value : value}; }
        / value:label  { return {type : "label", value : value}; }

absaddr_mem = "(" value:label ")"  { return {type : "label", value : value}; }
            / "(" value:number ")" { return {type : "num", value : value}; }

absaddr_upr = immaddr

reladdr = immaddr

rinaddr = "(" value:regaddr ")" { return value; }

rinaddroff = "(" reg:register val:((&numberWithoutBase numberWithoutBase) / (!numberWithoutBase "")) ")" { 
      return {type : "regoff", value : reg, offset : val[1] === "" ? 0 : val[1]  };
    }

impaddr = regaddr

delimiter = whitespace* "," whitespace*

moveop_name = "MOVE"
  
aluop_name = "OR" / "AND" / "XOR" / "ADD" / "ADC" / "SUB" / "SBC" / "ROTL" / "ROTR" / "SHL" / "SHR" / "ASHR"
  
cmpop_name = "CMP"

nonjmpop_name = "RETI" / "RETN" / "RET" / "HALT"
  
jmpop_name = "JP" / "CALL" / "JR"
  
memop_name = "LOADB" / "STOREB" / "LOADH" / "STOREH" / "LOAD" / "STORE"
  
stackop_name = "POP" / "PUSH"
  
orgop_name = "`ORG"
  
dwop_name = "`DW"
  
equop_name = "`EQU"

dsop_name = "`DS"

endop_name = "`END"
  
baseop_name = "`BASE"
  
dwhbop_name = "DW" / "DH" / "DB"
  
flag_name = "M" / "NN" / "NV" / "NZ" / "NE" / "NC" / "N" / "P" / "C" / "ULT" / "UGE" / "V" / "Z" / "EQ" / "ULE" / "UGT" / "SLT" / "SLE" / "SGE" / "SGT"

aluop
  = op:aluop_name whitespace+ alusrc1:regaddr delimiter alusrc2:(regaddr / immaddr) delimiter aludest:regaddr {
      return { op : op, optype : 'aluop', alusrc1 : alusrc1, alusrc2 : alusrc2, aludest : aludest };
    }
    
cmpop
  = op:cmpop_name whitespace+ alusrc1:regaddr delimiter alusrc2:(regaddr / immaddr) {
      return { op : op, optype : 'cmpop', alusrc1 : alusrc1, alusrc2 : alusrc2 };
    }

moveop
  = op:moveop_name whitespace+ alusrc2:(regaddr / sraddr / immaddr) delimiter aludest:(regaddr / sraddr) {
      return { op : op, optype : 'moveop', alusrc2 : alusrc2, aludest : aludest };
    }

uprop 
  = op:jmpop_name fl:flag whitespace+ addr:(absaddr_upr / rinaddr) {
      return { op : op, optype : 'jmpop', flag : fl, addr : addr}; 
    } / op:nonjmpop_name fl:flag {
      return { op : op, optype : 'rethaltop', flag : fl};
    } 

flag
  = "_" fl:flag_name {return fl;} / fl:"" {return fl;}

memop
  = op:memop_name whitespace+ reg:regaddr delimiter mem:(rinaddroff / absaddr_mem) {
      return { op : op, optype : 'memop', reg : reg, mem : mem };
    }
    
stackop
  = op:stackop_name whitespace+ reg:impaddr {
      return { op : op, optype : 'stackop', reg : reg };
    }    

orgop
  = op:orgop_name whitespace+ value:number {
      return { op : op, optype : 'orgop', value : value };
    }

dwop
  = op:dwop_name whitespace+ values:(number (("," whitespace*) / ""))+ {
      var vals = [];
      
      for (var i=0; i<values.length; i++) {
        vals.push(values[i][0]);
      }
      
      return { op : op, optype : 'dwop', values : vals };
    }

equop
  = op:equop_name whitespace+ value:number {
      return { op : op, optype : 'equop', value : value };
    }
    
dsop
  = op:dsop_name whitespace+ value:number {
      return { op : op, optype : 'dsop', value : value };
    }
    
endop
  = op:endop_name { return { op : op, optype : 'endop'}; }

baseop
  = op:baseop_name whitespace+ base:base {
      return { op : op, optype : 'baseop', value : base};
    }
    
dwhbop
  = op:dwhbop_name whitespace+ values:(immaddr (("," whitespace*) / ""))+ {
      var vals = [];
      
      for (var i=0; i<values.length; i++) {
        vals.push(values[i][0]);
      }

      var size = op === "DW" ? 4 : (op === "DH" ? 2 : 1);
      
      return { op : op, optype : 'dwhbop', values : vals, size : size};
    }
 
commentPart
  = whitespace* (";" [^\n]*)?

whitespace
  = " " / "\t"

register
  = [rR]regnum:[0-7] {
    return parseInt(regnum, 10);
  }

number
  = b:(("%" base " "+) / "") p:([+-])? &([0-9][0-9a-hA-H]*) digits:([0-9a-hA-H]*) { 
    var d = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"]; 
    var base = (b === "") ? defaultBase : b[1];
    for (var i=0; i<digits.length; i++) {
      var found = false;
      for (var j=0; j<base; j++) {
        if (digits[i].toLowerCase() === d[j]) {
          found = true;
          break;
        }
      }
      
      if (!found) {
        return null;
      }
    }
    
    var prefix = p === "-" ? -1 : 1;
    return prefix*parseInt(digits.join(""), base);
  }
  
base
  = b:[bBoOdDhH] {
    b = b.toLowerCase(); 
    
    if(b === "b") { 
      return 2;
    } else if (b === "o") {
      return 8;
    } else if (b === "d") {
      return 10; 
    } else if (b === "h") {
      return 16; 
    } 
  }

numberWithoutBase
  = &([+-][0-9][0-9a-hA-H]*) p:[+-] digits:([0-9a-hA-H]*) {
    return (p === "-" ? -1 : 1) * parseInt(digits.join(""), defaultBase);
  }
