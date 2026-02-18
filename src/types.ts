export interface Student {
  id: string;
  registerNumber: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  class: string;
  department: string;
  year: string;
  college: string;
  cgpa?: string;
  backlogs?: string;
  historyOfArrears?: string;
  tenthMarks?: string;
  twelfthMarks?: string;
}

export interface AdminPlacement {
  id: string;
  companyName: string;
  logo: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  roles: string[];
  eligibility: string;
  package: string;
  createdBy: string;
  createdAt: string;
}

export interface AdminEvent {
  id: string;
  eventName: string;
  image: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  competitions: AdminCompetition[];
  createdBy: string;
  createdAt: string;
  rules?: string;
  contactPerson?: string;
  contactNumber?: string;
}

export interface AdminCompetition {
  id: string;
  name: string;
  image: string;
  description: string;
  prize: string;
  teamSize?: string;
  type?: 'Individual' | 'Team' | 'Individual/Team';
}

export interface Admin {
  email: string;
  password: string;
}

export interface Placement {
  id: string;
  companyName: string;
  logo: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  roles: string[];
  eligibility: string;
  package: string;
}

export interface Event {
  id: string;
  eventName: string;
  image: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  competitions: Competition[];
  rules?: string;
  contactPerson?: string;
  contactNumber?: string;
}

export interface Competition {
  id: string;
  name: string;
  image: string;
  description: string;
  prize: string;
  teamSize?: string;
  type?: 'Individual' | 'Team' | 'Individual/Team';
}

export interface PlacementRegistration {
  id: string;
  studentId: string;
  placementId: string;
  roleName: string;
  resume?: string;
  resumeName?: string;
  registeredAt: string;
  studentDetails: {
    name: string;
    registerNumber: string;
    email: string;
    phone: string;
    class: string;
    department: string;
    year: string;
    college: string;
    cgpa?: string;
    backlogs?: string;
    historyOfArrears?: string;
    tenthMarks?: string;
    twelfthMarks?: string;
  };
}

export interface EventRegistration {
  id: string;
  studentId: string;
  eventId: string;
  competitionId: string;
  registeredAt: string;
  studentDetails: {
    name: string;
    registerNumber: string;
    email: string;
    phone: string;
    class: string;
    department: string;
    year: string;
    college: string;
    cgpa?: string;
    backlogs?: string;
    historyOfArrears?: string;
    tenthMarks?: string;
    twelfthMarks?: string;
  };
}

export type UserRole = 'student' | 'admin' | null;
