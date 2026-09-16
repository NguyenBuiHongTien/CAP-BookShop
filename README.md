<div align="center">

# Bookshop — SAP CAP Full-Stack Project

Bookshop management application built with the **SAP Cloud Application Programming Model (CAP)**,
an **OData V4** backend, **SAP S/4HANA RAP** integration, and multiple frontend interfaces (**Fiori Elements + React**).

<br/>

<img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/SAP_CAP-CDS-0A6ED1?style=for-the-badge&logo=sap&logoColor=white" alt="SAP CAP" />
<img src="https://img.shields.io/badge/OData-V4-0070F2?style=for-the-badge&logo=openapiinitiative&logoColor=white" alt="OData V4" />
<img src="https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
<img src="https://img.shields.io/badge/Fiori_Elements-UI5-0A6ED1?style=for-the-badge&logo=sap&logoColor=white" alt="Fiori" />
<img src="https://img.shields.io/badge/S%2F4HANA-RAP-1B4F72?style=for-the-badge&logo=sap&logoColor=white" alt="RAP" />
<img src="https://img.shields.io/badge/SQLite-HANA-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="DB" />

</div>

---

## Table of Contents

- [Overview](#overview)
- [Demo Screenshots](#demo-screenshots)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [API Services](#api-services)
- [Frontend Applications](#frontend-applications)
- [System Requirements](#system-requirements)
- [Installation and Running](#installation-and-running)
- [S/4HANA Connection Configuration](#s4hana-connection-configuration)
- [Excel File Format](#excel-file-format)
- [API Testing](#api-testing)
- [Useful Scripts](#useful-scripts)
- [Security Notes](#security-notes)
- [Technologies](#technologies)

---

## Overview

This project simulates a **Bookshop** system with two main roles:

| Role | Description | Interface |
|--------|--------|-----------|
| **Admin** | Manage books, authors, and genres; import/export Excel; synchronize data from SAP RAP | Fiori Elements (`adminserviceui`) |
| **Customer** | Browse the catalog, search, and place orders (decrease stock) | React (`catalog`) or Fiori Elements (`project1`) |

The backend uses **SQLite** for local development and can be extended to SAP HANA or PostgreSQL for production deployments.

---

## Demo Screenshots

> Add screenshots to [`docs/images/`](docs/images/) and update the paths below before pushing to Git.

### Admin UI — Book Management

![Admin — Book list](docs/images/admin-books-list.png)
*Books List Report with Upload Excel, Load from ABAP, and Export Excel actions.*

![Admin — Author list](docs/images/admin-authors-list.png)
*Authors List Report with Upload Excel, Load from ABAP, and Export Excel actions.*

![Admin — Genre list](docs/images/admin-genres-list.png)
*Genres List Report with Upload Excel, Load from ABAP, and Export Excel actions.*

![Admin — Load from RAP](docs/images/admin-load-rap.png)
*Synchronize books from SAP S/4HANA RAP (ZUI_BOOK).*

### Catalog — Customer Interface (React)

![Catalog — Book list](docs/images/catalog-home.png)
*React catalog page with search, details, and ordering.*

![Catalog — Place an order](docs/images/catalog-order.png)
*Order form with real-time stock updates.*

### Fiori Elements — Browse Books

![Fiori — Browse Books](docs/images/fiori-browse-books.png)
*Fiori Elements application reading data from CatalogService.*


## Key Features

### Administration (AdminService)

- Full **CRUD** for `Authors`, `Books`, and `Genres` (with OData Draft support).
- **Upload books from Excel** — bulk import with automatic creation of missing authors.
- **Upload genres from Excel** — insert new genres or update the description of an existing genre with the same name.
- **Export books to Excel** — export selected rows or the rows currently displayed in the table.
- **Load from ABAP (RAP)** — retrieve books from the `ZUI_BOOK` OData service on SAP S/4HANA Cloud and insert them into the CAP database.
- **Data validation**: price from 1–111, stock ≥ 0, and valid author and genre selections are required.

### Catalog (CatalogService)

- **Read the book list** (read-only) with author and genre names.
- **Automatic discount**: books with `stock > 111` receive the `-- 11% discount!` suffix in their title.
- **Place orders** (`submitOrder`): decrease stock and return a 409 error when inventory is insufficient.

### External Integration

- Connect to **SAP S/4HANA Cloud** through the `ZUI_BOOK` OData V4 service (RAP backend).
- Use the **xlsx** library for Excel import/export.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
├──────────────────┬────────────────────┬─────────────────────────┤
│  adminserviceui  │     project1       │       catalog           │
│  (Fiori Elements)│  (Fiori Elements)  │   (React + Vite)        │
│  Admin CRUD      │  Browse Books      │   Storefront + Order    │
└────────┬─────────┴─────────┬──────────┴───────────┬─────────────┘
         │                   │                      │
         ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CAP Backend (Node.js)                       │
├──────────────┬──────────────┬──────────────┬──────────────────────┤
│ AdminService │CatalogService│ExportService│   UploadService     │
│   /admin     │   /browse    │   /export    │     /upload         │
└──────┬───────┴──────┬───────┴──────┬───────┴──────────┬─────────┘
       │              │              │                  │
       ▼              ▼              │                  │
┌──────────────┐ ┌──────────────┐     │                  │
│   SQLite     │ │   SQLite     │     │                  │
│  (db.sqlite) │ │  (shared)    │     │                  │
└──────────────┘ └──────────────┘     │                  │
                                      │                  │
       ┌──────────────────────────────┘                  │
       ▼                                                 │
┌──────────────────┐                                     │
│  SAP S/4HANA     │◄── getBooksFromRAP ─────────────────┘
│  ZUI_BOOK (RAP)  │     uploadBooksFromBase64
└──────────────────┘     uploadGenresFromBase64
                         exportBooksToExcel
```

---

## Project Structure

```
FPT/
├── app/
│   ├── adminserviceui/     # Fiori Elements — administration (Authors, Books, Genres)
│   │   └── webapp/
│   │       └── ext/          # Custom actions: Upload, Export, Load RAP
│   ├── project1/             # Fiori Elements — browse books (CatalogService)
│   ├── catalog/              # React storefront (Vite)
│   └── services.cds          # Import annotations from the applications
├── db/
│   ├── schema.cds            # Domain model
│   └── data/                 # CSV seed data
├── srv/
│   ├── admin-service.cds/js  # AdminService + getBooksFromRAP
│   ├── cat-service.cds/js    # CatalogService + submitOrder
│   ├── export-service.cds/js # Export Excel
│   ├── upload-service.cds/js # Upload Excel (Books & Genres)
│   ├── admin-contraints.cds  # Validation annotations
│   └── external/             # ZUI_BOOK OData metadata from S/4HANA
├── test/http/                # REST Client test files
├── docs/images/              # README screenshots
├── .cdsrc.json               # SQLite configuration (public)
├── .cdsrc-private.json       # S/4HANA credentials (DO NOT commit)
├── package.json
└── README.md
```

---

## Data Model

Namespace: `sap.capire.bookshop`

| Entity | Description | Relationships |
|--------|--------|---------|
| **Books** | Books (title, descr, stock, price, currency) | → Authors, → Genres |
| **Authors** | Authors | ← Books (1-n) |
| **Genres** | Genres (CodeList, Integer ID) | Parent/children hierarchy |
| **BooksFromRAP** | View/staging area for RAP data | — |

The main entities inherit the `cuid` (UUID) and `managed` (createdAt, modifiedAt, ...) aspects.

---

## API Services

| Service | Path | Description |
|---------|------|--------|
| **AdminService** | `/admin` | CRUD Authors, Books, Genres |
| | `POST /admin/getBooksFromRAP` | Synchronize books from SAP RAP |
| **CatalogService** | `/browse` | Read Books (read-only) |
| | `POST /browse/submitOrder` | Place an order and decrease stock |
| **ExportService** | `/export` | `POST /export/exportBooksToExcel` |
| **UploadService** | `/upload` | `uploadBooksFromBase64`, `uploadGenresFromBase64` |

**Default base URL:** `http://localhost:4004`

Examples:

```http
GET  http://localhost:4004/browse/Books
GET  http://localhost:4004/admin/Books
POST http://localhost:4004/browse/submitOrder
     { "book": "<UUID>", "quantity": 2 }
```

---

## Frontend Applications

### 1. `adminserviceui` — Administration (Fiori Elements)

- **Template:** List Report / Object Page (SAP Fiori Elements)
- **Service:** `AdminService` (`/admin`)
- **Entities:** Authors, Books, Genres
- **Custom actions on the Books List:**
  - **Upload Excel** — import books from an `.xlsx` file
  - **Load from ABAP** — call the `getBooksFromRAP` action
  - **Export Excel** — export selected or displayed books
- **Custom action on the Genres List:**
  - **Upload Genre** — import or update genres

Run separately:

```bash
npm run watch-adminserviceui
```

### 2. `project1` — Browse Books (Fiori Elements)

- **Service:** `CatalogService` (`/browse`)
- Display the book list as a List Report / Object Page

Run separately:

```bash
npm run watch-project1
```

### 3. `catalog` — Storefront (React + Vite)

- Modern customer-facing catalog interface
- Search by title, author, and genre
- View details and place orders through the `submitOrder` action

Run the development server (proxied to CAP):

```bash
cd app/catalog
npm install
npm run dev
```

---

## System Requirements

- **Node.js** ≥ 18 (LTS recommended)
- **npm** ≥ 8
- (Optional) An SAP S/4HANA Cloud account for the Load from RAP feature

---

## Installation and Running

### 1. Clone the repository

```bash
git clone <repository-url>
cd FPT
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the backend and Fiori apps

```bash
cds watch
```

Or:

```bash
npm start
```

The server runs at **http://localhost:4004**.

### 4. Access the applications

| Application | URL (when using `cds watch`) |
|----------|----------------------------|
| Admin UI | http://localhost:4004/adminserviceui/webapp/index.html |
| Browse (Fiori) | http://localhost:4004/project1/webapp/index.html |
| OData metadata | http://localhost:4004/$metadata |

### 5. Run the React catalog (separate terminal)

```bash
cd app/catalog
npm install
npm run dev
```

---

## S/4HANA Connection Configuration

The **Load from ABAP** feature requires a `.cdsrc-private.json` file, which is already gitignored. Create this file in the project root:

```json
{
  "requires": {
    "ZUI_BOOK": {
      "kind": "odata",
      "model": "srv/external/ZUI_BOOK",
      "credentials": {
        "url": "https://<your-s4hana-host>/sap/opu/odata4/sap/zui_book_o4/...",
        "username": "<your-user>",
        "password": "<your-password>",
        "headers": {
          "sap-client": "<client>"
        }
      }
    }
  }
}
```


External OData metadata is located at `srv/external/ZUI_BOOK.xml`.

---

## Excel File Format

### Upload Books

| Column | Required | Notes |
|-----|----------|---------|
| title / Title | Yes | Book title |
| author / Author | Recommended | Created automatically if missing |
| genre / Genre | Yes | Must exist in the Genres table |
| descr / Description | No | Description |
| stock / Stock | No | Defaults to 0 |
| price / Price | No | Defaults to 0 |
| currency / Currency | No | Defaults to USD |

### Upload Genres

| Column | Required | Notes |
|-----|----------|---------|
| name / Name / genre / Genre | Yes | Genre name |
| descr / Description | No | Updated when the name already exists |

---

## API Testing

REST Client files are available in `test/http/`:

- `AdminService.http` — CRUD Authors, Books, Genres
- `CatalogService.http` — GET Books, Currencies
- `requests.http` — combined requests

Open them with the **REST Client** extension for VS Code or an equivalent tool.

---

## Useful Scripts

| Command | Description |
|------|--------|
| `npm start` | Start the CAP server (`cds-serve`) |
| `cds watch` | Development mode with hot reload |
| `npm run watch-adminserviceui` | Open the Admin Fiori app directly |
| `npm run watch-project1` | Open the Browse Fiori app directly |
| `cds deploy --to sqlite` | Deploy the schema and seed data to SQLite |

---

## Security Notes

- The `.cdsrc-private.json` file contains SAP credentials — **do not push it to Git**.
- Local database files matching `*.sqlite` are also gitignored.
- For production deployments, use a destination service / XSUAA instead of hardcoding passwords.

---

## Technologies

| Layer | Technology |
|-------|-----------|
| Backend | SAP CAP v9, Node.js |
| Database | SQLite (`@cap-js/sqlite`) |
| OData | OData V4 |
| Fiori UI | SAPUI5, Fiori Elements (List Report / Object Page) |
| Storefront | React 19, Vite 8 |
| Excel | xlsx |
| SAP Integration | SAP Cloud SDK, OData external service ZUI_BOOK |
| Dev Tools | `@sap/cds-dk`, `cds-plugin-ui5` |

---

## References

- [SAP CAP Documentation](https://cap.cloud.sap/docs/)
- [SAP Fiori Elements](https://ui5.sap.com/test-resources/sap/fe/core/fpmExplorer/index.html)
- [SAP Cloud SDK for JavaScript](https://sap.github.io/cloud-sdk/docs/js/overview)

---

## License

Private project — for educational and internal use only.
