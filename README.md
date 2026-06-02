# VYRA

VYRA (Visual Workflow & Resource Architecture) is a comprehensive, local-first productivity application designed to help you manage projects, tasks, notes, and resources seamlessly.

## 🚀 Features

- **Local-First Architecture:** All data is securely stored directly on your device using IndexedDB, guaranteeing ultra-fast load times and full offline capability.
- **Projects & Kanban:** Visualize your workflows with interactive drag-and-drop Kanban boards.
- **Rich Notes & Journals:** A powerful Markdown editor (powered by TipTap) for documentation, meeting notes, and daily journaling.
- **Library & Assets:** Store, preview, and manage your files and reference materials directly in the app.
- **Built-in Timer:** integrated Pomodoro and Flow timers that automatically log time against your tasks.
- **Progressive Web App (PWA):** Installable on mobile and desktop platforms with offline support.
- **Customizable UI:** Beautiful glassmorphism UI built with Tailwind CSS, supporting dark modes and custom themes.

## 🛠️ Tech Stack

- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS + Lucide Icons
- **State Management:** Zustand
- **Database:** IndexedDB (Local-First)
- **Editor:** TipTap (Markdown)

## 📦 Getting Started

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/kew986/vyra.git
   cd vyra
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Production Build

To create a production-ready build:
```bash
npm run build
```
You can then preview the build locally using:
```bash
npm run preview
```

## 🔒 Security & Privacy
Vyra does not rely on external cloud databases. Your data is yours, stored exclusively in your local browser cache. 

## 📄 License
This project is open-source and available under the MIT License.
