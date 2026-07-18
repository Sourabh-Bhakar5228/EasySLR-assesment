# EasySLR - Systematic Literature Review Platform

EasySLR is a modern, full-stack web application designed to streamline the Systematic Literature Review (SLR) process for clinical and academic researchers. It allows teams to import large datasets of medical articles (like PubMed exports), manage review projects, and collaboratively filter and review literature based on inclusion/exclusion criteria.

## 🚀 Project Overview

The review process in clinical research is often tedious, relying on disconnected Excel spreadsheets and email chains. EasySLR provides a centralized workspace where organizations can:
- Create isolated **Organizations** and **Projects**.
- **Import up to 50,000+ articles** at once via Excel (`.xlsx`) with automated duplicate detection.
- **Review and screen** articles using an interactive, spreadsheet-like data grid with filtering, sorting, and pagination.
- Apply **Bulk Actions** to include/exclude multiple articles simultaneously.
- Track progress securely with **Role-Based Access Control** (RBAC).

---

## 🛠️ Tech Stack & Architecture

This project is built using a modern **Serverless Monolith** architecture, leveraging **Next.js 15 App Router** for both the frontend UI and backend Server Actions.

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (React 19) |
| **Styling** | Tailwind CSS v3, Lucide Icons, Shadcn-like Custom UI |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Authentication** | NextAuth.js (Credentials Provider + bcrypt) |
| **Excel Parsing** | SheetJS (`xlsx`) |
| **Testing** | Vitest (Mock-based RBAC tests & row-level parsing checks) |

### Architecture Highlights
- **Server Actions:** Replaces traditional API routes with tightly coupled, type-safe backend functions (`src/actions/*`).
- **Prisma Transactions:** Ensures database integrity. The Excel import flow batches insertions into chunks of 1,000 to prevent PostgreSQL connection timeouts on 50k+ row uploads.
- **Server-Side Scaling:** The literature review grid uses Next.js search parameters to perform high-performance server-side sorting, filtering, and page-level pagination (`skip`/`take`) directly in PostgreSQL.
- **Client/Server Component Split:** High-interactivity areas (like `ReviewTable`) use `"use client"` and trigger data re-fetching via React transitions (`useTransition`) for a smooth page-loading UX.

---

## 📂 Folder Structure

```text
easy-slr/
├── prisma/                   # Database schema & migrations
│   ├── schema.prisma         # Postgres Data Models
│   └── seed.ts               # Database seeding logic
├── src/
│   ├── actions/              # Next.js Server Actions (Backend Logic)
│   ├── app/                  # Next.js App Router (Pages & Layouts)
│   │   ├── (auth)/           # Login routes
│   │   ├── api/              # Route handlers (auth & dev-tools)
│   │   └── dashboard/        # Protected application routes
│   ├── components/           # Reusable UI Components
│   │   ├── articles/         # Review workspace components
│   │   ├── import/           # Excel upload components
│   │   └── ui/               # Base UI elements (Buttons, Inputs, Modals)
│   ├── lib/                  # Shared utilities (Prisma client, Auth config)
│   └── validators/           # Zod schemas for input validation
├── public/                   # Static assets
└── ...config files           # tailwind, typescript, eslint, next config
```

---

## 🗄️ Database Design

The schema enforces strict referential integrity with cascading deletes.

1. **User:** Core authentication model.
2. **Organization:** Represents a hospital or university.
3. **Project:** A specific literature review (e.g., "COVID-19 Vaccine Trials").
4. **ProjectMember:** A join table associating Users with Projects and defining their `ProjectRole` (OWNER vs REVIEWER).
5. **Article:** Represents a single clinical paper. Contains PubMed IDs, DOI, Title, Authors, and the review metadata (Status, Priority, Notes).

*Note: Deleting an Organization cascades to delete its Projects, which cascades to delete all its Articles and Members.*

---

## 🔒 Authentication & Authorization

- **Authentication:** Handled by `NextAuth.js`. Passwords are encrypted using `bcrypt`. Sessions are stored securely in HTTP-only cookies.
- **Authorization (RBAC):** Strict Role-Based Access Control is enforced at the Server Action level. Before any database mutation, the system verifies `ProjectMember` records and specifically asserts the `ProjectRole`.

### 👥 Default Seed Accounts (Credentials)

The database seed script (`prisma/seed.ts`) populates two default users with distinct roles. You can use these accounts to sign in and test the RBAC features:

| Role / Account Type | Email | Password | Project Role | Capabilities |
|---|---|---|---|---|
| **Admin / Owner** | `admin@easyslr.com` | `adminpassword123` | `OWNER` | Full management, imports, deletion |
| **Reviewer / User** | `reviewer@easyslr.com` | `password123` | `REVIEWER` | Reviewing, notes, filtering, status updates |

### 🛡️ Permission Matrix

**`OWNER`** (Admin / Project Owner)
- Create, Edit, and Delete Organizations
- Create, Edit, and Delete Projects
- Import Excel Datasets (up to 50,000+ articles)
- Bulk Delete Articles
- *(Plus all Reviewer capabilities)*

**`REVIEWER`** (Standard User)
- View Projects & Articles
- Search, Filter, and Sort data server-side
- Update Review Status & Priority
- Edit Article Notes
- Bulk Update Statuses
- Export filtered articles to CSV

**Security Measures:**
- Actions throw a strict `403 Forbidden` for unauthorized attempts.
- CSRF is mitigated via Next.js Action Tokens.
- XSS is prevented by React's native DOM sanitization.

## 💻 Setup Instructions & Database Management

### Prerequisites
- Node.js (v20+ recommended)
- Docker Desktop (for running PostgreSQL and pgAdmin)

### 1. Clone & Install
```bash
git clone <repo-url>
cd EasySLR
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/easyslr?schema=public"
NEXTAUTH_SECRET="a-very-secure-random-string-for-development"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Start Database (Docker)
We use Docker Compose to spin up a local PostgreSQL instance and pgAdmin:
```bash
docker compose up -d
```
This starts:
- **PostgreSQL Database:** Running on port `5432` (Username: `postgres`, Password: `postgres`, DB Name: `easyslr`).
- **pgAdmin (Database Web GUI):** Running on [http://localhost:5050](http://localhost:5050) (Login Email: `admin@easyslr.com`, Password: `adminpassword123`).

### 4. Database Schema Setup & Seeding
Once the database container is active, configure the schema and seed the initial test users:
```bash
# Push the Prisma schema structure to PostgreSQL
npx prisma db push

# Generate the client for querying
npx prisma generate

# Seed the database with default organizations, projects, and users
npx prisma db seed
```

### 5. Running Tests
Run the automated unit tests using Vitest:
```bash
npm run test
```

### 6. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser. You can log in using one of the pre-configured [Seed Accounts](#-default-seed-accounts-credentials) to test the corresponding user or admin workflows.

### 🛠️ Developer DB Tool (API Endpoints)
A utility route `/api/dev-db-tool` is exposed for easy development auditing and database resets:

- **Verify Database Health:**
  Visit in your browser or run a GET request:
  `GET http://localhost:3000/api/dev-db-tool?action=verify-db`
  *(Performs database audits like duplicate checking, cascade deletion validation, and lists current counts of records in the database).*

- **Reset & Reseed Database:**
  Visit in your browser or run a POST/GET request:
  `GET http://localhost:3000/api/dev-db-tool?action=clean-and-seed`
  *(Cleans organization, project, membership, and article data while preserving user accounts, then re-seeds the default projects).*

---

## ⚙️ Workflows

### 1. Excel Import Flow
- User drops an `.xlsx` file.
- Client uses SheetJS to parse the file into JSON in the browser.
- A preview is shown identifying valid vs. missing data.
- Payload is sent to the server. Due to sizes up to 10MB, the Next.js `bodySizeLimit` was increased.
- Server performs `O(1)` duplicate checking using Sets against existing PMIDs, then uses Prisma `createMany` in batches to insert the data cleanly.

### 2. Review Workspace & Server-Side Filtering
- Reviewers see a data table of imported articles.
- Sorting (Title, Year, Date Imported) and filtering (Status, Priority, Project, Year) are done at the database query level (`skip`/`take`/`orderBy`) by updating page-level URL query parameters.
- Page navigation is handled dynamically through React transitions (`useTransition`), displaying a premium loading overlay during query transitions.
- Inline dropdown updates (Status and Priority) occur instantly using optimistic state updates.
- **Reviewer Notes** can be saved directly for collaborative screening.
- **Saved Views (LocalStorage)** allows reviewers to save their active filter query combination (e.g. "Heart Disease Pending") with a custom name to load them instantly.
- **CSV Export:** Reviewers can click "Export CSV" to compile all active filtered articles (or selected ones) server-side and download them as a standard `.csv` file.

---

## 🤖 AI Usage

AI Assistants (Antigravity & Copilot) were utilized throughout the development cycle to:
1. Scaffold repetitive UI components and Tailwind layouts.
2. Formulate complex Prisma transactions (specifically the batching logic for the 50k row import).
3. Generate sample mock data and seed scripts for testing.
4. Refactor the grid workspace from client-side search/filters to a scalable server-side model.
5. Create unit tests covering row validation and RBAC guards.
6. Draft this architectural README and final QA reports.

---

## ⚖️ Tradeoffs & Future Improvements

**Tradeoffs Made:**
1. **Saved Views LocalStorage:** Stored in `localStorage` in the browser instead of the database. This allows fast, zero-migration storage that is scoped per browser session.
2. **Polling vs WebSockets:** Import summaries and status updates rely on Next.js path revalidation rather than real-time WebSockets to reduce infrastructure complexity.

**Future Improvements:**
1. **Database Saved Views:** Move saved views to the Postgres database to allow sharing them across team members.
2. **Full-Text Search:** Implement a dedicated search engine (like ElasticSearch or Postgres `tsvector`) for complex biomedical query matching across abstracts.


---
*Developed as a feature-complete submission for the EasySLR Engineering Assignment.*
