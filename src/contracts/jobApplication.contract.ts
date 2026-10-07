export type JobPosition =
  | 'local_courier'
  | 'sourcing_courier'
  | 'customer_service'
  | 'accountant'
  | 'warehouse_manager'
  | 'branch_manager'
  | 'other';

export type JobQualification = 'Bachelor' | 'Diploma' | 'HighSchool' | 'Master' | 'Other';

export interface JobApplicationInput {
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  address?: string;
  jobPosition: JobPosition;
  qualification: JobQualification;
  experienceYears: number;
  idNumber?: string;
  notes?: string;
}

export interface JobApplicationSubmission {
  refCode: string;
}
