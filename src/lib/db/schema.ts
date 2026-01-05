import { pgTable, uuid, text, timestamp, integer, boolean, date, jsonb, sql, varchar } from 'drizzle-orm/pg-core';

// Tabla: uploads
export const uploads = pgTable('uploads', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: text('filename').notNull(),
  uploadedBy: text('uploaded_by'),
  rowCount: integer('row_count').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tabla: sales_meetings
export const salesMeetings = pgTable('sales_meetings', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientName: text('client_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  meetingDate: date('meeting_date').notNull(),
  salesRep: text('sales_rep').notNull(),
  closed: boolean('closed').notNull(),
  transcript: text('transcript').notNull(),
  uploadId: uuid('upload_id').references(() => uploads.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tabla: llm_analysis
export const llmAnalysis = pgTable('llm_analysis', {
  id: uuid('id').primaryKey().defaultRandom(),
  meetingId: uuid('meeting_id').references(() => salesMeetings.id).notNull(),
  promptVersion: text('prompt_version').notNull().default('v1'),
  model: text('model').notNull(),
  analysisJson: jsonb('analysis_json').notNull(),
  embedding: text('embedding'), // Stored as text representation of vector
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tabla: processing_jobs
export const processingJobs = pgTable('processing_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  meetingId: uuid('meeting_id').references(() => salesMeetings.id).notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  attempts: integer('attempts').notNull().default(0),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tabla: saved_charts - Gráficos guardados
export const savedCharts = pgTable('saved_charts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  chartType: varchar('chart_type', { length: 50 }).notNull(), // 'pie', 'bar', 'line', 'area'
  xAxis: varchar('x_axis', { length: 100 }).notNull(),
  yAxis: varchar('y_axis', { length: 100 }).notNull().default('count'),
  groupBy: varchar('group_by', { length: 100 }).notNull(),
  aggregation: varchar('aggregation', { length: 50 }).notNull().default('count'), // 'count', 'sum', 'avg', 'min', 'max'
  timeGroup: varchar('time_group', { length: 20 }), // 'day', 'week', 'month'
  colors: text('colors'), // Comma-separated colors
  chartFilterId: uuid('chart_filter_id').references(() => savedFilters.id, { onDelete: 'set null' }),
  kClusters: integer('k_clusters'), // Number of clusters for vector charts
  labelField: varchar('label_field', { length: 100 }), // Field to label points in vector charts
  textMode: varchar('text_mode', { length: 20 }), // 'words' | 'phrases' for word clouds
  cumulative: boolean('cumulative').notNull().default(false), // Line/Area: show cumulative values
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tabla: saved_filters - Filtros guardados
export const savedFilters = pgTable('saved_filters', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  filterData: jsonb('filter_data').notNull(), // All filter criteria stored as JSONB
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tabla: saved_views - Vistas/Dashboards personalizados
export const savedViews = pgTable('saved_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  objective: text('objective'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tabla: view_charts - Relación vista-gráfico (many-to-many)
export const viewCharts = pgTable('view_charts', {
  id: uuid('id').primaryKey().defaultRandom(),
  viewId: uuid('view_id').references(() => savedViews.id, { onDelete: 'cascade' }).notNull(),
  chartId: uuid('chart_id').references(() => savedCharts.id, { onDelete: 'cascade' }).notNull(),
  position: integer('position').notNull(),
  width: varchar('width', { length: 20 }).notNull().default('full'), // 'full', 'half', 'third'
  chartFilterId: uuid('chart_filter_id').references(() => savedFilters.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Tabla: view_filters - Relación vista-filtro (many-to-many)
export const viewFilters = pgTable('view_filters', {
  id: uuid('id').primaryKey().defaultRandom(),
  viewId: uuid('view_id').references(() => savedViews.id, { onDelete: 'cascade' }).notNull(),
  filterId: uuid('filter_id').references(() => savedFilters.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Types - Existing
export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;

export type SalesMeeting = typeof salesMeetings.$inferSelect;
export type NewSalesMeeting = typeof salesMeetings.$inferInsert;

export type LlmAnalysis = typeof llmAnalysis.$inferSelect;
export type NewLlmAnalysis = typeof llmAnalysis.$inferInsert;

export type ProcessingJob = typeof processingJobs.$inferSelect;
export type NewProcessingJob = typeof processingJobs.$inferInsert;

// Types - New (Custom Dashboards)
export type SavedChart = typeof savedCharts.$inferSelect;
export type NewSavedChart = typeof savedCharts.$inferInsert;

export type SavedFilter = typeof savedFilters.$inferSelect;
export type NewSavedFilter = typeof savedFilters.$inferInsert;

export type SavedView = typeof savedViews.$inferSelect;
export type NewSavedView = typeof savedViews.$inferInsert;

export type ViewChart = typeof viewCharts.$inferSelect;
export type NewViewChart = typeof viewCharts.$inferInsert;

export type ViewFilter = typeof viewFilters.$inferSelect;
export type NewViewFilter = typeof viewFilters.$inferInsert;
