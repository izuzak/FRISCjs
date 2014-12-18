define('ace/mode/frisc', function(require, exports, module) {

  var oop = require("ace/lib/oop");
  var TextMode = require("ace/mode/text").Mode;
  var Tokenizer = require("ace/tokenizer").Tokenizer;
  var FriscHighlightRules = require("ace/mode/frisc_highlight_rules").FriscHighlightRules;

  var Mode = function() {
    this.$tokenizer = new Tokenizer(new FriscHighlightRules().getRules());
  };
  oop.inherits(Mode, TextMode);

  (function() {
    // Extra logic goes here.
  }).call(Mode.prototype);

  exports.Mode = Mode;
  });

  define('ace/mode/frisc_highlight_rules', function(require, exports, module) {

  var oop = require("ace/lib/oop");
  var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

  var FriscHighlightRules = function() {
    var keywords_all = ("add|move|or|and|xor|adc|sub|sbc|rotl|rotr|shl|shr|ashr|cmp|ret|reti|retn|halt|jp|call|jr|" +
    "load|store|loadb|storeb|loadh|storeh|pop|push|`org|`dw|`equ|`ds|`end|`base|dw|dh|db").split("|");

    var keywords_withCond = ("ret|reti|retn|halt|jp|call|jr").split("|");

    var conditions = ("_m|_nn|_nv|_nz|_ne|_nc|_n|_p|_c|_ult|_uge|_v|_z|_eq|_ule|_ugt|_slt|_sle|_sge|_sgt").split("|");

    var kw_all = {};
    for (var i=0; i<keywords_all.length; i++) {
      kw_all[keywords_all[i]] = null;
    }

    var kw_withCond = {};
    for (var i=0; i<keywords_withCond.length; i++) {
      kw_withCond[keywords_withCond[i]] = null;
    }

    var conds = {};
    for (var i=0; i<conditions.length; i++) {
      conds[conditions[i]] = null;
    }

    this.$rules = {
      start : [
        {
          token : "frisc_comment",
          regex : ";.*$"
        }, {
          token : "frisc_label",
          regex : "^[a-zA-Z][0-9a-zA-Z_]*"
        }, {
          token : "frisc_register",
          regex : "\\s?\\b[Rr][0-7]\\b"
        }, {
          token : "frisc_register",
          regex : "\\s?\\b[sS][pP]\\b"
        }, {
          token : "frisc_register",
          regex : "\\s?\\b[Ss][Rr]\\b"
        }, {
          token : "frisc_lparen",
          regex : "[(]"
        }, {
          token : "frisc_rparen",
          regex : "[)]"
        }, {
          token : "frisc_numeric",
          regex : "\\b[0-9][0-9a-fA-F]*\\b"
        }, {
          token : function(v0, v1, v2) {
                    if (kw_withCond.hasOwnProperty(v1.toLowerCase()) && (typeof v2 !== "undefined") && conds.hasOwnProperty(v2.toLowerCase())) {
                      return ["frisc_random", "frisc_instruction", "frisc_instruction"];
                    } else if (kw_all.hasOwnProperty(v1.toLowerCase()) && (typeof v2 === "undefined")) {
                      return ["frisc_random", "frisc_instruction"];
                    } else if (typeof v2 !== "undefined") {
                      return ["frisc_random", "frisc_random", "frisc_random"];
                    } else {
                      return ["frisc_random", "frisc_random"];
                    }
                  },
          regex : "(\\s)([`]?[a-zA-z][a-zA-Z]*)(_[a-zA-Z]*)?\\b"
        }, {
          token : "frisc_operator",
          regex : "[,+-]"
        }
      ]
    };
  };

  oop.inherits(FriscHighlightRules, TextHighlightRules);

  exports.FriscHighlightRules = FriscHighlightRules;
});
