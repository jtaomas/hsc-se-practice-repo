/* HTML and CSS Practice Paper. Original questions written for the HTML and CSS (wb) format:
   students write HTML and CSS and see the page rendered beside the editor. Covers the
   Programming for the Web content on CSS (consistency, flexibility with display devices,
   maintenance tools), predesigned classes, UI and UX principles (font, colour, audio,
   navigation), accessibility and inclusivity, and client-side input validation. */
(function(){
var PW='Programming for the Web',SSA='Secure Software Architecture';
var qs=[];
function page(title,body,css){
  return '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <title>'+title+'</title>\n'+(css===false?'':'    <link rel="stylesheet" href="style.css">\n')+'  </head>\n  <body>\n'+body+'\n  </body>\n</html>';
}

/* ---------- Question 1: interpreting selectors ---------- */
var Q1H=`<h1 id="title" class="note">Harbour Run</h1>
<p>Registrations close <span class="note">Friday</span>.</p>
<p class="warn">Bring water.</p>`;
var Q1C=`/* Event page styles */
h1 {
    color: navy;
}
#title {
    color: teal;
}
.note {
    font-style: italic;
}
p {
    color: black;
    font-weight: normal;
}
.warn {
    color: red;
    font-weight: bold;
}`;
var COL=['navy','teal','black','red'],YN=['Yes','No'];
qs.push(Q(PW,'Consider the following HTML and cascading style sheet (CSS) code.'+files([['index.html',Q1H],['style.css',Q1C]]),[
 gd('For each piece of text, select its colour and whether it is shown in italics.',['Text','Colour','Italic'],[
  ['Harbour Run',[COL,1],[YN,0]],
  ['Friday',[COL,2],[YN,0]],
  ['Bring water.',[COL,3],[YN,1]]],3,'The id selector #title is more specific than the element selector h1, so the heading is teal; its class note makes it italic. "Friday" is inside a paragraph, so it takes the paragraph\'s black colour, and its class makes it italic. The warn class overrides the paragraph colour with red and is not italic. The comment line is never displayed.')],{two:true}));

/* ---------- Question 2: write CSS to match a design ---------- */
var Q2H=page('Tickets',`    <div class="ticket">
      <h2>Harbour Lights Concert</h2>
      <p class="date">Saturday 14 March, 7:30 pm</p>
      <p class="price">$45</p>
      <p class="sold">Sold out</p>
    </div>`);
var Q2C=`body {
  font-family: Arial, sans-serif;
}

.ticket {
  width: 260px;
  border: 3px solid #002664;
  padding: 16px;
  text-align: center;
}

h2 {
  color: #002664;
}

.price {
  font-size: 28px;
  font-weight: bold;
}

.sold {
  color: #cc0000;
  text-decoration: line-through;
}`;
qs.push(Q(PW,'A concert venue wants each ticket on its website to look like Image 1.'+webview('Image 1',Q2H,Q2C,{height:320})+'<p>The design requires:</p>'+bl(['a sans-serif font (Arial) for the whole page','a ticket box 260 pixels wide, with a 3-pixel solid dark blue (#002664) border, 16 pixels of padding and centred text','a dark blue (#002664) heading','the price in bold, 28 pixels high','"Sold out" in red (#cc0000) with a line through it.']),[
 wb('The HTML file is complete. Write style.css so that the page matches Image 1.',4,[['index.html',Q2H,false],['style.css','/* Write your CSS here */\n']],{'style.css':Q2C},
  ['1 mark: a rule for the ticket class setting the width, the solid #002664 border, the padding and centred text.','1 mark: sets the Arial or sans-serif font for the page and the #002664 colour for the heading.','1 mark: a rule for the price class setting a 28-pixel bold font.','1 mark: a rule for the sold class setting red text and a line through it, with valid CSS syntax (selectors, braces, colons and semicolons) throughout.'],{height:300})],{two:true}));

/* ---------- Question 3: write semantic HTML for given CSS ---------- */
var Q3C=`header {
  background-color: #002664;
  color: white;
  padding: 10px;
}

nav ul {
  list-style: none;
  padding: 0;
}

nav li {
  display: inline;
  margin-right: 12px;
}

main {
  padding: 10px;
}

footer {
  font-size: 12px;
  color: #555555;
}`;
var Q3H=page('Riverside Library',`    <header>
      <h1>Riverside Library</h1>
    </header>
    <nav>
      <ul>
        <li><a href="index.html">Home</a></li>
        <li><a href="catalogue.html">Catalogue</a></li>
        <li><a href="events.html">Events</a></li>
      </ul>
    </nav>
    <main>
      <h2>Opening hours</h2>
      <p>Monday to Friday, 9 am to 6 pm</p>
    </main>
    <footer>
      <p>&copy; Riverside Council</p>
    </footer>`);
qs.push(Q(PW,'A council is building the home page of the Riverside Library website. The style sheet has been written. The page must contain:'+bl(['a page title of "Riverside Library" and the language set to English','a link to style.css','a header containing the main heading "Riverside Library"','a navigation area containing a list of three links: Home (index.html), Catalogue (catalogue.html) and Events (events.html)','a main area containing the heading "Opening hours" and the paragraph "Monday to Friday, 9 am to 6 pm"','a footer containing "© Riverside Council".']),[
 wb('Write index.html using semantic HTML elements so that the page uses the given style sheet.',4,[['index.html','<!DOCTYPE html>\n'],['style.css',Q3C,false]],{'index.html':Q3H},
  ['1 mark: a complete document structure with html (lang="en"), head containing the title and a link to style.css, and body.','1 mark: a header element containing an h1 heading, and a nav element containing a list (ul and li) of three links with the correct href values.','1 mark: a main element containing an h2 heading and the paragraph.','1 mark: a footer element with the text, with every element correctly nested and closed.'],{height:300})],{two:true}));

/* ---------- Question 4: find and fix errors ---------- */
var Q4H=page('Bake Sale',`    <h1 class="banner">School Bake Sale</h1>
    <p class="info">Friday at lunch in the quad.</p>`).replace('href="style.css"','href="styles.css"');
var Q4C=`.banner {
  background-color: #fde2a7;
  color: #7a3e00
  text-align: center;
}

#info {
  font-size: 20px;
}`;
var Q4HM=Q4H.replace('href="styles.css"','href="style.css"');
var Q4CM=`.banner {
  background-color: #fde2a7;
  color: #7a3e00;
  text-align: center;
}

.info {
  font-size: 20px;
}`;
qs.push(Q(PW,'A student made a page for the school bake sale. It should look like Image 1, but the code contains three errors.'+webview('Image 1',Q4HM.replace('<link rel="stylesheet" href="style.css">',''),Q4CM,{height:150})+'<p>Use the browser preview to check your corrections.</p>',[
 wb('Find and correct the THREE errors in the code so that the page looks like Image 1.',3,[['index.html',Q4H],['style.css',Q4C]],{'index.html':Q4HM,'style.css':Q4CM},
  ['1 mark: corrects the link so that it refers to style.css (the file that exists) instead of styles.css.','1 mark: adds the missing semicolon after the colour value, so the colour and text-align declarations apply.','1 mark: changes #info to .info (or the HTML to use id="info") so the paragraph is 20 pixels.'],{height:220})],{two:true}));

/* ---------- Question 5: accessible form with client-side validation ---------- */
var Q5C=`form {
  max-width: 320px;
  font-family: Arial, sans-serif;
}

label {
  display: block;
  margin-top: 10px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 6px;
}

button {
  margin-top: 14px;
  padding: 8px 16px;
}`;
var Q5H=page('Beach clean-up',`    <h1>Beach clean-up sign-up</h1>
    <form action="/register" method="post">
      <label for="name">Full name</label>
      <input type="text" id="name" name="name" required>

      <label for="email">Email address</label>
      <input type="email" id="email" name="email" required>

      <label for="postcode">Postcode</label>
      <input type="text" id="postcode" name="postcode" pattern="[0-9]{4}" required>

      <label for="people">Number of people attending</label>
      <input type="number" id="people" name="people" min="1" max="6" required>

      <button type="submit">Register</button>
    </form>`);
qs.push(Q(SSA,'A surf club wants a sign-up form for its beach clean-up. The form sends its data to <code>/register</code> using the POST method. It needs these fields, each with a visible label that is linked to its input so that screen readers announce it:'+tbl(['Field','Rules'],[['Full name','Must be entered'],['Email address','Must be entered and must be a valid email address'],['Postcode','Must be entered and must be exactly four digits'],['Number of people attending','Must be entered; a whole number from 1 to 6']])+'<p>The form ends with a button labelled "Register". The style sheet has been written.</p>',[
 wb('Write the HTML for the form inside index.html. Use HTML input types and validation attributes so that the browser checks the rules before the form is sent.',4,[['index.html',page('Beach clean-up','    <h1>Beach clean-up sign-up</h1>\n')],['style.css',Q5C,false]],{'index.html':Q5H},
  ['1 mark: a form element with action="/register" and method="post", and a submit button labelled Register.','1 mark: each input has a label whose for attribute matches the input\'s id.','1 mark: suitable input types (eg email for the email address and number for the people attending).','1 mark: validation attributes that enforce the rules: required on every field, a four-digit rule for the postcode (eg pattern="[0-9]{4}") and min="1" max="6" for the number of people.'],{height:340})],{two:true}));

/* ---------- Question 6: responsive layout ---------- */
var Q6H=page('Camp activities',`    <h1>Camp activities</h1>
    <div class="cards">
      <div class="card"><h2>Kayaking</h2><p>Paddle the lagoon.</p></div>
      <div class="card"><h2>Archery</h2><p>Learn the basics.</p></div>
      <div class="card"><h2>Bushwalk</h2><p>Explore the ridge track.</p></div>
    </div>`);
var Q6C=`body {
  font-family: Arial, sans-serif;
  font-size: 1rem;
}

.cards {
  display: flex;
  gap: 12px;
}

.card {
  flex: 1;
  border: 1px solid #cccccc;
  border-radius: 6px;
  padding: 10px;
}

@media (max-width: 480px) {
  .cards {
    flex-direction: column;
  }
}`;
var BOX='background:#eef2f6;border:1px solid #bbb;border-radius:4px;padding:8px;font-size:12px;text-align:center';
qs.push(Q(PW,'A school camp website shows three activity cards. The layout must change with the width of the screen.'+fig('',sbs([['Wider than 480 pixels','<div style="display:flex;gap:6px"><div style="flex:1;'+BOX+'">Kayaking</div><div style="flex:1;'+BOX+'">Archery</div><div style="flex:1;'+BOX+'">Bushwalk</div></div>'],['480 pixels or narrower','<div style="display:flex;flex-direction:column;gap:6px;max-width:120px"><div style="'+BOX+'">Kayaking</div><div style="'+BOX+'">Archery</div><div style="'+BOX+'">Bushwalk</div></div>']]))+'<p>The style sheet must:</p>'+bl(['use a sans-serif font and a relative font size of 1rem for the page','place the cards side by side in a row, using flexbox, with a 12-pixel gap between them','give each card an equal share of the width, a 1-pixel solid light grey (#cccccc) border, rounded corners of 6 pixels and 10 pixels of padding','stack the cards in a single column when the screen is 480 pixels wide or narrower.'])+'<p>The preview is narrow. Use <b>Full screen</b> to see the page at a wider size.</p>',[
 wb('The HTML file is complete. Write style.css to create this responsive layout.',5,[['index.html',Q6H,false],['style.css','/* Write your CSS here */\n']],{'style.css':Q6C},
  ['1 mark: sets the sans-serif font and a relative font size (1rem) for the page.','1 mark: makes the cards container a flex container (display: flex) with a 12-pixel gap.','1 mark: gives each card an equal share of the width (eg flex: 1), the border, rounded corners and padding.','1 mark: a media query that applies at a maximum width of 480 pixels.','1 mark: inside the media query, stacks the cards in a column (eg flex-direction: column).'],{height:260})],{two:true}));

/* ---------- Question 7: CSS consistency, flexibility and maintenance ---------- */
qs.push(Q(PW,'A web team maintains a site with 400 pages.',[
 ms('Which of the following statements about cascading style sheets (CSS) are correct?<br>(More than one may be selected.)',['Linking every page to one external style sheet keeps the appearance consistent and lets a change be made in one place.','Adding a style attribute to every element makes a large site easier to maintain than using a style sheet.','Media queries let the same HTML page change its layout for different screen widths and devices.','A CSS preprocessor lets developers use variables and reusable rules, and then generates ordinary CSS.','CSS can change the colours and fonts of a page, but it cannot change the layout.','Predesigned CSS classes in a front-end framework let developers style buttons and grids by adding class names.'],[0,2,3,5],3,'A shared external style sheet gives consistency and one place to make changes; media queries give flexibility across devices; preprocessors and predesigned framework classes are tools that make CSS easier to maintain. Inline style attributes must be changed one element at a time, and CSS controls layout as well as appearance.')]));

/* ---------- Question 8: UI and UX for an audio page ---------- */
var Q8H=page('Episode 12: Rock pools',`    <header>
      <h1>Coastwatch podcast</h1>
    </header>
    <main>
      <h2>Episode 12: Rock pools</h2>
      <audio controls>
        <source src="episode12.mp3" type="audio/mpeg">
        Your browser cannot play this audio.
      </audio>
      <details>
        <summary>Read the transcript</summary>
        <p>Welcome to Coastwatch. Today we explore the rock pools at low tide...</p>
      </details>
      <p><a href="episodes.html">All episodes</a></p>
    </main>`);
var Q8C=`body {
  font-family: Verdana, sans-serif;
  font-size: 1.1rem;
  line-height: 1.6;
  color: #222222;
  background-color: #ffffff;
}

h1, h2 {
  color: #002664;
}

a {
  color: #002664;
  text-decoration: underline;
}

a:focus {
  outline: 3px solid #f0b400;
}`;
qs.push(Q(PW,'A marine education group publishes a podcast. Each episode has its own page. Many listeners are older people, people who are deaf or hard of hearing, or people who use only a keyboard. The page for each episode must:'+bl(['set the language of the page to English, and use a header containing the heading "Coastwatch podcast" and a main area containing the heading "Episode 12: Rock pools"','play the audio file episode12.mp3 only when the listener chooses to, with visible play controls','give a written transcript that the listener can open','include a link to the page episodes.html with the text "All episodes"','use a clear sans-serif font with a relative size of at least 1rem and a line height of at least 1.5','use dark text (#222222) on a white background, and keep links underlined with a clearly visible outline when they have keyboard focus.']),[
 wb('Write index.html and style.css for this page, applying user interface (UI) and user experience (UX) principles for font, colour, audio and navigation.',5,[['index.html','<!DOCTYPE html>\n'],['style.css','/* Write your CSS here */\n']],{'index.html':Q8H,'style.css':Q8C},
  ['1 mark: a complete page with lang="en", the title, a link to style.css, and header and main areas with the two headings.','1 mark: an audio element with controls and no autoplay that plays episode12.mp3.','1 mark: a written transcript the listener can open (eg details and summary, or a link to a transcript), and the link to episodes.html.','1 mark: CSS that sets a sans-serif font with a relative size of at least 1rem and a line height of at least 1.5.','1 mark: CSS that sets dark text on a white background, keeps links underlined and gives a visible focus outline.'],{height:340})],{two:true}));

/* ---------- Question 9: navigation bar ---------- */
var Q9H=page('Bushcare',`    <nav>
      <ul class="menu">
        <li><a href="index.html" class="current">Home</a></li>
        <li><a href="sites.html">Sites</a></li>
        <li><a href="join.html">Join</a></li>
      </ul>
    </nav>`);
var Q9C=`.menu {
  list-style: none;
  margin: 0;
  padding: 0;
  background-color: #002664;
}

.menu li {
  display: inline-block;
}

.menu a {
  display: block;
  padding: 8px 14px;
  color: white;
  text-decoration: none;
  font-family: Arial, sans-serif;
}

.current {
  background-color: #f0b400;
}

.menu a.current {
  color: #000000;
}`;
qs.push(Q(PW,'A bushcare group wants the navigation bar on its website to look like Image 1.'+webview('Image 1',Q9H,Q9C,{height:90})+'<p>The design requires:</p>'+bl(['no bullet points, with the links side by side on one dark blue (#002664) bar that has no margin or padding','each link in white Arial (sans-serif) text, not underlined, with 8 pixels of padding above and below and 14 pixels at each side','the link for the current page (class current) on a gold (#f0b400) background with black text.']),[
 wb('The HTML file is complete. Write style.css so that the navigation bar matches Image 1.',4,[['index.html',Q9H,false],['style.css','/* Write your CSS here */\n']],{'style.css':Q9C},
  ['1 mark: removes the bullet points and the list\'s margin and padding, and gives the bar the #002664 background.','1 mark: places the list items side by side (eg display: inline-block on li, or display: flex on the list).','1 mark: styles the links with white sans-serif text, no underline and the required padding.','1 mark: gives the current link a gold background and black text, with a selector specific enough to override the other link colour.'],{height:160})],{two:true}));

/* ---------- Question 10: data table ---------- */
var Q10H=page('Robotics results',`    <table>
      <caption>Interschool Robotics Challenge results</caption>
      <tr>
        <th scope="col">School</th>
        <th scope="col">Points</th>
      </tr>
      <tr class="winner">
        <td>Harbour High</td>
        <td>94</td>
      </tr>
      <tr>
        <td>Valley College</td>
        <td>87</td>
      </tr>
      <tr>
        <td>Ridge Secondary</td>
        <td>78</td>
      </tr>
    </table>`);
var Q10C=`table {
  border-collapse: collapse;
  font-family: Arial, sans-serif;
}

caption {
  font-weight: bold;
  margin-bottom: 6px;
}

th, td {
  border: 1px solid #999999;
  padding: 6px;
}

th {
  background-color: #e8eef8;
}

.winner {
  font-weight: bold;
  background-color: #fff3c4;
}`;
qs.push(Q(PW,'A robotics competition publishes its results as a web page. The results must be shown in an accessible data table, as in Image 1.'+webview('Image 1',Q10H,Q10C,{height:200})+'<p>The table needs:</p>'+bl(['the caption "Interschool Robotics Challenge results"','column headings School and Points, marked up as headings for their columns','one row for each school: Harbour High 94, Valley College 87, Ridge Secondary 78','the winning school\'s row marked with the class winner.'])+'<p>The style sheet must collapse the borders into single lines, give every cell a 1-pixel solid grey (#999999) border and 6 pixels of padding, give the heading cells a light blue (#e8eef8) background and show the winner\'s row in bold on a pale yellow (#fff3c4) background.</p>',[
 wb('Write index.html and style.css for the results page.',5,[['index.html','<!DOCTYPE html>\n'],['style.css','/* Write your CSS here */\n']],{'index.html':Q10H,'style.css':Q10C},
  ['1 mark: a complete page linking style.css, with a table element and the caption.','1 mark: a heading row using th elements (with scope="col" or in a thead) for School and Points.','1 mark: three data rows with the correct values, the winning row having class="winner".','1 mark: CSS that collapses the borders and gives th and td cells the grey border and padding.','1 mark: CSS that gives the heading cells the light blue background and the winner class bold text on a pale yellow background.'],{height:230})],{two:true}));

BANKS.push({id:'21',name:'HTML and CSS Practice Paper',sub:'10 questions · 40 marks · Writing HTML and CSS with a live browser preview',mini:true,questions:10,marks:40,duration:60*60,qs:qs});
})();
