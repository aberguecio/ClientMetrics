# Client Metrics - Sales Analytics Application

Full-stack application to analyze sales meeting transcriptions using AI, generating metrics and interactive visualizations.

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript + Node.js
- **Styling**: Vanilla CSS + CSS Modules
- **Database**: PostgreSQL 16 + pgvector
- **LLM**: OpenAI API (GPT-4o-mini + text-embedding-3-small)
- **Containerization**: Docker + Docker Compose

## Features

- 📊 Interactive dashboard with sales metrics
- 🤖 Automatic meeting categorization using LLM
- 🔍 Semantic search for similar meetings
- 📈 Visualizations with charts (win rate, sales rep performance, etc.)
- 📁 Bulk data import via CSV
- 🎯 Advanced filters by sales rep, date, and status

## Prerequisites

- Docker and Docker Compose installed
- OpenAI account with API key

## Quick Start

### 1. Configure environment variables

Edit the `.env` file

### 2. Start services with Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL with pgvector on port 5432
- Next.js app on port 3000

### 4. Access the application

Open your browser at: [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ClientMetrics/
├── docker-compose.yml          # Service orchestration
├── Dockerfile                  # Next.js image
├── .env                        # Environment variables (DO NOT commit)
├── docker/
│   └── postgres/
│       └── init.sql           # Initial DB schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Dashboard
│   │   ├── upload/           # CSV upload page
│   │   ├── meetings/         # Meetings list and detail
│   │   └── api/              # API routes
│   ├── lib/                  # Utilities and logic
│   │   ├── db/              # Database schema and queries
│   │   ├── llm/             # OpenAI integration
│   │   ├── jobs/            # Async processing
│   │   └── csv/             # CSV parser
│   ├── components/          # React components
│   └── types/              # TypeScript types
├── scripts/
│   └── seed.ts             # Script to load sample data
└── vambe_clients.csv       # Sample data
```

## Workflow

1. **Upload CSV**: User uploads CSV file with transcriptions
2. **Validation**: Validate format and content of CSV
3. **Storage**: Data is saved to PostgreSQL
4. **Processing**: Create jobs for LLM analysis
5. **AI Analysis**: OpenAI categorizes transcriptions
6. **Embeddings**: Generate vectors for semantic search
7. **Visualization**: Metrics available on dashboard