# SDJ Marine Inventory — React Native Mobile App

React Native (Expo SDK 52) mobile application for the SDJ Marine Inventory system.
Uses the same MongoDB Atlas backend as the web app.

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone **or** Android/iOS emulator

## Setup

```bash
cd mobileapp
npm install
```

## API Configuration

Edit `src/config/api.js` to point to your server:

| Target                  | BASE_URL                          |
|-------------------------|-----------------------------------|
| Android Emulator        | `http://10.0.2.2:5000/api`        |
| iOS Simulator           | `http://localhost:5000/api`       |
| Physical Device (LAN)   | `http://192.168.x.x:5000/api`     |

## Run

```bash
npm start          # Opens Expo Dev Tools
npm run android    # Android emulator
npm run ios        # iOS simulator (Mac only)
```

## Features

- **Login / Forgot Password** — same credentials as the web app; OTP via Gmail
- **Dashboard** — project counts, low-stock alerts, recent projects
- **Projects** — searchable list; tap to view stock received / used / returned
- **Inventory** — browse all items with low-stock status pills
- **Profile** — view user info, change password, sign out

## Project Structure

```
mobileapp/
├── App.js                        # Root component
├── app.json                      # Expo config
├── package.json
└── src/
    ├── config/api.js             # BASE_URL
    ├── contexts/AuthContext.js   # Auth state
    ├── navigation/AppNavigator.js
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── ForgotPasswordScreen.js
    │   ├── DashboardScreen.js
    │   ├── ProjectsScreen.js
    │   ├── ProjectDetailScreen.js
    │   ├── InventoryScreen.js
    │   └── ProfileScreen.js
    └── services/
        ├── api.js               # Axios client + JWT interceptor
        ├── authService.js
        ├── projectService.js
        └── inventoryService.js
```
