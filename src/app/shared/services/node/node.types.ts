export interface NodeLinkInfo {
  id: number;
  order_index: number;
  child: NodeInfo;
}

export interface NodeInfo {
  id: number | string;
  owner?: number;
  created_at?: string;
  modified_at?: string;
  type: string;
  public?: boolean;
  title: string;
  description?: string;
  grade_level?: string;
  difficulty?: number;
  subject?: string;
  content?: { content?: string; [key: string]: unknown } | null;
  children: NodeLinkInfo[];
  user_progress?: {
    done: boolean;
    score?: number;
    max_score?: number;
    modified_at: string;
  } | null;
}

export interface UserInfo {
  url: string;
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  groups: string[];
  class_groups: MembershipInfo[];
}

export interface ClassGroupInfo {
  url: string;
  id: number;
  class_name: string;
  academic_year: string;
  users: string[];
  syllabus: string[];
  join_code: string;
}

export interface ClassGroupSyllabusInfo {
  id: number;
  class_group: number;
  node: number;
  order_index: number;
}

export interface MembershipInfo {
  url: string;
  id: number;
  user: string;
  class_group: string;
  user_status: string;
}
