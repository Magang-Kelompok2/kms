# Taxacore

A React + TypeScript + Vite learning dashboard with MinIO storage and PostgreSQL metadata support.

## What is included

- `frontend` React app in `src/`
- `backend` Express + TypeScript service in `backend/`
- MinIO object storage for PDFs, videos, and uploads
- PostgreSQL for metadata
- Docker Compose to run backend, MinIO, and PostgreSQL together
- DBeaver support for inspecting the PostgreSQL database

## Prerequisites

- Node.js 18 or newer
- npm 10 or newer
- Docker and Docker Compose
- DBeaver (optional, for database browsing)

## Local setup

1. Install frontend dependencies:

```bash
npm install
```

2. Run Docker Compose:

```bash
docker compose up --build
```

3. Open the React app:

```bash
npm run dev
```

4. Visit:

- Frontend: `http://localhost:5173`
- MinIO Console: `http://localhost:9001`
- Backend API: `http://localhost:4000`

## Backend service

The backend lives in `backend/` and exposes:

- `GET /api/health`
- `GET /api/materials`
- `POST /api/upload`

The backend stores files in MinIO and metadata in PostgreSQL.

## Environment variables

The project uses `.env` in the root with:

- `VITE_API_URL` for the frontend
- PostgreSQL credentials
- MinIO credentials

## Database connection for DBeaver

Use these values in DBeaver:

- Host: `localhost`
- Port: `5432`
- Database: `taxacore`
- User: `taxacore`
- Password: `secret`

## MinIO login

- URL: `http://localhost:9001`
- Access key: `minioadmin`
- Secret key: `minioadmin`

## API usage

### Upload file

Send a `multipart/form-data` POST request to `/api/upload` with fields:

- `file`  file upload
- `title`
- `classId`
- `type` (pdf / video / soal)
- `description` (optional)

### Fetch materials

Call `GET /api/materials`.

## Frontend integration

A minimal service has been added in `src/api/materialService.ts`.

Example:

```ts
import { fetchMaterials, uploadMaterial } from "./api/materialService";
```

The frontend reads `VITE_API_URL` from `.env`.

## Running the backend only

If you want to run just the backend:

```bash
cd backend
npm install
npm run dev
```

## Notes

- The backend auto-creates the `materials` table if it does not exist.
- The MinIO bucket is created automatically on startup.
- Use Docker Compose for the full local stack.
