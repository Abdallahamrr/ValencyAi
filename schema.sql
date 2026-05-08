-- Phase 2 & 3 Database Schema Expansion for Valency.AI
-- Run this in your Supabase SQL Editor

-- 1. Assignments Table
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  marking_scheme_url TEXT,
  question_pdf_url TEXT,
  total_marks INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Assignments
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 2. Submissions Table
-- Using an ENUM for status
CREATE TYPE submission_status AS ENUM ('pending_upload', 'processing_ocr', 'pending_review', 'ready_for_ai', 'graded');

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  original_image_url TEXT,
  status submission_status DEFAULT 'pending_upload',
  final_transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 3. OCR Segments Table
CREATE TABLE ocr_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  segment_index INTEGER NOT NULL,
  raw_text TEXT NOT NULL,
  corrected_text TEXT,
  confidence_score FLOAT NOT NULL,
  bounding_box JSONB NOT NULL, -- Format: {"x": int, "y": int, "w": int, "h": int}
  is_reviewed BOOLEAN DEFAULT FALSE
);

-- Enable RLS for OCR Segments
ALTER TABLE ocr_segments ENABLE ROW LEVEL SECURITY;

-- 4. Grades Table
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  llm_response JSONB NOT NULL,
  requires_teacher_review BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Grades
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- 1. Assignments: Teachers can manage, Students can view if enrolled
CREATE POLICY "Teachers can manage assignments" ON assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = assignments.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- Submissions: Students manage their own, Teachers can view their class's submissions
CREATE POLICY "Students can manage their own submissions" ON submissions
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view class submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments 
      JOIN classes ON assignments.class_id = classes.id 
      WHERE assignments.id = submissions.assignment_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- Extend similar policies for ocr_segments and grades...

-- Fix: Explicit INSERT policy for classes
CREATE POLICY "Teachers can insert classes" ON classes
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);
