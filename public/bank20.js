/* Pseudocode Practice Paper (bank 20). Original mini paper: 25 questions, 80 marks, every one about pseudocode.
   One scenario runs through the paper: Kookaburra Creek Kayak Hire writes a program to run its hire counter.
   It covers every control structure, subroutine form and pseudocode convention in the Course Specifications
   (sequence, binary selection, multi-way selection with CASEWHERE, nested IF, WHILE, REPEAT / UNTIL, FOR / NEXT with STEP,
   subroutines with one and many parameters, parameters that pass a value back, functions with RETURN, arrays, and
   flowchart and structure chart refinement), in the question styles of the HSC online exam: write an algorithm, complete a
   trace, drag steps into order, select from dropdown menus, provide test data, find errors, describe and explain.
   The two figures are inline SVG built with the small kit below. */
(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var qs=[];

/* ---------- small SVG kit for the two stimulus figures ---------- */
var UID=0;
function sv(w,h,label,body){
  UID++;var a='pca'+UID;
  return '<svg class="dgm" viewBox="0 0 '+w+' '+h+'" width="'+w+'" role="img" aria-label="'+esc(label)+'">'+
    '<defs><marker id="'+a+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#000" stroke-width="1.5"/></marker></defs>'+
    '<g font-family="Arial,Helvetica,sans-serif" font-size="12" fill="#000" stroke="#000" stroke-width="1.3" stroke-linejoin="round">'+
    body.replace(/#A/g,'url(#'+a+')')+'</g></svg>';
}
function gTxt(x,y,lines,o){
  o=o||{};lines=[].concat(lines);var lh=o.lh||14,y0=y-(lines.length-1)*lh/2+4;
  return '<text x="'+x+'" y="'+y0+'" text-anchor="'+(o.anchor||'middle')+'" stroke="'+(o.halo===false?'none':'#fff')+'" stroke-width="3" paint-order="stroke"'+
    (o.size?' font-size="'+o.size+'"':'')+'>'+
    lines.map(function(s,i){return '<tspan x="'+x+'" dy="'+(i?lh:0)+'">'+esc(s)+'</tspan>'}).join('')+'</text>';
}
function gRect(x,y,w,h,lines,o){o=o||{};return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="#fff"'+(o.rx?' rx="'+o.rx+'"':'')+'/>'+(lines?gTxt(x+w/2,y+h/2,lines,{halo:false,lh:13}):'')}
function gTerm(x,y,w,h,lines){return gRect(x,y,w,h,lines,{rx:h/2})}
function gDia(cx,cy,w,h,lines){return '<polygon points="'+cx+','+(cy-h/2)+' '+(cx+w/2)+','+cy+' '+cx+','+(cy+h/2)+' '+(cx-w/2)+','+cy+'" fill="#fff"/>'+(lines?gTxt(cx,cy,lines,{size:11,halo:false,lh:12}):'')}
function gPar(x,y,w,h,lines){var k=Math.min(14,h/2);return '<polygon points="'+(x+k)+','+y+' '+(x+w)+','+y+' '+(x+w-k)+','+(y+h)+' '+x+','+(y+h)+'" fill="#fff"/>'+(lines?gTxt(x+w/2,y+h/2,lines,{halo:false,lh:13}):'')}
function gLine(pts,arrow){return '<polyline points="'+pts.map(function(p){return p[0]+','+p[1]}).join(' ')+'" fill="none"'+(arrow?' marker-end="#A"':'')+'/>'}
function gDot(x,y,filled){return '<circle cx="'+x+'" cy="'+y+'" r="4.5" fill="'+(filled?'#000':'#fff')+'"/>'}

/* ---------- Q23: structure chart for the kayak return program ---------- */
function sbox(x,y,w,h,text){return gRect(x,y,w,h,text)}
function drops(px,pb,busY,xs,topY){
  var lo=Math.min.apply(null,xs.concat([px])),hi=Math.max.apply(null,xs.concat([px])),o=gLine([[px,pb],[px,busY]])+gLine([[lo,busY],[hi,busY]]);
  xs.forEach(function(x){o+=gLine([[x,busY],[x,topY]])});return o;
}
/* a data couple: a circle on the line, an arrow beside it, and the label */
function couple(pt,dir,label,side){
  var x=pt[0],y=pt[1],l=side==='l',ax=x+(l?-13:13);
  return gDot(x,y,false)+gLine(dir==='u'?[[ax,y+9],[ax,y-9]]:[[ax,y-9],[ax,y+9]],true)+gTxt(x+(l?-20:20),y,label,{anchor:l?'end':'start',lh:12,size:11});
}
function sdec(pt){return '<polygon points="'+pt[0]+','+(pt[1]-7)+' '+(pt[0]+7)+','+pt[1]+' '+pt[0]+','+(pt[1]+7)+' '+(pt[0]-7)+','+pt[1]+'" fill="#fff"/>'}
function figReturn(){
  var out=drops(320,56,98,[100,320,540],170);
  out+=sbox(260,20,120,36,'Process return')+sbox(40,170,120,36,'Get return details')+sbox(260,170,120,36,'Calculate late fee')+sbox(480,170,120,36,'Print receipt');
  out+=couple([100,120],'u','kayakID','l')+couple([100,148],'u','hoursLate','l');
  out+=sdec([320,108])+couple([320,128],'d','hoursLate','l')+couple([320,152],'u','lateFee','r');
  out+=couple([540,120],'d','kayakID','l')+couple([540,148],'d','lateFee','r');
  return sv(640,226,'Structure chart for the kayak return program',out);
}

/* ---------- Q24: flowchart for the wind check ---------- */
function figWind(){
  var o='';
  o+=gTerm(130,10,100,30,'BEGIN')+gLine([[180,40],[180,62]],true);
  o+=gRect(110,62,140,30,'count = 0')+gLine([[180,92],[180,112]],true);
  o+=gRect(110,112,140,30,'day = 1')+gLine([[180,142],[180,166]],true);
  o+=gDia(180,198,140,64,'day <= 7?');
  o+=gLine([[180,230],[180,262]],true)+gTxt(194,247,'Yes',{anchor:'start',size:11});
  o+=gPar(100,262,160,32,'Get windSpeed')+gLine([[180,294],[180,320]],true);
  o+=gDia(180,352,160,64,'windSpeed > 20?');
  o+=gLine([[260,352],[300,352]],true)+gTxt(280,343,'Yes',{size:11});
  o+=gRect(300,336,130,32,'count = count + 1');
  o+=gLine([[365,368],[365,412],[180,412]])+gLine([[180,384],[180,432]],true)+gTxt(194,400,'No',{anchor:'start',size:11});
  o+=gRect(110,432,140,30,'day = day + 1');
  o+=gLine([[110,447],[50,447],[50,198],[110,198]],true);
  o+=gLine([[250,198],[450,198],[450,520],[254,520]],true)+gTxt(268,190,'No',{size:11});
  o+=gPar(100,504,160,32,'Display count')+gLine([[180,536],[180,566]],true)+gTerm(130,566,100,30,'END');
  return sv(470,610,'Flowchart for the wind check algorithm',o);
}
function figWrap(html){return '<div class="dgmfig">'+html+'</div>'}

/* ---------- Question 1: pseudocode conventions ---------- */
qs.push(Q(SEP,'Kookaburra Creek Kayak Hire is developing a program to run its hire counter. The developers must write their pseudocode using the conventions in the Course Specifications. Four fragments of pseudocode are shown.'+
 tbl(['Fragment','Pseudocode'],[
  ['A',code(`IF hours > 4 THEN
    Display "Late fee applies"`)],
  ['B',code(`WHILE kayaksLeft > 0
    Set kayaksLeft = kayaksLeft - 1
ENDWHILE`)],
  ['C',code(`REPEAT
    Get code
ENDWHILE code = safeCode`)],
  ['D',code(`if hours > 4 then
    Display "Late fee applies"
endif`)]]),[
 mc('Which fragment follows the conventions for pseudocode in the Course Specifications?',['Fragment A','Fragment B','Fragment C','Fragment D'],1,'Keywords are written in capitals, and every structure has its closing keyword: IF ends with ENDIF and WHILE ends with ENDWHILE. Fragment A has no ENDIF, Fragment C ends a REPEAT with ENDWHILE instead of UNTIL, and Fragment D uses lower case keywords.')],{two:true}));

/* ---------- Question 2: classify control structures (3 marks) ---------- */
qs.push(Q(SEP,'Seven segments of pseudocode from the hire counter program are shown.'+
 tbl(['Segment','Pseudocode'],[
  ['1',code(`WHILE kayaksOut > 0
    Get returnedID
    Set kayaksOut = kayaksOut - 1
ENDWHILE`)],
  ['2',code(`CASEWHERE flag evaluates to
    "G": Display "River open"
    "Y": Display "Take care"
    OTHERWISE: Display "River closed"
END CASE`)],
  ['3',code(`FOR lap = 1 TO 3
    Display "Lap ", lap
NEXT lap`)],
  ['4',code(`Get hours
Set cost = hours * 12
Display cost`)],
  ['5',code(`REPEAT
    Get code
UNTIL code = safeCode`)],
  ['6',code(`IF age < 16 THEN
    Display "An adult must come too"
ELSE
    Display "Solo hire allowed"
ENDIF`)],
  ['7',code(`IF depth < 0.5 THEN
    Display "Too shallow"
ELSEIF depth < 3 THEN
    Display "Safe"
ELSE
    Display "Too deep"
ENDIF`)]]),[
 mt('Classify each segment by the control structure it uses. (3 marks)',['Segment','Sequence','Binary selection','Multi-way selection (CASEWHERE)','Nested IF','Pre-test loop','Post-test loop','Counted loop'],[
  ['Segment 1',4],['Segment 2',2],['Segment 3',6],['Segment 4',0],['Segment 5',5],['Segment 6',1],['Segment 7',3]],3,'Segment 1 tests the condition before the body (pre-test). Segment 2 is a CASEWHERE (multi-way selection). Segment 3 repeats a set number of times (counted loop). Segment 4 is steps in order (sequence). Segment 5 runs the body once before testing (post-test). Segment 6 is a two-way IF with ELSE (binary selection). Segment 7 uses ELSEIF to test several conditions, with only one process executed (nested IF).')],{two:true}));

/* ---------- Question 3: Python to pseudocode (2 marks) ---------- */
qs.push(Q(PW,'The kayak tour route is marked with buoys. A guide checks every second buoy on the way back to the jetty. Consider the following Python code.'+code(`for buoy in range(10, 0, -2):
    print(buoy)`),[
 dd('Select the correct option from each dropdown menu to complete the equivalent pseudocode.','<div style="font-family:Consolas,\'Courier New\',monospace;white-space:pre">FOR buoy = 10 TO {0} STEP {1}\n    Display buoy\nNEXT buoy</div>',[[['0','1','2','-2'],2],[['2','-2','-1','1'],1]],2,'range(10, 0, -2) gives 10, 8, 6, 4 and 2. The stop value 0 is not included in Python, so the last value is 2. A FOR / NEXT loop includes its finish value, so it finishes at 2 and counts down with a STEP of -2.')],{two:true}));

/* ---------- Question 4: post-test loop output (2 marks) ---------- */
qs.push(Q(SA,'The program reorders lifejackets for the hire counter. Consider the following algorithm.'+code(`BEGIN lifejacketStock
    Set stock = 3
    Set ordered = 0
    REPEAT
        Set stock = stock + 5
        Set ordered = ordered + 1
    UNTIL stock >= 10
    Display "Stock ", stock, " after ", ordered, " orders"
END lifejacketStock`),[
 dd('Select the correct item from each dropdown menu to show the output.','The output is: Stock {0} after {1} orders',[[['8','10','13','15'],2],[['1','2','3','13'],1]],2,'stock starts at 3. After the first pass stock is 8 and ordered is 1. Because 8 is less than 10 the loop repeats: stock is 13 and ordered is 2. Now 13 >= 10 so the loop ends.')],{two:true}));

/* ---------- Question 5: trace table, FOR with selection (3 marks) ---------- */
qs.push(Q(SEP,'Before each tour, the hire counter records the size of each of four groups. Consider the following algorithm.'+code(`BEGIN groupCheck
    Set total = 0
    Set big = 0
    FOR i = 1 TO 4
        Get size
        Set total = total + size
        IF size >= 6 THEN
            Set big = big + 1
        ENDIF
    NEXT i
    Display total, " paddlers in ", big, " large groups"
END groupCheck`),[
 ft('Complete the trace table for the algorithm when the sizes 4, 7, 2 and 6 are entered, in that order. (3 marks)',3,
  ['i','size','total','big','Output displayed'],
  [['1','4',null,null,'-'],['2','7',null,null,'-'],['3','2',null,null,'-'],['4','6',null,null,'-'],['After the loop','-','-','-',null]],
  [['1','4','4','0','-'],['2','7','11','1','-'],['3','2','13','1','-'],['4','6','19','2','-'],['After the loop','-','-','-','19 paddlers in 2 large groups']],
  ['1 mark: the total column is correct (4, 11, 13, 19).','1 mark: the big column is correct (0, 1, 1, 2).','1 mark: the output is 19 paddlers in 2 large groups.'],{widths:['14%','14%','14%','14%','44%']})],{two:true}));

/* ---------- Question 6: trace table, subroutine with parameters (3 marks) ---------- */
qs.push(Q(SA,'A guide plans a four-day tour. The algorithm TourPlanner calls the subroutine TourTime, which passes a value back to the algorithm in the parameter total.'+code(`BEGIN TourPlanner
    FOR day = 1 TO 4
        TourTime (day + 1, day * 2, total)
        Display total
    NEXT day
END TourPlanner

BEGIN TourTime (hours, rest, total)
    Set total = hours * 60 - rest * 5
END TourTime (hours, rest, total)`),[
 ft('Complete the table to show the values passed to the parameters hours and rest on each call, and the value displayed. (3 marks)',3,
  ['day','hours','rest','total displayed'],
  [['1',null,null,null],['2',null,null,null],['3',null,null,null],['4',null,null,null]],
  [['1','2','2','110'],['2','3','4','160'],['3','4','6','210'],['4','5','8','260']],
  ['1 mark: hours is 2, 3, 4, 5 and rest is 2, 4, 6, 8.','1 mark: the first two totals are 110 and 160.','1 mark: the last two totals are 210 and 260.'],{widths:['16%','20%','20%','44%']})],{two:true}));

/* ---------- Question 7: test data (3 marks) ---------- */
qs.push(Q(SEP,'The hire counter program calculates the cost of a kayak hire. Consider the following algorithm.'+code(`BEGIN hireCost
    Get hours
    Get isMember
    IF hours <= 2 THEN
        Set cost = 20
    ELSEIF hours <= 4 THEN
        Set cost = 35
    ELSE
        Set cost = 50
    ENDIF
    IF isMember = "Y" THEN
        Set cost = cost * 0.9
    ENDIF
    Display "Cost: $", cost
END hireCost`),[
 ft('Provide a set of test data that will thoroughly test the algorithm. Include the expected outputs and reasons for inclusion. You may assume that all input data are valid.',3,
  ['Test data<br>(hours, isMember)','Expected output','Reason for inclusion'],4,
  [['2, N','Cost: $20','Boundary: the largest number of hours in the first branch, non-member'],['3, N','Cost: $35','Boundary: the smallest number of hours in the second branch'],['4, Y','Cost: $31.5','Boundary: the largest number of hours in the second branch, with the member discount'],['5, N','Cost: $50','Tests the ELSE branch, with no discount']],
  ['1 mark: test data that covers every path: 2 hours or less, 3 to 4 hours, more than 4 hours, and both a member and a non-member.','1 mark: boundary values tested (2 and 3, and 4 and 5 hours).','1 mark: correct expected outputs, each with a relevant reason for inclusion.'],{widths:['22%','22%','56%']})],{two:true}));

/* ---------- Question 8: order the steps, REPEAT / UNTIL (3 marks) ---------- */
qs.push(Q(SSA,'',[
 od('Place the following steps of an algorithm that checks the size of a group booking in the correct order by dragging the steps into position. The number of paddlers must be from 1 to 6.',`
# BEGIN groupSize
    = REPEAT
        Display "Enter the number of paddlers (1 to 6):"
        Get size
        IF size < 1 OR size > 6 THEN
            Display "Invalid number of paddlers"
        ENDIF
    UNTIL size >= 1 AND size <= 6
    Display "Group booked for ", size, " paddlers"
# END groupSize`,3,{extra:['WHILE size < 1 OR size > 6','ENDWHILE'],why:'The prompt and the Get must be inside the loop so they repeat. The IF displays the message only for an invalid size. The post-test condition UNTIL size >= 1 AND size <= 6 ends the loop when the size is valid, and the confirmation is displayed once, after the loop.'})]));

/* ---------- Question 9: order the steps, bubble sort (3 marks) ---------- */
qs.push(Q(SA,'',[
 od('Place the following steps of a bubble sort algorithm in the correct order by dragging the steps into position. The array times holds n race times, which are sorted from smallest to largest.',`
# BEGIN sortTimes (times, n)
    FOR pass = 1 TO n - 1
        FOR pos = 1 TO n - pass
            IF times[pos] > times[pos + 1] THEN
                Set temp = times[pos]
                Set times[pos] = times[pos + 1]
                Set times[pos + 1] = temp
            ENDIF
        NEXT pos
    NEXT pass
# END sortTimes (times, n)`,3,{extra:['Set times[pos] = temp'],why:'Each pass compares neighbouring items. When the first is larger than the next, the two are swapped using a temporary variable: temp holds the first item, the second item is copied into the first position, then temp is copied into the second position. The inner loop ends with NEXT pos and the outer loop with NEXT pass.'})]));

/* ---------- Question 10: subroutine terms (2 marks) ---------- */
qs.push(Q(SEP,'',[
 dm('Match each term to its description by dragging the labels into the boxes.',['Mainline','Subroutine','Function','Parameter'],[
  ['A named set of statements that carries out one task and can be used at different points in an algorithm.',1],
  ['A subroutine that uses RETURN to pass a single value back to the place where it was used.',2],
  ['The algorithm that shows the overall logic and refers to other algorithms by name.',0],
  ['A name written in brackets after a subroutine name that receives the data to be processed each time the subroutine is used.',3]],2,{why:'A subroutine (also called a module, subprogram or procedure) is a named set of statements. A function is a subroutine that returns a single value with RETURN. The mainline is kept clear and uncluttered and refers to subroutines by name. A parameter receives the data that the subroutine processes.'})]));

/* ---------- Question 11: nested IF or CASEWHERE (3 marks) ---------- */
qs.push(Q(SEP,'A guide reads the depth of the river, in metres, from a gauge (for example 0.35 or 1.8). The program displays a message.'+
 tbl(['Depth (m)','Message'],[['Less than 0.5','Too shallow'],['0.5 up to, but not including, 3','Safe'],['3 or more','Too deep']])+
 '<p>A trainee programmer suggests using a CASEWHERE structure for this selection.</p>',[
 tx('Explain why a nested IF is more suitable than a CASEWHERE structure for this task. (3 marks)',3,65,
  'A CASEWHERE chooses a path by matching the value of an expression to a list of specific choices. A depth can be any decimal number, so there are too many possible values to list as choices. A nested IF uses ELSEIF with comparison operators such as < and >=, so each range can be tested in order with a single condition, and only one process is executed. The final ELSE handles every other depth.',
  ['1 mark: states that CASEWHERE matches an expression against specific values or choices.','1 mark: explains that the depth is a continuous decimal value, so it cannot be listed as separate choices.','1 mark: explains that a nested IF tests ranges using comparison operators in order, with only one process executed.'])],{two:true}));

/* ---------- Question 12: post-test loop (3 marks) ---------- */
qs.push(Q(SSA,'Staff unlock the cash tin using a four-digit PIN. The program asks for the PIN and repeats the request until the correct PIN is entered.'+code(`REPEAT
    Display "Enter PIN"
    Get pin
UNTIL pin = correctPin`),[
 tx('Explain why a post-test loop is more suitable than a pre-test loop for this task. (3 marks)',3,65,
  'A post-test loop runs its body first and tests the condition afterwards, so the PIN is always requested at least once and the test uses the PIN just entered. A pre-test loop tests the condition before the body, so pin must already hold a value. The programmer would need a dummy value or a duplicated Get statement before the WHILE loop, which makes the algorithm longer and easier to get wrong.',
  ['1 mark: explains that a post-test loop executes the body before testing the condition.','1 mark: links this to the PIN being requested at least once, and the condition using the value just entered.','1 mark: explains that a pre-test loop needs pin set (a dummy value or a duplicate Get) before the loop.'])],{two:true}));

/* ---------- Question 13: find and correct errors (3 marks) ---------- */
qs.push(Q(SA,'Six kayaks are returned each evening. A kayak that is returned at hour 17 (5 pm) or later is late. Each late kayak has a late fee of $5. The algorithm below is intended to read the hour at which each kayak was returned and display the total late fee.'+code(`1  BEGIN lateFees
2      Set late = 0
3      FOR k = 1 TO 5
4          Get returnHour
5          IF returnHour > 17 THEN
6              Set late = late + 1
7          ENDIF
8      NEXT k
9      Set fee = late * 5
10     Display "Total late fee: $", late
11 END lateFees`),[
 ft('The algorithm contains three errors. Identify the line number of each error, describe the error, and write the corrected line. (3 marks)',3,
  ['Line number','Description of error','Corrected line'],3,
  [['3','The loop runs five times but six kayaks are returned','FOR k = 1 TO 6'],['5','A kayak returned at hour 17 is also late, so the test must include 17','IF returnHour >= 17 THEN'],['10','The number of late kayaks is displayed instead of the total late fee','Display "Total late fee: $", fee']],
  ['1 mark for each error that is located by line number, described, and corrected: line 3 (TO 5 should be TO 6), line 5 (> should be >=), line 10 (late should be fee).'],{widths:['14%','46%','40%']})],{two:true}));

/* ---------- Question 14: understanding an algorithm (3 marks) ---------- */
qs.push(Q(PW,'The array hires stores the number of kayaks hired on each of five days: hires[1] = 12, hires[2] = 9, hires[3] = 15, hires[4] = 15 and hires[5] = 7. Consider the following algorithm.'+code(`BEGIN mystery
    Set best = hires[1]
    Set day = 1
    FOR i = 2 TO 5
        IF hires[i] > best THEN
            Set best = hires[i]
            Set day = i
        ENDIF
    NEXT i
    Display day
END mystery`),[
 P('(a)',dd('Select the correct item from the dropdown menu to show the value displayed. (1 mark)','The value displayed is {0}.',[[['1','3','4','15'],1]],1,'hires[3] = 15 is larger than 12, so best becomes 15 and day becomes 3. hires[4] = 15 is not greater than 15, so day stays 3.')),
 P('(b)',tx('Describe the purpose of the algorithm. (2 marks)',2,40,
  'The algorithm finds the day with the greatest number of hires and displays that day number. If two days have the same highest number of hires, it displays the earlier day.',
  ['1 mark: states that the algorithm finds the day with the most hires (the largest value in the array).','1 mark: states that it displays the position (day number) rather than the value, or that the earlier day is displayed when there is a tie.']))],{two:true}));

/* ---------- Question 15: WHILE loop, sentinel (4 marks) ---------- */
qs.push(Q(SA,'Before each tour at Kookaburra Creek Kayak Hire, every paddler is weighed so that the guide can balance the load on the boats. An algorithm is needed to process the weights.'+bl([
 'The weight of each paddler, in kilograms, is entered.',
 'The weight 0 is entered after the last paddler. It is not the weight of a paddler.',
 'The algorithm should display the number of paddlers weighed and the average weight of the paddlers.',
 'If no paddlers were weighed, it should display "No paddlers" instead.']),[
 ps('Using pseudocode, with a WHILE loop, write an algorithm to perform this task. You may assume that all inputs are valid.',4,`BEGIN weighPaddlers
    Set count = 0
    Set total = 0
    Get weight
    WHILE weight <> 0
        Set count = count + 1
        Set total = total + weight
        Get weight
    ENDWHILE
    IF count = 0 THEN
        Display "No paddlers"
    ELSE
        Display "Paddlers weighed: ", count
        Display "Average weight: ", total / count
    ENDIF
END weighPaddlers`,['1 mark: count and total are set to 0 before the loop.','1 mark: a WHILE loop that continues while the weight is not 0, with a weight read before the loop and the next weight read inside it, so the 0 is never counted.','1 mark: count increases by 1 and total increases by the weight inside the loop.','1 mark: after the loop, a selection that displays "No paddlers" when count is 0, and otherwise displays the count and the average (total divided by count).'])],{two:true}));

/* ---------- Question 16: CASEWHERE (3 marks) ---------- */
qs.push(Q(PW,'A flag at the jetty shows the safety rating of the river. The guide enters the colour of the flag as a single capital letter. The program displays a message.'+
 tbl(['Flag colour','Letter','Message to display'],[['Green','G','River open to all hirers'],['Yellow','Y','Lifejackets must be worn on the water'],['Orange','O','Guided tours only'],['Red','R','River closed']])+
 '<p>Any other letter should display "Flag not recognised".</p>',[
 ps('Write the algorithm using pseudocode. Use a CASEWHERE structure. You may assume that the input is a single capital letter.',3,`BEGIN riverFlag
    Get flag
    CASEWHERE flag evaluates to
        "G": Display "River open to all hirers"
        "Y": Display "Lifejackets must be worn on the water"
        "O": Display "Guided tours only"
        "R": Display "River closed"
        OTHERWISE: Display "Flag not recognised"
    END CASE
END riverFlag`,['1 mark: reads the flag letter and uses a CASEWHERE structure on that value, closed with END CASE.','1 mark: a choice for each of the four letters (G, Y, O, R) that displays the correct message.','1 mark: an OTHERWISE choice that displays "Flag not recognised".'])],{two:true}));

/* ---------- Question 17: FOR loop and an array (4 marks) ---------- */
qs.push(Q(SA,'Kookaburra Creek Kayak Hire has 12 kayaks, numbered 1 to 12. At the end of the day, the array status stores whether each kayak is "In" or "Out". For example, status[3] = "Out" means that kayak 3 has not been returned.'+
 tbl(['Position','1','2','3','4','5','6','7','8','9','10','11','12'],[['status','In','In','Out','In','In','In','In','Out','In','In','In','In']],'The array status on one evening'),[
 ps('Using pseudocode, with a FOR loop, write an algorithm that displays the number of every kayak that is still out, followed by the total number of kayaks that are out. If every kayak is in, display "All kayaks are in" instead. You may assume that the array status has been filled.',4,`BEGIN findKayaksOut
    Set outCount = 0
    FOR k = 1 TO 12
        IF status[k] = "Out" THEN
            Display "Kayak ", k, " is out"
            Set outCount = outCount + 1
        ENDIF
    NEXT k
    IF outCount = 0 THEN
        Display "All kayaks are in"
    ELSE
        Display "Kayaks out: ", outCount
    ENDIF
END findKayaksOut`,['1 mark: a counter set to 0 before the loop.','1 mark: a FOR loop that checks every position from 1 to 12.','1 mark: for each kayak that is "Out", displays the kayak number and adds 1 to the counter.','1 mark: after the loop, a selection that displays "All kayaks are in" when the counter is 0, and otherwise displays the total out.'])],{two:true}));

/* ---------- Question 18: nested loops (3 marks) ---------- */
qs.push(Q(PW,'Guided tours leave from four jetties, numbered 1 to 4. Each jetty has three time slots, numbered 1 to 3. Jetty 3, Slot 2 is closed for maintenance and cannot be booked.'+bl([
 'Every combination that can be booked is displayed on its own line, in the form Jetty 1 Slot 1, starting with Jetty 1 Slot 1, Jetty 1 Slot 2 and Jetty 1 Slot 3.',
 'After the last combination, the algorithm displays the number of combinations that can be booked.']),[
 ps('Write an algorithm using pseudocode to perform this task.',3,`BEGIN slotList
    Set count = 0
    FOR jetty = 1 TO 4
        FOR slot = 1 TO 3
            IF NOT (jetty = 3 AND slot = 2) THEN
                Display "Jetty ", jetty, " Slot ", slot
                Set count = count + 1
            ENDIF
        NEXT slot
    NEXT jetty
    Display count, " slots can be booked"
END slotList`,['1 mark: nested FOR loops, one for the jetties (1 to 4) and one for the slots (1 to 3) inside it.','1 mark: a selection that leaves out Jetty 3, Slot 2 only, using a correct condition (for example NOT (jetty = 3 AND slot = 2) or jetty <> 3 OR slot <> 2).','1 mark: displays each combination in the required form, counts the combinations, and displays the count (11) after both loops.'])],{two:true}));

/* ---------- Question 19: subroutine and total (4 marks) ---------- */
qs.push(Q(PW,'Kookaburra Creek Kayak Hire charges for each kayak as follows.'+bl([
 'A single kayak costs $30 for the first 2 hours.',
 'A double kayak costs $45 for the first 2 hours.',
 'Each extra hour after the first 2 hours costs $8, for either type of kayak.'])+
 '<p>An algorithm is needed to calculate the cost of the kayaks in a booking.</p><p>The algorithm should read the number of kayaks in the booking. For each kayak, it should read the type (S for single or D for double) and the number of hours. It should calculate and display</p>'+bl(['the cost of each kayak','the total cost of the booking.']),[
 ps('Write the algorithm using pseudocode. Include at least one subroutine in your answer. You may assume that all inputs are valid.',4,`BEGIN bookingCost
    Get numKayaks
    Set total = 0
    FOR k = 1 TO numKayaks
        Get type
        Get hours
        Set cost = kayakCost (type, hours)
        Display "Kayak ", k, ": $", cost
        Set total = total + cost
    NEXT k
    Display "Booking total: $", total
END bookingCost

BEGIN kayakCost (type, hours)
    IF type = "S" THEN
        Set cost = 30
    ELSE
        Set cost = 45
    ENDIF
    IF hours > 2 THEN
        Set cost = cost + (hours - 2) * 8
    ENDIF
    RETURN cost
END kayakCost (type, hours)`,['1 mark: reads the number of kayaks and uses a loop that reads the type and hours for each kayak.','1 mark: a subroutine with parameters (for example type and hours) that is used from the mainline, and which calculates the base cost from the type of kayak.','1 mark: adds $8 for each hour after the first 2 hours, and only when the hours are more than 2.','1 mark: displays the cost of each kayak, and keeps a running total that is displayed after the loop.'])],{two:true}));

/* ---------- Question 20: function with RETURN (4 marks) ---------- */
qs.push(Q(SA,'Hire at Kookaburra Creek is open only when conditions are safe.'+bl([
 'The wind speed must be less than 25 kilometres per hour.',
 'The water temperature must be at least 12 degrees Celsius.',
 'There must be no storm warning. The storm warning is entered as "Y" for yes or "N" for no.'])+
 '<p>A function is needed that uses RETURN to pass back True when conditions are safe and False when they are not. The mainline reads the wind speed, the water temperature and the storm warning, and displays "Hire open" or "Hire closed".</p>',[
 ps('Write the mainline and the function using pseudocode. You may assume that all inputs are valid.',4,`BEGIN hireStatus
    Get windSpeed
    Get waterTemp
    Get storm
    IF conditionsSafe (windSpeed, waterTemp, storm) = True THEN
        Display "Hire open"
    ELSE
        Display "Hire closed"
    ENDIF
END hireStatus

BEGIN conditionsSafe (windSpeed, waterTemp, storm)
    IF windSpeed < 25 AND waterTemp >= 12 AND storm = "N" THEN
        RETURN True
    ELSE
        RETURN False
    ENDIF
END conditionsSafe (windSpeed, waterTemp, storm)`,['1 mark: the mainline reads the three inputs and passes them to the function as parameters.','1 mark: the function has three parameters and a condition that combines all three tests with AND (wind speed < 25, temperature >= 12, storm = "N").','1 mark: the function uses RETURN to pass back True when the conditions are safe and False otherwise.','1 mark: the mainline uses the value returned in a selection that displays "Hire open" or "Hire closed".'])],{two:true}));

/* ---------- Question 21: attempts (4 marks) ---------- */
qs.push(Q(SSA,'The equipment shed at Kookaburra Creek has a keypad lock. The correct code is stored in the variable safeCode. A staff member has up to three attempts to enter the correct code.'+bl([
 'After each incorrect code, the program displays "Incorrect code".',
 'When the correct code is entered, the program stops asking and displays "Shed unlocked".',
 'After three incorrect codes, the program stops asking and displays "Shed locked".']),[
 ps('Write the algorithm using pseudocode. You may assume that all inputs are valid.',4,`BEGIN shedKeypad
    Set attempts = 0
    Set unlocked = False
    WHILE attempts < 3 AND unlocked = False
        Get code
        Set attempts = attempts + 1
        IF code = safeCode THEN
            Set unlocked = True
        ELSE
            Display "Incorrect code"
        ENDIF
    ENDWHILE
    IF unlocked = True THEN
        Display "Shed unlocked"
    ELSE
        Display "Shed locked"
    ENDIF
END shedKeypad`,['1 mark: a loop that stops when the code is correct or after three attempts (a compound condition using AND or OR, or a similar exit).','1 mark: the code is read inside the loop and the number of attempts is counted.','1 mark: displays "Incorrect code" only after an incorrect code, and records when the correct code has been entered.','1 mark: after the loop, displays "Shed unlocked" or "Shed locked" correctly, including when the third attempt is correct.'])],{two:true}));

/* ---------- Question 22: subroutine with one parameter (3 marks) ---------- */
qs.push(Q(SA,'At the end of each shift, lifejacket codes are entered into an array. There are two arrays, morning and afternoon, and each array has space for 20 codes.'+bl([
 'The mainline uses a subroutine called loadCodes to fill the array morning, then to fill the array afternoon.',
 'The subroutine has one parameter, arrayName, so that it can fill either array.',
 'Codes are entered one at a time and stored in the array in the order they are entered. Entry stops when the code END is entered, or when the array is full. The code END is not stored.']),[
 ps('Write the mainline and the subroutine using pseudocode. You may assume that all inputs are valid.',3,`BEGIN returnsSheet
    loadCodes (morning)
    loadCodes (afternoon)
END returnsSheet

BEGIN loadCodes (arrayName)
    Set pointer = 1
    Set code = ""
    WHILE code <> "END" AND pointer <= 20
        Get code
        IF code <> "END" THEN
            Set arrayName[pointer] = code
            Set pointer = pointer + 1
        ENDIF
    ENDWHILE
END loadCodes (arrayName)`,['1 mark: a mainline that uses the subroutine twice, with morning and then afternoon as the parameter.','1 mark: a loop that continues while the code is not END and there is space in the array (pointer no more than 20).','1 mark: stores each code in the array at the pointer and increases the pointer, without storing END.'])],{two:true}));

/* ---------- Question 23: structure chart to pseudocode (5 marks) ---------- */
qs.push(Q(SEP,'The structure chart shows the program that processes a kayak when it is returned.'+fig('Structure chart for the kayak return program',figWrap(figReturn()))+
 '<p>The subroutine Calculate late fee is only used when the kayak is returned late (hoursLate is more than 0). The late fee is $12 for each hour late, to a maximum of $60.</p>',[
 ps('Write the algorithm for the mainline Process return, and a possible algorithm for the subroutine Calculate late fee, using pseudocode. Use the data shown on the structure chart as parameters. You may assume that all inputs are valid.',5,`BEGIN processReturn
    getReturnDetails (kayakID, hoursLate)
    Set lateFee = 0
    IF hoursLate > 0 THEN
        calculateLateFee (hoursLate, lateFee)
    ENDIF
    printReceipt (kayakID, lateFee)
END processReturn

BEGIN calculateLateFee (hoursLate, lateFee)
    Set lateFee = hoursLate * 12
    IF lateFee > 60 THEN
        Set lateFee = 60
    ENDIF
END calculateLateFee (hoursLate, lateFee)`,['1 mark: the mainline uses the three subroutines in the order shown on the structure chart.','1 mark: the mainline passes the correct data to and from each subroutine (kayakID and hoursLate from Get return details; hoursLate to and lateFee from Calculate late fee; kayakID and lateFee to Print receipt).','1 mark: Calculate late fee is used only when hoursLate is more than 0, and lateFee is 0 when it is not used.','1 mark: the subroutine calculates the fee as hoursLate multiplied by 12.','1 mark: the subroutine limits the fee to $60, and passes the fee back (in a parameter, or with RETURN used by the mainline).'])],{two:true}));

/* ---------- Question 24: flowchart to pseudocode (3 marks) ---------- */
qs.push(Q(SA,'A guide checks the wind speed at the jetty on each day of a week. The algorithm is shown as a flowchart.'+fig('Flowchart for the wind check algorithm',figWrap(figWind())),[
 ps('Write the pseudocode for the algorithm shown in the flowchart.',3,`BEGIN windCheck
    Set count = 0
    FOR day = 1 TO 7
        Get windSpeed
        IF windSpeed > 20 THEN
            Set count = count + 1
        ENDIF
    NEXT day
    Display count
END windCheck`,['1 mark: count set to 0 before a loop that repeats for the seven days (a FOR loop, or a WHILE loop with day set to 1 and increased by 1).','1 mark: the wind speed is read inside the loop, and count increases by 1 only when the wind speed is greater than 20.','1 mark: count is displayed once, after the loop ends. A WHILE loop is acceptable only if day is set to 1 before it, is increased inside it, and the loop test matches the flowchart (day <= 7).'])],{two:true}));

/* ---------- Question 25: weekly report with a function (6 marks) ---------- */
qs.push(Q(SEP,'At the end of each week, the hire counter program reports on the number of kayaks hired. An algorithm is needed to process the week.'+bl([
 'The number of kayaks hired on each of the seven days is entered, from day 1 to day 7, and stored in the array hires.',
 'The algorithm displays the number of the busiest day (the day with the most hires). If two days have the same highest number, the earlier day is displayed.',
 'The algorithm displays the total number of kayaks hired in the week and the average number hired each day.',
 'The algorithm then displays "High demand week" if the average is 20 or more, and "Normal week" if it is not.']),[
 ps('Write the algorithm using pseudocode. Include at least one function in your answer. You may assume that all inputs are valid.',6,`BEGIN weeklyReport
    Set total = 0
    Set busiest = 1
    FOR day = 1 TO 7
        Get hires[day]
        Set total = total + hires[day]
        IF hires[day] > hires[busiest] THEN
            Set busiest = day
        ENDIF
    NEXT day
    Set average = total / 7
    Display "Busiest day: ", busiest
    Display "Total hires: ", total
    Display "Average hires per day: ", average
    Display weekRating (average)
END weeklyReport

BEGIN weekRating (average)
    IF average >= 20 THEN
        RETURN "High demand week"
    ELSE
        RETURN "Normal week"
    ENDIF
END weekRating (average)`,['1 mark: a loop that reads the seven numbers of hires into the array.','1 mark: a running total of the hires, set to 0 before the loop.','1 mark: finds the busiest day by keeping the position of the largest value, so that an earlier day is kept when there is a tie (the test uses > and not >=).','1 mark: calculates the average as the total divided by 7.','1 mark: a function with a parameter that uses RETURN to pass back a message.','1 mark: the busiest day, total, average and the correct message are all displayed, with the message chosen using average >= 20.'])],{two:true}));

BANKS.push({id:'20',name:'Pseudocode Practice Paper',sub:'25 questions · 80 marks · Kookaburra Creek Kayak Hire: every pseudocode structure in the course specifications',mini:true,questions:25,marks:80,duration:160*60,qs:qs});
})();
