/* Pseudocode Practice Paper 2 (bank 23). Original mini paper: 25 questions, 80 marks, pseudocode and algorithmic design.
   Theme: SwiftRoute & AeroDrop Autonomous Logistics Network: algorithmic control structures, search and sorting,
   modular architecture, parameter passing, defensive programming, and data structures.
   Covers every NESA Stage 6 Software Engineering pseudocode convention in the Course Specifications:
   sequence, binary selection, multi-way selection with CASEWHERE, nested IF, WHILE, REPEAT / UNTIL, FOR / NEXT with STEP,
   subroutines and functions with RETURN, pass-by-value vs pass-by-reference, array algorithms (linear search, binary search,
   bubble sort pass, min/max extraction, 2D matrix traversal), trace tables, error debugging, and defensive validation. */
(function() {
var SEP = 'Software Engineering Project', PW = 'Programming for the Web', SSA = 'Secure Software Architecture', SA = 'Software Automation';
var qs = [];

/* ---------- SVG diagram helpers ---------- */
var UID = 0;
function sv(w, h, label, body) {
  UID++; var a = 'pca' + UID;
  return '<svg class="dgm" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" role="img" aria-label="' + esc(label) + '">' +
    '<defs><marker id="' + a + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#000" stroke-width="1.5"/></marker></defs>' +
    '<g font-family="Arial,Helvetica,sans-serif" font-size="12" fill="#000" stroke="#000" stroke-width="1.3" stroke-linejoin="round">' +
    body.replace(/#A/g, 'url(#' + a + ')') + '</g></svg>';
}
function gTxt(x, y, lines, o) {
  o = o || {}; lines = [].concat(lines); var lh = o.lh || 14, y0 = y - (lines.length - 1) * lh / 2 + 4;
  return '<text x="' + x + '" y="' + y0 + '" text-anchor="' + (o.anchor || 'middle') + '" stroke="' + (o.halo === false ? 'none' : '#fff') + '" stroke-width="3" paint-order="stroke"' +
    (o.size ? ' font-size="' + o.size + '"' : '') + '>' +
    lines.map(function(s, i) { return '<tspan x="' + x + '" dy="' + (i ? lh : 0) + '">' + esc(s) + '</tspan>'; }).join('') + '</text>';
}
function gRect(x, y, w, h, lines, o) { o = o || {}; return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#fff"' + (o.rx ? ' rx="' + o.rx + '"' : '') + '/>' + (lines ? gTxt(x + w / 2, y + h / 2, lines, { halo: false, lh: 13 }) : ''); }
function gTerm(x, y, w, h, lines) { return gRect(x, y, w, h, lines, { rx: h / 2 }); }
function gDia(cx, cy, w, h, lines) { return '<polygon points="' + cx + ',' + (cy - h / 2) + ' ' + (cx + w / 2) + ',' + cy + ' ' + cx + ',' + (cy + h / 2) + ' ' + (cx - w / 2) + ',' + cy + '" fill="#fff"/>' + (lines ? gTxt(cx, cy, lines, { size: 11, halo: false, lh: 12 }) : ''); }
function gPar(x, y, w, h, lines) { var k = Math.min(14, h / 2); return '<polygon points="' + (x + k) + ',' + y + ' ' + (x + w) + ',' + y + ' ' + (x + w - k) + ',' + (y + h) + ' ' + x + ',' + (y + h) + '" fill="#fff"/>' + (lines ? gTxt(x + w / 2, y + h / 2, lines, { halo: false, lh: 13 }) : ''); }
function gLine(pts, arrow) { return '<polyline points="' + pts.map(function(p) { return p[0] + ',' + p[1]; }).join(' ') + '" fill="none"' + (arrow ? ' marker-end="#A"' : '') + '/>'; }
function gDot(x, y, filled) { return '<circle cx="' + x + '" cy="' + y + '" r="4.5" fill="' + (filled ? '#000' : '#fff') + '"/>'; }
function couple(pt, dir, label, side, isFlag) {
  var x = pt[0], y = pt[1], l = side === 'l', ax = x + (l ? -13 : 13);
  return gDot(x, y, !!isFlag) + gLine(dir === 'u' ? [[ax, y + 9], [ax, y - 9]] : [[ax, y - 9], [ax, y + 9]], true) + gTxt(x + (l ? -20 : 20), y, label, { anchor: l ? 'end' : 'start', lh: 12, size: 11 });
}
function sdec(pt) { return '<polygon points="' + pt[0] + ',' + (pt[1] - 7) + ' ' + (pt[0] + 7) + ',' + pt[1] + ' ' + pt[0] + ',' + (pt[1] + 7) + ' ' + (pt[0] - 7) + ',' + pt[1] + '" fill="#fff"/>'; }
function sbox(x, y, w, h, text) { return gRect(x, y, w, h, text); }
function drops(px, pb, busY, xs, topY) {
  var lo = Math.min.apply(null, xs.concat([px])), hi = Math.max.apply(null, xs.concat([px])), o = gLine([[px, pb], [px, busY]]) + gLine([[lo, busY], [hi, busY]]);
  xs.forEach(function(x) { o += gLine([[x, busY], [x, topY]]); }); return o;
}
function figWrap(html) { return '<div class="dgmfig">' + html + '</div>'; }

/* Flowchart for Q17 */
function figFlowchart() {
  var o = '';
  o += gTerm(110, 10, 140, 30, 'BEGIN intakeScanner') + gLine([[180, 40], [180, 62]], true);
  o += gRect(80, 62, 200, 34, ['totalWeight = 0', 'heavyCount = 0']) + gLine([[180, 96], [180, 118]], true);
  o += gPar(100, 118, 160, 32, 'Get weight') + gLine([[180, 150], [180, 174]], true);
  o += gDia(180, 206, 150, 64, 'weight > 0?');
  o += gLine([[180, 238], [180, 268]], true) + gTxt(194, 252, 'Yes', { anchor: 'start', size: 11 });
  o += gDia(180, 300, 150, 64, 'weight > 25?');
  o += gLine([[255, 300], [295, 300]], true) + gTxt(275, 291, 'Yes', { size: 11 });
  o += gRect(295, 282, 150, 36, ['heavyCount = heavyCount + 1', 'Display "Overweight"']);
  o += gLine([[370, 318], [370, 366], [180, 366]]) + gLine([[180, 332], [180, 380]], true) + gTxt(194, 350, 'No', { anchor: 'start', size: 11 });
  o += gRect(70, 380, 220, 36, ['totalWeight = totalWeight + weight', 'Display "Accepted"']);
  o += gLine([[180, 416], [180, 440]], true);
  o += gPar(100, 440, 160, 32, 'Get weight');
  o += gLine([[100, 456], [36, 456], [36, 206], [105, 206]], true);
  o += gLine([[255, 206], [465, 206], [465, 510], [270, 510]], true) + gTxt(275, 198, 'No', { size: 11 });
  o += gPar(90, 494, 180, 32, 'Display totalWeight') + gLine([[180, 526], [180, 548]], true);
  o += gPar(90, 548, 180, 32, 'Display heavyCount') + gLine([[180, 580], [180, 602]], true);
  o += gTerm(110, 602, 140, 30, 'END intakeScanner');
  return sv(490, 646, 'Flowchart for the parcel intake scanner algorithm', o);
}

/* Structure chart for Q18 */
function figStructureChart() {
  var out = drops(320, 56, 98, [90, 240, 400, 550], 170);
  out += sbox(240, 20, 160, 36, 'Process shipment');
  out += sbox(20, 170, 140, 36, 'Scan barcode');
  out += sbox(170, 170, 140, 36, 'Validate destination');
  out += sbox(330, 170, 140, 36, 'Calculate dispatch');
  out += sbox(480, 170, 140, 36, 'Print manifest');
  out += couple([90, 120], 'u', 'barcode', 'l', false) + couple([90, 148], 'u', 'weight', 'l', false);
  out += couple([240, 120], 'd', 'destZone', 'l', false) + couple([240, 148], 'u', 'isValidZone', 'r', true);
  out += sdec([400, 98]);
  out += couple([390, 120], 'd', 'weight, destZone', 'l', false) + couple([410, 148], 'u', 'shippingCost, deliveryDays', 'r', false);
  out += couple([550, 120], 'd', 'barcode', 'l', false) + couple([550, 148], 'd', 'shippingCost', 'r', false);
  return sv(650, 230, 'Structure chart for the shipment processing system', out);
}

/* ==========================================================================
   SECTION 1: Control Structures, Syntax, and Traversals (Questions 1 to 5)
   Subtotal: 11 marks
   ========================================================================== */

/* ---------- Question 1: NESA pseudocode conventions (1 mark) ---------- */
qs.push(Q(SEP, 'SwiftRoute Logistics is developing the control software for its automated parcel locker network (SmartLocker). The software engineers must ensure that all algorithms strictly follow the pseudocode syntax and conventions in the NESA Course Specifications. Four alternative code fragments for categorising delivery status are shown.' +
  tbl(['Fragment', 'Pseudocode'], [
    ['A', code('CASEWHERE status evaluates to\n    "D": Display "Delivered"\n    "P": Display "Pending collection"\n    "R": Display "Returned to depot"\n    OTHERWISE: Display "Status unknown"\nEND CASE')],
    ['B', code('CASE status OF\n    "D": Display "Delivered"\n    "P": Display "Pending collection"\n    "R": Display "Returned to depot"\n    DEFAULT: Display "Status unknown"\nENDCASE')],
    ['C', code('CASEWHERE status evaluates to\n    "D": Display "Delivered"\n    "P": Display "Pending collection"\n    "R": Display "Returned to depot"\n    OTHERWISE: Display "Status unknown"\nENDIF')],
    ['D', code('casewhere status evaluates to\n    "D": Display "Delivered"\n    "P": Display "Pending collection"\n    "R": Display "Returned to depot"\n    otherwise: Display "Status unknown"\nend case')]
  ]), [
  mc('Which fragment follows the pseudocode syntax and conventions in the NESA Course Specifications?',
    ['Fragment A', 'Fragment B', 'Fragment C', 'Fragment D'],
    0,
    'In the NESA Course Specifications, keywords are written in capital letters. Multi-way selection begins with CASEWHERE <expression> evaluates to, lists each literal match followed by a colon and the process, includes an OTHERWISE: clause for the default outcome, and terminates with END CASE (two words). Fragment B uses non-standard syntax from other programming languages (CASE...OF, DEFAULT:, and ENDCASE). Fragment C incorrectly closes a CASEWHERE structure with ENDIF instead of END CASE. Fragment D uses lowercase keywords.')
], {two: true}));

/* ---------- Question 2: classify control structures (3 marks) ---------- */
qs.push(Q(SEP, 'Seven segments of pseudocode from the SmartLocker terminal program are shown.' +
  tbl(['Segment', 'Pseudocode'], [
    ['1', code('WHILE queueLength > 0\n    Get nextParcel\n    Set queueLength = queueLength - 1\nENDWHILE')],
    ['2', code('CASEWHERE size evaluates to\n    "S": Set lockerBay = 1\n    "M": Set lockerBay = 2\n    "L": Set lockerBay = 3\n    OTHERWISE: Set lockerBay = 0\nEND CASE')],
    ['3', code('FOR bay = 1 TO 20\n    Display "Inspecting locker bay ", bay\nNEXT bay')],
    ['4', code('Get barcode\nSet trackingCode = "APX" + barcode\nDisplay trackingCode')],
    ['5', code('REPEAT\n    Get pin\nUNTIL pin = masterPin')],
    ['6', code('IF daysStored > 5 THEN\n    Display "Return parcel to depot"\nELSE\n    Display "Keep in locker"\nENDIF')],
    ['7', code('IF weight > 25 THEN\n    Display "Heavy parcel surcharge"\nELSEIF weight > 10 THEN\n    Display "Standard parcel charge"\nELSE\n    Display "Light parcel charge"\nENDIF')]
  ]), [
  mt('Classify each segment by the control structure it uses. (3 marks)',
    ['Segment', 'Sequence', 'Binary selection', 'Multi-way selection (CASEWHERE)', 'Nested IF', 'Pre-test loop', 'Post-test loop', 'Counted loop'],
    [
      ['Segment 1', 4],
      ['Segment 2', 2],
      ['Segment 3', 6],
      ['Segment 4', 0],
      ['Segment 5', 5],
      ['Segment 6', 1],
      ['Segment 7', 3]
    ],
    3,
    'Segment 1 tests the condition before the loop body executes (pre-test loop). Segment 2 matches an expression against discrete choices using CASEWHERE (multi-way selection). Segment 3 iterates a fixed number of times using a counter variable (counted loop). Segment 4 executes statements in sequential order without branching or repetition (sequence). Segment 5 executes the body at least once before testing the termination condition (post-test loop). Segment 6 provides two mutually exclusive paths with IF and ELSE (binary selection). Segment 7 tests multiple conditions in sequence using ELSEIF where only one branch executes (nested IF).'
  )
], {two: true}));

/* ---------- Question 3: Python to pseudocode translation (2 marks) ---------- */
qs.push(Q(PW, 'The SmartLocker terminal runs a hardware diagnostic on every third locker compartment, starting at compartment 2 and finishing before compartment 17. A developer wrote the following Python code.' +
  code('for compartment in range(2, 17, 3):\n    inspect_locker(compartment)'), [
  dd('Select the correct option from each dropdown menu to complete the equivalent NESA pseudocode.',
    '<div style="font-family:Consolas,\'Courier New\',monospace;white-space:pre">FOR compartment = 2 TO {0} STEP {1}\n    inspect_locker(compartment)\nNEXT compartment</div>',
    [
      [['14', '15', '16', '17'], 0],
      [['1', '2', '3', '5'], 2]
    ],
    2,
    'Python range(2, 17, 3) generates the values 2, 5, 8, 11, and 14. The stop value 17 is exclusive in Python, so the final iteration occurs at 14 (since 14 + 3 = 17, which reaches the limit). In contrast, a NESA pseudocode FOR...NEXT loop includes its finish boundary value. Therefore, the loop finish value must be 14 to prevent executing compartment 17. The step size is 3 in both languages.'
  )
], {two: true}));

/* ---------- Question 4: post-test loop output determination (2 marks) ---------- */
qs.push(Q(SA, 'The locker terminal software runs an automated battery charging cycle for its backup power cells. Consider the following algorithm.' +
  code('BEGIN batteryCharge\n    Set charge = 10\n    Set cycles = 0\n    REPEAT\n        Set charge = charge + 20\n        Set cycles = cycles + 1\n    UNTIL charge >= 45 AND cycles >= 3\n    Display "Charge: ", charge, "%, Cycles: ", cycles\nEND batteryCharge'), [
  dd('Select the correct item from each dropdown menu to show the output displayed after the loop terminates.',
    'The output is: Charge: {0}%, Cycles: {1}',
    [
      [['30', '50', '70', '90'], 2],
      [['1', '2', '3', '4'], 2]
    ],
    2,
    'charge initialises to 10 and cycles to 0. A REPEAT...UNTIL loop executes its body before evaluating the exit condition and terminates when the condition evaluates to True. In Pass 1: charge = 30, cycles = 1; both conditions are False (False AND False = False). In Pass 2: charge = 50, cycles = 2; charge >= 45 is True, but cycles >= 3 is False. Because the logical operator is AND, True AND False evaluates to False, so the loop continues. In Pass 3: charge = 70, cycles = 3; both charge >= 45 and cycles >= 3 are True (True AND True = True), so the loop terminates. The final displayed output is Charge: 70%, Cycles: 3.'
  )
], {two: true}));

/* ---------- Question 5: linear search algorithm ordering (3 marks) ---------- */
qs.push(Q(SEP, '', [
  od('Place the following steps of a linear search algorithm in the correct order by dragging the steps into position. The algorithm searches an array of locker IDs to locate a parcel with the specified targetID.',
    '# BEGIN findParcel (lockers, numLockers, targetID)\n' +
    '    = Set position = 1\n' +
    '    = Set found = False\n' +
    '    WHILE position <= numLockers AND found = False\n' +
    '        IF lockers[position] = targetID THEN\n' +
    '            Set found = True\n' +
    '        ELSE\n' +
    '            Set position = position + 1\n' +
    '        ENDIF\n' +
    '    ENDWHILE\n' +
    '    = IF found = True THEN\n' +
    '        Display "Parcel located in locker ", position\n' +
    '    = ELSE\n' +
    '        Display "Parcel not found"\n' +
    '    = ENDIF\n' +
    '# END findParcel (lockers, numLockers, targetID)',
    3,
    {
      extra: [
        'WHILE position <= numLockers OR found = False',
        'Set position = position - 1'
      ],
      why: 'The algorithm initialises position to 1 and found to False. The WHILE loop continues while position is within the array bounds (position <= numLockers) AND the target has not yet been located (found = False). If the parcel matches at the current position, found is set to True, which cleanly terminates the loop while keeping position at the match location. Otherwise, the ELSE block advances to the next locker with Set position = position + 1. The fixed selection after the loop displays the final result.'
    }
  )
]));

/* ==========================================================================
   SECTION 2: Arrays, Tracing, Testing, and Error Debugging (Questions 6 to 10)
   Subtotal: 12 marks
   ========================================================================== */

/* ---------- Question 6: trace table, array accumulation and filtering (3 marks) ---------- */
qs.push(Q(SA, 'An automated sorting line at SwiftRoute Logistics inspects parcel weights for an airfreight container. Packages weighing 15 kg or more require heavy-cargo handling and incur a freight surcharge. The array weights stores the weights, in kilograms, of four packages: weights[1] = 8, weights[2] = 16, weights[3] = 12, and weights[4] = 19. Consider the following algorithm.' + code('BEGIN filterHeavy (weights, n)\n    Set heavyTotal = 0\n    Set heavyCount = 0\n    FOR i = 1 TO n\n        IF weights[i] >= 15 THEN\n            Set heavyTotal = heavyTotal + weights[i]\n            Set heavyCount = heavyCount + 1\n        ENDIF\n    NEXT i\n    Display "Total heavy weight: ", heavyTotal, " kg across ", heavyCount, " packages"\nEND filterHeavy'), [
  ft('Complete the trace table for the algorithm filterHeavy when n = 4 and the weights array contains [8, 16, 12, 19]. (3 marks)', 3,
    ['i', 'weights[i]', 'heavyTotal', 'heavyCount', 'Output displayed'],
    [
      ['1', '8', null, null, '-'],
      ['2', '16', null, null, '-'],
      ['3', '12', null, null, '-'],
      ['4', '19', null, null, '-'],
      ['After loop', '-', '-', '-', null]
    ],
    [
      ['1', '8', '0', '0', '-'],
      ['2', '16', '16', '1', '-'],
      ['3', '12', '16', '1', '-'],
      ['4', '19', '35', '2', '-'],
      ['After loop', '-', '-', '-', 'Total heavy weight: 35 kg across 2 packages']
    ],
    [
      '1 mark: heavyTotal column is correct (0, 16, 16, 35).',
      '1 mark: heavyCount column is correct (0, 1, 1, 2).',
      '1 mark: final output displayed is correct ("Total heavy weight: 35 kg across 2 packages").'
    ],
    {widths: ['12%', '16%', '18%', '18%', '36%']})
], {two: true}));

/* ---------- Question 7: dropdown array indexing and off-by-one boundary checks (2 marks) ---------- */
qs.push(Q(PW, 'A dispatch terminal web application tracks courier delivery vans. In the system\'s pseudocode specification, route checkpoints are stored in a 1-based array checkpoints containing n elements (indexed from 1 to n). The algorithm is ported to JavaScript on the web client, where arrays are 0-based (indexed from 0 to n - 1). The developer writes a loop to iterate through every checkpoint in the array and send telemetry for each stop.', [
  dd('Select the correct option from each dropdown menu to complete the 0-based array traversal loop without causing an off-by-one boundary error. (2 marks)',
    '<div style="font-family:Consolas,\'Courier New\',monospace;white-space:pre">for (var i = {0}; {1}; i++) {\n    sendTelemetry(checkpoints[i]);\n}</div>',
    [
      [['0', '1', '-1', 'n'], 0],
      [['i < n', 'i <= n', 'i < n - 1', 'i <= n + 1'], 0]
    ],
    2,
    'In JavaScript, arrays are zero-indexed, meaning the first element is at index 0 and the final element of an array of length n is at index n - 1.\n' +
    '1. The loop counter must initialize at index 0 ({0} = "0"); initializing at 1 would skip checkpoints[0] (an off-by-one error at the lower boundary).\n' +
    '2. The continuation condition must be i < n ({1} = "i < n") or i <= n - 1. Using i <= n would attempt to access checkpoints[n] on the final iteration, causing an index out of bounds error. Using i < n - 1 would stop prematurely and omit the final checkpoint.')
], {two: true}));

/* ---------- Question 8: test data selection: boundary, normal, erroneous (2 marks) ---------- */
qs.push(Q(SEP, 'An automated parcel intake kiosk requires customers to enter parcel weight in kilograms before printing a shipping label. The system specification defines the following data validation rules:' + bl([
  'Allowed parcel weight must be between 1.0 kg and 25.0 kg inclusive (weight >= 1.0 AND weight <= 25.0).',
  'Weights below 1.0 kg or above 25.0 kg are rejected with an out-of-range error message.',
  'Non-numeric inputs must be rejected with an invalid format error.'
]) + 'The software engineering team is preparing a test plan covering boundary values, normal data, and erroneous data.', [
  ms('Which of the following test cases are correctly classified by their test data category?<br>Select ALL that apply. (2 marks)', [
    'Weight = 1.0 kg and Weight = 25.0 kg: Boundary data testing the exact valid minimum and maximum limits',
    'Weight = 14.5 kg: Normal data testing expected typical processing within the valid range',
    'Weight = 0.9 kg and Weight = 25.1 kg: Boundary data testing values immediately outside the valid range',
    'Weight = -3.0 kg and Weight = "Ten": Erroneous data testing defensive handling of negative and non-numeric inputs',
    'Weight = 12.5 kg: Boundary data verifying the midpoint between the two thresholds',
    'Weight = 25.0 kg: Erroneous data that must trigger an input rejection error'
  ], [0, 1, 2, 3], 2,
  'Effective black-box testing requires three distinct types of test data:\n' +
  '• Boundary values: data at the edges of equivalence partitions. 1.0 kg and 25.0 kg test the valid boundaries (on the limit), while 0.9 kg and 25.1 kg test the immediate boundaries just outside the valid range.\n' +
  '• Normal data: typical valid data well inside the acceptable limits (such as 14.5 kg) to verify standard successful processing. The midpoint (12.5 kg) is normal data, NOT a boundary value.\n' +
  '• Erroneous data: invalid values outside acceptable parameters (e.g. negative numbers like -3.0 kg) or incorrect data types (e.g. non-numeric strings like "Ten") to verify defensive validation and error handling.')
], {two: true}));

/* ---------- Question 9: error detection and correction (3 marks) ---------- */
qs.push(Q(SA, 'An express logistics sorting hub uses an automated scanner to process packages delivered to an air container. Each batch contains 8 packages. Packages that weigh more than 12 kg are classified as oversized and incur an additional $15 handling fee. The algorithm processBatch is intended to inspect all 8 packages in a batch, count how many oversized packages are present, calculate the total oversized handling fees for the batch, and display the summary.' + code('1  BEGIN processBatch\n2      Set oversizeCount = 0\n3      Set totalFee = 15\n4      FOR pkg = 1 TO 8\n5          Get weight\n6          IF weight < 12 THEN\n7              Set oversizeCount = oversizeCount + 1\n8              Set totalFee = totalFee + 15\n9          ENDIF\n10     NEXT pkg\n11     Display "Processed ", pkg, " oversized items, total fees: $", totalFee\n12 END processBatch'), [
  ft('The algorithm contains three logic or syntax errors. Identify the line number of each error, describe the error, and write the corrected pseudocode line. (3 marks)', 3,
    ['Line number', 'Description of error', 'Corrected line'], 3,
    [
      ['3', 'Accumulator totalFee is initialized to 15 instead of 0 before any packages are processed', 'Set totalFee = 0'],
      ['6', 'The selection condition checks if weight is less than 12 (< 12) instead of greater than 12 (> 12)', 'IF weight > 12 THEN'],
      ['11', 'The output displays the loop counter variable pkg instead of the counter oversizeCount', 'Display "Processed ", oversizeCount, " oversized items, total fees: $", totalFee']
    ],
    [
      '1 mark: identifies line 3, describes the initialization error (totalFee initialized to 15 instead of 0), and provides the corrected line (Set totalFee = 0).',
      '1 mark: identifies line 6, describes the reversed relational condition (< 12 instead of > 12), and provides the corrected line (IF weight > 12 THEN).',
      '1 mark: identifies line 11, describes displaying the loop variable pkg instead of the accumulated count, and provides the corrected line.'
    ],
    {widths: ['14%', '46%', '40%']})
], {two: true}));

/* ---------- Question 10: drag matching algorithm components and Big-O complexity (2 marks) ---------- */
qs.push(Q(SA, 'A warehouse logistics software team optimizes search and sorting routines used across automated guided vehicles (AGVs) and conveyor belt controllers. Different algorithmic components and control structures provide different functional purposes and computational complexities.', [
  dm('Match each pseudocode algorithm component to its operational purpose and computational complexity by dragging the labels into the boxes. (2 marks)',
    [
      'Direct index lookup — O(1) constant time',
      'Binary search — O(log n) logarithmic time',
      'Linear scan / accumulation — O(n) linear time',
      'Bubble sort — O(n²) quadratic time'
    ],
    [
      ['Accessing an array item at a known subscript position: Set item = parcels[k], requiring a single operation regardless of dataset size.', 0],
      ['Halving the remaining search window in a sorted array on each iteration: Set mid = (low + high) DIV 2.', 1],
      ['Traversing an array sequentially from 1 to n to filter elements or compute a running total: FOR i = 1 TO n.', 2],
      ['Iterating through an array using nested loops (FOR pass = 1 TO n - 1 and FOR i = 1 TO n - pass) to compare and swap adjacent items.', 3]
    ],
    2,
    {why: '• Direct index lookup (parcels[k]) has O(1) constant time complexity because the element memory address is calculated directly via base address and offset, taking the same time regardless of array size.\n' +
          '• Binary search has O(log n) logarithmic time complexity because each iteration halves the remaining search range, requiring at most log2(n) comparisons in a sorted array.\n' +
          '• Linear scan / accumulation has O(n) linear time complexity because every element in the array of size n is visited once sequentially.\n' +
          '• Bubble sort has O(n²) quadratic time complexity because nested loops compare each element with neighbouring elements across multiple passes, requiring approximately n(n-1)/2 comparisons.'})
]));

/* ==========================================================================
   SECTION 3: Core Standard Algorithms and Search Techniques (Questions 11 to 15)
   Subtotal: 17 marks
   ========================================================================== */

/* ---------- Question 11: finding minimum value and retaining earliest tie (4 marks) ---------- */
qs.push(Q(SA, 'A weather monitoring station at the SwiftRoute freight depot records daily minimum temperatures (in &deg;C) over a fortnight in an array named <code>temps</code>, with indices from 1 to 14.' +
  tbl(['Day (Index)', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
    [['Temperature (&deg;C)', '14', '11', '9', '13', '8', '12', '8', '15', '17', '10', '14', '9', '11', '16']],
    'Fortnightly temperature readings') +
  '<p>An algorithm is required to find the lowest (minimum) temperature and the day (index 1 to 14) on which it occurred. If the minimum temperature occurred on multiple days, the earliest day must be retained.</p>', [
  ps('Using pseudocode, write an algorithm to find and display the minimum temperature and the day on which it occurred. You may assume that the array temps is already populated with 14 temperature values.', 4,
'BEGIN findMinTemp\n' +
'    Set minTemp = temps[1]\n' +
'    Set minDay = 1\n' +
'    FOR day = 2 TO 14\n' +
'        IF temps[day] < minTemp THEN\n' +
'            Set minTemp = temps[day]\n' +
'            Set minDay = day\n' +
'        ENDIF\n' +
'    NEXT day\n' +
'    Display "Minimum temperature: ", minTemp\n' +
'    Display "Recorded on day: ", minDay\n' +
'END findMinTemp',
    [
      '1 mark: initialises the minimum value (minTemp) to the first element (temps[1]) and the day position (minDay) to 1 prior to the loop.',
      '1 mark: uses a counted loop (FOR day = 2 TO 14 or FOR day = 1 TO 14) to traverse array elements.',
      '1 mark: uses selection (IF temps[day] < minTemp THEN) to compare each element and update both the minimum value and its day index (using < to retain the earliest day in the event of a tie).',
      '1 mark: displays both the minimum temperature and the day index after the loop completes.'
    ]
  )
], {two: true}));

/* ---------- Question 12: binary search step ordering (3 marks) ---------- */
qs.push(Q(SA, '', [
  od('Place the following steps of a binary search algorithm in the correct order by dragging the steps into position. The array arr contains n numbers sorted in ascending order.',
    '# BEGIN binarySearch (arr, n, target)\n' +
    '    = Set low = 1\n' +
    '    = Set high = n\n' +
    '    = Set found = False\n' +
    '    WHILE low <= high AND found = False\n' +
    '        Set mid = INT((low + high) / 2)\n' +
    '        IF arr[mid] = target THEN\n' +
    '            Set found = True\n' +
    '        ELSEIF arr[mid] < target THEN\n' +
    '            Set low = mid + 1\n' +
    '        ELSE\n' +
    '            Set high = mid - 1\n' +
    '        ENDIF\n' +
    '    ENDWHILE\n' +
    '    = RETURN found\n' +
    '# END binarySearch (arr, n, target)',
    3,
    {
      extra: ['Set low = mid - 1', 'Set high = mid + 1', 'WHILE low < high AND found = False'],
      why: 'low starts at 1 and high starts at n. The search continues while low <= high and found is False. In each pass, mid is calculated. If arr[mid] < target, the target lies in the upper half so low becomes mid + 1; otherwise high becomes mid - 1.'
    }
  )
]));

/* ---------- Question 13: linear search with early flag exit (4 marks) ---------- */
qs.push(Q(SA, 'A freight depot uses an automated inventory database. A list of parcel barcode identifiers is stored in an array named <code>parcels</code>, which contains <code>n</code> items. An operator scans a barcode to check whether the parcel is present in the sorting bay.' +
  '<p>Because the depot processes thousands of parcels, the search must stop as soon as a matching barcode is found rather than scanning the remainder of the array.</p>', [
  ps('Using pseudocode, write an algorithm that performs a linear search for targetID in the array parcels of size n. The algorithm must terminate early using a Boolean flag once the item is found. Display the index where the parcel was found, or display "Parcel not found" if it is not in the array.', 4,
'BEGIN findParcel (parcels, n, targetID)\n' +
'    Set found = False\n' +
'    Set index = 1\n' +
'    WHILE index <= n AND found = False\n' +
'        IF parcels[index] = targetID THEN\n' +
'            Set found = True\n' +
'        ELSE\n' +
'            Set index = index + 1\n' +
'        ENDIF\n' +
'    ENDWHILE\n' +
'    IF found = True THEN\n' +
'        Display "Parcel found at position: ", index\n' +
'    ELSE\n' +
'        Display "Parcel not found"\n' +
'    ENDIF\n' +
'END findParcel (parcels, n, targetID)',
    [
      '1 mark: initialises a Boolean flag (e.g. Set found = False) and pointer/index (Set index = 1) before the loop.',
      '1 mark: uses a conditional loop (WHILE index <= n AND found = False) that terminates early when found becomes True or when the array bounds are exceeded.',
      '1 mark: checks each element sequentially, setting found to True when parcels[index] = targetID, and advancing index only when no match is found.',
      '1 mark: after the loop, uses selection to display the position where the parcel was found if found is True, or displays "Parcel not found" otherwise.'
    ]
  )
], {two: true}));

/* ---------- Question 14: trace table for 2D matrix traversal (3 marks) ---------- */
qs.push(Q(SA, 'An automated freight distribution hub organizes cargo containers in a 2 &times; 3 grid across two storage levels. The grid is stored in a two-dimensional array named <code>tiles</code>, where each cell records the number of priority crates.' +
  tbl(['Row \\ Column', 'Col 1', 'Col 2', 'Col 3'], [
    ['Row 1', '4', '1', '6'],
    ['Row 2', '2', '5', '3']
  ], 'Matrix: tiles') +
  '<p>Consider the following algorithm that processes the matrix.</p>' +
  code('BEGIN processTiles\n    Set total = 0\n    Set highCount = 0\n    FOR row = 1 TO 2\n        FOR col = 1 TO 3\n            Set pts = tiles[row][col]\n            IF pts >= 4 THEN\n                Set total = total + pts\n                Set highCount = highCount + 1\n            ENDIF\n        NEXT col\n    NEXT row\n    Display "High tiles: ", highCount, " Total points: ", total\nEND processTiles'), [
  ft('Complete the trace table for the algorithm as it processes the matrix tiles. (3 marks)', 3,
    ['row', 'col', 'pts', 'total', 'highCount', 'Output displayed'],
    [
      ['1', '1', '4', null, null, '-'],
      ['1', '2', '1', null, null, '-'],
      ['1', '3', '6', null, null, '-'],
      ['2', '1', '2', null, null, '-'],
      ['2', '2', '5', null, null, '-'],
      ['2', '3', '3', null, null, '-'],
      ['After loops', '-', '-', '-', '-', null]
    ],
    [
      ['1', '1', '4', '4', '1', '-'],
      ['1', '2', '1', '4', '1', '-'],
      ['1', '3', '6', '10', '2', '-'],
      ['2', '1', '2', '10', '2', '-'],
      ['2', '2', '5', '15', '3', '-'],
      ['2', '3', '3', '15', '3', '-'],
      ['After loops', '-', '-', '-', '-', 'High tiles: 3 Total points: 15']
    ],
    [
      '1 mark: the total column is traced correctly across all iterations (4, 4, 10, 10, 15, 15).',
      '1 mark: the highCount column is traced correctly across all iterations (1, 1, 2, 2, 3, 3).',
      '1 mark: the final output is correctly recorded after the loops ("High tiles: 3 Total points: 15").'
    ],
    {widths: ['12%', '12%', '14%', '14%', '16%', '32%']}
  )
], {two: true}));

/* ---------- Question 15: written comparison of search algorithms (3 marks) ---------- */
qs.push(Q(SA, '', [
  tx('Compare the efficiency and preconditions of a linear search algorithm with a binary search algorithm. (3 marks)', 3, 80,
    'A linear search has no preconditions and operates on unsorted or sorted data, inspecting items sequentially with O(n) linear efficiency, which becomes slow for large datasets. In contrast, a binary search requires the precondition that data must already be sorted. By repeatedly halving the search space, binary search operates with O(log n) logarithmic efficiency, making it significantly faster and more scalable when searching large collections.',
    [
      '1 mark: identifies the difference in preconditions (linear search works on unsorted or sorted data, whereas binary search requires the data to be pre-sorted).',
      '1 mark: compares algorithmic efficiency / time complexity (linear search operates in O(n) linear time checking sequentially, whereas binary search operates in O(log n) logarithmic time by halving the search space).',
      '1 mark: explains the practical performance implications (binary search is significantly faster/scalable for large datasets, while linear search is suitable for small lists or one-off searches where sorting overhead is unjustified).'
    ]
  )
]));

/* ==========================================================================
   SECTION 4: Sorting, Flowcharts, Modular Design, and Parameters (Questions 16 to 20)
   Subtotal: 17 marks
   ========================================================================== */

/* ---------- Question 16: bubble sort pass (3 marks) ---------- */
qs.push(Q(SA,
  'At the SwiftRoute automated parcel depot, an array <code>weights</code> holds the weights of <code>n</code> parcels currently queued on an intake conveyor belt. The parcels are indexed from 1 to <code>n</code>.' +
  '<p>To sort the queue from lightest to heaviest, a technician writes a bubble sort algorithm. Before running the full sort, the technician requires an algorithm that executes a <strong>single pass</strong> of the bubble sort.</p>' +
  tbl(['Index', '1', '2', '3', '4', '5'], [['weights', '18.4', '6.2', '12.0', '25.5', '9.1']], 'Example array weights before one pass') +
  '<p>During the pass, the algorithm compares adjacent elements and swaps them if the first parcel is heavier than the second. The algorithm must use a boolean flag <code>swapped</code> to record whether any elements were swapped, and display whether any swaps occurred after the pass finishes.</p>',
  [
    ps('Write the algorithm using pseudocode to perform a single pass of a bubble sort on the array weights. You may assume that the array has been populated with n numbers.', 3,
'BEGIN bubblePass (weights, n)\n' +
'    Set swapped = False\n' +
'    FOR pos = 1 TO n - 1\n' +
'        IF weights[pos] > weights[pos + 1] THEN\n' +
'            Set temp = weights[pos]\n' +
'            Set weights[pos] = weights[pos + 1]\n' +
'            Set weights[pos + 1] = temp\n' +
'            Set swapped = True\n' +
'        ENDIF\n' +
'    NEXT pos\n' +
'    IF swapped = True THEN\n' +
'        Display "Swaps occurred"\n' +
'    ELSE\n' +
'        Display "No swaps occurred"\n' +
'    ENDIF\n' +
'END bubblePass (weights, n)',
      [
        '1 mark: Uses a FOR loop iterating from 1 to n - 1 to compare adjacent array elements.',
        '1 mark: Compares adjacent elements (weights[pos] > weights[pos + 1]) and records swaps with a boolean flag (swapped = True).',
        '1 mark: Correctly swaps adjacent elements using a temporary variable and displays whether swaps occurred after the loop.'
      ]
    )
  ],
  { two: true }
));

/* ---------- Question 17: flowchart to pseudocode (4 marks) ---------- */
qs.push(Q(SA,
  'At the SwiftRoute depot, an automated scanner inspects parcel weights before loading them into transport containers. The logic is shown as a flowchart.' +
  fig('Flowchart for the parcel intake scanner algorithm', figWrap(figFlowchart())) +
  '<p>The scanner continuously reads parcel weights until a sentinel weight of 0 (or less) is entered. Parcels weighing more than 25 kg are flagged as overweight and counted for manual inspection, while all other parcels have their weight accumulated into <code>totalWeight</code>.</p>',
  [
    ps('Translate the algorithm shown in the flowchart into formal NESA pseudocode. You may assume that all inputs are numbers.', 4,
'BEGIN intakeScanner\n' +
'    Set totalWeight = 0\n' +
'    Set heavyCount = 0\n' +
'    Get weight\n' +
'    WHILE weight > 0\n' +
'        IF weight > 25 THEN\n' +
'            Set heavyCount = heavyCount + 1\n' +
'            Display "Overweight"\n' +
'        ELSE\n' +
'            Set totalWeight = totalWeight + weight\n' +
'            Display "Accepted"\n' +
'        ENDIF\n' +
'        Get weight\n' +
'    ENDWHILE\n' +
'    Display "Total accepted weight: ", totalWeight\n' +
'    Display "Heavy parcels flagged: ", heavyCount\n' +
'END intakeScanner',
      [
        '1 mark: Initialises totalWeight and heavyCount to 0 before the loop and reads the initial weight.',
        '1 mark: Uses a pre-test WHILE loop that tests weight > 0 with a subsequent Get weight at the end of the loop body.',
        '1 mark: Implements a binary selection (IF/ELSE/ENDIF) that increments heavyCount and displays the overweight message when weight > 25, and adds weight to totalWeight and displays accepted otherwise.',
        '1 mark: Correctly displays the final totalWeight and heavyCount after the loop terminates.'
      ]
    )
  ],
  { two: true }
));

/* ---------- Question 18: structure chart interpretation (3 marks) ---------- */
qs.push(Q(SEP,
  'The structure chart shows the modular design of the SwiftRoute dispatch system, which processes each shipment parcel.' +
  fig('Structure chart for the shipment processing system', figWrap(figStructureChart())) +
  '<p>The top module <code>Process shipment</code> coordinates four subordinate subroutines. Note the notations used for parameters, control flags, and conditional module execution.</p>',
  [
    mt('Using the structure chart, identify the type or role of each item listed below. (3 marks)',
      ['Item from structure chart', 'Data couple (parameter passing data)', 'Control flag (parameter signalling status)', 'Subordinate module (subroutine)', 'Decision diamond (conditional selection)'],
      [
        ['isValidZone (solid circle with upward arrow)', 1],
        ['weight and destZone (open circle with arrow)', 0],
        ['Calculate dispatch (rectangular box)', 2],
        ['Diamond at the base of Process shipment', 3],
        ['shippingCost and deliveryDays (open circle with arrow)', 0],
        ['Scan barcode (rectangular box)', 2]
      ],
      3,
      'In a structure chart, an open circle with an arrow represents a data couple (passing data values between modules). A solid filled circle with an arrow represents a control flag (signalling a condition or boolean status, such as isValidZone). A rectangular box beneath the controlling module represents a subordinate module or subroutine. A small diamond at the base of a module represents conditional execution (selection), indicating that the subordinate module is only called when a condition is met.'
    )
  ],
  { two: true }
));

/* ---------- Question 19: subroutine parameter passing (4 marks) ---------- */
qs.push(Q(SEP,
  'The SwiftRoute dispatch program calls a subroutine <code>CalculateDispatch</code> to determine both the shipping cost and the estimated delivery time for a parcel.' +
  '<p>The subroutine receives three input values: the parcel\'s <code>weight</code> in kilograms (number), the destination <code>zone</code> (1 for local metro, 2 for interstate), and a boolean flag <code>isExpress</code> (True if express service was selected, False otherwise).</p>' +
  '<p>The subroutine must calculate and pass back two values to the caller via parameters:</p>' +
  bl([
    '<strong>shippingCost</strong>: For zone 1, the base cost is $15.00 plus $2.50 per kilogram for every kilogram over 5 kg. For zone 2, the base cost is $30.00 plus $4.00 per kilogram for every kilogram over 5 kg. If <code>isExpress</code> is True, add a $12.00 express fee to <code>shippingCost</code>.',
    '<strong>deliveryDays</strong>: If <code>isExpress</code> is True, <code>deliveryDays</code> is 1 day regardless of zone. If <code>isExpress</code> is False, <code>deliveryDays</code> is 2 days for zone 1, and 4 days for zone 2.'
  ]) +
  '<p>You may assume that <code>weight</code> is a positive number and <code>zone</code> is either 1 or 2.</p>',
  [
    ps('Write the subroutine CalculateDispatch using pseudocode. The subroutine must take the input parameters and pass back the calculated shippingCost and deliveryDays through its parameter list.', 4,
'BEGIN CalculateDispatch (weight, zone, isExpress, shippingCost, deliveryDays)\n' +
'    IF zone = 1 THEN\n' +
'        Set shippingCost = 15.00\n' +
'        IF weight > 5 THEN\n' +
'            Set shippingCost = shippingCost + (weight - 5) * 2.50\n' +
'        ENDIF\n' +
'    ELSE\n' +
'        Set shippingCost = 30.00\n' +
'        IF weight > 5 THEN\n' +
'            Set shippingCost = shippingCost + (weight - 5) * 4.00\n' +
'        ENDIF\n' +
'    ENDIF\n' +
'    IF isExpress = True THEN\n' +
'        Set shippingCost = shippingCost + 12.00\n' +
'        Set deliveryDays = 1\n' +
'    ELSE\n' +
'        IF zone = 1 THEN\n' +
'            Set deliveryDays = 2\n' +
'        ELSE\n' +
'            Set deliveryDays = 4\n' +
'        ENDIF\n' +
'    ENDIF\n' +
'END CalculateDispatch (weight, zone, isExpress, shippingCost, deliveryDays)',
      [
        '1 mark: Correct subroutine definition and closing with appropriate parameter list containing inputs (weight, zone, isExpress) and output/pass-back parameters (shippingCost, deliveryDays).',
        '1 mark: Correctly calculates base shippingCost for zone 1 ($15) and zone 2 ($30) and correctly applies additional charge for weight exceeding 5 kg.',
        '1 mark: Adds the $12.00 express fee to shippingCost when isExpress is True.',
        '1 mark: Correctly assigns deliveryDays (1 day when isExpress is True; 2 days for zone 1 and 4 days for zone 2 when isExpress is False).'
      ]
    )
  ],
  { two: true }
));

/* ---------- Question 20: written explanation of parameter passing (3 marks) ---------- */
qs.push(Q(SEP,
  'In Question 19, the subroutine <code>CalculateDispatch</code> accepts input data and modifies multiple values that are returned to the calling module.' +
  '<p>In software engineering, parameter passing can be implemented using <em>pass-by-value</em> or <em>pass-by-reference</em> (also known as pass-back parameters).</p>',
  [
    tx('Explain the difference between pass-by-value and pass-by-reference parameters, with reference to the parameters used in the CalculateDispatch subroutine in Question 19. (3 marks)', 3, 90,
      'Pass-by-value passes a copy of the actual data to the subroutine. Any modifications made inside the subroutine affect only the local copy, leaving the caller\'s original variable unchanged. In CalculateDispatch, parameters such as weight, zone, and isExpress should be passed by value to protect the original parcel details from accidental side effects. In contrast, pass-by-reference passes the memory address of the variable, allowing the subroutine to directly update the caller\'s original storage. This is necessary for shippingCost and deliveryDays so the subroutine can pass back multiple calculated results simultaneously.',
      [
        '1 mark: Explains that pass-by-value passes a copy of the argument, meaning changes inside the subroutine do not alter the caller\'s variable, citing an input parameter from the scenario (e.g. weight, zone, or isExpress).',
        '1 mark: Explains that pass-by-reference passes the memory address/reference to the variable, allowing direct modification of the caller\'s variable, citing an output parameter from the scenario (e.g. shippingCost or deliveryDays).',
        '1 mark: Explains the significance in the scenario: pass-by-value ensures data protection against unintended side-effects, while pass-by-reference allows the subroutine to return multiple modified values to the caller.'
      ]
    )
  ],
  { two: true }
));

/* ==========================================================================
   SECTION 5: Functions, Modularity, Tracing Scope, and Synthesis (Questions 21 to 25)
   Subtotal: 23 marks
   ========================================================================== */

/* ---------- Question 21: function definition with RETURN (4 marks) ---------- */
qs.push(Q(SA, 'The AeroDrop automated drone delivery network calculates a Flight Energy Metric (FEM) before dispatching any drone, ensuring the trip remains within safe battery reserves.' + bl([
  'The one-way flight distance is given in kilometres.',
  'The parcel payload weight is given in kilograms.',
  'The headwind speed is given in kilometres per hour.'
]) + '<p>A user-defined function named <code>calcEnergyMetric</code> accepts the three parameters <code>(distance, payloadWeight, headwindSpeed)</code> and calculates the metric as follows:</p>' + bl([
  'Base energy is calculated as <code>distance * 12.0</code>.',
  'If <code>payloadWeight</code> is greater than 3.0 kg, an additional load penalty of <code>(payloadWeight - 3.0) * 8.5</code> is added.',
  'If <code>headwindSpeed</code> is greater than 15.0 km/h, an additional aerodynamic penalty of <code>(headwindSpeed - 15.0) * 4.0</code> is added.',
  'If the total calculated energy metric exceeds 220.0, it must be capped at 220.0.',
  'The function passes back the final energy metric using <code>RETURN</code>.'
]), [
  ps('Write the function calcEnergyMetric using pseudocode. You may assume that all arguments passed into the function are valid numeric values. (4 marks)', 4,
'BEGIN calcEnergyMetric (distance, payloadWeight, headwindSpeed)\n' +
'    Set energy = distance * 12.0\n' +
'    IF payloadWeight > 3.0 THEN\n' +
'        Set energy = energy + (payloadWeight - 3.0) * 8.5\n' +
'    ENDIF\n' +
'    IF headwindSpeed > 15.0 THEN\n' +
'        Set energy = energy + (headwindSpeed - 15.0) * 4.0\n' +
'    ENDIF\n' +
'    IF energy > 220.0 THEN\n' +
'        Set energy = 220.0\n' +
'    ENDIF\n' +
'    RETURN energy\n' +
'END calcEnergyMetric (distance, payloadWeight, headwindSpeed)',
    [
      '1 mark: defines the function header with three parameters (distance, payloadWeight, headwindSpeed) and ends with a matching END statement.',
      '1 mark: calculates the base energy correctly as distance multiplied by 12.0.',
      '1 mark: correctly applies both conditional penalties: weight penalty when payloadWeight > 3.0 and wind penalty when headwindSpeed > 15.0.',
      '1 mark: caps the energy metric at 220.0 when it exceeds the safety threshold, and uses RETURN to pass back the final calculated metric.'
    ]
  )
], {two: true}));

/* ---------- Question 22: mainline algorithm with subroutines and validation (5 marks) ---------- */
qs.push(Q(SA, 'The central dispatch console at AeroDrop coordinates autonomous drone flights. A mainline algorithm named <code>dispatchCoordinator</code> coordinates several subroutines to validate inputs, verify battery levels, and record dispatches.' +
  '<p>The mainline coordinates three existing subroutines:</p>' + bl([
  '<code>validateDroneBattery (droneID, minLevel, isReady)</code>: checks whether <code>droneID</code> has at least <code>minLevel</code> percent battery charge, passing back <code>True</code> or <code>False</code> in <code>isReady</code>.',
  '<code>computeFlightCharge (distance, payloadWeight, fee)</code>: computes the customer fee and passes it back in <code>fee</code>.',
  '<code>recordDroneDispatch (droneID, fee)</code>: updates the dispatch register and releases the drone lock.'
]) + '<p>The mainline algorithm must:</p>' + bl([
  'Prompt and read <code>droneID</code>. The process repeats until a sentinel <code>droneID</code> of <code>0</code> is entered.',
  'For each active drone, prompt and read <code>distance</code> (km) and <code>payloadWeight</code> (kg).',
  'Validate that <code>distance > 0</code> and <code>payloadWeight >= 0.2 AND payloadWeight <= 8.0</code>. If either value is invalid, display <code>"Error: Invalid flight parameters"</code> and bypass further processing for this drone.',
  'If valid, call <code>validateDroneBattery</code> with the drone ID, a minimum level of <code>35</code>, and <code>isReady</code>.',
  'If <code>isReady</code> is <code>False</code>, display <code>"Error: Battery below 35% - dispatch aborted"</code>.',
  'If <code>isReady</code> is <code>True</code>, call <code>computeFlightCharge</code> to determine the fee, call <code>recordDroneDispatch</code> to record the flight, and display <code>"Drone ", droneID, " dispatched. Fee: $", fee</code>.',
  'When <code>0</code> is entered, terminate the loop and display <code>"All dispatches completed"</code>.'
]), [
  ps('Write the mainline algorithm dispatchCoordinator using pseudocode. (5 marks)', 5,
'BEGIN dispatchCoordinator\n' +
'    Display "Enter Drone ID (0 to exit):"\n' +
'    Get droneID\n' +
'    WHILE droneID <> 0\n' +
'        Display "Enter distance (km):"\n' +
'        Get distance\n' +
'        Display "Enter payload weight (kg):"\n' +
'        Get payloadWeight\n' +
'        IF distance <= 0 OR payloadWeight < 0.2 OR payloadWeight > 8.0 THEN\n' +
'            Display "Error: Invalid flight parameters"\n' +
'        ELSE\n' +
'            validateDroneBattery (droneID, 35, isReady)\n' +
'            IF isReady = False THEN\n' +
'                Display "Error: Battery below 35% - dispatch aborted"\n' +
'            ELSE\n' +
'                computeFlightCharge (distance, payloadWeight, fee)\n' +
'                recordDroneDispatch (droneID, fee)\n' +
'                Display "Drone ", droneID, " dispatched. Fee: $", fee\n' +
'            ENDIF\n' +
'        ENDIF\n' +
'        Display "Enter Drone ID (0 to exit):"\n' +
'        Get droneID\n' +
'    ENDWHILE\n' +
'    Display "All dispatches completed"\n' +
'END dispatchCoordinator',
    [
      '1 mark: implements a loop (WHILE or REPEAT/UNTIL) that repeats until the sentinel droneID 0 is entered, with initial input read and subsequent read inside the loop.',
      '1 mark: performs input validation on distance (> 0) and payloadWeight (>= 0.2 and <= 8.0), and displays an error message when invalid.',
      '1 mark: coordinates call to validateDroneBattery passing droneID, minimum level 35, and isReady.',
      '1 mark: branches on isReady, displaying an error message if False, and proceeding only if True.',
      '1 mark: coordinates calls to computeFlightCharge and recordDroneDispatch with correct parameters, and displays the dispatch confirmation and final termination messages.'
    ]
  )
], {two: true}));

/* ---------- Question 23: trace table with subroutines (4 marks) ---------- */
qs.push(Q(SA, 'An automated pipeline pressure regulation algorithm calls a subroutine to calculate calibrated pressure values across three monitoring stages.' + code('BEGIN auditPipeline\n    Set pressure = 50\n    Set surgeFactor = 8\n    FOR stage = 1 TO 3\n        Set pressure = calcAdjustedPressure (pressure, surgeFactor)\n        Display "Stage ", stage, ": calibrated pressure = ", pressure\n    NEXT stage\nEND auditPipeline\n\nBEGIN calcAdjustedPressure (base, boost)\n    Set calibrated = base + (boost * 2)\n    IF calibrated > 80 THEN\n        Set calibrated = calibrated - 10\n    ENDIF\n    RETURN calibrated\nEND calcAdjustedPressure (base, boost)'), [
  ft('Complete the trace table to show the parameter passing, callee local calculations, return values, caller variable state, and output displayed. (4 marks)', 4,
    ['stage (caller)', 'base (callee param)', 'calibrated (callee local)', 'Value returned', 'pressure (caller scope)', 'Output displayed'],
    [['1', null, null, null, null, null], ['2', null, null, null, null, null], ['3', null, null, null, null, null]],
    [['1', '50', '66', '66', '66', 'Stage 1: calibrated pressure = 66'], ['2', '66', '72', '72', '72', 'Stage 2: calibrated pressure = 72'], ['3', '72', '78', '78', '78', 'Stage 3: calibrated pressure = 78']],
    [
      '1 mark: correctly traces the argument passed into callee parameter base on each call (50, 66, 72).',
      '1 mark: correctly traces the callee local variable calibrated across all stages, including applying the threshold reduction (-10) for stages 2 and 3 (66, 72, 78).',
      '1 mark: correctly records the Value returned (66, 72, 78) and caller variable pressure (66, 72, 78).',
      '1 mark: correctly states the Output displayed string for all three stages.'
    ],
    {widths: ['10%', '16%', '18%', '14%', '16%', '26%']})
], {two: true}));

/* ---------- Question 24: multi-way selection with CASEWHERE (4 marks) ---------- */
qs.push(Q(SA, 'At the automated sorting junction of the AeroDrop logistics facility, optical scanners read a single-letter sorting code <code>sortCode</code> and measure the parcel <code>weight</code> in kilograms.' +
  '<p>An algorithm named <code>routeParcel</code> must determine the routing destination, processing fee, and priority level using a <code>CASEWHERE</code> structure based on the business rules below:</p>' +
  tbl(['Sorting Code', 'Destination Chute', 'Processing Fee', 'Priority Level'], [
    ['"L" (Local)', '"Chute 1"', '$10 flat', '"Standard"'],
    ['"E" (Express)', '"Chute 2"', '$25 flat', '"High Priority"'],
    ['"H" (Heavy)', '"Chute 3"', '$15 base plus $4 per kg of weight', '"Heavy Freight"'],
    ['"F" (Fragile)', '"Chute 4"', '$30 flat', '"Delicate Handling"'],
    ['Any other code', '"Manual Inspection Chute"', '$0', '"Flagged / Hold"']
  ]) +
  '<p>For any unrecognised code, the <code>OTHERWISE</code> branch must also display <code>"Warning: Unrecognised routing code - parcel flagged for manual inspection"</code>.</p>' +
  '<p>After the selection structure ends, the algorithm must display the routing summary: <code>"Routing to ", destinationChute, " | Fee: $", processingFee, " | Priority: ", priorityLevel</code>.</p>', [
  ps('Write the algorithm routeParcel using pseudocode. You must use a CASEWHERE ... OTHERWISE ... ENDCASE structure. (4 marks)', 4,
'BEGIN routeParcel\n' +
'    Get sortCode\n' +
'    Get weight\n' +
'    CASEWHERE sortCode evaluates to\n' +
'        "L":\n' +
'            Set destinationChute = "Chute 1"\n' +
'            Set processingFee = 10\n' +
'            Set priorityLevel = "Standard"\n' +
'        "E":\n' +
'            Set destinationChute = "Chute 2"\n' +
'            Set processingFee = 25\n' +
'            Set priorityLevel = "High Priority"\n' +
'        "H":\n' +
'            Set destinationChute = "Chute 3"\n' +
'            Set processingFee = 15 + (weight * 4)\n' +
'            Set priorityLevel = "Heavy Freight"\n' +
'        "F":\n' +
'            Set destinationChute = "Chute 4"\n' +
'            Set processingFee = 30\n' +
'            Set priorityLevel = "Delicate Handling"\n' +
'        OTHERWISE:\n' +
'            Set destinationChute = "Manual Inspection Chute"\n' +
'            Set processingFee = 0\n' +
'            Set priorityLevel = "Flagged / Hold"\n' +
'            Display "Warning: Unrecognised routing code - parcel flagged for manual inspection"\n' +
'    ENDCASE\n' +
'    Display "Routing to ", destinationChute, " | Fee: $", processingFee, " | Priority: ", priorityLevel\n' +
'END routeParcel',
    [
      '1 mark: correctly reads inputs (sortCode, weight) and structures the CASEWHERE block evaluating sortCode, closed by ENDCASE (or END CASE).',
      '1 mark: correctly implements the flat-rate branches ("L", "E", "F") assigning destinationChute, processingFee, and priorityLevel.',
      '1 mark: correctly implements the "H" branch calculating processingFee as 15 + (weight * 4) and setting destinationChute and priorityLevel.',
      '1 mark: implements the OTHERWISE branch setting fallback values, displaying the warning message, and displaying the final routing summary after the CASE structure.'
    ]
  )
], {two: true}));

/* ---------- Question 25: capstone automated pipeline with defensive programming (6 marks) ---------- */
qs.push(Q(SA, 'In the AeroDrop automated sorting pipeline, an automated intake conveyor processes batches of parcels. Sensor telemetry records parcel weights into an array <code>weights</code> containing <code>batchSize</code> readings (indexed 1 to <code>batchSize</code>).' +
  '<p>To ensure operational safety and prevent equipment damage, the algorithm <code>processIntakePipeline</code> must employ defensive programming to handle boundary validation, sensor errors, and pipeline edge cases:</p>' + bl([
  'Valid parcel weights must satisfy the boundary condition: <code>weight > 0.0 AND weight <= 25.0</code>.',
  'Any reading outside this boundary is anomalous (sensor failure or overloaded parcel). The algorithm increments <code>rejectCount</code> and tracks consecutive anomalies in <code>consecutiveErrors</code>.',
  'If <code>consecutiveErrors</code> reaches 3, the pipeline must immediately trigger an emergency conveyor shutdown: display <code>"CRITICAL: Emergency pipeline shutdown - 3 consecutive sensor failures"</code> and halt further processing of the batch.',
  'When a valid parcel is processed, reset <code>consecutiveErrors</code> to 0, increment <code>validCount</code>, add the weight to <code>totalWeight</code>, and if <code>weight >= 15.0</code> increment <code>heavyCount</code>.',
  'After processing, if <code>validCount = 0</code>, defensively prevent division by zero and display <code>"Warning: Zero valid parcels processed in batch"</code>.',
  'If <code>validCount > 0</code>, calculate <code>avgWeight = totalWeight / validCount</code>, display the valid, rejected, total weight, average weight, and heavy parcel counts, and if <code>rejectCount > (batchSize * 0.2)</code> display <code>"Pipeline Alert: Maintenance required - high fault rate"</code>; otherwise display <code>"Pipeline Status: Normal operation"</code>.'
]), [
  ps('Write the algorithm processIntakePipeline using pseudocode. Use defensive programming to handle all edge cases and boundary conditions. (6 marks)', 6,
'BEGIN processIntakePipeline (weights, batchSize)\n' +
'    Set validCount = 0\n' +
'    Set rejectCount = 0\n' +
'    Set totalWeight = 0.0\n' +
'    Set heavyCount = 0\n' +
'    Set consecutiveErrors = 0\n' +
'    Set emergencyHalt = False\n' +
'    Set i = 1\n' +
'    WHILE i <= batchSize AND emergencyHalt = False\n' +
'        Set currentWeight = weights[i]\n' +
'        IF currentWeight <= 0.0 OR currentWeight > 25.0 THEN\n' +
'            Set rejectCount = rejectCount + 1\n' +
'            Set consecutiveErrors = consecutiveErrors + 1\n' +
'            IF consecutiveErrors >= 3 THEN\n' +
'                Display "CRITICAL: Emergency pipeline shutdown - 3 consecutive sensor failures"\n' +
'                Set emergencyHalt = True\n' +
'            ENDIF\n' +
'        ELSE\n' +
'            Set consecutiveErrors = 0\n' +
'            Set validCount = validCount + 1\n' +
'            Set totalWeight = totalWeight + currentWeight\n' +
'            IF currentWeight >= 15.0 THEN\n' +
'                Set heavyCount = heavyCount + 1\n' +
'            ENDIF\n' +
'        ENDIF\n' +
'        Set i = i + 1\n' +
'    ENDWHILE\n' +
'    IF validCount = 0 THEN\n' +
'        Display "Warning: Zero valid parcels processed in batch"\n' +
'    ELSE\n' +
'        Set avgWeight = totalWeight / validCount\n' +
'        Display "Valid parcels: ", validCount, " | Rejected: ", rejectCount\n' +
'        Display "Total weight: ", totalWeight, " kg | Average: ", avgWeight, " kg"\n' +
'        Display "Heavy parcels (>= 15kg): ", heavyCount\n' +
'        IF rejectCount > (batchSize * 0.2) THEN\n' +
'            Display "Pipeline Alert: Maintenance required - high fault rate"\n' +
'        ELSE\n' +
'            Display "Pipeline Status: Normal operation"\n' +
'        ENDIF\n' +
'    ENDIF\n' +
'END processIntakePipeline (weights, batchSize)',
    [
      '1 mark: initialises all tracking variables (validCount, rejectCount, totalWeight, heavyCount, consecutiveErrors, emergencyHalt) before the loop.',
      '1 mark: iterates through the array while defensively terminating early if an emergency shutdown condition occurs.',
      '1 mark: performs boundary validation (currentWeight > 0.0 AND currentWeight <= 25.0), correctly separating valid readings from anomalies.',
      '1 mark: handles the consecutive fault edge case, incrementing consecutiveErrors on failure, resetting to 0 on success, and triggering emergency shutdown when consecutiveErrors reaches 3.',
      '1 mark: defensive programming against division by zero by checking if validCount is 0 before calculating average weight.',
      '1 mark: correctly calculates totalWeight, avgWeight, heavyCount, and branches to display appropriate pipeline maintenance or normal status alerts.'
    ]
  )
], {two: true}));

BANKS.push({
  id: '23',
  name: 'Pseudocode Practice Paper 2',
  sub: '25 questions · 80 marks · SwiftRoute & AeroDrop: algorithms, modular design and data structures',
  mini: true,
  questions: 25,
  marks: 80,
  duration: 160 * 60,
  qs: qs
});
})();
