/* IT 2025 Trial Higher School Certificate Examination, Software Engineering.
   Converted question for question from the published paper.
   Total 80 marks across 32 questions (Section 1: Q1-Q16, Section 2: Q1-Q16). */
(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var qs=[];

/* ==========================================================================
   SECTION 1: Questions 1 to 16 (20 marks)
   ========================================================================== */

/* Q1: Privacy by Design */
qs.push(Q(SSA,'',[
  mc('The “Privacy by Design” approach is defined as:',[
    'Incorporating privacy principles and data protection throughout the entire software development life cycle',
    'Adding privacy settings and database encryption after software deployment',
    'Relying exclusively on user privacy policy acceptances instead of system controls',
    'Restricting software architecture to private offline local networks'
  ],0,'Privacy by Design requires that privacy and data protection are integrated into the architecture of IT systems throughout all development phases from initial conception to deployment.')
]));

/* Q2: CSRF Attack */
qs.push(Q(SSA,'A user logs into their bank’s website, which allows money transfers via a button. A hacker sends the user a malicious email containing a link. When the user clicks the link, a money transfer request is executed without their knowledge.',[
  mc('What type of attack is this?',[
    'Cross-Site Request Forgery (CSRF)',
    'Cross-Site Scripting (XSS)',
    'SQL Injection',
    'Man-in-the-Middle (MitM)'
  ],0,'In a Cross-Site Request Forgery (CSRF) attack, an attacker tricks an authenticated user into executing an unauthorized request (such as a financial transfer) using their existing active session.')
]));

/* Q3: Email Send Protocol */
qs.push(Q(PW,'',[
  mc('Email clients send mail using which protocol?',[
    'POP3',
    'IMAP',
    'SMTP',
    'HTTP'
  ],2,'SMTP (Simple Mail Transfer Protocol) is the standard protocol used by email clients to send outgoing email messages to a mail server.')
]));

/* Q4: Role of client-side programming */
qs.push(Q(PW,'',[
  mc('In the context of a web application, what is the main role of client-side programming?',[
    'Interacting directly with the database to execute SQL statements',
    'Handling user interactions, manipulating the DOM, and providing immediate feedback in the browser',
    'Securing session cookies and hashing passwords on the server',
    'Managing web server routing, networking, and server hardware allocation'
  ],1,'Client-side programming (such as JavaScript) executes in the client’s browser to handle user input, update the DOM dynamically, and improve user experience without requiring full-page reloads.')
]));

/* Q5: Ensuring automation benefits society */
qs.push(Q(SA,'',[
  mc('What is the most effective approach to ensuring that automation benefits society as a whole?',[
    'Automating all manual industries rapidly without regulatory oversight',
    'Establishing ethical frameworks, workforce reskilling initiatives, and regulatory oversight',
    'Prohibiting automated systems in workplaces to protect traditional jobs',
    'Allowing software companies to deploy autonomous models without public accountability'
  ],1,'Ensuring automation benefits society requires proactive workforce transition and retraining, ethical development frameworks, and clear regulatory safeguards to balance productivity gains with societal welfare.')
]));

/* Q6: Real estate regression model */
qs.push(Q(SA,'A real estate agency wants to build a model to predict whether a house is likely to be sold within 60 days based on features such as its price, location score, number of bedrooms, and age.',[
  mc('Based on the scenario above, which regression model is most appropriate, and why?',[
    'Linear regression, because it outputs a continuous numerical selling price',
    'Logistic regression, because the target outcome is a binary categorical outcome (sold vs not sold within 60 days)',
    'Polynomial regression, because house price relationships are non-linear',
    'Multiple linear regression, because there are multiple independent input features'
  ],1,'Predicting whether a house will be sold within 60 days is a binary classification problem (Yes/No), making logistic regression the appropriate model.')
]));

/* Q7: Phased implementation */
qs.push(Q(SEP,'A new software application is introduced by initially running the program with only a few of its modules active. After confirming that these modules function correctly, the remaining components are gradually activated.',[
  mc('What type of implementation method does this scenario describe?',[
    'Direct cutover',
    'Parallel implementation',
    'Phased implementation',
    'Pilot implementation'
  ],2,'Phased implementation introduces the new system in stages, gradually rolling out modules or features over time once earlier stages are verified.')
]));

/* Q8: Agile Development Approach */
qs.push(Q(SEP,'',[
  mc('Which of the following is true for the Agile Development Approach?',[
    'It prioritises comprehensive documentation over working software at each phase',
    'It emphasizes iterative development, frequent client collaboration, and responsiveness to change',
    'Testing is postponed until the entire software application has been developed',
    'Customer feedback is collected only during the final acceptance phase'
  ],1,'Agile development focuses on short iterative cycles (sprints), continuous customer feedback, regular feature delivery, and adapting flexibly to changing requirements.')
]));

/* Q9: Sandboxing */
qs.push(Q(SSA,'',[
  mc('What are the benefits of using sandboxing in software development or deployment?',[
    'It automatically optimizes code compilation to increase execution speed',
    'It isolates running applications from the host operating system to prevent untrusted code from causing damage',
    'It removes the necessity for source code testing and validation',
    'It increases network transmission bandwidth by bypassing firewall inspection'
  ],1,'Sandboxing isolates untrusted or test programs within a restricted environment, preventing malicious actions or bugs from accessing system files, the network, or other applications on the host machine.')
]));

/* Q10: CSS Styling */
qs.push(Q(PW,'Consider the following CSS code.'+code(`body {
    background-color: #0000ff;
    color: #00ff00;
    font-family: Arial, serif;
    margin: 20px;
}
h1 {
    color: #ff0000;
    text-align: center;
}
p {
    color: #ffffff;
    font-size: 16px;
}`),[
  mc('Refer to the Stimulus. Which of the following is true for pages styled using the CSS code?',[
    'Paragraph text (p) will be white (#ffffff) with a font size of 16px',
    'The main background colour of the page will be green (#00ff00)',
    'All headings (h1) will inherit the green text colour from the body selector',
    'The font family for paragraphs will default to serif only, ignoring Arial'
  ],0,'The p selector explicitly sets the text colour to #ffffff (white) and font-size to 16px. The h1 rule overrides the body text colour with red (#ff0000), and the body background colour is blue (#0000ff).')
]));

/* Q11: Impacts of automation */
qs.push(Q(SA,'',[
  ms('Which of the following impacts are likely to result from increased automation in the workplace?<br>Select all that apply.',[
    'Reduction in repetitive, manual, and routine tasks',
    'Complete elimination of all human employment across all industries',
    'Increased demand for technical skills such as software maintenance and data analysis',
    'Potential short-term displacement of workers requiring retraining',
    'Guaranteed elimination of algorithmic errors and bias'
  ],[0,2,3],1,'Automation reduces repetitive tasks, creates demand for higher-level technical roles, and can displace certain job categories, but does not eliminate all jobs or prevent all errors.')
]));

/* Q12: Context diagram */
qs.push(Q(SEP,'The following context diagram describes a food ordering app.'+fig('Context Diagram for Food Ordering Application',`<svg viewBox="0 0 700 320" width="100%" height="240" style="background:#fff;font-family:sans-serif;font-size:12px;">
  <rect x="20" y="30" width="120" height="60" rx="4" fill="#e8f0fe" stroke="#1a73e8" stroke-width="2"/>
  <text x="80" y="65" text-anchor="middle" font-weight="bold" fill="#1a73e8">Customer</text>
  <rect x="560" y="30" width="120" height="60" rx="4" fill="#e8f0fe" stroke="#1a73e8" stroke-width="2"/>
  <text x="620" y="65" text-anchor="middle" font-weight="bold" fill="#1a73e8">Restaurant</text>
  <rect x="20" y="210" width="120" height="60" rx="4" fill="#e8f0fe" stroke="#1a73e8" stroke-width="2"/>
  <text x="80" y="245" text-anchor="middle" font-weight="bold" fill="#1a73e8">Payment Gateway</text>
  <rect x="560" y="210" width="120" height="60" rx="4" fill="#e8f0fe" stroke="#1a73e8" stroke-width="2"/>
  <text x="620" y="245" text-anchor="middle" font-weight="bold" fill="#1a73e8">Delivery Driver</text>
  <circle cx="350" cy="150" r="70" fill="#fef7e0" stroke="#f9ab00" stroke-width="2"/>
  <text x="350" y="145" text-anchor="middle" font-weight="bold" fill="#b06000">0</text>
  <text x="350" y="165" text-anchor="middle" font-weight="bold" fill="#b06000">Food Ordering</text>
  <text x="350" y="180" text-anchor="middle" font-weight="bold" fill="#b06000">App System</text>
  <defs><marker id="ctxah" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <line x1="140" y1="45" x2="285" y2="120" stroke="#333" stroke-width="1.5" marker-end="url(#ctxah)"/>
  <text x="190" y="70" fill="#333">Order Details</text>
  <line x1="285" y1="135" x2="140" y2="70" stroke="#333" stroke-width="1.5" marker-end="url(#ctxah)"/>
  <text x="180" y="115" fill="#333">Receipt &amp; Status</text>
  <line x1="415" y1="120" x2="560" y2="45" stroke="#333" stroke-width="1.5" marker-end="url(#ctxah)"/>
  <text x="440" y="70" fill="#333">Order to Prepare</text>
  <line x1="560" y1="70" x2="415" y2="135" stroke="#333" stroke-width="1.5" marker-end="url(#ctxah)"/>
  <text x="450" y="115" fill="#333">Food Ready Alert</text>
  <line x1="285" y1="170" x2="140" y2="230" stroke="#333" stroke-width="1.5" marker-end="url(#ctxah)"/>
  <text x="160" y="190" fill="#333">Charge Request</text>
  <line x1="140" y1="250" x2="285" y2="185" stroke="#333" stroke-width="1.5" marker-end="url(#ctxah)"/>
  <text x="160" y="235" fill="#333">Payment Status</text>
  <line x1="415" y1="175" x2="560" y2="235" stroke="#333" stroke-width="1.5" marker-end="url(#ctxah)"/>
  <text x="445" y="210" fill="#333">Dispatch Instructions</text>
</svg>`),[
  ms('Refer to the Stimulus. Based on the diagram, which statements are correct?<br>Select all that apply.',[
    'The Customer sends order details to the system and receives an order confirmation and status',
    'The Restaurant is an external entity that receives order requests from the system',
    'Data stores are explicitly included inside a context diagram',
    'The Payment Gateway sends payment confirmation to the system'
  ],[0,1,3],1,'Context diagrams represent the entire system as a single process bubble interacting with external entities. Data stores are never shown on a context diagram; they appear in Level 1 DFDs.')
]));

/* Q13: Match Security Testing Strategy */
qs.push(Q(SSA,'',[
  dm('Match each feature with its correct security testing strategy.',[
    'Static Analysis (SAST)',
    'Dynamic Testing (DAST)',
    'Fuzz Testing',
    'Vulnerability Scanning'
  ],[
    ['Analysing source code for security flaws without executing the program',0],
    ['Testing a running application by sending unexpected, malformed, or random inputs',2],
    ['Simulating real-world cyberattacks on a live deployed system from an external perspective',1],
    ['Automated inspection of system configurations, open ports, and unpatched known exploits',3]
  ],2,{why:'SAST inspects static source code. Fuzz testing sends malformed random input to break code. DAST tests running applications externally. Vulnerability scanning audits systems and ports for known flaws.'})
]));

/* Q14: Match W3C Initiatives */
qs.push(Q(PW,'',[
  dm('Match each web development role with the W3C initiative or focus area to which it belongs.',[
    'Web Accessibility (WCAG)',
    'Internationalization (i18n)',
    'Web Standards (HTML/CSS)',
    'Web Security / Privacy'
  ],[
    ['Ensuring content is usable by people with visual, auditory, motor, or cognitive disabilities',0],
    ['Adapting web architecture and typography to support multiple human languages, scripts, and locales',1],
    ['Standardising markup, layout stylesheets, and DOM APIs across browser engines',2],
    ['Developing secure browser authentication APIs and Content Security Policies',3]
  ],2,{why:'WCAG focuses on accessibility for disabled users, i18n supports diverse languages/locales, HTML/CSS standards govern browser rendering, and security/privacy initiatives safeguard web APIs.'})
]));

/* Q15: Match Machine Learning Models */
qs.push(Q(SA,'',[
  dm('Match each application scenario to the most appropriate machine learning model.',[
    'Linear Regression',
    'Logistic Regression',
    'Decision Tree',
    'K-Means Clustering'
  ],[
    ['Predicting the exact selling price of a house based on square metres and suburb',0],
    ['Classifying whether a bank transaction is fraudulent (Yes/No)',1],
    ['Diagnosing disease risk through transparent, human-readable branching rules',2],
    ['Grouping website visitors into unlabelled demographic clusters based on browsing habits',3]
  ],2,{why:'Linear regression predicts continuous amounts; logistic regression performs binary classification; decision trees provide interpretable branching rules; K-means performs unsupervised clustering.'})
]));

/* Q16: Match Software Project Phases */
qs.push(Q(SEP,'',[
  dm('Match each task with the correct software project phase.',[
    'Requirements Analysis',
    'System Design',
    'Implementation',
    'Testing'
  ],[
    ['Conducting user interviews to document functional and non-functional requirements',0],
    ['Creating structure charts, class diagrams, and database schemas',1],
    ['Writing modular source code and implementing backend algorithms',2],
    ['Conducting boundary-value test cases and tracking defect resolution',3]
  ],2,{why:'Requirements analysis identifies user needs; design architects models and schemas; implementation writes the code; testing validates correctness.'})
]));

/* ==========================================================================
   SECTION 2: Questions 1 to 16 (60 marks)
   ========================================================================== */

/* Q17 (Sec 2 Q1): Authentication vs Authorisation (3 marks) */
qs.push(Q(SSA,'',[
  tx('Distinguish between authentication and authorisation. (3 marks)',3,80,
    'Authentication is the process of verifying the identity of a user, system, or process (confirming "who you are"), typically through credentials such as passwords, biometric scans, or multi-factor authentication tokens. In contrast, authorisation determines the specific permissions and access rights granted to an authenticated user (confirming "what you are allowed to do"), specifying which files, databases, or operations they have privilege to access.',
    [
      '3 marks: Clearly defines and distinguishes both authentication and authorisation with accurate terminology and clear examples.',
      '2 marks: Distinguishes between the two concepts with minor omissions or lacks clear examples.',
      '1 mark: Identifies authentication or authorisation with basic or partial understanding.'
    ])
]));

/* Q18 (Sec 2 Q2): Race Condition & Purchase Item Lock (4 marks) */
qs.push(Q(SSA,'The Python code below defines a function that allows a user to purchase an item.'+code(`import threading
lock = threading.Lock()

def purchase_item(user_id, item_id):
    with lock:  
        if inventory[item_id] > 0:
            inventory[item_id] -= 1
            confirm_purchase(user_id, item_id)`),[
  tx('Refer to the Stimulus. Explain what a race condition is and how it could affect the purchase_item function if no lock was implemented. (4 marks)',4,120,
    'A race condition occurs in concurrent programming when two or more threads access and attempt to modify shared data simultaneously, where the final outcome depends on the non-deterministic timing or execution order of the threads.\n\nIf the lock was removed from purchase_item, two users could call the function at the exact same moment when inventory[item_id] equals 1. Both threads could simultaneously evaluate the condition "inventory[item_id] > 0" as True before either thread decrements the inventory. Both threads would then execute inventory[item_id] -= 1 and confirm_purchase(), resulting in the inventory dropping to -1 and an item being oversold to two customers when only one was available. The lock prevents this by ensuring mutual exclusion, allowing only one thread at a time to execute the critical section.',
    [
      '4 marks: Comprehensive explanation of a race condition and a detailed, scenario-linked explanation of how concurrency without a lock causes overselling/inventory corruption.',
      '3 marks: Explains a race condition and outlines how the shared inventory check leads to simultaneous execution or overselling.',
      '2 marks: Explains either race condition or the effect on purchase_item with limited detail.',
      '1 mark: Minimal understanding of race conditions or locking.'
    ])
],{two:true}));

/* Q19 (Sec 2 Q3): School Assessment Portal CIA Triad (3 marks) */
qs.push(Q(SSA,'A school’s online portal allows students to upload assessment files. Recently, a student discovered that by modifying the URL, they could access and download other students’ submitted files. It was also found that students could re-upload their work multiple times, overwriting previous submissions without detection even after the due date.',[
  tx('Refer to the Stimulus. Describe how confidentiality, accountability and integrity has been compromised in this scenario. (3 marks)',3,100,
    '• Confidentiality is compromised because students can alter URL parameters (such as an insecure direct object reference) to view and download other students\' private assessment submissions without authorization.\n• Accountability is compromised because students can overwrite previous submissions without detection or audit logging, meaning administrators cannot track who made changes, what previous version existed, or whether submissions were altered.\n• Integrity is compromised because submitted assessment files can be overwritten after the due date, corrupting the validity and untampered state of the original submission record.',
    [
      '3 marks: Clearly describes how all three principles (confidentiality, accountability, integrity) were compromised with direct reference to the scenario.',
      '2 marks: Describes two principles clearly or addresses all three with limited depth.',
      '1 mark: Identifies one principle or provides vague descriptions without scenario linkage.'
    ])
],{two:true}));

/* Q20 (Sec 2 Q4): Collaboration in Software Engineering (4 marks) */
qs.push(Q(SEP,'',[
  tx('Discuss the benefits of collaboration in software engineering.<br><br>In your response:<br>&bull; Highlight at least three key advantages that effective collaboration can bring to a software development project.<br>&bull; Provide an example of a collaboration tool and explain how it facilitates collaboration among developers. (4 marks)',4,140,
    'Effective collaboration brings several key advantages to software projects:\n1. Higher code quality and fewer defects through peer code reviews and shared knowledge.\n2. Faster problem solving and enhanced innovation by combining diverse developer perspectives and skill sets.\n3. Improved project tracking and reduced redundancy through coordinated task division and clear communication.\n\nAn example tool is Git / GitHub. It facilitates collaboration by providing distributed version control where developers work on isolated feature branches, submit Pull Requests for peer review, discuss architectural decisions inline, and resolve merge conflicts systematically, ensuring team members coordinate smoothly without overwriting each other\'s work.',
    [
      '4 marks: Discusses three distinct advantages of collaboration and provides a specific collaboration tool with a detailed explanation of how it facilitates developer cooperation.',
      '3 marks: Discusses three advantages and names a tool, or discusses two advantages with detailed tool explanation.',
      '2 marks: Identifies benefits of collaboration with limited detail or omits the tool example.',
      '1 mark: Minimal discussion of collaboration.'
    ])
]));

/* Q21 (Sec 2 Q5): Primary function of DNS (2 marks) */
qs.push(Q(PW,'',[
  tx('Outline the primary function performed by the Domain Name System (DNS). (2 marks)',2,50,
    'The primary function of the Domain Name System (DNS) is to translate human-friendly domain names (such as www.example.com) into machine-readable IP addresses (such as 192.0.2.1), allowing browsers and networked clients to locate and connect to web servers on the internet.',
    [
      '2 marks: Clearly outlines DNS translation between domain names and numerical IP addresses to enable routing.',
      '1 mark: Mentions domain names or IP addresses with incomplete explanation.'
    ])
]));

/* Q22 (Sec 2 Q6): Web Content Management Systems (3 marks) */
qs.push(Q(PW,'',[
  tx('Outline the functions performed by web content management systems. Include two examples of web content management systems to assist your response. (3 marks)',3,90,
    'A Web Content Management System (CMS) enables non-technical users to create, edit, organise, publish, and delete digital web content through a user-friendly graphical interface without writing code. Key functions include content authoring (WYSIWYG editors), user role and access permission management, templating for consistent styling, media asset storage, and version history.\nTwo prominent examples of web content management systems are WordPress and Drupal (or Joomla / Strapi).',
    [
      '3 marks: Outlines core functions of a CMS (authoring, user roles, templating, publishing) and provides two relevant examples.',
      '2 marks: Outlines CMS functions with one example, or names two examples with brief functional outline.',
      '1 mark: Basic description of a CMS or lists examples only.'
    ])
]));

/* Q23 (Sec 2 Q7): HTTPS/SSL Handshake & Session Exchange (4 marks) */
qs.push(Q(SSA,'Secure encrypted communication between browsers and web servers utilises the https protocol which includes SSL/TLS certificates.',[
  tx('Refer to the Stimulus.<br><br>Outline the exchange between browser and web server to:<br>&bull; Confirm the identity of the web server<br>&bull; Establish a secure session<br>&bull; Communicate securely during the session (4 marks)',4,130,
    '1. Confirm identity: The browser sends a "Client Hello" and the server responds with a "Server Hello" and its SSL/TLS certificate containing its public key. The browser verifies the certificate against trusted Certificate Authorities (CAs) and checks its validity and domain name to confirm the server\'s authentic identity.\n2. Establish secure session: The browser and server use asymmetric encryption to negotiate cipher suites and exchange key material (e.g. encrypting a pre-master secret using the server\'s public key) to derive a shared symmetric session key.\n3. Communicate securely: For the remainder of the session, all transmitted HTTP requests and responses are encrypted and decrypted using the negotiated symmetric session key (e.g. AES), providing high-speed confidentiality and message authentication (MAC) to prevent tampering.',
    [
      '4 marks: Outlines all three phases (identity verification via CA certificate, session key exchange/establishment, and ongoing symmetric encryption) with accurate technical terminology.',
      '3 marks: Outlines identity verification and secure session setup with minor gaps in ongoing communication details.',
      '2 marks: Outlines encryption concepts but lacks structured explanation across all three required phases.',
      '1 mark: Minimal outline mentioning certificates or encryption.'
    ])
],{two:true}));

/* Q24 (Sec 2 Q8): Progressive Web App UI/UX for Infants (4 marks) */
qs.push(Q(PW,'',[
  tx('You have been tasked with designing and developing a Progressive Web App (PWA) aimed at enhancing the accessibility and inclusivity of educational resources for infants school students.<br><br>Outline how you would address the following key design principles when creating the user interface (UI) and user experience (UX) of your PWA:<br>&bull; Font selection and typography<br>&bull; Colour schemes and contrast<br>&bull; The use of audio and video elements<br>&bull; Navigation design (4 marks)',4,160,
    '• Font selection and typography: Use large, clear, sans-serif fonts (e.g. Comic Sans, OpenDyslexic, or Arial) with generous line spacing and letter tracking. Avoid intricate decorative fonts to ensure emerging readers can easily recognise letterforms.\n• Colour schemes and contrast: Employ high-contrast colour combinations (meeting WCAG AAA contrast ratios) with cheerful, distinct hues to differentiate interactive elements. Ensure information is never conveyed by colour alone, supporting colour-blind students.\n• Audio and video elements: Incorporate voice narration, spoken instructions, and sound effects for feedback so non-readers can understand tasks. Provide closed captions and visual cues for auditory content to assist hearing-impaired learners.\n• Navigation design: Design large, brightly coloured touch targets with intuitive pictorial icons (e.g. home icon, back arrow) rather than text labels. Maintain consistent, linear screen layouts with minimal nested menus so young children do not get lost.',
    [
      '4 marks: Comprehensive and age-appropriate design strategies addressing all four principles (typography, contrast, audio/video, navigation) specifically tailored to infants school students and accessibility.',
      '3 marks: Addresses all four principles with reasonable suitability, or three with high detail.',
      '2 marks: Addresses two principles with appropriate detail.',
      '1 mark: General UI comments with minimal focus on infants students or accessibility.'
    ])
]));

/* Q25 (Sec 2 Q9): Supervised vs Unsupervised Learning (2 marks) */
qs.push(Q(SA,'',[
  tx('Distinguish between supervised and unsupervised learning. (2 marks)',2,70,
    'Supervised learning trains models on labelled datasets, where each input example is paired with a known ground-truth output or target, enabling the model to learn a mapping function to predict labels on new data (e.g. classification or regression).\nIn contrast, unsupervised learning trains on unlabelled datasets with no predefined outputs, aiming to discover inherent patterns, groupings, or underlying structures within the data (e.g. clustering or dimensionality reduction).',
    [
      '2 marks: Clearly distinguishes supervised (labelled data, predicting targets) from unsupervised (unlabelled data, discovering patterns/clusters).',
      '1 mark: Mentions labels or gives an example with incomplete distinction.'
    ])
]));

/* Q26 (Sec 2 Q10): Weights and Backpropagation (3 marks) */
qs.push(Q(SA,'',[
  tx('Explain how weights and backpropagation allow a neural network to learn using training data. (3 marks)',3,100,
    'In an artificial neural network, weights represent the connection strengths between neurons that scale input signals during the forward pass to produce a predicted output.\nTo learn, the network compares its prediction against the known training label using a loss function to calculate the error. Backpropagation then computes the gradient of this error with respect to each weight by applying the mathematical chain rule, propagating error backwards from the output layer through the hidden layers. An optimisation algorithm (such as gradient descent) then updates the weights in the direction that minimises the loss, iteratively improving model accuracy over multiple training epochs.',
    [
      '3 marks: Explains the function of weights (scaling signals) and the backpropagation process (calculating error gradient backwards and adjusting weights to reduce loss).',
      '2 marks: Explains weights and error adjustment with partial explanation of backpropagation.',
      '1 mark: Basic mention of weights or error correction without technical clarity.'
    ])
]));

/* Q27 (Sec 2 Q11): Student Test Score Prediction Model (4 marks) */
qs.push(Q(SA,'',[
  tx('You have been asked to create a program that predicts student test scores based on the number of hours they studied.<br><br>&bull; Identify the most appropriate machine learning regression algorithm for this task.<br>&bull; Briefly outline how you would implement this using object oriented programming (OOP).<br>&bull; List two features your model would require to function effectively. (4 marks)',4,120,
    '• Regression algorithm: Simple Linear Regression (or Ordinary Least Squares regression), as it models the continuous relationship between one independent predictor (study hours) and one continuous dependent outcome (test score).\n• OOP Implementation: Create a StudentScorePredictor class with attributes such as slope (m), intercept (b), and training_data. Implement methods such as __init__() to initialise parameters, fit(hours, scores) to compute model coefficients from data, and predict(hours) to return the estimated score using y = mx + b.\n• Two required features:\n1. Study hours (input feature / independent variable).\n2. Historical student test scores (training label / target variable for model calibration).',
    [
      '4 marks: Correctly identifies linear regression, provides a clear OOP structure (class, attributes, methods), and lists two essential data features.',
      '3 marks: Identifies linear regression and outlines OOP or features with minor omission.',
      '2 marks: Identifies algorithm and provides partial OOP or feature description.',
      '1 mark: Identifies linear regression only.'
    ])
]));

/* Q28 (Sec 2 Q12): KNN Algorithm Pseudocode (6 marks) */
qs.push(Q(SA,'The K-Nearest Neighbours (KNN) algorithm is used to classify a new data point by comparing it to existing classified/labelled data points. It calculates the Euclidean distance between the new data point (shown as a question mark on the chart below) and every other point in the training data. It then counts the labels of the k closest points. The most common label among these neighbours is the predicted label assigned to the new point.'+fig('K-Nearest Neighbours Classification Scatter Plot',`<svg viewBox="0 0 500 300" width="100%" height="240" style="background:#fff;font-family:sans-serif;font-size:12px;">
  <!-- Axes -->
  <line x1="50" y1="260" x2="460" y2="260" stroke="#333" stroke-width="2"/>
  <line x1="50" y1="260" x2="50" y2="30" stroke="#333" stroke-width="2"/>
  <text x="250" y="290" text-anchor="middle" fill="#333">Feature X</text>
  <text x="20" y="150" text-anchor="middle" fill="#333" transform="rotate(-90 20 150)">Feature Y</text>
  <!-- Data Points -->
  <!-- Class A (Red) -->
  <circle cx="90" cy="210" r="7" fill="#d93025"/>
  <circle cx="110" cy="190" r="7" fill="#d93025"/>
  <circle cx="130" cy="220" r="7" fill="#d93025"/>
  <text x="110" y="240" text-anchor="middle" font-size="11" fill="#d93025" font-weight="bold">Class A</text>
  <!-- Class B (Blue) -->
  <circle cx="160" cy="90" r="7" fill="#1a73e8"/>
  <circle cx="180" cy="110" r="7" fill="#1a73e8"/>
  <circle cx="210" cy="80" r="7" fill="#1a73e8"/>
  <text x="180" y="65" text-anchor="middle" font-size="11" fill="#1a73e8" font-weight="bold">Class B</text>
  <!-- Class C (Green) -->
  <circle cx="340" cy="90" r="7" fill="#1e8e3e"/>
  <circle cx="370" cy="110" r="7" fill="#1e8e3e"/>
  <circle cx="360" cy="70" r="7" fill="#1e8e3e"/>
  <text x="360" y="55" text-anchor="middle" font-size="11" fill="#1e8e3e" font-weight="bold">Class C</text>
  <!-- Class D (Purple) -->
  <circle cx="380" cy="220" r="7" fill="#9334e6"/>
  <circle cx="410" cy="200" r="7" fill="#9334e6"/>
  <circle cx="420" cy="230" r="7" fill="#9334e6"/>
  <text x="400" y="250" text-anchor="middle" font-size="11" fill="#9334e6" font-weight="bold">Class D</text>
  <!-- New point (?) -->
  <circle cx="220" cy="160" r="11" fill="#fef7e0" stroke="#f9ab00" stroke-width="2"/>
  <text x="220" y="165" text-anchor="middle" font-weight="bold" font-size="14" fill="#b06000">?</text>
  <!-- Dashed radius -->
  <circle cx="220" cy="160" r="80" fill="none" stroke="#999" stroke-dasharray="4,4"/>
</svg>`),[
  ps('Refer to the Stimulus.<br><br>Write a pseudocode algorithm for a function called knn. It is passed:<br>&bull; newPoint: the x and y coordinates of the point to classify as A, B, C or D<br>&bull; tData: an array of x and y coordinates for all labelled points<br>&bull; tLabels: an array of strings with the label A, B, C or D for each known point<br>&bull; k: an integer<br><br>You may use the following pre-defined functions in your algorithm:<br>&bull; distance(p1, p2): returns the Euclidian distance between two (x, y) points<br>&bull; sort(pairlist): sorts an array of [distance, label] pairs in ascending order by distance<br>&bull; mode(array): returns the label that occurs most frequently in an array<br><br>Your algorithm should return the predicted label for the new data point. (6 marks)',6,
`BEGIN knn(newPoint, tData, tLabels, k)
    Set pairList = []
    FOR i = 0 TO length(tData) - 1
        Set dist = distance(newPoint, tData[i])
        Set pair = [dist, tLabels[i]]
        Append pair to pairList
    NEXT i
    
    Set sortedPairs = sort(pairList)
    
    Set kLabels = []
    FOR i = 0 TO k - 1
        Append sortedPairs[i][1] to kLabels
    NEXT i
    
    Set predictedLabel = mode(kLabels)
    RETURN predictedLabel
END knn`,
    [
      '1 mark: Correct function header knn(newPoint, tData, tLabels, k) and return statement.',
      '1 mark: Loops through all training data points and calls distance(newPoint, tData[i]).',
      '1 mark: Correctly constructs [distance, label] pairs and appends to pair list.',
      '1 mark: Calls sort() on the pair list.',
      '1 mark: Extracts the labels of the first k neighbours from the sorted list.',
      '1 mark: Calls mode() to find the most common label and returns the result.'
    ])
],{two:true}));

/* Q29 (Sec 2 Q13): Gantt charts and project deadlines (3 marks) */
qs.push(Q(SEP,'',[
  tx('How can Gantt charts assist project managers ensure project deadlines are met? (3 marks)',3,90,
    'A Gantt chart provides a visual timeline representing the project schedule, displaying each task\'s start date, duration, and completion deadline. It assists project managers by:\n1. Highlighting task dependencies and the critical path, showing which sequential tasks must finish on time to prevent overall project delays.\n2. Tracking progress against milestones in real time, allowing managers to identify slippages early.\n3. Facilitating effective resource allocation, ensuring team members are not overloaded and bottlenecked during overlapping phases.',
    [
      '3 marks: Explains how Gantt charts track timelines, task dependencies/critical path, and milestone progress to prevent delays.',
      '2 marks: Explains Gantt charts and deadlines with some detail on dependencies or milestones.',
      '1 mark: Basic description of a Gantt chart as a timeline schedule.'
    ])
]));

/* Q30 (Sec 2 Q14): Structure chart FindItem routine pseudocode (5 marks) */
qs.push(Q(SEP,'The structure chart below models a modular inventory lookup subsystem.'+fig('Structure Chart for FindItem',`<svg viewBox="0 0 600 240" width="100%" height="200" style="background:#fff;font-family:sans-serif;font-size:12px;">
  <!-- Main process -->
  <rect x="220" y="20" width="160" height="45" fill="#f1f3f4" stroke="#333" stroke-width="1.5"/>
  <text x="300" y="47" text-anchor="middle" font-weight="bold">FindItem</text>
  <!-- Subroutines -->
  <rect x="30" y="150" width="140" height="45" fill="#f1f3f4" stroke="#333" stroke-width="1.5"/>
  <text x="100" y="177" text-anchor="middle">ValidateTarget</text>
  <rect x="230" y="150" width="140" height="45" fill="#f1f3f4" stroke="#333" stroke-width="1.5"/>
  <text x="300" y="177" text-anchor="middle">SearchInventory</text>
  <rect x="430" y="150" width="140" height="45" fill="#f1f3f4" stroke="#333" stroke-width="1.5"/>
  <text x="500" y="177" text-anchor="middle">DisplayOutcome</text>
  <!-- Connectors -->
  <line x1="260" y1="65" x2="100" y2="150" stroke="#333" stroke-width="1.5"/>
  <line x1="300" y1="65" x2="300" y2="150" stroke="#333" stroke-width="1.5"/>
  <line x1="340" y1="65" x2="500" y2="150" stroke="#333" stroke-width="1.5"/>
  <!-- Parameter annotations -->
  <text x="135" y="105" font-size="10" fill="#1a73e8">target / isValid</text>
  <text x="310" y="110" font-size="10" fill="#1a73e8">target, inventory /</text>
  <text x="310" y="122" font-size="10" fill="#1a73e8">found, index</text>
  <text x="450" y="105" font-size="10" fill="#1a73e8">found, index</text>
</svg>`),[
  ps('Refer to the Stimulus.<br><br>Write a possible pseudocode algorithm for the FindItem routine based on the structure chart. (5 marks)',5,
`BEGIN FindItem(target, inventory)
    Set isValid = ValidateTarget(target)
    IF isValid = True THEN
        Set found, index = SearchInventory(target, inventory)
        DisplayOutcome(found, index)
    ELSE
        Display "Invalid search item entered."
    ENDIF
END FindItem`,
    [
      '1 mark: Correct routine header FindItem(target, inventory) and parameter passing.',
      '1 mark: Calls ValidateTarget(target) and receives isValid status.',
      '1 mark: Uses conditional selection to branch based on isValid.',
      '1 mark: Calls SearchInventory(target, inventory) and captures found and index parameters.',
      '1 mark: Calls DisplayOutcome(found, index) when valid, with appropriate invalid error handling.'
    ])
],{two:true}));

/* Q31 (Sec 2 Q15): Programmed Data Backup and Version Control (4 marks) */
qs.push(Q(SEP,'',[
  tx('Discuss the role and importance of programmed data backup and version control when producing and implementing code. (4 marks)',4,140,
    'Programmed data backups and version control play complementary, critical roles in software development:\n• Programmed data backup automatically archives database states, configuration files, and user records on regular schedules (e.g. daily snapshots). This ensures disaster recovery, business continuity, and data integrity if hardware fails, ransomware strikes, or catastrophic data loss occurs.\n• Version control (e.g. Git) manages source code changes over time, recording commits, branching, and author attribution. This enables collaborative development without overwriting code, provides safe experimentation on feature branches, and allows instantaneous rollback to stable builds when bugs are introduced.\nTogether, backups protect operational state and user data, while version control preserves development history and code integrity, minimising downtime and financial risk.',
    [
      '4 marks: Thorough discussion detailing the roles of both programmed data backup and version control, clearly distinguishing their purposes and explaining their importance in code production and implementation.',
      '3 marks: Discusses both backups and version control with good detail, or focuses heavily on one with basic mention of the other.',
      '2 marks: Discusses either backup or version control with limited depth.',
      '1 mark: Minimal discussion of saving or backing up files.'
    ])
]));

/* Q32 (Sec 2 Q16): Wagile vs Agile (6 marks) */
qs.push(Q(SEP,'',[
  tx('Compare the Wagile and Agile software development approaches.<br><br>In your response:<br>&bull; Outline the key characteristics of each approach.<br>&bull; Discuss one advantage and one disadvantage of each.<br>&bull; Justify a project scenario where pure Agile would be more suitable than Wagile. (6 marks)',6,220,
    '• Characteristics:\nAgile is an iterative, flexible methodology where cross-functional teams work in short sprints to deliver incremental working software. It prioritises customer collaboration, daily communication, and adapting rapidly to changing requirements.\nWagile ("Waterfall-Agile hybrid") attempts to combine Waterfall and Agile by keeping upfront, rigid Waterfall planning, extensive documentation, and fixed milestones, while running development teams in sprint-like cycles with little actual authority to change requirements.\n\n• Advantages and Disadvantages:\nAgile Advantage: Highly responsive to shifting user requirements and emerging market needs, delivering rapid customer value.\nAgile Disadvantage: Scope creep and unpredictable final budgets/timelines due to lack of upfront fixed specifications.\nWagile Advantage: Provides management with perceived predictability, structured governance, and contractual compliance through upfront milestones.\nWagile Disadvantage: "Worst of both worlds" — retains the inflexibility and slow pivot times of Waterfall while sacrificing Agile\'s true adaptability and creating developer frustration.\n\n• Justified Scenario:\nPure Agile is far more suitable for developing a cutting-edge startup mobile social app where user preferences, competitive features, and monetization strategies are uncertain. In this scenario, requirements evolve rapidly based on weekly user analytics, making rigid upfront planning futile and requiring rapid, continuous feature pivots.',
    [
      '6 marks: Comprehensive comparison covering key characteristics of both Agile and Wagile, one distinct advantage and disadvantage for each, and a well-justified project scenario showing why pure Agile is superior.',
      '5 marks: Covers all required points with minor brevity in one explanation.',
      '3-4 marks: Outlines Agile and Wagile with some advantages/disadvantages, but lacks a well-justified scenario or conflates methodologies.',
      '1-2 marks: Basic descriptions of Agile or Waterfall with minimal comparison.'
    ])
]));

BANKS.push({
  id: '12',
  name: 'IT 2025 Trial',
  sub: 'Independent Trial Examination 2025 · 32 questions · 80 marks',
  trial: true,
  questions: 32,
  credit: 'Independent Trial Examination 2025 (IT 2025), Software Engineering. Converted to the online exam format question for question.',
  qs: qs
});
})();
