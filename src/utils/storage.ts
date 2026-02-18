import { Student, PlacementRegistration, EventRegistration, AdminPlacement, AdminEvent } from '../types';

const STUDENTS_KEY = 'students';
const PLACEMENT_REGISTRATIONS_KEY = 'placement_registrations';
const EVENT_REGISTRATIONS_KEY = 'event_registrations';
const CURRENT_USER_KEY = 'current_user';
const ADMIN_PLACEMENTS_KEY = 'admin_placements';
const ADMIN_EVENTS_KEY = 'admin_events';

export const storage = {
  // Students
  getStudents: (): Student[] => {
    const data = localStorage.getItem(STUDENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveStudent: (student: Student): void => {
    const students = storage.getStudents();
    students.push(student);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  },

  deleteStudent: (studentId: string): void => {
    const students = storage.getStudents();
    const filtered = students.filter(s => s.id !== studentId);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(filtered));
  },

  updateStudent: (updatedStudent: Student): void => {
    const students = storage.getStudents();
    const index = students.findIndex(s => s.id === updatedStudent.id);
    if (index !== -1) {
      students[index] = updatedStudent;
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));

      const currentUser = storage.getCurrentUser();
      if (currentUser && currentUser.id === updatedStudent.id) {
        storage.setCurrentUser(updatedStudent);
      }
    }
  },

  findStudentByEmail: (email: string): Student | undefined => {
    const students = storage.getStudents();
    return students.find(s => s.email === email);
  },

  findStudentByRegisterNumber: (registerNumber: string): Student | undefined => {
    const students = storage.getStudents();
    return students.find(s => s.registerNumber === registerNumber);
  },

  // Current User
  getCurrentUser: (): Student | null => {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (student: Student | null): void => {
    if (student) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(student));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  // Placement Registrations
  getPlacementRegistrations: (): PlacementRegistration[] => {
    const data = localStorage.getItem(PLACEMENT_REGISTRATIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  savePlacementRegistration: (registration: PlacementRegistration): void => {
    const registrations = storage.getPlacementRegistrations();
    registrations.push(registration);
    localStorage.setItem(PLACEMENT_REGISTRATIONS_KEY, JSON.stringify(registrations));
  },

  getStudentPlacementRegistrations: (studentId: string): PlacementRegistration[] => {
    const registrations = storage.getPlacementRegistrations();
    return registrations.filter(r => r.studentId === studentId);
  },

  // Event Registrations
  getEventRegistrations: (): EventRegistration[] => {
    const data = localStorage.getItem(EVENT_REGISTRATIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveEventRegistration: (registration: EventRegistration): void => {
    const registrations = storage.getEventRegistrations();
    registrations.push(registration);
    localStorage.setItem(EVENT_REGISTRATIONS_KEY, JSON.stringify(registrations));
  },

  getStudentEventRegistrations: (studentId: string): EventRegistration[] => {
    const registrations = storage.getEventRegistrations();
    return registrations.filter(r => r.studentId === studentId);
  },

  // Check if already registered
  isRegisteredForPlacement: (studentId: string, placementId: string, roleName: string): boolean => {
    const registrations = storage.getPlacementRegistrations();
    return registrations.some(r => r.studentId === studentId && r.placementId === placementId && r.roleName === roleName);
  },

  isRegisteredForCompetition: (studentId: string, competitionId: string): boolean => {
    const registrations = storage.getEventRegistrations();
    return registrations.some(r => r.studentId === studentId && r.competitionId === competitionId);
  },

  // Admin Placements
  getAdminPlacements: (): AdminPlacement[] => {
    const data = localStorage.getItem(ADMIN_PLACEMENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveAdminPlacement: (placement: AdminPlacement): void => {
    const placements = storage.getAdminPlacements();
    placements.push(placement);
    localStorage.setItem(ADMIN_PLACEMENTS_KEY, JSON.stringify(placements));
  },

  deleteAdminPlacement: (placementId: string): void => {
    const placements = storage.getAdminPlacements();
    const filtered = placements.filter(p => p.id !== placementId);
    localStorage.setItem(ADMIN_PLACEMENTS_KEY, JSON.stringify(filtered));
  },

  // Admin Events
  getAdminEvents: (): AdminEvent[] => {
    const data = localStorage.getItem(ADMIN_EVENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveAdminEvent: (event: AdminEvent): void => {
    const events = storage.getAdminEvents();
    events.push(event);
    localStorage.setItem(ADMIN_EVENTS_KEY, JSON.stringify(events));
  },

  deleteAdminEvent: (eventId: string): void => {
    const events = storage.getAdminEvents();
    const filtered = events.filter(e => e.id !== eventId);
    localStorage.setItem(ADMIN_EVENTS_KEY, JSON.stringify(filtered));
  }
};
