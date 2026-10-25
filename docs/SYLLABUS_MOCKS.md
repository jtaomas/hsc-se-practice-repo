# Syllabus Mocks 1 to 5 (banks 14 to 18)

Five original full papers written on 25 October 2026. Together they cover every Year 12 content point in the NESA Software Engineering 11–12 Syllabus (2022). Each paper follows the layout of the 2025 HSC online exam: 27 questions and 80 marks, with Questions 1 to 14 short closed questions (16 marks), a 6-mark and a 9-mark multi-part question, pseudocode, Python, SQL and drawing questions, and 5- and 6-mark extended responses.

Scope rule used when writing: every question tests a Year 12 content point. Year 11 knowledge (pseudocode, Python, data types, data dictionaries, OOP, diagrams) appears only as the tools the Year 12 points are examined with, as it does in the 2025 HSC and the NESA sample paper. No question needs knowledge outside the syllabus to earn full marks, though better answers may draw on it. Mechatronics (Year 11 only) is not examined.

Written questions have sample answers and marking criteria for the AI marker. Every Python sample answer passes its tests and every SQL sample answer runs against its question's tables. Correct options are spread across positions A to D.

## Coverage map

M = Mock, Q = question. A point listed more than once is examined in more than one way.

### Secure Software Architecture

| Content point | Where |
|---|---|
| Benefits of secure software (data protection, fewer attacks and vulnerabilities) | M3 Q10, M4 Q25 |
| Development steps for secure code (requirements to maintenance) | M1 Q4, M4 Q12 |
| End users' capabilities and experience shape secure design | M2 Q18 |
| Confidentiality, integrity, availability, authentication, authorisation, accountability | M1 Q6, M1 Q23(c), M5 Q23(a), M5 Q23(c) |
| Security features for data protection, privacy and regulatory compliance | M5 Q23(b) |
| Cryptography and sandboxing in security by design | M1 Q18, M1 Q20 |
| Privacy by design (proactive, embedded, respect for privacy) | M4 Q6, M5 Q20 |
| Vulnerabilities, hardening, handling breaches, business continuity, disaster recovery | M3 Q4, M3 Q23 |
| Code review, SAST, DAST, vulnerability assessment, penetration testing | M2 Q13, M3 Q18 |
| Defensive input handling (validation, sanitisation, error handling) | M1 Q23(b), M3 Q19 |
| Safe API design | M1 Q23(a), M5 Q10 |
| Memory, session and exception management | M2 Q4, M3 Q19, M4 Q4, M4 Q18 |
| Broken authentication and sessions, XSS, CSRF, invalid redirects, race conditions | M2 Q8, M2 Q23, M3 Q6, M5 Q4 |
| File attacks and side-channel attacks | M1 Q10, M2 Q23(c), M4 Q19 |
| Benefits of collaboration (points of view, expertise, quality) | M5 Q6 |
| Benefits to an enterprise (products, future development, work practices, productivity, business interactivity) | M4 Q25 |
| Social, ethical and legal issues (employment, data security, privacy, copyright, IP, digital disruption) | M2 Q27, M5 Q27 |

### Programming for the Web

| Content point | Where |
|---|---|
| Applications: interactive sites, e-commerce, PWAs | M3 Q2, M1 Q16 |
| Data packets, IPv4 addresses, DNS | M1 Q5, M2 Q12, M4 Q2, M5 Q18 |
| Protocols and ports (HTTP/S, TCP/IP, DNS, FTP/SFTP, SSL/TLS, SMTP, POP3, IMAP) | M1 Q2, M2 Q2, M3 Q12, M5 Q2 |
| Securing the web (certificates, algorithms, keys, plain/cipher text, authentication, hashes, signatures) | M1 Q20, M3 Q5, M4 Q10, M5 Q23(a) |
| Big data: data mining, metadata, streaming service management | M1 Q11, M2 Q16(c) |
| W3C: WAI, internationalisation, security, privacy, machine-readable data | M1 Q8, M3 Q11, M3 Q20, M4 Q16(c), M5 Q16(b) |
| Front end, back end, SQL and non-SQL databases | M3 Q8, M5 Q5, M5 Q16(c) |
| Browsers and dev tools | M1 Q16(c) |
| CSS: consistency, flexibility, maintenance tools | M2 Q5, M3 Q16(a) |
| Version control | M3 Q16(c) |
| Frameworks, template engines, predesigned CSS classes | M2 Q9, M2 Q11, M4 Q16(b) |
| Open-source software | M5 Q8 |
| Managing load times | M2 Q16(b), M4 Q8 |
| Content management systems | M2 Q16(a) |
| Back-end process for a request (web server, framework, objects, libraries, database) and its contribution | M2 Q12, M3 Q16(b), M5 Q11, M5 Q25 |
| Shell scripting: make files and directories, search text in a file | M2 Q19, M4 Q26 |
| SQL: fields, GROUP BY, WHERE, joins | Q21 in every paper |
| ORM compared with SQL | M4 Q5 |
| Front-end and back-end collaboration | M4 Q16(a) |
| PWA design: font, colour, audio, video, navigation, accessibility | M1 Q16, M3 Q20, M5 Q16(a) |

### Software Automation

| Content point | Where |
|---|---|
| ML in DevOps, RPA and BPA | M4 Q7, M4 Q23(a) |
| AI compared with ML | M1 Q3 |
| Supervised, unsupervised, semi-supervised, reinforcement learning | M1 Q7, M2 Q7, M3 Q7, M4 Q3, M4 Q20 |
| Applications: forecasting, virtual assistants, image recognition | M1 Q12, M5 Q3 |
| Decision trees and neural networks | M2 Q20, M2 Q22, M3 Q13, M4 Q13, M5 Q7 |
| Linear regression, logistic regression, KNN | M1 Q25, M2 Q3, M3 Q3, M4 Q23(b)(c), M5 Q12 |
| Regression models in OOP (linear, polynomial, logistic) | M1 Q26, M3 Q26, M5 Q26 |
| Neural network model in OOP | M2 Q26 |
| Impact of automation (safety, disability, employment, environment, economy) | M1 Q27, M3 Q24, M4 Q27, M5 Q13 |
| Human behaviour (psychological responses, acute stress, cultural protocols, belief systems) | M2 Q24, M5 Q24 |
| Human and dataset source bias | M3 Q27 |

### Software Engineering Project

| Content point | Where |
|---|---|
| Needs and opportunities, feasibility, functional and performance requirements, data types and structures, boundaries | M5 Q9, M1 Q13, M4 Q15(a), M1 Q15(a), M5 Q15(a) |
| Idea tools: brainstorming, mind maps, storyboards, data dictionaries, code generation | M2 Q6, M3 Q22, M1 Q15(a), M4 Q11 |
| Implementation methods | M1 Q1, M4 Q1, M4 Q15(b) |
| Waterfall, Agile, WAgile (stages, tailoring, iterations, hybrid timing, scale) | M1 Q9, M1 Q15(b), M2 Q1, M3 Q1, M5 Q1 |
| Project management: Gantt charts, tracking software, collaboration tools | M2 Q25 |
| Social and ethical issues of project work; communication with clients | M2 Q10, M3 Q25 |
| Quality assurance | M1 Q24 |
| Modelling tools | Q22 in every paper (structure chart, decision tree, storyboard, Level 1 DFD, class diagram) |
| Back-end engineering (technology, error handling, front-end interface, security) | M5 Q25 |
| Algorithms and desk checking | Q14 and Q17 in every paper |
| Presentation, resource allocation, responding to difficulties | M4 Q9, M3 Q9, M2 Q10 |
| Programmed data backup and version control | M4 Q26, M3 Q16(c) |
| Prototype and UI design for an innovative solution | M5 Q15(b) |
| Test methodologies, path and boundary data, actual versus expected output | M2 Q15, M3 Q15 |
| Language-dependent optimisation | M5 Q19 |
| Analysing feedback and reporting | M4 Q24 |

## Marks by focus area

| Paper | SSA | Web | Automation | Project |
|---|---|---|---|---|
| Mock 1 | 15 | 20 | 20 | 25 |
| Mock 2 | 22 | 22 | 18 | 18 |
| Mock 3 | 18 | 22 | 20 | 20 |
| Mock 4 | 15 | 22 | 22 | 21 |
| Mock 5 | 21 | 20 | 16 | 23 |
| Total | 91 | 106 | 96 | 107 |
