import { pgTable, uuid, text, timestamp, integer, boolean, date, jsonb, sql } from 'drizzle-orm/pg-core';

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

// Types
export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;

export type SalesMeeting = typeof salesMeetings.$inferSelect;
export type NewSalesMeeting = typeof salesMeetings.$inferInsert;

export type LlmAnalysis = typeof llmAnalysis.$inferSelect;
export type NewLlmAnalysis = typeof llmAnalysis.$inferInsert;

export type ProcessingJob = typeof processingJobs.$inferSelect;
export type NewProcessingJob = typeof processingJobs.$inferInsert;
