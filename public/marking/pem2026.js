/* PEM 2026 Trial HSC Examination: marking criteria, sample answers and mapping grid.
   Source: marking/source/pem2026-marking-criteria.pdf (PEM, supplied copyright free for educational use).
   Entry shape:  key: { kind:'bands'|'additive', bands:[[marks, descriptor], ...], sample:'...', note:'...' }
     bands      one band is awarded (holistic).   additive   the marks are added up.
   Keys are the question number, with i/ii for parts (27i, 32ii ...).
   Questions 1 to 16 are marked in the browser and keep their answers in public/bank8.js;
   `closed` lists the official keys for reference. */
MARKING.pem2026={
  closed:{
    '1':'D','2':'B','3':'B','4':'C','5':'B','6':'C','7':'C','8':'C','9':'B','10':'A','11':'B','12':'D','13':'C','14':'D',
    '15':'Used to transfer web pages between a browser and a server: HTTP. Commonly used for uploading and downloading files: FTP. Uses port 80 by default: HTTP. Transfers data in plain text by default: FTP (as printed in the official key; HTTP without TLS is also plain text).',
    '16':'A, C, E'
  },
  entries:{
    '17':{kind:'bands',bands:[[2,'Clearly outlines a valid difference between AI and ML using correct terminology'],[1,'Identifies a difference but lacks clarity or accuracy']],
      sample:'Artificial Intelligence is a broad field focused on creating systems that perform tasks requiring human intelligence, while machine learning is a subset of AI that allows systems to learn patterns from data and improve performance without being explicitly programmed.'},
    '18':{kind:'bands',bands:[[2,'Identifies and explains a valid benefit of data protection'],[1,'Identifies a benefit with limited explanation']],
      sample:'Data protection prevents unauthorised access to sensitive information, reducing the risk of data breaches and protecting user privacy.'},
    '19':{kind:'bands',bands:[[3,'Explains a communication issue and clearly discusses its impact on a project'],[2,'Identifies a relevant issue with some explanation'],[1,'Identifies an issue with minimal explanation']],
      sample:'Poor communication can cause misunderstandings about project requirements. If stakeholders are not regularly consulted, the final product may fail to meet user expectations, leading to rework and increased costs.'},
    '20':{kind:'bands',bands:[[3,'Clearly justifies PWA use with three relevant benefits linked to the scenario'],[2,'Provides two relevant benefits linked to the scenario'],[1,'Provides one relevant benefit']],
      sample:'A PWA is suitable because it works offline, reducing issues caused by unreliable internet. It requires less storage than native apps and works across multiple platforms, making it cost-effective for a business with limited resources.'},
    '21':{kind:'bands',bands:[[3,'Accurately compares both SAST and DAST, clearly identifying differences'],[2,'Describes both techniques with limited comparison'],[1,'Describes one technique or provides minimal comparison']],
      sample:'SAST tests the source code without running the application and identifies vulnerabilities early in development. DAST tests an application while running and identifies security vulnerabilities at runtime.'},
    '22':{kind:'bands',bands:[[3,'Clearly explains an ethical issue and its implications'],[2,'Identifies an ethical issue with some explanation'],[1,'Identifies an ethical issue with minimal explanation']],
      sample:'Bias in training data can result in unfair decisions by automated systems. If historical data contains discrimination, the model may reinforce inequality, reducing trust and fairness.'},
    '23':{kind:'bands',bands:[[3,'Clearly describes how ML supports automation and explains its benefits'],[2,'Identifies ML use with some explanation'],[1,'Identifies ML use with minimal explanation']],
      sample:'(DevOps example) ML supports DevOps by predicting system failures through monitoring data. This allows issues to be fixed proactively, improving reliability and reducing downtime.',
      note:'The student may choose any ONE of DevOps, RPA or BPA.'},
    '24':{kind:'bands',bands:[[3,'Explains multiple key features of Privacy by Design relevant to software security'],[2,'Explains one or two features with limited detail'],[1,'Identifies Privacy by Design with minimal explanation']],
      sample:'Privacy by Design ensures data protection is built into systems from the start. Key features include data minimisation, secure defaults, and encryption, reducing privacy risks.'},
    '25':{kind:'bands',bands:[[3,'Accurately compares both learning types and provides relevant examples'],[2,'Compares learning types with limited explanation or examples'],[1,'Identifies a difference without clear examples']],
      sample:'Supervised learning uses labelled data, such as spam detection. Unsupervised learning finds patterns in unlabelled data, such as customer segmentation.'},
    '26':{kind:'bands',bands:[[3,'Clearly explains the purpose of session management with reference to security and user state'],[2,'Explains session management with limited detail'],[1,'Minimal understanding demonstrated']],
      sample:'Session management maintains user state across requests, improves security by authenticating users, and prevents unauthorised access.'},
    '27i':{kind:'additive',bands:[[1,'Correctly identifies Agile (or an appropriate iterative approach)']],
      sample:'Agile development'},
    '27ii':{kind:'bands',bands:[[3,'Justifies approach using clear references to scenario requirements'],[2,'Provides general justification with limited scenario link'],[1,'Minimal justification provided']],
      sample:'Agile allows features to be delivered early and refined based on feedback, which suits a project with evolving requirements and user needs.'},
    '28i':{kind:'bands',bands:[[3,'Accurately describes sandboxing in secure software architecture'],[2,'Describes sandboxing with limited accuracy'],[1,'Minimal description']],
      sample:'Sandboxing isolates code execution in a controlled environment to prevent access to critical system resources.'},
    '28ii':{kind:'bands',bands:[[2,'Gives a realistic example where sandboxing avoids a security issue and explains how the isolation contains the risk'],[1,'Gives an example with limited or no explanation of how sandboxing helps']],
      sample:'It is used to safely run untrusted code, such as user-uploaded scripts, reducing security risks.',
      note:'The official criteria give one 3-mark table for Question 28 and one sample answer that covers both parts. These two bands for part (ii) were written to fit that sample answer and the 2 marks printed on the paper. Replace them if the school supplies its own.'},
    '29':{kind:'bands',bands:[[3,'Clearly explains testing’s role in quality, reliability, and defect detection'],[2,'Explains testing with limited detail'],[1,'Minimal understanding demonstrated']],
      sample:'Testing identifies defects early, ensures requirements are met, and improves reliability by preventing failures in production.'},
    '30':{kind:'additive',bands:[[1,'Completes the data types correctly (user_id, product_name, price, order_status)'],[1,'Supplies a relevant variable name for the customer’s full name and relevant descriptions for user_id and email'],[1,'Names, types and descriptions all suit the food delivery system and the example values']],
      sample:'user_id: int, Customer identifier number. customer_fullname: str. email: Customer’s email address. product_name: str. price: float. order_status: str.',
      official:'The official answer page lists only: user_id int, "Customer identifier number"; Customer_fullname; product_name Str; price int; order_status boolean. It leaves email’s description out.',
      note:'The official answer page has no marking table for Question 30; the three additive criteria above are derived from the 3 marks on the paper. The official key gives price as int and order_status as boolean, which do not fit the example values 14.50 and "Delivered" (size 20 chars). The sample rows use float and str. A marker should accept either where the data type is defensible for the example value shown.'},
    '31':{kind:'bands',bands:[[3,'Clearly explains overfitting and provides a relevant example'],[2,'Explains overfitting but example is weak or unclear'],[1,'Minimal explanation or example']],
      sample:'Overfitting occurs when a model learns training data too well and performs poorly on new data, such as a fraud model trained on outdated patterns.'},
    '32i':{kind:'bands',bands:[[2,'Correct Python statement producing correct output'],[1,'Minor syntax or logic error']],
      sample:'print(sum(prices))'},
    '32ii':{kind:'additive',bands:[[1,'Correct function definition and parameters'],[2,'Correct total calculation'],[1,'Discount condition correctly implemented'],[1,'Output formatted correctly'],[1,'Code readable and meets all requirements']],
      sample:'def process_order(customer_name, prices):\n    total = sum(prices)\n    if total > 30:\n        total *= 0.9\n    total = round(total, 2)\n    print(f"Customer: {customer_name}")\n    print(f"Final cost: ${total}")\n    return total',
      note:'REFACTORED. On the website this part is a drag-the-steps question (od format) instead of typed Python, worth the same 6 marks. The browser marks it automatically: the correct arrangement is in bank8.js. The criteria and sample here are the official ones for the original written question, kept for the marking developer in case the typed version is wanted back.'},
    '33':{kind:'bands',bands:[['5–6','Sustained, well-reasoned discussion addressing benefits and challenges, linked to scenario'],['3–4','Clear discussion with some analysis'],['1–2','Basic description with limited evaluation']],
      sample:'Machine learning may displace routine roles but create new opportunities in system oversight and data analysis. While efficiency increases, reskilling is essential to reduce inequality.'}
  },
  /* mapping grid: question -> [syllabus outcomes, focus area, band alignment] */
  grid:{
    '1':['EC-12-02, EC-12-08','Programming for the Web','Band 3–4'],'2':['EC-12-02, EC-12-08','Project Management','Band 3–4'],
    '3':['EC-12-06','Software Automation','Band 4'],'4':['EC-12-01, EC-12-02','Programming for the Web','Band 3–4'],
    '5':['EC-12-02','Programming for the Web','Band 3'],'6':['EC-12-10, EC-12-09','Software Engineering Project','Band 4'],
    '7':['EC-12-10, EC-12-09','Software Engineering Project','Band 4'],'8':['EC-12-08','System development tools','Band 3–4'],
    '9':['EC-12-09','Project Management','Band 4'],'10':['EC-12-02','Data use and manipulation','Band 4'],
    '11':['EC-12-06','Intelligent systems','Band 5'],'12':['EC-12-01','Project Management','Band 4'],
    '13':['EC-12-05','Programming for the Web','Band 4'],'14':['EC-12-02','Programming for the Web','Band 3'],
    '15':['EC-12-02','Programming for the Web','Band 4–5'],'16':['EC-12-06','Software Automation',''],
    '17':['EC-12-06','Software Automation','Band 4'],'18':['EC-12-03','Software Secure Architecture','Band 4'],
    '19':['EC-12-09','Project management','Band 4'],'20':['EC-12-08, EC-12-01','Programming for the Web','Band 5'],
    '21':['EC-12-03','Software Secure Architecture','Band 5'],'22':['EC-12-07','Software Automation','Band 5–6'],
    '23':['EC-12-06, EC-12-01','Software Automation','Band 5–6'],'24':['EC-12-03, EC-12-07','Software Secure Architecture','Band 5'],
    '25':['EC-12-06','Software Automation','Band 4–5'],'26':['EC-12-03, EC-12-03','Software Secure Architecture','Band 4'],
    '27':['EC-12-08, EC-12-09','Software Engineering Project','Band 5'],'28':['EC-12-03','Secure system architecture','Band 5'],
    '29':['EC-12-10, EC-12-09','Software Engineering Project','Band 4–5'],'30':['EC-12-02, EC-12-08','Software Engineering Project','Band 4'],
    '31':['EC-12-06','Software Automation','Band 5'],'32':['EC-12-08','Software Engineering Project','Band 5–6'],
    '33':['EC-12-07, EC-12-06','Software Automation','Band 6']
  }
};
