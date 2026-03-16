# Social Controller

Task management platform where admins assign phone numbers to users and track account creation tasks (Gmail, Facebook, WhatsApp).

---

## Stack

**Backend** — Django 4.2 · DRF · PostgreSQL · simplejwt  
**Frontend** — Next.js 14 (App Router) · TypeScript · TailwindCSS · Shadcn UI · TanStack Query · Zustand · Axios

---

## Project Structure

```
social_controller/
├── backend/         Django project
├── frontend/        Next.js project
├── .env.example     Environment variable reference
└── README.md
```

---

## Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy and fill in the env file
cp ../.env.example .env

# Generate a Fernet key and set it in .env
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Run migrations and create superuser
python manage.py migrate
python manage.py createsuperuser

# Start server
python manage.py runserver
```

---

## Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local   # or edit .env.local directly
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Django Apps

| App           | Responsibility                              |
|---------------|---------------------------------------------|
| `users`       | Custom User model · JWT auth endpoints      |
| `tasks`       | PhoneNumber model · Task model              |
| `submissions` | AccountSubmission model (Fernet-encrypted)  |
| `analytics`   | Read-only aggregation dashboard endpoint    |
| `core`        | Pagination · Fernet encryption helpers      |

---

## API Endpoints

| Method     | Endpoint                           | Access |
|------------|------------------------------------|--------|
| POST       | /api/auth/login/                   | Public |
| POST       | /api/auth/register/                | Public |
| POST       | /api/auth/refresh/                 | Public |
| GET / POST | /api/users/                        | Admin  |
| GET        | /api/users/me/                     | Auth   |
| PATCH      | /api/users/{id}/                   | Admin  |
| GET / POST | /api/numbers/                      | Admin  |
| POST       | /api/numbers/assign/               | Admin  |
| PATCH      | /api/numbers/{id}/                 | Admin  |
| GET / POST | /api/tasks/                        | Admin  |
| GET        | /api/tasks/my/                     | User   |
| PATCH      | /api/tasks/{id}/                   | Admin  |
| POST       | /api/submissions/create/           | User   |
| GET        | /api/submissions/                  | Admin  |
| PATCH      | /api/submissions/{id}/approve/     | Admin  |
| PATCH      | /api/submissions/{id}/reject/      | Admin  |
| GET        | /api/analytics/dashboard/          | Admin  |

---

## User Roles

- **Admin** — full access to all management pages and the analytics dashboard  
- **User** — sees only their assigned tasks, opens the signup popup, submits account credentials

---

## Security Notes

- Account passwords stored encrypted with `cryptography.fernet` (symmetric AES) — set `FERNET_KEY` in `.env`
- JWT tokens expire in 1 hour; refresh tokens valid 7 days with rotation
- CORS restricted to `CORS_ALLOWED_ORIGINS`
- Rate limiting on auth endpoints via `django-ratelimit`
