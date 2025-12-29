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

-- JSONB indexes for LLM analysis fields (sector is the main field we query)
CREATE INDEX IF NOT EXISTS idx_llm_analysis_sector ON llm_analysis((analysis_json->>'sector'));

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

-- ============================================================================
-- CUSTOM DASHBOARDS TABLES
-- ============================================================================

-- Create saved_filters table - Filtros guardados (debe ir primero por las FKs)
CREATE TABLE IF NOT EXISTS saved_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    filter_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_views table - Vistas/Dashboards personalizados
CREATE TABLE IF NOT EXISTS saved_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    objective TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_charts table - Gráficos guardados
CREATE TABLE IF NOT EXISTS saved_charts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    chart_type VARCHAR(50) NOT NULL, -- 'pie', 'bar', 'line', 'area'
    x_axis VARCHAR(100) NOT NULL,
    y_axis VARCHAR(100) NOT NULL DEFAULT 'count',
    group_by VARCHAR(100) NOT NULL,
    aggregation VARCHAR(50) NOT NULL DEFAULT 'count', -- 'count', 'sum', 'avg', 'min', 'max'
    time_group VARCHAR(20), -- 'day', 'week', 'month'
    colors TEXT, -- Comma-separated colors
    chart_filter_id UUID REFERENCES saved_filters(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create view_charts table - Relación vista-gráfico (many-to-many)
CREATE TABLE IF NOT EXISTS view_charts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    view_id UUID REFERENCES saved_views(id) ON DELETE CASCADE NOT NULL,
    chart_id UUID REFERENCES saved_charts(id) ON DELETE CASCADE NOT NULL,
    position INTEGER NOT NULL,
    width VARCHAR(20) NOT NULL DEFAULT 'full', -- 'full', 'half', 'third'
    chart_filter_id UUID REFERENCES saved_filters(id) ON DELETE SET NULL, -- Filtro específico del gráfico
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create view_filters table - Relación vista-filtro (many-to-many)
CREATE TABLE IF NOT EXISTS view_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    view_id UUID REFERENCES saved_views(id) ON DELETE CASCADE NOT NULL,
    filter_id UUID REFERENCES saved_filters(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for custom dashboards tables
CREATE INDEX IF NOT EXISTS idx_saved_charts_chart_type ON saved_charts(chart_type);
CREATE INDEX IF NOT EXISTS idx_view_charts_view_id ON view_charts(view_id);
CREATE INDEX IF NOT EXISTS idx_view_charts_chart_id ON view_charts(chart_id);
CREATE INDEX IF NOT EXISTS idx_view_filters_view_id ON view_filters(view_id);
CREATE INDEX IF NOT EXISTS idx_view_filters_filter_id ON view_filters(filter_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_is_default ON saved_views(is_default) WHERE is_default = TRUE;

-- Triggers for custom dashboards tables
DROP TRIGGER IF EXISTS update_saved_charts_updated_at ON saved_charts;
CREATE TRIGGER update_saved_charts_updated_at
    BEFORE UPDATE ON saved_charts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_filters_updated_at ON saved_filters;
CREATE TRIGGER update_saved_filters_updated_at
    BEFORE UPDATE ON saved_filters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_views_updated_at ON saved_views;
CREATE TRIGGER update_saved_views_updated_at
    BEFORE UPDATE ON saved_views
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
