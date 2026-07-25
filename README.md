# KAHE Task Management System

KAHE-TMS is a role-based academic task management system for coordinating work between Admin, Dean, HOD, and Faculty users. The application supports department management, task assignment, faculty submissions, approval workflows, reports, completed tasks, notifications, and module-level access permissions.

## Project Overview

The system is designed for academic administration where tasks move through multiple responsibility levels:

- Admin manages users, departments, settings, permissions, and overall dashboard data.
- Dean creates and monitors institutional tasks, reviews HOD submissions, and finalizes work.
- HOD manages department-level work, assigns subtasks to faculty, reviews faculty submissions, and forwards completed work to the Dean.
- Faculty views assigned tasks, updates progress, and submits work for HOD review.

The project uses a Django REST API backend and a React frontend. Authentication is handled with JWT tokens, and the frontend stores sessions independently by role so Admin, Dean, HOD, and Faculty logins do not overwrite each other.

## Tech Stack

### Backend

- Python
- Django 5
- Django REST Framework
- Simple JWT authentication
- SQLite for local development
- PostgreSQL support for deployment
- WhiteNoise and Gunicorn for production serving

### Frontend

- React 18
- Vite
- React Router
- Axios
- Material UI
- Tailwind CSS

## Key Features

- Role-based dashboards for Admin, Dean, HOD, and Faculty.
- Independent login sessions for each role.
- User management with role, department, and password controls.
- Department management.
- Task creation, assignment, progress tracking, and workflow approvals.
- HOD-to-Faculty subtask assignment.
- Faculty task submission and HOD approval or rejection.
- Dean review for HOD-submitted tasks.
- Completed Tasks section for approved and finalized work.
- Reports section for workflow history and task reporting.
- Admin Settings module with User Access Management.
- Module permission controls for Access, View, Edit, and Delete.
- Sidebar Home module with child modules grouped underneath.
- Dashboard refresh support for latest backend data.
- Responsive, modern frontend styling.

## User Roles

### Admin

Admin users can manage the full system. Main responsibilities include:

- View the Admin dashboard.
- Refresh dashboard data.
- Create and manage users.
- Create and manage departments.
- Configure module access permissions for users.
- View tasks, reports, and completed work.

### Dean

Dean users coordinate institutional task flow. Main responsibilities include:

- View Dean dashboard cards.
- Create academic tasks.
- Track department workload.
- Review work submitted by HOD users.
- Approve or reject submitted work.
- View reports and completed tasks.

### HOD

HOD users manage department work. Main responsibilities include:

- View department dashboard data.
- Receive tasks assigned by the Dean.
- Assign subtasks to Faculty users.
- Review Faculty submissions.
- Approve Faculty work or send it back for changes.
- Submit completed department work to the Dean.

### Faculty

Faculty users complete assigned work. Main responsibilities include:

- View assigned subtasks.
- Update task progress.
- Submit completed work to the HOD.
- View completed tasks and relevant reports when permission is granted.

## Project Structure

```text
Task-Management-System/
├── backend/
│   ├── core/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── tms_project/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
├── render.yaml
└── README.md
```

## Prerequisites

Install the following before running the project:

- Python 3.10 or later
- Node.js 18 or later
- npm
- Git

For production deployment, use PostgreSQL or a managed database service such as Render PostgreSQL.

## Backend Setup

Open PowerShell in the project root:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

If PowerShell blocks virtual environment activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

You can also run Django commands directly with:

```powershell
.\venv\Scripts\python.exe manage.py runserver
```

The backend runs locally at:

```text
http://127.0.0.1:8000/
```

## Frontend Setup

Open a second PowerShell window in the project root:

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs locally at:

```text
http://127.0.0.1:5173/
```

## Environment Configuration

### Backend Environment Variables

The backend reads configuration from environment variables in `backend/tms_project/settings.py`.

Common variables:

```env
SECRET_KEY=replace-with-a-secure-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://user:password@host:port/database
```

Notes:

- If `DATABASE_URL` is not provided, the project uses local SQLite.
- To use MySQL without `DATABASE_URL`, set the MySQL variables below.
- For production, set `DEBUG=False`.
- For production, replace wildcard hosts and open CORS settings with the exact frontend and backend domains.

MySQL configuration:

```env
DB_ENGINE=mysql
MYSQL_DATABASE=tms_db
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
```

After configuring MySQL, run:

```powershell
cd backend
python manage.py migrate
```

### Frontend Environment Variables

Create `frontend/.env` for local development if needed:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/
```

For deployment, point this value to the hosted backend API:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api/
```

## Database and Migrations

Run migrations after installing backend dependencies:

```powershell
cd backend
python manage.py migrate
```

Create an administrator account:

```powershell
python manage.py createsuperuser
```

After creating the superuser, sign in through the app or Django admin and create the required Dean, HOD, and Faculty users.

## Running the Application

Start the backend:

```powershell
cd backend
.\venv\Scripts\python.exe manage.py runserver
```

Start the frontend:

```powershell
cd frontend
npm run dev
```

Then open:

```text
http://127.0.0.1:5173/login
```

## Main Routes

Frontend routes include:

- `/login`
- `/change-password`
- `/admin-dashboard`
- `/dean-dashboard`
- `/hod-dashboard`
- `/faculty-dashboard`
- `/tasks`
- `/completed-tasks`
- `/reports`
- `/settings`
- `/user-management`
- `/department-management`

Backend API routes include:

- `/api/token/`
- `/api/token/refresh/`
- `/api/users/`
- `/api/tasks/`
- `/api/subtasks/`
- `/api/submissions/`
- `/api/reports/`
- `/api/departments/`
- `/api/notifications/`
- `/api/user-module-permissions/`

## Usage Guide

### 1. Create Departments

Log in as Admin and create departments from Department Management. Departments are used when assigning users and tracking workload.

### 2. Create Users

Log in as Admin and create users for each role:

- Dean
- HOD
- Faculty

Assign departments where required.

### 3. Configure Module Permissions

Go to Admin Settings and open User Access Management.

For each user:

1. Select the user.
2. Select the modules they should access.
3. Enable or disable permissions for Access, View, Edit, and Delete.
4. Save the changes.

The selected modules appear in that user's sidebar after login.

### 4. Create and Assign Tasks

Dean users can create tasks and assign them to departments or HOD users. HOD users can divide work into subtasks and assign them to Faculty users.

### 5. Submit and Approve Work

Faculty users submit work to the HOD. HOD users review the submission and approve or reject it. Approved faculty work appears in the relevant completed or reporting sections. HOD users can then submit completed department work to the Dean for final review.

### 6. Review Reports and Completed Tasks

Reports show workflow history and task activity. Completed Tasks shows work that has reached an approved or finalized state.

## Build and Quality Checks

Run frontend linting:

```powershell
cd frontend
npm run lint
```

Build the frontend:

```powershell
cd frontend
npm run build
```

Check the Django project:

```powershell
cd backend
python manage.py check
```

Check for pending migrations:

```powershell
cd backend
python manage.py makemigrations --check --dry-run
```

## Deployment

This repository includes `render.yaml` for Render deployment.

Render services:

- `kahe-tms-db`: PostgreSQL database.
- `kahe-tms-backend`: Django backend served by Gunicorn.
- `kahe-tms-frontend`: Vite static frontend.

Backend build command:

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
```

Backend start command:

```bash
cd backend
gunicorn tms_project.wsgi:application
```

Frontend build command:

```bash
cd frontend
npm install
npm run build
```

Frontend publish directory:

```text
frontend/dist
```

Before production deployment, verify:

- `SECRET_KEY` is secure.
- `DEBUG` is set to `False`.
- `ALLOWED_HOSTS` contains the deployed backend domain.
- `VITE_API_BASE_URL` points to the deployed backend `/api/` URL.
- CORS is limited to trusted frontend domains.

## Troubleshooting

### Frontend Cannot Connect to Backend

Check `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/
```

Restart the Vite dev server after changing environment variables.

### Login Fails

Confirm that:

- The backend server is running.
- The user exists in the database.
- The user role is assigned correctly.
- The password is correct.
- `/api/token/` is reachable.

### Permission Changes Do Not Appear

After changing module permissions:

- Save the permissions in Admin Settings.
- Log out and log in again for the affected role if the sidebar still shows old data.
- Confirm the user has the Access permission enabled for the module.

### Database Tables Are Missing

Run:

```powershell
cd backend
python manage.py migrate
```

### Static Build Fails

Run:

```powershell
cd frontend
npm install
npm run build
```

Review any missing package or lint errors shown in the terminal.

## Maintenance Notes

- Keep backend dependencies in `backend/requirements.txt`.
- Keep frontend dependencies in `frontend/package.json`.
- Run migrations after changing Django models.
- Run frontend build checks before deployment.
- Keep role permissions synchronized with sidebar modules.
- Review reports and completed task flows after changing approval logic.

## License

This project is intended for KAHE academic task coordination. Add a license file if the repository will be distributed publicly.
