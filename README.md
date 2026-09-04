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
* **Deployment:** Ubuntu Linux Virtual Machine / Dokploy / Netlify

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
git clone https://github.com/AungPyaeSoneUCS/AlumniNetworkUCS.git
cd AlumniNetworkUCS

```

**2. Install dependencies:**

```bash
npm install

```

**3. Configure Environment Variables:**
Create a `.env` (or `.env.local`) file in the root directory. Add your specific configuration keys. *(Note: Never commit your actual passwords or secrets to GitHub).*

```env
MONGODB_URI="mongodb://127.0.0.1:27017/AlumniNetworkDB"
NEXTAUTH_SECRET="your_secure_secret"
NEXTAUTH_URL="http://localhost:3000"
# Add other necessary variables (e.g., Pusher keys, Google OAuth credentials)

```

**4. Start the development server:**

```bash
npm run dev

```

Navigate to `http://localhost:3000` in your browser to view the application.

---

## 🌍 Complete Server Installation Guide (Ubuntu VM)

The following guide outlines how to deploy the application for production on an Ubuntu Virtual Machine.

### Step 1: Server Preparation

Ensure your Ubuntu Virtual Machine has all the foundational packages required for a modern Node.js application.

1. **Update the system and install core utilities:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nano ufw docker.io nginx

```


2. **Install Node.js and NPM:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

```


3. **Install PM2 globally (Daemon process manager):**
```bash
sudo npm install -g pm2

```



### Step 2: Database Setup (MongoDB via Docker)

Virtual Machine hypervisors often do not pass through AVX CPU instructions, causing standard native installations of MongoDB 5.0+ to crash immediately. Deploying MongoDB 4.4 using Docker is the most stable workaround for a VM environment.

1. **Enable and start the Docker service:**
```bash
sudo systemctl enable --now docker

```


2. **Deploy the MongoDB Container:**
```bash
sudo docker run --name local-mongo -d -p 27017:27017 --restart always mongo:4.4

```



### Step 3: Application Deployment

1. **Clone the Repository:**
```bash
cd ~
git clone https://github.com/AungPyaeSoneUCS/AlumniNetworkUCS.git
cd AlumniNetworkUCS

```


2. **Install Dependencies:**
```bash
npm install

```


3. **Configure Environment Variables:**
```bash
nano .env

```


*Ensure your database string points to the local Docker container (e.g., `MONGODB_URI="mongodb://127.0.0.1:27017/AlumniNetworkDB"`).*

### Step 4: Folder Permissions

For user uploads (like profile pictures) to work correctly, the web server needs explicit read and write access to your public directory.

```bash
sudo chmod -R 777 public/

```

*(Note: If you ever delete and recreate the public folder, you must run this command again).*

### Step 5: Process Management (PM2)

To avoid "ghost processes" and `EADDRINUSE` port 3000 conflicts, run the Next.js binary directly.

1. **Build the production application:**
```bash
npm run build

```


2. **Start the application:**
```bash
pm2 start ./node_modules/next/dist/bin/next --name "next-app" -- start

```


3. **Save the active process list:**
```bash
pm2 save
pm2 startup

```



### Step 6: Web Server & Reverse Proxy (NGINX)

Configure NGINX to handle web traffic securely and serve uploaded files directly from the disk.

1. **Create the NGINX Configuration:**
```bash
sudo nano /etc/nginx/sites-available/alumni.ucsh.edu.mm

```


2. **Paste the Server Block:**
```nginx
server {
    listen 443 ssl http2;
    server_name alumni.ucsh.edu.mm;

    # SSL Configuration 
    ssl_certificate /etc/ssl/certs/ucsh_fullchain.crt;
    ssl_certificate_key /etc/ssl/private/ucsh.key;

    # Main Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve user uploads directly from the disk for instant rendering
    location /uploads/ {
        alias /home/hinthadauser/AlumniNetworkUCS/public/uploads/;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}

# HTTP to HTTPS Redirect
server {
    listen 80;
    server_name alumni.ucsh.edu.mm;
    return 301 https://$host$request_uri;
}

```


3. **Enable and Restart NGINX:**
```bash
sudo ln -s /etc/nginx/sites-available/alumni.ucsh.edu.mm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

```



---

## 🔄 Standard Update Workflow

Whenever new code is merged into the GitHub repository, follow this workflow to update the live server cleanly and prevent cache conflicts.

1. **Navigate to the project directory:**
```bash
cd ~/AlumniNetworkUCS

```


2. **Pull the latest code:**
```bash
git pull origin main

```


*(Troubleshooting: If local files are overwritten, force the update with `git fetch --all` and `git reset --hard origin/main`).*
3. **Clean the cache and rebuild:**
```bash
rm -rf .next
npm run build

```


4. **Restart the application:**
```bash
pm2 restart next-app

```

## Update Project From Git to Server
### Step 1: Navigate to Your Project Folder

Log into your server via PuTTY and move into your application directory:

```bash
cd ~/AlumniNetworkUCS

```

### Step 2: Pull the Latest Code from GitHub

Download the new files you just uploaded to your repository:

```bash
git pull origin main

```

*(If your primary branch is named something else like `master`, use `git pull origin master` instead).*

### Step 3: Update Dependencies (Optional but Recommended)

If you added any new packages or libraries to your `package.json` file, you must install them on the server:

```bash
npm install

```

### Step 4: Clean and Rebuild the Application

To ensure Next.js doesn't use old, cached versions of your pages, it is best practice to delete the old build folder and compile a fresh one:

```bash
rm -rf .next
npm run build

```

### Step 5: Restart the Live Server

Tell PM2 to restart your application so it starts serving the newly built code:

```bash
pm2 restart next-app

```

### Step 6: Verify the Update

Check your process list to ensure the app is running smoothly and hasn't crashed (the `↺` restart counter should remain stable):

```bash
pm2 ls

```

Once `pm2 ls` shows the app is `online`, go to your live website and press **`Ctrl + F5`** to do a hard refresh. Your new code and files will now be live!

Did the build process complete successfully without any errors?


---

## 📬 Contact Information

We welcome your feedback, technical inquiries, and collaboration proposals. Please feel free to reach out through our official channels:

### 📧 Email Support

* **General Information:** `info.alumninetwork@gmail.com`

### 📞 Phone Support

For urgent matters or direct assistance, you may contact our team during business hours:

* **Support Line 1:** +95 9 674 000 113
* **Support Line 2:** +95 9 979 737 123
* **Administrative Line:** +95 9 423 876 886

---

*Developed for the University of Computer Studies, Hinthada (UCSH).*
