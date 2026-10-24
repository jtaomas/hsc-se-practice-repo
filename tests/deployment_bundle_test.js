'use strict';
// Verify dynamic canonical assets are explicitly included in deployment bundles.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),pub=path.join(root,'public');
const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
const {loadBanks}=require(path.join(root,'server/marking-input'));
// These are runtime fs/VM dependencies, which static require tracing can miss.
const literals=[...loadBanks.toString().matchAll(/['"]([^'"\n]+\.js)['"]/g)].map(match=>match[1]);
const bankFiles=fs.readdirSync(pub).filter(file=>/^bank\d+\.js$/.test(file));
const required=[...new Set([...literals,...bankFiles,'marking-config.js'])].map(file=>'public/'+file).sort();
assert(required.includes('public/marking/marking.js'),'The canonical loader must include the shared rubric registry.');
assert(required.includes('public/marking/pem2026.js')&&required.includes('public/marking/doe2026.js'),'Converted-paper rubrics must be canonical runtime assets.');
function expand(pattern){const match=/\{([^{}]+)\}/.exec(pattern);return match?match[1].split(',').flatMap(part=>expand(pattern.slice(0,match.index)+part+pattern.slice(match.index+match[0].length))):[pattern];}
function includes(patterns,file){return (Array.isArray(patterns)?patterns:[patterns]).some(pattern=>typeof pattern==='string'&&expand(pattern).some(glob=>new RegExp('^'+glob.split('*').map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('[^/]*')+'$').test(file)));}
for(const file of required)assert(fs.statSync(path.join(root,file)).isFile(),file+' must exist');
for(const api of ['api/mark.js','api/improve.js','api/compare.js','api/class.js']){
  const entry=config.functions?.[api];assert(entry,api+' requires a function bundle definition');
  for(const file of required)assert(includes(entry.includeFiles,file),api+' is missing runtime asset '+file);
  assert(!includes('public/{helpers,kit,bank*,formats,marking-config}.js','public/marking/marking.js'),'The negative control must detect the former incomplete bundle.');
}
console.log('Deployment bundles: all '+required.length+' canonical runtime assets, including nested rubrics and shared configuration, are included by all 4 marking/coach/comparison APIs.');
