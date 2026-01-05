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
- `saved_charts`: Chart definitions (type, axes, grouping, aggregation, k_clusters, label_field, text_mode, cumulative)
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

## API Architecture

### Design Decisions

#### Standardized Response Format
All API endpoints use a consistent response format defined in [src/lib/api/responses.ts](src/lib/api/responses.ts):

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}
```

**Success responses**:
```typescript
successResponse(data, status = 200) // { success: true, data: {...} }
```

**Error responses**:
```typescript
errorResponse(message, details?, status = 500)      // General errors
notFoundResponse(resourceName)                       // 404 errors
validationErrorResponse(message, details?)           // 400 validation errors
unauthorizedResponse(message?)                       // 401 auth errors
forbiddenResponse(message?)                          // 403 permission errors
```

**Why this format?**
- Consistent error handling across frontend
- Type-safe with TypeScript generics
- Easy to add metadata (pagination, filters applied, etc.)
- Clear distinction between success/error states

#### Reusable Validation Utilities
Defined in [src/lib/api/validators.ts](src/lib/api/validators.ts):

```typescript
// Validate resource exists
validateResourceExists<T>(
  fetcher: () => Promise<T | null>,
  resourceName: string
): Promise<ResourceValidationResult<T>>

// Validate array of IDs
validateIdArray(
  ids: unknown,
  options?: { min?: number; max?: number }
): IdArrayValidationResult

// Validate required fields
validateRequiredFields(
  body: any,
  fields: string[]
): RequiredFieldsValidationResult

// Validate enum values
validateEnumValue<T>(
  value: unknown,
  validValues: readonly T[],
  fieldName: string
): EnumValidationResult<T>
```

**Why validators?**
- DRY principle - validation logic used in 11+ routes
- Consistent error messages
- Type-safe with generics
- Security limits built-in (e.g., max 100 IDs per batch operation)

#### Field Name Transformation
Defined in [src/lib/api/transformers.ts](src/lib/api/transformers.ts):

The API accepts `snake_case` field names (common in REST APIs) but the database uses `camelCase` (TypeScript convention). Transformers handle this mapping:

```typescript
// Transform request body using predefined mapping
transformRequestBody(body, CHART_FIELD_MAPPING)

// Predefined mappings
CHART_FIELD_MAPPING = {
  chart_type: 'chartType',
  x_axis: 'xAxis',
  y_axis: 'yAxis',
  group_by: 'groupBy',
  time_group: 'timeGroup',
  k_clusters: 'kClusters',
  label_field: 'labelField',
  text_mode: 'textMode',
  chart_filter_id: 'chartFilterId',
}

FILTER_FIELD_MAPPING = {
  filter_data: 'filterData',
}

VIEW_FIELD_MAPPING = {
  is_default: 'isDefault',
}
```

**Why transformation?**
- API follows REST conventions (snake_case)
- TypeScript/JavaScript follows camelCase convention
- Drizzle ORM generates camelCase column names
- Automatic transformation eliminates manual mapping in 8+ routes

### API Endpoints Reference

All endpoints are located in [src/app/api](src/app/api).

#### Upload & Processing

**POST /api/upload**
- Upload CSV file with sales meeting transcripts
- Max file size: 10MB
- Validates CSV structure and data
- Creates meetings and processing jobs
- Returns: `{ uploadId, rowCount, jobsCreated, message }`
- Triggers: Immediate job processing

**GET /api/process-jobs**
- Get processing job statistics
- Returns: `{ success: true, stats: { pending, processing, completed, failed } }`
- Note: Jobs process automatically in background

**POST /api/jobs/retry-failed**
- Reset all failed jobs to pending status
- Triggers: Immediate job processing
- Returns: `{ success: true, message, count }`

#### Meetings

**GET /api/meetings**
- List all meetings with pagination
- Query params: `?page=1` (default: 1, limit: 50)
- Returns: `{ meetings[], page, limit, total, totalPages }`
- Includes: LLM analysis data joined

**GET /api/meetings/[id]**
- Get detailed meeting information
- Returns: Meeting with full LLM analysis
- 404 if meeting not found

**DELETE /api/meetings**
- Delete multiple meetings by IDs
- Body: `{ ids: string[] }` (max 100)
- Cascades: Deletes related `llm_analysis` records first
- Returns: `{ success: true, deleted: count }`

**POST /api/meetings/requeue**
- Requeue meetings for AI reprocessing
- Body: `{ ids: string[] }` (max 100)
- Deletes existing analysis and creates new jobs
- Returns: `{ success: true, jobsCreated: count }`

**GET /api/meetings/filter-options**
- Get distinct values for filter dropdowns
- Returns: `{ salesReps[], sectors[], companySizes[], discoveryChannels[] }`
- Used by: Filter UI components

#### Charts

**GET /api/charts**
- List all saved charts
- Returns: Array of chart definitions

**POST /api/charts**
- Create new chart
- Body: `{ name, description?, chart_type, x_axis?, y_axis?, group_by?, aggregation?, time_group?, k_clusters?, label_field?, text_mode?, cumulative?, colors?, chart_filter_id? }`
- Validates: Chart configuration (required fields per chart type)
- Returns: Created chart

**GET /api/charts/[id]**
- Get single chart definition
- Returns: Chart object
- 404 if not found

**PUT /api/charts/[id]**
- Update existing chart
- Body: Partial chart fields (only changed fields)
- Validates: Enum values for `chart_type`, `aggregation`
- Returns: Updated chart

**DELETE /api/charts/[id]**
- Delete chart
- Cascades: Removes from all views (`view_charts`)
- Returns: `{ success: true }`

**POST /api/charts/data**
- Calculate chart data with filters applied
- Body: `{ chart_id, view_filter_ids?, chart_filter_id? }`
- Returns: `{ data: ChartDataPoint[], metadata: { total, filters_applied } }`
- Process: Fetches meetings → Applies filters → Aggregates data

#### Filters

**GET /api/filters**
- List all saved filters
- Returns: Array of filter definitions with `filterData` transformed to `filter_data` for API

**POST /api/filters**
- Create new filter
- Body: `{ name, filter_data: { /* filter conditions */ } }`
- Returns: Created filter

**GET /api/filters/[id]**
- Get single filter
- Returns: Filter object
- 404 if not found

**PUT /api/filters/[id]**
- Update filter
- Body: `{ name?, filter_data? }`
- Returns: Updated filter

**DELETE /api/filters/[id]**
- Delete filter
- Cascades: Removes from all views (`view_filters`)
- Returns: `{ success: true }`

#### Views (Dashboards)

**GET /api/views**
- List all saved views
- Returns: Array of view definitions

**POST /api/views**
- Create new view
- Body: `{ name, description?, is_default? }`
- Validates: Required field `name`
- Auto-manages: If `is_default=true`, unsets other default views
- Returns: Created view

**GET /api/views/[id]**
- Get view with all related charts and filters
- Returns: `{ id, name, description, isDefault, charts[], filters[] }`
- Includes: Full chart and filter objects (not just IDs)

**PUT /api/views/[id]**
- Update view metadata
- Body: `{ name?, description?, is_default? }`
- Auto-manages: Default view status
- Returns: Updated view

**DELETE /api/views/[id]**
- Delete view
- Cascades: Removes all `view_charts` and `view_filters` relationships
- Returns: `{ success: true }`

**GET /api/views/default**
- Get the default view with all details
- Returns: Default view or `null` if none exists
- Used by: Dashboard initialization

**POST /api/views/[id]/charts**
- Add chart to view
- Body: `{ chart_id, position?, width?, chart_filter_id? }`
- Validates: View and chart exist
- Returns: Created `view_chart` relationship (201 status)

**DELETE /api/views/[id]/charts?chart_id=xxx**
- Remove chart from view (legacy query param method)
- Query: `?chart_id=xxx` (required)
- Note: Prefer `DELETE /api/views/[id]/charts/[chartId]` instead
- Returns: `{ success: true }`

**POST /api/views/[id]/filters**
- Add filter to view
- Body: `{ filter_id }`
- Validates: View and filter exist
- Returns: Created `view_filter` relationship (201 status)

**DELETE /api/views/[id]/filters?filter_id=xxx**
- Remove filter from view
- Query: `?filter_id=xxx` (required)
- Returns: `{ success: true }`

#### Analytics

**POST /api/analytics**
- Calculate analytics metrics for meetings
- Body: `{ filter?: MergedFilter }`
- Returns: `{ total, winRate, avgConfidence, ... }`
- Note: Uses POST to accept filter object, but is read-only operation

### API Design Patterns

#### Error Handling
All routes follow the same error handling pattern:

```typescript
export async function VERB(request: Request) {
  try {
    // 1. Parse and validate input
    const body = await request.json();

    // 2. Validate required fields
    const validation = validateRequiredFields(body, ['field1', 'field2']);
    if (!validation.valid) {
      return validationErrorResponse(`Missing: ${validation.missing.join(', ')}`);
    }

    // 3. Validate resources exist
    const resourceValidation = await validateResourceExists(
      () => getResourceById(id),
      'ResourceName'
    );
    if (!resourceValidation.valid) {
      return resourceValidation.error; // 404 response
    }

    // 4. Business logic
    const result = await doSomething();

    // 5. Success response
    return successResponse(result, 201); // Optional custom status

  } catch (error) {
    console.error('[API /route VERB] Error:', error);
    return errorResponse('User-friendly message', error.message);
  }
}
```

#### Logging Convention
All API routes use structured logging:
```typescript
console.log('[API /route VERB] Info message');
console.error('[API /route VERB] Error:', error);
```

This format makes logs easy to grep and trace through the system.

#### Batch Operations
For batch operations (delete/requeue multiple meetings):
- Use `validateIdArray(ids, { min: 1, max: 100 })`
- Security limit: Max 100 items per operation
- Prevents timeout and performance issues
- Returns clear error if limit exceeded

#### Resource Cascading
When deleting resources, related records are handled:
- Deleting a meeting → Deletes `llm_analysis` first (foreign key)
- Deleting a chart → Removes from all views (`view_charts`)
- Deleting a filter → Removes from all views (`view_filters`)
- Deleting a view → Removes all `view_charts` and `view_filters`

This prevents orphaned records and maintains referential integrity.

## Frontend Integration

### API Response Handling
All frontend components unwrap API responses:

```typescript
const response = await fetch('/api/endpoint');
const result = await response.json();
// Unwrap standardized response
const data = result.data || result; // Backward compatible
```

This pattern is used in:
- All page components ([src/app/*/page.tsx](src/app))
- Dashboard components ([src/components/dashboard](src/components/dashboard))
- Chart components ([src/components/charts](src/components/charts))
- Filter components ([src/components/filters](src/components/filters))
- View components ([src/components/views](src/components/views))

### Component Structure
- CSS Modules for styling (`.module.css` files)
- Components organized by feature in [src/components](src/components)
- Vanilla CSS + CSS Modules (no Tailwind/styled-components)

### Type Safety
- TypeScript strict mode
- Zod schemas for LLM response validation ([src/types/llm.ts](src/types/llm.ts))
- Drizzle inferred types exported from schema
- API response types in [src/types/api.ts](src/types/api.ts)

## Key Design Decisions

### Why Next.js App Router?
- Server components for better initial load performance
- API routes co-located with frontend code
- Built-in optimizations (code splitting, image optimization)
- TypeScript first-class support
- File-based routing

### Why Drizzle ORM?
- Type-safe SQL queries with full TypeScript inference
- Lightweight compared to Prisma (faster cold starts)
- Direct SQL access when needed
- Migration system with full control
- Better performance for complex queries

### Why pgvector?
- Native PostgreSQL extension (no external service)
- HNSW index for fast O(log n) similarity search
- Atomic transactions with relational data
- No data synchronization issues
- Cost-effective (no Pinecone/Weaviate fees)

### Why CSS Modules?
- Scoped styles prevent naming conflicts
- Co-located with components
- No runtime overhead (vs CSS-in-JS)
- Tree-shaking removes unused styles
- Works great with TypeScript

### Why Standardized API Responses?
- Consistent error handling across all frontend code
- Type-safe with generic `ApiResponse<T>` interface
- Easy to add pagination, filtering metadata
- Clear success/error distinction
- Backward compatible with `result.data || result` pattern

### Why snake_case in API but camelCase in DB?
- REST APIs conventionally use snake_case (JSON standard)
- TypeScript/JavaScript use camelCase (language convention)
- Transformation layer keeps both sides happy
- Drizzle generates camelCase from database schema
- No manual mapping needed in business logic

### Why Auto-Processor Background Jobs?
- LLM API calls are slow (5-15 seconds per meeting)
- Uploading 100 meetings would timeout if synchronous
- Background processing allows immediate user feedback
- Retry logic handles transient OpenAI errors
- Scalable to thousands of meetings

### Why Max 100 IDs for Batch Operations?
- Prevents database timeout on large operations
- Keeps transaction sizes manageable
- Clear error message guides users to batch smaller sets
- Aligns with PostgreSQL query limits
- Prevents accidental "delete all" operations

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
- `/` - Dashboard with key metrics and customizable views
- `/views` - Custom dashboard view management
- `/charts` - Chart builder and management
- `/meetings` - Meeting list with filters and detail view
- `/upload` - CSV upload interface

## Vector Search

- Embeddings stored as pgvector (1536 dimensions)
- HNSW index for fast similarity search (cosine distance)
- Embedding text combines: client name + transcript + analysis summary
- Query example: `SELECT * FROM llm_analysis ORDER BY embedding <=> $1 LIMIT 10`

## Common Issues & Solutions

### Frontend shows "X is not a function" or "Cannot read property of undefined"
- Check if API response is being unwrapped: `result.data || result`
- All API endpoints now return `{ success: true, data: {...} }`
- Frontend must extract `data` property

### API returns 404 for existing resource
- Check `validateResourceExists()` is using correct query function
- Verify resource ID is correct type (string vs UUID)
- Check database has the resource (use Drizzle Studio)

### Batch delete/requeue fails with 400 error
- Check array size - max 100 IDs allowed
- Verify IDs are strings, not numbers
- Check request body structure: `{ ids: ["id1", "id2"] }`

### Chart data endpoint returns 404
- Verify chart exists: `GET /api/charts/[id]`
- Check `chart_id` in request body (not `id`)
- Ensure chart has valid configuration

### TypeScript errors on API response
- Import `ApiResponse<T>` type from [src/lib/api](src/lib/api)
- Use correct generic type: `ApiResponse<SavedChart>`
- Check field names match (camelCase in TS, snake_case in API)
