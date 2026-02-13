# Development Setup Guide

Complete guide to setting up the Swordfighters development environment from a fresh clone. Covers macOS, Windows, and Linux.

## Prerequisites

You need three things installed before starting:

1. **Node.js 20+** and **npm 10+**
2. **Docker** and **Docker Compose**
3. **Git**

### Installing Prerequisites

<details>
<summary><strong>macOS</strong></summary>

**Node.js** (pick one method):

```bash
# Option A: Homebrew (recommended)
brew install node@20

# Option B: nvm (if you manage multiple Node versions)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20
nvm use 20
```

**Docker Desktop**:

Download from https://www.docker.com/products/docker-desktop/ and install the `.dmg`. Docker Compose is included.

Alternatively with Homebrew:
```bash
brew install --cask docker
```

After installing, **open Docker Desktop at least once** — it needs to finish initial setup before `docker` commands work in your terminal.

</details>

<details>
<summary><strong>Windows</strong></summary>

**Node.js**:

Download the LTS installer from https://nodejs.org/ (pick the 20.x or newer LTS). Run the `.msi` and check "Automatically install necessary tools" when prompted.

Alternatively with [nvm-windows](https://github.com/coreybutler/nvm-windows):
```powershell
nvm install 20
nvm use 20
```

**Docker Desktop**:

1. Enable WSL 2 first (if not already):
   ```powershell
   wsl --install
   ```
   Restart your machine after this.

2. Download Docker Desktop from https://www.docker.com/products/docker-desktop/ and run the installer. Choose "Use WSL 2 instead of Hyper-V" when prompted.

3. **Open Docker Desktop at least once** after installing.

**Important**: Run all commands in PowerShell, Git Bash, or WSL 2 — not Command Prompt (cmd.exe). Git Bash is recommended for the closest experience to macOS/Linux.

</details>

<details>
<summary><strong>Linux (Ubuntu/Debian)</strong></summary>

**Node.js**:

```bash
# Using NodeSource (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

**Docker and Docker Compose**:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add your user to the docker group (avoids needing sudo for docker commands)
sudo usermod -aG docker $USER

# Log out and back in for the group change to take effect, then verify:
docker run hello-world
```

Docker Compose v2 is included with modern Docker installations. Verify with `docker compose version`.

</details>

### Verify Prerequisites

Run these before proceeding — all four must succeed:

```bash
node --version   # Should print v20.x.x or higher
npm --version    # Should print 10.x.x or higher
docker --version # Should print Docker version 24.x or higher
docker compose version  # Should print v2.x.x or higher
```

If `docker compose version` fails but `docker-compose --version` works, you have the legacy standalone version — that's fine, just use `docker-compose` instead of `docker compose` in all commands below.

---

## Step 1: Clone and Create Environment Files

```bash
git clone <repo-url>
cd swordfighters-fullstack
```

Create all four `.env` files. Each service needs its own:

```bash
# Root (used by Docker Compose)
cp .env.example .env

# Backend API
cp backend/.example.env backend/.env

# Admin frontend
cp admin-frontend/.example.env admin-frontend/.env

# User frontend
cp frontend/.example.env frontend/.env
```

### Fix the Backend `.env` (Required)

The `backend/.example.env` ships with placeholder passwords that don't match the Docker defaults. Open `backend/.env` and make sure the passwords match what's in the root `.env`:

```dotenv
POSTGRES_PASSWORD=dev_password_change_in_production
DATABASE_URL="postgresql://swordfighters:dev_password_change_in_production@localhost:5432/swordfighters_db?schema=public"
REDIS_PASSWORD=dev_redis_password
REDIS_URL="redis://:dev_redis_password@localhost:6379"
```

If you changed passwords in the root `.env`, use those same values here.

### Fix the Frontend `.env` (Required)

The `frontend/.example.env` ships with `NUXT_PUBLIC_API_BASE=http://localhost:3000` which points the frontend at itself instead of the backend. Open `frontend/.env` and fix it:

```dotenv
NUXT_PUBLIC_API_BASE=http://localhost:3001
```

---

## Step 2: Start Docker Services (PostgreSQL + Redis)

```bash
docker compose up -d
```

Wait for both containers to become healthy:

```bash
docker compose ps
```

You should see both `swordfighters-postgres` and `swordfighters-redis` with status `healthy`. This can take 10-30 seconds on first run while images download.

**If containers are not healthy after 60 seconds**, check logs:
```bash
docker compose logs postgres
docker compose logs redis
```

### Common Docker Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Port 5432 already in use | Local PostgreSQL running | Stop it: `brew services stop postgresql` (macOS) or `sudo systemctl stop postgresql` (Linux) or change `POSTGRES_PORT` in `.env` |
| Port 6379 already in use | Local Redis running | Stop it: `brew services stop redis` (macOS) or `sudo systemctl stop redis` (Linux) or change `REDIS_PORT` in `.env` |
| Permission denied | Docker not running or user not in docker group | **macOS/Windows**: Open Docker Desktop. **Linux**: `sudo usermod -aG docker $USER` then log out/in |
| Cannot connect to Docker daemon | Docker Desktop not started | Open Docker Desktop and wait for it to finish starting |

### Verify Database Connectivity

```bash
# PostgreSQL
docker exec swordfighters-postgres pg_isready -U swordfighters

# Redis
docker exec swordfighters-redis redis-cli ping
```

PostgreSQL should print "accepting connections". Redis should print "PONG".

---

## Step 3: Set Up the Backend

```bash
cd backend
npm install
```

Then run these three commands in order — each depends on the previous:

```bash
# 1. Generate the Prisma client (creates the DB query library)
npm run prisma:generate

# 2. Run database migrations (creates tables)
npm run prisma:migrate

# 3. Seed sample data (admin user, categories, products)
npm run prisma:seed
```

**Expected seed output:**
```
🌱 Starting database seed...
✅ Admin user created: admin@swordfighters.com
✅ Created 4 categories
✅ Created 24 products
✅ Created 5 reviews
✨ Seeding complete!
```

### Common Backend Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| `Can't reach database server` | Docker not running or wrong DATABASE_URL | Verify `docker compose ps` shows healthy postgres, and `backend/.env` has correct password |
| `ECONNREFUSED 127.0.0.1:5432` | Same as above | Same as above |
| `P1001: Authentication failed` | Password mismatch between `.env` files | Make sure `POSTGRES_PASSWORD` in `backend/.env` matches the root `.env` |
| `prisma: command not found` | npm install didn't finish | Re-run `npm install` in the backend directory |

Start the backend:

```bash
npm run dev
```

Verify it's running:
```bash
curl http://localhost:3001/health
```

Should return `{"status":"ok","database":"connected","redis":"connected",...}`.

Leave this terminal running and open new terminals for the frontends.

---

## Step 4: Set Up the Admin Frontend

In a new terminal:

```bash
cd admin-frontend
npm install
npm run dev
```

Open http://localhost:3002 in your browser.

**Default admin login**: `admin@swordfighters.com` / `Admin123!`

---

## Step 5: Set Up the User Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Verify Everything Works

| Service | URL | What to Check |
|---------|-----|---------------|
| Backend API | http://localhost:3001/health | Returns JSON with `"status":"ok"` |
| User Frontend | http://localhost:3000 | Page loads, shows product catalog |
| Admin Frontend | http://localhost:3002 | Page loads, shows login screen |

---

## Running Tests

Each project has its own test suite. Run from the respective directory:

```bash
# Backend tests
cd backend && npm test

# Admin frontend tests
cd admin-frontend && npm test

# User frontend tests
cd frontend && npm test

# With coverage report
npm run test:coverage
```

---

## Stopping Everything

```bash
# Stop the Node.js dev servers
# Ctrl+C in each terminal

# Stop Docker services (keeps data)
docker compose down

# Stop Docker services AND delete all data (fresh start)
docker compose down -v
```

---

## Port Reference

| Service | Port | Purpose |
|---------|------|---------|
| User Frontend | 3000 | Nuxt dev server |
| Backend API | 3001 | Fastify server |
| Admin Frontend | 3002 | Nuxt dev server |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache and sessions |

---

## Troubleshooting

### "Module not found" errors after pulling new code

```bash
# In whichever project has the error:
rm -rf node_modules
npm install
```

On Windows (PowerShell):
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### Prisma schema out of sync after pulling new code

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### Reset the database completely

```bash
docker compose down -v
docker compose up -d
# Wait for healthy status, then:
cd backend
npm run prisma:migrate
npm run prisma:seed
```

### Windows: Line ending issues

If you see errors about unexpected tokens or `\r`, configure Git to use LF line endings:

```bash
git config core.autocrlf input
git rm --cached -r .
git reset --hard
```

### Windows: Node-gyp build failures

Some npm packages need native compilation. Install build tools:

```powershell
npm install -g windows-build-tools
```

Or install Visual Studio Build Tools from https://visualstudio.microsoft.com/visual-cpp-build-tools/ (select "Desktop development with C++").

### macOS: Xcode Command Line Tools

If `npm install` fails with compilation errors:

```bash
xcode-select --install
```

### Linux: Permission errors with Docker volumes

```bash
sudo chown -R $USER:$USER ~/.docker
```
