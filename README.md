# 💈 BarberBook — Barbershop Appointment System

Full-stack booking system: **Django REST Framework** + **React** + **SQLite** (or PostgreSQL).

---

## 🚀 Quick Start (No Docker)

### 1. Backend

```bash
cd barbershop/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Set up database and seed default data
python manage.py migrate
python manage.py seed_data

# Start backend
python manage.py runserver
```

> Uses **SQLite by default** — no database setup needed. A `db.sqlite3` file is created automatically.

### 2. Frontend

Open a **second terminal**:

```bash
cd barbershop/frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## 🔐 Default Admin Login

| Field    | Value        |
|----------|--------------|
| Username | `admin`      |
| Password | `Admin1234!` |

Click **Sign In** on the navbar and use these credentials to access the owner dashboard.

> Change the password anytime at `http://localhost:8000/admin`

---

## ✂️ Default Services (Auto-Loaded)

| Service              | Duration | Price  |
|----------------------|----------|--------|
| Haircut              | 30 min   | $25.00 |
| Beard Trim           | 20 min   | $15.00 |
| Haircut + Beard Trim | 45 min   | $35.00 |
| Kids Cut (Under 12)  | 20 min   | $15.00 |
| Shape Up / Edge Up   | 20 min   | $15.00 |
| Hot Towel Shave      | 30 min   | $20.00 |
| Full Service         | 60 min   | $50.00 |

Add/edit/remove services at `http://localhost:8000/admin`

---

## 👤 User Roles

| Role         | Access |
|--------------|--------|
| **Owner**    | Full dashboard, manage all bookings, add walk-ins, update statuses |
| **Barber**   | Same as owner |
| **Customer** | Book appointments (no account needed), view own bookings |

### Adding a Barber Account

```bash
# Make sure your venv is active, then:
cd barbershop/backend
python manage.py shell -c "
from accounts.models import User
u = User.objects.create_user('barber1', password='pass123')
u.role = 'barber'
u.first_name = 'John'
u.last_name = 'Doe'
u.save()
print('Done!')
"
```

### Re-running the Seed

```bash
python manage.py seed_data           # Safe — skips if data already exists
python manage.py seed_data --force   # Overwrites existing admin + services
```

---

## ⚙️ Shop Configuration

Edit `backend/barbershop/settings.py`:

```python
SHOP_CONFIG = {
    'OPEN_TIME':     '09:00',
    'CLOSE_TIME':    '18:00',
    'SLOT_DURATION': 30,             # minutes between booking slots
    'TOTAL_CHAIRS':  3,              # max concurrent appointments
    'WORKING_DAYS':  [0,1,2,3,4,5], # 0=Mon … 6=Sun (currently Mon–Sat)
}
```

---

## 🗄 Using PostgreSQL Instead of SQLite

Set these environment variables before running the backend:

```bash
export DB_HOST=localhost
export DB_NAME=barbershop_db
export DB_USER=postgres
export DB_PASSWORD=yourpassword
```

Then run `python manage.py migrate` and `python manage.py seed_data` as normal.

---

## 🔗 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments/slots/?date=YYYY-MM-DD&service_id=N` | Available time slots |
| GET | `/api/appointments/services/` | Services list |
| POST | `/api/appointments/bookings/` | Create booking (public) |
| GET | `/api/appointments/bookings/today/` | Today's schedule (staff) |
| GET | `/api/appointments/bookings/dashboard_stats/` | Dashboard stats (staff) |
| POST | `/api/auth/login/` | Get JWT tokens |
| POST | `/api/auth/register/` | Register customer account |


---

## ☁️ Deploying to Render (Free Hosting)

### Prerequisites
- A [Render account](https://render.com) (free)
- Your project pushed to a **GitHub repository**

### Step 1 — Push to GitHub

```bash
cd barbershop
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 2 — Deploy via Blueprint

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New → Blueprint**
3. Connect your GitHub repo
4. Render detects `render.yaml` and shows 3 services: `barberbook-api`, `barberbook-frontend`, `barberbook-db`
5. Click **Apply** — wait ~5 minutes for first deploy

### Step 3 — Link Frontend ↔ Backend

After both services finish deploying:

1. Copy your **backend URL** from the `barberbook-api` service page  
   e.g. `https://barberbook-api.onrender.com`

2. Go to `barberbook-frontend` → **Environment** → add:
   ```
   VITE_API_URL = https://barberbook-api.onrender.com
   ```
   Then click **Manual Deploy → Deploy latest commit**

3. Copy your **frontend URL**  
   e.g. `https://barberbook-frontend.onrender.com`

4. Go to `barberbook-api` → **Environment** → add:
   ```
   FRONTEND_URL = https://barberbook-frontend.onrender.com
   ```
   Render will redeploy automatically.

### Step 4 — Done ✅

Visit your frontend URL. Login with:
- **Username:** `admin`
- **Password:** `Admin1234!`

> ⚠️ **Free tier note:** Render free services spin down after 15 min of inactivity. First request after sleep takes ~30s to wake up. Upgrade to the $7/month plan to keep it always on.

### Custom Domain (Optional)

In your service's **Settings → Custom Domains**, add your domain and follow the DNS instructions.
