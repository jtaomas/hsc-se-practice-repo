'use strict';
// Reference text handed to the AI that analyses class answers, so it always judges against the syllabus.
// Condensed from NESA's Software Engineering 11-12 (2022) syllabus (Year 12 content, outcomes) and the
// HSC Software Engineering Course Specifications (depth of study). Source: NSW Education Standards Authority.
// Key word meanings are NESA's "Glossary of key words" (HSC student guide), shortened.

const OUTCOMES = [
  'SE-12-01 justifies methods used to plan, develop and engineer software solutions',
  'SE-12-02 applies structural elements to develop programming code',
  'SE-12-03 analyses how current hardware, software and emerging technologies influence the development of software engineering solutions',
  'SE-12-04 evaluates practices to safely and securely collect, use and store data',
  'SE-12-05 explains the social, ethical and legal implications of software engineering on the individual, society and the environment',
  'SE-12-06 justifies the selection and use of tools and resources to design, develop, manage and evaluate software',
  'SE-12-07 designs, develops and implements safe and secure programming solutions',
  'SE-12-08 tests and evaluates language structures to refine code',
  'SE-12-09 applies methods to manage and document the development of a software project'
];

const SYLLABUS = `HSC SOFTWARE ENGINEERING (NESA 2022 syllabus). Year 12 outcomes:
${OUTCOMES.join('\n')}

FOCUS AREA: SECURE SOFTWARE ARCHITECTURE
- Benefits of secure software: data protection, fewer attacks and vulnerabilities. Development steps: requirements definition, specifications, design, development, integration, testing and debugging, installation, maintenance. End-user capability and experience shape secure design.
- Security concepts: confidentiality, integrity, availability, authentication, authorisation, accountability. Security features: data protection, security, privacy, regulatory compliance.
- Security by design: cryptography and sandboxing. Privacy by design: proactive not reactive, embed privacy into design, respect for user privacy.
- Resilience: find vulnerabilities, harden systems, handle breaches, business continuity, disaster recovery.
- Strategies: code review, SAST, DAST, vulnerability assessment, penetration testing.
- Defensive input handling (validation, sanitisation, error handling); safe APIs; efficient execution (memory, session, exception management).
- User action controls: broken authentication and session management, XSS, CSRF, invalid forwarding and redirecting, race conditions. File attacks and side-channel attacks.
- Impact: benefits of collaboration (various points of view, delegating by expertise, solution quality); benefits to an enterprise (better products or services, influence on future development, work practices, productivity, business interactivity); social, ethical and legal issues (employment, data security, privacy, copyright, intellectual property, digital disruption).

FOCUS AREA: PROGRAMMING FOR THE WEB
- Data transmission: interactive websites, e-commerce, progressive web apps (PWAs); data packets, IP addresses (IPv4), DNS; web protocols and ports (HTTP, HTTPS, TCP/IP, DNS, FTP, SFTP, SSL, TLS, SMTP, POP3, IMAP).
- Securing the web: SSL certificates, encryption algorithms and keys, plain text and cipher text, authentication and authorisation, hash values, digital signatures. Big data effects: data mining, metadata, streaming.
- W3C role: Web Accessibility Initiative, internationalisation, web security, privacy, machine-readable data.
- Web development system: client-side (front-end), server-side (back-end), SQL and non-SQL databases. Browser influence and dev tools. CSS: consistency of appearance, flexibility across browsers and devices, maintenance tools. Version control. Code libraries: frameworks, template engines, predesigned CSS classes. Open-source software. Page load times. CMS.
- Back-end: role of web server software, web framework, objects, libraries, databases; managing a web request. SQL: select fields, GROUP BY, WHERE, table joins; ORM compared with SQL. Front-end/back-end collaboration. PWA design: UI and UX principles (font, colour, audio, video, navigation), accessibility and inclusivity.

FOCUS AREA: SOFTWARE AUTOMATION
- Machine learning (ML) supports automation through DevOps, robotic process automation (RPA), business process automation (BPA). Distinguish AI from ML. Training models: supervised, unsupervised, semi-supervised, reinforcement. Applications: data analysis and forecasting, virtual personal assistants, image recognition. Design models: decision trees, neural networks. Algorithms: linear regression, logistic regression, K-nearest neighbour.
- Programming for automation: regression models (linear, polynomial, logistic) to predict numeric values; neural networks to make predictions.
- Impact of ML and AI: safety of workers, people with disability, employment skills, production efficiency and waste, economy and wealth distribution; human behaviour patterns influence ML and AI; human and dataset source bias.

FOCUS AREA: SOFTWARE ENGINEERING PROJECT
- Identifying and defining: define and analyse requirements (need or opportunity, scheduling and financial feasibility, functionality and performance, data structures and types, boundaries); idea tools (brainstorming, mind-maps, storyboards, data dictionaries, algorithm design); implementation methods: direct, phased, parallel, pilot.
- Research and planning: Waterfall, Agile and WAgile (hybrid) approaches (advantages, disadvantages, scale and type of project); project management with Gantt charts and collaboration tools; social and ethical issues of project work; communication issues (involve and empower the client, enable feedback, negotiate); quality assurance (define quality criteria, continual checking that requirements are met, compliance and legislation); modelling tools; contribution of back-end engineering (technology, error handling, interfacing with front end, security engineering).
- Producing and implementing: construct a solution, present it, document algorithms, allocate resources, programmed data backup, version control, strategies for difficulties (search online, collaborate with peers, outsource), propose an innovative additional solution with prototype and UI design.
- Testing and evaluating: test and evaluate code, code optimisation, analyse and respond to feedback, evaluate effectiveness (report to synthesise feedback, test plan, path and boundary test data, compare actual with expected output).

COURSE SPECIFICATIONS (depth of study)
- Modelling tools: data flow diagrams (process circles, data stores, external entities, labelled data flows; Level 0 overview), structure charts (subroutines, data and flag parameters, decision diamond, repetition, refinement), data dictionaries (name, type, display format, size in bytes, display size, description, example, validation), class diagrams (classes, attributes, methods, relationships, inheritance), storyboards, decision trees. Project tools: Gantt charts (tasks, durations, dependencies, milestones, resources, actual v estimated), process diaries/log books (date, person, progress, tasks achieved, issues and how managed, next approaches, reflection, resources).
- Paradigms: object-oriented (classes, objects, attributes, methods, inheritance, polymorphism, encapsulation, message passing), logic (facts, rules), imperative (control structures, assignment, expressions, subroutines), functional (functions, recursion, first-class functions).
- Algorithms: pseudocode (capitalised keywords, paired structure such as IF/ENDIF, indentation, refinement) and flowcharts; sequence, binary and multi-way selection (CASEWHERE, nested IF), repetition (WHILE pre-test, REPEAT UNTIL post-test, FOR/NEXT); subroutines with parameters; functions that RETURN a value.
- Relational databases: SQL with SELECT, FROM, WHERE, GROUP BY, ORDER BY, AS; relational and logical operators; SUM, AVG, COUNT, MAX, MIN; ASC and DESC. ORM maps rows to objects and columns to properties.
- Web: front-end frameworks (why they are useful, no specific framework required); XSS is injecting malicious code through unsanitised input; CSS syntax of selector, property, value.
- Machine learning: three MLOps stages - design (business problem, ML problem, success metrics, available data), model development (data wrangling, feature engineering, training, testing and validation), operations (deployment, supporting use, monitoring performance). Linear and polynomial regression predict continuous values; logistic regression is for classification. Neural networks: nodes with weightings and thresholds, training cycle then execution cycle.
- Testing methods: functional, acceptance, live data, simulated data, beta, volume. Character representation: ASCII and Unicode. Python: control structures, global and local variables, simple and structured data types, classes and objects, functions, modules and libraries, file handling.
Students are NOT expected to name a specific framework, library or niche technology. Mentioning one correctly is fine and is not penalised, but it is never required for full marks.`;

// NESA glossary of key words (shortened). Order matters: more specific phrases come first.
const KEYWORDS = [
  ['critically analyse', 'Use interpretation and reasoning to assess a range of evidence and make judgements based on detailed analysis.'],
  ['critically evaluate', 'Evaluate with added accuracy, knowledge and understanding, logic, questioning, reflection and quality.'],
  ['give an account of', 'Narrate a series of events or transactions.'],
  ['account for', 'State reasons for, report on.'],
  ['analyse', 'Identify components and the relationship between them; draw out and relate implications.'],
  ['apply', 'Use in a different, new or unfamiliar situation.'],
  ['appreciate', 'Make a judgement about the value of.'],
  ['assess', 'Make a judgement of value, quality, outcomes, results or size.'],
  ['calculate', 'Ascertain or determine from given facts, figures or information.'],
  ['clarify', 'Make clear or plain.'],
  ['classify', 'Arrange or include in classes or categories.'],
  ['compare', 'Show how things are similar or different.'],
  ['construct', 'Make, build, put together items or arguments.'],
  ['contrast', 'Show how things are different or opposite.'],
  ['deduce', 'Draw conclusions.'],
  ['define', 'State meaning and identify essential qualities.'],
  ['demonstrate', 'Show by example.'],
  ['describe', 'Provide characteristics and features.'],
  ['discuss', 'Identify issues and provide points for and/or against.'],
  ['distinguish', 'Recognise or note as being distinct or different; note differences between.'],
  ['evaluate', 'Make a judgement based on criteria; determine the value of.'],
  ['examine', 'Inquire into.'],
  ['explain', 'Relate cause and effect; make the relationships between things evident; provide why and/or how.'],
  ['extract', 'Choose relevant and/or appropriate details.'],
  ['extrapolate', 'Infer from what is known.'],
  ['identify', 'Recognise and name.'],
  ['interpret', 'Draw meaning from.'],
  ['investigate', 'Plan, inquire into and draw conclusions about.'],
  ['justify', 'Support an argument or conclusion.'],
  ['outline', 'Sketch in general terms; indicate the main features of.'],
  ['predict', 'Suggest what may happen based on available information.'],
  ['propose', 'Put forward (a point of view, idea, argument, suggestion) for consideration or action.'],
  ['recall', 'Present remembered ideas, facts or experiences.'],
  ['recommend', 'Provide reasons in favour.'],
  ['recount', 'Retell a series of events.'],
  ['summarise', 'Express concisely the relevant details.'],
  ['synthesise', 'Put together various elements to make a whole.']
];

// The directing word of a question is normally its first key word. Word boundaries stop "explain" matching inside other words.
function keywordFor(text) {
  const lower = ' ' + String(text || '').toLowerCase().replace(/[^a-z ]+/g, ' ') + ' ';
  let best = null;
  for (const [word, meaning] of KEYWORDS) {
    const at = lower.indexOf(' ' + word + ' ');
    if (at >= 0 && (!best || at < best.at || (at === best.at && word.length > best.word.length))) best = { word, meaning, at };
  }
  return best ? { word: best.word, meaning: best.meaning } : null;
}

module.exports = { SYLLABUS, KEYWORDS, OUTCOMES, keywordFor };
