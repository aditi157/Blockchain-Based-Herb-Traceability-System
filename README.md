# Blockchain-Based-Herb-Traceability-System

The Blockchain-Based-Herb-Traceability-System is a comprehensive solution designed to ensure transparency and authenticity in the herbal supply chain. By leveraging blockchain technology, the system provides an immutable ledger for tracking herb batches, laboratory results, and organizational data from origin to end-user.

## Features

*   **End-to-End Traceability**: Track herbal products through every stage of the supply chain, from cultivation to distribution.
*   **Blockchain Integration**: Securely record transactions and data updates on a decentralized ledger to prevent tampering.
*   **Data Management**: Built-in support for managing complex datasets including batch information, lab results, and organizational records.
*   **Role-Based Dashboards**: Dedicated front-end interfaces for different stakeholders to monitor and interact with the supply chain data.
*   **Prisma ORM**: Robust database management and schema handling for efficient data persistence and migration.

## Tech Stack

*   **Frontend**: JavaScript, React, Vite, CSS, HTML
*   **Backend**: Node.js, Express
*   **Database/ORM**: Prisma
*   **Blockchain**: Custom smart contract integration

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v16 or higher recommended)
*   npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/harshneyvijay/Blockchain-Based-Herb-Traceability-System.git
   cd Blockchain-Based-Herb-Traceability-System
   ```

2. Install backend dependencies:
   ```bash
   cd back
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../front
   npm install
   ```

### Running the Application

To run the system, you must start both the backend server and the frontend development environment in separate terminal windows.

**Backend:**
```bash
cd back
npm run dev
```

**Frontend:**
```bash
cd front
npm run dev
```

## Project Structure

```text
.
├── back/               # Node.js/Express backend
│   ├── prisma/         # Database schema and migrations
│   ├── src/            # Source code (controllers, routes, services)
│   └── ...
├── front/              # React/Vite frontend
│   ├── src/            # Components, pages, and dashboards
│   └── ...
└── ...
```

## Environment Variables

The project requires environment configuration. Please check the `back/` and `front/` directories for any `.env.example` files. Copy them to `.env` and populate the necessary database connection strings and blockchain provider credentials before starting the services.

## Scripts

| Script | Path | Description |
| :--- | :--- | :--- |
| `npm run dev` | `back/` | Starts the backend server in development mode. |
| `npm run dev` | `front/` | Starts the Vite development server for the frontend. |
