/* NSW Department of Education Software Engineering Trial Exam 2026.
   Converted question for question from the published paper.
   (c) State of New South Wales (Department of Education), 2025. Licensed CC BY 4.0
   (https://creativecommons.org/licenses/by/4.0/); changed to run in the online exam format.
   Criteria and sample answers for written parts are in public/marking/doe2026.js. */
(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var M=MARKING.doe2026.entries;
function wr(q,m,w,key){return tx(q,m,w,M[key].sample,critOf(M[key]))}
var DBS={
 Products:{c:['product_id','product_name','price'],r:[[1,'Laptop',1000],[2,'Mouse',25],[3,'Keyboard',50]]},
 Customers:{c:['customer_id','customer_name'],r:[[101,'Alice'],[102,'Bob']]},
 Sales:{c:['sale_id','sale_date','product_id','customer_id','quantity'],r:[[1,'2026-01-15',1,101,1],[2,'2026-01-20',2,102,2],[3,'2026-02-10',1,102,1],[4,'2026-02-15',3,101,2],[5,'2026-02-20',2,101,5],[6,'2026-03-05',1,102,2]]}
};
var YN=['Yes','No'];
var qs=[];

/* ---------- Questions 1 to 10: choose one answer ---------- */
qs.push(Q(SEP,'',[mc('Which implementation method involves running both old and new systems simultaneously for the same group of users?',['Direct','Phased','Parallel','Pilot'],2,'Parallel implementation runs the old and new systems at the same time.')]));
qs.push(Q(PW,'',[mc('What step below is not used in data transmission via TCP/IP?',['Use DNS to resolve domain name into IP address','Break down a message into one or more data packets','Encrypting the data packets','Send data packets out using TCP or UDP protocols'],2,'Encryption is not one of the TCP/IP transmission steps. Resolving the name, splitting into packets and sending are.')]));
qs.push(Q(SEP,'',[mc('Which of the following best demonstrates appropriate social and ethical behaviour during the development of a software project?',['Copying code from the internet without acknowledgement to save development time','Collecting user data without permission if it improves the software features','Testing the software thoroughly and protecting user privacy by securely storing personal data','Releasing software quickly even though known security vulnerabilities still exist'],2,'Thorough testing and protecting personal data is the responsible choice.')]));
qs.push(Q(SA,'',[mc('Which of the following statements are correct about decision trees?',['Is an unsupervised learning model','Is a supervised learning model','It is a parametric learning model','Works with only categorical inputs'],1,'A decision tree learns from labelled data, so it is supervised.')]));
qs.push(Q(SEP,'',[mc('Which testing method focuses on checking extreme input values?',['Input Testing','Boundary Value Testing','Integration Testing','System Testing'],1,'Boundary value testing checks values at and around the limits of valid input.')]));
qs.push(Q(SEP,'',[mc('Which of the following best demonstrates effective communication in an agile software development project?',['The development team provides regular updates but limits client involvement to avoid delays','The client is actively involved in discussions, provides ongoing feedback, and requirements are clarified and negotiated throughout the project','User feedback is collected early but not revisited during development to maintain project scope','The development team delivers a complete product at the end, assuming initial requirements were sufficient'],1,'Agile depends on ongoing client involvement and feedback.')]));
qs.push(Q(PW,'Consider the following CSS and HTML code:'+code(`<!DOCTYPE html>
<html>
<head>
<style>
p {
color: blue;
}
.highlight {
color: red;
}
#main {
color: green;
}
</style>
</head>
<body>
<p id="main" class="highlight">Hello World!</p>
</body>
</html>`),[mc('What will be the colour of the text "Hello World!" when displayed in a browser?',['Blue','Red','Green','Black'],2,'An id selector is more specific than a class selector, which is more specific than an element selector, so the id rule (green) wins.')]));
qs.push(Q(SEP,'',[mc('Which of the following best describes a functional requirement?',['The speed at which a system processes data','A specific task the system must perform','The cost of developing the system','The hardware used to run the system'],1,'A functional requirement states something the system must do.')]));
qs.push(Q(PW,'A student notices that a website requesting their banking credentials displays a padlock icon in the browser address bar and uses HTTPS. They conclude it is safe to proceed.',[mc('Which statement <b>best</b> explains why this reasoning is flawed?',['The padlock and HTTPS show that data is encrypted in transit but do not verify that the website is operated by a legitimate organisation','The padlock HTTPS encryption cannot protect financial credentials because banking data requires a separate authentication protocol','The padlock icon confirms that the server’s IP address has been validated by the DNS hierarchy','TLS encryption is only applied after the user submits credentials, leaving the login form exposed'],0,'HTTPS protects data in transit. It does not prove the site belongs to a legitimate organisation, so a phishing site can also show a padlock.')]));
qs.push(Q(SSA,'',[mc('Which of the following is the best practice when designing a safe Application Programming Interface (API) to minimise software vulnerabilities?',['Implement detailed logging of all API requests and responses for debugging purposes','Validate and sanitise all input data before processing','Use client-side validation to ensure only correct data is sent to the API','Return standardised but informative error messages to assist developers'],1,'Validating and sanitising input on the server side is the key defence.')]));

/* ---------- Questions 11 to 16 ---------- */
var STEPS=['1','2','3','4','5','6','7','8'];
qs.push(Q(SSA,'The following steps are part of the secure waterfall software development process, but they are in the wrong order.',[
 gd('Reorder by numbering the steps into the correct sequence in Column B (2 marks)',['Column A','Column B'],[
  ['Testing and debugging',[STEPS,5]],['Requirements definition',[STEPS,0]],['Maintenance',[STEPS,7]],['Design',[STEPS,2]],
  ['Installation',[STEPS,6]],['Development',[STEPS,3]],['Determining specifications',[STEPS,1]],['Integration',[STEPS,4]]],2,'The order is requirements definition, determining specifications, design, development, integration, testing and debugging, installation, maintenance.')]));
qs.push(Q(SEP,'',[gd('Which algorithms are relevant for each of the scenarios<br>Indicate with a Yes or No (2 marks)',['Scenario','Linear Regression','Neural Network','Logistic Regression','Polynomial Regression'],[
  ['Predicting the cost of a house based on how many square metres it has',[YN,0],[YN,0],[YN,1],[YN,0]],
  ['Predicting how far a basketball will travel based on the release angle',[YN,1],[YN,0],[YN,1],[YN,0]],
  ['Recognising handwritten digits for postal code on envelopes',[YN,1],[YN,0],[YN,0],[YN,1]]],2,'House price suits linear, neural network and polynomial models. Basketball distance follows a curve, so neural network and polynomial. Digit recognition is classification, so neural network and logistic regression.')]));
qs.push(Q(SA,'',[mc('Which of the following statements best describes the impact of choosing the value of K in a K-Nearest Neighbours (KNN) classifier?',['Choosing a very low value for K increases the risk of overfitting to noise in the training data.','Selecting a very high value for K always improves the classifier’s accuracy, as it uses more information from the dataset.','K must always be equal to the number of classes present in the dataset to achieve balanced predictions.','The value of K has no effect on the bias-variance trade-off in the KNN algorithm.'],0,'A very small K follows individual noisy points, which overfits.')]));
qs.push(Q(SSA,'',[tk('Identify properties of a hash value and a digital signature in secure software systems.<br>Select all that apply. (3 marks)',['Property','Hash value','Digital signature'],[
  ['Prevents the sender from denying it (non-repudiation)',[1]],
  ['Uses hashing and encryption to prove who sent the data (authenticity)',[1]],
  ['Ensures data has not been changed (integrity)',[0,1]]],3,'Only a digital signature provides non-repudiation and authenticity. Both a hash value and a digital signature support integrity.')]));
qs.push(Q(SA,'',[ms('Which of the following machine learning models are suitable for classification problems?<br>Select ALL that apply. (2 marks)',['Decision tree','Neural network','Linear regression','Logistic regression','K-nearest neighbours (KNN)','Polynomial regression'],[0,1,3,4],2,'Decision trees, neural networks, logistic regression and KNN classify. Linear and polynomial regression predict continuous values.')]));
qs.push(Q(SEP,'Consider the following algorithm.'+code(`BEGIN
    word = "SOFTWARE"
    index = 1
    result = ""
    WHILE index <= LENGTH(word)
        IF index MOD 2 = 0 THEN
            result = result + SUBSTRING(word, index - 1, 1)
        END IF
        index = index + 1
    END WHILE
    PRINT result
END`)+'<p><b>Note:</b> The SUBSTRING function extracts a portion of a string starting from a given index for a specified length.</p><p>In the algorithm, SUBSTRING(word, index - 1, 1) extracts one character from word beginning at position index - 1.</p><p>Assume string indexing begins at zero.</p>',[
 wr('Desk check this algorithm to show the final value printed (3 Marks)',3,100,'16')],{two:true}));

/* ---------- Questions 17 to 27 ---------- */
qs.push(Q(SSA,'Fountain Meadow High School is developing a mobile app that allows students and teachers to:'+bl(['log in with a username and password','view and update student details','access assessment results','store data in the cloud'])+'The system must protect sensitive student information and comply with privacy laws.',[
 P('Part A',wr('Select and justify a machine-readable data format for transferring assessment results to the front end. (3 marks)',3,75,'17a')),
 P('Part B',wr('Explain how <i>TWO</i> security features can be applied in this software application to ensure data protection, privacy, and regulatory compliance. (4 marks)',4,100,'17b'))],{two:true}));
qs.push(Q(SEP,'A school tutoring centre is developing a web-based booking system to manage student data, tutor availability, lesson bookings and payments.<p>The lesson booking process involves:</p>'+bl(['Students log into the tutoring centre’s booking site using a student ID and password.','They are shown a list of available lesson times and tutors.','Students choose a suitable lesson time.','Students receive an email confirmation of their booking.','Each morning, tutors receive a printed schedule of their lessons for the day.']),[
 dr('Create a Level 0 Data Flow Diagram for the lesson booking process. (2 marks)',2,M['18'].sample,critOf(M['18']),'dfd')],{two:true}));
qs.push(Q(PW,'',[wr('Describe three of the key principles of Web Accessibility Initiative (WAI) and give an example of each principle. (3 marks)',3,100,'19')]));
qs.push(Q(SA,'A streaming service is developing an ML system to predict user ratings for movies (1-5 stars).<p>They have collected data on 1,000 movies including: genre, runtime, year released, and user ratings.</p>',[
 P('Part A',mc('Which learning model would be most suitable for predicting movie ratings from historical data? (1 mark)',['Reinforcement learning — to improve predictions through trial and error','Unsupervised learning — to find patterns without known outcomes','Supervised learning — to learn from data with known rating outcomes','Semi-supervised learning — to use mostly unlabelled movie data'],2,'The historical ratings are known outcomes, so supervised learning fits.')),
 P('Part B',gd('The streaming service is considering three regression models. (Linear, Polynomial and Logistic)<br>Match each model to the most appropriate description: (2 marks)',['Description','Model'],[
  ['Assumes a straight-line relationship between input variables and output',[['Linear regression','Polynomial regression','Logistic regression'],0]],
  ['Predicts outcomes in two categories (e.g., yes/no, high/low)',[['Linear regression','Polynomial regression','Logistic regression'],2]],
  ['Fits a curved line to data where the relationship is non-linear',[['Linear regression','Polynomial regression','Logistic regression'],1]]],2,'Linear fits a straight line, logistic predicts two categories, polynomial fits a curve.')),
 P('Part C',wr('The training dataset was collected primarily from active users aged 18-35.<br>Casual viewers and older users are underrepresented.<br>Explain one problem this dataset source bias could cause and suggest one strategy to reduce this bias in future model development. (3 marks)',3,75,'20c'))],{two:true}));
qs.push(Q(SSA,'',[wr('Compare cross-site scripting (XSS) and cross-site request forgery (CSRF). (3 marks)',3,100,'21')]));
qs.push(Q(PW,'A business use three tables to store the products, customers and sales data. The contents of the tables in the testing environment are shown.<p>The contents of a sales report need to be displayed as follows.</p>'+
 tbl(['SalesMonth','ProductName','TotalQuantity','TotalRevenue'],[['2026-01','Laptop','1','1000'],['2026-01','Mouse','2','50'],['2026-02','Laptop','1','1000'],['2026-02','Mouse','5','125'],['2026-02','Keyboard','2','100'],['2026-03','Laptop','2','2000']]),[
 P('Part A',sq('Write an SQL query that can produce this result. (4 marks)',4,M['22a'].sample,false,critOf(M['22a']))),
 P('Part B',wr('The development team is considering migrating the web application from raw SQL to an Object-Relational Mapper (ORM).<br>Evaluate whether an ORM or raw SQL is the more appropriate choice for generating the monthly sales report. (4 marks)',4,120,'22b'))],{two:true,db:DBS}));
qs.push(Q(SSA,'DataVault is developing a progressive web application that lets users upload, store, and share sensitive files such as financial and personal documents.<p>During testing, security analysts identified risks including:</p>'+bl(['Malicious file uploads','Unauthorised access to cached files','Timing differences in encryption processes leaking information','Too much system information shown in error messages']),[
 P('Part A',wr('Explain the process and techniques used for developing secure code protected against the identified file-based attacks. (3 marks)',3,150,'23a')),
 P('Part B',wr('Describe techniques that can be used to protect against the identified side-channel attacks. (2 marks)',2,75,'23b')),
 P('Part C',wr('How would the development team ensure the quality of the software before release? (3 marks)',3,120,'23c'))],{two:true}));
qs.push(Q(SA,'A government agency proposes deploying an ML model to prioritise funding for road upgrades in a rural community. The model will be trained on historical maintenance data.',[
 wr('Evaluate social and ethical - implications of this proposal. (4 Marks)',4,120,'24')],{two:true}));
qs.push(Q(SEP,'A weather station records temperatures for 5 days. Each day has 3 temperature recordings:'+bl(['morning,','afternoon,','evening'])+'The temperature values are shown below.:'+bl(['18 24 20','17 22 19','19 25 21','16 23 18','20 27 22']),[
 py('Write a Python program that:<br>&bull; stores the temperature values in a 2D list<br>&bull; prints the 2D list in a clear table format<br>&bull; uses nested loops to iterate through the 2D list<br>&bull; calculates and displays:<br>&nbsp;&nbsp;&nbsp;&nbsp;&ndash; the highest temperature<br>&nbsp;&nbsp;&nbsp;&nbsp;&ndash; the lowest temperature<br>&nbsp;&nbsp;&nbsp;&nbsp;&ndash; the average temperature (rounded to 2 decimal places)<br>(5 marks)',5,'',M['25'].sample,[],critOf(M['25']))],{two:true}));
qs.push(Q(PW,'A wellbeing app "Digital Detox Companion" is to be designed to display real-time updates such as:'+bl(['App usage record (manually entered or collected data)','Focus timer start/end alarm','Offline activities suggestions (walk, read, stretch)']),[
 P('Part A',wr('Compare the use of a progressive web app (PWA) with an interactive website, for delivering this wellbeing app. (3 Marks)',3,100,'26a')),
 P('Part B',wr('Describe ONE way that the ‘privacy by design’ approach could be implemented in this wellbeing app. (2 marks)',2,60,'26b'))],{two:true}));
qs.push(Q(SA,'<p>With reference to this AI-generated image, evaluate the positive and negative impacts of AI on the environment. (6 marks)</p>'+
 fig('AI-generated image','<img src="doe2026-q27.jpg" alt="An AI-generated illustration with wind turbines, solar panels, a field of sunflowers, a glowing digital globe, a light bulb and a tree. Text in the image reads AI, Smot Grids, Climate Change and Sustainable Tracking Emissions.">'),[
 wr('Positive and negative impacts of AI on the environment.',6,200,'27')],{two:true}));

BANKS.push({id:'9',name:'DoE 2026 Trial',sub:'NSW DoE Trial Exam 2026',trial:true,questions:27,credit:'© State of New South Wales (Department of Education), 2025. Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). Converted to the online exam format.',qs:qs});
})();
