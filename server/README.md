# Noted API

## Run locally

Use Node.js 18 or newer and MongoDB. Create a `server/.env` file with:

```env
MONGO_URI=mongodb://127.0.0.1:27017/noted
AUTH_TOKEN_SECRET=replace-with-a-random-secret-at-least-32-characters-long
GOOGLE_CLIENT_ID=your-google-oauth-client-id
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

Generate a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
Then run `npm install`, `npm test`, and `npm start` from the `server` directory.

## API

All responses are JSON. Registration and login return a bearer token and a public user object. Send that token in the `Authorization: Bearer <token>` header for protected endpoints.

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `GET` | `/health` | Check server health | No |
| `POST` | `/login/new-user` | Register with `username`, `fullName`, `email`, `password`, `recoveryQuestion`, and `recoveryAnswer` | No |
| `POST` | `/login` | Authenticate with `email` and `password` | No |
| `POST` | `/login/google` | Sign in with a Google ID token | No |
| `POST` | `/login/google/new-user` | Finish Google sign-up with `username`, `password`, and recovery details | No |
| `GET` | `/login/me` | Get the authenticated user's profile | Yes |
| `GET` | `/notes/get-notes` | List PDF notes, newest first | Yes |
| `GET` | `/notes/get-notes/:userId` | List PDF notes uploaded by a user | Yes |
| `GET` | `/notes/get-note/search/:searchTerm` | Search note titles and authors | Yes |
| `GET` | `/notes/:noteId` | Fetch a PDF note | Yes |
| `POST` | `/notes/upload` | Create a PDF note with a base64 `document` data URL and optional `title` | Yes |
| `PATCH` | `/notes/:noteId` | Update the owner's `title` and/or PDF `document` | Yes |
| `DELETE` | `/notes/:noteId` | Delete the owner's note | Yes |

PDF note documents must use a `data:application/pdf;base64,...` data URL and be no larger than 10 MB. Passwords and recovery answers are stored as salted scrypt hashes. Note creation uses the authenticated account as the author; a client-supplied `uploadedBy` is not trusted.

Set the same Google OAuth web client ID as `GOOGLE_CLIENT_ID` in the server and
`REACT_APP_GOOGLE_CLIENT_ID` in the frontend. Add the frontend origin to that
OAuth client's authorized JavaScript origins.
