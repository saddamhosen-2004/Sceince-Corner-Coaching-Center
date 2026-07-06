-- Manobik College Coaching Center - Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Batches Table
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for batches
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- 4. Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  qualification TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  monthly_salary NUMERIC(12, 2) NOT NULL,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Link subject to teacher in subjects table if needed (PRD: "Assign a teacher to each subject")
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;

-- 5. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  father_name TEXT NOT NULL,
  mother_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  college_name TEXT NOT NULL,
  college_year TEXT NOT NULL CHECK (college_year IN ('1st Year', '2nd Year')),
  batch_id UUID REFERENCES public.batches(id) ON DELETE RESTRICT,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  monthly_fee NUMERIC(10, 2) NOT NULL,
  student_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Sequence and trigger to auto-generate Student Roll/ID (MCCC-1001, MCCC-1002...)
CREATE SEQUENCE IF NOT EXISTS public.student_roll_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.set_student_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_id IS NULL THEN
    NEW.student_id := 'MCCC-' || nextval('public.student_roll_seq')::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER before_student_insert
  BEFORE INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_student_id();

-- 6. Directors Table
CREATE TABLE IF NOT EXISTS public.directors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for directors
ALTER TABLE public.directors ENABLE ROW LEVEL SECURITY;

-- 7. Preparation Program Table
CREATE TABLE IF NOT EXISTS public.preparation_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_name TEXT NOT NULL,
  session_year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for preparation_programs
ALTER TABLE public.preparation_programs ENABLE ROW LEVEL SECURITY;

-- 8. Preparation Enrollment Table
CREATE TABLE IF NOT EXISTS public.preparation_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.preparation_programs(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  amount_paid NUMERIC(10, 2) NOT NULL,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for preparation_enrollments
ALTER TABLE public.preparation_enrollments ENABLE ROW LEVEL SECURITY;

-- 9. Exams Table
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- e.g., Weekly Test 1, Monthly Test, Model Test
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  total_marks NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for exams
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- 10. Results Table
CREATE TABLE IF NOT EXISTS public.results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  marks_obtained NUMERIC(5, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(exam_id, student_id, subject_id)
);

-- Enable RLS for results
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- 11. Suggestions Table
CREATE TABLE IF NOT EXISTS public.suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  exam_name TEXT NOT NULL,
  content_text TEXT,
  file_url TEXT, -- PDF file path in ImageKit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for suggestions
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- 12. Routines Table
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL, -- Saturday, Sunday, etc. in Bangla or English
  time TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for routines
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

-- 13. Fee Collection Table
CREATE TABLE IF NOT EXISTS public.fee_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- e.g., জানুয়ারি, ফেব্রুয়ারি...
  year INTEGER NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  paid_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for fee_collections
ALTER TABLE public.fee_collections ENABLE ROW LEVEL SECURITY;

-- 14. Teacher Salary Table
CREATE TABLE IF NOT EXISTS public.teacher_salaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  paid_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for teacher_salaries
ALTER TABLE public.teacher_salaries ENABLE ROW LEVEL SECURITY;

-- 15. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  category TEXT NOT NULL, -- Rent, Utilities, Printing, Furniture, etc.
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;


-- =======================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================================================

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Users Policies
CREATE POLICY "Admins can view all user profiles" ON public.users FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);

-- 2. Batches Policies
CREATE POLICY "Anyone can view batches" ON public.batches FOR SELECT USING (true);
CREATE POLICY "Admins have full access to batches" ON public.batches FOR ALL USING (public.is_admin());

-- 3. Subjects Policies
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins have full access to subjects" ON public.subjects FOR ALL USING (public.is_admin());

-- 4. Teachers Policies (Protected table - full access to admin only)
CREATE POLICY "Admins have full access to teachers" ON public.teachers FOR ALL USING (public.is_admin());

-- Create a secure public view for teachers (excludes sensitive phone, address, monthly_salary)
CREATE OR REPLACE VIEW public.view_public_teachers AS
  SELECT t.id, t.name, t.photo_url, t.qualification, t.subject_id, t.batch_id, s.name as subject_name, b.name as batch_name
  FROM public.teachers t
  LEFT JOIN public.subjects s ON t.subject_id = s.id
  LEFT JOIN public.batches b ON t.batch_id = b.id;

-- 5. Students Policies (Protected table - full access to admin only)
CREATE POLICY "Admins have full access to students" ON public.students FOR ALL USING (public.is_admin());

-- Create a secure public view for students (excludes sensitive guardian details, fee packages, and address)
CREATE OR REPLACE VIEW public.view_public_students AS
  SELECT s.id, s.name, s.photo_url, s.batch_id, s.college_name, s.college_year, s.student_id, b.name as batch_name
  FROM public.students s
  LEFT JOIN public.batches b ON s.batch_id = b.id;

-- 6. Directors Policies (Publicly visible directory, writeable by admin only)
CREATE POLICY "Anyone can view directors" ON public.directors FOR SELECT USING (true);
CREATE POLICY "Admins have full access to directors" ON public.directors FOR ALL USING (public.is_admin());

-- Create a public view for directors that hides phone and address details
CREATE OR REPLACE VIEW public.view_public_directors AS
  SELECT id, name, position, photo_url
  FROM public.directors;

-- 7. Preparation Programs Policies
CREATE POLICY "Anyone can view preparation programs" ON public.preparation_programs FOR SELECT USING (true);
CREATE POLICY "Admins have full access to preparation programs" ON public.preparation_programs FOR ALL USING (public.is_admin());

-- 8. Preparation Enrollments Policies (Admin only)
CREATE POLICY "Admins have full access to preparation enrollments" ON public.preparation_enrollments FOR ALL USING (public.is_admin());

-- 9. Exams Policies
CREATE POLICY "Anyone can view exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Admins have full access to exams" ON public.exams FOR ALL USING (public.is_admin());

-- 10. Results Policies (Protected table - access via secure RPC function for public, full access to admin)
CREATE POLICY "Admins have full access to results" ON public.results FOR ALL USING (public.is_admin());

-- 11. Suggestions Policies (Publicly viewable, writeable by admin only)
CREATE POLICY "Anyone can view suggestions" ON public.suggestions FOR SELECT USING (true);
CREATE POLICY "Admins have full access to suggestions" ON public.suggestions FOR ALL USING (public.is_admin());

-- 12. Routines Policies (Publicly viewable, writeable by admin only)
CREATE POLICY "Anyone can view routines" ON public.routines FOR SELECT USING (true);
CREATE POLICY "Admins have full access to routines" ON public.routines FOR ALL USING (public.is_admin());

-- 13. Fee Collections Policies (Admin only)
CREATE POLICY "Admins have full access to fee collections" ON public.fee_collections FOR ALL USING (public.is_admin());

-- 14. Teacher Salaries Policies (Admin only)
CREATE POLICY "Admins have full access to teacher salaries" ON public.teacher_salaries FOR ALL USING (public.is_admin());

-- 15. Expenses Policies (Admin only)
CREATE POLICY "Admins have full access to expenses" ON public.expenses FOR ALL USING (public.is_admin());


-- =======================================================================
-- FUNCTIONS & PROCEDURES FOR COMPLEX QUERIES
-- =======================================================================

-- 1. Secure RPC to fetch student results by Roll/Student ID (No login required)
CREATE OR REPLACE FUNCTION public.get_student_results_by_roll(roll_id TEXT)
RETURNS TABLE (
  result_id UUID,
  exam_name TEXT,
  exam_date DATE,
  total_marks NUMERIC(5, 2),
  subject_name TEXT,
  marks_obtained NUMERIC(5, 2),
  student_name TEXT,
  student_roll TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id AS result_id,
    e.name AS exam_name,
    e.exam_date AS exam_date,
    e.total_marks AS total_marks,
    s.name AS subject_name,
    r.marks_obtained AS marks_obtained,
    std.name AS student_name,
    std.student_id AS student_roll
  FROM public.results r
  JOIN public.exams e ON r.exam_id = e.id
  JOIN public.subjects s ON r.subject_id = s.id
  JOIN public.students std ON r.student_id = std.id
  WHERE std.student_id = roll_id
  ORDER BY e.exam_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Trigger function to add auth.users to public.users automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users (if it doesn't already exist)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
