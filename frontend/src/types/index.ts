export type UserRole = 'admin' | 'candidate' | 'recruiter';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface CandidateProfile {
  id: number;
  user_id: number;
  resume_path: string | null;
  skills: string | null;
  experience: string | null;
  education: string | null;
  phone: string | null;
  email_extracted: string | null;
  name_extracted: string | null;
  projects: string | null;
  certifications: string | null;
  languages: string | null;
}

export interface Job {
  id: number;
  company: string;
  title: string;
  description: string;
  required_skills: string;
  location: string | null;
  salary: string | null;
  experience_required: number;
  created_at: string;
}

export interface Application {
  id: number;
  candidate_id: number;
  job_id: number;
  application_status: 'applied' | 'reviewed' | 'accepted' | 'rejected';
  created_at: string;
  job?: Job;
  candidate?: {
    id: number;
    user_id: number;
    skills: string;
    experience: string;
    education: string;
    phone: string;
    name_extracted: string;
    email_extracted: string;
    user: {
      name: string;
      email: string;
    };
  };
}

export interface MatchDetails {
  skill_match: number;
  experience_match: number;
  education_match: number;
  keyword_similarity: number;
}

export interface Recommendation {
  id: number;
  candidate_id: number;
  job_id: number;
  similarity_score: number;
  match_details: string; // JSON string
  created_at: string;
  job?: Job;
}

export interface DashboardStats {
  total_users: number;
  total_candidates: number;
  total_recruiters: number;
  total_jobs: number;
  total_applications: number;
  total_recommendations: number;
  average_similarity_score: number;
  uploaded_resumes: number;
}
