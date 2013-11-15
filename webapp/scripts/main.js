var CFGNAMES = "__friscConfigurationNames";
var isLocalStorageAvailable = 'localStorage' in window && window.localStorage !== null;

// Memory Dumping

$('#skrMemDump').click(function() {
  if (!$('#tempModalHold').length) {
    $('body').append( ''+
                    '<div id="tempModalHold">'+
                      '<div class="modal fade" id="tempModal" tabindex="-1" role="dialog" aria-labelledby="tempModal" aria-hidden="true">'+
                          '<div class="modal-dialog">'+
                              '<div class="modal-content">'+
                                  '<div class="modal-header">'+
                                      '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'+
                                      '<h4 class="modal-title" id="tempModalHeader">Modal title</h4>'+
                                  '</div>'+
                                  '<div class="modal-body" id="tempModalBody">'+
                                    ' <p>One fine body&hellip;</p>'+
                                  '</div>'+
                                  '<div class="modal-footer" id="tempModalFooter">'+
                                      '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'+
                                  '</div>'+
                              '</div><!-- /.modal-content -->'+
                          '</div><!-- /.modal-dialog -->'+
                      '</div><!-- /.modal -->'+
                    '</div>'+
                    '');
    $('#tempModal').on('hidden', function () {
      $('#tempModalHold').remove();
    });
  }

  $('#tempModalHeader').html( 'Text Memory Dump' );
  $('#tempModalBody').html( ''+
                            '<div>'+
                            ' <textarea style="width:98%; min-height:250px;" id="skrMemDumpField">'+
                            ' </textarea>'+
                            '</div>'+
                            '' );
  $('#tempModalFooter').html( '<button type="button" class="btn btn-danger" data-dismiss="modal" style="float:right; margin-left:5px;">'+
                                '<i class="icon-remove icon-white"></i> Cancle'+
                              '</button>'+
                              ''+
                              '<div style="float:right; margin-left:5px;" class="btn-group" data-toggle="buttons-radio">'+
                                '<button type="button" class="btn btn-default skrMemDumpBut">DEC</button>'+
                                '<button type="button" class="btn btn-default skrMemDumpBut active">HEX</button>'+
                              '</div>'+
                              ''+
                              '<div style="float:right; margin-left:5px;" class="btn-group" data-toggle="buttons-radio">'+
                                '<button type="button" class="btn btn-default skrMemDumpBut">8</button>'+
                                '<button type="button" class="btn btn-default skrMemDumpBut">16</button>'+
                                '<button type="button" class="btn btn-default skrMemDumpBut active">32</button>'+
                              '</div>' );

  $('.skrMemDumpBut').click(function() {
    var pressedBut = $(this).text();
    var hexDec = "hex";
    var memLen = 32;
    // Get current configuration
    $('.skrMemDumpBut.active').each(function(){
      var temp = $(this).text();
      if(temp.toLowerCase()==="hex" || temp.toLowerCase()==="dec") {
        if (temp.toLowerCase()==="hex") hexDec = "hex";
        else hexDec = "dec";
      } else {
        memLen = parseInt(temp);
      }
    });
    if(pressedBut.toLowerCase()==="hex" || pressedBut.toLowerCase()==="dec") {
      if (pressedBut.toLowerCase()==="hex") hexDec = "hex";
      else hexDec = "dec";
    } else {
      memLen = parseInt(pressedBut);
    }
    // Update textfield
    dumpMemoryTo('#skrMemDumpField', hexDec, memLen/8);
  });

  dumpMemoryTo('#skrMemDumpField');

  $('#tempModal').modal();

  return false;  
});

function dumpMemoryTo(jQuerySelector, hexDec, step, memoryWidth) {
  // Check if parameters are defined
  hexDec = typeof hexDec !== 'undefined' ? hexDec : 'hex';
  step = typeof step !== 'undefined' ? step : 4;
  memoryWidth = typeof memoryWidth !== 'undefined' ? memoryWidth : step*8;
  // Prepare data
  hexDec = hexDec.toLowerCase()==="hex";
  var field = $(jQuerySelector);
  var dump = "";
  // Generate data
  for (var i=0; i<simulator.MEM._memory.length; i+=step) {
    if (hexDec) {
      dump += formatHexNumber(friscjs.util.convertBinaryToInt(friscjs.util.convertIntToBinary(simulator.MEM.read(i), memoryWidth), 0).toString(16)) + '\n';
    } else {
      dump += simulator.MEM.read(i) + '\n';
    }
      
  }
  // Present data
  field.text(dump);
}

function appendOption(selectSelector, optionValue, optionText) {
  var option = document.createElement('option');
  option.setAttribute('value', optionValue);
  option.appendChild(document.createTextNode(optionText));
  $(selectSelector)[0].appendChild(option);
}

function getCfgNames() {
  var res = localStorage.getItem(CFGNAMES);

  if (typeof res === "undefined" || res === null) {
    localStorage.setItem(CFGNAMES, JSON.stringify([]));
    res = [];
  } else {
    res = JSON.parse(res);
  }

  return res;
}

function saveCfg(name, cfg) {
  localStorage.setItem(name, JSON.stringify(cfg));
  var cfgNames = getCfgNames();

  if (cfgNames.indexOf(name) < 0) {
    cfgNames.push(name);
  }

  localStorage.setItem(CFGNAMES, JSON.stringify(cfgNames));
  refreshCfgsSelect();
}

function deleteCfg(name) {
  var cfgNames = getCfgNames();

  if (cfgNames.indexOf(name) >= 0) {
    cfgNames.splice(cfgNames.indexOf(name), 1);
    localStorage.removeItem(name);
    localStorage.setItem(CFGNAMES, JSON.stringify(cfgNames));
  }

  refreshCfgsSelect();
}

function getCfg(name) {
  return JSON.parse(localStorage.getItem(name));
}

function refreshCfgsSelect() {
  $("#frisc-cfg-select option").each(function() {
    if ($(this).val() === "" || $(this).is("optgroup")) {
    } else {
      $(this).remove();
    }
  });

  var cfgNames = getCfgNames();

  for (var i=0; i<cfgNames.length; i++) {
    appendOption("#frisc-cfg-select", cfgNames[i], cfgNames[i]);
  }
}

function extractCurrentCfg() {
  var cfg = {};

  cfg.program = editor.getSession().getValue();
  cfg.cpuFreq = $("#frisc-freq").val();
  cfg.memSize = $("#frisc-memsize").val();
  cfg.ioUnits = [];

  var ioUnits = simulator.IO.getIoUnits();

  for (var i=0; i<ioUnits.length; i++) {
    cfg.ioUnits.push(simulator.IO.getIoUnit(ioUnits[i]).spec);
  }

  return cfg;
}

function loadCfg(cfg) {
  editor.getSession().setValue(cfg.program);

  $("#frisc-freq").val(cfg.cpuFreq);
  $("#frisc-memsize").val(cfg.memSize);

  $(".io-del").click();

  for (var i=0; i<cfg.ioUnits.length; i++) {
    $("#ioUnitName").val(cfg.ioUnits[i].ioUnitName);
    $("#ioUnitType").val(cfg.ioUnits[i].ioUnitType);
    $("#ioUnitType").change();
    $("#ioUnitIntLevel").val(cfg.ioUnits[i].intLevel);
    $("#ioUnitMemmapStart").val(cfg.ioUnits[i].memmapStart);
    $("#ioUnitMemmapCount").val(cfg.ioUnits[i].memmapCount);
    $("#frisc-io-freq").val(cfg.ioUnits[i].ioUnitFreq);

    $("#ioUnitFormStatic").submit();
  }
}

$("#frisc-cfg-save").click(function() {
  if (isLocalStorageAvailable === false) {
    $("#frisc-cfg-save-help").text("The required localStorage API is not available in your browser.");
    return;
  } else {
    $("#frisc-cfg-save-help").text("");
  }

  if (_state !== "stopped") {
    $("#frisc-cfg-save-help").text("The simulator must be stopped in order to save/load/delete configurations.");
    return;
  } else {
    $("#frisc-cfg-save-help").text("");
  }

  var name = $("#frisc-cfg-save-name").val();

  if (name === "" || name.indexOf(" ") >=0) {
    $("#frisc-cfg-save-help").text("The configuration name must be defined and must not contain whitespace characters.");
    return;
  } else {
    $("#frisc-cfg-save-help").text("");
  }

  var cfg = extractCurrentCfg();

  saveCfg(name, cfg);

  $("#frisc-cfg-save-name").val("");
});

$("#frisc-cfg-load").click(function() {
  if (isLocalStorageAvailable === false) {
    $("#frisc-cfg-load-help").text("The required localStorage API is not available in your browser.");
    return;
  } else {
    $("#frisc-cfg-load-help").text("");
  }

  if (_state !== "stopped") {
    $("#frisc-cfg-load-help").text("The simulator must be stopped in order to save/load/delete configurations.");
    return;
  } else {
    $("#frisc-cfg-load-help").text("");
  }

  var name = $("#frisc-cfg-select").val();

  if (name === null || name.indexOf(" ") >=0) {
    $("#frisc-cfg-load-help").text("You must select a configuration.");
    return;
  } else {
    $("#frisc-cfg-load-help").text("");
  }

  var cfg = getCfg(name);
  loadCfg(cfg);
});

$("#frisc-cfg-delete").click(function() {
  if (isLocalStorageAvailable === false) {
    $("#frisc-cfg-load-help").text("The required localStorage API is not available in your browser.");
    return;
  } else {
    $("#frisc-cfg-load-help").text("");
  }

  if (_state !== "stopped") {
    $("#frisc-cfg-load-help").text("The simulator must be stopped in order to save/load/delete configurations.");
    return;
  } else {
    $("#frisc-cfg-load-help").text("");
  }

  var name = $("#frisc-cfg-select").val();

  if (name === null || name.indexOf(" ") >=0) {
    $("#frisc-cfg-load-help").text("You must select a configuration.");
    return;
  } else {
    $("#frisc-cfg-load-help").text("");
  }

  deleteCfg(name);
});

$("#frisc-cfg-export").click(function() {
  if (_state !== "stopped") {
    $("#frisc-cfg-export-help").text("The simulator must be stopped in order to import/export configurations.");
    return;
  } else {
    $("#frisc-cfg-export-help").text("");
  }

  var cfg = extractCurrentCfg();

  $("#frisc-cfg-export-text").text(JSON.stringify(cfg, null, 2));
});

$("#frisc-cfg-import").click(function() {
  if (_state !== "stopped") {
    $("#frisc-cfg-import-help").text("The simulator must be stopped in order to import/export configurations.");
    return;
  } else {
    $("#frisc-cfg-import-help").text("");
  }

  try {
    var cfg = JSON.parse($("#frisc-cfg-import-text").val());
    loadCfg(cfg);
    $("#frisc-cfg-import-text").val("");
    $("#frisc-sim-link").click();
  } catch (e) {
    $("#frisc-cfg-import-help").text("There was an error in parsing your configuration. " + e.toString());
    return;
  }
});

refreshCfgsSelect();

$("#frisc-sim-link").click(function() {
  editor.resize();
});

key('backspace', function(){ return false; });

var _state = "stopped";

// create FRISC
var simulator = new friscjs.simulator();
simulator.CPU._frequency = parseFloat($("#frisc-freq").val());

window.onload = function() {
  $(function() { $("li").css("color", "#404040"); });
  editor = ace.edit("frisc-inputdiv");
  var FriscMode = require("ace/mode/frisc").Mode;
  editor.getSession().setMode(new FriscMode());
  document.getElementById('frisc-inputdiv').style.fontSize='10pt';
  document.getElementById('frisc-inputdiv').style.fontFamily='courier new';
  $(".ace_gutter").width("40px");
  editor.getSession().setValue("; aluop\n\
lab1 ADD R1, R2, R3\n\
lab2 ADD r2, 5, r5\n\
 ADD r5, lab1, r2\n\
; cmpop\n\
 CMP R1, R2\n\
lab5 CMP R1, 5\n\
lab6 CMP r4, lab5\n\
; moveop\n\
lab7 MOVE R4, R5\n\
lab8 MOVE R5, SR\n\
lab9 MOVE SR, r5\n\
 MOVE lab5, r4\n\
lab11 MOVE lab6, sr\n\
; uprop\n\
 JP lab2\n\
 JP_N 54\n\
lab12 JP_UGE (r1)\n\
lab13 RETI_M\n\
; memop\n\
lab14 STORE r1, (r2)\n\
 STORE r4, (r3+23)\n\
 STORE r4, (lab14)\n\
lab15 STORE r5, (200)\n\
lab16 POP r3\n\
; asmop\n\
lab17 `ORG 234\n\
 `DW 1,2,3,4,5\n\
 `DW 54\n\
lab18 `EQU 300\n\
lab19 `DS 12\n\
lab21 `BASE H\n\
lab22 DW 54\n\
 DH 34\n\
 DB 12\n\
lab20 `END\n\
lab23 ADD R1, R2, R3\n\
; fds fsd';");
  editor.container.style.lineHeight = "1.6";
  editor.resize();
  editor.renderer.setHScrollBarAlwaysVisible(false);
  changeState("stopped");
};

function simulatorLog(text, marginLeft) {
  if (typeof text !== "string") {
    text = JSON.stringify(text);
  }

  if (typeof marginLeft === "undefined") {
    marginLeft = "0px";
  }

  $("#cpuout").append("<div style='font-size: 9pt; margin-left: " + marginLeft + "; padding: 0px;'>" + text + "</div>");
  $("#cpuout").scrollTop($("#cpuout")[0].scrollHeight);
}

function refreshMemoryViewCurrentLine() {
  $(".currentCpuLine").removeClass("currentCpuLine");
  var currentCpuLocation = formatHexNumber(simulator.CPU._r.pc.toString(16));
  $("input[addr=" + currentCpuLocation + "]").parent().parent().addClass("currentCpuLine");
}

var breakpoints = [];

function createMemoryRow(i) {
  var lines = [];

  var checked = breakpoints.indexOf(i) >= 0 ? " checked" : "";
  var addr = formatHexNumber(i.toString(16));
  var valHex = formatHexNumber(friscjs.util.convertBinaryToInt(friscjs.util.convertIntToBinary(simulator.MEM.read(i), 32), 0).toString(16));
  var valDec = simulator.MEM.read(i).toString(10);
  var decoded = simulator.CPU._decode(simulator.MEM.read(i));
  decoded = decoded ? instructionToString(decoded) : "";
  decoded = (decoded === "MOVE r0 r0") ? "" : decoded;

  lines.push("<div style='display:inline-block; padding-left: 4px; width:70px; border-right: 1px solid #dfdfdf;' class='memoryTableNumbering'>"+addr+"</div>");
  lines.push("<div style='display:inline-block; padding-left: 4px; width:70px; border-right: 1px solid #dfdfdf;' class='memoryTableValueHex'>"+valHex+"</div>");
  lines.push("<div style='display:inline-block; padding-left: 4px; width:85px; border-right: 1px solid #dfdfdf;' class='memoryTableValueDec'>"+valDec+"</div>");
  lines.push("<div style='display:inline-block; padding-left: 4px; width:150px;' class='memoryTableValueIns'>"+decoded+"</div>");
  lines.push("<div style='display:inline-block; padding-bottom: 2px; padding-left: 4px; width:30px; text-align: center; border-left: 1px solid #dfdfdf; position: relative; top: -1.5px;'>");
  lines.push("  <input type='checkbox' addr='" + addr + "' class='breakpointCheckbox'" + checked + ">");
  lines.push("</div>");

  return lines.join("");
}

function createMemList(div) {
  var rowHeight = 18;
  var lastDivMessage = "Back to top?";
  var ofF = 1.4;

  //Don't edit this
  var maxRows = Math.floor($('#'+div).height()/rowHeight)*ofF;
  maxRows = maxRows ? maxRows : 100;
  if(Math.floor(maxRows/2)*2 == maxRows) maxRows++;

  var base = 16;
  var decoded = "";
  var bgColor = "";
  $("#"+div).html("");

  for (var i=0; i>=0 && i<maxRows*4 && i<simulator.MEM._memory.length; i+=4) {
    bgColor = (((i/4)%2) === 0) ? "evenLineMemoryView" : "oddLineMemoryView";

    $("#"+div).html($("#"+div).html()+"<div class='" + bgColor + "' style='height:"+rowHeight+"px; width:100%; position:absolute; top:"+((i/4)*rowHeight)+"px; border: 1px solid #dfdfdf;'>"+ createMemoryRow(i) + "</div>");
  }

  $("#"+div).html($("#"+div).html()+"<div style='height:"+rowHeight+"px; background-color:#f1f1f1; position:relative; top:"+((simulator.MEM._memory.length/4)*rowHeight)+"px; border-radius: 0px 0px 4px 4px;'>"+lastDivMessage+"</div>");

  function handleBreakpointSet() {
      var addr = parseInt($(this).attr('addr'), 16);
    if ($(this).is(":checked")) {
      breakpoints.push(addr);
    } else {
      breakpoints.splice(breakpoints.indexOf(addr), 1);
    }
  }

  $(".breakpointCheckbox").click(handleBreakpointSet);
  refreshMemoryViewCurrentLine();

  var prevScrollPos = 0;
  $("#"+div).scroll(function(){

    //Normal scrolling
    if  (prevScrollPos > $("#"+div).scrollTop()) { //scrolled UP
      $("#"+div).children().each(function(){
        if (($(this).position().top>$("#"+div).height()) && ($(this).html()!=lastDivMessage)){
          //Find the lowest child and it's value
          var highest = simulator.MEM._memory.length*rowHeight; //highest possible position
          var highVal = (simulator.MEM._memory.length*rowHeight);
          $("#"+div).children().each(function(){
            if (parseInt($(this).css("top").replace("px",""), 10) < highest) {
              highest = parseInt($(this).css("top").replace("px",""), 10);
              highVal = parseInt($(this).children().html(), base);
            }
          });

          highVal = highVal - 4;
          if (highVal>=0) {
            $(this).css({ top: ''+(highest-rowHeight)+'px' });
            bgColor = (((highVal/4)%2) === 0) ? "evenLineMemoryView" : "oddLineMemoryView";
            $(this).removeClass("evenLineMemoryView").removeClass("oddLineMemoryView").addClass(bgColor);
            $(this).html(createMemoryRow(highVal));
          }
        }
      });
    } else { //scrolled DOWN
      $("#"+div).children().each(function(){
        if (($(this).position().top<(-1*rowHeight)) && ($(this).html()!=lastDivMessage)){
          //Find the lowest child and it's value
          var highest = simulator.MEM._memory.length*rowHeight*-1; //highest possible position
          var highVal = 0;
          $("#"+div).children().each(function(){
            if ((parseInt($(this).css("top").replace("px",""), 10) > highest) && ($(this).html()!=lastDivMessage)) {
              highest = parseInt($(this).css("top").replace("px",""), 10);
              highVal = parseInt($(this).children().html(), base);
            }
          });
          highVal = highVal + 4;
          if (highVal<simulator.MEM._memory.length) {
            $(this).css({ top: ''+(highest+rowHeight)+'px' });
            bgColor = (((highVal/4)%2) === 0) ? "evenLineMemoryView" : "oddLineMemoryView";
            $(this).removeClass("evenLineMemoryView").removeClass("oddLineMemoryView").addClass(bgColor);
            $(this).html(createMemoryRow(highVal));
          }
        }
      });
    }

    prevScrollPos = $("#"+div).scrollTop();

    //Check if the user scrolled too fast
    var invisibleCounter = 0;
    $("#"+div).children().each(function() { if ( (($(this).position().top>$("#"+div).height()) || ($(this).position().top<0)) && ($(this).html()!=lastDivMessage)) { invisibleCounter++; } });
    if (invisibleCounter >= maxRows)  { //If all rows are invisible
      var i = Math.floor((prevScrollPos / rowHeight)) * 4;
      var x = i; //visual bug fix
      $("#"+div).children().each(function(){
        if (($(this).html()!=lastDivMessage) && (i<simulator.MEM._memory.length) && (i>=0)) {
          $(this).css({ top: ''+((i/4)*rowHeight)+'px' });
          $(this).html(createMemoryRow(i));

          i += 4;
        } else if (($(this).html()!=lastDivMessage) && (i>=simulator.MEM._memory.length) && (i>=0) && (x>=0)) { //visual bug fix
          //fixes minor glitching when the user drags the scroller to the bottom of the memory view;
          $(this).css({ top: ''+((x/4)*rowHeight)+'px' });
          $(this).html(createMemoryRow(x));
          i += 4;
          x -= 4;
        }
      });
    }

    $('.breakpointCheckbox').off('click');
    $(".breakpointCheckbox").click(handleBreakpointSet);
    refreshMemoryViewCurrentLine();
  });
}

function changeState(st) {
  if (st === "stopped") {
    enableElements(["#frisc-load", "#frisc-freq", "#frisc-memsize", ".io-del", "#addIoUnit"]);
    disableElements(["#frisc-execute", "#frisc-next", "#frisc-pause", "#frisc-stop"]);
    _state = st;
  } else if (st ==="loaded") {
    enableElements(["#frisc-execute", "#frisc-next", "#frisc-stop"]);
    disableElements(["#frisc-load", "#frisc-pause", "#frisc-freq", "#frisc-memsize", ".io-del", "#addIoUnit"]);
    _state = st;
  } else if (st === "running") {
    enableElements(["#frisc-stop", "#frisc-pause"]);
    disableElements(["#frisc-execute", "#frisc-load", "#frisc-next", "#frisc-freq", "#frisc-memsize", ".io-del", "#addIoUnit"]);
    _state = st;
  }
}

function enableElements(elems) {
  for (var i=0; i<elems.length; i++) {
    $(elems[i]).attr('disabled', false);
  }
}

function disableElements(elems) {
  for (var i=0; i<elems.length; i++) {
    $(elems[i]).attr('disabled', true);
  }
}

function getRegisterValue(key) {
  var base = $("#regBaseRadioDec").hasClass("active") ? 10 : 16;

  if (base === 10) {
    return simulator.CPU._r[key];
  } else {
    return formatHexNumber(friscjs.util.convertBinaryToInt(friscjs.util.convertIntToBinary(simulator.CPU._r[key], 32), 0).toString(16));
  }
}

$("#regBaseRadioDec, #regBaseRadioHex").click(function() {
  setTimeout( function() {
    updateCpuState();
  }, 0);
});

function cpuStateToString() {
  var retVal = "";

  for (var key in simulator.CPU._r) {
    if (key !== 'sr') {
      retVal += key + ": " + getRegisterValue(key).toString() + " ";
    } else {
      retVal += key + ": " + getRegisterValue(key).toString() + " ( ";
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
    if (instruction.op === 'RET' && instruction.args[1] === true) {
      return 'RETI ' + instruction.args[0];
    } else if (instruction.op === 'RET' && instruction.args[2] === true) {
      return 'RETN ' + instruction.args[0];
    } else if (instruction.op === 'RET') {
      return 'RET ' + instruction.args[0];
    } else {
      return instruction.op + " " + instruction.args.join(" ");
    }
  }
}

function updateCpuState() {
  for (var key in simulator.CPU._r) {
    $("#cpu_" + key + " .cpu-state-val").text(getRegisterValue(key));
  }

  for (var flag in simulator.CPU._f) {
    $("#cpu_" + flag + " .cpu-state-val").text(simulator.CPU._getFlag(simulator.CPU._f[flag]));
  }
}

updateCpuState();

simulator.CPU.onBeforeRun = function() {
  simulatorLog("<span class='label label-success'><b>Starting (or continuing) simulation!</b></span>");
};

var instructionsExecutedAfterBreak = true;

simulator.CPU.onBeforeCycle = function() {
  if (_state === "running") {
    if (breakpoints.indexOf(simulator.CPU._r.pc) >= 0 && instructionsExecutedAfterBreak) {
      simulator.CPU.pause();
      changeState("loaded");
      simulatorLog("<span class='label label-warning'><b>FRISC processor paused on breakpoint at location " + formatHexNumber(simulator.CPU._r.pc.toString(16)) + "!</b></span>");
      instructionsExecutedAfterBreak = false;
      return false;
    }
  }

  instructionsExecutedAfterBreak = true;
  simulatorLog("<span class='label label-success'><b>New CPU cycle starting!</b></span>");
  simulatorLog("<span class='label label-info'>CPU state:</span>" + " " + cpuStateToString(), "10px");
};

simulator.CPU.onAfterCycle = function() {
  refreshMemoryViewCurrentLine();
  simulatorLog("<span class='label label-info'>CPU state:</span>" + " " + cpuStateToString(), "10px");
  updateCpuState();
};

simulator.CPU.onBeforeExecute = function(instruction) {
  simulatorLog("<span class='label label-info'>Executing FRISC instruction:</span>" + " " + instructionToString(instruction), "10px");
};

simulator.CPU.onStop = function() {
  simulatorLog("<span class='label label-warning'><b>FRISC processor stopped!</b></span>");

  var ioUnits = simulator.IO.getIoUnits();

  for (var i=0; i<ioUnits.length; i++) {
    simulator.IO.getIoUnit(ioUnits[i]).reset();
  }

  changeState("stopped");
  onStopInternal();
};

simulator.MEM.onMemoryWrite = function(addr) {
  addr &= ~(0x03);
  var val = simulator.MEM.read(addr);
  addr = formatHexNumber(friscjs.util.convertBinaryToInt(friscjs.util.convertIntToBinary(addr, 32), 0).toString(16));
  var line = $("input[addr=" + addr + "]").parent().parent();
  var decoded = simulator.CPU._decode(val);
  decoded = decoded ? instructionToString(decoded) : "";
  decoded = (decoded === "MOVE r0 r0") ? "" : decoded;
  line.children(".memoryTableValueHex").html(formatHexNumber(friscjs.util.convertBinaryToInt(friscjs.util.convertIntToBinary(val, 32), 0).toString(16)));
  line.children(".memoryTableValueDec").html(val.toString());
  line.children(".memoryTableValueIns").html(decoded);
  line.addClass("memoryChangeLine");
  setTimeout(function() {
    line.removeClass("memoryChangeLine");
  }, 500);
};

$("#frisc-load").click(function() {
  if (_state === "stopped") {
    var result;

    try {
      simulator.CPU.reset();
      breakpoints = [];

      var source = editor.getSession().getValue();
      if (source.length > 0 && source[source.length-1] !== '\n') {
        source += '\n';
      }
      result = frisc_asm.parse(source);
    } catch (e) {
      simulatorLog("<span class='label label-important'><b>Parsing error</b></span> on line " + e.line + " column " + e.column + " -- " + e.toString() + "");
      return;
    }

    try {
      simulator.CPU._frequency = parseInt($("#frisc-freq").val(), 10);
      simulator.MEM._size = parseInt($("#frisc-memsize").val(), 10) * 1024;
      simulator.MEM.loadBinaryString(result.mem);
    } catch (e) {
      simulatorLog("<span class='label label-important'><b>Loading error</b></span>" + " -- " + e.toString() + "");
      return;
    }

    simulatorLog("<span class='label label-success'><b>Input program parsed successfully.</b></span>");
    changeState("loaded");

    //Show the memory list
    $("#frisc-inputdiv").hide("medium");
    $("#frisc-memorylist-hold").show("medium");
    createMemList("frisc-memorylist");
    updateCpuState();
  }
});

$("#frisc-execute").click(function() {
  if (_state === "loaded") {
    simulator.CPU.run();
    changeState("running");
  }
});

$("#frisc-stop").click(function() {
  if (_state === "running" || _state === "loaded") {
    simulator.CPU.stop();
  }
});

function onStopInternal() {
  //Hide the memory list
  $("#frisc-inputdiv").show("fast");
  $("#frisc-memorylist-hold").hide("fast");

  if ($("#frisc-memorylist-search").is(":visible")) {
    $('#frisc-memorylist-searchtoggle').click();
  }

  if ($("#frisc-memorylist-settings").is(":visible")) {
    $('#frisc-memorylist-settingstoggle').click();
  }
}

$("#frisc-next").click(function() {
  if (_state === "running" || _state === "loaded") {
    simulator.CPU.performCycle();
  }
});

$("#frisc-pause").click(function() {
  if (_state === "running") {
    simulator.CPU.pause();
    changeState("loaded");
  }
});

$("#frisc-clear").click(function() {
  $("#cpuout").html("");
});

$("#frisc-showhidesettings").click(function() {
  if ($("#frisc-settings").is(":visible")) {
    $('#cpuout').animate({ height: 145 }, 603, function() {} );
    $("#frisc-settings").hide("slow");
  } else {
    $('#cpuout').animate({ height: 100 }, 603, function() {} );
    $("#frisc-settings").show("slow");
  }
});

//memorylist search
$("#skrMemLisSearch").click(function() {
  var searcher = parseInt($("#skrMemLisSearchField").val(), 16)/4;
  $('#frisc-memorylist').animate({scrollTop: (18*searcher)}, 1000 ,function() {});

  return false;
});

var ioUnitMustacheTemplate = ' \
  <div id="iounit-{{id}}" class="form-inline" style="-moz-border-radius: 5px; -webkit-border-radius: 5px; border-radius: 5px; -moz-box-shadow: 0px 0px 4px #000000; -webkit-box-shadow: 0px 0px 4px #000000; box-shadow: 0px 0px 4px #000000; padding: 5px; margin-left: 22px; margin-bottom:20px; width: 562px; float: left;"> \
    <div class="form-inline" style="margin-bottom: 10px;"> \
      <button type="button" class="io-del btn btn-danger"><i class="icon-remove-sign icon-white"></i></button> \
      <label class="btn" style="font-size: 20px; color: black; opacity: 1;" disabled><b> {{name}}</b>, {{summary}} </label>\
    </div> \
    {{#intLevel}} \
    <div class="form-inline" style="margin-bottom: 10px;"> \
      <label>Interrupt state ({{intLevel}}):</label> \
      {{#areFieldsEditable}} \
      <input type="text" class="input-mini io-int" value="0"> \
      {{/areFieldsEditable}} \
      {{^areFieldsEditable}} \
      <span class="uneditable-input input-mini io-int" value="0">0</span> \
      {{/areFieldsEditable}} \
    </div> \
    {{/intLevel}} \
    <table class="table table-bordered table-condensed" style="margin-bottom: 5px;"> \
      <thead> \
        <tr> \
          <th> Address HEX </th> \
          <th style="width: 87px;"> Value HEX </th> \
          <th style="width: 90px;"> Value DEC </th> \
          <th style="width: 240px;"> Value BIN </th> \
        </tr> \
      </thead> \
      <tbody> \
        {{#addresses}} \
        <tr class="io-loc-{{loc}}"> \
          <td> <span class="uneditable-input io-loc" style="width: 75px;"> {{lochex}} </span> </td> \
          {{#areFieldsEditable}} \
          <td> <input type="text" style="width: 77px;" class="input io-mem-hex" value="{{hex}}"> </td> \
          <td> <input type="text" style="width: 80px;" class="input io-mem-dec" value="{{dec}}"> </td> \
          <td> <input type="text" style="width: 230px;" class="input io-mem-bin" value="{{bin}}"> </td> \
          {{/areFieldsEditable}} \
          {{^areFieldsEditable}} \
          <td> <span style="width: 77px;" class="uneditable-input io-mem-hex" value="{{hex}}"> {{hex}} </span> </td> \
          <td> <span style="width: 80px;" class="uneditable-input io-mem-dec" value="{{dec}}"> {{dec}} </span> </td> \
          <td> <span style="width: 230px;" class="uneditable-input io-mem-bin" value="{{bin}}"> {{bin}} </span> </td> \
          {{/areFieldsEditable}} \
        </tr> \
        {{/addresses}} \
      </tbody> \
    </table> \
    </div>';
$("#ioUnitType").change(function () {
  $("#ioUnitFormDynamic").html("");
  $("#frisc-io-freq").remove();
  $("#frisc-io-freq-label").remove();

  if ($(this).val() === 'generic') {
    defineGenericIoUnitTypeForm();
  } else if ($(this).val() === 'frisc-ct') {
    defineFriscCtIoUnitTypeForm();
  } else if ($(this).val() === 'frisc-pio') {
    defineFriscPioIoUnitTypeForm();
  } else if ($(this).val() === 'frisc-dma') {
    defineFriscDmaIoUnitTypeForm();
  }
});

function convertIoUnitNameToId(ioUnitName) {
  return ioUnitName.toLowerCase();
}

$("#ioUnitFormStatic").submit(function() {
  var ioUnitName = $("#ioUnitName").val();
  var ioUnitId = convertIoUnitNameToId(ioUnitName);
  var intLevel = parseInt($("#ioUnitIntLevel").val()[3]);
  var memmapStart = parseInt($("#ioUnitMemmapStart").val(), 16);
  var memmapCount = parseInt($("#ioUnitMemmapCount").val(), 10);

  var addresses = [];

  for (var i=0; i<memmapCount; i++) {
    addresses.push({hex : 0, bin : 0, dec : 0, loc : i*4 + memmapStart, lochex : formatHexNumber((i*4 + memmapStart).toString(16), 8)});
  }

  var d = {
    id : ioUnitId,
    name : ioUnitName,
    intLevel : (intLevel !== null) ? "INT" + intLevel : intLevel,
    addresses : addresses,
  };

  if (($("#ioUnitType").val() === 'generic')) {
    d.summary = "Generic IO unit";
    d.areFieldsEditable = true;
  } else if ($("#ioUnitType").val() === 'frisc-ct') {
    var frequency = parseInt($("#frisc-io-freq").val());
    d.summary = "FRISC-CT unit, " + frequency + "Hz";
    d.areFieldsEditable = false;
    d.freq = frequency;
  } else if ($("#ioUnitType").val() === 'frisc-pio') {
    var frequency = parseInt($("#frisc-io-freq").val());
    d.summary = "FRISC-PIO unit, " + frequency + "Hz";
    d.areFieldsEditable = false;
    d.freq = frequency;
  } else if ($("#ioUnitType").val() === 'frisc-dma') {
    d.summary = "FRISC-DMA unit";
    d.areFieldsEditable = false;
  }

  try {
    var ioUnit = null;
    if (($("#ioUnitType").val() === 'generic')) {
      ioUnit = simulator.IO.createGenericIoUnit(ioUnitId, { memMapAddrCount : memmapCount, memMapAddrStart : memmapStart, intLevel : intLevel});
    } else if ($("#ioUnitType").val() === 'frisc-ct') {
      ioUnit = simulator.IO.createFriscCtIoUnit(ioUnitId, { memMapAddrCount : memmapCount, memMapAddrStart : memmapStart, intLevel : intLevel, frequency : d.freq });
    } else if ($("#ioUnitType").val() === 'frisc-pio') {
      ioUnit = simulator.IO.createFriscPioIoUnit(ioUnitId, { memMapAddrCount : memmapCount, memMapAddrStart : memmapStart, intLevel : intLevel, frequency : d.freq });
    } else if ($("#ioUnitType").val() === 'frisc-dma') {
      ioUnit = simulator.IO.createFriscDmaIoUnit(ioUnitId, { memMapAddrCount : memmapCount, memMapAddrStart : memmapStart, intLevel : intLevel });
    }

    simulator.IO.addIoUnit(ioUnit);

    ioUnit.spec = {
      ioUnitName : $("#ioUnitName").val(),
      intLevel : $("#ioUnitIntLevel").val(),
      memmapStart : $("#ioUnitMemmapStart").val(),
      memmapCount : $("#ioUnitMemmapCount").val(),
      ioUnitType : $("#ioUnitType").val(),
      ioUnitFreq : $("#frisc-io-freq").val()
    };

    var s = Mustache.render(ioUnitMustacheTemplate, d);
    $("#ioUnits").append(s);

    $("#iounit-" + ioUnitId + " .io-int").keyup(function(ioUnitId) {
      return function() {
        var ioIntVal = $("#iounit-" + ioUnitId + " .io-int").val();
        if (ioIntVal.length > 0 && parseInt(ioIntVal) !== 0) {
          simulator.IO.generateInterrupt(ioUnitId);
        }
      };
    }(ioUnitId));

    for (var i=0; i<memmapCount; i++) {
      var loc = i*4 + memmapStart;

      $(".io-loc-" + loc + " .io-mem-hex").keyup(function(ioUnitId, loc) {
        return function() {
          updateIoMemory(ioUnitId, loc, "hex");
        };
      }(ioUnitId, loc));

      $(".io-loc-" + loc + " .io-mem-dec").keyup(function(ioUnitId, loc) {
        return function() {
          updateIoMemory(ioUnitId, loc, "dec");
        };
      }(ioUnitId, loc));

      $(".io-loc-" + loc + " .io-mem-bin").keyup(function(ioUnitId, loc) {
        return function() {
          updateIoMemory(ioUnitId, loc, "bin");
        };
      }(ioUnitId, loc));
    }

    $("#iounit-" + ioUnitId + " .io-del").click(function() {
      removeIoUnit(ioUnitId);
    });

    ioUnit.onStateChange = function() {
      refreshIoUnitState(ioUnitId);
    };

    $("#ioUnitFormStatic").each(function() { this.reset(); });
    $("#frisc-io-freq").remove();
    $("#frisc-io-freq-label").remove();
  } catch (e) {
    simulatorLog("<span class='label label-important'><b>IO error</b></span> " + e.toString() + "");
  }

  return false;
});

function refreshIoUnitState(ioUnitId) {
  var ioUnit = simulator.IO.getIoUnit(ioUnitId);

  for (var i=0; i<ioUnit.memMapAddrCount; i++) {
    var ioMemoryAddress = i*4 + ioUnit.memMapAddrStart;
    var val = simulator.MEM.read(ioMemoryAddress);
    $(".io-loc-" + ioMemoryAddress + " .io-mem-" + "dec").val(val.toString(10));
    $(".io-loc-" + ioMemoryAddress + " .io-mem-" + "dec").text(val.toString(10));
    updateIoMemory(ioUnitId, ioMemoryAddress, "dec", true);
  }

  $("#iounit-" + ioUnitId + " .io-int").val(ioUnit.interruptState);
  $("#iounit-" + ioUnitId + " .io-int").text(ioUnit.interruptState);
}

function removeIoUnit(ioUnitId) {
  $("#iounit-" + ioUnitId).remove();
  simulator.IO.removeIoUnit(ioUnitId);
}

function formatHexNumber(num) {
  while (num.length < 8) {
    num = "0" + num;
  }

  return num.toUpperCase();
}

function formatBinNumber(num) {
  while (num.length < 32) {
    num = "0" + num;
  }

  return num;
}

function updateIoMemory(ioUnitId, ioMemoryAddress, valueType, blockPropagate) {
  var val = $(".io-loc-" + ioMemoryAddress + " .io-mem-" + valueType).val();

  if (valueType === 'hex' && isNaN(parseInt(val, 16))) {
    val = 0;
  } else if (valueType === 'dec' && isNaN(parseInt(val, 10))) {
    val = 0;
  } else if (valueType === 'bin' && isNaN(parseInt(val, 2))) {
    val = 0;
  }

  if (valueType === 'hex') {
    val = parseInt(val, 16);
    posval = val < 0 ? friscjs.util.convertBinaryToInt(friscjs.util.convertIntToBinary(val, 32), 0) : val;

    $(".io-loc-" + ioMemoryAddress + " .io-mem-" + "dec").val(val.toString(10));
    $(".io-loc-" + ioMemoryAddress + " .io-mem-" + "dec").text(val.toString(10));
    $(".io-loc-" + ioMemoryAddress + " .io-mem-" + "bin").val(formatBinNumber(posval.toString(2)));
    $(".io-loc-" + ioMemoryAddress + " .io-mem-" + "bin").text(formatBinNumber(posval.toString(2)));
  } else if (valueType === 'dec') {
    val = parseInt(val, 10);
    posval = val < 0 ? friscjs.util.convertBinaryToInt(friscjs.util.convertIntToBinary(val, 32), 0) : val;

    $(".io-loc-" + ioMemoryAddress + " .io-mem-" + "hex").val(formatHexNumber(posval.toString(16)));
    $(".io-loc-" + ioMemoryAddress + " .io-mem-" + "hex").text(formatHexNumber(posval.toString(16)));
    $(".io-loc-" + ioMemoryAddress + " .io-mem-" + "bin").val(formatBinNumber(posval.toString(2)));
    $(".io-loc-" + ioMemoryAddress + " .io-mem-" + "bin").text(formatBinNumber(posval.toString(2)));
  } else if (valueType === 'bin') {
    val = parseInt(val, 2);
    posval = val < 0 ? friscjs.util.convertBinaryToInt(friscjs.util.convertIntToBinary(val, 32), 0) : val;

    $(".io-loc-" + ioMemoryAddress + " .io-mem-" + "hex").val(formatHexNumber(posval.toString(16)));
    $(".io-loc-" + ioMemoryAddress + " .io-mem-" + "hex").text(formatHexNumber(posval.toString(16)));
    $(".io-loc-" + ioMemoryAddress + " .io-mem-" + "dec").val(val.toString(10));
    $(".io-loc-" + ioMemoryAddress + " .io-mem-" + "dec").text(val.toString(10));
  }

  if (typeof blockPropagate === 'undefined' || !(blockPropagate)) {
    var onc = simulator.IO.getIoUnit(ioUnitId).onStateChange;
    delete simulator.IO.getIoUnit(ioUnitId).onStateChange;
    simulator.MEM.write(ioMemoryAddress, val);
    simulator.IO.getIoUnit(ioUnitId).onStateChange = onc;
  }
}

function defineGenericIoUnitTypeForm() {
  $("#ioUnitMemmapCount").val(0);
  $("#ioUnitMemmapCount").attr("disabled", false);
}

function defineFriscCtIoUnitTypeForm() {
  $("#addIoUnit").before('<label id="frisc-io-freq-label"> Frequency (Hz): </label>\n<input class="span1" type="text" style="margin-right: 4px;" id="frisc-io-freq" value="1000">');
  $("#ioUnitMemmapCount").val(4);
  $("#ioUnitMemmapCount").attr("disabled", true);
}

function defineFriscPioIoUnitTypeForm() {
  $("#addIoUnit").before('<label id="frisc-io-freq-label"> Frequency (Hz): </label>\n<input class="span1" type="text" style="margin-right: 4px;" id="frisc-io-freq" value="1000">');
  $("#ioUnitMemmapCount").val(4);
  $("#ioUnitMemmapCount").attr("disabled", true);
}

function defineFriscDmaIoUnitTypeForm() {
  $("#ioUnitMemmapCount").val(6);
  $("#ioUnitMemmapCount").attr("disabled", true);
}
