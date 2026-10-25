/* Syllabus Mock 2. Original paper, one of five (banks 14 to 18) that together cover
   the whole Year 12 Software Engineering syllabus. Layout follows the 2025 HSC:
   27 questions, 80 marks. See docs/SYLLABUS_MOCKS.md for the coverage map. */
(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var DB21={
 Acts:{c:['ActID','ActName','Genre'],r:[
  ['A1','Velvet Static','Indie'],['A2','Bassline Bureau','Electronic'],['A3','The Gumtrees','Folk'],['A4','Neon Koi','Electronic'],['A5','Harbour Choir','Folk'],['A6','Lowlight','Indie']]},
 Performances:{c:['PerfID','ActID','Stage','Day','Crowd'],r:[
  ['P01','A1','Main','Saturday',5200],['P02','A2','Forest','Saturday',3100],['P03','A3','Garden','Saturday',1400],['P04','A4','Main','Saturday',6100],
  ['P05','A5','Forest','Saturday',900],['P06','A6','Garden','Saturday',2300],['P07','A1','Garden','Sunday',2500],['P08','A2','Main','Sunday',4800],
  ['P09','A4','Garden','Saturday',1700],['P10','A5','Main','Saturday',3000]]}};
var STATUS=['Ahead of schedule','On schedule','Behind schedule'];
var qs=[];

/* ---------- Questions 1 to 11: 1 mark each ---------- */
qs.push(Q(SEP,'An Agile team has just finished a two-week iteration of a festival app.',[
 mc('Which activity should happen next?',['Write the complete system documentation before any more code is written','Freeze the requirements for the rest of the project','Demonstrate the working features to the client and re-prioritise the remaining work','Begin a parallel implementation of the whole system'],2,'Each Agile iteration ends with a review of the working increment and the backlog is re-prioritised using the client\'s feedback before the next iteration starts.')]));
qs.push(Q(SEP,'Each member of a festival app team adds an entry to the team\'s process diary every Friday.',[
 mc('Which entry best meets the purpose of a process diary?',['Fri 14 Mar, Priya: Map search done. Slow loading fixed by caching. Next: marker clusters. Used library docs.','Fri 14 Mar: Worked hard on the festival app again this week. Everything is going well and on track.','Fri 14 Mar, Priya: A list of every website I visited during the week, with no other comments.','Fri 14 Mar, Priya: The complete source code of the map module, copied and pasted in full below.'],0,'A process diary entry records the date, the person, progress and tasks achieved, problems and how they were managed, plans for upcoming tasks, reflection and resources used. Priya\'s entry about the map search includes these; the other entries are vague or are not a record of the process.')]));
qs.push(Q(SA,'A logistic regression model is used to filter email. For one email it outputs the value 0.83.',[
 mc('What does this value represent?',['The slope of the line that separates spam from non-spam','The percentage of words in the email that are spam words','The number of spam emails the model has seen, in thousands','The estimated probability that the email belongs to the "spam" class'],3,'Logistic regression passes a weighted sum through a sigmoid function, giving a value between 0 and 1 that is read as a probability. With a threshold of 0.5, this email would be classified as spam.')]));
qs.push(Q(SSA,'',[
 mc('Which practice best protects users of a web application from session hijacking after they log in?',['Put the session ID in the web address so that the page can be bookmarked and shared','Issue a new random session ID at login, send it only over HTTPS and expire it when idle','Use the user\'s email address as the session ID so that it is easy to trace in the logs','Keep the same session ID for several months so that users rarely have to log in again'],1,'Session IDs must be unpredictable, renewed at login, protected in transit and short-lived, so a stolen or guessed ID is of little use to an attacker.')]));
qs.push(Q(PW,'Consider the following cascading style sheet (CSS) code.'+code(`.btn {
  background-color: navy;
  color: white;
  width: 200px;
}
@media (max-width: 600px) {
  .btn {
    width: 100%;
    font-size: 1.2rem;
  }
}`),[
 mc('How does an element with the class btn appear on a phone screen that is 400 pixels wide?',['Navy with white text and 200 pixels wide','In the browser\'s default style, because a media query cancels earlier rules','White with navy text, as wide as its container','Navy with white text, as wide as its container, with larger text'],3,'Both rules apply on a narrow screen. The media query changes only the width and font size, so the colours from the first rule remain.')],{two:true}));
qs.push(Q(SEP,'A team is generating ideas for a festival app.',[
 dm('Match each tool to the way it is being used by dragging the labels into the boxes.',['Brainstorming','Mind map','Storyboard','Data dictionary'],[
  ['Team members call out feature ideas for ten minutes without criticising any of them.',0],
  ['"Festival app" is written in the centre, with branches for tickets, maps and line-ups that each branch further.',1],
  ['A sequence of sketched screens shows how a user moves from the map to an act\'s details.',2],
  ['A table lists each variable\'s name, data type, size and an example value.',3]],1,{why:'Brainstorming generates ideas freely, a mind map organises related ideas around a central topic, a storyboard shows screens and navigation, and a data dictionary describes data.'})]));
qs.push(Q(SA,'Machine learning models can be trained in different ways.',[
 mt('Match each situation to the model of training it uses.',['Situation','Supervised','Unsupervised','Semi-supervised','Reinforcement'],[
  ['A drone learns to land by receiving a reward for gentle landings and a penalty for hard ones',3],
  ['Festival-goers are grouped by their ticket-scan patterns, with no groups defined in advance',1],
  ['Bus delays are predicted from two years of recorded delays and their causes',0],
  ['A bird-call classifier is trained on 200 labelled clips and 20 000 unlabelled clips',2]],1,'Rewards and penalties mean reinforcement learning; no labels means unsupervised; recorded outcomes are labels for supervised learning; a few labels with many unlabelled examples is semi-supervised.')]));
qs.push(Q(SSA,'An online ticketing system uses this logic when a user buys a seat.'+code(`IF seatsLeft > 0 THEN
    Take payment          // takes about 3 seconds
    seatsLeft = seatsLeft - 1
    Confirm booking
ENDIF`)+'<p>Two people buy the last seat at the same moment, and both bookings are confirmed.</p>',[
 mc('Which change would best prevent this problem?',['Check the value of seatsLeft a second time, just before taking the payment','Lock the record so that checking and updating seatsLeft happen as one step','Display a warning to every buyer that the event is nearly sold out','Encrypt the value of seatsLeft wherever it is stored in the database'],1,'This is a race condition: both requests read seatsLeft before either updates it. Making the check and the update atomic means the second request waits and then sees that no seats are left.')],{two:true}));
qs.push(Q(SEP,'Consider the following Python code.'+code(`count = 0

def add_visit(n):
    count = n + 1
    return count

def record():
    global count
    count = count + 5

add_visit(10)
record()
print(count)`),[
 mc('What is displayed when this code is run?',['0','16','5','11'],2,'Inside add_visit, count is a new local variable, so the global count stays 0. record declares count as global and adds 5 to it, so 5 is displayed.')],{two:true}));
qs.push(Q(SEP,'A student developer cannot get the map feature of a project to work.',[
 ms('Which of the following are appropriate strategies for responding to this difficulty?<br>(More than one may be selected.)',['Removing the feature without telling the client','Asking a peer to look at the code with them','Copying a large block of code from a website without checking its licence','Outsourcing the map component to a contractor with mapping experience','Searching developer forums and official documentation for similar problems'],[1,3,4],1,'Looking for a solution online, collaborating with peers and outsourcing are all legitimate strategies. Copying code without checking its licence and hiding changes from the client are unethical.')]));
qs.push(Q(PW,'A developer creates a page using the following HTML. The developer did not write any CSS rules for the classes used.'+code(`<link rel="stylesheet" href="https://cdn.example.com/kitcss/5.3/kit.min.css">
...
<button class="btn btn-primary btn-lg">Buy tickets</button>
<div class="row">
  <div class="col-6">Line-up</div>
  <div class="col-6">Map</div>
</div>`)+'<p>When the page is viewed, the button and the two columns are fully styled.</p>',[
 mc('What is the most likely explanation?',['The linked style sheet is a library of predesigned CSS classes, which the developer applies by name','The browser automatically styles any element whose class contains "btn" or "col"','The styles are stored in the HTML elements themselves','A template engine has generated the CSS rules from the class names'],0,'Front-end libraries supply predesigned classes for buttons, grids and other components. Linking the style sheet and adding the class names applies them, giving a consistent look quickly.')],{two:true}));

/* ---------- Questions 12 and 13: 2 marks each ---------- */
qs.push(Q(PW,'',[
 od('A user types <b>festival.example.com.au/lineup</b> into a browser. Place the steps in the order in which they occur by dragging the steps into position.',`
# BEGIN LoadPage
    = User enters festival.example.com.au/lineup
    Ask DNS for the IP address of festival.example.com.au
    Open a TCP connection to that IP address on port 443
    Complete the TLS handshake and agree a session key
    Send an HTTP GET request for /lineup
    Web server passes the request to the framework, which queries the database
    Return an HTML response for the browser to render
# END LoadPage`,2,{extra:['Send the user\'s password to the DNS server'],why:'The domain name must be resolved to an IP address before a connection can be opened. HTTPS then needs a TCP connection and a TLS handshake before the encrypted HTTP request is sent. The server builds the page from the database and returns it.'})]));
qs.push(Q(SSA,'A software company uses several strategies to manage the security of its code.',[
 dm('Match each strategy to its description by dragging the labels into the boxes.',['Code review','SAST','DAST','Vulnerability assessment','Penetration testing'],[
  ['A senior developer reads a colleague\'s changes and asks why user input reaches a database query unchecked.',0],
  ['A tool scans the source code on every commit and flags a password written into the code.',1],
  ['A tool sends malformed requests to the running test site and reports a page that reflects script back to the browser.',2],
  ['Servers are scanned for unpatched software and open ports, producing a prioritised list of weaknesses.',3],
  ['An authorised ethical hacker tries to combine weaknesses to reach the payments database.',4]],2,{why:'Code review and SAST examine code without running it (by a person and by a tool). DAST tests the running application. A vulnerability assessment identifies and ranks weaknesses, while penetration testing actively exploits them as an attacker would.'})]));

/* ---------- Question 14: 1 mark ---------- */
qs.push(Q(SEP,'Consider the following algorithm. Character positions are numbered from 1.'+code(`Set word = "PARALLEL"
Set count = 0
FOR i = 1 TO LENGTH(word) - 2
    IF word[i] = word[i + 2] THEN
        count = count + 1
    ENDIF
NEXT i
Display count`),[
 dd('Select the correct item from the dropdown menu to show the value displayed.','The value displayed is {0}.',[[['0','1','2','3'],2]],1,'Each letter is compared with the letter two places later. Matches occur at positions 2 and 4 (A, A) and positions 6 and 8 (L, L), so count is 2.')],{two:true}));

/* ---------- Question 15: 6 marks ---------- */
qs.push(Q(SEP,'A music festival sells wristbands. Children under 12 are free. Everyone else pays $95 per day, with $40 off for buying all three days. The variable days is a whole number from 1 to 3.'+code(`BEGIN wristbandPrice
    Get age, days
    IF age < 12 THEN
        price = 0
    ELSE
        price = 95 * days
        IF days = 3 THEN
            price = price - 40
        ENDIF
    ENDIF
    Display "Price: $", price
END wristbandPrice`),[
 P('(a)',ft('Provide a set of test data that will thoroughly test the algorithm using path and boundary testing. Include the expected outputs and reasons for inclusion. (3 marks)',3,
  ['Test data<br>(age, days)','Expected output','Reason for inclusion'],4,
  [['11, 2','Price: $0','Boundary: oldest age that is free (child path)'],['12, 1','Price: $95','Boundary: youngest paying age; one day, no discount'],['30, 2','Price: $190','Adult path without the discount (days just below 3)'],['30, 3','Price: $245','Adult path through the three-day discount']],
  ['1 mark: test data that covers every path (child, adult without discount, adult with discount).','1 mark: boundary values at age 11 and 12 (and days 2 and 3).','1 mark: correct expected outputs, each with a relevant reason.'],{widths:['22%','22%','56%']})),
 P('(b)',tx('During testing, the input age 12, days 3 displays <code>Price: $0</code>. Explain how comparing actual output with expected output helps the team evaluate the program, and what the team should do next. (3 marks)',3,65,'The expected output for age 12 and three days is $245, so the actual output of $0 shows a fault rather than leaving it unnoticed. Because 12 is a boundary value, the mismatch suggests the program uses age <= 12 instead of age < 12. The team should record the failed test, use a debugging tool such as a breakpoint or watch on age to confirm the cause, correct the condition, then rerun all of the tests to check the fix has not broken anything else.',['1 mark: identifies that actual and expected outputs differ ($0 instead of $245), revealing an error.','1 mark: links the error to the boundary condition (eg <= 12 used instead of < 12).','1 mark: describes next steps (record the result, debug and correct, rerun the tests).']))],{two:true}));

/* ---------- Question 16: 9 marks ---------- */
qs.push(Q(PW,'A volunteer-run community radio station broadcasts on FM and streams live on its website.'+bl(['The website shows the program guide, news and past episodes as podcasts.','About 40 volunteer presenters, most with no coding skills, need to add show notes and upload episodes each week.','Most listeners use phones. When a popular interview is released, thousands of people download it within an hour.']),[
 P('(a)',tx('Evaluate the use of a web content management system (CMS) for the station\'s website. (3 marks)',3,65,'A CMS suits the station well because presenters can add show notes and upload episodes through a simple editor without writing HTML, and themes keep every page consistent. Roles can restrict what each volunteer can change. However, popular CMSs are common targets for attackers, so plug-ins and the core must be kept updated, and heavy plug-ins can slow pages. On balance a CMS is appropriate, provided someone is responsible for updates and security.',['1 mark: a benefit of a CMS for non-technical volunteers (eg editing without code, templates, roles).','1 mark: a limitation or risk (eg security updates, plug-in performance, less flexibility).','1 mark: makes a judgement linked to the station\'s situation.'])),
 P('(b)',tx('Explain how the station could manage load times when a popular episode is released. (3 marks)',3,65,'The audio files could be served from a content delivery network, so listeners download from a nearby server and the station\'s own server is not overloaded. Pages can be cached and images compressed and lazy-loaded so the episode page loads quickly on phones. The audio itself can be compressed to a sensible bit rate and streamed progressively, so playback starts before the whole file has downloaded.',['1 mark: one relevant technique (eg CDN, caching, compression).','1 mark: a second technique (eg lazy loading, progressive streaming, reduced bit rate, minified code).','1 mark: explains how the techniques reduce load time or server load during the spike.'])),
 P('(c)',tx('Explain how the station could use metadata and data mining to manage its live stream and podcasts. (3 marks)',3,65,'Each stream connection and download produces metadata such as the time, the device type, the approximate location and how long the listener stayed. Data mining this data reveals patterns, for example peak listening times and which shows lose listeners after ten minutes. The station can use the patterns to add streaming capacity at peak times, choose sensible bit rates for the devices people use and schedule popular content, while protecting listeners\' privacy by storing only summarised data.',['1 mark: identifies relevant metadata generated by streams or downloads.','1 mark: explains data mining as finding patterns in large amounts of data.','1 mark: explains how the patterns help manage the streaming service (eg capacity, scheduling, quality).']))],{two:true}));

/* ---------- Questions 17 to 19 ---------- */
qs.push(Q(SEP,'A citizen-science group counts birds at 20 survey sites. The counts are stored in the array <b>Counts</b>, with positions numbered from 1 to 20. All of the counts are different.',[
 dr('Draw a flowchart for an algorithm that displays the highest count and the second-highest count WITHOUT sorting the array. Use the standard flowchart symbols.',3,'Terminator "Begin". Process: highest = Counts[1], second = -1, i = 2. Decision "i <= 20?" (pre-test loop). Yes branch: decision "Counts[i] > highest?"; Yes leads to process "second = highest, highest = Counts[i]"; No leads to decision "Counts[i] > second?" with Yes to process "second = Counts[i]". Both paths join and go to process "i = i + 1", which returns to the loop decision. No branch of "i <= 20?" leads to an input/output parallelogram "Display highest, second", then terminator "End". Every arrow from a decision is labelled Yes or No.',['1 mark: correct symbols (terminators, process rectangles, decision diamonds, input/output parallelogram) with arrowheads and labelled decision branches.','1 mark: a correctly structured loop that visits every element from position 2 to 20.','1 mark: correct nested decisions that update the highest and second-highest values, with both displayed after the loop.'],'flowchart')],{two:true}));
qs.push(Q(SSA,'A hospital is developing two applications that use the same medication database.'+bl(['A patient app used mostly by elderly people to view their prescriptions and request repeats.','A console used by trained pharmacists to dispense and change medications.']),[
 tx('Describe how the capabilities and experience of these end users should influence the secure design features of each application.',3,65,'Elderly patients may have limited technical experience and poorer eyesight, so security must be simple: large clear screens, sign-in with a passkey or face recognition instead of complex passwords, sensible defaults and plain-language warnings, so they are not tempted to bypass security. Pharmacists are trained and handle sensitive changes, so their console can use stronger controls such as multi-factor authentication, role-based permissions, short session timeouts and audit logs of every change, because they can be trained to use them.',['1 mark: a secure design feature suited to the elderly patients\' capabilities.','1 mark: a secure design feature suited to the trained pharmacists.','1 mark: explains why user capability or experience leads to the different features.'])]));
qs.push(Q(PW,'The file <code>survey.txt</code> holds one line for each survey site. The first lines of the program, shown below, create the file.'+code(`lines = ["Site 1: wren, magpie", "Site 2: kookaburra",
         "Site 3: Fairy-wren, Wren", "Site 4: magpie, lorikeet"]
with open("survey.txt", "w") as f:
    for line in lines:
        print(line, file=f)`)+'<p>The program must:</p>'+bl(['create a folder called <code>results</code> if it does not already exist','read a search word from the user','write every line of survey.txt that contains the word, ignoring upper and lower case, into the file <code>results/matches.txt</code>','display each matching line, then the number of matches.'])+'<p>For the search word <code>wren</code> the output is:</p>'+code(`Site 1: wren, magpie
Site 3: Fairy-wren, Wren
Matches: 2`),[
 py('Write the program in Python. Start your program with the lines shown.',3,`lines = ["Site 1: wren, magpie", "Site 2: kookaburra",
         "Site 3: Fairy-wren, Wren", "Site 4: magpie, lorikeet"]
with open("survey.txt", "w") as f:
    for line in lines:
        print(line, file=f)
`,`import os

lines = ["Site 1: wren, magpie", "Site 2: kookaburra",
         "Site 3: Fairy-wren, Wren", "Site 4: magpie, lorikeet"]
with open("survey.txt", "w") as f:
    for line in lines:
        print(line, file=f)

word = input("Search word: ").lower()
os.makedirs("results", exist_ok=True)
count = 0
with open("survey.txt") as source:
    with open("results/matches.txt", "w") as out:
        for line in source:
            if word in line.lower():
                print(line.strip())
                out.write(line)
                count = count + 1
print("Matches:", count)`,[{i:['wren'],o:'Site 1: wren, magpie\nSite 3: Fairy-wren, Wren\nMatches: 2'},{i:['MAGPIE'],o:'Site 1: wren, magpie\nSite 4: magpie, lorikeet\nMatches: 2'},{i:['emu'],o:'Matches: 0'},{i:['kookaburra'],app:'\nprint(open("results/matches.txt").read().strip())',o:'Site 2: kookaburra\nMatches: 1\nSite 2: kookaburra'}],['1 mark: creates the results folder only if it does not exist (eg os.makedirs with exist_ok=True).','1 mark: reads the file and finds lines containing the word, ignoring case.','1 mark: writes the matching lines to results/matches.txt and displays the lines and the count.'])],{two:true}));

/* ---------- Questions 20 to 22 ---------- */
qs.push(Q(SA,'',[
 tx('Distinguish between a decision tree and a neural network as models for designing machine learning solutions. Refer to how easily each model\'s decisions can be explained.',3,65,'A decision tree makes a prediction by following a series of yes/no tests on features from the root to a leaf, so every decision can be traced and explained, for example "wind over 40 km/h, so the track is closed". A neural network passes inputs through layers of connected nodes with learned weights and activation functions. It can model far more complex patterns, such as images or speech, but its reasoning is spread across thousands of weights, so it is hard to explain why it made a particular decision.',['1 mark: describes how a decision tree reaches a decision.','1 mark: describes how a neural network reaches a decision.','1 mark: contrasts their explainability (and/or complexity of patterns handled).'])]));
qs.push(Q(PW,'A music festival stores its acts and performances in two related tables, Acts and Performances.',[
 sq('Construct a SQL query that displays each Genre and the total Crowd for performances on Saturday, excluding performances on the Forest stage.<br>Use the column headings Genre and TotalCrowd. List the results from the highest to the lowest total crowd.',4,`SELECT Acts.Genre, SUM(Performances.Crowd) AS TotalCrowd
FROM Acts, Performances
WHERE Acts.ActID = Performances.ActID
AND Performances.Day = 'Saturday' AND Performances.Stage <> 'Forest'
GROUP BY Acts.Genre
ORDER BY TotalCrowd DESC`,true,['1 mark: links Acts and Performances on ActID (in the WHERE clause or with a JOIN).','1 mark: WHERE clause selects Saturday and excludes the Forest stage.','1 mark: groups by Genre and sums Crowd.','1 mark: uses the required headings and orders from highest to lowest.'])],{two:true,db:DB21}));
qs.push(Q(SA,'A national park service uses a trained model to decide what to do with a walking track each morning.'+bl(['If the fire danger rating is Extreme, the track is closed.','If the rating is High, the track is closed when the wind speed is above 40 km/h. Otherwise it opens with a warning.','If the rating is Low or Moderate, the track opens.']),[
 dr('Draw a decision tree for the model.',3,'Root node: "Fire danger rating?" with three branches. Extreme leads to the leaf "Close track". High leads to a decision node "Wind > 40 km/h?" with Yes to "Close track" and No to "Open with warning". Low or Moderate leads to the leaf "Open track". (Equivalent trees using binary questions, eg "Extreme?" then "High?", are acceptable.)',['1 mark: root test on fire danger rating with correctly labelled branches.','1 mark: wind speed test placed only on the High branch.','1 mark: all four outcomes correct, with labelled branches and leaves.'],'tree')],{two:true}));

/* ---------- Question 23: 9 marks ---------- */
qs.push(Q(SSA,'<b>VolunteerHub</b> is a web application that an emergency service uses to roster volunteers. Volunteers log in, post comments on shifts and update their contact details. A security review found three problems:'+bl(['A comment containing a script stole the session cookies of coordinators who viewed the shift page.','A volunteer clicked a link in an email while logged in, and their phone number was changed without their knowledge.','After login, the page in the <code>?next=</code> parameter is opened, even when it is on another website.']),[
 P('(a)',tx('Explain how the cross-site scripting (XSS) problem arose and how secure code can prevent it. (3 marks)',3,65,'The comment was stored and later inserted into the shift page without being encoded, so the browser of every coordinator who viewed the page ran the script as if it came from VolunteerHub, letting it read their session cookies. Secure code validates comments on input and encodes output, turning characters such as &lt; and &gt; into harmless entities, so the comment is displayed as text. Marking session cookies HttpOnly and using a content security policy stop scripts from reading cookies or running from untrusted sources.',['1 mark: explains that unencoded user input was run as script in other users\' browsers.','1 mark: output encoding or escaping (and/or input sanitisation) as the main prevention.','1 mark: a further measure or detail (eg HttpOnly cookies, content security policy).'])),
 P('(b)',tx('Explain how a cross-site request forgery (CSRF) attack could change a volunteer\'s phone number, and how it can be prevented. (3 marks)',3,65,'The email link led to a page that silently submitted a request to VolunteerHub\'s update-details address. Because the volunteer was logged in, the browser automatically attached their session cookie, so the server treated the forged request as genuine and changed the number. It can be prevented by including a secret, unpredictable CSRF token in every form and rejecting requests without it, setting cookies to SameSite, and asking for the password again before contact details change.',['1 mark: explains the forged request is sent from another site while the user is logged in.','1 mark: explains the browser attaches the session cookie so the server trusts it.','1 mark: a valid prevention (eg anti-CSRF tokens, SameSite cookies, re-authentication).'])),
 P('(c)',gd('For each further issue found in VolunteerHub, select the vulnerability it represents. (3 marks)',['Issue','Vulnerability'],[
  ['The <code>?next=</code> parameter sends users to a lookalike site after they log in',[['Cross-site scripting','Cross-site request forgery','Invalid forwarding and redirecting','Broken authentication and session management','Race condition','File attack','Side-channel attack'],2]],
  ['Session IDs never expire and are not changed after login',[['Cross-site scripting','Cross-site request forgery','Invalid forwarding and redirecting','Broken authentication and session management','Race condition','File attack','Side-channel attack'],3]],
  ['Two coordinators assign the last place on a truck at the same moment, and both succeed',[['Cross-site scripting','Cross-site request forgery','Invalid forwarding and redirecting','Broken authentication and session management','Race condition','File attack','Side-channel attack'],4]],
  ['Uploading a certificate named ../../app/settings.py overwrites a file on the server',[['Cross-site scripting','Cross-site request forgery','Invalid forwarding and redirecting','Broken authentication and session management','Race condition','File attack','Side-channel attack'],5]],
  ['Login takes noticeably longer for registered email addresses, revealing who is a volunteer',[['Cross-site scripting','Cross-site request forgery','Invalid forwarding and redirecting','Broken authentication and session management','Race condition','File attack','Side-channel attack'],6]]],3,'Unchecked redirects are invalid forwarding; weak session handling is broken authentication; simultaneous updates are a race condition; a crafted file name is a file attack; and timing differences leak information through a side channel.'))],{two:true}));

/* ---------- Questions 24 to 27 ---------- */
qs.push(Q(SA,'A hospital emergency department is trialling an AI chatbot on tablets in its waiting room. Patients describe their symptoms and the chatbot suggests a priority for the triage nurse to review. Many patients using it are in pain, frightened, or caring for a sick child.',[
 tx('Explain how patterns in human behaviour, including psychological responses and the acute stress response, should influence the development of this chatbot.',5,110,'People under acute stress experience a "fight or flight" response: attention narrows, short-term memory and reading comprehension fall, and they may panic or become frustrated. The chatbot should therefore ask one short, plain-language question at a time, use large buttons and pictures, avoid medical jargon and allow voice input, and never require long free-text answers. Psychological responses also affect what people report: frightened patients may exaggerate or play down symptoms, and some will distrust a machine. The training data and prompts should account for this, for example by asking about specific signs such as difficulty breathing, and the chatbot must always say that a nurse will review the answers, with an obvious button to call staff. A calm tone and reassurance reduce anxiety, and testing with real stressed users rather than calm volunteers checks that the design works.',['5 marks: explains in detail how both the acute stress response and psychological responses should shape the design, with specific features linked to the scenario.','4 marks: explains how both influence the design with some specific features.','3 marks: explains one pattern in detail, or both with limited links to the design.','2 marks: describes some relevant behaviour patterns or design features.','1 mark: provides some relevant information.'])],{two:true}));
qs.push(Q(SEP,'A team is building a festival app. The Gantt chart shows the project at the end of week 6.'+ctbl(['Task','1','2','3','4','5','6','7','8','9','10'],[
 ['Requirements','D','D','','','','','','','',''],
 ['Design','','','D','D','','','','','',''],
 ['Build ticketing','','','','','D','P','P','','',''],
 ['Build map','','','','','D','P','','','',''],
 ['Payments integration','','','','','','','P','P','',''],
 ['Testing','','','','','','','','P','P',''],
 ['Installation','','','','','','','','','','P'],
 ['Launch milestone','','','','','','','','','','◆']],{D:'#9fd8a8',P:'#bcd4f6'},'Festival app project (week beginning 2 February)')+'<p><b>D</b> (green) shows weeks of work completed. <b>P</b> (blue) shows planned weeks of work not yet completed. ◆ marks a milestone. Payments integration depends on Build ticketing, and Testing depends on both builds.</p>',[
 P('(a)',gd('Select the correct entry for each row. (2 marks)',['Item','Answer'],[
  ['Status of Build ticketing',[STATUS,2]],['Status of Build map',[STATUS,2]],['Status of Payments integration',[STATUS,1]],
  ['Task that cannot begin until both builds are finished',[['Design','Payments integration','Testing','Installation'],2]],
  ['Will the launch milestone be met if the remaining tasks take as long as planned?',[['Yes','No'],1]]],2,'The launch milestone will slip unless the team catches up, because testing cannot start until both late builds finish. By the end of week 6, ticketing should have two weeks done and the map should be finished, but each has only one week done. Payments integration is not due to start until week 7. Testing depends on both builds.')),
 P('(b)',tx('Explain how project management software and collaboration tools could help the team track progress and bring the project back on schedule. (3 marks)',3,65,'Project management software updates the Gantt chart as tasks are marked complete, so the manager can see immediately that both builds are behind and that testing will be delayed, and can reassign people or adjust dependent tasks. Collaboration tools such as a shared task board, chat channels and a shared code repository let developers see who is working on what, raise blockers quickly and share work, so a developer finishing payments early could help with the map.',['1 mark: explains how scheduling and tracking software shows progress against the plan.','1 mark: explains how collaboration tools help the team communicate or share work.','1 mark: links these to recovering the schedule in this project.']))],{two:true}));
qs.push(Q(SA,'A council uses a small, already-trained neural network to decide whether to send a flood alert. Each neurone accepts binary input signals (1 or 0). It multiplies each input by its weighting and adds the results. If the total is greater than or equal to the neurone\'s threshold it outputs 1; otherwise it outputs 0.'+tbl(['Neurone','Inputs','Weightings','Threshold'],[['Hidden 1','rain, river, dam','0.6, 0.7, 0.1','1.2'],['Hidden 2','rain, river, dam','0.2, 0.5, 0.9','1.3'],['Output','Hidden 1, Hidden 2','0.8, 0.8','0.8']])+'<p>The inputs are <b>rain</b> (1 if heavy rain is forecast), <b>river</b> (1 if the river is above its warning level) and <b>dam</b> (1 if the dam upstream is releasing water).</p><p>The program must define a class <code>Neurone</code> whose constructor stores a list of weightings and a threshold, and whose method <code>fire(inputs)</code> returns 1 or 0. It reads the three inputs, then displays the outputs of the two hidden neurones and the decision: <code>Flood alert</code> if the output neurone fires, otherwise <code>No alert</code>.</p><p>For the inputs 1, 1 and 0 the output is:</p>'+code(`Hidden outputs: 1 0
Flood alert`),[
 py('Using object-oriented programming in Python, write the program that carries out the execution cycle of this network.',5,'',`class Neurone:
    def __init__(self, weightings, threshold):
        self.weightings = weightings
        self.threshold = threshold

    def fire(self, inputs):
        total = 0
        for i in range(len(inputs)):
            total = total + inputs[i] * self.weightings[i]
        if total >= self.threshold:
            return 1
        return 0

hidden1 = Neurone([0.6, 0.7, 0.1], 1.2)
hidden2 = Neurone([0.2, 0.5, 0.9], 1.3)
output = Neurone([0.8, 0.8], 0.8)

rain = int(input("Heavy rain forecast (1 or 0): "))
river = int(input("River above warning level (1 or 0): "))
dam = int(input("Dam releasing water (1 or 0): "))
signals = [rain, river, dam]
h1 = hidden1.fire(signals)
h2 = hidden2.fire(signals)
print("Hidden outputs:", h1, h2)
if output.fire([h1, h2]) == 1:
    print("Flood alert")
else:
    print("No alert")`,[{i:['1','1','0'],o:'Hidden outputs: 1 0\nFlood alert'},{i:['0','1','1'],o:'Hidden outputs: 0 1\nFlood alert'},{i:['1','0','1'],o:'Hidden outputs: 0 0\nNo alert'},{i:['1','1','1'],o:'Hidden outputs: 1 1\nFlood alert'},{i:['0','0','0'],o:'Hidden outputs: 0 0\nNo alert'}],['1 mark: Neurone class with a constructor storing the weightings and threshold.','1 mark: fire calculates the weighted total of the inputs.','1 mark: fire compares the total with the threshold and returns 1 or 0.','1 mark: creates three neurones with the given values and passes the hidden outputs to the output neurone.','1 mark: reads the inputs and displays the hidden outputs and decision in the required format.'])],{two:true}));
qs.push(Q(SSA,'<b>GigGrid</b>, a start-up, built a festival app in six weeks.'+bl(['To save time, it copied code from an open-source scheduling library whose licence requires any app that includes it to publish its own source code. GigGrid\'s app is closed-source.','The line-up pages use band photos found online, without permission.','The app records each attendee\'s precise location every minute to show crowd heat maps. The data is kept indefinitely on a server that still uses its default administrator password.','GigGrid plans to sell attendees\' location histories to advertisers.']),[
 tx('Evaluate the social, ethical and legal issues arising from the development of GigGrid\'s app. In your answer, refer to copyright, intellectual property, privacy and data security.',6,185,'Copyright and intellectual property: GigGrid has breached the open-source licence. The library\'s authors allowed reuse only on condition that derived apps publish their source, so using it in a closed-source app infringes their copyright and could force GigGrid to release its code or remove the feature. Using band photos without permission infringes the photographers\' copyright, exposing GigGrid to takedown notices and damages, and is ethically unfair to creators whose work is their income.<br>Privacy: tracking precise location every minute collects far more data than a heat map needs, which could be shown with anonymous, aggregated counts. Keeping it forever and planning to sell it without clear, informed consent is unethical and likely breaches privacy law, which requires collection to be necessary, disclosed and used only for the stated purpose. Location histories can reveal where people live and who they are with.<br>Data security: a default administrator password makes a breach very likely. A breach of location data could cause real harm, damage trust in GigGrid and the festival, and trigger regulatory penalties and mandatory breach notifications.<br>Socially, fast development benefited GigGrid, but it shifted the risks onto artists and attendees. GigGrid should replace or comply with the library licence, license or remove the photos, minimise and anonymise location data with consent and deletion periods, and secure the server. As it stands, the app\'s legal and ethical problems outweigh the benefit of the quick launch.',['6 marks: makes an informed judgement, evaluating copyright, intellectual property, privacy and data security issues in detail, with clear links to the scenario and social, ethical and legal consequences.','5 marks: evaluates all four areas with clear reasoning and use of the scenario.','3–4 marks: explains several issues, but some areas or the judgement are limited.','2 marks: describes some social, ethical or legal issues.','1 mark: provides some relevant information.'])],{two:true}));

BANKS.push({id:'15',name:'Syllabus Mock 2',sub:'Original paper · set 2 of 5 covering the whole syllabus',qs:qs});
})();
