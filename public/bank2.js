(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var DB21={Items:{c:['ItemID','ItemName','Category','Price'],r:[['I1','Sausage roll','Hot',4],['I2','Pie','Hot',5],['I3','Sandwich','Cold',6],['I4','Fruit cup','Cold',3],['I5','Juice','Drink',3],['I6','Water','Drink',2]]},
 Orders:{c:['OrderID','ItemID','Qty','Day'],r:[['O1','I1',2,'Mon'],['O2','I3',1,'Mon'],['O3','I5',3,'Mon'],['O4','I2',1,'Tue'],['O5','I4',4,'Mon'],['O6','I6',5,'Mon'],['O7','I1',1,'Tue'],['O8','I2',3,'Mon'],['O9','I5',2,'Tue'],['O10','I3',2,'Mon']]}};
var qs=[];
qs.push(Q(SEP,'A project manager needs to show which tasks depend on other tasks, how long each task will take, and the earliest date the project can finish.',[
 mc('Which project management tool is most suitable?',['Gantt chart','Data flow diagram','Structure chart','Storyboard'],0,'A Gantt chart shows tasks, their durations, their dependencies and the overall timeline.')]));
var RQ=['functional','non-functional','legal','hardware'].map(function(x){return x.charAt(0).toUpperCase()+x.slice(1)});
qs.push(Q(SEP,'',[
 dd('Complete the statement by selecting the correct term from each dropdown menu.','The requirement "the app must support 10 000 users at the same time" is a {0} requirement. The requirement "a user can export a report as a PDF file" is a {1} requirement.',[[['Functional','Non-functional','Legal','Hardware'],1],[['Functional','Non-functional','Legal','Hardware'],0]],1,'Non-functional requirements describe qualities such as performance and capacity. Functional requirements describe a task the system performs.')]));
qs.push(Q(SA,'A shop has purchase records for 5000 customers. There are no categories or labels. The shop wants a program to find groups of customers who buy similar products.',[
 mc('Which type of machine learning is most suitable?',['Supervised learning','Unsupervised learning','Reinforcement learning','Linear regression'],1,'The data is unlabelled and the aim is to discover groups, which is unsupervised learning (clustering).')]));
qs.push(Q(SEP,'Consider the following Python function.'+code(`def mystery(items):
    result = items[0]
    for x in items:
        if x < result:
            result = x
    return result`),[
 mc('What is the value returned by <b>mystery([7, 3, 9, 1, 4])</b>?',['1','3','4','7'],0,'The function keeps the smallest value seen so far, so it returns the minimum, which is 1.')]));
qs.push(Q(PW,'',[
 mc('What is the purpose of the viewport meta tag in the head of a web page?',['To tell the browser how to scale the page to the width of the device','To list the keywords used by search engines','To link the page to a style sheet','To set the language used by screen readers'],0,'The viewport tag is a key part of responsive design on mobile devices.')]));
qs.push(Q(PW,'',[
 mc('Which of the following is a function of the Internet Protocol (IP)?',['Rearranging packets that arrive out of order','Addressing packets and routing them between networks','Encrypting the contents of a message','Converting domain names into addresses'],1,'IP addresses packets and routes them. TCP reorders packets, TLS encrypts and DNS resolves names.')]));
qs.push(Q(PW,'Consider the following JavaScript code.'+code(`let total = 0;
for (let i = 1; i <= 4; i++) {
    total += i * 2;
}
console.log(total);`),[
 mc('What is displayed in the console?',['8','10','20','24'],2,'The loop adds 2, 4, 6 and 8, which gives 20.')]));
qs.push(Q(SSA,'A website sends a user to the web address given in a "next" parameter after they log in. An attacker emails victims a link where "next" points to a copy of the site run by the attacker.',[
 mc('Which vulnerability does this describe?',['Race condition','Invalid redirection','Buffer overflow','SQL injection'],1,'The site redirects to an address it has not validated, so it can send users to a malicious site.')]));
qs.push(Q(PW,'Some code runs in the user\'s browser. Other code runs on the web server.',[
 mt('Match each characteristic to client-side or server-side web programming.',['Characteristic','Client-side','Server-side'],[['Runs in the user\'s browser',0],['Can read and write the database directly',1],['The user can view the source code',0],['Used to keep secret keys away from users',1]],1,'')]));
qs.push(Q(PW,'',[
 ms('Which of the following are features of a progressive web app (PWA)?',['Service workers can cache content so pages work offline','It can be installed to the home screen from the browser','It must be downloaded from an app store','It is written separately for each operating system','It is delivered over HTTPS'],[0,1,4],1,'PWAs run in the browser, use service workers and HTTPS, and can be installed. They are not distributed only through app stores.')]));
qs.push(Q(SEP,'',[
 ms('Which of the following are characteristics of an agile development approach?',['Working software is delivered in short iterations','Detailed documentation is completed before coding starts','The client gives regular feedback','Requirements are fixed at the start and not changed','Teams organise their own work'],[0,2,4],1,'Agile favours iterations, feedback and self-organising teams over fixed plans and heavy documentation.')]));
qs.push(Q(SA,'',[
 ms('For which of the following would polynomial regression be most appropriate?<br>Select all that apply.',['Modelling the curved path of a thrown ball','Predicting a yes or no outcome','Modelling growth that speeds up and then levels off','Identifying spam email','Fitting a straight trend to monthly sales','Modelling a drug dose where the effect rises and then falls'],[0,2,5],2,'Polynomial regression fits curves. Yes/no and spam prediction are classification, and a straight trend suits linear regression.')]));
qs.push(Q(SEP,'Different types of testing are used at different stages of development.',[
 gd('For each situation, select the most appropriate type of testing.',['Situation','Type of testing'],[
  ['Checking that one function correctly adds GST to a price',[['Unit','Integration','System','Acceptance'],0]],
  ['Checking that the login module works with the user database',[['Unit','Integration','System','Acceptance'],1]],
  ['Checking the complete application under a heavy load before release',[['Unit','Integration','System','Acceptance'],2]],
  ['The client confirms the finished app meets their needs',[['Unit','Integration','System','Acceptance'],3]]],2,'')]));
qs.push(Q(SEP,'The array <b>a</b> holds five values. Array positions are numbered from 1.'+tbl(['Position','1','2','3','4','5'],[['a','5','2','9','1','7']])+code(`FOR i = 1 TO 4
    IF a[i] > a[i + 1] THEN
        Set temp = a[i]
        Set a[i] = a[i + 1]
        Set a[i + 1] = temp
    ENDIF
NEXT i`),[
 gd('Select the correct item from each dropdown menu to show the contents of the array after the code is run.',['','1','2','3','4','5'],[['a after',[['1','2','5','7','9'],1],[['1','2','5','7','9'],2],[['1','2','5','7','9'],0],[['1','2','5','7','9'],3],[['1','2','5','7','9'],4]]],1,'This is one pass of a bubble sort. 5 and 2 swap, 5 and 9 stay, 9 and 1 swap, 9 and 7 swap. The array becomes 2, 5, 1, 7, 9.')],{two:true}));
qs.push(Q(SEP,'A gym is developing a class booking system. Part of the data dictionary for the system is shown.',[
 P('(a)',gd('Select the correct entries to complete the data dictionary. (3 marks)',['Field','Data type','Example','Validation rule'],[
  ['ClassDate',[['Date','String','Integer','Boolean'],0],'2026-11-03',[['Must be a future date','Whole number from 1 to 40','Not empty and at most 50 characters'],0]],
  ['Capacity',[['Date','String','Integer','Boolean'],2],'25',[['Must be a future date','Whole number from 1 to 40','Not empty and at most 50 characters'],1]],
  ['MemberName',[['Date','String','Integer','Boolean'],1],'Priya Nair',[['Must be a future date','Whole number from 1 to 40','Not empty and at most 50 characters'],2]]],3,'')),
 P('(b)',tx('Outline TWO benefits of using a data dictionary when developing a software solution. (3 marks)',3,55,'A data dictionary gives every developer the same definition of each field, such as its type and allowed values, so different parts of the system use the data consistently. It also helps testers write test data, because the validation rules and formats are already documented.',['Award up to 2 marks for two benefits identified and 1 mark for explanation.','Benefits include: consistent naming and types, shared understanding in a team, helps validation and testing, supports maintenance, reduces errors in database design.']))],{two:true}));
qs.push(Q(PW,'A school is developing NoteNest, a learning app where students read notes, complete quizzes and receive reminders about due work. Many students use older phones and travel on trains where the internet connection is poor.',[
 P('(a)',tx('Compare the use of a progressive web app (PWA) with a native app for delivering NoteNest. (3 marks)',3,65,'A PWA is built once with web technologies and runs in any browser, so the school needs only one version. A native app must be built separately for each operating system and installed from an app store. A PWA can cache notes for offline use and send reminders, which suits poor connections, but a native app can use more device features and may run faster.',['3 marks: compares both approaches with reference to the scenario.','2 marks: describes both with limited comparison, or compares with no link to the scenario.','1 mark: describes one approach.'])),
 P('(b)',tx('Explain how an application programming interface (API) could allow NoteNest to show timetable data held in the school\'s existing system. (3 marks)',3,60,'The timetable system exposes an API with defined requests. NoteNest sends a request, for example for a student\'s timetable, and the API returns the data in a format such as JSON. NoteNest then displays it. The two systems stay separate, so NoteNest does not need direct access to the timetable database.',['3 marks: explains request and response, data format and that the API hides the underlying database.','2 marks: explains the request and response with limited detail.','1 mark: states that an API shares data.'])),
 P('(c)',tx('Explain how cookies can be used to maintain a student\'s session, and describe ONE risk of using them. (3 marks)',3,60,'After login the server creates a session and sends the browser a cookie holding a session identifier. The browser returns the cookie with each request so the server knows who is logged in. One risk is session hijacking. If an attacker steals the cookie, for example over an unsecured connection, they can act as the student.',['3 marks: explains how the identifier is stored and returned, and describes a risk.','2 marks: explains the use of cookies with a limited risk, or the reverse.','1 mark: identifies cookies with minimal explanation.']))],{two:true}));
qs.push(Q(SEP,'A bike hire company charges $8 for the first hour and $5 for each extra hour. The cost for one day cannot be more than $40. The customer\'s hire time is a whole number of hours from 1 to 12.',[
 ps('Write an algorithm using pseudocode that gets the number of hours, calculates the cost and displays it. Include at least one subroutine in your answer.',3,`BEGIN BikeHire
    Get hours
    Set cost = CalculateCost(hours)
    Display "Hire cost: $", cost
END BikeHire

BEGIN CalculateCost(hours)
    Set cost = 8 + 5 * (hours - 1)
    IF cost > 40 THEN
        Set cost = 40
    ENDIF
    RETURN cost
END CalculateCost`,['1 mark: a subroutine with a parameter that returns or displays a value and is called from the main algorithm.','1 mark: correct calculation of $8 plus $5 for each extra hour.','1 mark: caps the cost at $40 and displays the result.'])],{two:true}));
qs.push(Q(SA,'',[
 tx('Explain how overfitting can be reduced when training a machine learning model.',3,60,'Overfitting means learning training noise rather than general patterns. More varied, representative training data helps the model learn stable patterns. Regularisation penalises unnecessary complexity, while a simpler model has less capacity to memorise noise. A validation set or cross-validation detects poor generalisation; use those results to select model complexity or regularisation settings, or to guide early stopping. Testing alone does not change the model.',['3 marks: explains at least two methods and links them to reducing memorisation of training data.','2 marks: explains one method well or two with limited detail.','1 mark: identifies one method.'])]));
qs.push(Q(SEP,'A program counts the words and the vowels in a sentence. For the sentence <b>The quick brown fox jumps</b> the output is:<br><b>Words: 5<br>Vowels: 6</b><br>Vowels are a, e, i, o and u, in upper or lower case.',[
 py('Write a Python program that asks the user for a sentence and then displays the number of words and the number of vowels in the sentence in the format shown.',3,'',`sentence = input("Enter a sentence: ")
words = len(sentence.split())
vowels = 0
for ch in sentence.lower():
    if ch in "aeiou":
        vowels += 1
print("Words:", words)
print("Vowels:", vowels)`,[{i:['The quick brown fox jumps'],o:'Words: 5\nVowels: 6'},{i:['I love Python'],o:'Words: 3\nVowels: 4'},{i:['Rhythm'],o:'Words: 1\nVowels: 0'},{i:['AEIOU aeiou'],o:'Words: 2\nVowels: 10'}],['1 mark: reads input and counts the words.','1 mark: counts vowels in both cases.','1 mark: displays both results in the correct format.'])],{two:true}));
qs.push(Q(PW,'',[
 tx('Describe how a content delivery network (CDN) can reduce the load time of a website that is used around the world.',3,55,'A CDN stores copies of a site\'s static files, such as images and scripts, on servers in many locations. When a user requests the page, the files come from the server nearest to them instead of the main server. The shorter distance reduces delay, and spreading requests across servers reduces the load on the main server.',['3 marks: describes copies stored in many locations, delivery from the nearest server and the effect on load time.','2 marks: describes the use of multiple servers with limited link to load time.','1 mark: identifies that a CDN stores content.'])]));
qs.push(Q(PW,'A school canteen keeps its menu and orders in two related tables, Items and Orders.',[
 sq('Construct a SQL query that displays the Category of each item and the total value of the orders for that category on Monday. The value of an order is Qty multiplied by Price.<br>Use the column headings Category and TotalValue. List the results from the highest to the lowest total value.',4,`SELECT Category, SUM(Qty * Price) AS TotalValue
FROM Orders
JOIN Items ON Orders.ItemID = Items.ItemID
WHERE Day = 'Mon'
GROUP BY Category
ORDER BY TotalValue DESC`,true,['1 mark: joins Orders and Items on ItemID.','1 mark: filters to Monday orders.','1 mark: calculates the total using Qty multiplied by Price for each Category.','1 mark: correct headings and ordering from highest to lowest.'])],{two:true,db:DB21}));
qs.push(Q(SEP,'A city bike-share company needs a class diagram. A station has a station number (for example S014), an address and a capacity. A bike has a bike number (for example B2291) and a type, which is either Standard or Electric. A member has a member number, a name and an email address. A station holds many bikes, and each bike is at one station at a time. A member can have one bike on hire at a time, or none.',[
 dr('Create a class diagram for the bike-share company. Show the attributes of each class and the relationships between the classes with their multiplicity.',3,'Three classes. Station: stationNumber, address, capacity. Bike: bikeNumber, type. Member: memberNumber, name, email. A line from Station to Bike with 1 at the Station end and 0..* at the Bike end. A line from Member to Bike with 0..1 at the Member end and 0..1 at the Bike end (a bike is on hire to at most one member).',['1 mark: three classes with the correct attributes.','1 mark: Station to Bike relationship with the correct multiplicity (1 to many).','1 mark: Member to Bike relationship with the correct multiplicity (0 or 1).'])],{two:true}));
qs.push(Q(SSA,'GreenCart is an online store that sells reusable household products. It is preparing a flash sale in which thousands of customers will buy limited stock in a short time. The store accepts card payments, keeps customer accounts and lets customers write product reviews.',[
 P('(a)',tx('Describe how static application security testing (SAST) and dynamic application security testing (DAST) can be used at different stages of developing GreenCart. (3 marks)',3,60,'SAST analyses the source code without running it, so it can be used while the code is being written, for example to find a query built from unchecked input. DAST tests the running application by sending unexpected requests, so it is used once a working version is deployed to a test environment, for example to try to break the login or the payment pages.',['3 marks: describes both, states the stage for each and gives an example from the scenario.','2 marks: describes both with limited stage or example.','1 mark: describes one.'])),
 P('(b)',tx('Explain how a race condition could affect stock levels during the flash sale, and how secure code can prevent it. (3 marks)',3,60,'If two customers buy the last item at the same moment, both programs may read a stock level of 1 before either updates it, so both sales succeed and stock becomes negative. This can be prevented with locking or an atomic database transaction, so the check and the update happen as one step and the second customer sees that the item has sold out.',['3 marks: explains how the race occurs with reference to stock and describes a prevention method.','2 marks: explains the problem or the prevention with limited detail.','1 mark: identifies a race condition.'])),
 P('(c)',gd('Select the control that best reduces each risk. (3 marks)',['Risk','Control'],[
  ['Attackers try thousands of passwords against one customer account',[['Account lockout','Output encoding','TLS encryption','File locking','Password hashing'],0]],
  ['A review containing script tags runs in other customers\' browsers',[['Account lockout','Output encoding','TLS encryption','File locking','Password hashing'],1]],
  ['Card details are intercepted on public Wi-Fi',[['Account lockout','Output encoding','TLS encryption','File locking','Password hashing'],2]]],3,''))],{two:true}));
qs.push(Q(SA,'A hospital trains a machine learning model on ten years of patient records to predict which patients are likely to be readmitted within 30 days. Patients flagged as high risk receive follow-up calls and nurse visits. Patients flagged as low risk are discharged with standard instructions.',[
 tx('Discuss the social and ethical implications of using this model.',5,110,'The model may improve care by sending nurse visits to patients who need them, which could reduce readmissions and save lives. However, historical records may reflect past inequality, for example patients from remote areas who attended less often. The model could then label them low risk and give them less support, which is unfair. Patients may not know a computer made the decision or be able to challenge it. Their health data must be stored securely and used with consent. Doctors must be able to override a prediction, so responsibility for decisions stays with people.',['5 marks: a sustained discussion of both social and ethical implications, using the scenario.','3-4 marks: several implications with some links to the scenario.','1-2 marks: identifies implications with limited explanation.','Ideas include: bias in historical data, fairness of care, consent and privacy, transparency and appeal, human oversight, benefits of earlier support.'])]));
qs.push(Q(SA,'A music streaming service uses reinforcement learning to choose the next song for autoplay. The system receives a reward when a listener plays a song to the end and a penalty when the listener skips it within ten seconds.',[
 tx('Explain how reinforcement learning allows the system to improve its choices. Include ONE positive and ONE negative impact of this approach.',5,110,'The system acts as an agent. It picks a song, observes whether the listener finishes or skips it, and receives a reward or penalty. Over many listeners it adjusts its strategy to choose songs that earn more rewards. A positive impact is that listeners hear music they enjoy without searching. A negative impact is a narrow range of music. If the system only rewards what is played to the end, it keeps repeating familiar songs, and new artists are rarely heard.',['5 marks: explains agent, action, reward and penalty and improvement over time, with one positive and one negative impact linked to the scenario.','3-4 marks: explains the learning process with some detail and gives impacts with limited links.','1-2 marks: identifies reinforcement learning or one impact only.'])]));
qs.push(Q(SEP,'A teacher stores quiz marks for four students in a dictionary. Each student has three marks.'+code(`marks = {"Ava": [8, 9, 7], "Ben": [6, 7, 9], "Chi": [9, 9, 10], "Dev": [5, 8, 6]}`)+'The program must display each student\'s name and average mark rounded to 1 decimal place, then the name of the student with the highest average.<br><br>The output must be in this format:<pre class="pre">Ava: 8.0\nBen: 7.3\nChi: 9.3\nDev: 6.3\nTop student: Chi</pre>',[
 py('Using Python, write a program that produces this output. Start your program with the line that creates the dictionary.',5,'marks = {"Ava": [8, 9, 7], "Ben": [6, 7, 9], "Chi": [9, 9, 10], "Dev": [5, 8, 6]}\n',`marks = {"Ava": [8, 9, 7], "Ben": [6, 7, 9], "Chi": [9, 9, 10], "Dev": [5, 8, 6]}
best_name = ""
best_avg = -1
for name in marks:
    avg = sum(marks[name]) / len(marks[name])
    print(name + ": " + str(round(avg, 1)))
    if avg > best_avg:
        best_avg = avg
        best_name = name
print("Top student: " + best_name)`,[{i:[],o:'Ava: 8.0\nBen: 7.3\nChi: 9.3\nDev: 6.3\nTop student: Chi'}],['1 mark: loops through the dictionary.','1 mark: calculates each average correctly.','1 mark: rounds to 1 decimal place and displays name and average in the format.','1 mark: tracks the highest average.','1 mark: displays the top student after the loop.'])],{two:true}));
qs.push(Q(SA,'A council is trialling autonomous delivery robots that carry groceries from shops to homes along footpaths. The robots use cameras and machine learning to avoid obstacles and to recognise pedestrians. They record video while they travel.',[
 tx('Evaluate the use of these robots in the suburb. In your answer, refer to social, ethical and environmental impacts.',6,185,'The robots could help people who cannot easily shop, such as older residents, and they may reduce car trips, cutting emissions if they run on renewable electricity. They also create jobs in maintenance and remote monitoring, although delivery drivers could lose work.<br>The robots share footpaths with pedestrians. If the recognition model works less well for children, wheelchairs or people in poor light, some groups are at higher risk of collisions. This is an ethical issue because the model was trained on data that may not include everyone equally.<br>Video of residents is personal information. The council should say what is recorded, store it securely and delete it when it is no longer needed. Footpaths may also become crowded and noisy, and manufacturing the robots and batteries has an environmental cost.<br>Overall the robots offer convenience and lower emissions, but only if safety testing covers all pedestrians, privacy is protected and affected workers are supported. Without those steps the risks are larger than the benefits.',['6 marks: a balanced evaluation covering social, ethical and environmental impacts with scenario links and a justified judgement.','4-5 marks: explains most areas with scenario links and limited judgement.','2-3 marks: describes some impacts with limited links.','1 mark: identifies an impact only.'])]));
BANKS.push({id:'2',name:'Bank 2',sub:'Automation, data and project focus',archived:true,qs:qs});
})();
