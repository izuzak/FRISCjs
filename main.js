var parser = require("./friscasm.js");

var source = '\
; aluop\n\
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
lab17 `ORG 234\n\
 `DW 1,2,3,4,5\n\
 `DW 654\n\
lab18 `EQU 300\n\
lab19 `DS 12\n\
lab21 `BASE H\n\
lab22 DW 54\n\
 DH 34\n\
 DB 12\n\
lab20 `END\n\
lab23 ADD R1, R2, R3\n\
; fds fsd';

console.log(source);

var result = parser.parse(source);

console.log(result);
