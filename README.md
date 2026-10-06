# URL Shortening Service API

A lightweight, high-performance RESTful API for shortening URLs, redirecting short links, and tracking access metrics. Built with **TypeScript**, **Express**, and **Neon Serverless PostgreSQL**, running on **Bun**.

This project implements the [roadmap.sh URL Shortening Service Project Challenge](https://roadmap.sh/projects/url-shortening-service).

---

## 🎯 Project Challenge & Goals

The challenge is to build a robust backend URL Shortener service capable of generating unique, short aliases for long URLs, handling redirects with minimal latency, and maintaining access statistics.

### Key Requirements
- **URL Shortening**: Generate unique short codes for long URLs.
- **Redirection**: Seamlessly redirect users visiting the short URL (`/:shortCode`) to the target destination.
- **CRUD Operations**: Endpoints to create, retrieve, update, and delete short URL records.
- **Analytics & Tracking**: Track and query the number of times each shortened URL is accessed.
- **Validation & Error Handling**: Validate incoming requests and return appropriate HTTP status codes (`200`, `201`, `400`, `404`, `500`).

### Technical Challenges & Solutions
1. **Short Code Generation & Collisions**:
   - Short codes are generated using alphanumeric character sets (`[A-Za-z0-9]`).
   - To prevent duplicate codes, unique constraints are enforced in the database.
2. **Access Count Concurrency**:
   - Hits are recorded atomically (`SET access_count = access_count + 1`) during redirection to avoid race conditions.
3. **Database Performance**:
   - Queries look up records by `short_code`. Enforcing an index/unique constraint on `short_code` ensures `O(1)` or logarithmic retrieval performance.
4. **Serverless Database Connectivity**:
   - Uses `@neondatabase/serverless` over HTTP/WebSockets to ensure connection pooling and resilient serverless database interactions.

---

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.com/) (also compatible with Node.js)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Framework**: [Express 5](https://expressjs.com/)
- **Database**: [Neon](https://neon.tech/) (PostgreSQL Serverless)
- **Logger**: [Morgan](https://github.com/expressjs/morgan)
- **Dev Runner**: [tsx](https://github.com/privatenumber/tsx) / Bun watch

---

## 🗄️ Database Schema

The service relies on a PostgreSQL `url` table. Run the following SQL query to initialize the table:

```sql
CREATE TABLE IF NOT EXISTS url (
    id SERIAL PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(50) UNIQUE NOT NULL,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_url_short_code ON url(short_code);
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have installed:
- [Bun](https://bun.sh/) (v1.0+) or [Node.js](https://nodejs.org/) (v18+)
- A [Neon PostgreSQL](https://neon.tech/) database instance (or any PostgreSQL database)

---

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/saroto/shorten-url.git
   cd shorten-url
   ```

2. **Install dependencies:**
   Using Bun:
   ```bash
   bun install
   ```
   Or using npm:
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your database connection string and application settings:
   ```env
   DATABASE_URL="postgres://username:password@ep-example.neon.tech/neondb?sslmode=require"
   BASE_URL="http://localhost:3000"
   ```

4. **Verify database connection:**
   Once the server is started, you can verify your database connectivity by hitting `/db`.

---

### Running the Application

- **Development mode (with auto-reload):**
  ```bash
  bun run dev
  # or
  npm run dev
  ```

- **Direct start with Bun:**
  ```bash
  bun run index.ts
  ```

The server will start on port `3000` (accessible at `http://localhost:3000`).

---

## 📡 API Endpoints

### 1. Health / DB Check
Check if the database connection is functioning.
- **Method**: `GET`
- **Endpoint**: `/db`
- **Response**: `200 OK`
  ```json
  {
    "version": "PostgreSQL 17.x ..."
  }
  ```

---

### 2. Create Short URL
Generates a new shortened URL for a provided target URL.
- **Method**: `POST`
- **Endpoint**: `/shorten`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "url": "https://www.example.com/very/long/url/path"
  }
  ```
- **Response**: `200 OK` / `201 Created`
  ```json
  {
    "data": [
      {
        "id": 1,
        "original_url": "https://www.example.com/very/long/url/path",
        "short_code": "aB3dE8fK...",
        "access_count": 0,
        "created_at": "2026-10-06T06:00:00.000Z"
      }
    ],
    "message": "Short URL created successfully"
  }
  ```

---

### 3. Retrieve Short URL Info
Retrieve metadata for a shortened URL without triggering a redirect or increasing access count.
- **Method**: `GET`
- **Endpoint**: `/shorten/:shortCode`
- **Response**: `200 OK`
  ```json
  {
    "data": [
      {
        "id": 1,
        "original_url": "https://www.example.com/very/long/url/path",
        "short_code": "aB3dE8fK...",
        "access_count": 0
      }
    ],
    "message": "Short URL retrieved successfully"
  }
  ```
- **Error**: `404 Not Found` if short code doesn't exist.

---

### 4. Redirect to Original URL
Navigating to this route automatically increments `access_count` by 1 and redirects to the original URL.
- **Method**: `GET`
- **Endpoint**: `/:shortCode`
- **Response**: `302 Found` (Redirects to original URL)
- **Error**: `404 Not Found` if short code doesn't exist.

---

### 5. Update Short URL
Update the original destination URL associated with an existing short code.
- **Method**: `PUT`
- **Endpoint**: `/shorten/:shortCode`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "url": "https://www.example.com/new-destination"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "data": [
      {
        "id": 1,
        "original_url": "https://www.example.com/new-destination",
        "short_code": "aB3dE8fK..."
      }
    ],
    "message": "Short URL updated successfully"
  }
  ```
- **Error**: `400 Bad Request` if short code does not exist or URL is missing.

---

### 6. Delete Short URL
Remove an existing short code from the database.
- **Method**: `DELETE`
- **Endpoint**: `/shorten/:shortCode`
- **Response**: `200 OK`
  ```json
  {
    "data": [...],
    "message": "Short URL deleted successfully"
  }
  ```
- **Error**: `404 Not Found` if short code doesn't exist.

---

### 7. Get Access Statistics
Retrieve the access count for a specific short code.
- **Method**: `GET`
- **Endpoint**: `/shorten/:shortCode/access-count`
- **Response**: `200 OK`
  ```json
  {
    "data": [
      {
        "id": 1,
        "original_url": "https://www.example.com/new-destination",
        "short_code": "aB3dE8fK...",
        "access_count": 5
      }
    ],
    "message": "Access count retrieved successfully"
  }
  ```
- **Error**: `404 Not Found` if short code doesn't exist.

---

## 🧪 Example cURL Requests

```bash
# 1. Create short URL
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}'

# 2. Get URL info
curl http://localhost:3000/shorten/<SHORT_CODE>

# 3. Test redirection & hit counter (follow redirect with -L)
curl -L http://localhost:3000/<SHORT_CODE>

# 4. Check access count
curl http://localhost:3000/shorten/<SHORT_CODE>/access-count

# 5. Update target URL
curl -X PUT http://localhost:3000/shorten/<SHORT_CODE> \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com"}'

# 6. Delete short URL
curl -X DELETE http://localhost:3000/shorten/<SHORT_CODE>
```

---

## 📄 License

ISC / MIT
