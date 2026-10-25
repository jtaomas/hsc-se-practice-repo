/* Syllabus Mock 4. Original paper, one of five (banks 14 to 18) that together cover
   the whole Year 12 Software Engineering syllabus. Layout follows the 2025 HSC:
   27 questions, 80 marks. See docs/SYLLABUS_MOCKS.md for the coverage map. */
(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var DB21={
 Authors:{c:['AuthorID','Name'],r:[['W1','Mia Tran'],['W2','Josh Kelly'],['W3','Aroha Ngata'],['W4','Sam Price']]},
 Articles:{c:['ArticleID','Title','Section','AuthorID','Views'],r:[
  ['A01','Bulldogs win final','Sport','W1',2400],['A02','Rain delays harvest','Rural','W2',1800],['A03','Netball clinic opens','Sport','W1',950],
  ['A04','Grand final preview','Sport','W2',3100],['A05','Junior cricket results','Sport','W3',1200],['A06','Show day guide','Events','W3',5000],
  ['A07','Swim club records','Sport','W1',1005],['A08','Coach steps down','Sport','W2',1000],['A09','Racing carnival','Sport','W4',1500],
  ['A10','Golf day','Sport','W3',2100]]}};
var NOTES=`import os

# Do not change these lines. They create the notes folder.
os.makedirs("notes", exist_ok=True)
for name, text in [("todo.txt", "Fix login"), ("ideas.txt", "Dark mode"),
                   ("logo.png", "PNGDATA"), ("bugs.txt", "Crash on save")]:
    with open("notes/" + name, "w") as f:
        f.write(text)
`;
var qs=[];

/* ---------- Questions 1 to 11: 1 mark each ---------- */
qs.push(Q(SEP,'A university introduces a new learning platform. For one semester, only the Faculty of Engineering uses it, with all of its features. After that semester, every other faculty changes over at the same time.',[
 mc('Which implementation method is being used?',['Direct','Pilot','Phased','Parallel'],1,'A pilot introduces the complete system to one group first, so problems can be fixed before everyone else changes over. Phased would introduce parts of the system one at a time.')]));
qs.push(Q(PW,'Consider the following HTML and cascading style sheet (CSS) code.'+files([['index.html',`<h2 id="sale">Winter sale</h2>
<p class="note">Ends Friday</p>
<p>All boards <span class="note">30% off</span></p>`],['style.css',`/* Headings */
h2 {
    color: navy;
}
#sale {
    color: crimson;
    font-style: italic;
}
.note {
    font-weight: bold;
}
p {
    color: grey;
}`]]),[
 mc('Which of the following best describes how the text is displayed?',['"Winter sale" is crimson and italic; "Ends Friday" is grey and bold; only "30% off" in the last line is bold','"Winter sale" is navy and italic; "Ends Friday" is grey and bold; the whole last line is grey and bold','The words "Headings" appear above "Winter sale"; all three lines are grey, and none of the text is bold','"Winter sale" is crimson and not italic; "Ends Friday" is bold and black; "30% off" is grey and not bold'],0,'The #sale id rule is more specific than the h2 rule, so the heading is crimson and italic. Both paragraphs are grey. The .note class makes "Ends Friday" and the span "30% off" bold, and the span takes the grey colour from its paragraph. Text inside /* */ is a comment and is not displayed.')],{two:true}));
qs.push(Q(SEP,'The following data flow diagram models a smartcard top-up system.'+fig('Level 0 data flow diagram','<svg viewBox="0 0 520 250" width="520" role="img" aria-label="Level 0 data flow diagram of a smartcard top-up system"><defs><marker id="ah17" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#333"/></marker></defs><g font-family="Arial" font-size="12" fill="#000"><rect x="15" y="105" width="90" height="40" fill="#fff" stroke="#333"/><text x="60" y="130" text-anchor="middle">Rider</text><rect x="415" y="105" width="90" height="40" fill="#fff" stroke="#333"/><text x="460" y="130" text-anchor="middle">Bank</text><circle cx="260" cy="125" r="55" fill="#fff" stroke="#333"/><text x="260" y="121" text-anchor="middle">Card top-up</text><text x="260" y="137" text-anchor="middle">system</text>'+
 '<path d="M95,105 C140,40 170,60 210,95" fill="none" stroke="#333" marker-end="url(#ah17)"/><text x="80" y="55">Card number, top-up amount</text>'+
 '<path d="M210,158 C170,205 130,195 95,147" fill="none" stroke="#333" marker-end="url(#ah17)"/><text x="105" y="212">Receipt, new balance</text>'+
 '<path d="M310,98 C350,55 390,60 425,104" fill="none" stroke="#333" marker-end="url(#ah17)"/><text x="335" y="52">Payment request</text>'+
 '<path d="M425,147 C390,200 350,195 310,153" fill="none" stroke="#333" marker-end="url(#ah17)"/><text x="330" y="212">Payment approval</text></g></svg>'),[
 ms('Which of the following statements about this diagram are correct?<br>(More than one may be selected.)',['The Rider receives a receipt and new balance from the system.','The whole system is shown as a single process.','The Bank is an external entity that provides data to the system.','A data store for card balances is missing and must be added to this diagram.','Each rectangle represents a process.'],[0,1,2],1,'A Level 0 data flow diagram shows the whole system as one process with its external entities (rectangles) and labelled data flows. It does not show data stores or internal processes, so nothing is missing.')],{two:true}));
qs.push(Q(SSA,'A program written in a low-level language copies a user\'s name into a memory area reserved for 32 characters, without checking how long the name is.',[
 mc('Which is the best way to manage the risk this creates?',['Show a more detailed error message to the user when the name is long','Increase the reserved area to 64 characters so that longer names fit','Check the length before copying, or use a function that enforces the limit','Encrypt the name before copying it into the reserved memory area'],2,'Copying unchecked input into a fixed-size area can overflow into neighbouring memory (a buffer overflow). Good memory management checks bounds or uses tools that enforce them; a bigger buffer only moves the limit.')]));
qs.push(Q(PW,'A back-end developer writes the following code.'+code(`order = Order.get(id=42)
order.status = "shipped"
order.save()`),[
 mc('Which statement about this code is correct?',['The developer must also write the matching SQL statement by hand for save() to work','The code only works with a non-SQL database, because it contains no SELECT or UPDATE statement','The code bypasses the database and saves the order object into a text file on the server','An object-relational mapper (ORM) maps the Order class to a table and generates the SQL to update the row'],3,'With an ORM, developers work with objects in their programming language and the ORM translates their actions into SQL queries on the relational database.')],{two:true}));
qs.push(Q(SSA,'Before any code is written for a fitness app, the team assesses how personal data could be misused and plans controls for each risk.',[
 mc('Which privacy by design principle does this BEST demonstrate?',['Visibility after release','Security through obscurity','Proactive not reactive','Respect for user privacy'],2,'Anticipating and preventing privacy risks before they occur, rather than responding after a breach, is the proactive not reactive principle.')]));
qs.push(Q(SA,'',[
 mc('How can machine learning support DevOps?',['By replacing the version control system with an automatically trained model','By writing the full requirements document for the client at the start of the project','By removing the need for developers to test their code before each release','By analysing build and monitoring data to predict failing releases and detect unusual behaviour'],3,'DevOps automates building, testing and deploying software. ML adds prediction and anomaly detection, for example flagging a risky release or an unusual spike in errors.')]));
qs.push(Q(SEP,'Consider the following Python code.'+code(`def total(prices):
    if prices == []:
        return 0
    return prices[0] + total(prices[1:])

discount = lambda p: p * 0.9
sale = list(map(discount, [10, 20, 30]))
print(total(sale))`),[
 mc('Which statement about this code is correct?',['It shows features of the functional paradigm, recursion and functions passed as values, and displays 54.0','It shows features of the object-oriented paradigm, because discount is an object, and displays 60','It shows features of the functional paradigm, recursion and functions passed as values, and displays 60','It shows features of the logic paradigm, because total is defined by facts and rules, and displays 54.0'],0,'total calls itself (recursion), and the discount function is passed to map as a value (functions as first-class objects). Each price is reduced by 10% to 9, 18 and 27, which total 54.0.')],{two:true}));
qs.push(Q(SEP,'A team will present its finished software solution to the client using presentation software.',[
 mc('Which approach is the most effective?',['Reading the full 30-page project report aloud from the slides','Concise slides with screenshots, a live demonstration and time for questions','Animations on every line of text to keep the audience interested throughout','Slides containing the complete source code so the client can check every function'],1,'A presentation should be tailored to the audience: concise slides, visuals and a demonstration show the client what the solution does and invite feedback.')]));
qs.push(Q(PW,'',[
 ms('Which of the following statements about securing the web are correct?<br>(More than one may be selected.)',['Plain text and cipher text contain the same readable characters','TLS uses asymmetric encryption to agree a symmetric session key, which encrypts the rest of the session','An SSL/TLS certificate links a website\'s public key to its domain name and is signed by a certificate authority','Data encrypted with a public key can only be decrypted with the matching private key','A valid certificate guarantees that the website\'s owner is honest'],[1,2,3],1,'Certificates bind a public key to a domain; public and private keys work as a pair; TLS combines asymmetric key exchange with fast symmetric encryption. Cipher text is unreadable, and a certificate proves identity, not honesty.')]));
qs.push(Q(SEP,'A developer draws a class diagram in a modelling tool. The tool then creates the matching Python classes, with their attributes and empty methods, automatically.',[
 mc('Which development tool does this describe?',['A storyboard','Installation','A data dictionary','Code generation'],3,'Code generation tools produce source code automatically from a model or template, saving time and keeping the code consistent with the design.')]));

/* ---------- Questions 12 and 13: 2 marks each ---------- */
qs.push(Q(SSA,'Security is considered at every step of developing software.',[
 dm('Match each security activity to the software development step in which it takes place by dragging the labels into the boxes.',['Determining specifications','Integration','Testing and debugging','Installation','Maintenance'],[
  ['Stating precisely that passwords must have at least 12 characters and that sessions expire after 15 minutes of inactivity',0],
  ['Checking that the login module and the payments module exchange data securely once they are combined',1],
  ['Sending random, malformed input to every form to find crashes',2],
  ['Deploying with secure default settings and removing sample accounts from the production server',3],
  ['Applying a security patch after a vulnerability is found in a library the system uses',4]],2,{why:'Specifications make security requirements precise; integration checks modules together; testing hunts for faults; installation sets up the live system securely; maintenance responds to new vulnerabilities.'})]));
qs.push(Q(SEP,'A train company is testing new ticketing software before release.',[
 dm('Match each testing activity to the method being used by dragging the labels into the boxes.',['Functional testing','Acceptance testing','Live data','Simulated data','Beta testing','Volume testing'],[
  ['Checking that buying a concession ticket produces the correct fare and ticket, as the requirements state',0],
  ['The train company\'s managers try the finished system and formally sign it off as meeting their needs',1],
  ['Real ticket sales from yesterday are fed into the new system and its totals are compared with the old system',2],
  ['A program generates 2000 made-up journeys, including unusual combinations, to run through the system',3],
  ['The app is released to 500 volunteer passengers, who report problems before the public release',4],
  ['The system is loaded with ten years of fare records and 50 000 tickets per hour to check that it copes',5]],2,{why:'Functional testing checks that each function meets its requirement; acceptance testing is the client signing off; live data is real data; simulated data is made up to cover cases; beta testing uses real users before release; volume testing checks performance with large amounts of data.'})]));

/* ---------- Question 14: 1 mark ---------- */
qs.push(Q(SEP,'Consider the following algorithm.'+code(`BEGIN mystery(n)
    result = 0
    WHILE n > 0
        result = result * 10 + n MOD 10
        n = INT(n / 10)
    ENDWHILE
    RETURN result
END mystery

Display mystery(4072)`),[
 dd('Select the correct item from the dropdown menu to show the value displayed.','The value displayed is {0}.',[[['274','2704','2740','4072'],1]],1,'Each pass takes the last digit of n (n MOD 10) and appends it to result: 2, 27, 270, 2704. The function reverses the digits, keeping the zero.')],{two:true}));

/* ---------- Question 15: 6 marks ---------- */
qs.push(Q(SEP,'A TAFE is developing <b>TutorLink</b>, an app that lets students book sessions with peer tutors. Sessions take place in a video-call product that the TAFE already uses.',[
 P('(a)',mt('Classify each statement about TutorLink. (3 marks)',['Statement','Functional requirement','Performance requirement','Outside the system boundary'],[
  ['Students can book a 30-minute session with an available tutor',0],
  ['Search results appear within 2 seconds when 500 people are searching at once',1],
  ['Tutors receive a reminder notification one hour before a session',0],
  ['The video-call software used during the sessions',2],
  ['The app supports 2000 users during exam weeks without slowing down',1],
  ['Paying tutors through the TAFE\'s payroll system',2]],3,'Functional requirements describe what the system does; performance requirements describe how well (speed, capacity). Existing external systems the app does not include are outside its boundary.')),
 P('(b)',tx('TutorLink will replace a paper booking system used at five campuses. Recommend either phased or parallel implementation for TutorLink, and justify your recommendation. (3 marks)',3,65,'Phased implementation is recommended. Features can be introduced one at a time, for example tutor profiles first, then booking, then reminders, so staff and students learn the app gradually and problems in one feature affect only that part. Parallel implementation would require every booking to be recorded on paper and in the app, which doubles the work for busy students and tutors, and conflicting records would cause double bookings. Because a fault in a booking app is inconvenient rather than dangerous, the cost of running both systems is not justified.',['1 mark: makes a clear recommendation of phased or parallel implementation.','1 mark: explains how the chosen method would work for TutorLink.','1 mark: justifies the choice by comparing it with the alternative (eg cost, workload, risk).']))],{two:true}));

/* ---------- Question 16: 9 marks ---------- */
qs.push(Q(PW,'<b>The Valley Courier</b>, a regional newspaper, is rebuilding its website. A front-end team is designing the pages and a back-end team is building the systems that store articles and subscriptions. The site publishes about 80 articles a day, and its events listing is often copied by hand onto regional tourism websites.',[
 P('(a)',tx('Describe how collaborative work practices between the front-end and back-end developers would improve the development of the new site. (3 marks)',3,65,'The two teams should agree an API contract early, defining the data each endpoint returns, such as an article\'s title, author, date and body as JSON. The front end can then build pages against sample data while the back end builds the real endpoints, so both teams work in parallel. Shared version control, joint stand-up meetings and code reviews mean changes to the contract are discussed before they break the other team\'s work, giving a better solution with fewer integration problems.',['1 mark: a relevant collaborative practice (eg agreed API contract, shared repository, regular meetings).','1 mark: a second practice or how the practice operates between the teams.','1 mark: explains how it improves development (eg parallel work, fewer integration errors, quality).'])),
 P('(b)',tx('Explain how a template engine and a front-end framework could be used to display the newspaper\'s articles consistently. (3 marks)',3,65,'A template engine lets the back end use one article template with placeholders for the headline, author, date and body. For each request it fills the placeholders with that article\'s data, so all 80 daily articles have the same structure without separate HTML files. A front-end framework provides reusable components and predesigned CSS classes, for example a story card used on the home page and section pages, so layouts look the same and respond consistently on phones and computers.',['1 mark: explains a template engine filling a layout with data for each article.','1 mark: explains how a front-end framework provides reusable components or styles.','1 mark: links both to consistency and efficiency for many articles.'])),
 P('(c)',tx('Explain why the newspaper should publish its events listing as machine-readable data, and how the World Wide Web Consortium (W3C) supports this. (3 marks)',3,65,'If events are published in a structured, machine-readable format such as JSON or structured data embedded in the page, tourism sites and search engines can read the date, venue and price automatically, instead of staff copying text by hand. Listings stay accurate and update everywhere when the newspaper changes them. The W3C develops open standards for machine-readable data and linked data, so any software can interpret the data in the same way.',['1 mark: identifies machine-readable data as structured data that software can process.','1 mark: explains a benefit for the newspaper or the tourism sites.','1 mark: explains the role of W3C standards.']))],{two:true}));

/* ---------- Questions 17 to 19 ---------- */
qs.push(Q(SEP,'A city train network charges fares as follows.'+bl(['A trip that starts in a peak hour costs $3.80. Peak hours are those starting at 7, 8, 16, 17 or 18.','Any other trip costs $2.66.','The total for one day can never be more than $17.80.'])+'<p>An algorithm is needed that reads the number of trips taken in a day and the starting hour of each trip (a whole number from 0 to 23), then displays the total fare for the day.</p>',[
 ps('Write the algorithm using pseudocode. Include at least one subroutine in your answer. You may assume that all inputs are valid.',3,`BEGIN dailyFares
    Get numTrips
    total = 0
    FOR i = 1 TO numTrips
        Get hour
        total = total + tripFare(hour)
    NEXT i
    IF total > 17.80 THEN
        total = 17.80
    ENDIF
    Display "Total fare: $", total
END dailyFares

BEGIN tripFare(hour)
    IF (hour >= 7 AND hour <= 8) OR (hour >= 16 AND hour <= 18) THEN
        fare = 3.80
    ELSE
        fare = 2.66
    ENDIF
    RETURN fare
END tripFare`,['1 mark: a loop that reads each trip\'s hour and adds its fare to the total.','1 mark: a correctly defined and called subroutine that returns the peak or off-peak fare.','1 mark: applies the daily cap and displays the total once.'])],{two:true}));
qs.push(Q(SSA,'A photo-editing web application lets users upload very large images and apply filters in the browser and on the server.',[
 tx('Describe how memory management and exception management can improve the user\'s experience of this application.',3,65,'Memory management means allocating only the memory each task needs and releasing it when finished, for example processing a large image in sections and freeing it after the filter is applied. This prevents the app slowing down or crashing as users edit several photos, and avoids memory leaks on the server affecting other users. Exception management catches errors such as an unsupported file type or a failed upload, keeps the user\'s work and shows a clear message so they can try again, instead of the app crashing or losing edits.',['1 mark: describes memory management (allocating and releasing memory, avoiding leaks).','1 mark: describes exception management (catching and handling errors gracefully).','1 mark: links both to a better experience for the user (speed, stability, no lost work).'])]));
qs.push(Q(SSA,'Users can upload files to a web application. Before a file is saved, its name must be made safe:'+bl(['Keep only the part of the name after the last <code>/</code>.','Remove every character that is not a letter, a digit, a full stop, a hyphen or an underscore.','If the result is empty or begins with a full stop, the name is <code>invalid</code>.'])+tbl(['Name supplied','Safe name'],[['report.pdf','report.pdf'],['../../etc/passwd','passwd'],['my photo (1).jpg','myphoto1.jpg'],['uploads/.htaccess','invalid']]),[
 py('Write a function <code>safe_filename(name)</code> in Python that returns the safe name, or the string <code>invalid</code>.',3,'def safe_filename(name):\n    ',`def safe_filename(name):
    name = name.split("/")[-1]
    cleaned = ""
    for ch in name:
        if ch.isalnum() or ch in ".-_":
            cleaned = cleaned + ch
    if cleaned == "" or cleaned[0] == ".":
        return "invalid"
    return cleaned`,[{app:'\nprint(safe_filename("report.pdf"))',o:'report.pdf'},{app:'\nprint(safe_filename("../../etc/passwd"))',o:'passwd'},{app:'\nprint(safe_filename("my photo (1).jpg"))',o:'myphoto1.jpg'},{app:'\nprint(safe_filename("uploads/.htaccess"))',o:'invalid'},{app:'\nprint(safe_filename("../"))',o:'invalid'},{app:'\nprint(safe_filename("notes<script>.txt"))',o:'notesscript.txt'}],['1 mark: removes everything up to and including the last /.','1 mark: keeps only letters, digits, full stops, hyphens and underscores.','1 mark: returns invalid for an empty result or a leading full stop, and the safe name otherwise.'])],{two:true}));

/* ---------- Questions 20 to 22 ---------- */
qs.push(Q(SA,'',[
 tx('Explain how unsupervised learning could help a TAFE identify groups of students who may need extra support. Include ONE risk of this approach.',3,65,'An unsupervised algorithm is given unlabelled data such as log-in frequency, time spent on tasks and late submissions. It groups students whose patterns are similar into clusters without being told what to look for. Staff can then examine the clusters, for example one with falling log-ins and many late tasks, and offer support early. A risk is that the clusters have no built-in meaning, so staff may misinterpret them or unfairly label students, for example those who study offline, so groups must be reviewed by people and not used to make automatic decisions.',['1 mark: unsupervised learning finds patterns or clusters in unlabelled data.','1 mark: explains how the clusters identify students needing support.','1 mark: a valid risk (eg misinterpretation, unfair labelling, privacy).'])]));
qs.push(Q(PW,'The Valley Courier stores its authors and articles in two related tables, Authors and Articles.',[
 sq('Construct a SQL query that displays the name of each author and the number of their articles in the Sport section that have more than 1000 views.<br>Use the column headings Name and PopularArticles. List the results from the highest to the lowest number of articles, and list authors with the same number in alphabetical order of name.',4,`SELECT Authors.Name, COUNT(*) AS PopularArticles
FROM Authors, Articles
WHERE Authors.AuthorID = Articles.AuthorID
AND Articles.Section = 'Sport' AND Articles.Views > 1000
GROUP BY Authors.Name
ORDER BY PopularArticles DESC, Authors.Name ASC`,true,['1 mark: links Authors and Articles on AuthorID (in the WHERE clause or with a JOIN).','1 mark: WHERE clause selects Sport articles with more than 1000 views.','1 mark: groups by author and counts with the required headings.','1 mark: orders by count descending, then name ascending.'])],{two:true,db:DB21}));
qs.push(Q(SEP,'The Valley Courier\'s digital subscription system works as follows.'+bl(['A <b>Reader</b> sends subscriber details to the <b>Register subscriber</b> process, which stores a subscriber record in the <b>Subscribers</b> data store.','The Reader sends card details to the <b>Process payment</b> process. It sends a payment request to the external <b>Payment gateway</b>, which returns a payment confirmation.','Process payment stores a payment record in the <b>Payments</b> data store and updates the subscriber\'s status in Subscribers.','The <b>Send newsletter</b> process reads active subscriber emails from Subscribers and sends the newsletter to each Reader.']),[
 dr('Create a data flow diagram for the subscription system. Show the processes, external entities and data stores.',3,'Three processes drawn as circles: 1 Register subscriber, 2 Process payment, 3 Send newsletter. Two external entities (rectangles): Reader and Payment gateway. Two data stores (rectangles open on one side): Subscribers and Payments. Labelled, curved arrows for the data flows: Reader to Register subscriber (subscriber details); Register subscriber to Subscribers (subscriber record); Reader to Process payment (card details); Process payment to Payment gateway (payment request); Payment gateway to Process payment (payment confirmation); Process payment to Payments (payment record); Process payment to Subscribers (subscription status); Subscribers to Send newsletter (active subscriber emails); Send newsletter to Reader (newsletter).',['1 mark: the three processes (circles), two external entities (rectangles) and two data stores drawn with the correct symbols.','1 mark: data flows connect the correct components in the correct directions.','1 mark: every data flow is labelled with the data it carries.'],'dfd')],{two:true}));

/* ---------- Question 23: 9 marks ---------- */
qs.push(Q(SA,'A city council receives 300 development applications (DAs) a month, mostly as PDF forms.'+bl(['Software robots open each PDF, copy the details into the council\'s planning system and request missing documents by email.','The council\'s whole approval workflow is being redesigned so that each application is routed automatically to the right teams, with deadlines and notifications.','Machine learning will predict how many days each application will take, and flag applications that are likely to be incomplete.']),[
 P('(a)',tx('Distinguish between robotic process automation (RPA) and business process automation (BPA) in this scenario, and explain how machine learning enhances them. (3 marks)',3,65,'RPA uses software robots to copy repetitive tasks a person performs on screen, such as opening each PDF and typing details into the planning system, without changing the underlying process. BPA redesigns and automates the whole workflow across teams, such as routing each DA, setting deadlines and sending notifications. Machine learning adds judgement to both: it lets RPA read varied, messy forms and lets BPA prioritise and route applications using predictions of processing time and completeness.',['1 mark: describes RPA as software robots performing repetitive rule-based tasks, linked to the scenario.','1 mark: describes BPA as automating an end-to-end business process, linked to the scenario.','1 mark: explains how ML enhances RPA or BPA here.'])),
 P('(b)',tx('Explain how a logistic regression model could be used to flag applications that are likely to be incomplete. (3 marks)',3,65,'The model is trained on past applications labelled complete or incomplete, using features such as the number of attached documents, the type of development and whether key fields are blank. It learns a weight for each feature, combines them and passes the result through a sigmoid function, giving a probability between 0 and 1 that an application is incomplete. Applications above a threshold, such as 0.7, are flagged for staff to request missing documents early.',['1 mark: trained on labelled past applications with relevant features.','1 mark: outputs a probability using a weighted sum and sigmoid function.','1 mark: a threshold is used to classify and flag the application.'])),
 P('(c)',dm('The council\'s data team will develop the processing-time model using machine learning operations (MLOps). Drag each activity into the box that shows the MLOps stage it belongs to. (3 marks)',['Design','Model development','Operations'],[
  ['Turning "staff cannot predict DA workloads" into "predict the number of days each DA will take"',0],
  ['Agreeing that predictions must be within five days for 80% of applications',0],
  ['Cleaning past DA records by removing duplicates and fixing missing dates',1],
  ['Creating a new feature, "number of attached documents", from the raw application files',1],
  ['Checking the trained model\'s accuracy on applications it has not seen before',1],
  ['Watching the model\'s accuracy each month after release and retraining it when accuracy falls',2]],3,{reuse:true,why:'Design defines the business problem, turns it into a machine learning problem and sets success metrics. Model development covers data wrangling, feature engineering, training, testing and validation. Operations deploys, supports and monitors the model.'}))],{two:true}));

/* ---------- Questions 24 to 27 ---------- */
qs.push(Q(SEP,'TutorLink has been beta tested by students at two campuses. The survey results are shown. In addition, 20% of testers did not finish setting up their accounts.'+tbl(['Feature','Average rating (1 to 5)','Responses','Typical comments'],[
 ['Booking a session','4.4','120','"Quick." "Easy to use."'],
 ['Finding a tutor by subject','2.1','118','"Shows tutors from the wrong campus." "Too many filters."'],
 ['Reminders','3.0','95','"The reminder arrived after my session had started."'],
 ['Accessibility','2.6','40','"Doesn\'t work with my screen reader." "Text is too small."']]),[
 tx('Analyse the feedback and recommend how the development team should respond. In your answer, outline how the feedback should be synthesised into a report.',5,110,'The feedback shows that booking works well (4.4 from 120 responses), but finding a tutor is the biggest problem: it has the lowest rating from almost every tester, and the comments point to a defect (campus filtering) and a usability issue (too many filters). Reminders arriving late is a functional fault, probably a time-zone or scheduling error. Accessibility has few responses, but serious comments, and screen-reader failure excludes some students entirely and may breach accessibility requirements. The 20% who did not finish set-up suggests the onboarding process needs investigation.<br>The team should prioritise fixing the campus filter and simplifying search, correct the reminder timing, and fix screen-reader and text-size issues to meet WCAG, then retest these features with users, including students who use assistive technology.<br>The report should synthesise the feedback by grouping comments into themes, combining ratings with response numbers to show how widespread each issue is, ranking issues by severity and frequency, linking each to a requirement, and listing recommended actions, owners and how success will be measured.',['5 marks: analyses the feedback in detail, identifying priorities using both ratings and comments, makes justified recommendations and explains how to synthesise the feedback into a report.','4 marks: analyses the feedback with clear recommendations and some detail about the report.','3 marks: identifies the main issues with some recommendations.','2 marks: describes some of the feedback or some responses.','1 mark: provides some relevant information.'])],{two:true}));
qs.push(Q(SSA,'<b>PayCo</b> sells payroll software to businesses. After a near-miss security incident, it introduced secure coding training, threat modelling during design, automated security testing on every build and yearly penetration tests. The results after 18 months are shown.'+tbl(['Measure','Before','After 18 months'],[
 ['Security defects found by customers after release','27 per year','8 per year'],
 ['Time to pass a customer\'s security audit','6 weeks','1 week'],
 ['Developer time spent on emergency fixes','25%','8%'],
 ['Government contracts (require security certification)','0','2'],
 ['Partner apps connected through PayCo\'s documented secure API','3','19']]),[
 tx('Explain the benefits to PayCo of implementing safe and secure development practices. Refer to the data in your answer.',5,110,'Improved products and services: customers found 70% fewer security defects after release, so PayCo\'s software is more reliable and trustworthy, which protects its reputation with businesses that trust it with salary data.<br>Productivity and improved work practices: emergency fixes fell from 25% to 8% of developer time, freeing time for new features. Training and threat modelling built security into everyday work, so problems are prevented in design rather than fixed later, at greater cost.<br>Business interactivity: audits now take one week instead of six, making it easier to sign new customers, and the documented secure API has grown from 3 to 19 partner apps, so PayCo works more easily with other businesses.<br>Influence on future development: security certification opened a new market, winning two government contracts, and the processes will shape how future products are designed, giving PayCo a lasting competitive advantage.',['5 marks: explains a range of benefits in detail, covering most of the listed areas and using the data to support each.','4 marks: explains several benefits with use of the data.','3 marks: explains some benefits with limited use of the data.','2 marks: describes some benefits.','1 mark: provides some relevant information.'])],{two:true}));
qs.push(Q(PW,'A developer wants a script that backs up her notes. The first lines of the program, shown below, create a <code>notes</code> folder that contains some files.'+code(NOTES)+'<p>The program must:</p>'+bl(['read a backup label, such as <code>mon</code>','create the folder <code>backup_</code> followed by the label (for example <code>backup_mon</code>) if it does not already exist','copy every file in <code>notes</code> whose name ends in <code>.txt</code> into that folder, in alphabetical order, displaying each file name','write the names of the copied files, one per line, into <code>log.txt</code> in the backup folder','finally display the number of files backed up.'])+'<p>For the label <code>mon</code> the output is:</p>'+code(`bugs.txt
ideas.txt
todo.txt
Backed up 3 files`),[
 py('Write the program in Python. Start your program with the lines shown. You may use the <code>os</code> and <code>shutil</code> modules.',5,NOTES,NOTES+`import shutil

label = input("Backup label: ")
folder = "backup_" + label
os.makedirs(folder, exist_ok=True)
copied = []
for name in sorted(os.listdir("notes")):
    if name.endswith(".txt"):
        shutil.copy("notes/" + name, folder + "/" + name)
        copied.append(name)
        print(name)
with open(folder + "/log.txt", "w") as log:
    for name in copied:
        print(name, file=log)
print("Backed up", len(copied), "files")`,[{i:['mon'],o:'bugs.txt\nideas.txt\ntodo.txt\nBacked up 3 files'},{i:['tue'],app:'\nprint(open("backup_tue/log.txt").read().strip())',o:'bugs.txt\nideas.txt\ntodo.txt\nBacked up 3 files\nbugs.txt\nideas.txt\ntodo.txt'},{i:['wed'],app:'\nprint(sorted(os.listdir("backup_wed")))',o:'bugs.txt\nideas.txt\ntodo.txt\nBacked up 3 files\n[\'bugs.txt\', \'ideas.txt\', \'log.txt\', \'todo.txt\']'}],['1 mark: reads the label and creates the backup folder only if it does not exist.','1 mark: lists the files in notes and selects only those ending in .txt.','1 mark: copies each selected file into the backup folder, in alphabetical order.','1 mark: writes the copied file names to log.txt in the backup folder.','1 mark: displays each file name and the final count in the required format.'])],{two:true}));
qs.push(Q(SA,'A national accounting firm introduces an AI system that completes routine tax returns. The system reads receipts, bank statements and payment summaries, and prepares a return for an accountant to check.'+bl(['The firm\'s profits rise, and fees for simple returns fall by 40%.','Over three years, the number of junior staff falls from 900 to 400, while 150 new roles are created in data checking, client advice and AI oversight.','Several small regional accounting practices close because they cannot compete on price.','The firm\'s shareholders receive record dividends.']),[
 tx('Evaluate the impact of this automation on the economy, the distribution of wealth, and the nature and skills required for employment.',6,185,'Economy: automation lowers the cost of a routine service. Fees for simple returns fall by 40%, which benefits households and small businesses and frees spending elsewhere, and the firm becomes more productive. However, the closure of small regional practices concentrates the market in a few large firms, which may reduce competition and could allow prices to rise later. Regional towns lose local businesses and jobs.<br>Distribution of wealth: most of the gains flow to the firm and its shareholders through higher profits and record dividends, while the costs fall on displaced junior staff and small practice owners. Without retraining or redeployment, the automation is likely to widen inequality between capital owners and workers, and between cities and regional areas.<br>Nature and skills of employment: routine data entry and preparation, traditionally done by junior accountants, largely disappears; 500 roles go and 150 new ones appear. The new roles require higher-level skills such as judgement, client communication, data analysis and understanding AI systems. This also removes the entry-level work through which graduates traditionally learned the profession, so the firm must create new pathways for training.<br>Overall, the automation is economically efficient and benefits consumers, but unless the firm and government invest in retraining and support for regional practices, its benefits will be unevenly distributed.',['6 marks: makes an informed judgement about impacts on the economy, the distribution of wealth and employment, with detailed, balanced reasoning supported by the scenario.','5 marks: evaluates all three areas with clear reasoning and use of the scenario.','3–4 marks: explains positive and negative impacts, but one area or the judgement is limited.','2 marks: describes some impacts of the automation.','1 mark: provides some relevant information.'])],{two:true}));

BANKS.push({id:'17',name:'Syllabus Mock 4',sub:'Original paper · set 4 of 5 covering the whole syllabus',qs:qs});
})();
