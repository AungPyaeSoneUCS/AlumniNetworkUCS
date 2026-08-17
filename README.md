# 🎓 UCSH Alumni Network

The **UCSH Alumni Network** is a comprehensive, full-stack digital platform designed to unite graduates of the University of Computer Studies, Hinthada. It provides a secure, centralized hub for alumni to network, share career opportunities, mentor students, and maintain lifelong connections with the university community.

---

## 🚀 Key Features

* **Secure Authentication:** Robust multi-factor authentication using OTP and OAuth (Google Login) powered by NextAuth.js.
* **Smart Alumni Directory:** Advanced filtering and search capabilities to find peers by graduation batch, academic major, or current career field.
* **Interactive Community Feeds:** Dedicated sections for sharing industry opportunities, academic mentorship, and university announcements.
* **Administrative Moderation:** Secure admin dashboard for faculty to validate new registrations via National Registration Card (NRC) cross-referencing and manage directory access.
* **Dual-Language & Theming:** Full interface localization for English and Myanmar (Burmese), along with seamless Light/Dark mode transitions.
* **Real-Time Connectivity:** Instant updates and notifications utilizing Pusher.

---

## 🛠 Technical Architecture

This project is built on a modern JavaScript/TypeScript ecosystem using the Next.js App Router.

* **Frontend:** Next.js 15 (App Router), React, TypeScript
* **Styling:** Tailwind CSS, PostCSS, Lucide React (Icons)
* **Backend:** Next.js Serverless API Routes, Node.js
* **Database:** MongoDB (Document-Oriented NoSQL) with Mongoose ODM
* **Authentication:** NextAuth.js, bcryptjs
* **Real-time Engine:** Pusher
* **Deployment:** Dokploy (Ubuntu Server) / Netlify

---

## 📋 System Flow

### 👨‍🎓 Alumni Workflow
1. **Registration:** Provide your UCSH student details and NRC.
2. **Verification:** Verify your identity via an OTP sent to your email.
3. **Engagement:** Once approved by an Admin, log in to update your professional profile, browse the directory, and interact with the community feeds.

### 🛡️ Administrative Workflow
1. **Access:** University faculty log in via a protected administrative route.
2. **Validation:** Cross-reference newly registered users with official university records.
3. **Moderation:** Oversee platform data, manage the user base, and update public university contact information.

---

## 💻 Installation & Local Setup

To run this project locally for development, ensure you have **Node.js** and **Git** installed.

**1. Clone the repository:**
```bash
git clone [https://github.com/AungPyaeSoneUCS/AlumniNetwork.git](https://github.com/AungPyaeSoneUCS/AlumniNetwork.git)
cd AlumniNetwork

```

**2. Install dependencies:**

```bash
npm install

```

**3. Configure Environment Variables:**
Create a `.env` (or `.env.local`) file in the root directory. Add your specific configuration keys. *(Note: Never commit your actual passwords or secrets to GitHub).*


```

**4. Start the development server:**

```bash
npm run dev

```

Navigate to `http://localhost:3000` in your browser to view the application.

---

## 📬 Contact Information

We welcome your feedback, technical inquiries, and collaboration proposals. Please feel free to reach out through our official channels:

### 📧 Email Support

* **General Information:** `info.alumninetwork[at]gmail.com`



### 📞 Phone Support

For urgent matters or direct assistance, you may contact our team during business hours:

* **Support Line 1:** +95 9 674 000 113
* **Support Line 2:** +95 9 979 737 123
* **Administrative Line:** +95 9 423 876 886

---

*Developed for the University of Computer Studies, Hinthada (UCSH).*
