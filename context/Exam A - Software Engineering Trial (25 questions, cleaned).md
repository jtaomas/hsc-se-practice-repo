# Exam A: Software Engineering Trial Paper (25 questions, cleaned)

Source: pasted from an online exam platform by the owner. Cleaned for AI context.

Conventions
- Text without a tag is from the original paper.
- `[GENERATED]` marks content the paste lost (answer options, tables, diagrams, slides, steps). It is written to fit the question and is not official. Marks are not given in the paste, so none are shown.
- Section 1 is Questions 1-13 (closed). Section 2 is Questions 14-25 (written, code and diagram).

---

## Section 1

### Question 1
Which of the following best describes a Progressive Web App (PWA)?

`[GENERATED]` options
- A. A native app installed only through an app store that cannot work offline.
- B. A web application that uses modern web technologies (service workers, manifest) to give an installable, offline-capable, app-like experience in the browser.
- C. A desktop program written in a compiled language and run from a USB drive.
- D. A website that only works while connected to a corporate network.

### Question 2
Fill in the missing word in the text box below.

`________________ Regression : Used for classification problems (e.g., spam detection).`

Expected word: Logistic. `[GENERATED]` (the answer is implied by the sentence).

### Question 3
What is the first step in the software development life cycle that impacts security?

`[GENERATED]` options
- A. Testing
- B. Requirements definition / analysis (security requirements are identified)
- C. Deployment
- D. Maintenance

### Question 4
An employee at an accounting firm accidentally sent a customer's personal details to the wrong client. Although the data was not altered, it was exposed to someone who should not have access to it.

Which security principle was primarily compromised in this situation?

`[GENERATED]` options: A. Confidentiality, B. Integrity, C. Availability, D. Accountability.

### Question 5
An attacker creates the following URL and sends it to a victim:

`http://example.com/search?q=<script>alert('You have been hacked!');</script>`

When the victim clicks on the link, the server reflects the malicious script back into the search results page, and it executes in the victim's browser, displaying a popup with the message "You have been hacked!"

What type of vulnerability does this represent?

`[GENERATED]` options: A. SQL injection, B. Reflected cross-site scripting (XSS), C. Cross-site request forgery, D. Buffer overflow.

### Question 6
Which of the following best distinguishes artificial intelligence (AI) from machine learning (ML)?

`[GENERATED]` options
- A. AI is the broad field of making machines behave intelligently; ML is a subset where systems learn patterns from data.
- B. ML is the broad field and AI is a subset of it.
- C. AI always needs labelled data; ML never does.
- D. They are two names for the same thing.

### Question 7
The diagram in the Stimulus (left) represents an artificial neural network.

Place the Layers in the correct order that matches the diagram.

(Note: The top description will represent Layer #1.)

Stimulus `[GENERATED]`: a fully connected network with 3 input nodes, two hidden layers of 4 nodes each, and 1 output node.

Items to order (correct order shown):
1. Input layer: receives the raw features (3 nodes).
2. First hidden layer: weighted sums plus activation, learns low-level patterns (4 nodes).
3. Second hidden layer: combines earlier patterns into higher-level ones (4 nodes).
4. Output layer: produces the prediction (1 node).

### Question 8
Which statement below is true about client-side programming?

`[GENERATED]` options
- A. It runs in the user's browser and can update the page without a full reload.
- B. It runs only on the web server and the user cannot see its output.
- C. It is used to store the production database.
- D. It cannot respond to user events.

### Question 9
What is a legal and ethical consideration related to the development of secure software?

`[GENERATED]` options
- A. Complying with privacy legislation (e.g. the Privacy Act 1988) when collecting and storing personal data.
- B. Using the cheapest hosting available.
- C. Hiding known vulnerabilities from users to protect the brand.
- D. Releasing software without testing to meet a deadline.

### Question 10
Which of the following is a key technique used in virtual personal assistants like Siri or Alexa?

`[GENERATED]` options: A. Natural language processing (NLP), B. Relational normalisation, C. Bubble sort, D. Disk defragmentation.

### Question 11
New software has been developed to complete a task. Users of the new software have been asked to stop using the old software immediately and start to use the new software.

What installation method is being used?

`[GENERATED]` options: A. Direct (cut-over), B. Parallel, C. Pilot, D. Phased.

### Question 12
How do the capabilities and experience of end users influence the secure design features of software?

`[GENERATED]` options
- A. Less experienced users need safer defaults, clear warnings, input validation and simple security steps; experienced users may be given more control.
- B. They have no influence on design.
- C. Only the server hardware influences secure design.
- D. Secure design is only needed for expert users.

### Question 13
Place in the correct order the steps to describe how HTTPS/SSL encryption works when a user connects to a secure website.

(Note: The top description represents the first step of the HTTPS/SSL encryption process.)

Items `[GENERATED]` (correct order):
1. The browser connects to the server and requests a secure session.
2. The server sends its SSL/TLS certificate containing its public key.
3. The browser checks the certificate is valid and issued by a trusted certificate authority.
4. The browser creates a session key, encrypts it with the server's public key and sends it.
5. The server decrypts the session key with its private key.
6. Both sides use the shared session key to encrypt and decrypt data for the rest of the session.

---

## Section 2

### Question 14
Explain the difference between the 'security by design' approach and the 'privacy by design' approach.

### Question 15
A small café with five employees uses custom-built software to manage its point of sale (POS) system. The system has the following functions:
- Record transactions and issue receipts to customers.
- Delete transactions.
- View daily sales data.

Currently, all employees have full access to all system functions. Recently, the manager has noticed that some transactions are being deleted throughout the day, with no way to track how or by whom these deletions occurred.

(a) Outline TWO fundamental security concepts in software design that could help the manager address this issue.

(b) Explain how conducting a vulnerability assessment could help improve the security of the POS system.

### Question 16
Explain how an Object-Oriented Programming (OOP) approach can enhance the automation of machine learning models.

### Question 17
A Web Developer has been approached to develop a website for a clothing company that requires an online ordering system.

The system would allow users to:
- create an account,
- browse for clothing items,
- add items to a cart for checkout,
- make payment for their purchases.

The order created would be sent to the warehouse for processing and update the clothing company's inventory and stock.

During the ordering process, the user is notified of updates to their order, including payment received, order processed, order dispatched and delivery.

(a) Select the protocols required for the data being transferred.
`[GENERATED]` options (select all that apply): HTTPS, SMTP (email notifications), FTP, SSH, POP3, Telnet. Suitable choices: HTTPS (browsing, account, payment) and SMTP (order update emails).

(b) Outline ONE collaborative practice back-end and front-end developers would need to engage to develop this website.

(c) Explain how CSS would be utilised by the ordering website for browsing the range of clothing that users can search.

### Question 18
Bruce's Burgers offers half priced burgers if the customer has a loyalty card or is a university student. This discount doesn't apply on public holidays.

The following test data has been developed to be used:

The customer has a loyalty card, and is a university student, and the day is Boxing Day (Public Holiday).

(a) Draw a decision tree using the test data.

(b) Referring to the stimulus create an algorithm to determine the price paid by a customer. The algorithm should take the required input, complete checks with necessary control structures and the result with meaningful output.

`[GENERATED]` note: the paste gave no burger price. Use an input variable `price`.

### Question 19
Consider the following table that represents a database named Customers for a customer rating system:

| ID | Username | Premium Account | Rating |
| --- | --- | --- | --- |
| 1 | jkimble | False | 87.1 |
| 2 | fishstick | True | 94.2 |
| 3 | user123 | False | 78.5 |
| 4 | student456 | True | 82.3 |
| 5 | teacher789 | False | 90.0 |
| 6 | admin321 | True | 95.7 |
| 7 | learner234 | False | 81.2 |
| 8 | member567 | True | 88.9 |
| 9 | guest890 | False | 79.6 |
| 10 | tester001 | True | 91.4 |

(a) Write an SQL statement that will display only the Username and Rating of customers who have a Rating of 90.0 or higher.

(b) A developer has chosen to construct a web application utilising python as the programming language. Discuss the options of using Object-Relational Mapping (ORM) and SQL to store the Customers' data.

### Question 20
Tickets for international superstar Yat Yat Fast are on sale for her tour of Australia. All tickets are General Admission (GA).

- A GA ticket costs $100.
- A GA ticket and commemorative poster of Yat Yat Fast costs $150.

(a) A program needs to be written for the purchasing of tickets. Justify the use of THREE different data types for variables used in this program.

(b) Write an algorithm for the function `totalCost()`, that passes in parameters which calculates and displays the total cost.

### Question 21
A retail clothes company, NickSales Ltd, wants to predict monthly sales for its products based on historical sales data, marketing spends, and seasonal trends. They decide to automate this process using Machine Learning (ML).

The data science team creates a software application in Python, using OOP principles to structure the ML models. They apply two different regression techniques:
- Linear regression: `[GENERATED]` fits a straight line, sales = m x marketing spend + c.
- Polynomial regression: `[GENERATED]` fits a curve, sales = a x spend^2 + b x spend + c, for non-linear (e.g. seasonal) trends.

(a) Distinguish between linear regression and polynomial regression for this scenario.

(b) The web system for NickSales Ltd operates using the following components:
- User ordering their clothing items
- Website processing the order
- Updating the stock inventory/database

Describe how these components interact to form an interactive web development system.

### Question 22
InstantPage is a new social media product that regularly updates the user with details of time spent using the app. InstantPage provides the time in minutes only.

A program is to be created to convert the minutes into hours and minutes. e.g. 134 minutes = 2 hours 14 minutes.

(a) Select (by selecting the radio button below) the modelling tool that represents the subroutines and their relationships for the InstantPage app.
`[GENERATED]` options: Context diagram, Data flow diagram, Structure chart (correct), Storyboard.

(b) Create a function, using Python, where the user enters the minutes and converts this time into the equivalent hours and minutes. The displayed time should be grammatically correct (e.g. "1 hour", "2 hours", "1 minute", "0 minutes").

### Question 23
BJcomputing Solutions Inc. is a tech company specializing in predictive analytics for e-commerce. The company wants to improve customer experience by deploying a Machine Learning (ML) recommendation system that suggests products based on user behaviour. Their Data Science team has created a model with high accuracy, but they face challenges moving it efficiently into production and maintaining it as user data and behaviour patterns change.

Stimulus (diagram, shown left) `[GENERATED]`: the three MLOps stages in a loop:
1. Design: business and data understanding, requirements, data preparation.
2. Model development: feature engineering, training, evaluation, experiment tracking.
3. Operations: deployment, CI/CD, monitoring for drift, retraining.

Analyse how the team could use the three stages of Machine Learning Operations (MLOps), as shown in the diagram in the stimulus.

### Question 24
You have been asked by an emerging airline to develop a program to allocate Business and Economy Class seats for flights on board their new Airbus 380-800 planes. The current seat-booking system consists of a number of modules, including:
- booking and seat allocation
- online payment
- ticket production
- printing of boarding passes.

The new booking and seat allocation module needs to fulfil the following requirements:
- Ask the user for the class of tickets required.
- Ask the user for the number of tickets required. A maximum of 4 tickets can be purchased at one time.
- If only one ticket is required, allocate the next unallocated seat.
- If more than one ticket is required, allocate seats next to each other in the same row. However, if the required seats cannot be found together, an appropriate message should be displayed and the booking process restarted.
- Output the allocated seat number(s).

The Business Class passengers are to be seated in 5 rows of 8 seats. The diagram shows the seating plan represented as a 2-dimensional array. Column 0 contains the letters A to E. Row 0 contains the numbers 1 to 8.

The Economy Class passengers are to be seated in 15 rows of 10 seats. The diagram shows the seating plan represented as a 2-dimensional array. Column 0 contains the letters F to T. Row 0 contains the numbers 1 to 10.

An 'X' indicates that the seat has already been allocated. For example, if four tickets are ordered in Economy Class, the seats G6, G7, G8 and G9 would be allocated.

Business Class (`.` = free)

|   | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | X | X | X | X | . | . | . | . |
| B | X | X | X | X | X | . | . | . |
| C | X | X | X | X | X | X | X | . |
| D | . | . | . | . | . | . | . | . |
| E | . | . | . | . | . | . | . | . |

Economy Class (`.` = free). Only rows F, G, H and T were in the paste. Rows I to S are `[GENERATED]` as all free, shown here in full.

|   | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F | X | X | X | X | . | . | . | X | X | . |
| G | X | X | X | X | X | . | . | . | . | . |
| H | X | X | X | X | X | X | X | . | . | . |
| I to S (11 rows) | . | . | . | . | . | . | . | . | . | . |
| T | . | . | . | . | . | . | . | . | . | . |

Develop a program, using Python, that performs the requirements of the booking and seat allocation module. It should use Functions where appropriate, allocating the occupied seats of each seating class.

### Question 25
The following internal company memo was prepared for employees within a software development company.

(Note: There are 7 slides in the presentation. Use the arrow icons to move between slides. Clicking on the slide will display its contents in full screen mode.)

Stimulus `[GENERATED]`: the slides were lost in the paste. A reconstruction that fits the question:
1. Memo: "Data breach incident: MetroWave", from the Security Officer.
2. What happened: an unpatched web server let an attacker download a customer database.
3. Data exposed: names, emails, addresses, hashed passwords and payment tokens for about 120,000 clients of MetroWave's customers.
4. Timeline: breach on Monday, detected after 9 days, clients told after 3 more weeks.
5. Response: server taken offline, passwords reset, external forensic review.
6. Impact so far: customer complaints, a regulator inquiry, two clients ending contracts.
7. Next steps: staff training, encryption at rest, a notifiable data breach process.

Evaluate the social, ethical and legal issues for both MetroWave and their clients resulting from the data breach incident.
