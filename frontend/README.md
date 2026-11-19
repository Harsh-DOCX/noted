# Noted frontend

A small React frontend with React Router navigation between the home, about,
contact, notes, add-note, sign-up, log-in, and password recovery pages.

Start the app from this directory:

```sh
npm install
npm start
```

Run the frontend tests with `npm test` or create a production build with
`npm run build`.

The shared navigation and footer are in `src/components/`. Sign-up, log-in,
and PDF note uploads use the API at `http://localhost:5000` by default. Set
`REACT_APP_API_URL` before starting the app to use another API address. Notes
are protected by login and PDF files up to 10 MB are stored by the server.
Google sign-in also requires `REACT_APP_GOOGLE_CLIENT_ID`; new Google accounts
continue to a form to choose a username, password, and recovery question.
Password recovery is not available in the API yet. The navigation logo is
`public/noted-logo.svg`.
