/* Syllabus Mock 1. Original paper, one of five (banks 14 to 18) that together cover
   the whole Year 12 Software Engineering syllabus. Layout follows the 2025 HSC:
   27 questions, 80 marks. See docs/SYLLABUS_MOCKS.md for the coverage map. */
(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var DB21={
 Routes:{c:['RouteID','RouteName','Wharf'],r:[
  ['F1','Pelican Point','North Wharf'],['F2','Mangrove Bay','North Wharf'],['F3','Shell Cove','South Wharf'],['F4','Lighthouse Run','South Wharf']]},
 Sailings:{c:['SailingID','RouteID','SailDate','Capacity','Passengers'],r:[
  ['S01','F1','2026-03-02',200,195],['S02','F1','2026-03-09',200,180],['S03','F1','2026-03-16',200,188],['S04','F1','2026-04-06',200,199],
  ['S05','F1','2026-03-23',200,192],['S06','F2','2026-03-03',150,141],['S07','F2','2026-03-10',150,120],['S08','F2','2026-02-24',150,149],
  ['S09','F3','2026-03-05',300,285],['S10','F3','2026-03-12',300,271],['S11','F3','2026-03-19',300,260],['S12','F4','2026-03-06',100,85],
  ['S13','F4','2026-03-27',100,90]]}};
var qs=[];

/* ---------- Questions 1 to 11: 1 mark each ---------- */
qs.push(Q(SEP,'',[
 mc('Which implementation method leaves an organisation with NO working fallback if a serious fault appears in the new system on its first day?',['Parallel','Direct','Pilot','Phased'],1,'In a direct cut-over the old system stops when the new one starts, so there is nothing to fall back on. Parallel keeps the old system running, pilot limits the fault to one group and phased limits it to one part.')]));
qs.push(Q(PW,'',[
 dd('Complete the statement by selecting the correct term from each dropdown menu.','By default, HTTPS uses port {0}, while SFTP uses port {1}.',[[['21','22','80','443'],3],[['21','22','80','443'],1]],1,'HTTPS (HTTP over TLS) listens on port 443. SFTP runs over SSH, which uses port 22. Port 21 is plain FTP and port 80 is plain HTTP.')]));
qs.push(Q(SA,'A council uses two help-desk chatbots.'+bl(['<b>Bot A</b> replies using 400 if-then rules written by council staff.','<b>Bot B</b> was trained on 50 000 past chats, each labelled with the department that solved it. Its accuracy improves as new labelled chats are added.']),[
 mc('Which statement is correct?',['Neither bot is artificial intelligence because neither understands language like a person.','Only Bot B is artificial intelligence, because rule-based systems are never AI.','Bot A uses machine learning because its rules came from staff experience.','Both bots are examples of artificial intelligence, but only Bot B uses machine learning.'],3,'AI is the broad goal of machines behaving intelligently, which a rule-based expert system can do. ML is the subset of AI in which the system learns its behaviour from data, as Bot B does.')]));
qs.push(Q(SSA,'',[
 mc('A development team draws the architecture of a new system. It decides where input validation will happen and which encryption library each module will call. Which step of developing secure software is the team working on?',['Integration','Installation','Design','Requirements definition'],2,'Design is where the structure of the solution and the security controls within it are planned. Requirements say what the system must do, integration combines built modules and installation deploys the finished system.')]));
qs.push(Q(PW,'',[
 mc('Which of the following is a valid IPv4 address?',['172.16.254.1','2001:db8::7','10.0.300.4','192.168.1.256'],0,'An IPv4 address has four numbers (octets), each from 0 to 255. 256 and 300 are out of range, and 2001:db8::7 is an IPv6 address.')]));
qs.push(Q(SSA,'A council grants system now records the user ID, the time, and the old and new values every time an application is approved or changed. Staff cannot edit or delete these records.',[
 mc('Which fundamental security concept does this feature MAINLY support?',['Authentication','Availability','Confidentiality','Accountability'],3,'A tamper-proof audit log means every action can be traced to the person who performed it, which is accountability.')]));
qs.push(Q(SA,'A wildlife group has 300 motion-camera photos that ecologists have labelled "koala" or "not koala", and 40 000 photos that nobody has labelled. The group trains one model using both sets of photos.',[
 mc('Which model of training is being used?',['Semi-supervised learning','Unsupervised learning','Reinforcement learning','Supervised learning'],0,'Semi-supervised learning combines a small labelled set with a large unlabelled set. The labelled photos guide the model, and the unlabelled ones help it learn the general structure of the images.')]));
qs.push(Q(PW,'',[
 mc('Which practice best supports the World Wide Web Consortium (W3C) goal of internationalisation?',['Displaying every date and price in a single fixed format, such as MM/DD/YYYY and US dollars','Using UTF-8 and keeping interface text separate from the code so it can be translated','Using images of text for headings so that the chosen font looks identical in every browser','Detecting the visitor\'s country and blocking regions the site does not support'],1,'Internationalisation means designing a site so it can be adapted to any language and region. UTF-8 handles every script, and separating text from code allows translation. Images of text cannot be translated or read by screen readers.')]));
qs.push(Q(SEP,'Software can be developed using different approaches.',[
 mt('Classify each statement as describing the Waterfall, Agile or WAgile approach.',['Statement','Waterfall','Agile','WAgile'],[
  ['Each stage is signed off before the next stage begins.',0],
  ['The team chooses which of its usual practices and meetings suit this particular project.',1],
  ['Requirements and budget are fixed at the start, but building and testing happen in short iterations.',2],
  ['Working software is shown to the client every two weeks and the remaining work is re-prioritised.',1]],1,'Waterfall flows through signed-off stages. Agile delivers in short iterations and lets teams tailor their method. WAgile is a hybrid with Waterfall planning and Agile iterations.')]));
qs.push(Q(SSA,'',[
 ms('Which of the following are side-channel attacks?<br>(More than one may be selected.)',['Recording the sound of a keyboard to work out which keys were pressed','Typing SQL commands into a search box','Recording the power a smart card draws while it encrypts data','Measuring how long a server takes to reject different passwords','Uploading a file named ../../config.ini'],[0,2,3],1,'Side-channel attacks gather information from the physical behaviour of a system (time, power, sound) rather than from a flaw in its logic. SQL injection and path traversal attack the logic directly.')]));
qs.push(Q(PW,'A video streaming platform stores data about every video it hosts.',[
 mc('Which of the following is metadata about a video?',['The colour values of the pixels in each frame of the video','The recorded audio track that plays alongside the video','The video\'s length, resolution, upload date and number of views','The private key used to encrypt the video file'],2,'Metadata is data that describes other data. Length, resolution, upload date and views describe the video without being the video content itself.')]));

/* ---------- Questions 12 and 13: 2 marks each ---------- */
qs.push(Q(SA,'Machine learning is used in a range of applications.',[
 gd('For each situation, select the application area and the model that would be most suitable.',['Situation','Application area','Most suitable model'],[
  ['Estimating next month\'s electricity demand for a town from its past monthly demand',[['Data analysis and forecasting','Virtual personal assistant','Image recognition'],0],[['Linear regression','Neural network','Logistic regression'],0]],
  ['Reading number plates from photos taken by toll cameras',[['Data analysis and forecasting','Virtual personal assistant','Image recognition'],2],[['Linear regression','Neural network','Logistic regression'],1]],
  ['Understanding a spoken request to set a timer and replying aloud',[['Data analysis and forecasting','Virtual personal assistant','Image recognition'],1],[['Linear regression','Neural network','Logistic regression'],1]]],2,'Forecasting a number from past values suits regression. Reading images and understanding speech involve complex patterns, so neural networks are used for image recognition and virtual personal assistants.')]));
qs.push(Q(SEP,'A netball association is deciding whether to commission an app for scoring and team selection.',[
 mt('Classify each consideration as part of assessing scheduling feasibility OR financial feasibility.',['Consideration','Scheduling feasibility','Financial feasibility'],[
  ['Whether the app can be released before the season starts in April',0],
  ['Licence fees for a mapping service over three years',1],
  ['Whether two developers are free during the planned build weeks',0],
  ['Savings from fewer paper score sheets compared with the cost of development',1]],2,'Scheduling feasibility asks whether the project can be finished in the time available with the people available. Financial feasibility compares the costs with the budget and the expected benefits.')]));

/* ---------- Question 14: 1 mark ---------- */
qs.push(Q(SEP,'Consider this code fragment.'+code(`FOR i = 5 TO 1 STEP -1
    IF a[i] < a[i + 1] THEN
        a[i] = a[i + 1]
    ENDIF
NEXT i`)+'<p>The array <b>a</b> contains the following data. Positions are numbered from 1.</p>'+tbl(['Position','1','2','3','4','5','6'],[['a','4','9','2','7','5','1']]),[
 gd('Select the correct item from each dropdown menu to show the contents of the array after the code is run.',['Position','1','2','3','4','5','6'],[
  ['a after',[['2','4','7','9'],3],[['2','4','7','9'],3],[['2','4','7','9'],2],[['2','4','7','9'],2],'5','1']],1,'The loop runs backwards from position 5. Each element is replaced by the element after it when that one is larger, so the largest value seen so far from the right spreads leftwards: 9, 9, 7, 7, 5, 1.')],{two:true}));

/* ---------- Question 15: 6 marks ---------- */
qs.push(Q(SEP,'A school esports league is developing an app to record matches between school teams.',[
 P('(a)',gd('Part of the data dictionary for the app is shown. Select the correct entries to complete the data dictionary. (3 marks)',['Field','Data type','Format','Example','Description'],[
  ['TeamTag',[['String','Integer','Real','Boolean','Date and time'],0],[['XXXXXXXXXXXX','NN','DD/MM/YYYY HH:MM','NNN.N','Y or N'],0],'RAVENS','Short team name, up to 12 characters'],
  ['MatchStart',[['String','Integer','Real','Boolean','Date and time'],4],[['XXXXXXXXXXXX','NN','DD/MM/YYYY HH:MM','NNN.N','Y or N'],2],'14/08/2026 15:30','When the match begins'],
  ['AveragePing',[['String','Integer','Real','Boolean','Date and time'],2],[['XXXXXXXXXXXX','NN','DD/MM/YYYY HH:MM','NNN.N','Y or N'],3],'38.5','Mean network delay in milliseconds']],3,'TeamTag is text. MatchStart holds both a date and a time. AveragePing has a decimal part, so it is a real number.')),
 P('(b)',tx('The league\'s committee has chosen the Waterfall approach to develop the app. Explain ONE advantage and ONE disadvantage of this choice for the league. (3 marks)',3,65,'An advantage is that the committee agrees all requirements and the budget at the start, and each stage is signed off, so the volunteers know exactly what will be delivered and documentation is complete for whoever maintains the app later. A disadvantage is that the app is only tested and seen as a whole near the end. If students or coaches find that features such as score entry are awkward, changing them is costly and could delay the release past the start of the season.',['1 mark: a relevant advantage of Waterfall (eg clear fixed requirements, documentation, predictable cost and schedule).','1 mark: a relevant disadvantage of Waterfall (eg late testing, hard to change requirements, users see the product late).','1 mark: links the advantage and disadvantage to the esports league scenario.']))]));

/* ---------- Question 16: 9 marks ---------- */
qs.push(Q(PW,'A maritime museum on a remote headland is developing a progressive web app (PWA) as an audio tour.'+bl(['Visitors scan a QR code at each exhibit to hear narration and watch short video clips.','There is Wi-Fi in the foyer, but mobile coverage inside the stone buildings is very poor.','Many visitors are international tourists, school groups or people with low vision or hearing loss.']),[
 P('(a)',tx('Explain how the PWA can continue to deliver the tour when a visitor loses their internet connection inside the buildings. (3 marks)',3,65,'A service worker runs in the background of the browser. When the visitor opens the PWA on the foyer Wi-Fi, the service worker caches the pages, narration files and video clips for the tour. Inside the buildings, scanning a QR code is answered from the cache instead of the network, so the content still loads. The web app manifest lets the visitor install the tour to their home screen, so it opens like an app without a connection.',['1 mark: identifies a service worker and caching.','1 mark: explains content is cached while connected (eg on the foyer Wi-Fi) and served from the cache offline.','1 mark: further relevant detail, eg the manifest allowing installation, or pre-caching large media.'])),
 P('(b)',tx('Describe how user interface (UI) and user experience (UX) principles for audio, video and navigation can make the tour accessible and inclusive. (3 marks)',3,65,'Every narration should have a text transcript and every video should have captions, so visitors with hearing loss can follow the tour. Media should not play automatically and should have large, clearly labelled controls that work with screen readers. Navigation should be consistent on every screen, with a simple exhibit list as an alternative to QR codes, large touch targets and a choice of language for international visitors.',['1 mark: an accessibility feature for audio or video (eg captions, transcripts, no autoplay, controls).','1 mark: a navigation principle (eg consistent layout, alternative to QR codes, large touch targets).','1 mark: links features to the needs of the museum\'s visitors (eg hearing or vision loss, languages, school groups).'])),
 P('(c)',tx('Explain how the developer could use a browser\'s developer (dev) tools to test the PWA before launch. (3 marks)',3,65,'The network panel can simulate offline mode or a slow connection, so the developer can confirm that cached exhibits still load. The application panel shows whether the service worker is registered, which files are in the cache and whether the manifest is valid. Device emulation shows the layout on different phone sizes, the console reports script errors, and a built-in audit such as Lighthouse checks performance and accessibility.',['1 mark: a relevant dev tools feature (eg network throttling or offline mode).','1 mark: a second feature (eg application panel for service worker, cache and manifest; device emulation; console).','1 mark: explains how the results help test the PWA\'s offline use, layout or accessibility.']))],{two:true}));

/* ---------- Questions 17 to 19 ---------- */
qs.push(Q(SEP,'A wildlife carer weighs an orphaned joey once a day and enters its weight in grams. Entry finishes when 0 is entered. At least one weight is entered before the 0.<p>The carer wants to know</p>'+bl(['the number of days on which the joey weighed less than on the previous day','the largest gain in weight from one day to the next.']),[
 ps('Using pseudocode, with a WHILE loop, write an algorithm to perform this task. You may assume that all inputs are valid.',3,`BEGIN joeyWeights
    Get weight
    previous = weight
    drops = 0
    maxGain = 0
    Get weight
    WHILE weight <> 0
        IF weight < previous THEN
            drops = drops + 1
        ELSEIF weight - previous > maxGain THEN
            maxGain = weight - previous
        ENDIF
        previous = weight
        Get weight
    ENDWHILE
    Display "Days with a lower weight: ", drops
    Display "Largest daily gain: ", maxGain
END joeyWeights`,['1 mark: a correctly structured WHILE loop with a sentinel test for 0 and a read inside the loop.','1 mark: compares each weight with the previous weight and counts the drops.','1 mark: tracks the largest gain correctly and displays both results after the loop.'])],{two:true}));
qs.push(Q(SSA,'A design company sells a desktop drawing application. Users can install plug-ins written by other developers to add new brushes and filters.',[
 tx('Explain how cryptography and sandboxing contribute to a \'security by design\' approach for this application.',3,65,'Sandboxing runs each plug-in in a restricted environment that cannot read the user\'s files, access the network or change the main program unless it is given permission, so a malicious or faulty plug-in is contained. Cryptography lets the company require plug-ins to be digitally signed, so the application can verify who wrote a plug-in and that it has not been changed. Building both in from the start means security is part of the design rather than added later.',['1 mark: explains sandboxing isolating plug-ins to limit damage.','1 mark: explains a relevant use of cryptography (eg signed plug-ins, encrypting stored files or updates).','1 mark: links these to security by design, ie built in from the start.'])]));
qs.push(Q(SEP,'A ferry wharf display shows the next departure. The departure times for the day are stored as text in the list <code>departures</code>.'+code(`departures = ["06:15", "07:40", "09:05", "12:30", "17:45"]`)+'<p>The program reads the current time in the format HH:MM. It displays the next departure at or after that time and how many minutes away it is. If there are no more departures, it displays <code>No more ferries today</code>.</p><p>For the input 08:40 the output is:</p>'+code('Next ferry: 09:05 in 25 minutes'),[
 py('Write a Python program to perform this task. Start your program with the list shown.',3,`departures = ["06:15", "07:40", "09:05", "12:30", "17:45"]
`,`departures = ["06:15", "07:40", "09:05", "12:30", "17:45"]

def to_minutes(t):
    parts = t.split(":")
    return int(parts[0]) * 60 + int(parts[1])

now = to_minutes(input("Current time (HH:MM): "))
found = False
for d in departures:
    if to_minutes(d) >= now and not found:
        print("Next ferry: " + d + " in " + str(to_minutes(d) - now) + " minutes")
        found = True
if not found:
    print("No more ferries today")`,[{i:['08:40'],o:'Next ferry: 09:05 in 25 minutes'},{i:['12:30'],o:'Next ferry: 12:30 in 0 minutes'},{i:['05:00'],o:'Next ferry: 06:15 in 75 minutes'},{i:['09:06'],o:'Next ferry: 12:30 in 204 minutes'},{i:['18:00'],o:'No more ferries today'}],['1 mark: converts HH:MM times to a comparable value (eg minutes since midnight).','1 mark: finds the first departure at or after the current time.','1 mark: correct output in the required format, including the no-more-ferries case.'])],{two:true}));

/* ---------- Questions 20 to 22 ---------- */
qs.push(Q(PW,'',[
 tx('Explain how a hash value and a digital signature allow a user\'s device to confirm that a downloaded app update has not been altered and came from the genuine developer.',3,65,'The developer calculates a hash value of the update file, then encrypts that hash with the developer\'s private key to create a digital signature. The device calculates its own hash of the downloaded file and decrypts the signature with the developer\'s public key. If the two hashes match, the file has not been altered, because any change would produce a different hash, and only the holder of the private key could have created the signature, which proves the update is genuine.',['1 mark: hashing produces a value that changes if the file changes (integrity).','1 mark: the signature is created with the private key and checked with the public key (authenticity).','1 mark: explains the comparison of hashes that confirms both.'])]));
qs.push(Q(PW,'A ferry operator stores its routes and sailings in two related tables, Routes and Sailings.',[
 sq('Construct a SQL query that displays the name of each route and the number of sailings in March 2026 on which the number of Passengers was more than 90% of the Capacity.<br>Use the column headings RouteName and BusySailings. Only routes with at least one such sailing need to be shown. List the results from the highest to the lowest number of busy sailings.',4,`SELECT Routes.RouteName, COUNT(*) AS BusySailings
FROM Routes
JOIN Sailings ON Routes.RouteID = Sailings.RouteID
WHERE Sailings.SailDate BETWEEN '2026-03-01' AND '2026-03-31'
  AND Sailings.Passengers > Sailings.Capacity * 0.9
GROUP BY Routes.RouteName
ORDER BY BusySailings DESC`,true,['1 mark: joins Routes and Sailings on RouteID.','1 mark: restricts sailings to March 2026.','1 mark: correct condition comparing Passengers with 90% of Capacity (strictly greater than).','1 mark: groups by route, counts, uses the required headings and orders from highest to lowest.'])],{two:true,db:DB21}));
qs.push(Q(SEP,'A ferry booking program is being designed. The main module <b>Book trip</b> calls four modules in order.'+bl(['<b>Get passenger details</b> returns a passenger record.','<b>Choose sailing</b> repeatedly calls <b>Check seats</b> until a sailing with free seats is chosen. It returns the sailing ID.','<b>Take payment</b> receives the passenger record and sailing ID. It calls <b>Apply concession</b> only if the passenger holds a concession card. It returns a paid flag.','<b>Issue ticket</b> receives the passenger record, sailing ID and paid flag.']),[
 dr('Create a structure chart for the ferry booking program. Show the data and control parameters passed between modules, the repetition and the decision.',3,'Book trip at the top, with four modules beneath it from left to right: Get passenger details, Choose sailing, Take payment and Issue ticket. Check seats sits under Choose sailing with a curved repetition arrow. Apply concession sits under Take payment with a decision diamond. Data couples (open circles): passenger record returned from Get passenger details; sailing ID returned from Choose sailing; passenger record and sailing ID passed to Take payment; passenger record and sailing ID passed to Issue ticket. Control couples (filled circles): paid flag returned from Take payment and passed to Issue ticket; a free-seats flag returned from Check seats.',['1 mark: correct hierarchy of the six modules, called in order from left to right.','1 mark: repetition shown on Choose sailing and Check seats, and a decision shown for Apply concession.','1 mark: data and control parameters shown with correct symbols and directions.'],'structure')],{two:true}));

/* ---------- Question 23: 9 marks ---------- */
qs.push(Q(SSA,'The ferry operator provides an application programming interface (API). Journey-planner apps and its own booking app use it.'+tbl(['Endpoint','Purpose'],[['GET /sailings?route=F1','List sailings on a route'],['POST /bookings','Create a booking'],['GET /bookings/{id}','View a booking']])+'<p>A security audit found that:</p>'+bl(['booking IDs are consecutive numbers, and any logged-in user can view any booking by changing the number in GET /bookings/{id}','error responses show the full database error, including table names','there is no limit on how many requests one API key can send.']),[
 P('(a)',tx('Explain how the API could be redesigned to minimise the vulnerabilities found in the audit. (3 marks)',3,65,'The server should check on every request that the booking belongs to the logged-in user before returning it, and use long random booking identifiers so others cannot be guessed. Errors should return a short generic message and a code, with full details written only to a server log. Rate limiting should cap the number of requests per API key in a time period, so the API cannot be scraped or flooded.',['1 mark: server-side authorisation check on each booking request (and/or unguessable IDs).','1 mark: generic error messages with details logged privately.','1 mark: rate limiting or throttling per API key.'])),
 P('(b)',tx('Explain how input validation, sanitisation and error handling should be applied to the POST /bookings endpoint. (3 marks)',3,65,'Validation checks each field on the server against the expected type, length and range, for example that the sailing ID exists and the number of passengers is a whole number from 1 to 10, rejecting anything else. Sanitisation removes or escapes characters such as quotes and angle brackets, and parameterised queries are used, so data in a name field cannot run as SQL or script. Error handling catches failures such as a full sailing and returns a clear message without crashing or revealing system details.',['1 mark: server-side validation of type, format or range with an example field.','1 mark: sanitisation or parameterised queries to stop injection.','1 mark: error handling that fails safely without revealing details.'])),
 P('(c)',gd('For each security measure, select the fundamental security concept it MAINLY supports. (3 marks)',['Security measure','Concept'],[
  ['Each request is checked to confirm the booking belongs to the logged-in user',[['Confidentiality','Integrity','Availability','Authentication','Authorisation','Accountability'],4]],
  ['Apps must present a valid API key and a signed token with every request',[['Confidentiality','Integrity','Availability','Authentication','Authorisation','Accountability'],3]],
  ['The API runs in two data centres so it stays online if one fails',[['Confidentiality','Integrity','Availability','Authentication','Authorisation','Accountability'],2]],
  ['A hash of each booking record is checked before a ticket is issued',[['Confidentiality','Integrity','Availability','Authentication','Authorisation','Accountability'],1]],
  ['Every change to a booking is logged with the user and the time',[['Confidentiality','Integrity','Availability','Authentication','Authorisation','Accountability'],5]],
  ['Passenger names are encrypted in the database',[['Confidentiality','Integrity','Availability','Authentication','Authorisation','Accountability'],0]]],3,'Authentication proves who is calling; authorisation decides what they may see. Redundancy supports availability, hashes detect changes (integrity), logs give accountability and encryption keeps data confidential.'))],{two:true}));

/* ---------- Questions 24 to 27 ---------- */
qs.push(Q(SEP,'The ferry operator is replacing its booking system. Passengers will book and pay online, and the system will store passengers\' personal details.',[
 tx('Explain how the operator can quality assure the new booking system. In your answer, refer to defining quality criteria, continual checking against requirements, and compliance with legislation.',5,110,'Quality criteria are agreed with stakeholders at the start so quality can be measured, for example that a booking takes under two minutes, pages load in under two seconds, the system is available 99.9% of the time and meets accessibility guidelines. Continual checking means the team tests against these criteria and the requirements throughout development, through code reviews, unit and integration testing, and showing each version to staff and passengers, so faults are fixed early instead of being found after release. Compliance means the system must meet relevant laws and standards: personal details must be handled under privacy law, with consent, secure storage and a process for notifying a data breach, and card payments must meet payment industry security standards. Checking compliance before release avoids penalties and protects passengers.',['5 marks: explains all three aspects in detail, with specific and relevant examples from the ferry booking system.','4 marks: explains all three aspects with some examples.','3 marks: describes two aspects, or all three with limited explanation.','2 marks: outlines some features of quality assurance.','1 mark: provides some relevant information.'])]));
qs.push(Q(SA,'An orchard uses K-nearest neighbour (KNN) classification to grade apples from two features: diameter (cm) and sugar content (°Brix). Seven graded apples are shown with a new apple, N.'+
 tbl(['Apple','Diameter (cm)','Sugar (°Brix)','Grade'],[['A','6','12','Grade B'],['B','9','14','Grade A'],['C','7','16','Grade B'],['D','5','13','Grade A'],['E','8','10','Grade B'],['F','10','15','Grade C'],['G','4','11','Grade C'],['N','7','13','?']])+
 fig('Training data','<svg viewBox="0 0 420 260" width="420" role="img" aria-label="Scatter plot of apples by diameter and sugar"><g font-family="Arial" font-size="12" fill="#000"><line x1="40" y1="230" x2="400" y2="230" stroke="#555"/><line x1="40" y1="230" x2="40" y2="20" stroke="#555"/><text x="220" y="255" text-anchor="middle">Diameter (cm)</text><text x="12" y="125" transform="rotate(-90 12 125)" text-anchor="middle">Sugar (°Brix)</text>'+
 '<text x="85" y="245" text-anchor="middle">4</text><text x="175" y="245" text-anchor="middle">6</text><text x="265" y="245" text-anchor="middle">8</text><text x="355" y="245" text-anchor="middle">10</text><text x="32" y="199" text-anchor="end">10</text><text x="32" y="149" text-anchor="end">12</text><text x="32" y="99" text-anchor="end">14</text><text x="32" y="49" text-anchor="end">16</text>'+
 '<circle cx="310" cy="95" r="6" fill="#2a6fdb"/><text x="320" y="91">B</text><circle cx="130" cy="120" r="6" fill="#2a6fdb"/><text x="140" y="116">D</text>'+
 '<rect x="169" y="139" width="12" height="12" fill="#e08a00"/><text x="185" y="141">A</text><rect x="214" y="39" width="12" height="12" fill="#e08a00"/><text x="230" y="41">C</text><rect x="259" y="189" width="12" height="12" fill="#e08a00"/><text x="275" y="191">E</text>'+
 '<polygon points="355,63 362,76 348,76" fill="#3a9a52"/><text x="365" y="68">F</text><polygon points="85,163 92,176 78,176" fill="#3a9a52"/><text x="95" y="168">G</text>'+
 '<text x="220" y="125" text-anchor="middle" font-size="18" font-weight="bold">?</text><text x="232" y="128">N</text>'+
 '<circle cx="300" cy="22" r="5" fill="#2a6fdb"/><text x="310" y="26">Grade A</text><rect x="295" y="32" width="10" height="10" fill="#e08a00"/><text x="310" y="41">Grade B</text><polygon points="300,47 305,56 295,56" fill="#3a9a52"/><text x="310" y="56">Grade C</text></g></svg>')+
 '<p>You may compare squared distances: (difference in diameter)² + (difference in sugar)².</p>',[
 P('(a)',gd('Select the grade that KNN would predict for apple N for each value of k. (2 marks)',['Value of k','Predicted grade'],[
  ['k = 1',[['Grade A','Grade B','Grade C'],1]],['k = 3',[['Grade A','Grade B','Grade C'],0]],['k = 5',[['Grade A','Grade B','Grade C'],1]]],2,'Squared distances from N: A 2, D 4, B 5, C 9, E 10, F 13, G 13. k = 1 uses A (Grade B). k = 3 uses A, D and B (two Grade A). k = 5 adds C and E, giving three Grade B.')),
 P('(b)',tx('Explain ONE advantage and ONE limitation of using KNN rather than logistic regression to grade the apples. (3 marks)',3,65,'An advantage is that KNN can classify into three or more grades directly and needs no training stage: new graded apples can be added to the data straight away. A limitation is that every prediction must calculate the distance to every stored apple, which is slow when the orchard grades thousands of apples, and the result depends on the choice of k, as part (a) shows, where the prediction changed from Grade B to Grade A and back.',['1 mark: a relevant advantage of KNN compared with logistic regression.','1 mark: a relevant limitation of KNN.','1 mark: links the points to the apple-grading scenario or the results in part (a).']))],{two:true}));
qs.push(Q(SA,'A solar-powered ferry records the hours of sunshine each day and the charge added to its batteries (kWh).'+code(`sunshine = [2, 4, 5, 7, 9]
charge = [11, 19, 24, 31, 40]`)+'<p>A linear regression model <i>y</i> = <i>mx</i> + <i>b</i> can be fitted using these formulas, where x̄ and ȳ are the means of x and y:</p>'+code(`m = Σ((x − x̄)(y − ȳ)) / Σ((x − x̄)²)
b = ȳ − m × x̄`)+'<p>The program must define a class <code>LinearModel</code> with a <code>fit(xs, ys)</code> method that calculates and stores the slope and intercept, and a <code>predict(x)</code> method. It reads a number of hours and displays the slope and intercept to 2 decimal places and the prediction to 1 decimal place.</p><p>For the input 6 the output is:</p>'+code(`Slope: 4.11
Intercept: 2.81
Predicted charge: 27.5`),[
 py('Using object-oriented programming in Python, write the program. Start your program with the two lists shown.',5,`sunshine = [2, 4, 5, 7, 9]
charge = [11, 19, 24, 31, 40]
`,`sunshine = [2, 4, 5, 7, 9]
charge = [11, 19, 24, 31, 40]

class LinearModel:
    def __init__(self):
        self.slope = 0
        self.intercept = 0

    def fit(self, xs, ys):
        n = len(xs)
        mean_x = sum(xs) / n
        mean_y = sum(ys) / n
        top = 0
        bottom = 0
        for i in range(n):
            top += (xs[i] - mean_x) * (ys[i] - mean_y)
            bottom += (xs[i] - mean_x) ** 2
        self.slope = top / bottom
        self.intercept = mean_y - self.slope * mean_x

    def predict(self, x):
        return self.slope * x + self.intercept

model = LinearModel()
model.fit(sunshine, charge)
hours = float(input("Hours of sunshine: "))
print("Slope:", round(model.slope, 2))
print("Intercept:", round(model.intercept, 2))
print("Predicted charge:", round(model.predict(hours), 1))`,[{i:['6'],o:'Slope: 4.11\nIntercept: 2.81\nPredicted charge: 27.5'},{i:['10'],o:'Slope: 4.11\nIntercept: 2.81\nPredicted charge: 43.9'},{i:['3'],o:'Slope: 4.11\nIntercept: 2.81\nPredicted charge: 15.1'}],['1 mark: defines the LinearModel class with attributes for slope and intercept.','1 mark: fit calculates the means correctly.','1 mark: fit calculates and stores the slope and intercept using the formulas.','1 mark: predict returns mx + b, and an object is created and used with the input.','1 mark: output in the required format and rounding.'])],{two:true}));
qs.push(Q(SA,'A mining company in remote Western Australia introduces autonomous haul trucks and drill rigs.'+bl(['The vehicles are supervised from an operations centre in Perth, 1200 km away.','Fatigue-related incidents on site fall sharply.','The number of truck drivers flown in to the site each fortnight falls from 140 to 35, while 60 new roles are created in Perth for remote operators, data analysts and technicians.','Machine learning plans routes and speeds that cut fuel use by 12%.','Businesses in the nearby town report fewer customers.']),[
 tx('Assess the impact of this automation on individuals, society and the environment.',6,185,'For individuals, the clearest benefit is worker safety: fatigue incidents have fallen sharply because people are no longer driving heavy vehicles on long shifts. However, 105 driving roles have gone. The 60 new roles in Perth need different skills such as data analysis, remote supervision and maintenance of automated systems, so many drivers would need retraining and may be unable or unwilling to relocate. The nature of employment shifts from manual operation to monitoring and technical work.<br>For society, the effect is uneven. Profits and high-skilled jobs move to the city, while the town that depended on fly-in workers loses business, which can widen the gap in wealth between regional and urban communities. The company could reduce this by funding retraining and local roles.<br>For the environment, a 12% cut in fuel use reduces emissions and running costs, and optimised routes reduce wear. The environmental cost of manufacturing sensors and running the operations centre is smaller but real.<br>Overall the automation is strongly positive for safety, efficiency and the environment, but its social benefits depend on how the company supports displaced workers and the town.',['6 marks: makes an informed judgement about the impact on individuals, society and the environment, with detailed, balanced reasoning supported by the scenario.','5 marks: assesses impacts on all three with clear reasoning and use of the scenario.','3–4 marks: explains positive and negative impacts, but coverage of one area or the judgement is limited.','2 marks: describes some impacts of the automation.','1 mark: provides some relevant information.'])],{two:true}));

BANKS.push({id:'14',name:'Syllabus Mock 1',sub:'Original paper · set 1 of 5 covering the whole syllabus',qs:qs});
})();
