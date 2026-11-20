# Noted API

## Run locally

Use Node.js 18 or newer and MongoDB. Create a `server/.env` file with:

```env
MONGO_URI=mongodb://127.0.0.1:27017/noted
AUTH_TOKEN_SECRET=replace-with-a-random-secret-at-least-32-characters-long
GOOGLE_CLIENT_ID=your-google-oauth-client-id
PORT=5000
CORS_ORIGIN=http://localhost:3000
ADMIN_EMAILS=harshjadon9098@gmail.com
```

Generate a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
`ADMIN_EMAILS` is a comma-separated list; if omitted, no account has administrator privileges. The legacy `admin_email` setting is also accepted.
An administrator must sign in through Google with a verified email on this list, or link Google sign-in to an existing account; password-only accounts cannot receive administrator privileges.
Then run `npm install`, `npm test`, and `npm start` from the `server` directory.

## API

All responses are JSON. Registration and login return a bearer token and a public user object. Send that token in the `Authorization: Bearer <token>` header for protected endpoints.

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `GET` | `/health` | Check server health | No |
| `POST` | `/login/new-user` | Register with `username`, `fullName`, `email`, `password`, `recoveryQuestion`, and `recoveryAnswer` | No |
| `POST` | `/login` | Authenticate with `email` and `password` | No |
| `POST` | `/login/google` | Sign in with a Google ID token | No |
| `POST` | `/login/google/link` | Link Google sign-in to an existing account using its password | No |
| `POST` | `/login/google/new-user` | Finish Google sign-up with `username`, `password`, and recovery details | No |
| `GET` | `/login/me` | Get the authenticated user's profile | Yes |
| `GET` | `/notes/get-notes` | List PDF note details, newest first (without file contents) | Yes |
| `GET` | `/notes/get-notes/:userId` | List a user's PDF note details (without file contents) | Yes |
| `GET` | `/notes/:noteId/document` | Fetch a note's PDF file | Yes |
| `GET` | `/notes/get-note/search/:searchTerm` | Search note titles and authors | Yes |
| `GET` | `/notes/:noteId` | Fetch a PDF note | Yes |
| `POST` | `/notes/upload` | Create a PDF note with a base64 `document` data URL and optional `title` | Yes |
| `PATCH` | `/notes/:noteId` | Update the owner's `title` and/or PDF `document` | Yes |
| `DELETE` | `/notes/:noteId` | Delete the authenticated user's note, or any note as an administrator | Yes |

PDF note documents must use a `data:application/pdf;base64,...` data URL and be no larger than 10 MB. Note lists omit the PDF contents; the document endpoint fetches a PDF only when opened. Passwords and recovery answers are stored as salted scrypt hashes. Note creation uses the authenticated account as the author; a client-supplied `uploadedBy` is not trusted.

Set the same Google OAuth web client ID as `GOOGLE_CLIENT_ID` in the server and
`REACT_APP_GOOGLE_CLIENT_ID` in the frontend. Add the frontend origin to that
OAuth client's authorized JavaScript origins.
