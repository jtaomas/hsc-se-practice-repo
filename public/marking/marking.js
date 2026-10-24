/* ---------- marking-criteria area ----------
   Official marking criteria, sample answers and mapping grids for the converted trial
   papers live in this folder, apart from the question objects. One file per paper
   (pem2026.js, doe2026.js) fills MARKING['<paper>'] with one entry per written part.
   The banks read their sample answer and criteria from here, so whoever works on marking
   edits these files and never has to touch a question. See marking/README.md.
   Loaded after kit.js and before the banks. */
var MARKING={};
/* criteria strings for a part, in the form the marker expects */
function critOf(e){
  var out=[];
  if(e.kind==='bands')out.push('Holistic bands: award the one band that best fits the whole response. Do not add bands together.');
  e.bands.forEach(function(b){var n=String(b[0]);out.push(n+(n==='1'?' mark: ':' marks: ')+b[1])});
  return out;
}
