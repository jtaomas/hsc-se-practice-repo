1. **Create the Admin API Endpoint (`api/admin.js`)**
   - Require authentication.
   - Verify that the authenticated user's email is exactly `thomas.lu@education.nsw.gov.au`.
   - On the `load_all` action, iterate over all blobs in the `users/` and `progress/` paths to collect metadata and paper progress for all users.
   - Return this data securely.
2. **Create the Admin UI (`public/admin.js`)**
   - Add a new hash route `#/admin` which loads an `adminPage()`.
   - Before attempting to load data, verify client-side that `S.ae === 'thomas.lu@education.nsw.gov.au'`.
   - Fetch data from the `api/admin` endpoint.
   - Render a high-level dashboard displaying a list of all users, their emails, and counts of started/completed papers.
   - Allow drilling down into a specific user to see exactly which papers they have started/completed, and their scores.
   - Allow drilling down further into a specific paper for a user to see their exact responses for every question part.
3. **Integrate the UI with the App**
   - Inject the `<script src="admin.js"></script>` tag in `public/index.html` right before `boot.js`.
   - Add the routing condition `else if(h[0]==='admin')html=adminPage();` into `render()` in `public/pages.js`.
4. **Update server configuration (`vercel.json`)**
   - Add the `api/admin.js` function configuration.
5. **Verify Pre-commit Checks**
   - Run the pre-commit instructions checking tools to ensure everything aligns with guidelines.
6. **Submit**
