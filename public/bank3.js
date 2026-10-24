(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var DB21={Sensors:{c:['SensorID','Location','Type'],r:[['S1','Greenhouse','Temperature'],['S2','Greenhouse','Humidity'],['S3','Orchard','Temperature'],['S4','Orchard','Humidity'],['S5','Paddock','Temperature'],['S6','Paddock','Temperature']]},
 Readings:{c:['ReadingID','SensorID','Day','Value'],r:[['R1','S1','Mon',24],['R2','S1','Tue',28],['R3','S2','Mon',60],['R4','S3','Mon',19],['R5','S3','Tue',21],['R6','S3','Wed',23],['R7','S4','Mon',70],['R8','S5','Mon',15],['R9','S6','Tue',17],['R10','S5','Wed',18],['R11','S1','Wed',26],['R12','S6','Wed',22]]}};
var qs=[];
qs.push(Q(SEP,'A company updates its payroll software so that it works on a new version of the operating system. No new features are added and no faults are fixed.',[
 mc('Which type of maintenance is this?',['Corrective','Adaptive','Perfective','Preventive'],1,'Adaptive maintenance changes software so it keeps working in a changed environment, such as a new operating system.')]));
qs.push(Q(SEP,'',[
 dd('Complete the statement by selecting the correct term from each dropdown menu.','A(n) {0} translates and runs a program one statement at a time, while a(n) {1} translates the whole program into machine code before it runs.',[[['Compiler','Interpreter','Assembler','Debugger'],1],[['Compiler','Interpreter','Assembler','Debugger'],0]],1,'An interpreter translates as the program runs. A compiler translates everything first.')]));
qs.push(Q(SA,'A decision tree model correctly classifies 99% of the data it was trained on. When it is tested on new data, only 62% of its predictions are correct.',[
 mc('What is the most likely cause of the difference?',['Underfitting','Overfitting','Too few classes','Too much test data'],1,'A large gap between training accuracy and accuracy on new data is the sign of overfitting.')]));
qs.push(Q(SEP,'Consider the following Python code.'+code(`word = "software"
print(word[2:5])`),[
 mc('What is displayed when this code is run?',['oft','ftw','twa','ftwa'],1,'Slicing starts at index 2 (f) and stops before index 5, so it takes the characters at positions 2, 3 and 4: f, t, w.')]));
qs.push(Q(SSA,'',[
 mc('Which testing approach examines a running application by sending unexpected input from outside, without access to the source code?',['Static application security testing (SAST)','Dynamic application security testing (DAST)','Code review','Unit testing'],1,'DAST tests the running application from the outside. SAST analyses source code.')]));
qs.push(Q(SSA,'',[
 mc('What is the main purpose of a digital certificate used with HTTPS?',['To link a public key to the identity of the website, confirmed by a certificate authority','To encrypt the website\'s database','To store the user\'s password','To speed up DNS lookups'],0,'The certificate lets the browser check that the public key belongs to the site it expects.')]));
qs.push(Q(PW,'A web developer has written the following login form.'+code(`<form action="/login" method="get">
  <input type="text" name="user">
  <input type="password" name="pass">
  <button type="submit">Log in</button>
</form>`),[
 mc('What is the main security problem with this form?',['The login details will appear in the web address, browser history and server logs','The form cannot send a username','The password will be sent as a cookie','The form will be blocked by the Domain Name System'],0,'The GET method puts form values in the URL. A login form should use POST over HTTPS.')]));
qs.push(Q(SSA,'',[
 mc('Which of the following is an example of a side-channel attack?',['Measuring how long a login check takes to work out how many characters of a password are correct','Typing SQL commands into a text box','Sending a link that triggers an unwanted bank transfer','Sending more data than a program has reserved space for'],0,'A side-channel attack uses information that leaks from how a system runs, such as timing, rather than a flaw in the logic.')]));
qs.push(Q(SA,'Machine learning models can be trained in different ways.',[
 mt('Match each description to a type of machine learning.',['Description','Supervised learning','Unsupervised learning','Reinforcement learning'],[['Learns from examples that already have the correct answer attached',0],['Looks for structure in data that has no labels',1],['Learns by trial and error using rewards and penalties',2],['A spam filter trained on emails marked "spam" or "not spam"',0]],1,'')]));
qs.push(Q(SSA,'',[
 ms('Which of the following are principles of privacy by design?',['Privacy is the default setting','Collect as much data as possible in case it is useful later','Privacy is built in from the start of development','Privacy is added after launch if users complain','Data is protected throughout its whole life cycle'],[0,2,4],1,'Privacy by design is proactive, built in and covers the full data life cycle.')]));
qs.push(Q(PW,'',[
 ms('Which of the following improve the accessibility of a website for users with a vision impairment?',['Text alternatives for images','Sufficient colour contrast between text and background','Showing errors using colour alone','Text that can be enlarged without losing content','Audio that plays automatically'],[0,1,3],1,'Text alternatives, contrast and resizable text help users with a vision impairment. Colour alone and auto-playing audio create barriers.')]));
qs.push(Q(SA,'',[
 ms('Which of the following can introduce bias into a machine learning model?<br>Select all that apply.',['Training data that under-represents some groups','Labels assigned by people with unconscious prejudice','Using a larger test set','Features that act as a stand-in for a protected characteristic','Scaling numeric inputs to the same range','Using past human decisions as the correct answers'],[0,1,3,5],2,'Biased data, biased labels, proxy features and biased historical decisions all pass bias into a model.')]));
qs.push(Q(PW,'Protocols are used to transfer data over networks.',[
 gd('For each purpose, select the protocol that is used.',['Purpose','Protocol'],[
  ['Transferring web pages without encryption',[['HTTP','HTTPS','SMTP','FTP','DNS'],0]],
  ['Sending an email from one mail server to another',[['HTTP','HTTPS','SMTP','FTP','DNS'],2]],
  ['Uploading and downloading files between a client and a server',[['HTTP','HTTPS','SMTP','FTP','DNS'],3]],
  ['Converting a domain name into an IP address',[['HTTP','HTTPS','SMTP','FTP','DNS'],4]]],2,'')]));
qs.push(Q(SEP,'Consider the following pseudocode.'+code(`Set count = 0
FOR a = 1 TO 3
    FOR b = a TO 3
        Set count = count + 1
    NEXT b
NEXT a
Display count`),[
 dd('Select the correct item from the dropdown menu to show the value displayed.','The value displayed is {0}.',[[['3','5','6','9'],2]],1,'When a is 1, b runs 1, 2, 3 (3 times). When a is 2, b runs 2, 3 (2 times). When a is 3, b runs once. 3 + 2 + 1 = 6.')]));
qs.push(Q(SEP,'A farm is developing an app that stores readings from soil sensors. Part of the data dictionary for the app is shown.',[
 P('(a)',gd('Select the correct entries to complete the data dictionary. (3 marks)',['Variable','Example value','Data type','Validation check'],[
  ['sensorId','S0042',[['String','Integer','Real','Boolean','Date'],0],[['Range check','Presence check','Type check','Format check'],3]],
  ['temperature','21.5',[['String','Integer','Real','Boolean','Date'],2],[['Range check','Presence check','Type check','Format check'],0]],
  ['siteName','North Paddock',[['String','Integer','Real','Boolean','Date'],0],[['Range check','Presence check','Type check','Format check'],1]]],3,'')),
 P('(b)',tx('Outline TWO ways that user feedback can be collected when evaluating a software solution. (3 marks)',3,55,'A survey can be sent to users after they have used the software, asking them to rate features and describe problems. Observing users as they complete set tasks, or holding interviews, shows where they hesitate or make mistakes and lets the developers ask follow-up questions.',['Award up to 2 marks for two ways identified and 1 mark for explanation of how the feedback is collected or used.','Ways include: surveys or questionnaires, interviews, focus groups, observation, usability testing, beta testing, support tickets, reviews.']))],{two:true}));
qs.push(Q(PW,'A clinic is developing a telehealth web application. Patients use it to book video appointments and to send photos of symptoms to their doctor. Patients use phones, tablets and computers.',[
 P('(a)',tx('Explain how a front-end framework can support the development of the application. (3 marks)',3,60,'A front-end framework provides reusable components, such as a booking form or a calendar, so developers do not rewrite the same code for each page. It manages how the page updates when data changes, which makes the interface faster to build and easier to maintain. A large community also provides tested libraries and documentation.',['3 marks: explains reusable components, state or page updates, and the effect on development speed or maintenance.','2 marks: explains one feature with limited link to development.','1 mark: identifies a framework feature.'])),
 P('(b)',tx('Describe how responsive design makes the application usable on phones, tablets and computers. (3 marks)',3,55,'Responsive design uses flexible layouts and CSS media queries so the page adjusts to the width of the screen. On a phone the menu may collapse and content may appear in one column, while on a computer it may appear in several columns. Images and text scale so users do not need to zoom or scroll sideways.',['3 marks: describes flexible layouts or media queries and how the layout changes for different devices.','2 marks: describes the idea with limited detail.','1 mark: states that the layout changes.'])),
 P('(c)',tx('Explain how authentication tokens and rate limiting help to secure the application\'s API. (3 marks)',3,60,'An authentication token is issued after login and must be sent with each API request, so the API only answers requests from users who have been verified. Rate limiting restricts how many requests one user or address can make in a period of time. This slows down attackers who try to guess tokens or passwords and protects the service from being overloaded.',['3 marks: explains both and links them to protecting the API.','2 marks: explains one well and identifies the other.','1 mark: identifies one.']))],{two:true}));
qs.push(Q(SEP,'A store keeps the names of 20 items in the array <b>Items</b>. The user enters the name of an item to search for.',[
 ps('Using pseudocode, with a FOR loop, write an algorithm that displays the position of the first item in the array that matches the name entered, or displays "Not found" if there is no match.',3,`BEGIN FindItem
    Get target
    Set found = FALSE
    FOR index = 1 TO 20
        IF Items[index] = target AND found = FALSE THEN
            Display "Found at position ", index
            Set found = TRUE
        ENDIF
    NEXT index
    IF found = FALSE THEN
        Display "Not found"
    ENDIF
END FindItem`,['1 mark: reads the target and uses a FOR loop to search up to 20 positions; stopping after the first match is accepted.','1 mark: compares each item with the target and displays only the first match.','1 mark: displays "Not found" only when no match was found.'])],{two:true}));
qs.push(Q(SSA,'',[
 tx('Describe a buffer overflow and ONE way to prevent it.',3,55,'A buffer overflow happens when a program writes more data into a block of memory than it was set up to hold, so the extra data overwrites nearby memory. An attacker can use this to crash the program or run their own code. It can be prevented by checking the length of input before copying it, or by using languages and functions that check memory limits.',['3 marks: describes how excess data overwrites memory, the possible effect, and one prevention method.','2 marks: describes the overflow with limited effect or prevention.','1 mark: identifies a buffer overflow.'])]));
qs.push(Q(SEP,'A program reads whole numbers entered by the user until the user enters 0. The 0 is not part of the data. At least one number is entered before the 0. For the numbers 3, 9, 4 and 0 the output is:<br><b>Sum: 16<br>Largest: 9</b>',[
 py('Write a Python program that reads the numbers and then displays the sum of the numbers and the largest number in the format shown.',3,'',`total = 0
largest = None
n = int(input("Enter a number: "))
while n != 0:
    total += n
    if largest is None or n > largest:
        largest = n
    n = int(input("Enter a number: "))
print("Sum:", total)
print("Largest:", largest)`,[{i:['3','9','4','0'],o:'Sum: 16\nLargest: 9'},{i:['5','0'],o:'Sum: 5\nLargest: 5'},{i:['-2','-8','0'],o:'Sum: -10\nLargest: -2'},{i:['10','20','30','0'],o:'Sum: 60\nLargest: 30'}],['1 mark: loop that stops when 0 is entered and does not include 0 in the results.','1 mark: correct sum.','1 mark: correct largest value, including when all numbers are negative, and correct output format.'])],{two:true}));
qs.push(Q(PW,'',[
 tx('Describe how the Domain Name System (DNS) is used when a user enters a web address into a browser.',3,55,'The browser asks a DNS server to find the IP address that matches the domain name. If the first server does not hold the answer, it queries other DNS servers until the address is found, then returns it and may store it in a cache. The browser uses the IP address to contact the web server.',['3 marks: describes the request for an IP address, the lookup through DNS servers and the use of the address by the browser.','2 marks: describes the lookup with limited detail.','1 mark: states that DNS converts names to addresses.'])]));
qs.push(Q(PW,'A farm records readings from sensors in a database with two related tables, Sensors and Readings.',[
 sq('Construct a SQL query that displays the Location of each sensor site and the average Value of its Temperature sensors, using only readings that were not taken on Monday.<br>Use the column headings Location and AvgTemp. List the results from the highest to the lowest average.',4,`SELECT Location, AVG(Value) AS AvgTemp
FROM Readings
JOIN Sensors ON Readings.SensorID = Sensors.SensorID
WHERE Type = 'Temperature' AND Day <> 'Mon'
GROUP BY Location
ORDER BY AvgTemp DESC`,true,['1 mark: joins Readings and Sensors on SensorID.','1 mark: filters for Temperature sensors and readings not taken on Monday.','1 mark: uses AVG with GROUP BY Location.','1 mark: correct headings and ordering from highest to lowest.'])],{two:true,db:DB21}));
qs.push(Q(SEP,'A school uses an online portal for assignments. Students log in and submit an assignment file. Teachers download the submitted files, then upload marks and feedback. The portal stores the submissions and the marks. Students receive an email when their feedback is available.',[
 dr('Create a Level 0 data flow diagram for the assignment portal.',3,'One process labelled Assignment portal in the centre. Two external entities, Student and Teacher. Labelled data flows: Student to portal (login details, assignment file); portal to Student (email notification, feedback); Teacher to portal (marks and feedback); portal to Teacher (submitted files). Data stores for Submissions and Marks may be shown but are optional at Level 0.',['1 mark: a single central process and the two external entities.','1 mark: data flows drawn with arrows in the correct directions between the entities and the process.','1 mark: all data flows labelled with the data that moves.'],'dfd')],{two:true}));
qs.push(Q(SA,'FarmSense places soil sensors in paddocks. The sensors send moisture and temperature readings to a cloud service every ten minutes. A machine learning model predicts when each paddock needs watering, and a mobile app shows the predictions to farmers. The development team plans to release updates to the app and the model every two weeks.',[
 P('(a)',tx('Explain how DevOps practices such as continuous integration and continuous delivery could be applied when releasing updates to FarmSense. (3 marks)',3,60,'With continuous integration, developers merge code into a shared repository often and automated tests run on every change, so errors in the app or the model code are found quickly. Continuous delivery then packages tested changes automatically so they can be released every two weeks with little manual work and a lower risk of release errors.',['3 marks: explains CI and CD, includes automated testing and links them to frequent releases.','2 marks: explains one practice well or both with limited detail.','1 mark: identifies a DevOps practice.'])),
 P('(b)',tx('Describe how data from the sensors would be used to train a supervised learning model to predict when a paddock needs watering. (3 marks)',3,60,'Past sensor readings are collected and each is labelled by people as needing water or not needing water. Most of the data is used to train the model, which learns the link between the readings and the labels. The rest is kept back as test data to check how accurately the model predicts labels for readings it has not seen.',['3 marks: describes labelled data, training and testing on separate data.','2 marks: describes training with labels but limited testing.','1 mark: identifies that past data is used.'])),
 P('(c)',gd('Select the machine learning algorithm that is most suitable for each task. (3 marks)',['Task','Algorithm'],[
  ['Predicting tomorrow\'s soil moisture percentage from today\'s readings',[['Linear regression','Logistic regression','Neural network','K-nearest neighbours'],0]],
  ['Deciding whether a paddock needs water (yes or no) from its readings',[['Linear regression','Logistic regression','Neural network','K-nearest neighbours'],1]],
  ['Recognising weeds in photos taken by a drone',[['Linear regression','Logistic regression','Neural network','K-nearest neighbours'],2]]],3,''))],{two:true}));
qs.push(Q(SA,'A secondary school introduces cameras that use facial recognition to record student attendance as students enter the building. The system stores a face template for each student and sends absence messages to parents.',[
 tx('Discuss the social and ethical implications of using this system.',5,110,'The system saves teachers time and can alert parents quickly if a student is absent, which may improve student safety. However, face templates are sensitive biometric data. If they are leaked they cannot be changed like a password, so the school must store them securely and keep them only as long as needed. Students and parents should be able to give or refuse consent. Facial recognition can be less accurate for some skin tones, which could mark some students absent incorrectly. Constant monitoring may also make students feel watched and reduce trust in the school.',['5 marks: a sustained discussion of social and ethical implications using the scenario.','3-4 marks: several implications with some links to the scenario.','1-2 marks: identifies implications with limited explanation.','Ideas include: biometric data security, consent, accuracy and bias, surveillance, trust, efficiency and safety.'])]));
qs.push(Q(SA,'An insurance company receives thousands of claim forms each day. It introduces robotic process automation (RPA) software that reads each form, checks the details against the customer database and enters approved claims into the payment system. Forms that are unclear are passed to staff.',[
 tx('Explain how RPA supports the claims process. Include ONE benefit and ONE limitation of using RPA here.',5,110,'RPA software follows fixed rules to copy data from forms into other systems, so it performs the repetitive steps of checking and entering claims without a person doing them. A benefit is that claims are processed faster and with fewer typing errors, so customers are paid sooner. A limitation is that RPA can only follow the rules it has been given. Unusual or unclear claims must go to staff, and if the rules change or the form layout changes, the software must be updated or it will make errors.',['5 marks: explains how RPA performs rule-based tasks in the claims process, with one benefit and one limitation linked to the scenario.','3-4 marks: explains RPA with some detail and gives a benefit and limitation with limited links.','1-2 marks: identifies RPA or one point only.'])]));
qs.push(Q(SEP,'A program reads words entered by the user until the user enters the word END. When END is entered, the program displays each word that is a palindrome (it reads the same forwards and backwards, ignoring upper and lower case), one per line, followed by the number of palindromes found.<br><br>For the words <b>Level</b>, <b>code</b>, <b>Radar</b>, <b>Noon</b> and <b>END</b> the output is:<pre class="pre">Level\nRadar\nNoon\nPalindromes: 3</pre>',[
 py('Using Python, write a program that achieves this task.',5,'',`words = []
word = input("Enter word: ")
while word != "END":
    words.append(word)
    word = input("Enter word: ")
count = 0
for w in words:
    if w.lower() == w.lower()[::-1]:
        print(w)
        count += 1
print("Palindromes:", count)`,[{i:['Level','code','Radar','Noon','END'],o:'Level\nRadar\nNoon\nPalindromes: 3'},{i:['Anna','hello','END'],o:'Anna\nPalindromes: 1'},{i:['END'],o:'Palindromes: 0'}],['1 mark: reads words until END is entered, without storing END.','1 mark: stores or processes each word.','1 mark: correctly tests for a palindrome.','1 mark: ignores case but displays the word as entered.','1 mark: displays the palindromes and the count after END.'])],{two:true}));
qs.push(Q(SA,'A software company gives its developers an AI assistant that suggests code as they type. The assistant was trained on public code repositories. Developers report that they finish tasks faster. However, some suggested code contains security flaws, and some of it closely matches code that has a software licence.',[
 tx('Evaluate the use of the AI assistant. In your answer, refer to productivity, code quality and security, and legal and ethical issues.',6,185,'The assistant can speed up routine coding, such as boilerplate and common functions, and developers say they finish tasks faster. This frees time for design and testing. However, faster code is not better code if it is wrong. The assistant learned from public repositories, which include insecure code, so it can suggest flaws such as unchecked input. Developers must review suggestions, run security testing and not trust the output.<br>There are legal and ethical issues. If suggestions copy licensed code, the company could breach the licence or the intellectual property of the original authors. The company needs a policy on checking and acknowledging code origins. Junior developers might also learn less if they rely on suggestions without understanding them.<br>Overall the assistant is valuable when its code is reviewed and tested like any other code, and when the company manages licensing risk. Used without those controls, the security and legal risks could outweigh the productivity gain.',['6 marks: a balanced evaluation covering productivity, quality and security, and legal and ethical issues, with scenario links and a justified judgement.','4-5 marks: explains most areas with scenario links and limited judgement.','2-3 marks: describes some impacts with limited links.','1 mark: identifies an impact only.'])]));
BANKS.push({id:'3',name:'Bank 3',sub:'Mixed and harder paper',archived:true,qs:qs});
})();
