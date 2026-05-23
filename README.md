# 🎓 StudyCollab — Student Collaboration Platform

A real-time student collaboration platform built with React, Node.js, Express, MongoDB, and Socket.io.
full-stack web application built with MERN stack that helps students connect, collaborate and manage their academic work together.
About the Project
Students often struggle to coordinate group assignments and share resources easily. This platform provides a space where students can form groups, share materials and work together effectively — all in one place.
Features
Student login and registration
Create and join study groups
Share resources and materials within groups
View group members and activities
Real-time updates on group collaboration
Responsive design for all devices
Tech Stack
Layer
Technology
Frontend
React JS, JavaScript, CSS
Backend
Node.js, Express.js
Database
MongoDB
Runtime
Node.js

## ✨ Features
- 🔐 Register & Login with JWT authentication
- 👥 Create and join study groups
- 💬 Real-time group chat with Socket.io
- 📱 Fully responsive design

---

## 🛠️ Prerequisites

Make sure you have these installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (Community Edition)
- npm (comes with Node.js)

---

## 🚀 Setup & Run (Step by Step)

### Step 1: Start MongoDB

**Windows:**
```
net start MongoDB
```
Or open MongoDB Compass and connect to `mongodb://localhost:27017`

**Mac:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

---

### Step 2: Setup Backend

Open a terminal and run:

```bash
cd student-collab/backend
npm install
npm run dev
```

You should see:
```
MongoDB connected
Server running on port 5000
```

---

### Step 3: Setup Frontend

Open a **new terminal** and run:

```bash
cd student-collab/frontend
npm install
npm start
```

Your browser will open at **http://localhost:3000** 🎉

---

## 📁 Project Structure

```
student-collab/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema
│   │   ├── Group.js         # Study group schema
│   │   └── Message.js       # Chat message schema
│   ├── routes/
│   │   ├── auth.js          # Register & Login routes
│   │   ├── groups.js        # CRUD for study groups
│   │   └── messages.js      # Fetch chat history
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── .env                 # Environment variables
│   ├── package.json
│   └── server.js            # Main server + Socket.io
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── context/
        │   └── AuthContext.jsx   # Global auth state
        ├── pages/
        │   ├── Login.jsx         # Login page
        │   ├── Register.jsx      # Register page
        │   ├── Dashboard.jsx     # Browse & join groups
        │   └── ChatRoom.jsx      # Real-time chat
        ├── App.jsx               # Routes
        ├── App.css               # Global styles
        └── index.js              # Entry point
```

---

## 🔧 Environment Variables

The `.env` file in `/backend` contains:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/student-collab
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

Change `JWT_SECRET` to something secure before deploying!

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |

### Groups (requires JWT token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/groups | Get all groups |
| GET | /api/groups/my | Get my groups |
| POST | /api/groups | Create a group |
| POST | /api/groups/:id/join | Join a group |
| POST | /api/groups/:id/leave | Leave a group |
| GET | /api/groups/:id | Get group details |

### Messages (requires JWT token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/messages/:groupId | Get chat history |

---

## 🔌 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| join_room | Client → Server | Join a group chat room |
| leave_room | Client → Server | Leave a group chat room |
| send_message | Client → Server | Send a message |
| receive_message | Server → Client | Receive a message |

---

## 🚀 Deployment (Optional)

### Backend → Render.com
1. Push backend to GitHub
2. Create new Web Service on Render
3. Set environment variables in Render dashboard
4. Deploy!

### Frontend → Vercel
1. Push frontend to GitHub
2. Import to Vercel
3. Update API URLs from `localhost:5000` to your Render URL
4. Deploy!

---

## 🐛 Common Issues

**MongoDB not connecting?**
- Make sure MongoDB is running
- Check your MONGO_URI in `.env`

**CORS error?**
- Make sure backend is running on port 5000
- Frontend must run on port 3000

**Socket.io not connecting?**
- Make sure backend server is running first
- Check browser console for errors

---

## 💡 Future Features to Add
- [ ] User profiles with avatar
- [ ] File/resource sharing in groups
- [ ] Search and filter groups
- [ ] Notifications
- [ ] Dark/light mode toggle
- [ ] Message reactions (emoji)

---

Built with ❤️ for student collaboration
