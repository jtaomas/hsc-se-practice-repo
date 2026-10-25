(function(){
var PW='Programming for the Web';
var qs=[];

/* ---------- Database Definitions for SQL Practice ---------- */

// Q1: Cloud Servers
var DB1={
  Servers:{
    c:['ServerID','Hostname','Region','RAM_GB','CPUCores','Status'],
    r:[
      ['S101','web-prod-01','ap-southeast',32,8,'Active'],
      ['S102','db-primary','ap-southeast',64,16,'Active'],
      ['S103','cache-node','us-east',16,4,'Active'],
      ['S104','analytics-01','ap-southeast',16,4,'Active'],
      ['S105','dev-sandbox','ap-southeast',8,2,'Stopped'],
      ['S106','backup-runner','ap-southeast',8,2,'Active'],
      ['S107','stage-web','eu-central',32,8,'Active']
    ]
  }
};

// Q2: Security Bug Tickets
var DB2={
  Tickets:{
    c:['TicketID','Module','Title','Severity','Status'],
    r:[
      ['T201','AuthService','Fix Auth Token Expiry','Critical','Open'],
      ['T202','BillingModule','Implement Auth Webhook','High','In Review'],
      ['T203','LegacyBridge','Patch Auth Token Leak','Critical','Open'],
      ['T204','AuthService','Update OAuth Documentation','Low','Open'],
      ['T205','PaymentGateway','Fix Payment Gateway Timeout','High','Open'],
      ['T206','UserPortal','Sanitise User Auth Input','High','Closed'],
      ['T207','API','Reset Token Validation Bug','High','In Review']
    ]
  }
};

// Q3: Training Module Completions
var DB3={
  ModuleCompletions:{
    c:['RecordID','CourseTrack','StudentLevel','Score','PassStatus'],
    r:[
      ['R1','Cybersecurity','Beginner',85,'Passed'],
      ['R2','Cybersecurity','Advanced',92,'Passed'],
      ['R3','Cybersecurity','Beginner',48,'Failed'],
      ['R4','Cybersecurity','Intermediate',78,'Passed'],
      ['R5','Web Development','Beginner',88,'Passed'],
      ['R6','Web Development','Intermediate',76,'Passed'],
      ['R7','Web Development','Advanced',54,'Failed'],
      ['R8','Data Science','Beginner',90,'Passed'],
      ['R9','Data Science','Intermediate',94,'Passed'],
      ['R10','Data Science','Advanced',86,'Passed']
    ]
  }
};

// Q4: Hardware Part Orders
var DB4={
  PartOrders:{
    c:['OrderID','Category','PartName','UnitPrice','Quantity','Fulfilled'],
    r:[
      ['O1','Sensors','Ultrasonic HC-SR04',4.50,10,'Yes'],
      ['O2','Sensors','Infrared Sharp',12.00,4,'Yes'],
      ['O3','Microcontrollers','ESP32 NodeMCU',8.50,6,'Yes'],
      ['O4','Microcontrollers','Arduino Uno',24.00,2,'No'],
      ['O5','Actuators','Servo SG90',3.00,15,'Yes'],
      ['O6','Actuators','Stepper NEMA17',18.00,3,'Yes'],
      ['O7','Sensors','DHT22 Temp/Humidity',6.00,5,'Yes'],
      ['O8','Microcontrollers','Raspberry Pi Pico',6.00,10,'Yes']
    ]
  }
};

// Q5: IT Helpdesk Incidents (2025 HSC Exam Q21 style)
var DB5={
  IncidentReports:{
    c:['IncidentID','System','Severity','Status','LoggedDate'],
    r:[
      ['INC-101','Billing','Critical','Pending','2026-03-01'],
      ['INC-102','Billing','High','Escalated','2026-03-02'],
      ['INC-103','Billing','Critical','Pending','2026-03-02'],
      ['INC-104','Billing','Low','Resolved','2026-03-03'],
      ['INC-105','CRM','High','Escalated','2026-03-03'],
      ['INC-106','CRM','Critical','Pending','2026-03-04'],
      ['INC-107','CRM','Medium','Pending','2026-03-04'],
      ['INC-108','Portal','Critical','Pending','2026-03-05'],
      ['INC-109','Portal','High','Escalated','2026-03-05'],
      ['INC-110','Portal','Critical','Escalated','2026-03-06']
    ]
  }
};

// Q6: Medical Consultations (2-table relational join)
var DB6={
  Patients:{
    c:['PatientID','PatientName','Suburb','Age'],
    r:[
      ['P1','Emma Walker','Hornsby',24],
      ['P2','Lucas Brown','Epping',15],
      ['P3','Zoe Chen','Hornsby',42],
      ['P4','Oliver Smith','Chatswood',35],
      ['P5','Sophia Patel','Epping',19]
    ]
  },
  Consultations:{
    c:['ConsultID','PatientID','ConsultDate','Fee','Doctor'],
    r:[
      ['C01','P1','2026-02-10',120.00,'Dr Taylor'],
      ['C02','P1','2026-02-18',75.00,'Dr Taylor'],
      ['C03','P2','2026-02-12',110.00,'Dr Nguyen'],
      ['C04','P3','2026-02-14',160.00,'Dr Taylor'],
      ['C05','P3','2026-02-20',95.00,'Dr Nguyen'],
      ['C06','P4','2026-02-15',130.00,'Dr Nguyen'],
      ['C07','P5','2026-02-22',85.00,'Dr Taylor']
    ]
  }
};

// Q7: Environmental Monitoring Telemetry (2-table join, MIN, MAX, AVG)
var DB7={
  MonitoringSites:{
    c:['SiteID','SiteName','HabitatType','AltitudeMeters'],
    r:[
      ['S1','Blue Gum Ridge','Forest',420],
      ['S2','Swamp Creek','Wetland',85],
      ['S3','Saltmarsh Flat','Wetland',12],
      ['S4','Highland Peak','Mountain',910]
    ]
  },
  Readings:{
    c:['ReadingID','SiteID','RecordedDate','Temperature','Humidity'],
    r:[
      ['R01','S1','2026-03-01',18.5,65],
      ['R02','S1','2026-03-02',24.5,58],
      ['R03','S1','2026-03-03',21.0,62],
      ['R04','S2','2026-03-01',22.0,85],
      ['R05','S2','2026-03-02',28.0,90],
      ['R06','S2','2026-03-03',19.0,82],
      ['R07','S3','2026-03-01',25.0,88],
      ['R08','S3','2026-03-02',31.0,78],
      ['R09','S4','2026-03-01',12.0,50]
    ]
  }
};

// Q8: Robotics Match Scores (3-table join, arithmetic SUM)
var DB8={
  Schools:{
    c:['SchoolID','SchoolName','Region'],
    r:[
      ['SC1','Riverside High','Metro North'],
      ['SC2','Valley Grammar','Metro North'],
      ['SC3','Harbour College','Metro South']
    ]
  },
  Teams:{
    c:['TeamID','SchoolID','TeamName'],
    r:[
      ['T1','SC1','RoboGears'],
      ['T2','SC1','CircuitBreakers'],
      ['T3','SC2','TitaniumByte'],
      ['T4','SC3','PacificStorm']
    ]
  },
  Scores:{
    c:['MatchID','TeamID','Points','Penalties'],
    r:[
      ['M1','T1',120,10],
      ['M2','T1',140,20],
      ['M3','T2',90,0],
      ['M4','T2',110,15],
      ['M5','T3',150,5],
      ['M6','T3',170,25],
      ['M7','T4',200,10]
    ]
  }
};

// Q9: Fleet Maintenance (Date range, NOT, multi-column sort ASC & DESC)
var DB9={
  FleetServices:{
    c:['ServiceID','VehicleRego','VehicleType','ServiceDate','Cost','IsWarranty'],
    r:[
      ['S01','VAN-101','Van','2026-02-15',450.00,'N'],
      ['S02','TRK-202','Truck','2026-03-10',1200.00,'N'],
      ['S03','VAN-103','Van','2026-01-20',380.00,'Y'],
      ['S04','TRK-204','Truck','2026-04-05',850.00,'N'],
      ['S05','SED-301','Sedan','2026-05-12',320.00,'N'],
      ['S06','VAN-102','Van','2026-03-22',620.00,'N'],
      ['S07','TRK-201','Truck','2026-07-01',1400.00,'N'],
      ['S08','SED-302','Sedan','2026-02-28',510.00,'N']
    ]
  }
};

// Q10: Software Consultancy Billing (3-table join, pattern matching, SUM, multi-group)
var DB10={
  Clients:{
    c:['ClientID','ClientName','Country','Industry'],
    r:[
      ['CL1','Aura Health','Australia','Healthcare'],
      ['CL2','Nexis Retail','Australia','Retail'],
      ['CL3','Apex FinTech','Australia','Finance'],
      ['CL4','Vanguard Media','New Zealand','Media']
    ]
  },
  Projects:{
    c:['ProjectID','ClientID','ProjectTitle','ActiveStatus'],
    r:[
      ['PR1','CL1','Patient Portal Web App','Active'],
      ['PR2','CL1','Legacy Migration Tool','Active'],
      ['PR3','CL2','E-Commerce Web Portal','Active'],
      ['PR4','CL3','Payment Engine API','Active'],
      ['PR5','CL3','Mobile Trading App','Active']
    ]
  },
  Timesheets:{
    c:['EntryID','ProjectID','WorkDate','Hours','Rate','Approved'],
    r:[
      ['TS01','PR1','2026-03-05',10.0,150.00,'Yes'],
      ['TS02','PR1','2026-03-12',15.0,150.00,'Yes'],
      ['TS03','PR2','2026-03-08',8.0,120.00,'Yes'],
      ['TS04','PR3','2026-03-10',20.0,140.00,'Yes'],
      ['TS05','PR4','2026-03-15',12.0,180.00,'No'],
      ['TS06','PR5','2026-03-18',25.0,160.00,'Yes'],
      ['TS07','PR5','2026-03-25',15.0,160.00,'Yes']
    ]
  }
};

/* ---------- Question 1: Single Table Filtering, Relational Operators & Renaming ---------- */
qs.push(Q(PW,'A cloud infrastructure service maintains virtual server instances in a table, <b><i>Servers</i></b>.',[
  sq('Construct a SQL query that displays the Hostname and RAM_GB of all servers in the \'ap-southeast\' region with a Status of \'Active\' and at least 16 RAM_GB.<br>Use the column headings Hostname and MemoryGB. List the results in ascending alphabetical order of Hostname.',4,
`SELECT Hostname, RAM_GB AS MemoryGB
FROM Servers
WHERE Region = 'ap-southeast' AND Status = 'Active' AND RAM_GB >= 16
ORDER BY Hostname ASC`,true,[
    '1 mark: selects Hostname and RAM_GB with the column heading MemoryGB.',
    '1 mark: filters by Region = \'ap-southeast\' and Status = \'Active\'.',
    '1 mark: filters by RAM_GB greater than or equal to 16.',
    '1 mark: orders the results alphabetically by Hostname in ascending order.'
  ])
],{two:true,db:DB1}));

/* ---------- Question 2: Pattern Matching (CONTAINS / DOES NOT CONTAIN) & Negation ---------- */
qs.push(Q(PW,'A software team tracks security audit and bug reports in a table, <b><i>Tickets</i></b>.',[
  sq('Construct a SQL query that displays the TicketID, Module, and Title of all tickets where the Title contains \'Token\', the Module does not contain \'Legacy\', the Severity is either \'Critical\' or \'High\', and the Status is not equal to \'Closed\'.<br>Use the column headings TicketID, Module, and IssueTitle. List the results in descending numerical order of TicketID.',4,
`SELECT TicketID, Module, Title AS IssueTitle
FROM Tickets
WHERE Title LIKE '%Token%'
AND Module NOT LIKE '%Legacy%'
AND (Severity = 'Critical' OR Severity = 'High')
AND Status <> 'Closed'
ORDER BY TicketID DESC`,true,[
    '1 mark: selects TicketID, Module, and Title with the column heading IssueTitle.',
    '1 mark: filters Title containing \'Token\' and Module not containing \'Legacy\'.',
    '1 mark: filters Severity to \'Critical\' or \'High\', and Status not equal to \'Closed\'.',
    '1 mark: orders the results by TicketID in descending order.'
  ])
],{two:true,db:DB2}));

/* ---------- Question 3: Group Aggregation (COUNT, AVG) & Sorting by Aggregate ---------- */
qs.push(Q(PW,'An online training academy records completed module outcomes in a table, <b><i>ModuleCompletions</i></b>.',[
  sq('Construct a SQL query that displays, for each CourseTrack, the number of passed completions and their average score, using only records where PassStatus is \'Passed\'.<br>Use the column headings CourseTrack, PassedCount, and AvgScore. List the results from the highest to the lowest average score.',4,
`SELECT CourseTrack, COUNT(RecordID) AS PassedCount, AVG(Score) AS AvgScore
FROM ModuleCompletions
WHERE PassStatus = 'Passed'
GROUP BY CourseTrack
ORDER BY AvgScore DESC`,true,[
    '1 mark: selects CourseTrack, a count of passed records, and average score with specified column headings.',
    '1 mark: filters records to PassStatus = \'Passed\'.',
    '1 mark: groups results by CourseTrack.',
    '1 mark: orders results by average score in descending order.'
  ])
],{two:true,db:DB3}));

/* ---------- Question 4: Calculated Arithmetic Field (SUM) & Comparison Operators ---------- */
qs.push(Q(PW,'A hardware components distributor records customer orders in a table, <b><i>PartOrders</i></b>.',[
  sq('Construct a SQL query that displays the Category and the total cost of all fulfilled orders for that category, where the UnitPrice of the part is less than 20.00 and Fulfilled is not equal to \'No\'. The total cost is calculated by multiplying Quantity by UnitPrice.<br>Use the column headings Category and TotalCost. List the results in ascending alphabetical order of Category.',4,
`SELECT Category, SUM(Quantity * UnitPrice) AS TotalCost
FROM PartOrders
WHERE UnitPrice < 20.00 AND Fulfilled <> 'No'
GROUP BY Category
ORDER BY Category ASC`,true,[
    '1 mark: selects Category and the sum of Quantity * UnitPrice with column heading TotalCost.',
    '1 mark: filters by UnitPrice &lt; 20.00 and Fulfilled &lt;&gt; \'No\' (or Fulfilled = \'Yes\').',
    '1 mark: groups by Category.',
    '1 mark: orders results in ascending alphabetical order of Category.'
  ])
],{two:true,db:DB4}));

/* ---------- Question 5: Compound Logic with Parentheses & Multi-Column Grouping (2025 HSC Q21 Style) ---------- */
qs.push(Q(PW,'An enterprise software helpdesk tracks support incidents in a table, <b><i>IncidentReports</i></b>.',[
  sq('Construct a SQL query that extracts incidents for the \'Billing\' and \'Portal\' systems where the Status is either \'Pending\' or \'Escalated\'. The query must count the number of incidents for each status within each system.<br>Use the column headings System, Status, and IncidentCount. Group the results by System and Status, and list the results from the highest to the lowest incident count.',4,
`SELECT System, Status, COUNT(IncidentID) AS IncidentCount
FROM IncidentReports
WHERE (System = 'Billing' OR System = 'Portal') AND (Status = 'Pending' OR Status = 'Escalated')
GROUP BY System, Status
ORDER BY IncidentCount DESC`,true,[
    '1 mark: selects System, Status, and a count of incidents with column heading IncidentCount.',
    '1 mark: correctly filters for \'Billing\' and \'Portal\' systems.',
    '1 mark: correctly filters for \'Pending\' or \'Escalated\' statuses using appropriate logical operators and parentheses.',
    '1 mark: groups by System, Status (or Status, System) and orders by IncidentCount descending.'
  ])
],{two:true,db:DB5}));

/* ---------- Question 6: Two-Table Relational Join with Numerical Comparisons ---------- */
qs.push(Q(PW,'A regional medical clinic stores patient information and consultation records in two tables, <b><i>Patients</i></b> and <b><i>Consultations</i></b>.',[
  sq('Construct a SQL query that joins the Patients and Consultations tables to display the PatientName, Suburb, ConsultDate, and Fee for adult patients (Age greater than or equal to 18) where the Fee is greater than 80.00 and less than or equal to 150.00.<br>Use the column headings PatientName, Suburb, ConsultDate, and Fee. List the results in ascending chronological order of ConsultDate.',4,
`SELECT Patients.PatientName, Patients.Suburb, Consultations.ConsultDate, Consultations.Fee
FROM Patients
JOIN Consultations ON Patients.PatientID = Consultations.PatientID
WHERE Patients.Age >= 18 AND Consultations.Fee > 80.00 AND Consultations.Fee <= 150.00
ORDER BY Consultations.ConsultDate ASC`,true,[
    '1 mark: selects PatientName, Suburb, ConsultDate, and Fee.',
    '1 mark: correctly joins Patients and Consultations on PatientID.',
    '1 mark: filters by Age >= 18, Fee > 80.00, and Fee &lt;= 150.00.',
    '1 mark: orders results by ConsultDate in ascending order.'
  ])
],{two:true,db:DB6}));

/* ---------- Question 7: Two-Table Join with MIN, MAX, AVG Statistical Aggregations ---------- */
qs.push(Q(PW,'An environmental research organisation monitors microclimates using two tables, <b><i>MonitoringSites</i></b> and <b><i>Readings</i></b>.',[
  sq('Construct a SQL query that displays, for each site in either the \'Forest\' or \'Wetland\' habitat, the SiteName along with the minimum temperature, maximum temperature, and average temperature recorded.<br>Use the column headings SiteName, LowestTemp, HighestTemp, and AverageTemp. List the results in alphabetical order of SiteName.',4,
`SELECT MonitoringSites.SiteName, MIN(Readings.Temperature) AS LowestTemp, MAX(Readings.Temperature) AS HighestTemp, AVG(Readings.Temperature) AS AverageTemp
FROM MonitoringSites
JOIN Readings ON MonitoringSites.SiteID = Readings.SiteID
WHERE MonitoringSites.HabitatType = 'Forest' OR MonitoringSites.HabitatType = 'Wetland'
GROUP BY MonitoringSites.SiteName
ORDER BY MonitoringSites.SiteName ASC`,true,[
    '1 mark: selects SiteName and uses MIN, MAX, and AVG functions with specified column headings.',
    '1 mark: joins MonitoringSites and Readings on SiteID.',
    '1 mark: filters for HabitatType = \'Forest\' OR HabitatType = \'Wetland\'.',
    '1 mark: groups by SiteName and orders in ascending alphabetical order of SiteName.'
  ])
],{two:true,db:DB7}));

/* ---------- Question 8: Three-Table Relational Join with Arithmetic and Aggregation ---------- */
qs.push(Q(PW,'A state robotics league tracks schools, teams, and tournament match scores in three tables, <b><i>Schools</i></b>, <b><i>Teams</i></b>, and <b><i>Scores</i></b>.',[
  sq('Construct a SQL query that joins the Schools, Teams, and Scores tables to display the SchoolName, TeamName, and the total net points scored by each team in the \'Metro North\' region. The net points for a match is Points minus Penalties.<br>Use the column headings SchoolName, TeamName, and NetPoints. List the results from the highest to the lowest net points.',4,
`SELECT Schools.SchoolName, Teams.TeamName, SUM(Scores.Points - Scores.Penalties) AS NetPoints
FROM Schools
JOIN Teams ON Schools.SchoolID = Teams.SchoolID
JOIN Scores ON Teams.TeamID = Scores.TeamID
WHERE Schools.Region = 'Metro North'
GROUP BY Teams.TeamName, Schools.SchoolName
ORDER BY NetPoints DESC`,true,[
    '1 mark: selects SchoolName, TeamName, and calculates SUM(Points - Penalties) with alias NetPoints.',
    '1 mark: correctly joins the three tables Schools, Teams, and Scores.',
    '1 mark: filters by Region = \'Metro North\'.',
    '1 mark: groups by team and orders by NetPoints in descending order.'
  ])
],{two:true,db:DB8}));

/* ---------- Question 9: Date Range Filtering, Negation with NOT & Multi-Column Sorting ---------- */
qs.push(Q(PW,'A logistics company maintains vehicle service and inspection records in a table, <b><i>FleetServices</i></b>.',[
  sq('Construct a SQL query that displays the VehicleRego, VehicleType, ServiceDate, and Cost for all services conducted between \'2026-01-01\' and \'2026-06-30\' inclusive, where the service was NOT covered under warranty (IsWarranty = \'N\').<br>Use the column headings VehicleRego, VehicleType, ServiceDate, and ServiceCost. List the results primarily in ascending alphabetical order of VehicleType, and secondarily from highest to lowest ServiceCost.',4,
`SELECT VehicleRego, VehicleType, ServiceDate, Cost AS ServiceCost
FROM FleetServices
WHERE ServiceDate >= '2026-01-01' AND ServiceDate <= '2026-06-30' AND NOT IsWarranty = 'Y'
ORDER BY VehicleType ASC, ServiceCost DESC`,true,[
    '1 mark: selects VehicleRego, VehicleType, ServiceDate, and Cost with column heading ServiceCost.',
    '1 mark: filters ServiceDate to the range between \'2026-01-01\' and \'2026-06-30\' inclusive.',
    '1 mark: filters for non-warranty services using NOT or IsWarranty = \'N\'.',
    '1 mark: orders primarily by VehicleType ascending and secondarily by ServiceCost descending.'
  ])
],{two:true,db:DB9}));

/* ---------- Question 10: Capstone Multi-Table Join, Pattern Matching & Multi-Grouping ---------- */
qs.push(Q(PW,'A software development consultancy stores clients, projects, and recorded developer timesheets in three tables, <b><i>Clients</i></b>, <b><i>Projects</i></b>, and <b><i>Timesheets</i></b>.',[
  sq('Construct a SQL query that joins the Clients, Projects, and Timesheets tables to calculate the total billable hours and total billable amount for Australian clients (Country is \'Australia\') whose Industry is not equal to \'Retail\'.<br>Only include timesheets where Approved is \'Yes\', and where the ProjectTitle contains \'Web\' or \'App\' but does not contain \'Legacy\'. The billable amount is calculated by multiplying Hours by Rate.<br>Use the column headings ClientName, ProjectTitle, TotalHours, and TotalBilled. Group by ClientName and ProjectTitle, and list the results from the highest to the lowest total billed amount.',4,
`SELECT Clients.ClientName, Projects.ProjectTitle, SUM(Timesheets.Hours) AS TotalHours, SUM(Timesheets.Hours * Timesheets.Rate) AS TotalBilled
FROM Clients
JOIN Projects ON Clients.ClientID = Projects.ClientID
JOIN Timesheets ON Projects.ProjectID = Timesheets.ProjectID
WHERE Clients.Country = 'Australia'
AND Clients.Industry <> 'Retail'
AND Timesheets.Approved = 'Yes'
AND (Projects.ProjectTitle LIKE '%Web%' OR Projects.ProjectTitle LIKE '%App%')
AND Projects.ProjectTitle NOT LIKE '%Legacy%'
GROUP BY Clients.ClientName, Projects.ProjectTitle
ORDER BY TotalBilled DESC`,true,[
    '1 mark: selects ClientName, ProjectTitle, SUM(Hours) as TotalHours, and SUM(Hours * Rate) as TotalBilled.',
    '1 mark: correctly joins Clients, Projects, and Timesheets on their corresponding keys.',
    '1 mark: filters by Country = \'Australia\', Industry &lt;&gt; \'Retail\', and Approved = \'Yes\'.',
    '1 mark: applies pattern filters for \'Web\'/\'App\' and excluding \'Legacy\', groups by client and project, and orders by TotalBilled descending.'
  ])
],{two:true,db:DB10}));

BANKS.push({
  id:'11',
  name:'SQL Practice Paper',
  sub:'10 questions · 40 marks · Relational databases and SQL masterclass',
  mini:true,
  questions:10,
  marks:40,
  duration:50*60,
  qs:qs
});
})();
