-- Add new columns to saved_charts table for chart enhancements

-- Add text_mode column for word cloud phrase/word selection
DO $$ BEGIN
  ALTER TABLE "saved_charts" ADD COLUMN "text_mode" varchar(20);
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Add cumulative column for line/area cumulative values
DO $$ BEGIN
  ALTER TABLE "saved_charts" ADD COLUMN "cumulative" boolean DEFAULT false NOT NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;
