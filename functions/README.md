Firebase Functions for Voquest

Prerequisites
- Node 18+ and npm
- Firebase CLI installed and logged in (firebase login)
- This project should be linked to the Firebase project used in the web app (firebase use --add)

Deploy
1. cd functions
2. npm install
3. firebase deploy --only functions

Local testing with emulator
1. cd functions
2. npm install
3. firebase emulators:start --only functions

Notes
- The HTTP function expects an Authorization: Bearer <ID_TOKEN> header and a JSON body with the progress payload.
- CORS is permissive for simple testing; restrict in production if needed.
