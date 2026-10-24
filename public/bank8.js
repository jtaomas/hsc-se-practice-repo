/* PEM 2026 Trial HSC Examination, Software Engineering.
   Converted question for question from the published paper (supplied copyright free for educational use).
   Official answers for the closed questions are below; criteria and sample answers for written
   parts are in public/marking/pem2026.js. Question 32 (ii) is the one question refactored into a
   drag-the-pseudocode-steps arrangement (od). */
(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var M=MARKING.pem2026.entries;
/* written part: marks, word limit, key into the marking area */
function wr(q,m,w,key){return tx(q,m,w,M[key].sample,critOf(M[key]))}
var qs=[];

/* ---------- Section I: Questions 1 to 14, choose the best answer ---------- */
qs.push(Q(PW,'',[mc('What is the primary purpose of SQL?',['Creating objects in programming languages','Designing user interfaces','Mapping classes to tables','Querying and managing relational databases'],3,'SQL is the language used to query and manage relational databases.')]));
qs.push(Q(SEP,'An organization is upgrading its payroll system and wants to minimize risk during the transition. They decide to run the new system alongside the old system for a period, comparing outputs before fully switching over.',[mc('Which system implementation method are they using?',['Direct Installation','Parallel Installation','Phased Installation','Pilot Installation'],1,'Running the old and new systems side by side and comparing outputs is parallel installation.')]));
qs.push(Q(SA,'A telecom company wants to predict whether a customer will leave the service based on features like monthly charges, contract type, and customer tenure.',[mc('Which machine learning algorithm is most suitable for this task?',['Linear Regression','Logistic Regression','Decision Tree','K-Means Clustering'],1,'Predicting a yes/no outcome (leave or stay) is a classification task, and logistic regression suits it.')]));
qs.push(Q(PW,'',[mc('What is a key contribution of back-end web development to a web application?',['Creating page layouts','Designing logos and graphics','Managing data and server-side functionality','Styling buttons and fonts'],2,'The back end manages data and the functionality that runs on the server.')]));
qs.push(Q(PW,'',[mc('Which of the following best describes the primary purpose of the Domain Name System (DNS)?',['It translates IP addresses into MAC addresses','It converts domain names into IP addresses','It encrypts data for secure transmission','It manages email delivery between servers'],1,'DNS converts human-readable domain names into IP addresses.')]));
qs.push(Q(SEP,'',[mc('Why is stakeholder feedback essential when evaluating software effectiveness?',['It removes the need for testing','It ensures documentation accuracy','It helps compare actual system behaviour with user expectations','It reduces development costs directly'],2,'Feedback shows how the system actually behaves compared with what users expect.')]));
qs.push(Q(SEP,'',[mc('Which testing type MOST effectively detects defects within individual functions before integration?',['System testing','Integration testing','Unit testing','Acceptance testing'],2,'Unit testing checks individual functions on their own.')]));
qs.push(Q(SEP,'',[mc('What is ORM mainly used for?',['Writing raw SQL queries','Managing file systems','Interacting with databases using objects in code','Designing website layouts'],2,'An object-relational mapper lets code work with a database through objects.')]));
qs.push(Q(SEP,'A mid-sized software company needs to develop a new mobile application quickly, but its internal team lacks expertise in mobile development and is already overloaded with other projects. The company wants to reduce development time and cost.',[mc('Which software development approach should the company choose?',['In-house Development','Outsourcing','Prototyping','Parallel Installation'],1,'Outsourcing brings in outside expertise and capacity to save time and cost.')]));
qs.push(Q(PW,'',[mc('Which SQL statement is used to retrieve all columns from the Customers table where the Country is \'Australia\'?',['SELECT * FROM Customers WHERE Country = \'Australia\';','GET * FROM Customers WHERE Country = \'Australia\';','FETCH ALL FROM Customers WHERE Country = \'Australia\';','SELECT ALL Customers WHERE Country = \'Australia\';'],0,'SELECT * FROM table WHERE condition is the valid SQL form.')]));
qs.push(Q(SA,'',[mc('Why might reinforcement learning outperform supervised learning in autonomous driving systems?',['It requires no data','It learns optimal decisions through continuous interaction with the environment.','It guarantees perfect accuracy','It eliminates ethical concerns'],1,'Reinforcement learning improves by interacting with the environment and receiving feedback.')]));
qs.push(Q(SEP,'A project team decides to delay implementing several features due to time constraints.',[mc('Which type of requirement would MOST appropriately be postponed?',['Authentication system','Database connectivity','Error handling','Optional user personalisation features'],3,'Optional features are the least essential and are the safest to postpone.')]));
qs.push(Q(PW,'',[mc('Which Big Data “V” MOST directly drives the need for real‑time processing architectures?',['Variety','Veracity','Velocity','Volume'],2,'Velocity is the speed at which data arrives, which drives real-time processing.')]));
qs.push(Q(PW,'',[mc('If packets arrive out of order at the destination, which protocol ensures they are rearranged correctly?',['DNS','HTTP','IP','TCP'],3,'TCP numbers packets and reassembles them in the correct order.')]));

/* ---------- Questions 15 and 16 ---------- */
qs.push(Q(PW,'',[tk('Tick the boxes that correctly describe features of each protocol.',['Feature','FTP','HTTP'],[
 ['Used to transfer web pages between a browser and a server',[1]],
 ['Commonly used for uploading and downloading files',[0]],
 ['Uses port 80 by default',[1]],
 ['Transfers data in plain text by default',[0]]],3,'HTTP carries web pages and uses port 80 by default. FTP is used to upload and download files. The official key lists plain-text transfer under FTP.')]));
qs.push(Q(SA,'',[ms('Which of the following statements correctly describe how machine learning supports automation in modern software systems?<br>Select all that apply.',[
 'Machine learning systems can improve performance over time by learning from new data',
 'Machine learning replaces the need for human oversight in all automated systems',
 'Machine learning can help optimise decision-making in areas such as fraud detection and recommendations',
 'Machine learning automation always guarantees unbiased and accurate outcomes',
 'Machine learning enables automation systems to adapt to changing patterns rather than relying only on fixed rules',
 'Machine learning can function effectively without access to data'],[0,2,4],3,'A, C and E describe real benefits. B, D and F overstate what machine learning can do.')]));

/* ---------- Section II: Questions 17 to 33 ---------- */
qs.push(Q(SA,'',[wr('Outline one difference between AI and ML (2 marks)',2,50,'17')]));
qs.push(Q(SSA,'',[wr('Outline one benefit of data protection (2 marks)',2,50,'18')]));
qs.push(Q(SEP,'',[wr('Discuss any ONE issue related to communication in Project Management (3 marks)',3,75,'19')]));
qs.push(Q(PW,'A small food delivery business operating in a semi‑urban area wants to offer customers a convenient way to view restaurant offerings, submit orders, and monitor delivery progress. A large portion of its customer base experiences inconsistent internet access and uses devices with limited storage capacity. The business is working with a restricted budget and limited technical resources, making the development and long‑term maintenance of multiple platform‑specific applications impractical.',[
 wr('Justify the use of a PWA for the above scenario by clearly outlining at least three benefits of using a PWA. (3 marks)',3,75,'20')],{two:true}));
qs.push(Q(SSA,'',[wr('Compare and contrast SAST and DAST. (3 marks)',3,75,'21')]));
qs.push(Q(SA,'',[wr('Discuss ONE ethical issue associated with automated systems using machine learning. (3 marks)',3,75,'22')]));
qs.push(Q(SA,'A large online retail company is experiencing rapid growth. As the number of customers increases, the company is struggling to keep up with frequent software updates, high support workloads, and complex internal business processes such as order processing, inventory management, and customer service requests.<p>To address these challenges, the company decides to automate some of these process. DevOps, RPA and BPA are some of the strategies considered by the company.</p>',[
 wr('Describe how machine learning supports automation within any ONE of these automation processes. (3 marks)',3,75,'23')],{two:true}));
qs.push(Q(SSA,'',[wr('Explain the key features of privacy by design that would assist in securing any software solution. (3 marks)',3,75,'24')]));
qs.push(Q(SA,'',[wr('Compare supervised learning and unsupervised learning in software automation, providing one scenario/example of where each of them could be used. (3 marks)',3,75,'25')]));
qs.push(Q(SSA,'',[wr('Explain the purpose of session management in web applications. (3 marks)',3,75,'26')]));
qs.push(Q(SEP,'A community organisation is developing a digital platform to help members register for events, receive updates, and access resources. While the initial goals of the platform are clear, the organisation expects its needs to change over time as member feedback is collected and new services are introduced. Stakeholders would like to see usable features early, even if the system is not fully complete, so they can evaluate how well the platform meets user expectations. Regular input from users is important, as many members have differing accessibility needs and preferences that may not be fully understood at the start of the project.',[
 P('(i)',wr('Which software development approach is most suitable for this scenario? (1 mark)',1,15,'27i')),
 P('(ii)',wr('Justify your choice, referring to the scenario in your answer. (3 marks)',3,75,'27ii'))],{two:true}));
qs.push(Q(SSA,'',[
 P('(i)',wr('Describe ‘Sandboxing’ concept in Secure Software Architecture. (3 marks)',3,75,'28i')),
 P('(ii)',wr('Provide an example where sandboxing can be used to avoid security issues. (2 marks)',2,50,'28ii'))]));
qs.push(Q(SEP,'',[wr('Describe the role of testing in ensuring software quality. (3 marks)',3,75,'29')]));
qs.push(Q(SEP,'',[ft('Complete the data dictionary below for a food delivery system. Variable names should be relevant to the food delivery system. (3 marks)',3,
 ['Variable Name','Data Type','Size / Format','Description','Example Value'],[
  ['user_id',null,'50 chars',null,'1045'],
  [null,'str','50 chars','Customer’s full name','Alex Morgan'],
  ['email','str','100 chars',null,'alex@email.com'],
  ['restaurant_id','int','50 chars','Unique identifier for each restaurant','22'],
  ['product_name',null,'80 chars','Name of the food item','Chicken Burger'],
  ['price',null,'decimal','Cost of the menu item','14.50'],
  ['order_id','int','50 chars','Unique identifier for each order','9008'],
  ['order_status',null,'20 chars','Current delivery status of the order','Delivered']],
 [['user_id','int','50 chars','Customer identifier number','1045'],
  ['customer_fullname','str','50 chars','Customer’s full name','Alex Morgan'],
  ['email','str','100 chars','Customer’s email address','alex@email.com'],
  ['restaurant_id','int','50 chars','Unique identifier for each restaurant','22'],
  ['product_name','str','80 chars','Name of the food item','Chicken Burger'],
  ['price','float','decimal','Cost of the menu item','14.50'],
  ['order_id','int','50 chars','Unique identifier for each order','9008'],
  ['order_status','str','20 chars','Current delivery status of the order','Delivered']],
 critOf(M['30']),{widths:['18%','12%','14%','36%','20%']})]));
qs.push(Q(SA,'',[wr('Discuss “overfitting” in Machine Learning, citing one example. (3 marks)',3,75,'31')]));
qs.push(Q(SEP,'A local food delivery business operates in a busy suburban area and partners with several independent restaurants. Customers place orders through the business’s website, selecting multiple food items from a menu. Each item has a fixed price, and the system calculates the total cost of the order before payment.<p>To encourage larger orders, the business offers a 10% discount when the total order value exceeds $30.</p><p>The system must calculate the total, apply the discount where appropriate, and display a clear summary for both customers and staff.</p>',[
 P('(i)',py('A customer places an order containing several food items. The prices of the items are stored in the list below:<br><code>prices = [12.50, 8.00, 5.75]</code><br>Write a Python program that calculates and prints the total cost of the order. (2 marks)',2,'prices = [12.50, 8.00, 5.75]\n',M['32i'].sample,[],critOf(M['32i']))),
 P('(ii)',od('The business wants to automate order processing. (6 marks)<br>Write a Python function called <code>process_order()</code> that calculates the total cost of the order, applying a 10% discount if the total is greater than $30.<br>The function should take the following parameters: <code>customer_name</code>, and <code>prices</code>. It should return the final amount payable.<br>Other requirements:<br>&bull; Use meaningful variable names<br>&bull; Apply the discount only when the condition is met<br>&bull; Round the final cost to 2 decimal places<br>Output should be printed in the format below:<br><code>Customer: Alex</code><br><code>Final cost: $27.45</code><br><br>Place the steps of the function in the correct order by dragging the pseudocode steps into position.',`
# BEGIN process_order(customer_name, prices)
    Set total = SUM(prices)
    IF total > 30 THEN
        Set total = total * 0.9
    ENDIF
    Set final_cost = ROUND(total, 2)
    Display "Customer: ", customer_name
    Display "Final cost: $", final_cost
    RETURN final_cost
# END process_order`,6,{extra:['IF total < 30 THEN','Set total = total * 0.1','Set final_cost = total + 30'],why:'The total is calculated first. The discount is applied only inside the IF, which is closed by ENDIF. The result is then rounded, the two lines of output are displayed in the required format, and the final amount is returned.'}))],{two:true}));
qs.push(Q(SA,'A large logistics company uses machine learning to automate several parts of its operations. ML systems are used to predict delivery times, detect fraudulent transactions, and optimise warehouse workflows. As the system improves through learning from data, fewer manual checks are required by employees.<p>Some workers are concerned that continued automation will reduce job opportunities, while others believe machine learning will create new roles that focus on managing, maintaining, and improving these intelligent systems.</p>',[
 wr('Discuss how the increasing use of machine learning in automation may impact the future of work.<br><br>In your answer, refer to the scenario and discuss both potential benefits and challenges for individuals and society. You may include your own informed opinion. (6 marks)',6,250,'33')],{two:true}));

BANKS.push({id:'8',name:'PEM 2026 Trial',sub:'PEM 2026 Trial HSC Examination',trial:true,questions:33,credit:'PEM 2026 Trial Higher School Certificate Examination, Software Engineering. Supplied copyright free for educational use. Converted to the online format question for question; Question 32 (ii) is shown as a drag-the-steps question.',qs:qs});
})();
