import axios from 'axios';
import { Student, Placement, Event, PlacementRegistration, EventRegistration, AdminPlacement, AdminEvent } from '../types';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helpers to map Backend (snake_case) <-> Frontend (camelCase)
const mapStudentFromBackend = (data: any): Student => {
    return {
        ...data,
        registerNumber: data.register_number || data.registerNumber,
        studentClass: data.student_class || data.class || data.studentClass,
        historyOfArrears: data.history_of_arrears || data.historyOfArrears || 'No',
        tenthMarks: data.tenth_marks || data.tenthMarks || '',
        twelfthMarks: data.twelfth_marks || data.twelfthMarks || '',
        cgpa: data.cgpa || '',
        backlogs: data.backlogs !== undefined && data.backlogs !== null ? String(data.backlogs) : '0',
        class: data.student_class || data.class || data.studentClass,
        // Carry over name and basic info just in case they are missing in data but present in snake_case
        name: data.name || data.student_name,
        email: data.email || data.student_email,
        phone: data.phone || data.student_phone,
        department: data.department || data.student_department,
        year: String(data.year || data.student_year || '1'),
        college: data.college || data.student_college,
    };
};

const mapStudentToBackend = (student: Student): any => {
    const { id, ...rest } = student;
    return {
        ...rest,
        register_number: student.registerNumber,
        student_class: student.class,
        history_of_arrears: student.historyOfArrears,
        tenth_marks: student.tenthMarks,
        twelfth_marks: student.twelfthMarks,
        password_hash: student.password,
    };
};

export const apiClient = {
    // Auth
    login: async (registerNumber: string, password: string): Promise<Student | null> => {
        try {
            const response = await api.post('/students/login/', { register_number: registerNumber, password });
            return mapStudentFromBackend(response.data);
        } catch (error) {
            console.error('Login failed', error);
            return null;
        }
    },

    register: async (student: Student): Promise<Student | null> => {
        try {
            const data = mapStudentToBackend(student);
            const response = await api.post('/students/', data);
            return mapStudentFromBackend(response.data);
        } catch (error) {
            console.error('Registration failed', error);
            throw error;
        }
    },

    // Students
    getStudent: async (id: string): Promise<Student | null> => {
        try {
            const response = await api.get(`/students/${id}/`);
            return mapStudentFromBackend(response.data);
        } catch (error) {
            console.error('Get student failed', error);
            return null;
        }
    },

    updateStudent: async (id: string, data: Partial<Student>): Promise<Student | null> => {
        try {
            // Map frontend camelCase to backend snake_case
            const mappedData: any = { ...data };
            if (data.registerNumber !== undefined) mappedData.register_number = data.registerNumber;
            if (data.class !== undefined) mappedData.student_class = data.class;
            if (data.historyOfArrears !== undefined) mappedData.history_of_arrears = data.historyOfArrears;
            if (data.tenthMarks !== undefined) mappedData.tenth_marks = data.tenthMarks;
            if (data.twelfthMarks !== undefined) mappedData.twelfth_marks = data.twelfthMarks;
            if (data.cgpa !== undefined) mappedData.cgpa = data.cgpa;
            if (data.backlogs !== undefined) mappedData.backlogs = data.backlogs;

            // Cleanup frontend specific keys
            delete mappedData.registerNumber;
            delete mappedData.historyOfArrears;
            delete mappedData.tenthMarks;
            delete mappedData.twelfthMarks;
            delete mappedData.class;

            const response = await api.patch(`/students/${id}/`, mappedData);
            return mapStudentFromBackend(response.data);
        } catch (error) {
            console.error('Update student failed', error);
            throw error;
        }
    },

    getAllStudents: async (): Promise<Student[]> => {
        const response = await api.get('/students/');
        return response.data.map(mapStudentFromBackend);
    },

    deleteStudent: async (id: string) => {
        await api.delete(`/students/${id}/`);
    },

    // Placements
    getPlacements: async (): Promise<Placement[]> => {
        const response = await api.get('/placements/');
        // Backend returns snake_case for fields? Placement model fields: company_name, etc.
        // Frontend Placement interface: companyName.
        // We need mapping for Placement too!
        return response.data.map((p: any) => ({
            ...p,
            companyName: p.company_name,
            // date, time, venue, description, etc are same if simple.
            // roles is text in backend? Need to parse JSON if we invoke splitting?
            // Note: In models.py I used TextField. I should split it.
            // But let's assume I store it as comma separated string.
            // Frontend expects string[].
            roles: typeof p.roles === 'string' ? p.roles.split(',') : p.roles,
        }));
    },

    createPlacement: async (data: AdminPlacement): Promise<Placement> => {
        // AdminPlacement (frontend) -> Backend
        const backendData = {
            ...data,
            company_name: data.companyName,
            roles: Array.isArray(data.roles) ? data.roles.join(',') : data.roles,
        };
        const response = await api.post('/placements/', backendData);
        const p = response.data;
        return {
            ...p,
            companyName: p.company_name,
            roles: typeof p.roles === 'string' ? p.roles.split(',') : p.roles,
        };
    },

    // Events
    getEvents: async (): Promise<Event[]> => {
        const response = await api.get('/events/');
        return response.data.map((e: any) => ({
            ...e,
            eventName: e.event_name,
            contactPerson: e.contact_person,
            contactNumber: e.contact_number,
            competitions: e.competitions.map((c: any) => ({
                ...c,
                teamSize: c.team_size
            }))
        }));
    },

    createEvent: async (data: AdminEvent): Promise<Event> => {
        const backendData = {
            ...data,
            event_name: data.eventName,
            contact_person: data.contactPerson,
            contact_number: data.contactNumber,
            // createEvent usually creates event first, then competitions? 
            // Or nested create. DRF supports nested write if configured, but default ModelSerializer might not without 'create' method override.
            // For simplicity, we create event, then competitions.
            // BUT, for now let's assumes we post data and backend handles it?
            // My EventSerializer has `competitions` as read_only.
            // So I need to create competitions separately.
        };
        const response = await api.post('/events/', backendData);
        // After creating event, create competitions
        const eventId = response.data.id;
        if (data.competitions && data.competitions.length > 0) {
            for (const comp of data.competitions) {
                await apiClient.createCompetition({ ...comp, event: eventId });
            }
        }
        // Re-fetch to get full object or construct it
        return apiClient.getEvents().then(events => events.find(e => e.id === eventId)!);
    },

    createCompetition: async (data: any) => {
        const backendData = {
            ...data,
            team_size: data.teamSize
        };
        const response = await api.post('/competitions/', backendData);
        return response.data;
    },

    // Registrations
    registerPlacement: async (registration: any): Promise<PlacementRegistration> => {
        let payload;
        let headers = {};

        if (registration instanceof FormData) {
            payload = registration;
            headers = { 'Content-Type': 'multipart/form-data' };
        } else {
            payload = {
                student: registration.studentId,
                placement: registration.placementId,
                role_name: registration.roleName,
                resume_name: registration.resumeName
            };
        }

        const response = await api.post('/registrations/placements/', payload, { headers });
        return response.data;
    },

    registerEvent: async (registration: any): Promise<EventRegistration> => {
        const backendData = {
            student: registration.studentId,
            event: registration.eventId,
            competition: registration.competitionId
        };
        const response = await api.post('/registrations/events/', backendData);
        return response.data;
    },

    getStudentPlacementRegistrations: async (studentId: string): Promise<PlacementRegistration[]> => {
        const response = await api.get('/registrations/placements/');
        // Filter locally for now
        return response.data
            .filter((r: any) => r.student === parseInt(studentId) || r.student_details?.id === parseInt(studentId))
            .map((r: any) => ({
                ...r,
                studentId: r.student,
                placementId: r.placement,
                roleName: r.role_name,
                resume: r.resume,
                resumeName: r.resume_name,
                registeredAt: r.registered_at, // snake_case from backend
                studentDetails: mapStudentFromBackend(r.student_details),
                // Need placementDetails mapping too if used
            }));
    },

    getStudentEventRegistrations: async (studentId: string): Promise<EventRegistration[]> => {
        const response = await api.get('/registrations/events/');
        return response.data
            .filter((r: any) => r.student === parseInt(studentId) || r.student_details?.id === parseInt(studentId))
            .map((r: any) => ({
                ...r,
                studentId: r.student,
                eventId: r.event,
                competitionId: r.competition,
                registeredAt: r.registered_at,
                studentDetails: mapStudentFromBackend(r.student_details),
                // eventDetails, competitionDetails mapping if needed
            }));
    },

    getAllPlacementRegistrations: async (): Promise<PlacementRegistration[]> => {
        const response = await api.get('/registrations/placements/');
        return response.data.map((r: any) => ({
            ...r,
            studentId: r.student,
            placementId: r.placement,
            roleName: r.role_name,
            resume: r.resume,
            resumeName: r.resume_name,
            registeredAt: r.registered_at,
            studentDetails: mapStudentFromBackend(r.student_details),
        }));
    },

    getAllEventRegistrations: async (): Promise<EventRegistration[]> => {
        const response = await api.get('/registrations/events/');
        return response.data.map((r: any) => ({
            ...r,
            studentId: r.student,
            eventId: r.event,
            competitionId: r.competition,
            registeredAt: r.registered_at,
            studentDetails: mapStudentFromBackend(r.student_details),
        }));
    },

    deletePlacementRegistration: async (id: string) => {
        await api.delete(`/registrations/placements/${id}/`);
    },

    deleteEventRegistration: async (id: string) => {
        await api.delete(`/registrations/events/${id}/`);
    }
};
