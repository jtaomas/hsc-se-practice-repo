(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var DB18={Artists:{c:['ArtistID','Name','Country'],r:[['A1','Harbour Lights','Australia'],['A2','Neon Fjord','Norway'],['A3','Salt & Static','Australia'],['A4','Copperline','Canada']]},
 Tracks:{c:['TrackID','Title','ArtistID','Seconds','Plays'],r:[['T01','Tidewater','A1',245,1200],['T02','Low Orbit','A2',198,860],['T03','Paper Moons','A1',176,2400],['T04','Static Bloom','A3',231,540],['T05','Northbound','A4',305,95],['T06','Glasshouse','A3',189,1310],['T07','Sundial','A1',214,780],['T08','Fjordlight','A2',262,430]]}};
var DB23={Bookings:{c:['BookingID','Film','Session','Seats'],r:[['B01','Starfall','Evening',2],['B02','Starfall','Matinee',4],['B03','Riverbend','Evening',1],['B04','Starfall','Evening',3],['B05','Quiet Hours','Matinee',2],['B06','Riverbend','Matinee',5],['B07','Quiet Hours','Evening',2],['B08','Starfall','Matinee',1]]}};
var qs=[];

/* ---------- Questions 1 to 10: 1 mark each ---------- */
qs.push(Q(SEP,'',[
 mc('Which development approach delivers working software in short cycles and changes the plan based on feedback after each cycle?',['Waterfall','Agile','Structured','Direct cut-over'],1,'Agile works in short iterations (sprints) and adjusts the plan using feedback from each one.')]));
qs.push(Q(SEP,'',[
 dd('Complete the statement by selecting the correct term from each dropdown menu.','In Git, {0} downloads new commits from the shared repository, while {1} uploads your local commits to it.',[[['commit','pull','push','clone'],1],[['commit','pull','push','clone'],2]],1,'git pull brings remote changes into your copy. git push sends your commits to the remote repository.')]));
qs.push(Q(SSA,'A school portal stores students\' passwords.',[
 mc('Which approach is the most secure way to store the passwords?',['Encrypt them with one key stored on the same server','Store them in plain text in a hidden table','Hash each password with a unique salt using a slow hashing algorithm','Store the first and last characters only'],2,'A slow, salted hash cannot be reversed and stops attackers using precomputed tables. Encryption can be undone by anyone who obtains the key.')]));
qs.push(Q(SEP,'',[
 ms('Which of the following are benefits of using a version control system in a team?<br>(More than one may be selected.)',['Earlier versions of the code can be restored.','The code runs faster.','Team members can work on separate branches at the same time.','It removes the need for testing.','Each change records who made it and why.'],[0,2,4],1,'Version control keeps history (so changes can be undone and traced) and lets people work in parallel on branches. It does not speed up the code or replace testing.')]));
qs.push(Q(SEP,'Agile teams use a number of practices to organise their work.',[
 dm('Match each agile practice to its description by dragging the labels into the boxes.',['Sprint','Product backlog','Stand-up','Retrospective'],[
  ['A short meeting each day where the team shares progress and blockers.',2],
  ['A fixed time period in which a set of features is built.',0],
  ['A meeting at the end of a cycle to discuss what to improve.',3],
  ['A prioritised list of all the features still to be built.',1]],1,{why:'Stand-ups are daily, a sprint is the time-boxed cycle, the retrospective reviews the process and the backlog lists the remaining work.'})]));
qs.push(Q(SA,'Consider the following Python code.'+code(`scores = [12, 7, 19, 4]
best = scores[0]
for s in scores:
    if s > best:
        best = s
print(best)`),[
 mc('What is printed when this code runs?',['4','12','19','42'],2,'best starts at 12 and is replaced whenever a larger score is found, so it ends at 19.')]));
qs.push(Q(SA,'Consider the following Python code.'+code(`while total < 100:
    total = total + step`),[
 dd('Select the correct option to complete the equivalent pseudocode.','<pre class="pre" style="margin:0">WHILE {0}\n    total = total + step\n{1}</pre>',[[['total > 100','total < 100','total = 100','step < 100'],1],[['NEXT total','END','ENDWHILE','UNTIL total < 100'],2]],1,'The loop condition is copied directly and a WHILE loop is closed with ENDWHILE.')],{two:true}));
qs.push(Q(SEP,'A café is building an online ordering app. The requirements listed below have been collected.',[
 mt('Classify each requirement as EITHER functional OR non-functional.',['Requirement','Functional','Non-functional'],[
  ['Customers can add items to a cart',0],['Pages load in under two seconds',1],['Staff can mark an order as ready',0],['The app works on phones and tablets',1],['All payment data is encrypted',1]],1,'Functional requirements describe what the system does. Non-functional requirements describe qualities such as speed, compatibility and security.')]));
qs.push(Q(PW,'The same web page is shown on a laptop and on a phone.'+fig('',sbs([['Laptop','<div style="display:flex;gap:6px"><div style="flex:1;background:#dbe7ff;padding:10px">Menu</div><div style="flex:3;background:#eef2f6;padding:10px">Content</div></div>'],['Phone','<div style="background:#dbe7ff;padding:10px;margin-bottom:6px">Menu</div><div style="background:#eef2f6;padding:10px">Content</div>']])),[
 mc('Which CSS feature is most likely used to change the layout for the phone?',['A media query','An HTML comment','A cookie','A form action'],0,'A media query applies different CSS rules when the screen is narrower, so the menu can stack above the content.')]));
qs.push(Q(PW,'Some tasks in a web application run in the browser and some run on the server.',[
 dm('Drag each label into the box beside each task to show where the task runs. A label may be used more than once.',['Client-side','Server-side'],[
  ['Changing a button\'s colour when the mouse hovers over it',0],
  ['Querying the database for a user\'s orders',1],
  ['Showing an error straight away when an email field is left empty',0],
  ['Checking that a session token is valid before returning private data',1]],1,{reuse:true,why:'Display changes and instant feedback happen in the browser. Database access and security checks must happen on the server, where users cannot alter them.'})]));

/* ---------- Questions 11 to 13 ---------- */
qs.push(Q(SEP,'',[
 od('Place the following steps of a login algorithm in the correct order by dragging the steps into position. The user has three attempts.',`
# BEGIN Login
    = Set attempts = 0
    REPEAT
        Get password
        Set attempts = attempts + 1
    UNTIL password = stored OR attempts = 3
    IF password = stored THEN
        Display "Welcome"
    ELSE
        Display "Account locked"
    ENDIF
# END Login`,2,{extra:['Set attempts = attempts - 1'],why:'The password is read and counted inside the REPEAT loop, which stops on a correct password or the third attempt. The IF after the loop decides which message to show.'})]));
qs.push(Q(SEP,'This class diagram is part of the design for a vehicle hire system. Car and Van are subclasses of Vehicle.'+fig('Class diagram',cls([['Vehicle',['- rego: String','- dailyRate: Real','+ getCost(days): Real']],['Car',['- seats: Integer']],['Van',['- loadCapacity: Real','+ getCost(days): Real']]])),[
 ms('Which of the following statements are TRUE about this design?<br>(More than one may be selected.)',['Car inherits the attribute dailyRate.','Van overrides the getCost method.','rego can be changed directly by any other class.','Car has no getCost method available.','seats is an attribute of every Vehicle.'],[0,1],2,'Subclasses inherit Vehicle\'s attributes and methods, and Van redefines getCost (polymorphism). rego is private, Car can still call the inherited getCost, and seats belongs to Car only.')],{two:true}));
qs.push(Q(SEP,'Consider the following algorithm.'+code(`BEGIN heatWarning
    Get Temperature
    IF Temperature >= 40 THEN
        Level = 'Extreme'
    ELSEIF Temperature >= 35 THEN
        Level = 'Severe'
    ELSE
        Level = 'None'
    ENDIF
    Display "Warning level: ", Level
END heatWarning`),[
 ft('Provide a set of test data that will thoroughly test the algorithm. Include the expected outputs and reasons for inclusion. You may assume that all input data are valid.',3,
  ['Test data<br>(Temperature)','Expected output<br>(Level)','Reason for inclusion'],5,
  [['42','Extreme','Tests the first branch'],['40','Extreme','Boundary: exactly 40 is Extreme'],['39','Severe','Just below the 40 boundary'],['35','Severe','Boundary: exactly 35 is Severe'],['34','None','Just below 35, tests the ELSE branch']],
  ['1 mark: test data that covers all three branches.','1 mark: boundary values at 35 and 40 (and just below them).','1 mark: correct expected outputs, each with a relevant reason.'],{widths:['22%','22%','56%']})],{two:true}));

/* ---------- Questions 14 to 16 ---------- */
qs.push(Q(PW,'',[
 P('(a)',tx('Explain how HTTPS protects data sent between a browser and a web server. (3 marks)',3,60,'HTTPS uses TLS. The server proves its identity with a certificate signed by a trusted authority, so the browser knows it is not talking to an impostor. The browser and server then agree on a session key, and all data is encrypted with it, so anyone intercepting the traffic sees unreadable data. Integrity checks also detect if the data is changed in transit.',['1 mark: identifies encryption of data in transit.','1 mark: explains certificates and server authentication.','1 mark: explains integrity or key exchange.'])),
 P('(b)',tx('Describe how a content delivery network (CDN) can improve the performance of a website. (3 marks)',3,60,'A CDN keeps copies of a site\'s static files (images, scripts, style sheets) on servers in many locations. Each user is served from the nearest server, which reduces the distance data travels and the load time. It also spreads traffic so the main server is not overloaded during busy periods.',['1 mark: copies of content on distributed servers.','1 mark: served from a nearby server, reducing latency.','1 mark: reduces load on the origin server or handles traffic spikes.']))]));
qs.push(Q(SEP,'',[
 tx('Describe how unit testing supports the maintenance of software.',3,65,'Unit tests check each function on its own against known inputs and expected outputs. When code is changed later, the tests are run again, so a change that breaks existing behaviour is found immediately. The tests also document what each function is supposed to do, which helps new developers make changes with confidence.',['1 mark: unit tests check individual functions or modules.','1 mark: rerunning tests detects errors introduced by changes (regression).','1 mark: further benefit, eg documents intended behaviour or speeds up debugging.'])]));
qs.push(Q(SEP,'A cinema sells tickets online.<p>A standard ticket costs $18. The following changes apply.</p><ul><li>Child: half price</li><li>Senior: $5 off</li><li>Booking fee: $1.50 per order</li></ul><p>An algorithm is needed to calculate the cost of an order.</p><p>The algorithm should calculate and display</p><ul><li>the price of each ticket</li><li>the total cost of the order, including the booking fee.</li></ul>',[
 ps('Write the algorithm using pseudocode. Include at least one subroutine in your answer. You may assume that all inputs are valid.',3,`BEGIN cinemaOrder
    Get numTickets
    total = 0
    FOR i = 1 TO numTickets
        Get ticketType
        price = ticketPrice(ticketType)
        Display "Ticket ", i, ": $", price
        total = total + price
    NEXT i
    total = total + 1.50
    Display "Total: $", total
END cinemaOrder

BEGIN ticketPrice(ticketType)
    price = 18
    IF ticketType = "Child" THEN
        price = price / 2
    ELSEIF ticketType = "Senior" THEN
        price = price - 5
    ENDIF
    RETURN price
END ticketPrice`,['1 mark: a loop that processes each ticket and displays its price.','1 mark: a correctly defined and called subroutine that calculates a ticket price.','1 mark: correct total including the booking fee, displayed once.'])],{two:true}));

/* ---------- Questions 17 to 19 ---------- */
qs.push(Q(PW,'A developer added a style sheet to a page. The developer expected the heading to look like Image 1, but it looks like Image 2.'+
 fig('',sbs([['Image 1','<div style="text-align:center;font:700 22px Georgia,serif;color:#0a5c36">Riverside Garden Club</div>'],['Image 2','<div style="font:700 22px Times New Roman,serif;color:#000">Riverside Garden Club</div>']]))+
 '<p>The following code was used by the developer.</p>'+
 files([['index.html',`<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Garden Club</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <h1 class="title">Riverside Garden Club</h1>
  </body>
</html>`],['styles.css',`.title {
  text-align: center;
  font-family: Georgia, serif;
  color: #0a5c36;
}`]]),[
 P('(a)',mc('Referring to the code, what is the cause of the problem?',['The h1 element cannot be given a class.','The link refers to style.css but the file is named styles.css.','The colour value is not valid.','The font family is not installed on any computer.'],1,'The browser looks for style.css, which does not exist, so none of the rules in styles.css are applied.')),
 P('(b)',tx('Outline how the developer could make this page responsive. (2 marks)',2,40,'Use relative units such as percentages, em or rem instead of fixed pixel sizes, and add media queries that change the layout and font sizes for narrow screens. Adding the viewport meta tag makes phones use the device width.',['1 mark: one relevant technique (eg media queries).','1 mark: a second technique or how it changes the page (eg relative units, viewport meta tag, flexible layout).']))],{two:true}));
qs.push(Q(PW,'A music streaming app stores its data in an online database. The database contains an Artists table and a Tracks table.',[
 sq('The app wants to list all tracks longer than 200 seconds by Australian artists.<br>Write an SQL query to display the track titles and artist names, in ascending order of track title.',3,`SELECT Tracks.Title, Artists.Name
FROM Tracks
JOIN Artists ON Tracks.ArtistID = Artists.ArtistID
WHERE Tracks.Seconds > 200 AND Artists.Country = 'Australia'
ORDER BY Tracks.Title ASC`,true,['1 mark: joins Tracks and Artists on ArtistID.','1 mark: both conditions in the WHERE clause.','1 mark: selects the correct columns and orders by title ascending.'])],{two:true,db:DB18}));
qs.push(Q(SSA,'A warehouse system gives every product a code. Each product code must satisfy the following rules:<ol><li>It must be exactly 6 characters long.</li><li>The first two characters must be uppercase letters.</li><li>The last four characters must be digits.</li></ol><p>An example of a valid product code is KD4821.</p>',[
 P('(a)',tx('Explain why the system should validate product codes on the server as well as in the browser. (3 marks)',3,50,'Checks in the browser give quick feedback but can be bypassed, because users can turn off JavaScript or send requests directly to the server. The server must check every code before storing it so that invalid or malicious data never reaches the database. This protects data integrity and helps prevent injection attacks.',['1 mark: browser validation gives fast feedback but can be bypassed.','1 mark: server validation cannot be bypassed by the user.','1 mark: link to data integrity or security (eg injection).'])),
 P('(b)',py('Write a function <code>is_valid_code(code)</code> with Python that returns True if a product code satisfies the rules and False otherwise. (3 marks)',3,'def is_valid_code(code):\n    ',`def is_valid_code(code):
    if len(code) != 6:
        return False
    if not (code[0].isupper() and code[1].isupper() and code[0].isalpha() and code[1].isalpha()):
        return False
    return code[2:].isdigit()`,[{app:'\nprint(is_valid_code("KD4821"))',o:'True'},{app:'\nprint(is_valid_code("kD4821"))',o:'False'},{app:'\nprint(is_valid_code("KD482"))',o:'False'},{app:'\nprint(is_valid_code("K14821"))',o:'False'},{app:'\nprint(is_valid_code("KD48X1"))',o:'False'}],['1 mark: checks the length is 6.','1 mark: checks the first two characters are uppercase letters.','1 mark: checks the last four are digits and returns the correct Boolean.']))],{two:true}));

/* ---------- Questions 20 to 22 ---------- */
qs.push(Q(SA,'',[
 tx('Explain the difference between supervised and unsupervised machine learning. Use an example of each.',3,70,'Supervised learning trains on labelled examples, where each input has a known correct output, and learns to predict the label for new data, for example classifying emails as spam or not spam. Unsupervised learning uses unlabelled data and finds patterns or groups by itself, for example clustering customers by their shopping habits.',['1 mark: supervised uses labelled data to predict outputs.','1 mark: unsupervised finds patterns in unlabelled data.','1 mark: a correct example of each.'])]));
qs.push(Q(SA,'Consider the following decision tree of a trained model that decides whether a student receives a free bus pass.'+
 fig('Bus pass decision tree','<svg viewBox="0 0 480 230" width="480" role="img" aria-label="Decision tree"><g font-family="Arial" font-size="13" text-anchor="middle" fill="#000"><rect x="165" y="8" width="150" height="30" fill="#fff" stroke="#555"/><text x="240" y="28">Distance &gt; 2 km?</text><line x1="205" y1="38" x2="100" y2="85" stroke="#555"/><line x1="275" y1="38" x2="380" y2="85" stroke="#555"/><text x="135" y="60">Yes</text><text x="345" y="60">No</text><rect x="40" y="85" width="120" height="30" fill="#fff" stroke="#555"/><text x="100" y="105">Age &lt; 16?</text><rect x="330" y="85" width="100" height="30" fill="#fff" stroke="#555"/><text x="380" y="105">No pass</text><line x1="80" y1="115" x2="45" y2="170" stroke="#555"/><line x1="120" y1="115" x2="165" y2="170" stroke="#555"/><text x="48" y="145">Yes</text><text x="160" y="145">No</text><rect x="5" y="170" width="80" height="30" fill="#fff" stroke="#555"/><text x="45" y="190">Free pass</text><rect x="115" y="170" width="100" height="30" fill="#fff" stroke="#555"/><text x="165" y="190">Concession</text></g></svg>'),[
 P('(a)',mt('Using the decision tree, determine the outcome for each of the following students. (1 mark)',['Student','Free pass','Concession','No pass'],[
  ['Lives 5 km away, aged 14',0],['Lives 3 km away, aged 17',1],['Lives 1 km away, aged 12',2]],1,'Distance is checked first: 2 km or less means no pass. Further away, students under 16 get a free pass and older students get a concession.')),
 P('(b)',dr('The school wants students who live 2 km or less away to receive a free pass if they have a disability, and no pass otherwise. Redraw the decision tree to include this rule. (3 marks)',3,'Root "Distance > 2 km?". Yes branch unchanged: "Age < 16?" with Yes to Free pass and No to Concession. No branch now goes to a new decision "Disability?" with Yes to Free pass and No to No pass.',['1 mark: original Yes branch kept correct.','1 mark: new "Disability?" decision on the No branch of the distance test.','1 mark: correct outcomes and labelled Yes/No branches.']))],{two:true}));
qs.push(Q(SA,'A gym stores its weekly class timetable in a two-dimensional list. Each row is a time slot and each column is a day.'+
 ctbl(['Slot','Monday','Tuesday','Wednesday','Thursday'],[['1','Yoga','Spin','HIIT','Yoga'],['2','Spin','Pilates','Yoga','HIIT'],['3','HIIT','Yoga','Spin','Pilates']],{Yoga:'#c9e7b7',Spin:'#cfe3fb',HIIT:'#f9c6d3',Pilates:'#fde2a7'})+
 '<p>The list starts like this:</p>'+code(`timetable = [["Yoga", "Spin", "HIIT", "Yoga"],
             ["Spin", "Pilates", "Yoga", "HIIT"],
             ["HIIT", "Yoga", "Spin", "Pilates"]]`)+
 '<p>The gym wants a program that prints each class and the number of times it runs each week, in alphabetical order, in this format:</p>'+code(`HIIT: 3
Pilates: 2
Spin: 3
Yoga: 4`),[
 P('(a)',mc('Which expression gives the class in slot 2 on Thursday? (1 mark)',['<code>timetable[2][4]</code>','<code>timetable[1][3]</code>','<code>timetable[2,4]</code>','<code>timetable[3][1]</code>'],1,'Slot 2 is row index 1 and Thursday is column index 3, so the expression is timetable[1][3].')),
 P('(b)',py('Write the Python program using at least one subroutine. Start your program with the timetable list shown. (5 marks)',5,`timetable = [["Yoga", "Spin", "HIIT", "Yoga"],
             ["Spin", "Pilates", "Yoga", "HIIT"],
             ["HIIT", "Yoga", "Spin", "Pilates"]]
`,`timetable = [["Yoga", "Spin", "HIIT", "Yoga"],
             ["Spin", "Pilates", "Yoga", "HIIT"],
             ["HIIT", "Yoga", "Spin", "Pilates"]]

def count_classes(table):
    counts = {}
    for row in table:
        for name in row:
            counts[name] = counts.get(name, 0) + 1
    return counts

def show_counts(counts):
    for name in sorted(counts):
        print(name + ": " + str(counts[name]))

show_counts(count_classes(timetable))`,[{o:'HIIT: 3\nPilates: 2\nSpin: 3\nYoga: 4',exact:true}],['1 mark: traverses every row and column of the 2D list.','1 mark: counts each class correctly.','1 mark: defines and calls at least one subroutine.','1 mark: sorts the classes alphabetically.','1 mark: output in the required format.']))],{two:true}));

/* ---------- Questions 23 to 27 ---------- */
qs.push(Q(PW,'A cinema uses an online relational database to record bookings. The contents of the Bookings table are shown.',[
 P('(a)',dd('Complete the SQL query to show the total number of seats booked for each film. (2 marks)','<pre class="pre" style="margin:0">SELECT Film, {0}(Seats)\nFROM Bookings\n{1} BY {2}</pre>',[[['COUNT','SUM','MAX','AVG'],1],[['ORDER','GROUP','SORT','HAVING'],1],[['Film','Seats','Session','BookingID'],0]],2,'SUM adds the seats in each group, and GROUP BY Film makes one group per film.')),
 P('(b)',tx('The cinema plans to add a Members table that stores each member\'s email address and password. Outline how the passwords should be stored, and why. (3 marks)',3,60,'Passwords should never be stored in plain text. Each password should be hashed with a slow algorithm such as bcrypt or scrypt and a unique random salt, and only the salt and hash stored. If the database is stolen, attackers cannot read the passwords, and the salt stops them using precomputed tables or spotting members who share a password.',['1 mark: passwords hashed, not stored in plain text.','1 mark: a unique salt and/or slow algorithm.','1 mark: explains the protection if the database is breached.']))],{two:true,db:DB23}));
qs.push(Q(SSA,'',[
 P('(a)',tx('Explain how sandboxing improves the security of an application. (3 marks)',3,60,'Sandboxing runs code in a restricted environment with limited access to files, memory, the network and other programs. If the code is malicious or has a vulnerability, the damage stays inside the sandbox and cannot spread to the rest of the system. This lets untrusted code, such as browser tabs or downloaded plug-ins, run with less risk.',['1 mark: restricted, isolated environment.','1 mark: limits the damage from malicious or faulty code.','1 mark: relevant example or benefit.'])),
 P('(b)',tx('Outline the principle of privacy by design. (3 marks)',3,60,'Privacy by design means protecting personal data from the start of a project rather than adding it later. The software collects only the data it needs, uses privacy-protective settings by default and secures data throughout its life, for example by encrypting it and deleting it when no longer needed. Users are told clearly how their data is used.',['1 mark: privacy considered from the start.','1 mark: data minimisation or privacy by default.','1 mark: a further practice, eg encryption, retention limits or transparency.']))]));
qs.push(Q(SEP,'A veterinary clinic wants a class diagram that models its appointments.<p>The clinic records:</p><ul><li>each owner\'s name, phone number and email address</li><li>each pet\'s name, species and date of birth. An owner can have several pets.</li><li>each appointment\'s date, time and reason. Every appointment is for one pet with one vet.</li><li>each vet\'s name and registration number.</li></ul>',[
 dr('Create a class diagram for the veterinary clinic.',4,'Four classes. Owner (name, phone, email). Pet (name, species, dateOfBirth). Appointment (date, time, reason). Vet (name, registrationNumber). Owner to Pet: one to many. Pet to Appointment: one to many. Vet to Appointment: one to many. Methods such as bookAppointment() or getPets() are acceptable.',['1 mark: Owner, Pet, Appointment and Vet classes.','1 mark: appropriate attributes in each class.','1 mark: correct associations between the classes.','1 mark: correct multiplicities (eg one owner to many pets).'])],{two:true}));
qs.push(Q(SEP,'',[
 od('Place the following steps of a linear search algorithm in the correct order by dragging the steps into position.',`
# BEGIN LinearSearch
    = Set found = False
    Set index = 0
    WHILE index < length AND found = False
        IF list[index] = target THEN
            Set found = True
        ELSE
            Set index = index + 1
        ENDIF
    ENDWHILE
    IF found = True THEN
        Display "Found at position ", index
    ELSE
        Display "Not found"
    ENDIF
# END LinearSearch`,3,{extra:['Set index = index - 1'],why:'The loop checks each item until the target is found or the list ends. index only moves on when the item does not match, so it holds the position when found. The final IF reports the result once.'})]));
qs.push(Q(SSA,'A council\'s parking app was attacked, and customers\' card details were stolen. The council has asked three companies to propose how to rebuild the app securely.<p><b>Proposals</b></p>'+
 slides([slide('Proposal A: SafeLane','<p>Rebuild the app with secure coding training for every developer.</p><p>Automated code scanning on every change.</p><p>Card payments handled by an external payment provider, so no card numbers are stored.</p>','<div style="font-size:52px" aria-hidden="true">🛡️</div>'),
  slide('Proposal B: QuickPark','<p>Keep the current code and add a web application firewall.</p><p>Encrypt the card numbers already stored in the database.</p><p>Lowest cost and ready in four weeks.</p>','<div style="font-size:52px" aria-hidden="true">⚡</div>'),
  slide('Proposal C: CivicCloud','<p>Move the app to a cloud platform with built-in monitoring.</p><p>Multi-factor sign-in for staff and customers.</p><p>Annual penetration testing by an outside firm.</p>','<div style="font-size:52px" aria-hidden="true">☁️</div>')]),[
 tx('Evaluate the THREE proposals and recommend the most suitable one for the council.',8,250,'Proposal A reduces the risk of another card-data loss by removing stored card numbers from the council app. Developer training and scanning every change can prevent or identify vulnerabilities during development. However, scanning cannot guarantee that all flaws are found, and the council must rely on the payment provider. Proposal B has the stated lowest cost and four-week delivery. A web application firewall can block some malicious requests, while encryption helps protect stored data. However, these controls do not establish that flaws in the existing code have been corrected; compromise of the running app or encryption keys could still expose card data. Proposal C improves detection and account protection through monitoring and multi-factor authentication, and independent penetration tests can reveal weaknesses. However, annual testing may leave gaps between tests, and the proposal does not state that card storage will end or that identified flaws will be repaired. A is recommended because it directly reduces the stored data exposed in a future breach and integrates preventive checks into development. The cause of the original attack and A’s cost and delivery time are not given, so these cannot be assumed.',['7–8 marks: judges all three proposals against the breach with strengths and weaknesses, and makes a justified recommendation.','5–6 marks: explains strengths and weaknesses of the proposals with a recommendation.','3–4 marks: describes features of the proposals with some evaluation.','1–2 marks: identifies some features.'])],{two:true}));

BANKS.push({id:'7',name:'Bank 7',sub:'Drag-and-drop, tables and panels',archived:true,qs:qs});
})();
