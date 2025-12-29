# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

ClientMetrics is a full-stack sales analytics application that uses AI to analyze sales meeting transcriptions. It ingests CSV files with meeting transcripts, uses OpenAI's GPT-4o-mini to extract structured insights (sentiment, interest level, sector, pain points, etc.), generates embeddings for semantic search, and displays interactive visualizations on customizable dashboards.

**Tech Stack**: Next.js 14 (App Router), TypeScript, PostgreSQL 16 with pgvector extension, Drizzle ORM, OpenAI API, Recharts for visualizations.

## Development Commands

```bash
# Development
npm run dev                 # Start Next.js dev server (port 3000)
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint

# Docker (recommended for development)
docker-compose up -d       # Start all services (PostgreSQL + Next.js)
docker-compose down        # Stop all services
docker-compose logs -f app # View application logs

# Database
npm run db:generate        # Generate new migration from schema changes
npm run db:migrate         # Run pending migrations (uses scripts/migrate.ts)
npm run db:push            # Push schema directly to DB (skip migration generation)
npm run db:studio          # Open Drizzle Studio UI for database inspection
npm run db:seed            # Run seed script (scripts/seed.ts)

# Environment
# Create .env file with: DATABASE_URL, OPENAI_API_KEY, NODE_ENV, NEXT_PUBLIC_APP_URL
```

## Architecture & Data Flow

### Core Pipeline
1. **CSV Upload** ([src/app/upload](src/app/upload)) → User uploads CSV with meeting transcripts
2. **Data Validation** ([src/lib/csv](src/lib/csv)) → Parse and validate CSV format
3. **Database Storage** → Insert meetings into `sales_meetings` table
4. **Job Creation** ([src/lib/jobs/processor.ts](src/lib/jobs/processor.ts)) → Create `processing_jobs` for each meeting
5. **Background Processing** (Auto-processor) → Continuously processes pending jobs
6. **LLM Analysis** ([src/lib/llm/categorize.ts](src/lib/llm/categorize.ts)) → OpenAI extracts structured insights
7. **Embeddings Generation** ([src/lib/llm/embeddings.ts](src/lib/llm/embeddings.ts)) → Create vector embeddings (1536 dimensions)
8. **Storage** → Store analysis JSON and embeddings in `llm_analysis` table
9. **Visualization** → Dashboard displays metrics and charts

### Auto-Processor System
- **Initialization**: Auto-processor starts when app initializes ([src/lib/init.ts:19](src/lib/init.ts#L19))
- **Background Loop**: Runs every 10 seconds, checking for pending jobs ([src/lib/jobs/auto-processor.ts](src/lib/jobs/auto-processor.ts))
- **Batch Processing**: Processes 5 jobs at a time, with retry logic (max 3 attempts)
- **State Management**: Jobs have states: `pending` → `processing` → `completed`/`failed`

### Database Schema (Drizzle ORM)
Schema defined in [src/lib/db/schema.ts](src/lib/db/schema.ts):

**Core Tables**:
- `uploads`: Tracks CSV upload metadata
- `sales_meetings`: Meeting records (client, date, sales rep, transcript, etc.)
- `llm_analysis`: AI-generated insights (JSONB) + pgvector embeddings
- `processing_jobs`: Async job queue with retry tracking

**Custom Dashboards Feature**:
- `saved_charts`: Chart definitions (type, axes, grouping, aggregation)
- `saved_filters`: Reusable filter configurations
- `saved_views`: Custom dashboard layouts
- `view_charts`: Many-to-many relationship (views ↔ charts)
- `view_filters`: Many-to-many relationship (views ↔ filters)

### LLM Integration
**Prompt System** ([src/lib/llm/prompts.ts](src/lib/llm/prompts.ts)):
- Prompt version: `v1` (tracked in `llm_analysis.prompt_version`)
- Extracts 20+ structured fields from transcripts
- Key outputs: interest_level, sentiment, urgency, icp_fit, sector, company_size, pain_points, use_cases, objections, etc.
- Confidence scores for assessments

**Models**:
- LLM: `gpt-4o-mini` (categorization)
- Embeddings: `text-embedding-3-small` (1536 dimensions)

**Retry Logic**:
- Exponential backoff: 1s, 2s, 4s
- Max 3 attempts per categorization
- No retry on validation errors

## Key Patterns & Conventions

### Database Operations
- Use Drizzle ORM for all queries ([src/lib/db/queries.ts](src/lib/db/queries.ts))
- Database connection exported from [src/lib/db/index.ts](src/lib/db/index.ts)
- Schema changes require `npm run db:migrate` (pushes to PostgreSQL)

### API Routes (Next.js App Router)
Located in [src/app/api](src/app/api):
- `/api/upload` - CSV file upload
- `/api/process-jobs` - Job statistics (GET only, processing is automatic)
- `/api/meetings` - Meeting list with filters
- `/api/charts` - Chart CRUD operations
- `/api/filters` - Filter CRUD operations
- `/api/views` - View/dashboard CRUD operations

### Component Structure
- CSS Modules for styling (`.module.css` files)
- Components organized by feature in [src/components](src/components)
- Vanilla CSS + CSS Modules (no Tailwind/styled-components)

### Type Safety
- TypeScript strict mode
- Zod schemas for LLM response validation ([src/types/llm.ts](src/types/llm.ts))
- Drizzle inferred types exported from schema

### Vector Search
- Embeddings stored as pgvector (1536 dimensions)
- HNSW index for fast similarity search (cosine distance)
- Embedding text combines: client name + transcript + analysis summary

## Environment Variables Required

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
OPENAI_API_KEY=sk-...
NODE_ENV=development|production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Schema Management

**Important**: The database schema is defined in TWO places:
1. **Drizzle schema** ([src/lib/db/schema.ts](src/lib/db/schema.ts)) - TypeScript source of truth
2. **SQL init script** ([docker/postgres/init.sql](docker/postgres/init.sql)) - Initial Docker setup

When modifying the schema:
1. Update [src/lib/db/schema.ts](src/lib/db/schema.ts)
2. Run `npm run db:migrate` to push changes
3. If adding new tables/extensions, update [docker/postgres/init.sql](docker/postgres/init.sql) for fresh Docker environments

## Navigation Structure

Main pages accessible via navbar:
- `/` - Dashboard with key metrics
- `/views` - Custom dashboard views
- `/charts` - Chart management
- `/meetings` - Meeting list and details
- `/upload` - CSV upload interface
