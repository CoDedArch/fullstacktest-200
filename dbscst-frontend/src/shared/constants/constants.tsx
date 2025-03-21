export const CHECK_EMAIL_URL = "http://127.0.0.1:8000/auth/check-email";
export const SIGN_UP_URL = "http://127.0.0.1:8000/auth/signup";
export const LOGIN_URL = "http://127.0.0.1:8000/auth/login";
export const USER_PROJECTS_URL = "http://127.0.0.1:8000/api/user-projects";
export const GENERATE_SCHEMA_URL = "http://127.0.0.1:8000/api/generate-schema";
export const SINGLE_PROJECT_URL =
  "http://127.0.0.1:8000/api/user-projects/project/get/";
export const PROJECT_SCHEMA_UPDATE_URL =
  "http://127.0.0.1:8000/api/user-projects/project/update/";


export interface HeaderProps {
  showProjectTitle?: boolean;
  userImageSrc?: string;
  projectTitle?: string;
}

interface Schema {
  id: string;
  name: string;
  description?: string;
  schema_type: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  created_at: string;
}

export interface ProjectInterface {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  url: string;
  schemas: Schema[];
}


interface Table {
  name: string;
  description: string;
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
}

export interface ProjectSchema {
  project_title: string;
  follow_up_question: string;
  tables: Table[];
  conversation_id?: string;
}
