# EtharaTasks — Team Task Manager

A professional, full-stack project management application with role-based access control, multi-assignee task management, and a high-performance responsive UI.

## 🚀 Features

### **For Admins**
- **Project Control:** Create, update, and delete projects.
- **Team Management:** Add or remove members from specific projects.
- **Task Orchestration:** Create tasks with multiple assignees, set priorities (Low to Urgent), and track ETAs.
- **Global Visibility:** Search all tasks, filter by status, priority, or specific team members.
- **Password Reset:** Securely update passwords from the profile modal.

### **For Members**
- **Personal Dashboard:** View and manage assigned tasks across all projects.
- **Status Updates:** Update task status (Proposed, In Progress, Needs Review, Complete, On Hold) and add detailed notes.
- **Collaborative View:** Read-only access to other members' tasks within the same projects to coordinate better.
- **Mobile Friendly:** Fully responsive design with a slide-in hamburger menu for on-the-go tracking.

---

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Lucide Icons.
- **Backend:** Node.js, Express 5, Mongoose.
- **Database:** MongoDB (NoSQL).
- **Authentication:** JWT (JSON Web Tokens) with Bcrypt password hashing.
- **Styling:** Modular Vanilla CSS (Base/Components/Layout architecture).

---

## 🧪 Testing Credentials

To test the role-based features immediately, use the following credentials:

| Role | Email Address | Password |
|---|---|---|
| **Admin** | `admin@test.com` | `password123` |
| **Member** | `member1@test.com` | `password123` |

> **Note:** If these accounts are not yet created in your local database, simply sign up as a Member via the UI. To create an Admin, manually change the `role` field in your MongoDB collection to `ADMIN`.

---

## ⚙️ Installation & Local Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance

### 2. Clone and Install
```bash
git clone https://github.com/amritanshusinghh/Team-Task-Manager.git
cd Team-Task-Manager
npm run install
```

### 3. Environment Setup
Create a `.env` file in the `server` directory:
```env
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_random_secret_string
PORT=3000
```

### 4. Run Development Servers
```bash
# From the root directory
# This starts the backend and frontend simultaneously
npm run dev
```

---

## 🌐 Deployment (Railway)

This application is pre-configured for **Railway** using Nixpacks.

1. Connect your GitHub repository to Railway.
2. Add the following **Environment Variables** in the Railway dashboard:
   - `DATABASE_URL`: Your production MongoDB URI.
   - `JWT_SECRET`: A secure random string for signing tokens.
   - `NODE_ENV`: `production`
3. Railway will automatically execute the root `build` and `start` scripts.

---

## 📋 Assignment Requirements Checklist
- [x] Authentication (Signup/Login)
- [x] Project & Team Management
- [x] Task Creation & Multi-Assignee Support
- [x] Dashboard (Stats, Overdue, Filters)
- [x] REST APIs + MongoDB
- [x] Role-Based Access Control (Admin/Member)
- [x] Responsive Mobile View (Hamburger Menu)
- [x] Railway Deployment Ready
