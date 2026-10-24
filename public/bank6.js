(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var DB21={Films:{c:['FilmID','Title','Genre'],r:[['F1','Orbit Fall','Sci-fi'],['F2','Quiet Hills','Drama'],['F3','Dog Park','Comedy'],['F4','Last Train','Drama']]},
 Sessions:{c:['SessionID','FilmID','Day','Tickets','Price'],r:[['S1','F1','Fri',80,18],['S2','F1','Sat',120,18],['S3','F2','Fri',40,15],['S4','F2','Sat',60,15],['S5','F3','Sat',90,12],['S6','F3','Sun',30,12],['S7','F4','Sat',70,15],['S8','F1','Sun',55,18]]}};
var qs=[];
qs.push(Q(SEP,'A designer wants to show a client how the screens of a new app will look and how the user moves from one screen to the next.',[
 mc('Which tool is the most suitable for this purpose?',['Storyboard','Data dictionary','Gantt chart','Structure chart'],0,'A storyboard shows the screens in order and the paths between them. A Gantt chart shows a schedule.')]));
qs.push(Q(SEP,'',[
 dd('Complete the statement by selecting the correct term from each dropdown menu.','In a {0} implementation, the old system is stopped and the new system starts straight away. In a {1} implementation, both systems run together for a time.',[[['Direct','Parallel','Pilot','Phased'],0],[['Direct','Parallel','Pilot','Phased'],1]],1,'Direct changes over at once. Parallel runs the old and new systems together so results can be compared.')]));
qs.push(Q(SA,'A speech recognition model is trained only on recordings of adults from one city. It makes many more mistakes with children and with people who have other accents.',[
 mc('What is the most likely cause of the mistakes?',['The training data did not represent all of the users (dataset bias)','Too much test data was used','The model used unsupervised learning','The software was written in the wrong language'],0,'A dataset that leaves out groups of users produces a model that works poorly for them.')]));
qs.push(Q(SEP,'Consider the following Python code.'+code(`stock = {"pen": 4, "ink": 0, "pad": 7}
total = 0
for item in stock:
    if stock[item] > 0:
        total += stock[item]
print(total)`),[
 mc('What is displayed when this code is run?',['4','7','11','3'],2,'Only items with a quantity above 0 are added. pen (4) and pad (7) are added, giving 11.')]));
qs.push(Q(PW,'',[
 mc('A browser requests a web page and receives HTTP status code 500. What does this mean?',['The server met an error while handling the request','The page has moved permanently','The user is not allowed to view the page','The request was successful'],0,'Status codes in the 500 range show a server error.')]));
qs.push(Q(PW,'',[
 mc('What is the main benefit of placing styles in one external CSS file that is shared by every page of a website?',['The appearance stays consistent and can be changed in one place','The pages load without needing HTML','The browser cannot change the styles','JavaScript is no longer needed'],0,'A shared style sheet keeps pages looking the same and makes maintenance easier.')]));
qs.push(Q(PW,'',[
 mc('Which HTML element should be used for the main group of navigation links so that screen readers can identify it?',['The nav element','The div element','The span element','The section element'],0,'The nav element gives the links a meaning that assistive technology can use. A div has no meaning.')]));
qs.push(Q(SSA,'A website displays each comment exactly as it was typed. An attacker posts a comment that contains a script. Every visitor who opens the page runs the script.',[
 mc('Which vulnerability does this describe?',['Cross-site scripting (XSS)','Cross-site request forgery (CSRF)','Race condition','Side-channel attack'],0,'Unsanitised input is shown to other users and run in their browsers, which is cross-site scripting.')]));
qs.push(Q(PW,'Web applications store data in different kinds of databases.',[
 mt('Match each description to a type of database.',['Description','Relational (SQL) database','Non-SQL database'],[['Data is stored in tables with rows and columns that are linked by keys',0],['Data may be stored as flexible documents such as JSON',1],['Queries are written using SELECT, WHERE and JOIN',0],['Records in the same collection do not all need the same fields',1]],1,'')]));
qs.push(Q(SEP,'',[
 ms('Which of the following are closed loop control systems?',['A thermostat that switches a heater on and off using a temperature sensor','A toaster that heats for a fixed time set by the user','A cruise control that adjusts the throttle to hold a set speed','A sprinkler timer that runs for ten minutes every day','A line-following robot that corrects its direction using light sensor readings'],[0,2,4],1,'A closed loop system uses feedback from a sensor to adjust its output.')]));
qs.push(Q(SEP,'',[
 ms('Which of the following statements about data structures are correct?',['A stack removes the item that was added most recently','A hash table uses a key to work out where a value is stored','In a tree, each node is connected to one or more child nodes','A stack lets the user remove any item at any time','A hash table must be searched from the first item to the last'],[0,1,2],1,'A stack is last in, first out. A hash table finds a value from its key. A tree links parent nodes to child nodes.')]));
qs.push(Q(SEP,'',[
 ms('Which of the following are equal to the decimal number 26?<br>Select all that apply.',['11010 (binary)','1A (hexadecimal)','10110 (binary)','1F (hexadecimal)','00011010 (binary)'],[0,1,4],2,'11010 in binary is 16 + 8 + 2 = 26. Hexadecimal 1A is 16 + 10 = 26. 00011010 is the same as 11010.')]));
qs.push(Q(SEP,'Standard data types are used to store data.',[
 gd('For each data item, select the most appropriate data type.',['Data item','Data type'],[
  ['A student\'s grade letter, such as B',[['char','string','Boolean','integer','real','date and time'],0]],
  ['The time that a bus departs',[['char','string','Boolean','integer','real','date and time'],5]],
  ['Whether a seat has been booked',[['char','string','Boolean','integer','real','date and time'],2]],
  ['The price of a ticket, such as 12.50',[['char','string','Boolean','integer','real','date and time'],4]]],2,'')]));
qs.push(Q(SEP,'Consider the following pseudocode.'+code(`Set total = 0
Set n = 10
WHILE n > 0
    IF n MOD 3 = 0 THEN
        Set total = total + n
    ENDIF
    Set n = n - 2
ENDWHILE
Display total`),[
 dd('Select the correct item from the dropdown menu to show the value displayed.','The value displayed is {0}.',[[['0','6','9','18'],1]],1,'n takes the values 10, 8, 6, 4 and 2. Only 6 is a multiple of 3, so total is 6.')]));
qs.push(Q(SEP,'A council is developing an app for residents to report broken streetlights. Part of the data dictionary for the app is shown.',[
 P('(a)',gd('Select the correct entries to complete the data dictionary. (3 marks)',['Variable','Example value','Data type','Validation check'],[
  ['reportId','R-2045',[['String','Integer','Real','Boolean','Date'],0],[['Range check','Presence check','Type check','Format check'],3]],
  ['suburb','Marrickville',[['String','Integer','Real','Boolean','Date'],0],[['Range check','Presence check','Type check','Format check'],1]],
  ['lightsOut','2',[['String','Integer','Real','Boolean','Date'],1],[['Range check','Presence check','Type check','Format check'],0]]],3,'')),
 P('(b)',tx('Outline how test data chosen for path testing is different from test data chosen for boundary testing. (3 marks)',3,55,'Test data for path testing is chosen so that every route through the code runs at least once, for example one value that makes an IF condition true and one that makes it false. Test data for boundary testing is chosen at and either side of the limits of an allowed range, such as the lowest valid value, the highest valid value and the values just outside them.',['3 marks: outlines both types of test data and states a difference.','2 marks: outlines one type well or both with limited detail.','1 mark: identifies one type.']))],{two:true}));
qs.push(Q(PW,'A community theatre is developing a website that sells tickets, shows videos of past shows and lets staff update the show details.',[
 P('(a)',tx('Explain how a content management system (CMS) could help the theatre\'s staff manage the website. (3 marks)',3,60,'A CMS lets staff add and change show details, images and videos through forms without writing HTML or code. Templates keep every page looking the same, and staff can be given different permissions, such as one person who can publish and another who can only draft. This saves developer time and lets the theatre keep information up to date.',['3 marks: explains editing without code, templates or permissions, and links them to the theatre.','2 marks: explains one feature with a link to the theatre.','1 mark: identifies a CMS feature.'])),
 P('(b)',tx('Describe the back-end process that occurs when a customer opens the page for buying a ticket. (3 marks)',3,60,'The web server software receives the request and passes it to the web framework. The framework runs the code for that page, which asks the database for the show details and the seats that are still available. The framework builds the page from this data and the web server sends it back to the customer\'s browser.',['3 marks: describes the web server, the framework or code, and the database in a logical order.','2 marks: describes two parts of the process.','1 mark: identifies one part of the process.'])),
 P('(c)',tx('Explain how the theatre could apply user interface (UI) and user experience (UX) principles of font, colour and navigation to make the website inclusive. (3 marks)',3,60,'The website should use a clear font that can be enlarged without breaking the layout. Colours should have enough contrast between text and background, and the website should not use colour alone to show a seat is taken. Navigation should be consistent on every page, with clear labels and a keyboard-friendly menu, so that people with vision or movement difficulties can find and buy tickets.',['3 marks: explains font, colour and navigation with links to inclusivity.','2 marks: explains two with links.','1 mark: identifies one principle.']))],{two:true}));
qs.push(Q(SEP,'A heater controller reads the temperature from a sensor every second. If the temperature is below 18, the heater is turned on. If the temperature is 22 or above, the heater is turned off. The controller keeps checking until the user presses the Stop button, which sets the variable <b>stop</b> to TRUE.',[
 ps('Using pseudocode, write an algorithm for the heater controller.',3,`BEGIN Thermostat
    WHILE stop = FALSE
        Get temperature from sensor
        IF temperature < 18 THEN
            Set heater = ON
        ELSEIF temperature >= 22 THEN
            Set heater = OFF
        ENDIF
        Wait 1 second
    ENDWHILE
END Thermostat`,['1 mark: a loop that continues until stop is TRUE and reads the sensor each time.','1 mark: turns the heater on below 18 and off at 22 or above.','1 mark: leaves the heater unchanged between 18 and 22 and waits one second between readings.'])],{two:true}));
qs.push(Q(SEP,'',[
 tx('Explain the difference between an open loop control system and a closed loop control system. Use an example in your answer.',3,55,'An open loop system runs without checking its result. A toaster that heats for a set time is open loop, because it does not check how brown the bread is. A closed loop system uses a sensor to measure its output and adjusts itself. A thermostat that measures the room temperature and turns the heater on or off to keep it near the target is closed loop.',['3 marks: explains both systems and includes an example.','2 marks: explains one system or both with limited detail.','1 mark: identifies the feedback difference.'])]));
qs.push(Q(SEP,'A robot starts at the position (0, 0). A program reads a line of commands. The command <b>U</b> moves the robot up one (y increases by 1), <b>D</b> moves it down one, <b>L</b> moves it left one (x decreases by 1) and <b>R</b> moves it right one. Any other character is ignored. For the commands <b>UURD</b> the output is:<br><b>Position: 1,1</b>',[
 py('Write a Python program that reads the commands and displays the final position in the format shown.',3,'',`commands = input("Enter commands: ")
x = 0
y = 0
for c in commands:
    if c == "U":
        y += 1
    elif c == "D":
        y -= 1
    elif c == "L":
        x -= 1
    elif c == "R":
        x += 1
print("Position: " + str(x) + "," + str(y))`,[{i:['UURD'],o:'Position: 1,1'},{i:['RRRR'],o:'Position: 4,0'},{i:['LDLq'],o:'Position: -2,-1'},{i:[''],o:'Position: 0,0'}],['1 mark: reads the commands and processes each character.','1 mark: changes x and y correctly for the four commands and ignores other characters.','1 mark: displays the final position in the correct format.'])],{two:true}));
qs.push(Q(PW,'',[
 tx('Explain how open-source software is used and developed in web development.',3,55,'Open-source software has source code that anyone can view, use and change under its licence, and many web tools such as frameworks and CMS platforms are open source. Developers use these tools for free, which lowers the cost of a project. The code is improved by a community of contributors who report faults and add features, so problems are often found and fixed quickly.',['3 marks: explains use, community development and a benefit.','2 marks: explains two of these with limited detail.','1 mark: states that source code is freely available.'])]));
qs.push(Q(PW,'A cinema keeps its films and sessions in two related tables, Films and Sessions.',[
 sq('Construct a SQL query that displays the Genre of each film and the total revenue from the sessions that sold more than 50 tickets. The revenue for a session is Tickets multiplied by Price.<br>Use the column headings Genre and Revenue. List the results from the highest to the lowest revenue.',4,`SELECT Genre, SUM(Tickets * Price) AS Revenue
FROM Films
JOIN Sessions ON Films.FilmID = Sessions.FilmID
WHERE Tickets > 50
GROUP BY Genre
ORDER BY Revenue DESC`,true,['1 mark: joins Films and Sessions on FilmID.','1 mark: filters for sessions with more than 50 tickets.','1 mark: uses SUM of Tickets multiplied by Price with GROUP BY Genre.','1 mark: correct headings and ordering from highest to lowest.'])],{two:true,db:DB21}));
qs.push(Q(SEP,'A client wants an app for ordering coffee. The Home screen has two buttons, <b>Menu</b> and <b>Order history</b>. The Menu screen lists the drinks, each with an Add button, and has a Checkout button. The Checkout screen shows the order summary and has a Pay button. After payment a Confirmation screen is shown.',[
 dr('Create a storyboard for the app that shows the four screens and how the user moves between them.',3,'Four boxes representing screens, labelled Home, Menu, Checkout and Confirmation, each showing its main items (Menu and Order history buttons; list of drinks with Add buttons and a Checkout button; order summary with a Pay button; confirmation message). Arrows labelled with the button pressed: Home to Menu (Menu), Menu to Checkout (Checkout), Checkout to Confirmation (Pay). An optional arrow from Home to an Order history screen.',['1 mark: four screens drawn and labelled in a sensible order.','1 mark: the main content of each screen shown.','1 mark: arrows showing the movement between screens, labelled with the button used.'])],{two:true}));
qs.push(Q(SA,'A company designs a virtual personal assistant for a smart speaker. The assistant responds to spoken requests. It also predicts each household\'s electricity use so that it can suggest when to run appliances.',[
 P('(a)',tx('Explain how patterns in human behaviour, such as psychological responses and cultural protocols, should influence the design of the assistant\'s spoken replies. (3 marks)',3,60,'People respond better to a calm, polite voice and to short clear answers, especially when they are stressed, so the assistant should avoid long or alarming replies. Cultural protocols mean the assistant should use respectful forms of address and avoid phrases or topics that are offensive in some cultures. The company should test the assistant with people from different backgrounds.',['3 marks: explains a psychological response and a cultural protocol and links both to the design.','2 marks: explains one with a link to the design.','1 mark: identifies a pattern in human behaviour.'])),
 P('(b)',tx('Describe how polynomial regression is different from linear regression when predicting electricity use. (3 marks)',3,60,'Linear regression fits a straight line to the data, so it assumes that electricity use changes by the same amount for each change in the input, such as temperature. Polynomial regression fits a curve, so it can predict use that rises slowly at first and then quickly, such as air conditioning on very hot days. Polynomial regression fits curved patterns better but can overfit if the curve is too complex.',['3 marks: describes a straight line and a curve, and links them to electricity use.','2 marks: describes the difference with limited detail.','1 mark: identifies one model.'])),
 P('(c)',gd('Select the model that is most suitable for each prediction. (3 marks)',['Prediction','Model'],[
  ['Predicting tomorrow\'s electricity use in kWh from today\'s temperature, when the relationship is a straight line',[['Linear regression','Polynomial regression','Logistic regression','Decision tree'],0]],
  ['Predicting whether the family will be home this evening (yes or no)',[['Linear regression','Polynomial regression','Logistic regression','Decision tree'],2]],
  ['Predicting electricity use when it rises slowly at first and then very quickly as temperature increases',[['Linear regression','Polynomial regression','Logistic regression','Decision tree'],1]]],3,''))],{two:true}));
qs.push(Q(SA,'A clothing factory introduces automated cutting machines. A machine learning system predicts which items customers will buy so the factory makes only what it expects to sell. The machines cut fabric with less waste and production increases.',[
 tx('Discuss the impact of this automation on the economy, the environment and the factory\'s workers.',5,110,'The factory produces more with less fabric, which lowers costs and may make the clothing cheaper. More accurate predictions mean fewer unsold clothes are thrown away, and less fabric waste reduces the factory\'s impact on the environment, although making and running the machines needs materials and electricity. Fewer cutters are needed, so some workers lose their jobs, while others need training to operate and repair the machines. If the savings go only to the owners, wealth may become less evenly shared, but if the factory grows it may create new jobs in other areas.',['5 marks: a sustained discussion of impacts on the economy, the environment and workers, using the scenario.','3-4 marks: several impacts with some links to the scenario.','1-2 marks: identifies impacts with limited explanation.','Ideas include: production efficiency, waste, energy and materials, job loss, new skills, distribution of wealth.'])]));
qs.push(Q(SEP,'A team of four students is developing a software engineering project over ten weeks. At present the code is stored only on one student\'s laptop and the students send each other copies of files by email.',[
 tx('Explain how programmed data backup and version control would reduce the risks for the project team.',5,110,'A programmed data backup runs a script on a schedule that copies the project files to a second location, such as cloud storage. If the laptop is lost or fails, the team can restore the most recent copy and lose little work. Version control stores every change with the name of the person who made it. The students can see what changed, return to an earlier version if a change breaks the program, and work on separate branches and merge them. This stops them overwriting each other\'s files, which is likely when copies are emailed. Together the two methods protect the work and make collaboration easier.',['5 marks: explains programmed backup and version control and links both to specific risks in the scenario.','3-4 marks: explains both with some detail and limited links, or one in depth.','1-2 marks: identifies backup or version control with limited explanation.'])]));
qs.push(Q(SEP,'A program reads a sentence. It displays the words in reverse order on one line, separated by single spaces. It then displays the longest word. If two words are equally long, the first of them is the longest. For the sentence <b>the quick brown fox</b> the output is:<pre class="pre">fox brown quick the\nLongest: quick</pre>',[
 py('Using Python, write a program that achieves this task.',5,'',`sentence = input("Enter a sentence: ")
words = sentence.split()
reversed_words = []
for w in words:
    reversed_words.insert(0, w)
print(" ".join(reversed_words))
longest = words[0]
for w in words:
    if len(w) > len(longest):
        longest = w
print("Longest: " + longest)`,[{i:['the quick brown fox'],o:'fox brown quick the\nLongest: quick'},{i:['one'],o:'one\nLongest: one'},{i:['a bb ccc dd'],o:'dd ccc bb a\nLongest: ccc'}],['1 mark: reads the sentence and separates it into words.','1 mark: builds the words in reverse order.','1 mark: displays the reversed words on one line separated by spaces.','1 mark: finds the longest word, keeping the first when lengths are equal.','1 mark: displays the longest word in the correct format.'])],{two:true}));
qs.push(Q(SA,'An AI image generator was trained on millions of images collected from the internet, including artworks by living artists who were not asked for permission. A design company starts using the generator to produce advertising images instead of hiring illustrators. The images are produced in seconds and cost very little.',[
 tx('Evaluate the use of the AI image generator by the design company. In your answer, refer to copyright and intellectual property, employment and digital disruption, and the benefits to the company.',6,185,'The generator saves the company time and money, because images that once took an illustrator days are made in seconds. This lets the company produce more work and respond quickly to clients, so its competitiveness improves.<br>There are legal and ethical concerns. The model was trained on artworks without the artists\' permission, so the images may copy their styles or parts of their work. This raises questions of copyright and intellectual property, and the company could face legal claims or damage to its reputation if clients learn of it. It is also unclear who owns an image made by the generator.<br>The technology is a digital disruption. Illustrators may lose work, and the skills the industry needs may shift towards writing prompts and editing images. Overall, the company gains efficiency, but the benefit depends on using a generator trained with permission and on being open with clients. Without those steps the legal and ethical costs could outweigh the savings.',['6 marks: a balanced evaluation covering copyright and intellectual property, employment and digital disruption, and benefits, with scenario links and a justified judgement.','4-5 marks: explains most areas with scenario links and limited judgement.','2-3 marks: describes some impacts with limited links.','1 mark: identifies an impact only.'])]));
BANKS.push({id:'6',name:'Bank 6',sub:'Mechatronics, web and automation focus',qs:qs});
})();
