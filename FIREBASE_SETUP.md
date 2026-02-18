# Firebase Setup - Manual Steps

I cannot access your private Google account or Firebase Console. You must generate the credentials yourself.

## Instructions

1.  **Open Firebase Console**: Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
2.  **Add Project**: Click "Add project" and follow the prompts (enable Analytics or not, it's optional).
3.  **Register App**:
    - Once the project is created, look for the **Web icon (`</>`)** on the dashboard.
    - Click it to "Add Firebase to your web app".
    - Nickname it (e.g., "PlacementApp").
    - Click **Register app**.
4.  **Copy Config**:
    - You will see a code block with `firebaseConfig`.
    - Copy the object that looks like this:
      ```javascript
      const firebaseConfig = {
        apiKey: "AIzaSy...",
        authDomain: "...",
        projectId: "...",
        storageBucket: "...",
        messagingSenderId: "...",
        appId: "..."
      };
      ```
5.  **Enable Authentication**:
    - Go back to the Console Dashboard.
    - Click **Build** -> **Authentication** (left sidebar).
    - Click **Get started**.
    - Select **Google** from the list of Sign-in providers.
    - Toggle **Enable**.
    - Set a support email and save.
6.  **Update Code**:
    - Open `src/firebase.ts` in your editor.
    - Replace the placeholder values with the real keys you copied in Step 4.

Once you have done this, the "Sign in with Google" button will work!
