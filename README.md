# 🏋️ Task Reminder PWA App

A lightweight and responsive Angular Progressive Web Application (PWA) designed to schedule and manage task reminders using native browser and Service Worker notifications.

---

## 🌟 Key Features

- **Dynamic Reminders Management:** Add, edit, and remove up to 5 individual reminders simultaneously.
- **Native Notification System:** Utilizes the Web Notification API and Service Worker for background push notifications.
- **Smart Form Validation:** Built-in safeguards using Reactive Forms to ensure accurate time and message inputs before submission.
- **Automatic Reset:** Uses Angular Signals to automatically reset and unlock the form once all active timers complete.
- **PWA & Mobile Ready:** Designed for seamless performance across desktop and mobile browsers.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** `v18.x` or higher
- **npm:** `v9.x` or higher
- **Angular CLI:** `v17.x` or higher

### Installation & Local Development

1. Clone the repository and navigate to the project root:

```bash
cd task-reminder-app
```

2. Install project dependencies:

```bash
npm install
```

3. Start the local development server:

```bash
npm start
# or
ng serve
```

4. Open your browser and navigate to:

```text
http://localhost:4200/
```

---

## 📦 Production Build & PWA Testing

Service Worker notifications and PWA features require a production build served over an HTTP server.

### Build the production bundle

```bash
npm run build
```

### Serve the production output locally

```bash
npx http-server dist/task-reminder-app/browser -a 127.0.0.1 -p 8080
```

### Open the PWA build

```text
http://127.0.0.1:8080
```

---

## 🧪 Running Unit Tests

Run the complete test suite using Jasmine and Karma:

```bash
# Run tests in watch mode
npm test

# Single test run (Headless/CI mode)
npm run test -- --watch=false
```

---

## 🛠️ Tech Stack

- **Framework:** Angular (Standalone Components, Signals, Reactive Forms)
- **PWA:** Service Worker (background notification delivery)
- **Testing:** Jasmine, Karma
- **Language:** TypeScript

---

## ⚠️ Notification Troubleshooting

- **Permissions:** Ensure notification permissions are granted for `localhost` or `127.0.0.1`.
- **Focus Assist / Do Not Disturb:** Disable Focus Assist (Windows) or Do Not Disturb (macOS/Android) while testing, as these features can suppress notification banners.
