# SmartMaintain Frontend (Web & Mobile)

The frontend application provides a highly responsive, role-based user interface for SmartMaintain.

## Overview
It is built to operate as both a standard web application and a native Android mobile application. The UI dynamically adapts its layout (sidebars vs. bottom navigation, grids vs. stacked cards) based on the device screen size.

## Technical Details
- **Framework:** Angular 22, TypeScript
- **Styling:** TailwindCSS, SCSS
- **Mobile Runtime:** Capacitor 8

## Key Scripts
- `npm start` - Run the local web development server (`http://localhost:4200`)
- `npm run build` - Compile the production Angular bundle
- `npx cap sync android` - Sync web assets into the Android native project

## Android Build
To build the APK after syncing:
```bash
cd android
.\gradlew.bat assembleDebug
```
