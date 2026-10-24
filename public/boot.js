/* Archived papers (banks 1 to 7, see archive/README.md) stay in the files but are hidden everywhere in the app.
   ?archive=1 in the address shows them again; the browser tests use it. */
if(!/[?&]archive=1\b/.test(location.search))BANKS.forEach(function(b){if(b.archived)b.hidden=true});
render();
