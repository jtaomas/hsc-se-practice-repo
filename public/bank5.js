(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var DB21={Doctors:{c:['DoctorID','DoctorName','Clinic'],r:[['D1','Dr Lee','Northside'],['D2','Dr Mehta','Northside'],['D3','Dr Rossi','Harbour'],['D4','Dr Kim','Westend']]},
 Appointments:{c:['ApptID','DoctorID','Day','Status','Fee'],r:[['A1','D1','Mon','Attended',80],['A2','D1','Tue','Missed',80],['A3','D2','Mon','Attended',90],['A4','D2','Wed','Attended',90],['A5','D3','Tue','Attended',85],['A6','D3','Wed','Missed',85],['A7','D4','Thu','Missed',70],['A8','D1','Fri','Attended',80],['A9','D3','Fri','Attended',85]]}};
var qs=[];
qs.push(Q(SEP,'A developer writes a subroutine that only displays a message and returns a fixed value. The main program can then be tested before the real subroutine has been written.',[
 mc('What is this temporary subroutine called?',['A stub','A watch','A facade','A constructor'],0,'A stub stands in for a subroutine that has not been written yet so the rest of the program can be tested.')]));
qs.push(Q(SSA,'',[
 dd('Complete the statement by selecting the correct term from each dropdown menu.','{0} confirms who a user is, while {1} decides what that user is allowed to do.',[[['Authentication','Authorisation','Accountability','Availability'],0],[['Authentication','Authorisation','Accountability','Availability'],1]],1,'Authentication proves identity. Authorisation sets permissions.')]));
qs.push(Q(SA,'',[
 mc('Which machine learning model is made of layers of connected nodes, where each connection has a weight that is adjusted during training?',['Decision tree','Neural network','Linear regression','K-nearest neighbour'],1,'A neural network adjusts the weights of connections between layers of nodes as it trains.')]));
qs.push(Q(SEP,'Consider the following Python code.'+code(`class Animal:
    def speak(self):
        return "..."

class Dog(Animal):
    def speak(self):
        return "Woof"

class Cat(Animal):
    pass

for a in [Dog(), Cat(), Animal()]:
    print(a.speak(), end=" ")`),[
 mc('What is displayed when this code is run?',['Woof ... ...','Woof Woof ...','... ... ...','Woof Cat Animal'],0,'Dog replaces speak. Cat inherits speak from Animal, so it returns "...". Animal also returns "...".')]));
qs.push(Q(PW,'',[
 mc('What is the main difference between FTP and SFTP?',['SFTP encrypts the files and login details that are sent','SFTP is used to send email','FTP encrypts the data but SFTP does not','SFTP can only transfer text files'],0,'SFTP transfers files over an encrypted connection. FTP sends data and login details as plain text.')]));
qs.push(Q(PW,'Web services often send data in a machine-readable format.',[
 mc('Which of the following is valid JSON?',['{"name": "Ava", "age": 17}','{name: \'Ava\', age: 17}','{"name" = "Ava", "age" = 17}','<name>Ava</name>'],0,'JSON uses double quotes around names and text values, and a colon between a name and its value.')]));
qs.push(Q(PW,'Consider the following HTML and JavaScript code.'+code(`<button id="b">Add</button>
<p id="n">0</p>
<script>
let count = 0;
document.getElementById("b").addEventListener("click", function () {
  count = count + 2;
  document.getElementById("n").textContent = count;
});
</script>`),[
 mc('A user clicks the button three times. What does the paragraph show?',['2','3','6','0'],2,'Each click adds 2 to count and updates the paragraph, so after three clicks it shows 6.')]));
qs.push(Q(SSA,'A web server returns the file named in the address <b>/download?file=report.pdf</b>. An attacker requests <b>/download?file=../../config/passwords.txt</b> and receives the file.',[
 mc('Which type of attack does this describe?',['File attack (path traversal)','Cross-site scripting','Race condition','Buffer overflow'],0,'The attacker changed the file path to reach a file outside the folder the server meant to share.')]));
qs.push(Q(SSA,'Cryptographic techniques protect data in different ways.',[
 mt('Match each description to a technique.',['Description','Encryption','Hashing','Digital signature'],[['Turns plain text into cipher text that can be reversed using the correct key',0],['Produces a fixed-length value that cannot be turned back into the original data',1],['Lets a receiver confirm who sent a message and that it was not changed',2],['Protects the confidentiality of messages sent over a network',0]],1,'')]));
qs.push(Q(SSA,'',[
 ms('Which of the following are examples of defensive data input handling?',['Checking that a quantity is a whole number within an allowed range','Removing or escaping special characters before input is used in a query','Showing the user the full technical error message from the database','Catching an error, showing a general message and logging the details','Trusting data in a hidden form field because the user cannot see it'],[0,1,3],1,'Validation, sanitisation and careful error handling are defensive. Showing technical errors and trusting hidden fields help attackers.')]));
qs.push(Q(SEP,'Object-oriented programming (OOP) has key features.',[
 tk('For each statement, tick the OOP feature that it describes.',['Statement','Encapsulation','Abstraction','Inheritance','Polymorphism'],[['A Square class reuses the attributes and methods of a Shape class',[2]],['Different classes respond to the same method call in their own way',[3]],['A balance can only be changed by deposit and withdraw methods',[0]],['A driver uses a car without needing to know how the engine works',[1]]],1,'')]));
qs.push(Q(SEP,'A form accepts an age from 13 to 17 inclusive.',[
 ms('Which of the following values are boundary values that should be used when testing the form?<br>Select all that apply.',['12','13','15','17','18','30'],[0,1,3,4],2,'Boundary testing uses the values at and on either side of each limit: 12, 13, 17 and 18.')]));
qs.push(Q(SEP,'Typical errors occur when code is developed.',[
 gd('For each situation, select the type of error.',['Situation','Type of error'],[
  ['A colon is missing at the end of an if statement',[['Syntax error','Logic error','Runtime error'],0]],
  ['A program divides a number by zero while it is running',[['Syntax error','Logic error','Runtime error'],2]],
  ['A program meant to add 10% tax multiplies by 0.1 and displays the wrong amount',[['Syntax error','Logic error','Runtime error'],1]],
  ['A program tries to open a file that does not exist',[['Syntax error','Logic error','Runtime error'],2]]],2,'')]));
qs.push(Q(SEP,'Consider the following pseudocode. The two-dimensional array <b>Grid</b> has 3 rows and 3 columns. Positions are numbered from 1.'+code(`Grid = [[1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]]
Set total = 0
FOR r = 1 TO 3
    Set total = total + Grid[r][r]
NEXT r
Display total`),[
 dd('Select the correct item from the dropdown menu to show the value displayed.','The value displayed is {0}.',[[['6','15','18','45'],1]],1,'Grid[1][1], Grid[2][2] and Grid[3][3] are 1, 5 and 9. 1 + 5 + 9 = 15.')]));
qs.push(Q(SEP,'A school is developing an app that students use to borrow laptops. Part of the data dictionary for the app is shown.',[
 P('(a)',gd('Select the correct entries to complete the data dictionary. (3 marks)',['Variable','Example value','Data type','Validation check'],[
  ['laptopTag','LT-077',[['String','Integer','Real','Boolean','Date'],0],[['Range check','Presence check','Type check','Format check'],3]],
  ['daysBorrowed','3',[['String','Integer','Real','Boolean','Date'],1],[['Range check','Presence check','Type check','Format check'],0]],
  ['isReturned','FALSE',[['String','Integer','Real','Boolean','Date'],3],[['Range check','Presence check','Type check','Format check'],2]]],3,'')),
 P('(b)',tx('Outline TWO things that a test plan should include when a software solution is being evaluated. (3 marks)',3,55,'A test plan should list the test data to be used, including values chosen by path and boundary testing, so every part of the code is tested. It should also state the expected output for each test so that the actual output can be compared with it and any difference can be investigated.',['Award up to 2 marks for two items identified and 1 mark for explanation.','Items include: test data from path and boundary testing, expected output, actual output comparison, who will test, the functions to be tested, criteria for passing.']))],{two:true}));
qs.push(Q(SSA,'An airline is developing an application programming interface (API) that lets partner travel sites check flights and make bookings. Each partner site receives a key to use the API.',[
 P('(a)',tx('Explain how input validation, sanitisation and error handling make the API safer. (3 marks)',3,60,'Validation checks that each request has the expected format, such as a valid flight code and date, and rejects anything else. Sanitisation removes or escapes special characters so that input cannot be run as part of a database command. Error handling returns a general message and records the details in a log, so attackers do not learn how the system is built.',['3 marks: explains all three and links each to reducing vulnerabilities.','2 marks: explains two, or all three with limited detail.','1 mark: identifies one.'])),
 P('(b)',tx('Explain how session management can reduce the risk of broken authentication in the API. (3 marks)',3,60,'Each session should use a long random identifier that cannot be guessed, and it should be sent only over HTTPS. Sessions should expire after a short time or when the partner logs out, and the server should end the session so an old identifier cannot be reused. This stops an attacker who steals or guesses an identifier from acting as the partner for long.',['3 marks: explains secure identifiers, expiry or logout, and links them to preventing misuse.','2 marks: explains two ideas with limited links.','1 mark: identifies one idea.'])),
 P('(c)',tx('Explain how exception management and memory management help the API run efficiently for its users. (3 marks)',3,60,'Exception management catches errors, such as a database that is not responding, so one failed request does not crash the service for every user. Memory management releases memory that is no longer needed. This stops the API from slowly using all of the server\'s memory, which would make it slow or make it stop responding.',['3 marks: explains both and links them to efficient or continuous service.','2 marks: explains one well and identifies the other.','1 mark: identifies one.']))],{two:true}));
qs.push(Q(SEP,'A cash machine allows a customer up to three attempts to enter the correct PIN. The correct PIN is stored in the variable <b>correctPin</b>. If the customer enters the correct PIN, the machine displays "Access granted" and does not ask again. After three wrong attempts the machine displays "Card locked".',[
 ps('Using pseudocode, with a REPEAT UNTIL loop, write an algorithm to perform this task.',3,`BEGIN CheckPin
    Set attempts = 0
    Set granted = FALSE
    REPEAT
        Get pin
        Set attempts = attempts + 1
        IF pin = correctPin THEN
            Set granted = TRUE
        ENDIF
    UNTIL granted = TRUE OR attempts = 3
    IF granted = TRUE THEN
        Display "Access granted"
    ELSE
        Display "Card locked"
    ENDIF
END CheckPin`,['1 mark: a loop that reads the PIN and counts the attempts.','1 mark: the loop stops when the PIN is correct or after three attempts.','1 mark: displays the correct message for each outcome.'])],{two:true}));
qs.push(Q(SEP,'',[
 tx('Explain what is meant by code optimisation and why it is carried out.',3,55,'Code optimisation is improving code so that it uses less time, memory or other resources while still giving the same result. For example, a calculation that is repeated inside a loop can be done once before the loop. It is carried out so that programs run faster and work well on devices with limited memory or battery.',['3 marks: defines optimisation, gives an example or technique, and explains the purpose.','2 marks: defines it and gives an example or purpose.','1 mark: states that code is made faster or smaller.'])]));
qs.push(Q(SEP,'A program needs a class named <b>Account</b>. The constructor takes an owner name and a starting balance, and stores the balance in an attribute named <b>balance</b>. The method <b>deposit(amount)</b> adds the amount to the balance. The method <b>withdraw(amount)</b> subtracts the amount only if the balance is large enough, and returns True. Otherwise it leaves the balance unchanged and returns False.',[
 py('Write the Python class <b>Account</b>.',3,'',`class Account:
    def __init__(self, owner, balance):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

    def withdraw(self, amount):
        if amount <= self.balance:
            self.balance -= amount
            return True
        return False`,[{app:'a = Account("Sam", 50)\na.deposit(25)\nprint(a.balance)',o:'75'},{app:'a = Account("Sam", 50)\nprint(a.withdraw(80))\nprint(a.balance)',o:'False\n50'},{app:'a = Account("Sam", 50)\nprint(a.withdraw(20))\nprint(a.balance)',o:'True\n30'}],['1 mark: class with a constructor that stores the owner and the balance.','1 mark: deposit adds to the balance.','1 mark: withdraw checks the balance, updates it only when allowed, and returns True or False.'])],{two:true}));
qs.push(Q(SSA,'',[
 tx('Describe how sandboxing contributes to the \'security by design\' approach.',3,55,'A sandbox runs a program in an isolated space with limited access to the rest of the system, such as files, memory and the network. If the program contains a flaw or is malicious, the damage is contained inside the sandbox. Building the software to run in a sandbox from the start is part of designing it to be secure.',['3 marks: describes isolation, the effect of limiting damage, and links it to design from the start.','2 marks: describes isolation with limited explanation.','1 mark: states that a program is kept separate.'])]));
qs.push(Q(PW,'A medical clinic keeps its doctors and appointments in two related tables.',[
 sq('Construct a SQL query that displays each Clinic and the number of appointments with a Status of \'Attended\'.<br>Use the column headings Clinic and Attended. List the results in alphabetical order of Clinic.',4,`SELECT Clinic, COUNT(*) AS Attended
FROM Doctors
JOIN Appointments ON Doctors.DoctorID = Appointments.DoctorID
WHERE Status = 'Attended'
GROUP BY Clinic
ORDER BY Clinic`,true,['1 mark: joins Doctors and Appointments on DoctorID.','1 mark: filters for Status = \'Attended\'.','1 mark: uses COUNT with GROUP BY Clinic.','1 mark: correct headings and alphabetical ordering by Clinic.'])],{two:true,db:DB21}));
qs.push(Q(SEP,'A thermostat program reads a temperature. If the temperature is below 18, the program displays "Heater on". If the temperature is above 26, the program displays "Fan on". Otherwise the program displays "No action".',[
 dr('Create a flowchart for the thermostat program.',3,'A start terminator, then an input (parallelogram) Get temperature. A decision diamond: temperature below 18? Yes leads to an output Display "Heater on". No leads to a second diamond: temperature above 26? Yes leads to Display "Fan on". No leads to Display "No action". All three outputs join and lead to an end terminator.',['1 mark: start and end terminators with an input of the temperature.','1 mark: two decisions with Yes and No paths correctly labelled.','1 mark: three correct outputs, and every path leads to the end.'])],{two:true}));
qs.push(Q(SSA,'An exam provider runs an online platform where students sit tests. The platform stores student results and answers.',[
 P('(a)',tx('Explain how a vulnerability assessment is different from penetration testing. (3 marks)',3,60,'A vulnerability assessment scans the platform to find and list weaknesses, such as out-of-date software, and ranks them by risk, but it does not use the weaknesses. Penetration testing is carried out by a tester who acts like an attacker and tries to exploit weaknesses to see how far they can get. The assessment shows what may be wrong; the penetration test proves what an attacker could do.',['3 marks: explains both and states a clear difference.','2 marks: explains one well and identifies the other.','1 mark: identifies one.'])),
 P('(b)',tx('Describe how business continuity and disaster recovery plans would help the platform if the system failed during an exam. (3 marks)',3,60,'The business continuity plan keeps exams running, for example by switching to a backup server so students can continue. The disaster recovery plan restores the lost systems and data, for instance by loading the most recent backup of the answers. Together they limit the loss of answers and the time the platform is unavailable.',['3 marks: describes both plans and links them to the scenario.','2 marks: describes one plan well or both with limited detail.','1 mark: identifies one plan.'])),
 P('(c)',gd('For each description, select the type of attack. (3 marks)',['Description','Type of attack'],[
  ['An attacker records how much power a device uses to work out its encryption key',[['File attack','Side-channel attack','Race condition','Cross-site request forgery'],1]],
  ['An attacker uploads a file named ../../app.py to replace a program file on the server',[['File attack','Side-channel attack','Race condition','Cross-site request forgery'],0]],
  ['A hidden form on another page sends a request using the user\'s logged-in session',[['File attack','Side-channel attack','Race condition','Cross-site request forgery'],3]]],3,''))],{two:true}));
qs.push(Q(PW,'A streaming service collects metadata about what each subscriber watches, when they watch it and which device they use. The service uses data mining of this data to recommend shows, to decide which shows to produce and to manage the load on its servers.',[
 tx('Discuss the social and ethical implications of collecting and using this data.',5,110,'Recommendations help subscribers find shows they enjoy and the load planning keeps the service running at busy times. Data mining can also reveal a person\'s habits, such as when they are home, so the data must be protected and used only for the purposes subscribers agreed to. Subscribers should be told what is collected and be able to refuse. Recommendations can place people in a bubble that shows them only similar content. Using the data to decide which shows to produce may favour popular tastes over less common ones. If the data is leaked or sold, subscribers could be harmed.',['5 marks: a sustained discussion of social and ethical implications using the scenario.','3-4 marks: several implications with some links to the scenario.','1-2 marks: identifies implications with limited explanation.','Ideas include: privacy, consent, security, profiling, bias in recommendations, benefits of personalisation, effect on content creators.'])]));
qs.push(Q(SA,'A bank uses a decision tree to decide whether to approve small loans. The inputs are the applicant\'s income, existing debt and length of employment. The tree was built from the results of 20 000 past loans.',[
 tx('Explain how the decision tree makes a decision and how it is built from past data. Include ONE limitation of using a decision tree.',5,110,'A decision tree asks a series of questions about the inputs, such as whether income is above a certain amount. Each answer sends the application down a branch to the next question until it reaches a leaf that gives the decision, for example approve or decline. The tree is built from the 20 000 past loans by choosing the question that best separates the loans that were repaid from those that were not, then repeating this for each branch. A limitation is that a deep tree can fit the past loans too closely, which is overfitting, so it may give poor decisions for new applicants. Small changes in the data can also produce a very different tree.',['5 marks: explains how branches lead to a decision, how the tree is built from past data, and one limitation, with links to the scenario.','3-4 marks: explains the tree with some detail and a limitation with limited links.','1-2 marks: identifies a decision tree or one point only.'])]));
qs.push(Q(SEP,'A program reads a whole number greater than 1 and displays every prime number up to and including that number, one per line. After the list it displays the number of primes found. A prime number is divisible only by 1 and itself.<br>For the number 10 the output is:<pre class="pre">2\n3\n5\n7\nCount: 4</pre>',[
 py('Using Python, write a program that achieves this task.',5,'',`limit = int(input("Enter a number: "))
count = 0
for n in range(2, limit + 1):
    is_prime = True
    for d in range(2, n):
        if n % d == 0:
            is_prime = False
            break
    if is_prime:
        print(n)
        count += 1
print("Count:", count)`,[{i:['10'],o:'2\n3\n5\n7\nCount: 4'},{i:['2'],o:'2\nCount: 1'},{i:['20'],o:'2\n3\n5\n7\n11\n13\n17\n19\nCount: 8'}],['1 mark: reads the number and loops through every number from 2 to the limit.','1 mark: tests each number for factors.','1 mark: correctly decides whether a number is prime.','1 mark: displays each prime on its own line.','1 mark: counts the primes and displays the count after the list.'])],{two:true}));
qs.push(Q(SEP,'A hospital network needs a new patient records system. The law requires the system to meet strict privacy rules. The budget is fixed. Doctors and nurses disagree about how the screens should work.',[
 tx('Evaluate the suitability of the Waterfall, Agile and WAgile approaches for developing this system. In your answer, refer to requirements, feedback from users, and cost and compliance.',6,185,'Waterfall completes each stage before the next, which suits fixed privacy rules and a fixed budget because requirements and costs are planned at the start. Its weakness is that users see the system only at the end, so the disagreement between doctors and nurses about the screens could be found too late and be costly to fix.<br>Agile builds the system in short iterations and gets feedback after each one, so the screens can be adjusted as the two groups try them. However, the scope can keep changing, which makes a fixed budget harder to control and makes it harder to prove that every privacy rule has been met.<br>WAgile combines both. The privacy requirements and the budget can be set and checked in a Waterfall style, while the screens are developed in Agile iterations with feedback from staff. This is the most suitable approach, provided the team agrees when the fixed plan applies and when changes are allowed.',['6 marks: a balanced evaluation of all three approaches covering requirements, feedback, cost and compliance, with scenario links and a justified judgement.','4-5 marks: explains most approaches with scenario links and limited judgement.','2-3 marks: describes some approaches with limited links.','1 mark: identifies an approach only.'])]));
BANKS.push({id:'5',name:'Bank 5',sub:'Security, design and object-oriented focus',qs:qs});
})();
