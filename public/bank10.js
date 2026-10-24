(function(){
var SEP='Software Engineering Project',SSA='Secure Software Architecture';
var qs=[];

qs.push(Q(SSA,'A school portal should let each student view only their own progress report. After sign-in, the browser requests a report using a student ID in the URL, such as <code>/report?student=104</code>, and hides links to other students\' reports. The server checks only that the session is valid before returning the report identified by the URL.',[
 tx('Explain why the current design fails to protect students\' reports and how server-side access control would address this.',5,180,
  'A valid session establishes who the student is, but does not establish permission to read the requested report. A student can change the ID in the URL and obtain another student\'s confidential report because hiding links does not prevent direct requests. For every report request, the server should obtain the student identity from the validated session and check that it matches the report owner before returning data. A mismatch must be denied without revealing the report. Alternatively, the server can ignore the requested student ID and retrieve only reports owned by the session identity. This allows access to the student\'s own reports while preventing a changed URL from granting access to other reports.',
  ['5 marks: coherently explains why a valid session does not establish permission for the requested report, how changing the URL can disclose another student\'s report despite hidden links, and how server enforcement ties each requested report to a trusted student identity before disclosure. The explanation shows why unauthorised reports are withheld while permitted reports remain accessible. Accept equivalent correct explanations and access-control designs; technical vulnerability names and test cases are not required.',
   '4 marks: explains both the disclosure mechanism and a substantially correct server-side ownership check using authenticated identity, but one relationship is incompletely explained, such as why hidden links can be bypassed or why the check must precede disclosure on every request.',
   '3 marks: explains the missing access control and resulting disclosure, with a relevant but incomplete server-side remedy; or explains a sound identity-and-ownership remedy but gives only a limited account of the original failure.',
   '2 marks: explains one relevant causal relationship in the failure or remedy, but does not connect the failure to an effective server-side access decision.',
   '1 mark: states a relevant fact about the weakness, confidentiality or server-side access control without explaining the relationship.'])]));

qs.push(Q(SEP,'A council plans to replace booking software at four community centres that use the same booking procedures but maintain separate records. Bookings must continue during the change. The council has limited staff to support the old and new software.',[
 tx('Evaluate the suitability of pilot implementation for this project.',5,180,
  'Pilot implementation is suitable overall because it contains disruption while providing evidence before wider adoption. The complete new software would run at one centre while the other three retain the old software. Separate records allow migration to be confined to that centre, and shared procedures make its operational feedback relevant to the others. Faults can be corrected before all four centres are affected, supporting booking continuity, although the pilot centre can still experience disruption. However, maintaining old and new software at different centres stretches the council\'s limited support staff and may delay wider rollout. The reduction in widespread booking risk outweighs this temporary support burden, provided the council can allocate sufficient support to the pilot.',
  ['5 marks: makes a supported overall judgement, accurately applies pilot implementation to the centres, and weighs its operational benefit against a relevant limitation using the project\'s need for booking continuity and limited support capacity. Explains how the effects arise rather than merely listing advantages and disadvantages. Accept a supported judgement that pilot implementation is suitable, unsuitable or suitable under stated conditions; a comparison with another method or a mitigation plan is not required.',
   '4 marks: accurately applies pilot implementation and explains a benefit and a limitation in this project, but the final judgement does not clearly weigh them; or gives a supported judgement with one of those effects incompletely developed.',
   '3 marks: accurately applies pilot implementation and explains a contextual benefit or limitation supporting a basic judgement; or explains relevant opposing effects without an overall judgement.',
   '2 marks: outlines pilot implementation and a relevant effect, with little explanation or contextual support for a judgement.',
   '1 mark: states a relevant fact about pilot implementation or its suitability for the project.'])]));

qs.push(Q(SEP,'An automated greenhouse records integer humidity readings in time order. A reading of <b>70 or more</b> counts as high humidity; a reading below 70 ends a consecutive run.<p>The program must:</p>'+bl([
 'read a non-negative integer <code>n</code>, the number of readings',
 'read the next <code>n</code> inputs as readings, one integer per input, preserving their order',
 'display only the longest run length as an integer, or 0 if there are no readings or no high readings.'
 ])+'<p>All inputs are valid. Each reading is from 0 to 100 inclusive.</p>'+tbl(['Readings (after n = 7)','Expected output'],[['69, 70, 75, 68, 80, 85, 90','3']]),[
 py('Implement a Python 3 program that displays the longest consecutive run of high humidity readings.',5,
  '# Read n, then n humidity readings, and print the longest high run.\n',
  'n = int(input())\ncurrent_run = 0\nlongest_run = 0\nfor i in range(n):\n    reading = int(input())\n    if reading >= 70:\n        current_run += 1\n    else:\n        current_run = 0\n    if current_run > longest_run:\n        longest_run = current_run\nprint(longest_run)',
  [{i:['0'],o:'0'},
   {i:['1','70'],o:'1'},
   {i:['3','0','69','25'],o:'0'},
   {i:['7','69','70','75','68','80','85','90'],o:'3'},
   {i:['7','70','80','90','69','70','69','100'],o:'3'},
   {i:['5','70','70','70','70','70'],o:'5'},
   {i:['5','70','69','70','69','70'],o:'1'}],
  ['1 mark: reads n and processes exactly n integer readings in their original order. Accept a loop or an equivalent sequence-processing approach.',
   '1 mark: correctly counts high readings within a run, including the boundary value 70. Assess counting independently of run-separation errors. A running counter is not required; accept grouped, list-based or other equivalent approaches.',
   '1 mark: separates runs when a reading is classified as low so non-consecutive high readings are not combined. Accept resetting state, splitting groups or equivalent logic. After a threshold error, apply the student\'s classification consistently here instead of deducting again.',
   '1 mark: selects the longest run across the whole sequence, including a run at the end; does not merely return the last run or the total number of high readings. Assess this maximum-selection logic independently of an earlier threshold error.',
   '1 mark: displays only the resulting integer, with 0 for n = 0 or when no reading is high. Award this output criterion independently of errors in calculating positive run lengths.'])],{two:true}));

BANKS.push({id:'10',name:'Mini Paper 1',sub:'3 questions · 15 marks · Access control, implementation and Python',mini:true,questions:3,marks:15,duration:30*60,qs:qs});
})();
