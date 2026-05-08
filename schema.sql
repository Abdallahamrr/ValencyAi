-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid,
  title text NOT NULL,
  description text,
  mark_scheme_url text,
  mark_scheme_data jsonb,
  due_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  total_max_marks integer,
  question_pdf_url text,
  CONSTRAINT assignments_pkey PRIMARY KEY (id),
  CONSTRAINT assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
CREATE TABLE public.class_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid,
  student_id uuid,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT class_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT class_enrollments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT class_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid,
  name text NOT NULL,
  invite_code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.grades (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  submission_id uuid,
  total_score integer NOT NULL,
  llm_response jsonb NOT NULL,
  requires_teacher_review boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT grades_pkey PRIMARY KEY (id),
  CONSTRAINT grades_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id)
);
CREATE TABLE public.grading_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid,
  page_number integer,
  question_number text,
  raw_ai_extraction text,
  student_correction text,
  ai_feedback text,
  earned_marks numeric,
  max_marks numeric,
  teacher_override_marks numeric,
  is_disputed boolean DEFAULT false,
  box_coordinates jsonb,
  CONSTRAINT grading_details_pkey PRIMARY KEY (id),
  CONSTRAINT grading_details_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id)
);
CREATE TABLE public.ocr_segments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  submission_id uuid,
  segment_index integer NOT NULL,
  raw_text text NOT NULL,
  corrected_text text,
  confidence_score double precision NOT NULL,
  bounding_box jsonb NOT NULL,
  is_reviewed boolean DEFAULT false,
  CONSTRAINT ocr_segments_pkey PRIMARY KEY (id),
  CONSTRAINT ocr_segments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  role text CHECK (role = ANY (ARRAY['teacher'::text, 'student'::text])),
  school_name text,
  grade_level integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assignment_id uuid,
  student_id uuid,
  pdf_url text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'verified'::text, 'graded'::text])),
  final_score numeric,
  teacher_feedback text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT submissions_pkey PRIMARY KEY (id),
  CONSTRAINT submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id),
  CONSTRAINT submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);



[
  {
    "schemaname": "public",
    "tablename": "class_enrollments",
    "policyname": "Students can enroll themselves",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = student_id)"
  },
  {
    "schemaname": "public",
    "tablename": "class_enrollments",
    "policyname": "Students can view their own enrollments",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = student_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "class_enrollments",
    "policyname": "Teachers can view their class roster",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM classes\n  WHERE ((classes.id = class_enrollments.class_id) AND (classes.teacher_id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "class_enrollments",
    "policyname": "Teachers can view their class rosters",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM classes\n  WHERE ((classes.id = class_enrollments.class_id) AND (classes.teacher_id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "submissions",
    "policyname": "Students can manage their own submissions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(student_id = auth.uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "submissions",
    "policyname": "Teachers can view class submissions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM (assignments\n     JOIN classes ON ((assignments.class_id = classes.id)))\n  WHERE ((assignments.id = submissions.assignment_id) AND (classes.teacher_id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can insert own profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can update own profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": "(auth.uid() = id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can view own profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "assignments",
    "policyname": "Teachers can manage assignments",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM classes\n  WHERE ((classes.id = assignments.class_id) AND (classes.teacher_id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "assignments",
    "policyname": "Enrolled students can view assignments",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM class_enrollments\n  WHERE ((class_enrollments.class_id = assignments.class_id) AND (class_enrollments.student_id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "classes",
    "policyname": "Authenticated users can view classes",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "classes",
    "policyname": "Teachers can insert classes",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = teacher_id)"
  },
  {
    "schemaname": "public",
    "tablename": "classes",
    "policyname": "Teachers can manage their own classes",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.uid() = teacher_id)",
    "with_check": "(auth.uid() = teacher_id)"
  }
]