# Area Coverage Manager - Features & Configuration Guide

A real-time field visit and area coverage management web application built for distributors and field workers with instant synchronization across devices.

---

## 📋 1. Files & Database Structures Changed

### Files Modified & Created:
1. **/src/types.ts**:
   - Added `email`, `mobile` (India +91 format), `loginMethod` (`'both' | 'password' | 'google'`), `allocatedAreaIds` (multi-area allocation), `failedAttempts` (0-3), and `lockedUntil` (24-hour lockout timestamp) to `User`.
   - Added new activity actions: `PASSWORD_CHANGED`, `ACCOUNT_LOCKED`, `ACCOUNT_UNLOCKED`, `WORKER_UPDATED`.
2. **/src/utils/securityUtils.ts**:
   - `hashPassword(plainText)`: SHA-256 cryptographic hashing using Web Crypto API. Passwords are never stored in plain text.
   - `formatAndValidateMobile(input)`: Validates Indian 10-digit mobile numbers (+91 default country code).
   - `validateEmail(email)`: Standard RFC 5322 email syntax validation.
3. **/src/services/dataService.ts**:
   - `seedInitialDataIfNeeded()`: Safe migration function that preserves all existing records and backfills mobile numbers, emails, password hashes, and allocated areas without destroying data.
   - `authenticateWithPassword()`: Handles email/username + password login, tracks failed attempts, enforces a **24-hour lockout after 3 consecutive wrong attempts**, and resets failed attempts on success.
   - `authenticateWithGoogleAccount()`: Real Firebase Google Sign-In verification that validates the Google account against pre-registered user emails in the database. Disallows public registration. Allows Google login even if password login is temporarily locked.
   - `changeUserPassword()`: Verifies current password before allowing change, checks Google-only restrictions, securely hashes new password, and logs activity.
   - `unlockUserAccount()`: Allows Admin to unlock locked accounts and reset failed attempt counters.
   - `updateAdminProfile()`: Allows Admin to view and update their India (+91) mobile number and profile.
   - `addWorkerComplete()` / `updateWorkerComplete()`: Supports full worker attributes including full name, required Indian mobile number, email address, area allocations from existing active areas, and login method.
4. **/src/components/LoginPage.tsx**:
   - Supports Email & Password, Username & Password, and "Continue with Google".
   - Shows lockout notices and countdowns.
   - Includes 1-tap quick credential fill for testing.
5. **/src/components/ProfileModal.tsx**:
   - View account profile, mobile number, email, and allocated areas.
   - Allows users to change their password securely.
   - Allows Admin to view and update their mobile number.
6. **/src/components/AdminDashboard.tsx**:
   - Displays mobile numbers, emails, and allocated areas in the Workers directory.
   - Modal for Add/Edit worker with searchable multi-select for existing areas.
   - 1-click "Unlock" button for accounts locked out due to wrong password attempts.
7. **/src/components/WorkerDashboard.tsx**:
   - Displays worker mobile number and email in the top status bar.
   - Adds "My Allocated Areas" filter pill alongside existing filters.
   - Displays "My Area" tag on areas specifically allocated to the logged-in worker.

---

## 🔐 2. Google OAuth & Environment Configuration

The application uses Firebase Authentication (`signInWithPopup` via `googleProvider`) initialized with your existing `firebase-applet-config.json` (`projectId: dotted-momentum-fjq9c`, `oAuthClientId: 233927708229-be46r0brfb6c9qgoab82e0s77gttt91d.apps.googleusercontent.com`).

### To enable Google Sign-In in Firebase Console:
1. Open [Firebase Console](https://console.firebase.google.com/) $\rightarrow$ Select project `dotted-momentum-fjq9c`.
2. Go to **Build** $\rightarrow$ **Authentication** $\rightarrow$ **Sign-in method** tab.
3. Click **Add new provider** $\rightarrow$ Select **Google** $\rightarrow$ Enable it $\rightarrow$ Click **Save**.
4. In **Authentication** $\rightarrow$ **Settings** $\rightarrow$ **Authorized domains**, make sure your application's domain (e.g. `ais-dev-osj44wgz26nfh22rrjxtps-631841731708.asia-southeast1.run.app` or `localhost`) is added to the authorized domains list.

> **Zero Public Registration**: Google Sign-In only permits users whose email matches an account already registered by the Admin. Unregistered emails receive: *"Your account is not registered. Please contact Admin."*

---

## 👤 3. How to Create or Update Accounts

### Default Initial Accounts:
- **Admin**:
  - Username: `admin` or Email: `admin@distributor.com`
  - Password: `1234`
  - Mobile: `+91 9820011223`
- **Worker 1**:
  - Username: `rahul` or Email: `rahul.sharma@field.com`
  - Password: `1234`
  - Mobile: `+91 9833445566`
  - Allocated Areas: Andheri East, Borivali Station
- **Worker 2**:
  - Username: `amit` or Email: `amit.patel@field.com`
  - Password: `1234`
  - Mobile: `+91 9870123456`
  - Allocated Areas: Jogeshwari, Goregaon

### Creating a New Worker:
1. Log in as **Admin**.
2. Switch to **Admin View** $\rightarrow$ Click **Workers** tab $\rightarrow$ Click **[ Add Worker ]**.
3. Fill in:
   - **Full Name** (e.g., *Suresh Reddy*)
   - **Username** (e.g., *suresh*)
   - **Email Address** (e.g., *suresh@example.com*)
   - **Mobile Number** (e.g., *9876543210* — automatically formatted as `+91 9876543210`)
   - **Area Allocation** (Select one or more existing areas using the multi-select checklist)
   - **Login Method** (*Email/Password & Google*, *Password Only*, or *Google Only*)
   - **Password / PIN** (Default `1234`)
4. Click **[ Create Worker ]**.

### Editing an Existing Worker:
- Click **[ Edit ]** on any worker card in the Workers tab to update their mobile, email, area allocations, login method, or reset their password.

---

## 🧪 4. How to Test All New Features

1. **Email / Password Login**:
   - On the Login screen, enter `rahul.sharma@field.com` with password `1234`. Click **LOGIN WITH PASSWORD**.
   - You can also test with the username `rahul`.

2. **3-Wrong-Password Temporary 24-Hour Lockout**:
   - On the Login screen, enter `rahul` (or `rahul.sharma@field.com`).
   - Enter an incorrect password 3 times consecutively.
   - On attempt 1 & 2, it indicates remaining attempts (e.g. *2 attempts remaining before 24-hour lockout*).
   - On attempt 3, it locks the account for 24 hours and displays the exact unlock time.
   - Log in as **Admin**, go to **Workers**, locate Rahul's card (highlighted with a red **Locked** badge), and click **[ Unlock ]** to reset his failed attempts immediately.

3. **Google Login**:
   - Ensure your Google account email is registered under an Admin or Worker in the Workers directory.
   - Click **Continue with Google** $\rightarrow$ Select your Google account.
   - If registered and active, you log in instantly.
   - If not registered, the system informs you: *"Your account is not registered. Please contact Admin."*

4. **Change Password**:
   - Click the user's name or avatar in the top right header to open the **Account Profile Modal**.
   - Under **Change Password**, provide current password `1234`, new password, and confirm new password.
   - Click **Update Password**. The password is immediately hashed with SHA-256 and updated in Firestore.

5. **Admin Mobile Number**:
   - Log in as Admin $\rightarrow$ Click your profile avatar in the header.
   - Under **Update Admin Mobile Number**, enter a new India mobile number and click **Save Mobile**.

---

## ✅ 5. Feature Status Summary

| Feature | Implementation State | Configuration Needed |
| :--- | :--- | :--- |
| **Admin Mobile Number** | Fully implemented in database, UI, and profile modal. | None |
| **Worker Mobile Number** | Validated with India (+91) format on Add/Edit Worker and displayed on cards. | None |
| **Email & Password Login** | Fully implemented with SHA-256 hashing. | None |
| **3-Wrong-Attempt 24h Lockout** | Fully enforced on database with Admin 1-click unlock. | None |
| **Password Change** | Fully implemented with current password verification and Google-only restriction check. | None |
| **Area Allocations** | Multi-select existing areas, preserves schedules/history, adds "My Areas" filter. | None |
| **Google Sign-In** | Code completely wired to Firebase Auth `signInWithPopup`. | Enable Google provider in Firebase Console under Authentication. |
