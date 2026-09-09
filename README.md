# 🚀 Dashboard App - Kanban & Budget Tracker

> A modern, responsive **Single-Page Application (SPA)** built from scratch with **Vanilla JavaScript (ES6+ Modules)**, **IndexedDB**, and robust custom algorithms.

---

## ✨ Key Features & Modules

### 📋 1. Kanban Board & Task Management

* **Task Workflow**
  Organize tasks seamlessly across three distinct columns:
  **For Execution**, **In Progress**, and **Finished**.

* **🖱️ Drag-and-Drop Mechanics**
  Intuitive card movement powered by the **HTML5 Drag-and-Drop API**, fully equipped with a **touch-screen polyfill** for mobile devices.

* **🔗 Task Dependencies & Locking**
  Establish smart **parent-child task relationships**.
  If a task depends on uncompleted predecessor items, the card automatically locks 🔒 and disables drag-and-drop until all requirements are met.

* **🔄 Circular Dependency Protection**
  Uses a robust **Depth-First Search (DFS)** algorithm backed by a custom **Stack** data structure to detect and block circular loops.

  Example:

  ```text
  Task A → Task B → Task A
  ```

  When a circular dependency is detected, the application provides descriptive path feedback:

  ```text
  LOOP: Task A → Task B → Task A
  ```

---

### 💰 2. Budget Tracker & Financial Analytics

* **💾 Local Data Persistence**
  Set an initial balance and securely log incoming or outgoing transactions using browser-native **IndexedDB**.

* **🏦 Smart Bank Statement Parser**
  Automatically parses raw **bank SMS text** or uploaded **text/CSV statements** using **Regular Expressions (RegEx)** to extract:

  * Amounts
  * Dates
  * Transaction types
  * Vendor titles

  It also cleans up vendor names automatically.

* **🧠 Fuzzy Duplicate Protection**
  Prevents accidental duplicate entries using the **Levenshtein Distance** algorithm.

  If a similar transaction appears on the same date with a matching amount — even with minor typos — the application prompts the user before saving.

* **🔎 Binary Search Date Lookup**
  Instantly locates financial records by date using an optimized **Binary Search** implementation designed specifically for **descending-sorted transaction logs**.

* **♾️ Infinite Scroll History**
  Transaction histories are rendered in optimized chunks of **20 items** to keep UI performance fast regardless of dataset size.

* **📊 Canvas Visualization**
  Real-time income-to-expense ratios are dynamically rendered using an **HTML5 Canvas Donut Chart**.

* **📈 Peak Activity - Sliding Window**
  Runs a **Sliding Window algorithm - `O(n)`** across customizable intervals:

  ```text
  7 transactions
  14 transactions
  30 transactions
  ```

  This identifies maximum earning and spending streaks efficiently.

* **💱 Multi-Currency Conversion Widget**
  Real-time currency conversion for:

  ```text
  EUR
  GBP
  RUB
  JPY
  ```

  Powered by **ExchangeRate-API**, with defensive network error handling and an **AbortController timeout**.

  The application gracefully falls back when the user is offline or the request times out.

---

### 🔍 3. Global Search & UI Navigation

* **⌨️ Global Command Search - `Ctrl + K`**
  Instantly search across both **tasks** and **transactions** using keyboard shortcuts or mouse navigation.

  Includes full **arrow-key list traversal**.

* **🧭 Hash-Based Client-Side Router**
  Lightweight SPA router supporting dynamic view switching without page reloads:

  ```text
  #home
  #kanban
  #budget
  ```

* **🌗 Theme Customization**
  Instantly switch between **Light Mode** and **Dark Mode**, with persistent state saved using `localStorage`.

* **📱 Responsive Layout**
  Clean CSS layout optimized for both:

  * 🖥️ Large desktop screens
  * 📱 Mobile devices

  Includes a functional **hamburger navigation menu**.

---

## 🛠️ Project Structure

```text
my-dashboard/
│
├── core/
│   ├── db.js             # IndexedDB wrapper and custom Stack implementation
│   ├── router.js         # Client-side hash router and dynamic DOM rendering
│   └── search.js         # Global search engine, keyboard navigation, and binary search
│
├── modules/
│   ├── budget/
│   │   └── budget.js     # Budget logic, analytics, parsers, charts, sliding window
│   │
│   └── kanban/
│       └── kanban.js     # Kanban board mechanics, drag-and-drop, DFS cycle check
│
├── public/               # Icons, graphics, and SVG assets
│
├── index.html            # Main entry HTML file
├── style.css             # Global styles, CSS variables, and responsive layout
├── reset.css             # Base CSS reset rules
└── .gitignore            # Git exclusion rules
```

---

## 🧠 Algorithms & Technical Highlights

### 🌲 Depth-First Search (DFS) + Custom Stack

Graph traversal implementation used to evaluate complex **task dependency paths** and prevent logical planning deadlocks.

---

### 🔠 Levenshtein Distance Matrix

A **Dynamic Programming** algorithm that calculates string edit distances for intelligent **duplicate transaction detection**.

---

### 🪟 Sliding Window Technique - `O(n)`

A **linear-time algorithm** used to calculate peak financial performance across configurable sliding transaction intervals.

---

### 📉 Binary Search on Descending Data - `O(log n)`

A **logarithmic-time search algorithm** adapted for efficiently finding transactions inside date-indexed, descending-sorted financial data.

---

### ⚡ Asynchronous IndexedDB Architecture

Native asynchronous database operations are handled cleanly through:

* **JavaScript Promises**
* **Transactional Object Stores**
* **IndexedDB**

This provides persistent browser-side storage without requiring a traditional backend database.

---

## 🚀 Getting Started & Running Locally

### 1️⃣ Clone the repository

```bash
git clone https://github.com/DavidIgnatiev/task-budget-tracker.git
```

### 2️⃣ Open the project

Open the project folder in your preferred code editor, such as **VS Code**.

### 3️⃣ Run the application

Start the project using a local development server.

For example, in **VS Code**, you can use the **Live Server** extension.

> ⚠️ A local development server is recommended because the application uses **ES6 module imports**, which may not work correctly when opening `index.html` directly from the file system.

---

## 🧩 Technologies Used

![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow?style=for-the-badge\&logo=javascript)
![HTML5](https://img.shields.io/badge/HTML5-HTML5-orange?style=for-the-badge\&logo=html5)
![CSS3](https://img.shields.io/badge/CSS3-CSS3-blue?style=for-the-badge\&logo=css3)
![IndexedDB](https://img.shields.io/badge/Database-IndexedDB-green?style=for-the-badge)
![Canvas](https://img.shields.io/badge/Graphics-HTML5%20Canvas-red?style=for-the-badge)

---

## 📌 Project Highlights

This project combines **front-end development**, **browser storage**, **data parsing**, **financial analytics**, and **algorithmic problem solving** into a single application.

### 💡 Main Focus Areas

**Frontend**

* Vanilla JavaScript
* HTML5
* CSS3
* Responsive Design
* SPA Architecture

**Data & Storage**

* IndexedDB
* localStorage
* CSV/Text Parsing
* Regular Expressions

**Algorithms**

* DFS
* Stack
* Levenshtein Distance
* Binary Search
* Sliding Window

**UI & UX**

* Drag & Drop
* Keyboard Navigation
* Command Search
* Dark / Light Themes
* Mobile Navigation

**External APIs**

* ExchangeRate-API

---

## ⭐ Why This Project?

The goal of this project was not simply to create another dashboard, but to build a **fully functional application from scratch** while applying real-world **JavaScript architecture, algorithms, browser APIs, data processing, and performance techniques**.

> **Built with Vanilla JavaScript. Built from scratch. Built to learn. 🚀**
