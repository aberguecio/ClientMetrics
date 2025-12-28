-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create uploads table
CREATE TABLE IF NOT EXISTS uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    uploaded_by TEXT,
    row_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_meetings table
CREATE TABLE IF NOT EXISTS sales_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    sales_rep TEXT NOT NULL,
    closed BOOLEAN NOT NULL DEFAULT FALSE,
    transcript TEXT NOT NULL,
    upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create llm_analysis table
CREATE TABLE IF NOT EXISTS llm_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES sales_meetings(id) ON DELETE CASCADE,
    prompt_version TEXT NOT NULL DEFAULT 'v1',
    model TEXT NOT NULL,
    analysis_json JSONB NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_id, prompt_version)
);

-- Create processing_jobs table
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES sales_meetings(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_meetings_upload_id ON sales_meetings(upload_id);
CREATE INDEX IF NOT EXISTS idx_sales_meetings_sales_rep ON sales_meetings(sales_rep);
CREATE INDEX IF NOT EXISTS idx_sales_meetings_meeting_date ON sales_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_sales_meetings_closed ON sales_meetings(closed);
CREATE INDEX IF NOT EXISTS idx_llm_analysis_meeting_id ON llm_analysis(meeting_id);

-- JSONB indexes for LLM analysis fields
CREATE INDEX IF NOT EXISTS idx_llm_analysis_interest_level ON llm_analysis((analysis_json->>'interest_level'));
CREATE INDEX IF NOT EXISTS idx_llm_analysis_funnel_stage ON llm_analysis((analysis_json->>'funnel_stage'));
CREATE INDEX IF NOT EXISTS idx_llm_analysis_sentiment ON llm_analysis((analysis_json->>'sentiment'));

-- Index for processing_jobs status
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_processing_jobs_meeting_id ON processing_jobs(meeting_id);

-- Vector similarity search index (HNSW for performance)
CREATE INDEX IF NOT EXISTS idx_llm_analysis_embedding ON llm_analysis
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for sales_meetings
DROP TRIGGER IF EXISTS update_sales_meetings_updated_at ON sales_meetings;
CREATE TRIGGER update_sales_meetings_updated_at
    BEFORE UPDATE ON sales_meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for processing_jobs
DROP TRIGGER IF EXISTS update_processing_jobs_updated_at ON processing_jobs;
CREATE TRIGGER update_processing_jobs_updated_at
    BEFORE UPDATE ON processing_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
