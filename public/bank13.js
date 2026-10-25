/* CSSA 2025 Trial Higher School Certificate Examination, Software Engineering.
   Converted question for question from the published paper.
   Total 80 marks across 25 questions (Section 1: Q1-Q13, Section 2: Q14-Q25). */
(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';

/* Database for Question 19 */
var DB_CUSTOMERS = {
  Customers: {
    c: ['ID', 'Username', 'PremiumAccount', 'Rating'],
    r: [
      [1, 'jkimble', 'False', 87.1],
      [2, 'fishstick', 'True', 94.2],
      [3, 'user123', 'False', 78.5],
      [4, 'student456', 'True', 82.3],
      [5, 'teacher789', 'False', 90.0],
      [6, 'admin321', 'True', 95.7],
      [7, 'learner234', 'False', 81.2],
      [8, 'member567', 'True', 88.9],
      [9, 'guest890', 'False', 79.6],
      [10, 'tester001', 'True', 91.4]
    ]
  }
};

var qs=[];

/* ==========================================================================
   SECTION 1: Questions 1 to 13 (15 marks)
   ========================================================================== */

/* Q1: Progressive Web App definition */
qs.push(Q(PW,'',[
  mc('Which of the following best describes a Progressive Web App (PWA)?',[
    'A native mobile application that must be downloaded exclusively from device-specific app stores',
    'A web application that uses modern web capabilities to deliver an app-like experience, including offline access and installability',
    'A desktop-only software package that requires local installation and cannot access web APIs',
    'A static HTML web page that requires constant full-page reloads for any user interaction'
  ],1,'Progressive Web Apps (PWAs) leverage service workers, manifests, and responsive design to offer features traditionally exclusive to native applications, such as offline functionality and home screen installation.')
]));

/* Q2: Regression fill-in */
qs.push(Q(SA,'',[
  dd('Fill in the missing word in the text box below.','{0} Regression : Used for classification problems (e.g., spam detection).',[
    [['Logistic','Linear','Polynomial','Ridge'],0]
  ],1,'Logistic regression is used for classification problems by modeling probabilities of categorical outcomes between 0 and 1.')
]));

/* Q3: SDLC Security step */
qs.push(Q(SSA,'',[
  mc('What is the first step in the software development life cycle that impacts security?',[
    'Requirements analysis and planning',
    'Unit testing and debugging',
    'Code implementation and refactoring',
    'Production server deployment'
  ],0,'Security by Design dictates that security considerations, threat modeling, and security requirements must be defined at the very beginning during requirements analysis and planning.')
]));

/* Q4: Accounting firm data breach principle */
qs.push(Q(SSA,'An employee at an accounting firm accidentally sent a customer’s personal details to the wrong client. Although the data was not altered, it was exposed to someone who should not have access to it.',[
  mc('Which security principle was primarily compromised in this situation?',[
    'Availability',
    'Integrity',
    'Confidentiality',
    'Non-repudiation'
  ],2,'Confidentiality ensures information is accessible only to those authorized to view it. Disclosing personal details to an unauthorized third party directly violates confidentiality.')
]));

/* Q5: Reflected XSS URL vulnerability */
qs.push(Q(SSA,'An attacker creates the following URL and sends it to a victim:'+code('http://example.com/search?q=<script>alert(\'You have been hacked!\');</script>')+'<p>When the victim clicks on the link, the server reflects the malicious script back into the search results page, and it executes in the victim’s browser, displaying a popup with the message "You have been hacked!"</p>',[
  mc('What type of vulnerability does this represent?',[
    'Reflected Cross-Site Scripting (XSS)',
    'SQL Injection (SQLi)',
    'Cross-Site Request Forgery (CSRF)',
    'Buffer Overflow'
  ],0,'Reflected XSS occurs when an application receives user data in an HTTP request (such as URL query parameters) and includes that data within the immediate response without proper sanitisation or output encoding.')
]));

/* Q6: AI vs ML distinction */
qs.push(Q(SA,'',[
  mc('Which of the following best distinguishes artificial intelligence (AI) from machine learning (ML)?',[
    'Machine learning is the broad field of intelligent computers, while AI only refers to neural networks',
    'AI is the broad concept of creating machines capable of intelligent behaviour, while ML is a specific subset of AI where systems learn from data',
    'AI systems always require statistical datasets, while ML algorithms never use data',
    'There is no distinction; AI and ML are identical terms'
  ],1,'AI represents the broad goal of simulating human intelligence, whereas Machine Learning is a specific subfield that uses data-driven algorithms to learn patterns autonomously.')
]));

/* Q7: ANN Layers order */
qs.push(Q(SA,'The diagram in the Stimulus (left) represents an artificial neural network.'+fig('Artificial Neural Network Architecture',`<svg viewBox="0 0 600 240" width="100%" height="200" style="background:#fff;font-family:sans-serif;font-size:12px;">
  <defs><marker id="annarr" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><polygon points="0 0, 6 2.5, 0 5" fill="#999"/></marker></defs>
  <circle cx="80" cy="50" r="18" fill="#e8f0fe" stroke="#1a73e8" stroke-width="2"/>
  <circle cx="80" cy="110" r="18" fill="#e8f0fe" stroke="#1a73e8" stroke-width="2"/>
  <circle cx="80" cy="170" r="18" fill="#e8f0fe" stroke="#1a73e8" stroke-width="2"/>
  <circle cx="300" cy="40" r="18" fill="#fef7e0" stroke="#f9ab00" stroke-width="2"/>
  <circle cx="300" cy="95" r="18" fill="#fef7e0" stroke="#f9ab00" stroke-width="2"/>
  <circle cx="300" cy="150" r="18" fill="#fef7e0" stroke="#f9ab00" stroke-width="2"/>
  <circle cx="300" cy="205" r="18" fill="#fef7e0" stroke="#f9ab00" stroke-width="2"/>
  <circle cx="520" cy="80" r="18" fill="#ceead6" stroke="#1e8e3e" stroke-width="2"/>
  <circle cx="520" cy="160" r="18" fill="#ceead6" stroke="#1e8e3e" stroke-width="2"/>
  <line x1="98" y1="50" x2="282" y2="40" stroke="#ccc" stroke-width="1.5" marker-end="url(#annarr)"/>
  <line x1="98" y1="50" x2="282" y2="95" stroke="#ccc" stroke-width="1.5" marker-end="url(#annarr)"/>
  <line x1="98" y1="110" x2="282" y2="95" stroke="#ccc" stroke-width="1.5" marker-end="url(#annarr)"/>
  <line x1="98" y1="110" x2="282" y2="150" stroke="#ccc" stroke-width="1.5" marker-end="url(#annarr)"/>
  <line x1="98" y1="170" x2="282" y2="150" stroke="#ccc" stroke-width="1.5" marker-end="url(#annarr)"/>
  <line x1="98" y1="170" x2="282" y2="205" stroke="#ccc" stroke-width="1.5" marker-end="url(#annarr)"/>
  <line x1="318" y1="95" x2="502" y2="80" stroke="#ccc" stroke-width="1.5" marker-end="url(#annarr)"/>
  <line x1="318" y1="150" x2="502" y2="160" stroke="#ccc" stroke-width="1.5" marker-end="url(#annarr)"/>
  <text x="80" y="215" text-anchor="middle" font-weight="bold" fill="#1a73e8">Layer #1</text>
  <text x="300" y="235" text-anchor="middle" font-weight="bold" fill="#b06000">Layer #2</text>
  <text x="520" y="215" text-anchor="middle" font-weight="bold" fill="#1e8e3e">Layer #3</text>
</svg>`),[
  od('The diagram in the Stimulus (left) represents an artificial neural network.<br>Place the Layers in the correct order that matches the diagram by dragging the descriptions into position.<br>(Note: The top description will represent Layer #1.)',`
# BEGIN Neural network layers
    Input Layer: receives the raw input features
    Hidden Layer: processes inputs using weights, biases, and activation functions
    Output Layer: produces the final network output or classification
# END Neural network layers`,2,{why:'A feedforward neural network begins with an Input Layer, passes data through one or more Hidden Layers for feature transformation, and terminates at an Output Layer.'})
],{two:true}));

/* Q8: Client-side programming */
qs.push(Q(PW,'',[
  mc('Which statement below is true about client-side programming?',[
    'It runs in the user\'s web browser to provide dynamic responsiveness and manipulate the DOM',
    'It can query backend database servers directly without server authorization',
    'It executes on the web server before delivering finished pages to clients',
    'It keeps sensitive proprietary algorithms completely hidden from client inspection'
  ],0,'Client-side scripts run in the user\'s browser engine, responding to user actions, updating DOM elements dynamically, and avoiding round-trip delays.')
]));

/* Q9: Legal and ethical considerations */
qs.push(Q(SSA,'',[
  mc('What is a legal and ethical consideration related to the development of secure software?',[
    'Minimising source code character counts to lower network bandwidth costs',
    'Complying with privacy legislation and protecting personal user data against unauthorized exposure',
    'Collecting user activity telemetry without consent to train internal AI algorithms',
    'Refusing to provide security updates to incentivize customers to buy new hardware'
  ],1,'Developers have statutory legal obligations (such as the Australian Privacy Act) and professional ethical duties to safeguard personal data and prevent foreseeable security harms.')
]));

/* Q10: Siri / Alexa virtual personal assistants */
qs.push(Q(SA,'',[
  mc('Which of the following is a key technique used in virtual personal assistants like Siri or Alexa?',[
    'Natural Language Processing (NLP) combined with automatic speech recognition',
    'Relational database third-normal-form schema design',
    'Asymmetric digital certificate authentication',
    'Client-side CSS responsive flexbox layouts'
  ],0,'Virtual assistants rely on speech recognition to convert audio to text, and Natural Language Processing (NLP) to parse semantic intent and formulate contextual replies.')
]));

/* Q11: Stop old immediately start new */
qs.push(Q(SEP,'New software has been developed to complete a task. Users of the new software have been asked to stop using the old software immediately and start to use the new software.',[
  mc('What installation method is being used?',[
    'Direct cutover',
    'Parallel installation',
    'Phased implementation',
    'Pilot installation'
  ],0,'Direct cutover (or direct installation) immediately switches all users from the old system to the new system with no transitional overlap.')
]));

/* Q12: End user capabilities and secure design */
qs.push(Q(SSA,'',[
  mc('How do the capabilities and experience of end users influence the secure design features of software?',[
    'Experienced users never make mistakes, allowing access restrictions to be removed',
    'Security mechanisms must be intuitive, usable, and incorporate safe defaults so users of varying abilities are not tempted to bypass them',
    'System architects should assume all users understand low-level encryption mechanics',
    'Security controls should be made deliberately difficult to navigate to prevent unauthorized access'
  ],1,'If security controls are unintuitive or burdensome, users will actively seek workarounds. Design must combine strong security defaults with clear, user-friendly affordances.')
]));

/* Q13: Steps of HTTPS/SSL encryption */
qs.push(Q(SSA,'',[
  od('Place in the correct order the steps to describe how HTTPS/SSL encryption works when a user connects to a secure website.<br>(Note: The top description represents the first step of the HTTPS/SSL encryption process.)',`
# BEGIN HTTPS/SSL Encryption Handshake
    Browser connects to the server and requests a secure session (Client Hello)
    Server responds with its SSL/TLS digital certificate containing its public key
    Browser verifies the digital certificate with a trusted Certificate Authority (CA)
    Browser creates key material and encrypts it with the server's public key
    Server decrypts the key material using its private key
    Browser and server generate a shared symmetric session key
    Encrypted data transmission begins using the symmetric session key
# END HTTPS/SSL Encryption Handshake`,2,{
    why:'The client initiates the handshake, the server presents its public-key certificate which is verified by a CA, session key material is exchanged securely via asymmetric encryption, and symmetric encryption protects the session data.'
  })
]));

/* ==========================================================================
   SECTION 2: Questions 14 to 25 (65 marks)
   ========================================================================== */

/* Q14: Security by Design vs Privacy by Design (3 marks) */
qs.push(Q(SSA,'',[
  tx('Explain the difference between the ‘security by design’ approach and the ‘privacy by design’ approach. (3 marks)',3,100,
    'Security by design focuses on embedding technical safeguards and threat-mitigation practices throughout all phases of the software development lifecycle to prevent software vulnerabilities, unauthorized access, data corruption, and cyberattacks (e.g. input validation, encryption, access controls).\nIn contrast, privacy by design focuses specifically on protecting individuals\' personal information and privacy rights by embedding data protection principles from the outset (e.g. data minimisation, explicit user consent, purpose specification, transparent privacy policies, and default private settings).\nWhile security by design protects systems and data from unauthorized external threat actors, privacy by design ensures authorized systems handle personal user data ethically, lawfully, and minimally.',
    [
      '3 marks: Clearly distinguishes between security by design (technical defenses against threats/attacks) and privacy by design (protecting user personal data, rights, and minimisation).',
      '2 marks: Explains both approaches with minor gaps or lacks clear contrast between their distinct focuses.',
      '1 mark: Identifies security or privacy in software design with minimal explanation.'
    ])
]));

/* Q15: Small cafe POS system (4 marks) */
qs.push(Q(SSA,'A small café with five employees uses custom-built software to manage its point of sale (POS) system. The system has the following functions:<br>&bull; Record transactions and issue receipts to customers.<br>&bull; Delete transactions.<br>&bull; View daily sales data.<br><br>Currently, all employees have full access to all system functions. Recently, the manager has noticed that some transactions are being deleted throughout the day, with no way to track how or by whom these deletions occurred.',[
  P('(a)',tx('Outline TWO fundamental security concepts in software design that could help the manager address this issue. (2 marks)',2,70,
    '1. Principle of Least Privilege / Role-Based Access Control: Regular staff should only have permissions to record transactions and issue receipts. High-risk actions like deleting transactions or viewing daily sales should be restricted solely to the manager.\n2. Accountability / Audit Logging: Every employee must have an individual authenticated login, and the system should maintain an immutable audit log recording the user ID, timestamp, and details for every transaction deletion.',
    [
      '2 marks: Outlines two distinct, relevant security concepts (e.g. least privilege/RBAC and accountability/audit logging) applied directly to the cafe POS scenario.',
      '1 mark: Outlines one concept or names two without adequate explanation.'
    ])),
  P('(b)',tx('Explain how conducting a vulnerability assessment could help improve the security of the POS system. (2 marks)',2,70,
    'Conducting a vulnerability assessment involves systematically inspecting the POS software, network interfaces, and user permission models to uncover security weaknesses (such as unprotected deletion endpoints, weak password policies, or missing audit logging). Identifying these flaws enables the café to apply targeted patches and access controls before malicious actors or dishonest employees exploit them.',
    [
      '2 marks: Explains how a vulnerability assessment identifies system weaknesses and enables prioritised security hardening for the POS system.',
      '1 mark: Mentions testing or finding bugs with limited link to improving system security.'
    ]))
],{two:true}));

/* Q16: OOP enhancing automation of ML models (3 marks) */
qs.push(Q(SA,'',[
  tx('Explain how an Object-Oriented Programming (OOP) approach can enhance the automation of machine learning models. (3 marks)',3,90,
    'Object-Oriented Programming (OOP) structures code into modular, reusable classes and objects, enhancing ML automation in several ways:\n1. Encapsulation: A machine learning model class can bundle data preprocessing, hyperparameter settings, training algorithms (fit), and inference logic (predict) into a single self-contained unit, hiding internal complexity and enabling automated training pipelines.\n2. Inheritance and Polymorphism: Different regression or classification models can inherit from a common base class (e.g. BaseEstimator), exposing standardised method interfaces. This allows automated MLOps pipelines to seamlessly interchange, train, evaluate, and benchmark multiple algorithms without rewriting orchestration code.',
    [
      '3 marks: Explains how OOP concepts (encapsulation, modularity, inheritance, polymorphism) enable automated ML pipelines, model reusability, and standardised interfaces.',
      '2 marks: Explains OOP benefits with moderate link to machine learning automation.',
      '1 mark: Identifies OOP features with minimal link to ML automation.'
    ])
]));

/* Q17: Online Clothing Ordering System (7 marks) */
qs.push(Q(PW,'A Web Developer has been approached to develop a website for a clothing company that requires an online ordering system.<br><br>The system would allow users to:<br>&bull; create an account,<br>&bull; browse for clothing items,<br>&bull; add items to a cart for checkout<br>&bull; make payment for their purchases.<br><br>The order created would be sent to the warehouse for processing and update the clothing company’s inventory and stock.<br><br>During the ordering process, the user is notified of updates to their order, including payment received, order processed, order dispatched and delivery.',[
  P('(a)',ms('Select the protocols required for the data being transferred.<br>Select all that apply. (2 marks)',[
    'HTTPS (Hypertext Transfer Protocol Secure) for encrypted customer browsing and checkout transactions',
    'SMTP / TLS for automated customer order notification emails',
    'DNS for resolving the website domain name to the web server IP address',
    'Unencrypted FTP for sending credit card details to the payment processor',
    'Telnet for remote warehouse command execution'
  ],[0,1,2],2,'HTTPS secures customer web traffic and payments, SMTP/TLS delivers automated status emails, and DNS resolves hostnames. Unencrypted FTP and Telnet are insecure.')),
  P('(b)',tx('Outline ONE collaborative practice back-end and front-end developers would need to engage to develop this website. (2 marks)',2,70,
    'One vital collaborative practice is establishing and documenting an agreed API contract (e.g. using OpenAPI / Swagger or Postman). Both teams collaboratively define the JSON endpoints, request parameters, status codes, and response structures for clothing catalog searches, cart operations, and order submissions before coding starts. This allows front-end and back-end developers to work concurrently using mock data, avoiding integration bottlenecks.',
    [
      '2 marks: Outlines one collaborative practice (API contract/schema agreement, regular standups, shared version control/pull requests) with clear link to coordinating front-end and back-end work.',
      '1 mark: Mentions a practice with minimal explanation.'
    ])),
  P('(c)',tx('Explain how CSS would be utilised by the ordering website for browsing the range of clothing that users can search. (3 marks)',3,100,
    'CSS is utilised to create an attractive, responsive, and intuitive browsing experience for shoppers:\n1. Responsive Grid / Flexbox Layout: CSS Grid or Flexbox displays clothing items in a structured product gallery that dynamically adapts columns from multiple items on desktop monitors to single/double columns on mobile screens.\n2. Visual Hierarchy and Card Styling: CSS styles product cards with consistent image aspect ratios, badges (e.g. "Sale", "Out of Stock"), clear pricing typography, and prominent "Add to Cart" buttons.\n3. Interactive Micro-Interactions: CSS pseudo-classes (:hover, :focus) and transitions provide instant visual feedback when hovering over clothing images (e.g. zooming in or revealing alternate product angles/colours), enhancing usability and engagement.',
    [
      '3 marks: Explains how CSS provides responsive layout (Grid/Flexbox), visual styling/hierarchy, and interactive user feedback for browsing clothing products.',
      '2 marks: Explains styling and responsive design with moderate detail.',
      '1 mark: Basic mention of colours or layout.'
    ]))
],{two:true}));

/* Q18: Bruce's Burgers Decision Tree & Algorithm (7 marks) */
qs.push(Q(SEP,'Bruce’s Burgers offers half priced burgers if the customer has a loyalty card or is a university student. This discount doesn’t apply on public holidays.<br><br>The following test data has been developed to be used:<br><b>The customer has a loyalty card, and is a university student, and the day is Boxing Day (Public Holiday)</b>',[
  P('(a)',dr('Draw a decision tree using the test data to determine whether the customer receives half-priced burgers or pays full price. (3 marks)',3,
    'Root decision node checks "Is it a Public Holiday?". If Yes -> Full Price (discount does not apply). If No -> Check "Has Loyalty Card?". If Yes -> Half Price. If No -> Check "Is University Student?". If Yes -> Half Price; If No -> Full Price. For Boxing Day (Public Holiday = Yes), the path branches directly to Full Price.',
    [
      '1 mark: Shows root decision node evaluating public holiday condition.',
      '1 mark: Shows branches evaluating loyalty card and university student conditions.',
      '1 mark: Correct terminal outcomes (Half Price vs Full Price) with the Boxing Day test case traced to Full Price.'
    ])),
  P('(b)',ps('Referring to the stimulus create an algorithm to determine the price paid by a customer. The algorithm should take the required input, complete checks with necessary control structures and the result with meaningful output. (4 marks)',4,
`BEGIN CalculateBurgerPrice
    Get basePrice
    Get isPublicHoliday
    Get hasLoyaltyCard
    Get isUniStudent
    
    IF isPublicHoliday = True THEN
        Set finalPrice = basePrice
    ELSE
        IF hasLoyaltyCard = True OR isUniStudent = True THEN
            Set finalPrice = basePrice * 0.5
        ELSE
            Set finalPrice = basePrice
        ENDIF
    ENDIF
    
    Display "Final price to pay: $", finalPrice
END CalculateBurgerPrice`,
    [
      '1 mark: Prompts and reads all required inputs (price, public holiday status, loyalty card, student status).',
      '1 mark: Evaluates public holiday condition so that discount is negated when True.',
      '1 mark: Applies 50% discount if customer has a loyalty card OR is a university student on non-holidays.',
      '1 mark: Displays meaningful final price output.'
    ]))
],{two:true}));

/* Q19: Customers Rating Table SQL and ORM (7 marks) */
qs.push(Q(PW,'Consider the following table that represents a database named Customers for a customer rating system:'+tbl(
  ['ID','Username','Premium Account','Rating'],
  [
    ['1','jkimble','False','87.1'],
    ['2','fishstick','True','94.2'],
    ['3','user123','False','78.5'],
    ['4','student456','True','82.3'],
    ['5','teacher789','False','90.0'],
    ['6','admin321','True','95.7'],
    ['7','learner234','False','81.2'],
    ['8','member567','True','88.9'],
    ['9','guest890','False','79.6'],
    ['10','tester001','True','91.4']
  ]
),[
  P('(a)',sq('Write an SQL statement that will display only the Username and Rating of customers who have a Rating of 90.0 or higher. (3 marks)',3,
`SELECT Username, Rating
FROM Customers
WHERE Rating >= 90.0`,false,
    [
      '1 mark: Selects only Username and Rating columns.',
      '1 mark: Queries from the Customers table.',
      '1 mark: Applies filter condition WHERE Rating >= 90.0.'
    ])),
  P('(b)',tx('A developer has chosen to construct a web application utilising python as the programming language.<br><br>Discuss the options of using Object-Relational Mapping (ORM) and SQL to store the Customers’ data. (4 marks)',4,140,
    'Using raw SQL involves writing direct query strings (e.g. using sqlite3 or psycopg2). Advantages include maximum execution performance, fine-grained control over query optimisation, and the ability to leverage complex vendor-specific database features. However, it requires manual object-mapping, increases boilerplate code, and poses SQL injection risks if parameterisation is overlooked.\nAlternatively, an ORM (such as SQLAlchemy or Django ORM) abstracts database tables into Python classes and rows into Python objects (e.g. customer.rating = 95.0; session.commit()). Advantages include rapid development, automatic SQL injection sanitisation, schema migrations, and database engine portability. The trade-off is an abstraction overhead, potentially slower complex queries, and a learning curve. For a Python web application, an ORM is usually preferable for developer productivity, with raw SQL reserved for performance-critical analytical queries.',
    [
      '4 marks: Comprehensive discussion of both ORM and raw SQL in Python, highlighting advantages, disadvantages, security implications, and suitability for storing customer data.',
      '3 marks: Discusses both ORM and raw SQL with good points on development speed, syntax, or security.',
      '2 marks: Discusses ORM or raw SQL with limited comparison.',
      '1 mark: Basic mention of databases or SQL.'
    ]))
],{two:true,db:DB_CUSTOMERS}));

/* Q20: Yat Yat Fast Tickets (6 marks) */
qs.push(Q(SEP,'Tickets for international superstar Yat Yat Fast are on sale for her tour of Australia. All tickets are General Admission (GA).<br><br>&bull; A GA ticket costs $100.<br>&bull; A GA ticket and commemorative poster of Yat Yat Fast costs $150.',[
  P('(a)',tx('A program needs be written for the purchasing of tickets. Justify the use of THREE different data types for variables used in this program. (3 marks)',3,100,
    '1. Integer (int) for ticketQuantity: Ticket quantities represent discrete whole numbers of items purchased (e.g. 1, 2, 4) and cannot be fractional.\n2. Boolean (bool) for includePoster: A boolean flag (True or False) efficiently represents whether the customer chooses the commemorative poster option.\n3. Float (or Decimal/Currency) for totalCost: Monetary values represent numerical amounts that may involve fractional currency (e.g. dollars and cents like $100.00 or $150.00) and require arithmetic calculation.',
    [
      '3 marks: Identifies and justifies three appropriate data types (e.g. integer, boolean, float/decimal, or string for customer name) with clear reasoning linked to ticket purchasing.',
      '2 marks: Justifies two data types or lists three with partial justification.',
      '1 mark: Lists data types with minimal justification.'
    ])),
  P('(b)',ps('Write an algorithm for the function totalCost(), that passes in parameters which calculates and displays the total cost. (3 marks)',3,
`BEGIN totalCost(ticketQuantity, includePoster)
    IF includePoster = True THEN
        Set pricePerTicket = 150
    ELSE
        Set pricePerTicket = 100
    ENDIF
    
    Set total = ticketQuantity * pricePerTicket
    Display "Total cost: $", total
    RETURN total
END totalCost`,
    [
      '1 mark: Defines function totalCost with parameters for ticket count and poster option.',
      '1 mark: Correctly determines ticket rate based on whether the poster is included ($150 vs $100) and multiplies by quantity.',
      '1 mark: Displays meaningful total cost and returns the calculated total.'
    ]))
],{two:true}));

/* Q21: NickSales Ltd Sales Prediction & Web System (6 marks) */
qs.push(Q(SA,'A retail clothes company, NickSales Ltd, wants to predict monthly sales for its products based on historical sales data, marketing spends, and seasonal trends. They decide to automate this process using Machine Learning (ML).<br><br>The data science team creates a software application in Python, using OOP principles to structure the ML models. They apply two different regression techniques:<br>&bull; Linear regression<br>&bull; Polynomial regression',[
  P('(a)',tx('Distinguish between linear regression and polynomial regression for this scenario. (3 marks)',3,100,
    'Linear regression fits a straight-line relationship (y = mx + b) between independent variables (e.g. marketing spend) and monthly sales, assuming that sales increase or decrease at a constant, proportional rate.\nPolynomial regression models non-linear, curved relationships (y = a_n*x^n + ... + a_1*x + a_0). In the NickSales retail scenario, sales are heavily influenced by seasonal trends (e.g. sharp winter jacket peaks followed by summer troughs) or diminishing returns on marketing spend. Polynomial regression captures these cyclical fluctuations and non-linear patterns that a simple straight line would fail to represent.',
    [
      '3 marks: Clearly distinguishes linear (straight line, constant rate) from polynomial regression (curved/non-linear), explicitly linking polynomial regression to retail seasonal trends or non-linear marketing returns.',
      '2 marks: Distinguishes both models with limited link to the retail sales scenario.',
      '1 mark: Basic mention of linear or polynomial regression.'
    ])),
  P('(b)',tx('The web system for NickSales Ltd operates using the following components:<br>&bull; User ordering their clothing items<br>&bull; Website processing the order<br>&bull; Updating the stock inventory/database<br><br>Describe how these components interact to form an interactive web development system. (3 marks)',3,100,
    '1. User ordering clothing: The customer browses items on the front-end interface, adds selections to their shopping cart, and submits their order and payment details via an interactive HTML/JS form.\n2. Website processing order: The client-side browser transmits an HTTP/HTTPS POST request to the web server. The backend application server validates inputs, coordinates payment processing, and verifies that items are in stock.\n3. Updating inventory/database: The backend executes transactional database queries (or ORM operations) to decrement available stock counts in the database and create an order record. The database confirms the update, and the server returns an order confirmation response to the user\'s browser, completing the interactive cycle.',
    [
      '3 marks: Describes the complete interaction cycle between all three components (user submission, server processing/validation, and database transaction/update) with clear communication flow.',
      '2 marks: Describes interactions between components with minor omissions.',
      '1 mark: Identifies components with minimal explanation of interaction.'
    ]))
],{two:true}));

/* Q22: InstantPage Time Conversion (4 marks) */
qs.push(Q(SEP,'InstantPage is a new social media product that regularly updates the user with details of time spent using the app. InstantPage provides the time in minutes only.<br><br>A program is to be created to convert the minutes into hours and minutes.<br>e.g. 134 minutes = 2 hours 14 minutes.',[
  P('(a)',mc('Select (by selecting the radio button below) the modelling tool that represent the subroutines and their relationships for the InstantPage app. (1 mark)',[
    'Structure Chart',
    'Data Flow Diagram (DFD)',
    'Entity Relationship Diagram (ERD)',
    'Gantt Chart'
  ],0,'A structure chart models software modularity by showing subroutines, modules, and the calling and parameter passing relationships between them.')),
  P('(b)',py('Create a function, using Python, where the user enters the minutes and converts this time into the equivalent hours and minutes. The displayed time should be grammatically correct. (3 marks)',3,'',
`def convert_time():
    mins = int(input("Enter minutes: "))
    hours = mins // 60
    minutes = mins % 60
    
    h_label = "hour" if hours == 1 else "hours"
    m_label = "minute" if minutes == 1 else "minutes"
    
    print(f"{hours} {h_label} {minutes} {m_label}")

convert_time()`,
    [
      {i:['134'],o:'2 hours 14 minutes'},
      {i:['61'],o:'1 hour 1 minute'},
      {i:['60'],o:'1 hour 0 minutes'}
    ],
    [
      '1 mark: Prompts user and reads integer input for minutes.',
      '1 mark: Correctly calculates hours using integer division (// 60) and remaining minutes using modulo (% 60).',
      '1 mark: Implements grammatical correctness (singular "hour"/"minute" vs plural "hours"/"minutes") and prints the formatted string.'
    ]))
],{two:true}));

/* Q23: BJcomputing Solutions MLOps Stages (5 marks) */
qs.push(Q(SA,'BJcomputing Solutions Inc. is a tech company specializing in predictive analytics for e-commerce. The company wants to improve customer experience by deploying a Machine Learning (ML) recommendation system that suggests products based on user behaviour. Their Data Science team has created a model with high accuracy, but they face challenges moving it efficiently into production and maintaining it as user data and behaviour patterns change.'+fig('Three Stages of Machine Learning Operations (MLOps)',`<svg viewBox="0 0 600 240" width="100%" height="200" style="background:#fff;font-family:sans-serif;font-size:12px;">
  <!-- Stage 1 -->
  <rect x="20" y="30" width="160" height="160" rx="8" fill="#e8f0fe" stroke="#1a73e8" stroke-width="2"/>
  <text x="100" y="60" text-anchor="middle" font-weight="bold" fill="#1a73e8">Stage 1: Design</text>
  <text x="100" y="90" text-anchor="middle" fill="#333">Problem Definition</text>
  <text x="100" y="115" text-anchor="middle" fill="#333">Data Ingestion</text>
  <text x="100" y="140" text-anchor="middle" fill="#333">Data Validation</text>
  <text x="100" y="165" text-anchor="middle" fill="#333">Feature Engineering</text>
  <!-- Stage 2 -->
  <rect x="220" y="30" width="160" height="160" rx="8" fill="#fef7e0" stroke="#f9ab00" stroke-width="2"/>
  <text x="300" y="60" text-anchor="middle" font-weight="bold" fill="#b06000">Stage 2: Development</text>
  <text x="300" y="90" text-anchor="middle" fill="#333">Model Training</text>
  <text x="300" y="115" text-anchor="middle" fill="#333">Model Evaluation</text>
  <text x="300" y="140" text-anchor="middle" fill="#333">Experiment Tracking</text>
  <text x="300" y="165" text-anchor="middle" fill="#333">CI/CD Pipeline</text>
  <!-- Stage 3 -->
  <rect x="420" y="30" width="160" height="160" rx="8" fill="#ceead6" stroke="#1e8e3e" stroke-width="2"/>
  <text x="500" y="60" text-anchor="middle" font-weight="bold" fill="#1e8e3e">Stage 3: Operations</text>
  <text x="500" y="90" text-anchor="middle" fill="#333">Model Deployment</text>
  <text x="500" y="115" text-anchor="middle" fill="#333">Continuous Monitoring</text>
  <text x="500" y="140" text-anchor="middle" fill="#333">Data Drift Detection</text>
  <text x="500" y="165" text-anchor="middle" fill="#333">Automated Retraining</text>
  <!-- Connectors -->
  <defs><marker id="mlarr" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><polygon points="0 0, 6 2.5, 0 5" fill="#555"/></marker></defs>
  <line x1="180" y1="110" x2="220" y2="110" stroke="#555" stroke-width="2" marker-end="url(#mlarr)"/>
  <line x1="380" y1="110" x2="420" y2="110" stroke="#555" stroke-width="2" marker-end="url(#mlarr)"/>
</svg>`),[
  tx('Analyse how the team could use the three stages of Machine Learning Operations (MLOps), as shown in the diagram in the stimulus (shown left). (5 marks)',5,180,
    'The team can use the three stages of MLOps to transition their model from research into a maintainable production service:\n1. Stage 1 - Design & Data Engineering:\nThe team defines business KPIs (e.g. click-through rates, purchase conversions) and builds automated data pipelines. They automate the continuous ingestion, cleaning, and feature engineering of incoming user interaction logs, ensuring consistent training data and eliminating data leakage.\n2. Stage 2 - Model Development & CI/CD:\nThe team uses automated training pipelines and version-controlled experiment tracking (tracking code, hyperparameters, and datasets). Continuous Integration (CI) automatically runs unit tests and model validation against benchmark datasets whenever code changes, ensuring high accuracy before release.\n3. Stage 3 - Operations & Continuous Monitoring:\nThe model is deployed via containerised microservices (e.g. Docker/Kubernetes) behind a low-latency API. The team implements real-time monitoring to detect data drift (changes in user behaviour over time) and model degradation. When drift is detected, automated retraining pipelines trigger with fresh data, ensuring recommendations remain accurate and relevant.',
    [
      '5 marks: Comprehensive analysis across all three stages of MLOps (Design/Data, Development/CI, and Operations/Monitoring/Retraining) directly addressing production transition and adapting to shifting user behaviour.',
      '3-4 marks: Analyses all three stages with good detail, or discusses two stages thoroughly.',
      '1-2 marks: Identifies MLOps stages with superficial description.'
    ])
],{two:true}));

/* Q24: Airline Seat Booking Module (6 marks) */
qs.push(Q(SEP,'You have been asked by an emerging airline to develop a program to allocate Business and Economy Class seats for flights on board their new Airbus 380-800 planes. The current seat-booking system consists of a number of modules, including:<br>&bull; booking and seat allocation<br>&bull; online payment<br>&bull; ticket production<br>&bull; printing of boarding passes.<br><br>The new booking and seat allocation module needs to fulfil the flowing requirements:<br>&bull; Ask the user for the class of tickets required.<br>&bull; Ask the user for the number of tickets required. A maximum of 4 tickets can be purchased at one time.<br>&bull; If only one ticket is required, allocate the next unallocated seat.<br>&bull; If more than one ticket is required, allocate seats next to each other in the same row. However, if the required seats cannot be found together, an appropriate message should be displayed and the booking process restarted.<br>&bull; Output the allocated seat number(s).<br><br>The Business Class passengers are to be seated in 5 rows of 8 seats. Column 0 contains the letters A to E. Row 0 contains the numbers 1 to 8.<br>The Economy Class passengers are to be seated in 15 rows of 10 seats. Column 0 contains the letters F to T. Row 0 contains the numbers 1 to 10.<br>An ‘X’ indicates that the seat has already been allocated. For example, if four tickets are ordered in Economy Class, the seats G6, G7, G8 and G9 would be allocated.<p><b>Business Class Seating Plan:</b></p>'+tbl(
  ['','1','2','3','4','5','6','7','8'],
  [
    ['A','X','X','X','X','','','',''],
    ['B','X','X','X','X','X','','',''],
    ['C','X','X','X','X','X','X','X',''],
    ['D','','','','','','','',''],
    ['E','','','','','','','','']
  ]
)+'<p><b>Economy Class Seating Plan:</b></p>'+tbl(
  ['','1','2','3','4','5','6','7','8','9','10'],
  [
    ['F','X','X','X','X','','','','X','X',''],
    ['G','X','X','X','X','X','','','','',''],
    ['H','X','X','X','X','X','X','X','','',''],
    ['...','','','','','','','','','',''],
    ['T','','','','','','','','','','']
  ]
),[
  py('Develop a program, using Python, that performs the requirement of the booking and seat allocation module. It should use Functions where appropriate, allocating the occupied seats of each seating class. (6 marks)',6,'',
`# Airbus 380-800 Seat Allocation Program

# Initialize Business Class (5 rows: A-E, 8 seats: 1-8)
business_rows = ['A', 'B', 'C', 'D', 'E']
business_grid = [
    ['X', 'X', 'X', 'X', '', '', '', ''],
    ['X', 'X', 'X', 'X', 'X', '', '', ''],
    ['X', 'X', 'X', 'X', 'X', 'X', 'X', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '']
]

# Initialize Economy Class (15 rows: F-T, 10 seats: 1-10)
economy_rows = ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T']
economy_grid = [
    ['X', 'X', 'X', 'X', '', '', '', 'X', 'X', ''],
    ['X', 'X', 'X', 'X', 'X', '', '', '', '', ''],
    ['X', 'X', 'X', 'X', 'X', 'X', 'X', '', '', '']
] + [['' for _ in range(10)] for _ in range(12)]

def allocate_seats(grid, rows, count, cols):
    if count == 1:
        for r in range(len(rows)):
            for c in range(cols):
                if grid[r][c] == '':
                    grid[r][c] = 'X'
                    return [f"{rows[r]}{c + 1}"]
        return None
    else:
        for r in range(len(rows)):
            for c in range(cols - count + 1):
                if all(grid[r][c + i] == '' for i in range(count)):
                    allocated = []
                    for i in range(count):
                        grid[r][c + i] = 'X'
                        allocated.append(f"{rows[r]}{c + i + 1}")
                    return allocated
        return None

def main():
    seat_class = input("Enter class (Business or Economy): ").strip()
    tickets = int(input("Enter number of tickets (1-4): "))
    
    if tickets < 1 or tickets > 4:
        print("Invalid number of tickets. Must be between 1 and 4.")
        return
        
    if seat_class.lower() == "business":
        allocated = allocate_seats(business_grid, business_rows, tickets, 8)
    else:
        allocated = allocate_seats(economy_grid, economy_rows, tickets, 10)
        
    if allocated:
        print("Allocated seats:", ", ".join(allocated))
    else:
        print("Required seats cannot be found together. Please restart booking.")

main()`,
    [
      {i:['Economy','4'],o:'Allocated seats: G6, G7, G8, G9'},
      {i:['Business','1'],o:'Allocated seats: A5'},
      {i:['Business','2'],o:'Allocated seats: A5, A6'}
    ],
    [
      '1 mark: Prompts user for ticket class and quantity (validating 1-4 tickets).',
      '1 mark: Uses modular functions to organize seating allocation logic.',
      '1 mark: Iterates through 2D seating array representation correctly.',
      '1 mark: Successfully finds and allocates a single unallocated seat when 1 ticket requested.',
      '1 mark: Successfully finds contiguous unallocated seats in the same row when multiple tickets requested, or outputs failure message.',
      '1 mark: Updates seats to occupied ("X") and displays formatted allocated seat labels.'
    ])
],{two:true}));

/* Q25: MetroWave Internal Memo Data Breach (7 marks) */
qs.push(Q(SSA,'The following internal company memo was prepared for employees within a software development company.<br><br><i>(Note: There are 7 slides in the presentation. Use the arrow icons to move between slides. Clicking on the slide will display its contents in full screen mode.)</i><p></p>'+
  slides([
    '<div style="text-align:center"><img src="metrowave-s1.png" style="max-width:100%;max-height:340px;border-radius:4px" alt="About MetroWave"></div>',
    '<div style="text-align:center"><img src="metrowave-s2.png" style="max-width:100%;max-height:340px;border-radius:4px" alt="Incident Overview"></div>',
    '<div style="text-align:center"><img src="metrowave-s3.png" style="max-width:100%;max-height:340px;border-radius:4px" alt="Impact on Clients and Data Exposed"></div>',
    '<div style="text-align:center"><img src="metrowave-s4.png" style="max-width:100%;max-height:340px;border-radius:4px" alt="Ramifications: Privacy, Intellectual Property, Legal Consequences"></div>',
    '<div style="text-align:center"><img src="metrowave-s5.png" style="max-width:100%;max-height:340px;border-radius:4px" alt="Ramifications: Digital Disruption, Employment Impact"></div>',
    slide('Remediation & Technical Response',
      '<p><b>&bull; Immediate Hotfix:</b> API authentication vulnerability patched and deployed within 4 hours of detection.</p>'+
      '<p><b>&bull; Token Revocation:</b> All active API session tokens and database credentials rotated immediately.</p>'+
      '<p><b>&bull; Client Notification:</b> Dedicated breach response hotline established; formal breach notification sent to all 200 impacted client organisations.</p>',
      '<div style="font-size:42px" aria-hidden="true">&#128736;&#65039;</div>'),
    slide('Governance & Future Safeguards',
      '<p><b>&bull; Security by Design:</b> Mandatory static code analysis and automated vulnerability testing integrated into CI/CD pipelines.</p>'+
      '<p><b>&bull; External Audit:</b> Third-party cybersecurity firm engaged to conduct comprehensive penetration testing.</p>'+
      '<p><b>&bull; Staff Retraining:</b> Mandatory secure coding and threat modeling refresher courses scheduled for all engineering personnel.</p>',
      '<div style="font-size:42px" aria-hidden="true">&#128274;</div>')
  ],'MetroWave Internal Presentation (7 Slides)'),[
  tx('Evaluate the social, ethical and legal issues for both MetroWave and their clients resulting from the data breach incident. (7 marks)',7,260,
    '• Social Issues:\nFor MetroWave: Severe reputational damage and erosion of trust as a leading Australian software vendor. Employees face intense stress, plummeting morale, and job security fears, particularly in security and customer support teams.\nFor Clients: Business disruption, loss of customer goodwill, and public relations fallout if their own customers discover that proprietary records and financial data were exposed.\n\n• Ethical Issues:\nFor MetroWave: Failure to implement basic API authentication controls violates ethical obligations of due diligence and "Security by Design". Allowing the breach to go undetected for two weeks demonstrates deficient monitoring and logging. MetroWave has an ethical duty of transparent and immediate disclosure to all 200 affected clients.\nFor Clients: Clients trusted MetroWave with confidential project files and now face moral dilemmas regarding notifying their own stakeholders and partners whose intellectual property or personal data may be compromised.\n\n• Legal Issues:\nFor MetroWave: Under the Australian Privacy Act (1988) and Notifiable Data Breaches (NDB) scheme, MetroWave is legally mandated to notify the Office of the Australian Information Commissioner (OAIC) and affected parties if serious harm is likely. MetroWave faces substantial civil penalties and potential lawsuits for contractual breach and negligence in safeguarding confidential business records.\nFor Clients: Clients may suffer direct financial losses from leaked product roadmaps and trade secrets, prompting legal action against MetroWave for damages, while potentially facing regulatory inquiries if their own customer data was exposed.',
    [
      '7 marks: Thorough, balanced evaluation assessing social, ethical, and legal issues for BOTH MetroWave and their clients, supported by direct evidence from the presentation slides.',
      '5-6 marks: Evaluates social, ethical, and legal issues well, with good coverage of both parties and minor omissions in one aspect.',
      '3-4 marks: Discusses some social, ethical, or legal issues, but focuses predominantly on only one party (MetroWave or clients) or lacks depth.',
      '1-2 marks: Outlines general issues related to data breaches with limited connection to the scenario.'
    ])
],{two:true}));

BANKS.push({
  id: '13',
  name: 'CSSA 2025 Trial',
  sub: 'CSSA Trial Examination 2025 · 25 questions · 80 marks',
  trial: true,
  questions: 25,
  credit: 'CSSA 2025 Trial Examination, Software Engineering. Converted to the online exam format question for question.',
  qs: qs
});
})();
