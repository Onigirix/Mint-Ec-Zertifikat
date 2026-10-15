export interface Student {
  student_id: number;
  name: string;
  birthday: string | null;
  graduation_year: number | null;
  school_id: number | null;
  school_name?: string | null;
  [key: string]: unknown;
}
export interface School {
  school_id: number;
  school_name: string;
  school_location: string;
  school_functionary_1: string;
  school_functionary_2: string;
  school_functionary_1_position: string;
  school_functionary_2_position: string;
}
export interface Activity {
  additional_mint_activity_id: number;
  name: string;
  description: string;
  level_one: string;
  level_two: string;
  level_three: string;
  sek: number;
}
export interface Achievement {
  student_additional_mint_activities_id: number;
  competition_name: string;
  sek: number;
  level: number;
  level_description: string;
  year: number | null;
  achievement_info: string;
}
