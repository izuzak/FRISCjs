; aluop
lab1 ADD R1, R2, R3
lab2 ADD r2, 5, r5
 ADD r5, lab1, r2
; cmpop
 CMP R1, R2
lab5 CMP R1, 5
lab6 CMP r4, lab5
; moveop
lab7 MOVE R4, R5
lab8 MOVE R5, SR
lab9 MOVE SR, r5
 MOVE lab5, r4
lab11 MOVE lab6, sr
; uprop
 JP lab2
 JP_N 54
lab12 JP_UGE (r1)
lab13 RETI_M
; memop
lab14 STORE r1, (r2)
 STORE r4, (r3+23)
 STORE r4, (lab14)
lab15 STORE r5, (200)
lab16 POP r3
; asmop
lab17 `ORG 234
 `DW 1,2,3,4,5
 `DW 54
lab18 `EQU 300
lab19 `DS 12
lab21 `BASE H
lab22 DW 54
 DH 34
 DB 12
lab20 `END
lab23 ADD R1, R2, R3
; fds fsd';
