/* Demo paper showing every extra question format. Hidden from the paper lists;
   open it at #/formats. Questions are original. Copy any of these into a bank. */
(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var qs=[];

qs.push(Q(SEP,'',[
 od('Place the following steps of an algorithm that adds the even numbers from 1 to 10 in the correct order by dragging the steps into position.',`
# BEGIN SumEvens
    = Set total = 0
    FOR i = 1 TO 10
        IF i MOD 2 = 0 THEN
            Set total = total + i
        ENDIF
    NEXT i
    Display total
# END SumEvens`,2,{why:'The total starts at 0. Inside the loop, only even values of i are added. The total is displayed once, after the loop ends.'})]));

qs.push(Q(SEP,'Software is tested at several levels before it is released.',[
 dm('Match each level of testing to its description by dragging the labels into the boxes.',['Unit','Integration','System','Acceptance'],[
  ['A single function is tested on its own.',0],
  ['Modules are combined and the connections between them are tested.',1],
  ['The complete program is tested against the requirements.',2],
  ['The client confirms the software meets their needs.',3]],1,{why:'Testing moves from the smallest part (unit) to combined parts (integration), the whole program (system) and finally sign-off by the client (acceptance).'})]));

qs.push(Q(SEP,'Consider the following algorithm.'+code(`BEGIN postage
    Get Weight
    IF Weight > 2000 THEN
        Cost = 15
    ELSEIF Weight > 500 THEN
        Cost = 9
    ELSE
        Cost = 5
    ENDIF
    Display "Postage: $", Cost
END postage`),[
 ft('Provide a set of test data that will thoroughly test the algorithm. Include the expected outputs and reasons for inclusion. You may assume that all input data are valid.',3,
  ['Test data<br>(Weight)','Expected output<br>(Cost)','Reason for inclusion'],4,
  [['2500','15','Tests the first branch, above 2000'],['2000','9','Boundary: 2000 is not above 2000'],['501','9','Just above the 500 boundary'],['500','5','Boundary: 500 falls to the ELSE branch']],
  ['1 mark: data covering every branch.','1 mark: boundary values at 500 and 2000 tested.','1 mark: correct expected outputs with relevant reasons.'],{widths:['22%','22%','56%']})],{two:true}));

qs.push(Q(PW,'A developer added a style sheet to a page. The developer expected the button to look like Image 1, but it looks like Image 2.'+
 fig('',sbs([['Image 1','<span style="display:inline-block;background:#146cfd;color:#fff;padding:6px 16px;border-radius:4px;font-weight:700">Join now</span>'],['Image 2','<span style="display:inline-block;background:#e5e5e5;color:#000;padding:2px 6px;border:1px solid #777">Join now</span>']]))+
 '<p>The following code was used by the developer.</p>'+
 files([['index.html',`<!DOCTYPE html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="site.css">
  </head>
  <body>
    <button class="btn-join">Join now</button>
  </body>
</html>`],['site.css',`.join-btn {
  background: #146cfd;
  color: white;
  padding: 6px 16px;
  border-radius: 4px;
  font-weight: bold;
}`]]),[
 P('(a)',mc('Referring to the code, what is the cause of the problem?',['The style sheet has not been linked.','The class name in the HTML does not match the selector in the CSS.','Buttons cannot be styled with CSS.','The colour value is not valid.'],1,'The HTML uses btn-join but the CSS selector is .join-btn, so the rule never applies.')),
 P('(b)',tx('Outline TWO benefits of keeping styles in a separate CSS file. (2 marks)',2,40,'One file can style every page, so the look stays consistent across the site. A change to the design is made once in the CSS file instead of on every page. (Also accepted: smaller HTML files that are easier to read; the browser can cache the CSS.)',['1 mark for each relevant benefit, up to 2.']))],{two:true}));

qs.push(Q(SA,'A sports centre stores its weekly court bookings in a two-dimensional list. Each row is a session and each column is a day.'+
 ctbl(['Session','Monday','Tuesday','Wednesday'],[['1','Netball','Futsal','Squash'],['2','Futsal','Squash','Netball'],['3','Squash','Netball','Futsal']],{Netball:'#f9c6d3',Futsal:'#c9e7b7',Squash:'#fde2a7'}),[
 mc('The table is stored as <code>bookings</code>, with rows for sessions and columns for days, starting at index 0. Which expression gives the booking for session 2 on Wednesday?',['<code>bookings[2][3]</code>','<code>bookings[1][2]</code>','<code>bookings[2,3]</code>','<code>bookings[1].Wednesday</code>'],1,'Session 2 is row index 1 and Wednesday is column index 2, so the expression is bookings[1][2].')]));

qs.push(Q(SEP,'This decision tree is used to decide whether a parcel is sent by express post.'+
 fig('Express post decision tree','<svg viewBox="0 0 440 210" width="440" role="img" aria-label="Decision tree"><g font-family="Arial" font-size="13" text-anchor="middle" fill="#000"><rect x="150" y="8" width="140" height="30" fill="#fff" stroke="#555"/><text x="220" y="28">Urgent?</text><line x1="190" y1="38" x2="90" y2="80" stroke="#555"/><line x1="250" y1="38" x2="350" y2="80" stroke="#555"/><text x="125" y="58">Yes</text><text x="318" y="58">No</text><rect x="30" y="80" width="120" height="30" fill="#fff" stroke="#555"/><text x="90" y="100">Weight &lt; 5 kg?</text><rect x="300" y="80" width="100" height="30" fill="#fff" stroke="#555"/><text x="350" y="100">Standard</text><line x1="70" y1="110" x2="40" y2="160" stroke="#555"/><line x1="110" y1="110" x2="150" y2="160" stroke="#555"/><text x="42" y="138">Yes</text><text x="145" y="138">No</text><rect x="5" y="160" width="80" height="30" fill="#fff" stroke="#555"/><text x="45" y="180">Express</text><rect x="105" y="160" width="100" height="30" fill="#fff" stroke="#555"/><text x="155" y="180">Courier</text></g></svg>'),[
 ms('Which of the following statements are TRUE about this decision tree?<br>(More than one may be selected.)',['A parcel that is not urgent is always sent standard.','An urgent 3 kg parcel is sent by courier.','An urgent 8 kg parcel is sent by courier.','Weight is checked for every parcel.'],[0,2],2,'Non-urgent parcels go straight to Standard, and weight is only checked for urgent parcels. An urgent parcel under 5 kg goes Express, otherwise Courier.')],{two:true}));

qs.push(Q(SSA,'A school was hit by a phishing attack that exposed staff passwords. It asked a consultant, SecureNest, to propose improvements.<p><b>SecureNest\'s proposal</b></p>'+
 slides([slide('Multi-factor authentication','<p>Staff confirm each sign-in with an app on their phone.</p><p>Applies to email, the student records system and payroll.</p>','<div style="font-size:52px" aria-hidden="true">🔐</div>'),
  slide('Staff training','<p>A short phishing course every term.</p><p>Simulated phishing emails with feedback.</p>','<div style="font-size:52px" aria-hidden="true">🎓</div>'),
  slide('Least privilege','<p>Accounts only get the access a role needs.</p><p>Access is reviewed when staff change roles.</p>','<div style="font-size:52px" aria-hidden="true">🗝️</div>')]),[
 tx('Assess SecureNest\'s proposal for improving the school\'s security.',5,150,'Multi-factor authentication directly limits the damage of stolen passwords, because a password alone no longer gives access. Training targets the human cause of the breach and simulated emails measure whether it works, but it must be repeated and some staff may still be caught. Least privilege reduces what an attacker can reach through any one account, though reviews add administrative work. Together the measures address prevention, detection and impact; the proposal could be stronger with monitoring and an incident response plan.',['5 marks: assesses each measure against the breach, with strengths and limitations, and reaches a judgement.','3–4 marks: explains how most measures improve security.','1–2 marks: identifies some measures or benefits.'])],{two:true}));

qs.push(Q(PW,'A café wants its menu heading to look like Image 1.'+webview('Image 1',`<h1>Daily specials</h1><p>Soup of the day: pumpkin</p>`,`h1 { color: #0a5c36; text-align: center; font-family: Georgia, serif; }
p { color: #555; }`,{height:140}),[
 wb('Complete style.css so that the page looks like Image 1: a centred, dark green heading in a serif font and grey paragraph text.',3,[['index.html',`<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Café</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <h1>Daily specials</h1>
    <p>Soup of the day: pumpkin</p>
  </body>
</html>`,false],['style.css','/* Write your CSS here */\n']],{'style.css':`h1 {
  color: #0a5c36;
  text-align: center;
  font-family: Georgia, serif;
}

p {
  color: #555;
}`},['1 mark: an h1 rule that centres the heading and sets a dark green colour.','1 mark: sets a serif font for the heading.','1 mark: a p rule that sets grey text, with valid CSS syntax throughout.'],{height:180})],{two:true}));

BANKS.push({id:'formats',name:'Question formats',sub:'Demo of every question format',hidden:true,qs:qs});
})();
