# 🩺 SmartCare AI
### Intelligent Online Doctor Consultation & Health Assistant
**B.Tech CSE Minor Project** – Full-Stack Web Application

---

## 📋 Project Overview

SmartCare AI is a complete full-stack healthcare consultation platform that connects patients with verified doctors online. It features appointment booking, digital prescriptions, and two AI-powered features using the **Google Gemini API**.

### Key Features
- **Patient Portal** – Register, find doctors, book appointments, view prescriptions
- **Doctor Portal** – Manage appointments, write digital prescriptions, set availability
- **Admin Panel** – Approve/reject doctors, view platform statistics
- **AI Symptom Checker** – Gemini-powered symptom analysis with specialist recommendation
- **AI Health Assistant** – Conversational health chatbot (Gemini API)
- **Digital Prescriptions** – Printable prescription system
- **JWT Authentication** – Secure role-based access (patient / doctor / admin)

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT + bcryptjs |
| AI | Google Gemini API (`gemini-1.5-flash`) |
| Icons | Font Awesome 6 |
| Fonts | Google Fonts (Inter) |

---

## 📁 Project Structure

```
smartcare-ai/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # Register, login, profile
│   ├── doctorController.js    # Doctor listing, profile, availability
│   ├── appointmentController.js
│   ├── prescriptionController.js
│   ├── aiController.js        # Gemini API integration
│   └── adminController.js
├── middleware/
│   ├── authMiddleware.js      # JWT verification
│   └── roleMiddleware.js      # Role-based authorization
├── models/
│   ├── User.js
│   ├── Doctor.js
│   ├── Appointment.js
│   ├── Availability.js
│   └── Prescription.js
├── routes/
│   ├── authRoutes.js
│   ├── doctorRoutes.js
│   ├── appointmentRoutes.js
│   ├── prescriptionRoutes.js
│   ├── aiRoutes.js
│   ├── adminRoutes.js
│   └── patientRoutes.js
├── public/
│   ├── css/
│   │   ├── style.css          # Public pages styles
│   │   └── dashboard.css      # Dashboard styles
│   ├── js/
│   │   ├── auth.js            # Shared auth helpers + toast
│   │   ├── patient.js         # Patient dashboard, doctors, booking
│   │   ├── doctor.js          # Doctor dashboard, prescriptions, availability
│   │   ├── appointments.js    # Appointment management
│   │   └── ai.js              # Symptom checker + chat
│   └── uploads/               # Profile image uploads
├── views/
│   ├── index.html             # Landing page
│   ├── login.html
│   ├── register.html
│   ├── doctor-register.html
│   ├── patient/
│   │   ├── dashboard.html
│   │   ├── doctors.html
│   │   ├── doctor-profile.html
│   │   ├── appointments.html
│   │   ├── symptom-checker.html
│   │   ├── health-assistant.html
│   │   ├── prescriptions.html
│   │   ├── medical-history.html
│   │   └── profile.html
│   ├── doctor/
│   │   ├── dashboard.html
│   │   ├── appointments.html
│   │   ├── prescription.html
│   │   ├── availability.html
│   │   ├── patients.html
│   │   └── profile.html
│   └── admin/
│       ├── dashboard.html
│       ├── doctors.html
│       └── users.html
├── server.js
├── seed.js                    # Demo data seeder
├── .env
├── .env.example
└── package.json
```

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** v18+ – [nodejs.org](https://nodejs.org)
- **MongoDB** – Local installation or [MongoDB Atlas](https://cloud.mongodb.com) (free tier)
- **Google Gemini API Key** – [aistudio.google.com](https://aistudio.google.com/app/apikey) (free)

---

### Step 1 – Clone / Download the Project

```bash
cd /path/to/your/projects
# if using git:
git clone <repo-url>
cd smartcare-ai
```

---

### Step 2 – Install Dependencies

```bash
npm install
```

---

### Step 3 – Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/smartcare-ai
JWT_SECRET=your_strong_secret_key_here
JWT_EXPIRE=7d
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
```

**Getting a Gemini API Key (free):**
1. Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key into your `.env` file

> The AI features work in demo mode even without a key – you'll get placeholder responses.

---

### Step 4 – Start MongoDB

**Local MongoDB:**
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Or use MongoDB Atlas** (cloud, no local installation needed):
- Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
- Get the connection string and paste it in `MONGODB_URI` in `.env`

---

### Step 5 – Seed Demo Data

```bash
npm run seed
```

This creates:
- 1 admin account
- 2 patient accounts
- 10 doctors across all specializations (with availability set)
- Sample appointments and a prescription

---

### Step 6 – Start the Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

Visit: **http://localhost:3000**

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smartcare.com | admin123 |
| Patient | patient@demo.com | demo123 |
| Patient | priya@demo.com | demo123 |
| Doctor (General Physician) | dr.sharma@demo.com | demo123 |
| Doctor (Cardiologist) | dr.patel@demo.com | demo123 |
| Doctor (Dermatologist) | dr.reddy@demo.com | demo123 |

> All 10 seeded doctors use password: `demo123`

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Patient registration |
| POST | `/api/auth/register-doctor` | Doctor registration |
| POST | `/api/auth/login` | Login (all roles) |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/profile` | Update patient profile |
| PUT | `/api/auth/change-password` | Change password |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List all approved doctors |
| GET | `/api/doctors/:id` | Doctor profile |
| GET | `/api/doctors/:id/slots?date=` | Available slots for a date |
| GET | `/api/doctors/me/dashboard` | Doctor dashboard stats |
| PUT | `/api/doctors/me/profile` | Update doctor profile |
| GET/POST | `/api/doctors/me/availability` | Manage availability |
| DELETE | `/api/doctors/me/availability/:day` | Remove a day |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments/patient` | Patient's appointments |
| GET | `/api/appointments/patient/stats` | Dashboard stats |
| GET | `/api/appointments/doctor` | Doctor's appointments |
| PATCH | `/api/appointments/:id/status` | Update status |

### Prescriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prescriptions` | Create prescription (doctor) |
| GET | `/api/prescriptions/patient` | Patient's prescriptions |
| GET | `/api/prescriptions/doctor` | Doctor's prescriptions |
| GET | `/api/prescriptions/:id` | Single prescription |

### AI (Gemini)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/symptom-check` | Symptom analysis |
| POST | `/api/ai/chat` | Health assistant chat |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/doctors` | All doctors |
| PATCH | `/api/admin/doctors/:id/verify` | Approve/reject doctor |
| GET | `/api/admin/patients` | All patients |
| GET | `/api/admin/appointments` | All appointments |

---

## 🎯 Complete Demo Workflow

1. **Register** as a patient at `/register`
2. **Login** at `/login` → redirected to Patient Dashboard
3. Open **AI Symptom Checker** → describe symptoms → get specialist recommendation
4. Click **Find Recommended Doctors** → filtered doctor list
5. **Select a doctor** → View Profile → **Book Appointment** (pick date + slot)
6. Appointment appears in **Patient Dashboard** and **Doctor Dashboard**
7. Login as doctor (dr.sharma@demo.com / demo123)
8. Go to **Appointments** → Confirm appointment → Mark Completed
9. Click **Write Prescription** → fill diagnosis + medicines → Save
10. Login as patient again → **My Prescriptions** → View printable prescription
11. Use **AI Health Assistant** for general health questions

---

## 🔒 Security

- Passwords hashed with **bcryptjs** (10 salt rounds)
- **JWT tokens** stored in localStorage, sent via Authorization header
- **Role-based middleware** on all protected routes
- Gemini API key **never exposed** to frontend (server-side only)
- Input validation on all forms
- Duplicate booking prevention via MongoDB unique index

---

## 📱 Responsive Design

The application is fully responsive:
- Desktop (1200px+)
- Laptop (992px–1199px)
- Tablet (768px–991px)
- Mobile (< 768px) – collapsible sidebar with hamburger menu

---

## 🤖 AI Features Note

- AI responses are for **general health information only**
- The AI does **not** diagnose conditions or prescribe medicines
- Emergency keywords trigger a warning to seek immediate help
- Without a Gemini API key, a demo response is returned

---

## 👨‍💻 Tech Highlights for Viva

1. **REST API design** with Express.js and proper HTTP methods
2. **Mongoose schemas** with virtual fields, pre-save hooks, compound indexes
3. **JWT authentication** with role-based authorization middleware
4. **Gemini API integration** – secure server-side proxy pattern
5. **Real-time slot availability** – prevents double booking with DB-level unique constraint
6. **Responsive CSS** with CSS variables and no frameworks
7. **Frontend-backend separation** with clean fetch() calls

---

*Built with ❤️ as a B.Tech CSE Minor Project*
# Minor_Project_Smartcare
