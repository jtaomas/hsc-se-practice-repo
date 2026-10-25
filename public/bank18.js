/* Syllabus Mock 5. Original paper, one of five (banks 14 to 18) that together cover
   the whole Year 12 Software Engineering syllabus. Layout follows the 2025 HSC:
   27 questions, 80 marks. See docs/SYLLABUS_MOCKS.md for the coverage map. */
(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var DB21={
 Panels:{c:['PanelID','Row','Model'],r:[
  ['N01',1,'SunMax 400'],['N02',2,'SunMax 400'],['N03',3,'Helio 450'],['N04',4,'Helio 450'],['N05',2,'Volta 380'],['N06',1,'Helio 450']]},
 Readings:{c:['ReadingID','PanelID','ReadDate','kWh','Faulty'],r:[
  ['R01','N01','2026-06-01',2.4,'N'],['R02','N01','2026-06-02',2.6,'N'],['R03','N02','2026-06-01',0.3,'Y'],['R04','N02','2026-06-02',2.2,'N'],
  ['R05','N03','2026-06-01',3.0,'N'],['R06','N03','2026-06-02',2.8,'N'],['R07','N04','2026-06-01',3.4,'N'],['R08','N05','2026-06-01',1.9,'N'],
  ['R09','N05','2026-06-02',2.1,'N'],['R10','N06','2026-06-01',3.2,'N'],['R11','N06','2026-06-02',0.1,'Y']]}};
var APPR=['Waterfall','Agile','WAgile'];
var DS=['Array','Record','Tree','Stack','Hash table','Sequential file'];
var SLOW=`def find_duplicates(words):
    result = []
    for i in range(len(words)):
        for j in range(len(words)):
            if i != j and words[i] == words[j] and words[i] not in result:
                result.append(words[i])
    return sorted(result)`;
var PANELS=`import math

# Do not change these lines. They create the inspection file and supply the trained model.
rows = ["N01,8,10", "N02,22,30", "N03,15,40", "N04,12,70", "N05,16,15"]
with open("panels.csv", "w") as f:
    for row in rows:
        print(row, file=f)

class FaultModel:
    """A trained logistic regression model. Do not change this class."""
    def predict_proba(self, features):
        z = -6 + 0.25 * features[0] + 0.08 * features[1]
        return 1 / (1 + math.exp(-z))`;
var qs=[];

/* ---------- Questions 1 to 11: 1 mark each ---------- */
qs.push(Q(SEP,'Different software development approaches suit different scales and types of project.',[
 gd('Select the most suitable approach for each project.',['Project','Most suitable approach'],[
  ['A three-person start-up building the first version of an app while its requirements are still unclear',[APPR,1]],
  ['Control software for a medical infusion pump that must meet fixed regulatory standards before any release',[APPR,0]],
  ['A large government payroll system with a fixed budget and legal sign-off, whose screens are refined with staff feedback',[APPR,2]]],1,'Agile suits small teams with changing requirements; Waterfall suits fixed, safety-critical requirements needing full documentation; WAgile suits large projects with fixed plans that still benefit from iterative feedback.')]));
qs.push(Q(PW,'',[
 mc('What is the role of the Transmission Control Protocol (TCP) when a web page is sent from a server to a browser?',['It splits the data into numbered segments and resends any segments that are lost','It converts the domain name of the website into its IP address','It encrypts the page so that it cannot be read by anyone in transit','It decides how the page is laid out on the screen of the device'],0,'TCP provides reliable delivery: it numbers segments so they can be reassembled in order, acknowledges them and retransmits any that are lost. IP handles addressing, DNS resolves names and TLS encrypts.')]));
qs.push(Q(SA,'A solar farm wants to forecast tomorrow\'s electricity output in megawatt-hours, using past output and weather forecasts.',[
 mc('Which machine learning approach is most suitable?',['Unsupervised clustering of past days, without using their output values','Logistic regression to predict whether any output will be produced tomorrow','Linear or polynomial regression trained on past weather and output data','K-nearest neighbour classification of tomorrow as "sunny" or "cloudy"'],2,'Forecasting a continuous number from labelled historical data is a supervised regression task. Classification and clustering do not output a quantity.')]));
qs.push(Q(SSA,'A login page displays "Incorrect password" when an email address is registered and "No account found" when it is not. It allows unlimited login attempts.',[
 mc('Which category of vulnerability does this design MAINLY represent?',['Cross-site scripting','Broken authentication','Invalid redirection','Race condition'],1,'Revealing which accounts exist and allowing unlimited guesses weakens the authentication process, letting attackers find valid accounts and try passwords until they succeed.')]));
qs.push(Q(PW,'A start-up collects readings from thousands of different environmental sensors. Each type of sensor sends a different set of fields, and new sensor types are added often.',[
 mc('Which kind of database is most suitable for storing the readings?',['A single text file that every sensor appends to','A relational SQL database with a fixed table for every possible field','A spreadsheet saved on one staff member\'s computer','A non-SQL (document) database, because records do not all need the same fields'],3,'Document databases store flexible records, such as JSON documents, so different sensors can send different fields without changing a fixed schema.')]));
qs.push(Q(SSA,'A team is developing a secure banking app.',[
 mt('Match each practice to the benefit of collaboration it BEST shows.',['Practice','Considering various points of view','Delegating tasks based on expertise','Quality of the solution'],[
  ['A security specialist is assigned to build the authentication module',1],
  ['A designer, a tester and an accessibility consultant each review the login screen',0],
  ['Peer review of every change finds defects before release',2]],1,'Giving work to the person with the right skills is delegation by expertise; involving people with different perspectives considers various points of view; checking each other\'s work improves quality.')]));
qs.push(Q(SA,'',[
 mc('During training, how does a neural network reduce the error in its predictions?',['It sorts the training data into order before each training cycle','It deletes the training examples that it predicts incorrectly','It adjusts its weights using the difference between predicted and actual outputs','It keeps adding new input features until the error reaches zero'],2,'The error between the prediction and the known answer is propagated backwards through the network (backpropagation), and each weight is adjusted slightly to reduce that error.')]));
qs.push(Q(PW,'',[
 mc('Which statement about open-source software used in web development is correct?',['It can never be used in commercial websites','It is always developed by a single company','It cannot contain security vulnerabilities because anyone can read the code','Its source code can be viewed, modified and shared, subject to the conditions of its licence'],3,'Open-source licences allow anyone to read, change and redistribute the code under stated conditions. Many commercial sites use it, and open code can still contain vulnerabilities.')]));
qs.push(Q(SEP,'',[
 mc('Which statement describes an opportunity rather than a need?',['Paper booking forms at the centre are often lost, so a replacement booking system is required','Most young community members own smartphones, so they could practise the language daily in an app','The payroll system will stop working when its operating system is no longer supported next year','Staff cannot see patient records whenever the old server fails'],1,'A need is a problem that must be solved; an opportunity is a chance to create benefit that does not yet exist. The other options describe existing problems.')]));
qs.push(Q(SSA,'',[
 ms('Which of the following make an application programming interface (API) safer?<br>(More than one may be selected.)',['Returning only the fields that the caller needs','Relying on the API\'s address being hard to guess','Limiting the number of requests each client can make in a period of time','Returning detailed error messages and stack traces to the caller','Authenticating every request with a token and checking what the caller is authorised to do'],[0,2,4],1,'Rate limiting, per-request authentication and authorisation, and minimal responses all reduce risk. Detailed errors leak information, and obscurity is not a security control.')]));
qs.push(Q(SA,'The diagram shows a trained neural network during its execution cycle. Thicker lines show stronger connections.'+fig('Neural network','<svg viewBox="0 0 420 220" width="420" role="img" aria-label="Neural network with input, hidden and output layers; some connections are thicker"><g font-family="Arial" font-size="12" fill="#000"><text x="45" y="16" text-anchor="middle">Input layer</text><text x="210" y="16" text-anchor="middle">Hidden layer</text><text x="375" y="16" text-anchor="middle">Output layer</text>'+
 '<g stroke="#333"><line x1="45" y1="55" x2="210" y2="45" stroke-width="5"/><line x1="45" y1="55" x2="210" y2="115" stroke-width="1"/><line x1="45" y1="115" x2="210" y2="45" stroke-width="1"/><line x1="45" y1="115" x2="210" y2="185" stroke-width="5"/><line x1="45" y1="175" x2="210" y2="115" stroke-width="1"/><line x1="45" y1="175" x2="210" y2="185" stroke-width="1"/><line x1="210" y1="45" x2="375" y2="80" stroke-width="5"/><line x1="210" y1="115" x2="375" y2="80" stroke-width="1"/><line x1="210" y1="115" x2="375" y2="150" stroke-width="1"/><line x1="210" y1="185" x2="375" y2="150" stroke-width="5"/></g>'+
 '<g fill="#fff" stroke="#333"><circle cx="45" cy="55" r="15"/><circle cx="45" cy="115" r="15"/><circle cx="45" cy="175" r="15"/><circle cx="210" cy="45" r="15"/><circle cx="210" cy="115" r="15"/><circle cx="210" cy="185" r="15"/><circle cx="375" cy="80" r="15"/><circle cx="375" cy="150" r="15"/></g></g></svg>'),[
 mc('Which statement about the thicker connections is correct?',['They have the strongest weightings, which were set in the training cycle and have the most influence on the output','They are connections whose weightings are being changed during the execution cycle to correct errors','They are the only connections used, because the thinner connections are ignored during execution','They carry the largest amount of training data from the input layer to the output layer'],0,'During the training cycle the network is shown inputs with known responses and its weightings and thresholds are adjusted. The execution cycle uses these fixed values: connections with stronger weightings (thicker lines) have more influence on the final output, while weaker ones still contribute.')],{two:true}));

/* ---------- Questions 12 and 13: 2 marks each ---------- */
qs.push(Q(SA,'',[
 od('Place the steps of the K-nearest neighbour (KNN) classification algorithm in the correct order by dragging the steps into position.',`
# BEGIN KNN(newPoint, data, labels, k)
    = Set pairs = empty list
    FOR i = 1 TO LENGTH(data)
        Set d = distance(newPoint, data[i])
        Add [d, labels[i]] to pairs
    NEXT i
    Sort pairs in ascending order of distance
    Set nearest = labels of the first k pairs
    RETURN the most common label in nearest
# END KNN`,2,{extra:['Sort pairs in descending order of distance'],why:'KNN calculates the distance from the new point to every labelled point, sorts so the closest come first, takes the labels of the k closest and returns the majority label.'})]));
qs.push(Q(SA,'Automation affects individuals, society and the environment in many ways.',[
 dm('Match each example to the area of impact it BEST shows by dragging the labels into the boxes.',['Safety of workers','People with disability','Nature and skills of employment','Production efficiency and the environment','Economy and distribution of wealth'],[
  ['Drones inspect high-voltage power lines, so workers no longer climb the towers',0],
  ['An automated accessible shuttle lets residents who cannot drive travel independently',1],
  ['Bank tellers retrain as digital support staff after branches automate transactions',2],
  ['Automated irrigation uses soil sensors to cut water use and fertiliser run-off',3],
  ['A company\'s profits rise after automation while wages in the region stay flat',4]],2,{why:'Each example shows a different impact named in the syllabus: removing people from dangerous work, independence for people with disability, changing job skills, efficiency with less waste, and who receives the financial gains.'})]));

/* ---------- Question 14: 1 mark ---------- */
qs.push(Q(SEP,'Consider the following algorithm.'+code(`Set total = 0
Set n = 1
REPEAT
    CASEWHERE n MOD 3 evaluates to
        0: total = total + n
        1: total = total + 1
        OTHERWISE: total = total - 1
    END CASE
    n = n + 1
UNTIL n > 7
Display total`),[
 dd('Select the correct item from the dropdown menu to show the value displayed.','The value displayed is {0}.',[[['9','10','11','17'],1]],1,'The post-test loop runs for n = 1 to 7. Remainder 1 (n = 1, 4, 7) adds 1 each time, remainder 2 (n = 2, 5) subtracts 1 each time, and remainder 0 (n = 3, 6) adds n. Total: 3 − 2 + 3 + 6 = 10.')],{two:true}));

/* ---------- Question 15: 6 marks ---------- */
qs.push(Q(SEP,'A language centre is working with community Elders to develop <b>Word Garden</b>, an app for learning an Aboriginal language that the local community is reviving.',[
 P('(a)',gd('Select the most suitable data structure for each requirement of the app. (3 marks)',['Requirement','Data structure'],[
  ['Undo the most recent change made in the lesson editor',[DS,3]],
  ['Look up a word\'s English meaning instantly using the word as the key',[DS,4]],
  ['Store one learner\'s name, level and last log-in date together',[DS,1]],
  ['Show how words are built from a root word into related words',[DS,2]],
  ['Store a learner\'s practice score for each of the 7 days of a week',[DS,0]],
  ['Save every practice attempt to disk, one after another, in the order they happen',[DS,5]]],3,'A stack gives last-in, first-out undo; a hash table finds a value by key; a record groups related fields; a tree shows a hierarchy; an array holds a fixed number of same-type values; a sequential file appends records in order.')),
 P('(b)',tx('The developers want to propose an innovative pronunciation coach for the app. Describe how a prototype and user interface (UI) design could be used to propose this feature. (3 marks)',3,65,'The team could build a simple interactive prototype, such as clickable screens where a learner hears an Elder\'s recording, records themselves and sees a simple visual comparison, without building the full speech analysis. Designing the UI first, with large record buttons, clear feedback and screens that suit young and older learners, lets the team show the idea to Elders and learners and collect their feedback. The prototype makes the proposal concrete, tests whether the idea is useful and culturally appropriate, and reduces the risk of spending time building the wrong thing.',['1 mark: describes building a prototype that demonstrates the feature.','1 mark: describes relevant UI design elements for the feature.','1 mark: explains how the prototype is used to gain feedback and support the proposal.']))],{two:true}));

/* ---------- Question 16: 9 marks ---------- */
qs.push(Q(PW,'Word Garden will be delivered as a progressive web app. It will display words written with characters such as <b>ŋ</b>, play audio recordings made by Elders, and store community stories that some families want to keep restricted.',[
 P('(a)',tx('Describe how the app\'s user interface could use font, colour and navigation to be inclusive of learners of all ages and abilities. (3 marks)',3,65,'Text should use a clear, resizable font that includes every character in the language, such as ŋ, with generous size and spacing for young children and older learners. Colours should have strong contrast and meaning should never depend on colour alone, for example correct answers show a tick as well as turning green. Navigation should be simple and consistent, with large buttons, icons with labels, a visible way back and support for keyboard and screen-reader users.',['1 mark: a relevant font consideration.','1 mark: a relevant colour consideration (eg contrast, not relying on colour alone).','1 mark: a relevant navigation consideration linked to learners of different ages or abilities.'])),
 P('(b)',tx('Explain how World Wide Web Consortium (W3C) internationalisation guidance applies to displaying the language correctly. (3 marks)',3,65,'Pages should be stored and served in Unicode (UTF-8), so characters such as ŋ are encoded correctly and display on every device. Each block of text should carry a lang attribute identifying the language, so screen readers, search engines and hyphenation treat it correctly. Text should not be placed in images, and fonts must be chosen or embedded so that all characters are available rather than replaced by empty boxes.',['1 mark: Unicode or UTF-8 encoding for the special characters.','1 mark: language identification, eg the lang attribute.','1 mark: a further practice (eg suitable fonts, no text in images) and why it matters.'])),
 P('(c)',tx('Compare the use of an SQL database and a non-SQL database for storing the words, audio recordings and community stories. (3 marks)',3,65,'Both can store the app\'s data and be accessed from the back end. An SQL database stores data in related tables with a fixed structure, which suits words linked to meanings, lessons and access permissions, and enforces consistency with keys and constraints. A non-SQL document database stores flexible records, which suits stories that vary greatly in length, format and attached media. Large audio files would normally be stored as files, with the database holding their location. SQL gives stronger relationships and integrity, while non-SQL gives flexibility.',['1 mark: a feature of SQL (relational) databases linked to the app\'s data.','1 mark: a feature of non-SQL databases linked to the app\'s data.','1 mark: makes a clear comparison (similarities and/or differences).']))],{two:true}));

/* ---------- Questions 17 to 19 ---------- */
qs.push(Q(SEP,'A solar farm records its output for each hour of the day in the array <b>Output</b>, with positions numbered from 1 to 24. Engineers want to find the three consecutive hours with the greatest total output.',[
 ps('Using pseudocode, write an algorithm that displays the first hour of the three-hour period with the greatest total output, and that total. You may assume that all of the totals are different.',3,`BEGIN bestWindow
    bestTotal = Output[1] + Output[2] + Output[3]
    bestStart = 1
    FOR h = 2 TO 22
        total = Output[h] + Output[h + 1] + Output[h + 2]
        IF total > bestTotal THEN
            bestTotal = total
            bestStart = h
        ENDIF
    NEXT h
    Display "Best period starts at hour ", bestStart
    Display "Total output: ", bestTotal
END bestWindow`,['1 mark: a loop with correct limits so every three-hour period is checked without going past position 24.','1 mark: calculates the total of three consecutive hours.','1 mark: keeps the largest total and its starting hour, and displays both.'])],{two:true}));
qs.push(Q(PW,'Each tram in a city network has an onboard computer that sends its location to the transport agency\'s server every 10 seconds.',[
 tx('Describe how a location update is transferred across the internet from a tram to the agency\'s server.',3,65,'The onboard computer places the location in a message and finds the server\'s IP address, using DNS if it has a domain name. TCP divides the message into numbered segments, and IP places each into a packet with the source and destination IPv4 addresses in its header. Routers forward each packet towards the destination, possibly along different paths. At the server, TCP checks that all packets have arrived, requests any that are missing, reassembles them in order and passes the location to the server software.',['1 mark: the data is split into packets with addressing information (IP addresses).','1 mark: routers forward packets independently towards the destination.','1 mark: packets are checked and reassembled in order at the destination (TCP), with lost packets resent.'])]));
qs.push(Q(SEP,'The function below returns a sorted list of the words that appear more than once in a list. It is correct, but it is very slow for long lists.'+code(SLOW),[
 py('Using a language-dependent optimisation technique in Python, such as a dictionary or a set, write a faster version of <code>find_duplicates(words)</code> that gives the same results.',3,'def find_duplicates(words):\n    ',`def find_duplicates(words):
    seen = set()
    repeated = set()
    for word in words:
        if word in seen:
            repeated.add(word)
        else:
            seen.add(word)
    return sorted(repeated)`,[{app:'\nprint(find_duplicates(["tram", "bus", "tram", "ferry", "bus", "tram"]))',o:'[\'bus\', \'tram\']'},{app:'\nprint(find_duplicates([]))',o:'[]'},{app:'\nprint(find_duplicates(["solo"]))',o:'[]'},{app:'\nprint(find_duplicates(["Bus", "bus", "BUS", "bus"]))',o:'[\'bus\']'},{app:'\nwords = [str(i % 5000) for i in range(20000)]\nprint(len(find_duplicates(words)))',o:'5000'}],['1 mark: uses a set or dictionary to record words already seen.','1 mark: processes the list in a single pass rather than nested loops.','1 mark: returns a sorted list of each repeated word once, matching the original results.'])],{two:true}));

/* ---------- Questions 20 to 22 ---------- */
qs.push(Q(SSA,'Word Garden will let families record and upload community stories. Some stories may only be shared with particular family members, and some must be removed if a family requests it.',[
 tx('Describe how the privacy by design principles of being proactive not reactive, embedding privacy into the design, and respecting user privacy could be applied to these recordings.',3,65,'Proactive not reactive: before building the feature, the team runs a privacy assessment with Elders and families to identify risks, such as stories being shared beyond the intended people, and plans controls. Embedding privacy: access controls set by the uploading family are built into the system, recordings are encrypted and private by default, and only the data needed is collected. Respect for user privacy: families give informed consent, can see who has access, change sharing settings and have a story permanently deleted on request.',['1 mark: applies proactive not reactive to the recordings.','1 mark: applies embedding privacy into the design (eg private by default, encryption, access controls).','1 mark: applies respect for user privacy (eg consent, control, deletion).'])]));
qs.push(Q(PW,'A solar farm stores information about its panels and their daily readings in two related tables, Panels and Readings.',[
 sq('Construct a SQL query that displays each panel Model, the average kWh and the highest kWh of its readings that are NOT faulty, for panels in rows 1 to 3 only.<br>Use the column headings Model, AvgOutput and BestOutput. List the results from the highest to the lowest average output.',4,`SELECT Panels.Model, AVG(Readings.kWh) AS AvgOutput, MAX(Readings.kWh) AS BestOutput
FROM Panels, Readings
WHERE Panels.PanelID = Readings.PanelID
AND Readings.Faulty = 'N' AND Panels.Row >= 1 AND Panels.Row <= 3
GROUP BY Panels.Model
ORDER BY AvgOutput DESC`,true,['1 mark: links Panels and Readings on PanelID (in the WHERE clause or with a JOIN).','1 mark: excludes faulty readings.','1 mark: restricts to rows 1 to 3.','1 mark: groups by Model, calculating the average and the highest kWh, with the required headings and order.'])],{two:true,db:DB21}));
qs.push(Q(SEP,'A transport agency\'s smartcard system needs a class diagram.'+bl(['Every <b>Card</b> has a card number and a balance, and methods to top up and to tap on.','A <b>ConcessionCard</b> is a Card that also has a concession type and an expiry date.','A <b>Trip</b> has a date and a fare. Each trip belongs to one card, and a card can have many trips.','Each trip starts at one <b>Stop</b> and ends at one Stop. A stop has a stop ID, a name and a fare zone.']),[
 dr('Create a class diagram for the smartcard system. Show attributes, methods, inheritance and the relationships between classes with their multiplicity.',3,'Four classes. Card (cardNumber, balance; topUp(amount), tapOn(stop)). ConcessionCard (concessionType, expiryDate), shown inheriting from Card with a hollow-headed arrow. Trip (date, fare). Stop (stopID, name, zone). Card to Trip: 1 to 0..*. Trip to Stop: two associations, start stop and end stop, each with multiplicity 1 at the Stop end (a stop can appear in many trips, 0..*).',['1 mark: the four classes with appropriate attributes, and methods for Card.','1 mark: ConcessionCard shown inheriting from Card, without repeating inherited attributes.','1 mark: associations between Card and Trip and between Trip and Stop with correct multiplicities.'],'class')],{two:true}));

/* ---------- Question 23: 9 marks ---------- */
qs.push(Q(SSA,'A transport agency runs a journey planner website, a rider account system that stores each rider\'s travel history, and a trip API used by third-party apps. Staff in the fare-disputes team need to see riders\' histories.',[
 P('(a)',tx('Explain how authentication and authorisation would be applied to riders, staff and third-party apps. (3 marks)',3,65,'Authentication confirms identity: riders log in with a password and optional multi-factor authentication, staff use their work account with multi-factor authentication, and third-party apps present an API key or token with every request. Authorisation then decides what each authenticated user may do: riders can see only their own travel history, only fare-disputes staff can view other riders\' histories, and third-party apps can read timetables but never personal data.',['1 mark: explains authentication as confirming identity, with a suitable method.','1 mark: explains authorisation as controlling access after identity is confirmed.','1 mark: applies both appropriately to riders, staff and third-party apps.'])),
 P('(b)',tx('Explain how the agency\'s software could include security features that support data protection, privacy and regulatory compliance for riders\' travel histories. (3 marks)',3,65,'Travel histories are personal information that privacy law requires the agency to protect. The software should encrypt histories in storage and in transit, collect only what is needed and delete or anonymise trips after a set period, and log every staff access so misuse can be detected. Riders should be told how their data is used and be able to view and correct it. A breach response process supports the requirement to notify affected people, and regular audits demonstrate compliance.',['1 mark: a feature supporting data protection (eg encryption, access logging).','1 mark: a feature supporting privacy (eg minimisation, retention limits, transparency).','1 mark: links the features to complying with legal or regulatory requirements.'])),
 P('(c)',tk('For each control, tick the security principle or principles it supports. (3 marks)',['Control','Confidentiality','Integrity','Availability'],[
  ['All journey-planner traffic is sent over TLS',[0,1]],
  ['Rate limiting stops floods of requests to the trip API',[2]],
  ['Checksums are verified on timetable files sent to tram displays',[1]],
  ['Only the fare-disputes team can view a rider\'s full travel history',[0]]],3,'TLS encrypts traffic (confidentiality) and detects tampering (integrity). Rate limiting keeps the API available. Checksums detect changed files. Restricting access protects confidentiality.'))],{two:true}));

/* ---------- Questions 24 to 27 ---------- */
qs.push(Q(SA,'The Word Garden team plans a machine learning feature that listens to a learner\'s pronunciation and gives feedback. The model will be trained on recordings of Elders speaking the language.',[
 tx('Explain how cultural protocols and belief systems should influence the development of this machine learning feature.',5,110,'Cultural protocols govern who may share knowledge, how it is used and how people who have passed away are respected. The community, through its Elders, should decide which words and stories may be used, and recordings should be collected only with free, prior and informed consent, keeping the community in control of its data. Some words or knowledge may be restricted by gender, family or ceremony, so the training data must exclude them or the app must restrict access. Many communities avoid using the voices or images of people who have died, so the team must be able to remove a speaker\'s recordings from the data and retrain the model when asked.<br>Belief systems also shape what counts as correct: the language may have regional and family variations, so the model should not label one Elder\'s pronunciation as "wrong". Feedback should be encouraging and respectful of the language\'s significance rather than simply scoring learners. Involving Elders in testing ensures the feature reflects community values.',['5 marks: explains in detail how both cultural protocols and belief systems should shape the data, model and feedback, with specific and respectful strategies linked to the scenario.','4 marks: explains how both influence development with some specific strategies.','3 marks: explains one in detail, or both with limited links to the feature.','2 marks: describes some relevant considerations.','1 mark: provides some relevant information.'])],{two:true}));
qs.push(Q(SEP,'The transport agency\'s journey planner shows live arrival times on a website and a mobile app. It combines data from tram locations, timetables and service disruptions, and is used by 200 000 people each day.',[
 tx('Explain the contribution of back-end engineering to the success of the journey planner. In your answer, refer to the technology used, error handling, interfacing with the front end and security engineering.',5,110,'Technology used: the back end runs on scalable servers, with a database for timetables, a fast cache for live tram positions and a framework that combines them into arrival predictions. Choosing technology that can handle 200 000 daily users and sudden peaks, such as when a line is disrupted, keeps the service fast and available.<br>Error handling: if a tram stops sending its location or a data feed fails, the back end catches the error, logs it and falls back to timetable estimates marked as "scheduled", so riders still get useful information and the system does not crash.<br>Interfacing with the front end: a well-documented API returns consistent data such as JSON to both the website and the app, so both show the same information and the front end can be changed without changing the back end.<br>Security engineering: the back end validates every request, authenticates riders and API clients, rate-limits traffic and protects rider accounts with encryption, so the service is trustworthy.<br>Together these make the planner reliable, accurate and easy to extend.',['5 marks: explains in detail how all four aspects contribute to the success of the journey planner, with specific examples.','4 marks: explains all four aspects with some examples.','3 marks: explains some aspects, or all four with limited detail.','2 marks: describes some back-end features.','1 mark: provides some relevant information.'])],{two:true}));
qs.push(Q(SA,'A solar farm inspects its panels using a logistic regression model that has already been trained. The model is supplied as a class that works like LogisticRegression in scikit-learn: <code>predict_proba(features)</code> returns the probability that a panel with those features is faulty. The features are how much hotter the panel is than the air (°C) and the drop in its output (%). The inspection results are stored in the file <code>panels.csv</code>, one panel per line.'+code(PANELS)+'<p>The program must define a class <code>PanelInspector</code>:</p>'+bl(['its constructor stores a FaultModel object and a probability threshold','its method <code>classify(features)</code> returns <code>Fault</code> if the probability is greater than the threshold, otherwise <code>OK</code>','its method <code>inspect(filename)</code> reads the panels file, displays each panel\'s ID, probability (2 decimal places) and classification, writes the ID of each faulty panel on its own line in the file <code>faults.txt</code>, and returns the number of faults.'])+'<p>The program reads the threshold, inspects panels.csv and then displays the number of faults.</p><p>For the threshold 0.5 the output is:</p>'+code(`N01: 0.04 OK
N02: 0.87 Fault
N03: 0.72 Fault
N04: 0.93 Fault
N05: 0.31 OK
Faults found: 3`),[
 py('Using object-oriented programming in Python, write the program. Start your program with the lines shown.',5,PANELS+'\n',PANELS+`

class PanelInspector:
    def __init__(self, model, threshold):
        self.model = model
        self.threshold = threshold

    def classify(self, features):
        if self.model.predict_proba(features) > self.threshold:
            return "Fault"
        return "OK"

    def inspect(self, filename):
        faults = 0
        with open(filename) as source, open("faults.txt", "w") as out:
            for line in source:
                parts = line.strip().split(",")
                features = [float(parts[1]), float(parts[2])]
                label = self.classify(features)
                probability = self.model.predict_proba(features)
                print(parts[0] + ":", round(probability, 2), label)
                if label == "Fault":
                    out.write(parts[0] + "\\n")
                    faults = faults + 1
        return faults

threshold = float(input("Threshold: "))
inspector = PanelInspector(FaultModel(), threshold)
print("Faults found:", inspector.inspect("panels.csv"))`,[{i:['0.5'],o:'N01: 0.04 OK\nN02: 0.87 Fault\nN03: 0.72 Fault\nN04: 0.93 Fault\nN05: 0.31 OK\nFaults found: 3'},{i:['0.8'],app:'\nprint(open("faults.txt").read().strip())',o:'N01: 0.04 OK\nN02: 0.87 Fault\nN03: 0.72 OK\nN04: 0.93 Fault\nN05: 0.31 OK\nFaults found: 2\nN02\nN04'},{i:['0.99'],o:'N01: 0.04 OK\nN02: 0.87 OK\nN03: 0.72 OK\nN04: 0.93 OK\nN05: 0.31 OK\nFaults found: 0'}],['1 mark: PanelInspector constructor stores the model object and the threshold.','1 mark: classify calls the model\'s predict_proba method and compares the result with the threshold.','1 mark: inspect opens and reads panels.csv, splitting each line into an ID and numeric features.','1 mark: writes each faulty panel\'s ID on its own line in faults.txt and returns the number of faults.','1 mark: reads the threshold and displays every line in the required format.'])],{two:true}));
qs.push(Q(SSA,'A bank closes 30 regional branches and moves its customers to an app-only service.'+bl(['Customers log in with face recognition and the app replaces most counter services.','About 400 branch staff lose their jobs; the bank hires 90 people for its digital team in the city.','Older customers and people with poor mobile coverage report difficulty accessing their money.','Six months later, a software vendor that processes the bank\'s loan applications suffers a data breach exposing customers\' identity documents.']),[
 tx('Evaluate the social, ethical and legal issues resulting from the bank\'s move to app-only banking. In your answer, refer to employment, digital disruption, data security and privacy.',6,185,'Employment: around 400 regional jobs are lost and only 90 are created, mostly in the city and requiring different digital skills. Regional workers are unlikely to fill these roles without retraining, so the move transfers employment away from regional communities, and the bank has an ethical responsibility to support redeployment.<br>Digital disruption: the app gives many customers convenient 24-hour banking and lowers the bank\'s costs, which is a genuine benefit. However, it disadvantages older customers and people with poor coverage who cannot easily use the app. Excluding them from essential financial services raises ethical concerns about fairness and may breach obligations to serve vulnerable customers, so alternatives such as phone or post office banking are needed.<br>Data security: relying on a vendor does not remove the bank\'s responsibility. Exposed identity documents create a lasting risk of identity theft for customers. The bank and vendor face legal consequences under privacy law, including notifying affected customers and the regulator, as well as reputational damage.<br>Privacy: face recognition collects sensitive biometric data, which must be collected with consent, stored securely and used only for authentication. Customers should be able to choose another method.<br>Overall, the app brings efficiency, but the bank has shifted costs and risks onto regional staff and vulnerable customers, and its handling of data has been inadequate. The change is only justifiable if it provides inclusive alternatives, supports affected staff and holds its vendors to strong security standards.',['6 marks: makes an informed judgement, evaluating employment, digital disruption, data security and privacy issues in detail, with social, ethical and legal consequences linked to the scenario.','5 marks: evaluates all four areas with clear reasoning and use of the scenario.','3–4 marks: explains several issues, but some areas or the judgement are limited.','2 marks: describes some social, ethical or legal issues.','1 mark: provides some relevant information.'])],{two:true}));

BANKS.push({id:'18',name:'Syllabus Mock 5',sub:'Original paper · set 5 of 5 covering the whole syllabus',qs:qs});
})();
