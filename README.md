# ValencyAI 🧪

An AI-powered grading platform built specifically for IGCSE teachers.
Teachers upload assignments and mark schemes, students submit handwritten work,
and Gemini AI produces a detailed grade for the teacher to verify and publish.

> Currently in active development — core platform is complete, AI integration in progress.

---

## The Problem

Marking a full class set of IGCSE papers takes a teacher 4-6 hours.
ValencyAI reduces that to a quick verification of an AI-generated draft — 
saving hours of repetitive work while keeping the teacher in full control of every grade.

---

## How It Works

1. **Teacher** creates a class, gets an invite code, and uploads an assignment with its mark scheme
2. **Student** joins the class with the code and submits their handwritten paper (PDF or image)
3. **Gemini Flash** reads and transcribes the handwriting
4. **Gemini Pro** grades each question against the mark scheme with detailed feedback
5. **Teacher** reviews, overrides if needed, and publishes the grade
6. **Student** sees their results and per-question feedback

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Backend & Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth — Google OAuth + Magic Link |
| File Storage | Supabase Storage |
| AI — Handwriting | Gemini 1.5 Flash |
| AI — Grading | Gemini 1.5 Pro |

---

## Features

### ✅ Complete
- Multi-role authentication (Teacher / Student) via Google OAuth and magic link
- Role-based routing and protected dashboards
- Profile completion flow for new users
- Class creation with auto-generated invite codes
- Student enrollment via class code
- Assignment creation with mark scheme upload
- PDF and image submission pipeline to Supabase Storage
- Relational database schema with automated triggers

### 🔄 In Progress
- Gemini AI handwriting extraction
- Automated grading against mark schemes
- Per-question feedback generation
- Teacher grade verification and override UI
- Student results view

### 📋 Planned
- Class analytics dashboard
- Late submission tracking
- Student dispute system
- Email notifications

---

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | Extended user info — role, school, grade level |
| `classes` | Teacher classes with invite codes |
| `class_enrollments` | Student ↔ class relationships |
| `assignments` | Assignments with mark scheme data |
| `submissions` | Student file submissions with status tracking |
| `grading_details` | Per-question AI grades, feedback, and teacher overrides |
| `ocr_segments` | Per-segment handwriting transcription from Gemini Flash — stores raw and student-corrected text with self-reported confidence scores. Low confidence segments (< 0.85) are flagged for student review before grading begins |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project
- A Google AI Studio API key (for Gemini)

### Installation

```bash
git clone https://github.com/yourusername/valency-ai.git
cd valency-ai
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Run Locally

```bash
npm run dev
```

---

## Project Status

This project is being built solo as a real SaaS product alongside a CS degree.
It is not a university assignment — it is intended for real classroom use.

---

## Author

Built by Abdallah Amr Saleh — Software Engineering student, 6th semester.
Open to feedback, collaboration, and beta teacher partnerships.

abdallahh.amr2005@gmail.com · https://www.linkedin.com/in/abdallah-amr-28076a274/
