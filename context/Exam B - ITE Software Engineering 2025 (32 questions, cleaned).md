# Exam B: ITE Software Engineering 2025 (32 questions, cleaned)

Source: pasted from an online exam platform by the owner. Cleaned for AI context.

Conventions
- Text without a tag is from the original paper.
- `[GENERATED]` marks content the paste lost (answer options, tables, diagrams, charts, code). It fits the question and is not official.
- Numbering fix: the original restarted at "Question 1" in Section 2, so the paper had two Question 16s. Questions are now numbered 1-32 in order. Section 1 = Q1-16 (original Section 1 Q1-16). Section 2 = Q17-32 (original Section 2 Q1-16). The original number is shown in brackets.
- The paste said 20 marks for Section 1 and 25 minutes. Reading time 5 min 8 s. Section 2 marks are not stated.

---

## Section 1 (Total marks 20, attempt Questions 1-16, about 25 minutes)

### Question 1
The "Privacy by Design" approach is defined as:
- A. Features added after software is released to lock down stored data.
- B. Improvements to processing reliability made after a security breach.
- C. Modifications made following user feedback on interface inefficiencies.
- D. Building software with data protection measures integrated from the outset.

Answer: D.

### Question 2
A user logs into their bank's website, which allows money transfers via a button. A hacker sends the user a malicious email containing a link. When the user clicks the link, a money transfer request is executed without their knowledge.

What type of attack is this?
`[GENERATED]` options: A. Cross-site request forgery (CSRF), B. SQL injection, C. Brute force, D. Man-in-the-middle.

### Question 3
Email clients send mail using which protocol?
`[GENERATED]` options: A. SMTP, B. IMAP, C. POP3, D. FTP.

### Question 4
In the context of a web application, what is the main role of client-side programming?
`[GENERATED]` options
- A. Handling user interaction and updating the page in the browser.
- B. Storing and querying the central database.
- C. Managing server hardware.
- D. Encrypting data on disk.

### Question 5
What is the most effective approach to ensuring that automation benefits society as a whole?
`[GENERATED]` options
- A. Combining ethical design, transparent decision making, worker retraining and regulation.
- B. Automating every task as fast as possible.
- C. Keeping algorithms secret.
- D. Leaving it to market forces alone.

### Question 6
A real estate agency wants to build a model to predict whether a house is likely to be sold within 60 days based on features such as its price, location score, number of bedrooms, and age.

Based on the scenario above, which regression model is most appropriate, and why?
`[GENERATED]` options
- A. Logistic regression, because the outcome is a yes/no class.
- B. Linear regression, because the outcome is a continuous number.
- C. Polynomial regression, because there are many features.
- D. K-means, because the data has no labels.

### Question 7
A new software application is introduced by initially running the program with only a few of its modules active. After confirming that these modules function correctly, the remaining components are gradually activated.

What type of implementation method does this scenario describe?
`[GENERATED]` options: A. Phased, B. Direct, C. Parallel, D. Pilot.

### Question 8
Which of the following is true for the Agile Development Approach?
`[GENERATED]` options
- A. Work is done in short iterations with frequent customer feedback.
- B. All requirements are fixed before any coding starts.
- C. Testing occurs only at the end.
- D. Documentation is the main deliverable.

### Question 9
What are the benefits of using sandboxing in software development or deployment?
`[GENERATED]` options
- A. Code runs in an isolated environment, limiting the damage from bugs or malware.
- B. It makes code run faster.
- C. It removes the need for testing.
- D. It encrypts all network traffic.

### Question 10
Consider the following CSS code.

```css
body {
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
}
```

Refer to the Stimulus. Which of the following is true for pages styled using the CSS code?
`[GENERATED]` options
- A. Headings are red and centred, paragraphs are white on a blue background.
- B. Headings are green and left-aligned.
- C. Paragraphs are red in 16 px text.
- D. The page background is green.

Answer: A.

### Question 11
Which of the following impacts are likely to result from increased automation in the workplace?
`[GENERATED]` options
- A. Some roles removed, new technical roles created, and higher productivity.
- B. No change to jobs.
- C. All jobs become manual.
- D. Productivity falls and costs rise in every case.

### Question 12
The following context diagram describes a food ordering app.

Stimulus `[GENERATED]`: a context diagram with the central process "Food Ordering App". External entities and flows:
- Customer -> App: order details, payment details. App -> Customer: order confirmation, status.
- Restaurant -> App: menu updates. App -> Restaurant: new order.
- Payment Gateway -> App: payment approval. App -> Payment Gateway: payment request.
- App -> Delivery Driver: delivery job. Delivery Driver -> App: delivery status.

Refer to the Stimulus. Based on the diagram, which statements are correct?
`[GENERATED]` statements (select all that apply)
- The Customer sends order and payment details to the app. (correct)
- The Restaurant sends menu updates to the app. (correct)
- The app sends the delivery job to the Payment Gateway. (incorrect)
- The context diagram shows the internal data stores of the app. (incorrect)

### Question 13
Match each feature with its correct security testing strategy.

`[GENERATED]` matching lists
- Tries to break in by attacking a running system as an outsider -> Penetration testing
- Scans a system for known weaknesses and misconfigurations -> Vulnerability assessment
- Reads the source code without running it -> Static code analysis
- Runs the program with unexpected inputs to observe behaviour -> Dynamic analysis / fuzzing

### Question 14
Match each web development role with the W3C initiative or focus area to which it belongs.

`[GENERATED]` matching lists
- Front-end developer -> Web standards (HTML, CSS, JavaScript APIs)
- Accessibility specialist -> Web Accessibility Initiative (WCAG)
- Back-end developer -> Web services and protocols (HTTP, REST)
- Security engineer -> Web security and privacy guidelines

### Question 15
Match each application scenario to the most appropriate machine learning model.

`[GENERATED]` matching lists
- Predicting house price from size and location -> Linear regression
- Classifying an email as spam or not spam -> Logistic regression
- Grouping customers by buying behaviour with no labels -> K-means clustering
- Classifying a new point by its closest labelled neighbours -> K-Nearest Neighbours
- Recognising images -> Neural network

### Question 16
Match each task with the correct software project phase.

`[GENERATED]` matching lists
- Interviewing users about what they need -> Defining and understanding
- Drawing a data flow diagram -> Planning and design
- Writing the Python code -> Implementation
- Running test data against the program -> Testing and evaluation
- Fixing bugs reported after release -> Maintenance

---

## Section 2

### Question 17 (original Section 2 Q1)
Distinguish between authentication and authorisation.

### Question 18 (original Section 2 Q2)
The Python code below defines a function that allows a user to purchase an item.

```python
import threading
lock = threading.Lock()
def purchase_item(user_id, item_id):
    with lock:
        if inventory[item_id] > 0:
            inventory[item_id] -= 1
            confirm_purchase(user_id, item_id)
```

Refer to the Stimulus. Explain what a race condition is and how it could affect the `purchase_item` function if no lock was implemented.

### Question 19 (original Section 2 Q3)
A school's online portal allows students to upload assessment files. Recently, a student discovered that by modifying the URL, they could access and download other students' submitted files. It was also found that students could re-upload their work multiple times, overwriting previous submissions without detection even after the due date.

Refer to the Stimulus. Describe how confidentiality, accountability and integrity has been compromised in this scenario.

### Question 20 (original Section 2 Q4)
Discuss the benefits of collaboration in software engineering.

In your response:
- Highlight at least three key advantages that effective collaboration can bring to a software development project.
- Provide an example of a collaboration tool and explain how it facilitates collaboration among developers.

### Question 21 (original Section 2 Q5)
Outline the primary function performed by the Domain Name System (DNS).

### Question 22 (original Section 2 Q6)
Outline the functions performed by web content management systems. Include two examples of web content management systems to assist your response.

### Question 23 (original Section 2 Q7)
Secure encrypted communication between browsers and web servers utilises the https protocol which includes SSL/TLS certificates.

Refer to the Stimulus `[GENERATED]`: a sequence diagram of Browser and Web Server: ClientHello, ServerHello plus certificate, browser verifies certificate with a certificate authority, browser sends encrypted session key, both switch to encrypted data.

Outline the exchange between browser and web server to:
- Confirm the identity of the web server
- Establish a secure session
- Communicate securely during the session

### Question 24 (original Section 2 Q8)
You have been tasked with designing and developing a Progressive Web App (PWA) aimed at enhancing the accessibility and inclusivity of educational resources for infants school students.

Outline how you would address the following key design principles when creating the user interface (UI) and user experience (UX) of your PWA.
- Font selection and typography
- Colour schemes and contrast
- The use of audio and video elements
- Navigation design

### Question 25 (original Section 2 Q9)
Distinguish between supervised and unsupervised learning.

### Question 26 (original Section 2 Q10)
Explain how weights and backpropagation allow a neural network to learn using training data.

### Question 27 (original Section 2 Q11)
You have been asked to create a program that predicts student test scores based on the number of hours they studied.
- Identify the most appropriate machine learning regression algorithm for this task.
- Briefly outline how you would implement this using object oriented programming (OOP).
- List two features your model would require to function effectively.

### Question 28 (original Section 2 Q12)
The K-Nearest Neighbours (KNN) algorithm is used to classify a new data point by comparing it to existing classified/labelled data points. It calculates the Euclidean distance between the new data point (shown as a question mark on the chart below) and every other point in the training data. It then counts the labels of the k closest points. The most common label among these neighbours is the predicted label assigned to the new point.

Refer to the Stimulus. Chart `[GENERATED]`: scatter plot, x and y from 0 to 10. Four clusters: A near (2, 8), B near (8, 8), C near (2, 2), D near (8, 2). A question mark at (3, 7).

Sample training data `[GENERATED]`:

| Point | x | y | Label |
| --- | --- | --- | --- |
| 1 | 2 | 8 | A |
| 2 | 1 | 7 | A |
| 3 | 8 | 8 | B |
| 4 | 9 | 7 | B |
| 5 | 2 | 2 | C |
| 6 | 3 | 1 | C |
| 7 | 8 | 2 | D |
| 8 | 9 | 3 | D |

Write a pseudocode algorithm for a function called `knn`. It is passed:
- `newPoint`: the x and y coordinates of the point to classify as A, B, C or D
- `tData`: an array of x and y coordinates for all labelled points
- `tLabels`: an array of strings with the label A, B, C or D for each known point
- `k`: an integer

You may use the following pre-defined functions in your algorithm:
- `distance(p1, p2)`: returns the Euclidean distance between two (x, y) points
- `sort(pairlist)`: sorts an array of [distance, label] pairs in ascending order by distance
- `mode(array)`: returns the label that occurs most frequently in an array

Your algorithm should return the predicted label for the new data point.

### Question 29 (original Section 2 Q13)
How can Gantt charts assist project managers ensure project deadlines are met?

### Question 30 (original Section 2 Q14)
Refer to the Stimulus.

Stimulus `[GENERATED]`: structure chart. Top module `FindItem(list, target)` calls `GetInput` (returns target), `SearchList(list, target)` (returns position) and `DisplayResult(position)`. `SearchList` calls `CompareItem(item, target)` (returns match flag).

Write a possible pseudocode algorithm for the FindItem routine based on the structure chart.

### Question 31 (original Section 2 Q15)
Discuss the role and importance of programmed data backup and version control when producing and implementing code.

### Question 32 (original Section 2 Q16)
Compare the Wagile and Agile software development approaches.

In your response:
- Outline the key characteristics of each approach.
- Discuss one advantage and one disadvantage of each.
- Justify a project scenario where pure Agile would be more suitable than Wagile.
