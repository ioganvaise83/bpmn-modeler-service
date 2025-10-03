-- Migration script for creating diagrams table
CREATE TABLE IF NOT EXISTS diagrams (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    diagram_xml TEXT NOT NULL
);

-- Create index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_diagrams_created_at ON diagrams(created_at);
