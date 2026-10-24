(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var DB21={Customers:{c:['CustomerID','Name','Suburb'],r:[['C1','Ava Chen','Newtown'],['C2','Ben Ortiz','Glebe'],['C3','Cara Singh','Newtown'],['C4','Dev Patel','Ashfield']]},
 Hires:{c:['HireID','CustomerID','Item','Days','Fee','Status'],r:[['H1','C1','Ladder',2,40,'Returned'],['H2','C1','Drill',1,25,'Returned'],['H3','C2','Mower',3,90,'Returned'],['H4','C2','Ladder',1,20,'Active'],['H5','C3','Drill',2,50,'Returned'],['H6','C3','Mower',1,30,'Returned'],['H7','C4','Ladder',4,80,'Active'],['H8','C1','Mower',2,60,'Active']]}};
var qs=[];
qs.push(Q(SEP,'A government agency is building a large records system. A committee approves the requirements and the budget at the start and they cannot change. The development team will still build and release the system in short iterations and ask users for feedback after each one.',[
 mc('Which software development approach does this describe?',['Waterfall','Agile','WAgile','Pilot'],2,'WAgile is a hybrid. It keeps the fixed, planned structure of Waterfall and uses Agile iterations for the development work.')]));
qs.push(Q(SEP,'',[
 dd('Complete the statement by selecting the correct term from each dropdown menu.','In a {0} implementation, the new system is first used by one branch or group of users. In a {1} implementation, the new system is introduced one part at a time.',[[['Direct','Parallel','Pilot','Phased'],2],[['Direct','Parallel','Pilot','Phased'],3]],1,'Pilot tests the whole system with a small group. Phased replaces the old system in stages.')]));
qs.push(Q(SA,'',[
 mc('Which statement correctly describes the relationship between artificial intelligence (AI) and machine learning (ML)?',['ML is a branch of AI in which systems improve by learning from data','AI is a branch of ML that only works with images','ML and AI mean exactly the same thing','AI systems cannot use ML'],0,'AI is the broad idea of machines doing tasks that need intelligence. ML is one way of achieving it.')]));
qs.push(Q(SEP,'An 8-bit two\'s complement system is used to store whole numbers.',[
 mc('Which of the following is the representation of -5?',['11111011','10000101','11111010','00000101'],0,'5 is 00000101. Invert the bits to get 11111010, then add 1 to get 11111011.')]));
qs.push(Q(PW,'An online shop provides an application programming interface (API) that follows REST conventions. A staff app needs to remove an item from the catalogue.',[
 mc('Which HTTP method should the staff app use to remove the item?',['GET','POST','PUT','DELETE'],3,'DELETE asks the server to remove the resource named in the address.')]));
qs.push(Q(PW,'',[
 mc('Which email protocol lets a user read messages from several devices by keeping the messages on the mail server?',['SMTP','POP3','IMAP','FTP'],2,'IMAP leaves messages on the server and synchronises them. POP3 usually downloads and removes them. SMTP sends mail.')]));
qs.push(Q(PW,'Consider the following cascading style sheet (CSS) rule.'+code(`.card {
  margin: 10px;
  padding: 20px;
  border: 2px solid black;
}`),[
 mc('Which part of the rule sets the space between the text inside a card and the card\'s border?',['margin','padding','border','display'],1,'Padding is the space inside the border around the content. Margin is the space outside the border.')]));
qs.push(Q(SSA,'A website puts the session identifier in the web address, for example <b>/account?session=8F3A21</b>. A user copies the address and pastes it into a group chat.',[
 mc('Which vulnerability does this design create?',['Broken authentication and session management','Buffer overflow','SQL injection','Side-channel attack'],0,'Anyone who sees the address can use the session identifier to act as the user.')]));
qs.push(Q(SEP,'Testing can be done with or without knowledge of the code.',[
 mt('Match each description to a type of testing.',['Description','Black box testing','White box testing','Grey box testing'],[['Tests inputs and outputs with no knowledge of the internal code',0],['Uses the code structure to design tests that run every path',1],['Uses partial knowledge of the internal design while testing from the user\'s side',2],['A tester checks that both branches of an IF statement are run',1]],1,'')]));
qs.push(Q(SSA,'',[
 ms('Which of the following are benefits of collaboration when developing secure software?',['Different team members bring different points of view on possible threats','Tasks can be given to people with the right expertise','The quality of the solution improves because work is checked by others','Security testing is no longer needed','Every developer needs access to all of the code'],[0,1,2],1,'Collaboration brings more viewpoints, matches tasks to expertise and improves quality through checking.')]));
qs.push(Q(SEP,'A robotic arm picks up parcels in a warehouse.',[
 ms('Which of the following parts of the system are actuators or end effectors?',['Hydraulic cylinder','Robotic gripper','Light level sensor','Motion sensor','Servo motor'],[0,1,4],1,'Actuators and end effectors cause movement or act on objects. Sensors gather data.')]));
qs.push(Q(SEP,'',[
 ms('Which of the following are features of the debugging tools in an integrated development environment (IDE)?<br>Select all that apply.',['Pausing the program at a chosen line (a breakpoint)','Running the program one line at a time (single line stepping)','Showing the current value of a chosen variable as the program runs (a watch)','Automatically rewriting the code to remove logic errors','Converting the program into a different programming language'],[0,1,2],2,'Breakpoints, stepping and watches are standard IDE debugging features. An IDE does not rewrite logic or change the language.')]));
qs.push(Q(SEP,'Number systems are used in computing.',[
 gd('For each conversion, select the correct result.',['Conversion','Result'],[
  ['Decimal 13 written in binary',[['1011','1101','1110','1001'],1]],
  ['Binary 11111111 written in hexadecimal',[['EE','F0','FF','8F'],2]],
  ['Hexadecimal 2C written in decimal',[['34','44','52','28'],1]],
  ['Binary 10010 written in decimal',[['16','18','20','34'],1]]],2,'')]));
qs.push(Q(SEP,'Consider the following pseudocode, which uses a stack.'+code(`Create empty stack S
Push 4 onto S
Push 7 onto S
Pop from S into x
Push x + 1 onto S
Push 2 onto S
Pop from S into y
Pop from S into z
Display y + z`),[
 dd('Select the correct item from the dropdown menu to show the value displayed.','The value displayed is {0}.',[[['6','9','10','15'],2]],1,'After the pops, x = 7 and the stack holds 4, 8, 2. Then y = 2 and z = 8, so 2 + 8 = 10.')]));
qs.push(Q(SEP,'A vet clinic is developing an app to book appointments. Part of the data dictionary for the app is shown.',[
 P('(a)',gd('Select the correct entries to complete the data dictionary. (3 marks)',['Variable','Example value','Data type','Validation check'],[
  ['petName','Milo',[['String','Integer','Real','Boolean','Date'],0],[['Range check','Presence check','Type check','Format check'],1]],
  ['weightKg','4.8',[['String','Integer','Real','Boolean','Date'],2],[['Range check','Presence check','Type check','Format check'],0]],
  ['appointmentDate','2026-11-03',[['String','Integer','Real','Boolean','Date'],4],[['Range check','Presence check','Type check','Format check'],3]]],3,'')),
 P('(b)',tx('Outline TWO features of object-oriented programming (OOP) that support collaborative code development. (3 marks)',3,55,'Consistency is supported because classes give every team member the same structure for similar objects, so code written by different people looks alike. Encapsulation hides the inside of a class behind methods, so one developer can change a class without breaking code that another developer wrote. Version control and code comments also let the team share and understand each other\'s work.',['Award up to 2 marks for two features identified and 1 mark for explanation of how they support collaboration.','Features include: consistency, code commenting, version control, feedback, encapsulation, abstraction, reusable classes.']))],{two:true}));
qs.push(Q(PW,'A bookshop is developing a web application. Customers browse books, add them to a cart and pay online. A front-end shows the pages and a back-end stores the orders in a database.',[
 P('(a)',tx('Compare the use of object-relational mapping (ORM) with writing SQL statements directly for the back-end database. (3 marks)',3,60,'With an ORM, developers work with database rows as objects in their programming language, so they write less SQL and the code is easier to read and to move to a different database. Writing SQL directly gives full control over each query, which can make complex or large queries faster, but it takes more code and the developer must write it carefully. ORM is quicker to develop with; SQL is more flexible and often more efficient.',['3 marks: describes both approaches and compares them using at least one similarity or difference.','2 marks: describes both with limited comparison, or compares with limited detail.','1 mark: describes one approach.'])),
 P('(b)',tx('Explain how a web browser\'s developer (dev) tools can help a developer find and fix a problem in the shop\'s pages. (3 marks)',3,60,'The dev tools show the HTML and CSS of the page, so a developer can inspect an element and see which CSS rule is changing its layout, then edit the rule and see the result at once. The console shows JavaScript errors with the line they came from. The network tab shows each request and response, so the developer can see which file failed to load or how slowly it loaded.',['3 marks: explains at least two dev tool features and how each helps find or fix a problem.','2 marks: explains one feature well or two with limited detail.','1 mark: identifies a dev tool feature.'])),
 P('(c)',tx('Explain how the World Wide Web Consortium (W3C) and its Web Accessibility Initiative (WAI) influence the development of the shop. (3 marks)',3,60,'The W3C sets the standards for HTML and CSS, so the shop\'s pages work in different browsers. The WAI publishes guidelines such as providing text alternatives for images and enough colour contrast. Developers who follow them make the shop usable by customers with a disability, which widens the shop\'s customer base.',['3 marks: explains the role of W3C standards and WAI guidelines and links them to the shop.','2 marks: explains one with a link to the shop.','1 mark: identifies the W3C or the WAI.']))],{two:true}));
qs.push(Q(SEP,'A teacher stores the marks for 30 students in the array <b>Marks</b>.',[
 ps('Using pseudocode, write an algorithm that calculates the average mark and then displays how many students scored below the average.',3,`BEGIN BelowAverage
    Set total = 0
    FOR index = 1 TO 30
        Set total = total + Marks[index]
    NEXT index
    Set average = total / 30
    Set below = 0
    FOR index = 1 TO 30
        IF Marks[index] < average THEN
            Set below = below + 1
        ENDIF
    NEXT index
    Display below
END BelowAverage`,['1 mark: adds all 30 marks and calculates the average.','1 mark: loops through the array again and compares each mark with the average.','1 mark: counts the marks below the average and displays the count.'])],{two:true}));
qs.push(Q(SEP,'',[
 tx('Describe the difference between top-down design and bottom-up design.',3,55,'In top-down design the programmer starts with the whole problem and breaks it into smaller and smaller tasks until each one is simple enough to code. In bottom-up design the programmer first builds and tests small, reusable parts such as functions, and then combines them to form the larger system.',['3 marks: describes both approaches and states a clear difference.','2 marks: describes one approach well and identifies the other.','1 mark: identifies one approach.'])]));
qs.push(Q(SEP,'A program reads a whole number that is zero or greater and displays it in binary. The program must not use built-in conversion functions. For the number 13 the output is:<br><b>1101</b>',[
 py('Write a Python program that reads the number and displays its binary representation.',3,'',`n = int(input("Enter a whole number: "))
if n == 0:
    print("0")
else:
    bits = ""
    while n > 0:
        bits = str(n % 2) + bits
        n = n // 2
    print(bits)`,[{i:['13'],o:'1101'},{i:['0'],o:'0'},{i:['8'],o:'1000'},{i:['255'],o:'11111111'}],['1 mark: reads the number and handles 0.','1 mark: repeatedly divides by 2 and uses the remainder as the next binary digit.','1 mark: builds the digits in the correct order and displays them.'])],{two:true}));
qs.push(Q(PW,'',[
 tx('Describe how data packets are used to send a file across the internet.',3,55,'The file is split into small data packets. Each packet is labelled with the IP addresses of the sender and the receiver and a sequence number. The packets can travel by different routes through routers and may arrive in a different order. At the destination, TCP uses the sequence numbers to put the packets back in order and asks for any missing packet to be sent again.',['3 marks: describes splitting into packets, labelling with addresses or sequence, and reassembly at the destination.','2 marks: describes the process with limited detail.','1 mark: states that data is sent in packets.'])]));
qs.push(Q(PW,'An equipment hire company keeps its customers and hires in two related tables.',[
 sq('Construct a SQL query that displays the Name of each customer and the total Fee of the hires that have a Status of \'Returned\'.<br>Use the column headings Name and TotalFee. List the results from the highest to the lowest total.',4,`SELECT Name, SUM(Fee) AS TotalFee
FROM Customers
JOIN Hires ON Customers.CustomerID = Hires.CustomerID
WHERE Status = 'Returned'
GROUP BY Name
ORDER BY TotalFee DESC`,true,['1 mark: joins Customers and Hires on CustomerID.','1 mark: filters for Status = \'Returned\'.','1 mark: uses SUM with GROUP BY Name.','1 mark: correct headings and ordering from highest to lowest.'])],{two:true,db:DB21}));
qs.push(Q(SEP,'A school canteen program processes an order. The main module <b>Process order</b> calls three modules: <b>Get order</b>, <b>Calculate total</b> and <b>Print receipt</b>. The module <b>Calculate total</b> calls two modules: <b>Add items</b> and <b>Apply discount</b>.',[
 dr('Create a structure chart for the canteen program.',3,'Process order at the top as the root box. Three boxes below it joined by lines: Get order, Calculate total, Print receipt. Two boxes below Calculate total joined to it: Add items and Apply discount. Boxes are arranged in levels with lines showing which module calls which.',['1 mark: Process order at the top with Get order, Calculate total and Print receipt below it.','1 mark: Add items and Apply discount shown below Calculate total.','1 mark: lines join each module to its parent, and every module is labelled.'])],{two:true}));
qs.push(Q(SA,'A bank uses machine learning to detect fraud on card transactions. Each transaction is checked in under a second. Transactions that look unusual are paused for a check by staff.',[
 P('(a)',tx('Explain how logistic regression could be used to decide whether a transaction is fraud or not fraud. (3 marks)',3,60,'Logistic regression is trained on past transactions that are labelled fraud or not fraud. It combines input values such as the amount, the location and the time into a probability between 0 and 1. If the probability is above a chosen threshold, such as 0.5, the transaction is classified as fraud and paused. Because it gives a yes or no type of result, it suits a two-class decision.',['3 marks: explains inputs, probability output and a threshold used to classify.','2 marks: explains the classification with limited detail.','1 mark: identifies that logistic regression predicts a category.'])),
 P('(b)',tx('Explain how business process automation (BPA) could be used with the model to handle transactions that are paused. (3 marks)',3,60,'When the model pauses a transaction, BPA software can automatically send the customer a text message asking them to confirm it. If the customer confirms, the workflow releases the payment. If there is no reply, the workflow passes the case to a staff member. This removes manual steps and speeds up the process while staff deal only with the unclear cases.',['3 marks: describes an automated workflow from the pause to the outcome and links it to saving time or staff effort.','2 marks: describes some automated steps with limited links.','1 mark: identifies that BPA automates a business process.'])),
 P('(c)',mt('Match each example to the key application area of machine learning that it shows. (3 marks)',['Example','Data analysis and forecasting','Virtual personal assistant','Image recognition'],[['Predicting how many transactions the bank will process next December',0],['A phone app that answers spoken questions about account balances',1],['Reading the amount on a photographed cheque',2]],3,''))],{two:true}));
qs.push(Q(SA,'A distribution company replaces most of its warehouse pickers with robots guided by machine learning. The robots work all day and the number of injuries falls. The number of warehouse staff falls from 120 to 30. The remaining staff supervise the robots and fix faults.',[
 tx('Discuss the impact of this automation on individuals, society and the environment.',5,110,'The robots remove people from heavy lifting, so the risk of injury to workers falls. However, 90 workers lose their jobs. Some may find work supervising robots, but that needs new technical skills, and workers without them may struggle to find similar work. The company profits from lower labour costs, and if that wealth is not shared it can increase inequality in the community. For the environment, robots can pick orders more accurately, which reduces wasted stock and returns, but making and powering the robots uses materials and electricity.',['5 marks: a sustained discussion of impacts on individuals, society and the environment, using the scenario.','3-4 marks: several impacts with some links to the scenario.','1-2 marks: identifies impacts with limited explanation.','Ideas include: worker safety, job loss, new skills, distribution of wealth, efficiency, waste, energy and materials.'])]));
qs.push(Q(SA,'A hospital has 500 X-ray images labelled by radiologists as fracture or no fracture. It also has 50 000 images that are not labelled. The hospital trains a model to recognise fractures using semi-supervised learning.',[
 tx('Explain how semi-supervised learning is used in this situation. Include ONE benefit and ONE limitation.',5,110,'The model is first trained on the 500 labelled images so it learns what a fracture looks like. It then makes predictions for the 50 000 unlabelled images. Predictions that the model is very sure about are treated as labels, and the model is trained again on the larger set. A benefit is that the hospital does not need radiologists to label every image, which saves expensive expert time. A limitation is that wrong predictions can be fed back as if they were correct labels, so the model may reinforce its own errors, and a small labelled set that is not representative would affect all the results.',['5 marks: explains training on labelled data and use of unlabelled data with one benefit and one limitation linked to the scenario.','3-4 marks: explains the process with some detail and a benefit and limitation with limited links.','1-2 marks: identifies semi-supervised learning or one point only.'])]));
qs.push(Q(SEP,'A program reads a line of text and compresses it using run-length encoding. Each group of the same character that appears in a row is replaced by the character and the number of times it repeats. For the text <b>aaabcc</b> the output is:<br><b>a3b1c2</b>',[
 py('Using Python, write a program that reads the text and displays the compressed version.',5,'',`text = input("Enter text: ")
result = ""
count = 1
for i in range(1, len(text)):
    if text[i] == text[i - 1]:
        count += 1
    else:
        result += text[i - 1] + str(count)
        count = 1
result += text[-1] + str(count)
print(result)`,[{i:['aaabcc'],o:'a3b1c2'},{i:['zzzz'],o:'z4'},{i:['abc'],o:'a1b1c1'},{i:['aabbaa'],o:'a2b2a2'}],['1 mark: reads the text and loops through its characters.','1 mark: compares each character with the one before it.','1 mark: counts repeated characters correctly.','1 mark: adds each character and count to the result when the group ends.','1 mark: includes the final group and displays the result.'])],{two:true}));
qs.push(Q(SEP,'A company develops a mechatronic prosthetic arm. Sensors in the sleeve detect muscle signals. A microcontroller drives actuators in the hand and a gripper end effector. A phone app lets the user adjust the grip strength. The arm also sends diagnostic data to the company.',[
 tx('Evaluate the design of the prosthetic arm. In your answer, refer to benefits for the user, requirements for people with disability, and safety and privacy.',6,185,'The arm can restore everyday tasks such as holding a cup, and the app lets the user adjust grip strength to suit different objects, which supports independence. The design must be built around the needs of the user. The sleeve must be comfortable for long wear, the controls must respond to signals the user can produce reliably, and the arm needs enough battery life for a full day. Feedback such as vibration can tell the user how hard the gripper is squeezing.<br>Safety matters because a gripper that closes too hard could hurt the user or others, so the software needs force limits and a safe stop. The diagnostic data helps the company find faults early, but it is health related and personal. The company needs clear consent, encryption and limits on who can see it.<br>Overall the arm offers large benefits if it is comfortable, safe and reliable, and the company protects the user\'s data. A design that ignores these needs would reduce the benefit.',['6 marks: a balanced evaluation covering user benefits, requirements for people with disability, and safety and privacy, with scenario links and a justified judgement.','4-5 marks: explains most areas with scenario links and limited judgement.','2-3 marks: describes some points with limited links.','1 mark: identifies a point only.'])]));
BANKS.push({id:'4',name:'Bank 4',sub:'Foundations, mechatronics and web',qs:qs});
})();
