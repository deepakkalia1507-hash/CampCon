import { useState, useEffect } from 'react';
import { Student, PlacementRegistration, EventRegistration, AdminPlacement, AdminEvent, AdminCompetition, Placement, Event } from '../types';
import { apiClient } from '../api/client';

interface AdminDashboardProps {
  onLogout: () => void;
}

const ADMIN_EMAIL = 'rajayanand54@gmail.com';

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'students' | 'placements' | 'events' | 'add-placement' | 'add-event'>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [placementRegistrations, setPlacementRegistrations] = useState<PlacementRegistration[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [selectedPlacement, setSelectedPlacement] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');

  // Combined placements and events from API
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // Add placement form
  const [newPlacement, setNewPlacement] = useState({
    companyName: '',
    logo: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    roles: '',
    eligibility: '',
    package: ''
  });

  // Add event form
  const [newEvent, setNewEvent] = useState({
    eventName: '',
    image: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    rules: '',
    contactPerson: '',
    contactNumber: ''
  });

  // Competitions management
  const [competitions, setCompetitions] = useState<AdminCompetition[]>([
    { id: 'temp-1', name: '', image: '', description: '', prize: '', teamSize: '', type: 'Individual' }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsData, placementsData, eventsData, pRegs, eRegs] = await Promise.all([
        apiClient.getAllStudents(),
        apiClient.getPlacements(),
        apiClient.getEvents(),
        apiClient.getAllPlacementRegistrations(),
        apiClient.getAllEventRegistrations()
      ]);

      setStudents(studentsData);
      setPlacements(placementsData);
      setEvents(eventsData);
      setPlacementRegistrations(pRegs);
      setEventRegistrations(eRegs);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  const handleDeletePlacementRegistration = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete placement registration for ${name}?`)) {
      try {
        await apiClient.deletePlacementRegistration(id);
        fetchData();
      } catch (error) {
        console.error("Failed to delete placement registration", error);
        alert("Failed to delete registration.");
      }
    }
  };

  const handleDeleteEventRegistration = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete event registration for ${name}?`)) {
      try {
        await apiClient.deleteEventRegistration(id);
        fetchData();
      } catch (error) {
        console.error("Failed to delete event registration", error);
        alert("Failed to delete registration.");
      }
    }
  };

  const getPlacementDetails = (placementId: string) => {
    return placements.find(p => p.id === placementId);
  };

  const getEventDetails = (eventId: string) => {
    return events.find(e => e.id === eventId);
  };

  const getCompetitionDetails = (eventId: string, competitionId: string) => {
    const event = events.find(e => e.id === eventId);
    return event?.competitions.find(c => c.id === competitionId);
  };

  const groupedPlacementRegistrations = placementRegistrations.reduce((acc, reg) => {
    const key = `${reg.placementId}-${reg.roleName}`;
    if (!acc[key]) {
      const placement = getPlacementDetails(reg.placementId);
      acc[key] = {
        placement: placement,
        role: reg.roleName,
        count: 0,
        students: []
      };
    }
    acc[key].count++;
    acc[key].students.push(reg);
    return acc;
  }, {} as Record<string, { placement: any, role: string, count: number, students: PlacementRegistration[] }>);

  const groupedEventRegistrations = eventRegistrations.reduce((acc, reg) => {
    const key = `${reg.eventId}-${reg.competitionId}`;
    if (!acc[key]) {
      const event = getEventDetails(reg.eventId);
      const competition = getCompetitionDetails(reg.eventId, reg.competitionId);
      acc[key] = {
        event: event,
        competition: competition,
        count: 0,
        students: []
      };
    }
    acc[key].count++;
    acc[key].students.push(reg);
    return acc;
  }, {} as Record<string, { event: any, competition: any, count: number, students: EventRegistration[] }>);

  const handleAddPlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rolesArray = newPlacement.roles.split(',').map(r => r.trim()).filter(r => r);
      // We aren't using AdminPlacement type exactly anymore for creation, but let's stick to what createPlacement expects.
      // apiClient.createPlacement expects AdminPlacement (or similar object).
      // Let's create the object.
      const placementData: AdminPlacement = {
        id: '', // Backend assigns ID
        companyName: newPlacement.companyName,
        logo: newPlacement.logo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
        description: newPlacement.description,
        date: newPlacement.date,
        time: newPlacement.time,
        venue: newPlacement.venue,
        roles: rolesArray,
        eligibility: newPlacement.eligibility,
        package: newPlacement.package,
        createdBy: ADMIN_EMAIL,
        createdAt: new Date().toISOString()
      };

      await apiClient.createPlacement(placementData);

      setNewPlacement({
        companyName: '',
        logo: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        roles: '',
        eligibility: '',
        package: ''
      });
      alert('Placement added successfully!');
      fetchData();
      setActiveTab('placements');
    } catch (error) {
      console.error("Failed to add placement", error);
      alert("Failed to add placement.");
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete student ${name}?`)) {
      try {
        await apiClient.deleteStudent(id);
        setStudents(students.filter(s => s.id !== id));
        fetchData(); // Refresh all data just in case
      } catch (error) {
        console.error("Failed to delete student", error);
      }
    }
  };

  const handleAddCompetition = () => {
    setCompetitions([...competitions, { id: 'temp-' + Date.now(), name: '', image: '', description: '', prize: '', teamSize: '', type: 'Individual' }]);
  };

  const handleRemoveCompetition = (index: number) => {
    if (competitions.length === 1) {
      alert('You need at least one competition!');
      return;
    }
    const newCompetitions = competitions.filter((_, i) => i !== index);
    setCompetitions(newCompetitions);
  };

  const handleCompetitionChange = (index: number, field: keyof AdminCompetition, value: string) => {
    const newCompetitions = [...competitions];
    // @ts-ignore
    newCompetitions[index] = { ...newCompetitions[index], [field]: value };
    setCompetitions(newCompetitions);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate competitions
    const validCompetitions = competitions.filter(c => c.name.trim() !== '');
    if (validCompetitions.length === 0) {
      alert('Please add at least one competition with a name!');
      return;
    }

    // Prepare competitions for backend
    // Backend expects specific format? 
    // My apiClient.createEvent handles it.

    // We need to map local ID to something backend can accept? 
    // Actually apiClient.createEvent sends them as is, but we might want to clean IDs.
    // The backend won't use our IDs anyway.

    const finalCompetitions: AdminCompetition[] = validCompetitions.map((c) => ({
      id: '', // Backend assigns ID
      name: c.name,
      image: c.image || 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=300&h=200&fit=crop',
      description: c.description,
      prize: c.prize,
      teamSize: c.teamSize,
      type: c.type
    }));

    const eventData: AdminEvent = {
      id: '', // Backend assigns ID
      eventName: newEvent.eventName,
      image: newEvent.image || 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=400&h=300&fit=crop',
      description: newEvent.description,
      date: newEvent.date,
      time: newEvent.time,
      venue: newEvent.venue,
      competitions: finalCompetitions,
      createdBy: ADMIN_EMAIL,
      createdAt: new Date().toISOString(),
      rules: newEvent.rules,
      contactPerson: newEvent.contactPerson,
      contactNumber: newEvent.contactNumber
    };

    try {
      await apiClient.createEvent(eventData);

      setNewEvent({
        eventName: '',
        image: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        rules: '',
        contactPerson: '',
        contactNumber: ''
      });
      setCompetitions([{ id: 'temp-1', name: '', image: '', description: '', prize: '', teamSize: '', type: 'Individual' }]);
      alert('Event added successfully!');
      fetchData();
      setActiveTab('events');
    } catch (error) {
      console.error("Failed to add event", error);
      alert("Failed to add event.");
    }
  };

  const exportToExcel = (type: 'students' | 'placements' | 'events', data: any[], filename: string) => {
    let csvContent = '';

    if (type === 'students') {
      csvContent = 'Name,Register Number,Email,Phone,Class,Department,Year,College,CGPA,Backlogs,Arrears,10th Marks,12th Marks,Placements,Events\n';
      data.forEach((student: Student) => {
        const placementCount = placementRegistrations.filter(r => r.studentId === student.id).length;
        const eventCount = eventRegistrations.filter(r => r.studentId === student.id).length;
        csvContent += `"${student.name}","${student.registerNumber}","${student.email}","${student.phone}","${student.class}","${student.department}","${student.year}","${student.college}","${student.cgpa || ''}","${student.backlogs || ''}","${student.historyOfArrears || ''}","${student.tenthMarks || ''}","${student.twelfthMarks || ''}",${placementCount},${eventCount}\n`;
      });
    } else if (type === 'placements') {
      csvContent = 'Company,Role,Student Name,Register Number,Email,Phone,Class,Department,CGPA,Backlogs,Arrears,10th Marks,12th Marks,Resume URL\n';
      data.forEach((reg: PlacementRegistration) => {
        const placement = getPlacementDetails(reg.placementId);
        const resumeUrl = reg.resume ? (reg.resume.startsWith('http') ? reg.resume : `http://127.0.0.1:8000${reg.resume}`) : null;

        // Excel formula for clickable link in CSV: "=HYPERLINK(""url"", ""text"")"
        const resumeFormula = resumeUrl
          ? `"=HYPERLINK(""${resumeUrl}"", ""View Resume"")"`
          : '"Not uploaded"';

        csvContent += `"${placement?.companyName}","${reg.roleName}","${reg.studentDetails.name}","${reg.studentDetails.registerNumber}","${reg.studentDetails.email}","${reg.studentDetails.phone}","${reg.studentDetails.class}","${reg.studentDetails.department}","${reg.studentDetails.cgpa || ''}","${reg.studentDetails.backlogs || ''}","${reg.studentDetails.historyOfArrears || ''}","${reg.studentDetails.tenthMarks || ''}","${reg.studentDetails.twelfthMarks || ''}",${resumeFormula}\n`;
      });
    } else if (type === 'events') {
      csvContent = 'Event,Competition,Student Name,Register Number,Email,Phone,Class,Department\n';
      data.forEach((reg: EventRegistration) => {
        const event = getEventDetails(reg.eventId);
        const competition = getCompetitionDetails(reg.eventId, reg.competitionId);
        csvContent += `"${event?.eventName}","${competition?.name}","${reg.studentDetails.name}","${reg.studentDetails.registerNumber}","${reg.studentDetails.email}","${reg.studentDetails.phone}","${reg.studentDetails.class}","${reg.studentDetails.department}"\n`;
      });
    }

    // Add UTF-8 BOM for Excel compatibility
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Remove combined arrays since we use state directly
  // const allPlacements = [...placements, ...adminPlacements];
  // const allEvents = [...events, ...adminEvents];

  return (
    <div className="min-h-screen app-background">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">Event & Placement Management System</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
            >
              Logout
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {[
              { id: 'students', label: '👥 Students', count: students.length },
              { id: 'placements', label: '🏢 Placements', count: placementRegistrations.length },
              { id: 'events', label: '🎉 Events', count: eventRegistrations.length },
              { id: 'add-placement', label: '➕ Add Placement', icon: '➕' },
              { id: 'add-event', label: '➕ Add Event', icon: '➕' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {tab.label} {tab.count !== undefined && `(${tab.count})`}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Students Tab */}
        {activeTab === 'students' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">👥 Registered Students ({students.length})</h2>
              <button
                onClick={() => exportToExcel('students', students, 'students_list')}
                className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
              >
                📊 Export to Excel
              </button>
            </div>
            {students.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <p className="text-gray-500 text-lg">No students registered yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map(student => {
                  const studentPlacements = placementRegistrations.filter(r => r.studentId === student.id).length;
                  const studentEvents = eventRegistrations.filter(r => r.studentId === student.id).length;
                  return (
                    <div key={student.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{student.name}</h3>
                          <p className="text-sm text-gray-600">{student.registerNumber}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="text-gray-800 font-medium">{student.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="text-gray-800 font-medium">{student.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Class:</span>
                          <span className="text-gray-800 font-medium">{student.class}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Department:</span>
                          <span className="text-gray-800 font-medium">{student.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Year:</span>
                          <span className="text-gray-800 font-medium">{student.year} Year</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">College:</span>
                          <span className="text-gray-800 font-medium truncate ml-2">{student.college}</span>
                        </div>
                        <div className="pt-2 mt-2 border-t grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-gray-500">CGPA:</span> <span className="font-bold text-blue-600">{student.cgpa || '-'}</span></div>
                          <div><span className="text-gray-500">Backlogs:</span> <span className="font-semibold text-gray-700">{student.backlogs || '0'}</span></div>
                          <div><span className="text-gray-500">Arrears:</span> <span className="font-semibold text-gray-700">{student.historyOfArrears || 'No'}</span></div>
                          <div><span className="text-gray-500">Marks:</span> <span className="font-semibold text-gray-700">{student.tenthMarks || '-'}/{student.twelfthMarks || '-'}</span></div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t flex gap-4">
                        <div className="flex-1 text-center">
                          <p className="text-2xl font-bold text-blue-600">{studentPlacements}</p>
                          <p className="text-xs text-gray-500">Placements</p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-2xl font-bold text-pink-600">{studentEvents}</p>
                          <p className="text-xs text-gray-500">Events</p>
                        </div>
                        <div className="flex-1 flex items-center justify-center border-l pl-4">
                          <button
                            onClick={() => handleDeleteStudent(student.id, student.name)}
                            className="bg-red-100 p-2 rounded-full hover:bg-red-200 text-red-600 transition-colors"
                            title="Delete Student"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Placements Tab */}
        {activeTab === 'placements' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">🏢 Placement Registrations</h2>
              <button
                onClick={() => exportToExcel('placements', placementRegistrations, 'placement_registrations')}
                className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
              >
                📊 Export to Excel
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Company:</label>
              <select
                value={selectedPlacement}
                onChange={(e) => setSelectedPlacement(e.target.value)}
                className="w-full md:w-96 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="">All Companies</option>
                {placements.map(p => (
                  <option key={p.id} value={p.id}>{p.companyName}</option>
                ))}
              </select>
            </div>

            {placementRegistrations.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <p className="text-gray-500 text-lg">No placement registrations yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPlacementRegistrations)
                  .filter(([key]) => !selectedPlacement || key.startsWith(selectedPlacement))
                  .map(([key, data]) => (
                    <div key={key} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-bold text-white">{data.placement?.companyName}</h3>
                            <p className="text-white/80">Role: {data.role}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => exportToExcel('placements', data.students, `${data.placement?.companyName}_${data.role}_students`)}
                              className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
                            >
                              📊 Export List
                            </button>
                            <div className="bg-white/20 px-4 py-2 rounded-xl">
                              <p className="text-2xl font-bold text-white">{data.count}</p>
                              <p className="text-xs text-white/80">Students</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Register No</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Class</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CGPA</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Backlogs</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Arrears</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">10th%</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">12th%</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Resume</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.students.map(reg => (
                                <tr key={reg.id} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.name}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.registerNumber}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.email}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.phone}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.class}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.department}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800 font-bold text-blue-600">{reg.studentDetails.cgpa || '-'}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.backlogs || '0'}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.historyOfArrears || 'No'}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.tenthMarks || '-'}%</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.twelfthMarks || '-'}%</td>
                                  <td className="py-3 px-4 text-sm">
                                    {reg.resume ? (
                                      <a
                                        href={reg.resume.startsWith('http') ? reg.resume : `http://127.0.0.1:8000${reg.resume}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                                      >
                                        📄 {reg.resumeName || 'View Resume'}
                                      </a>
                                    ) : (
                                      <span className="text-gray-400">Not uploaded</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-sm">
                                    <button
                                      onClick={() => handleDeletePlacementRegistration(reg.id, reg.studentDetails.name)}
                                      className="text-red-500 hover:text-red-700 transition-colors"
                                      title="Delete Registration"
                                    >
                                      🗑️
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">🎉 Event Registrations</h2>
              <button
                onClick={() => exportToExcel('events', eventRegistrations, 'event_registrations')}
                className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
              >
                📊 Export to Excel
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Event:</label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full md:w-96 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
              >
                <option value="">All Events</option>
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.eventName}</option>
                ))}
              </select>
            </div>

            {eventRegistrations.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <p className="text-gray-500 text-lg">No event registrations yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedEventRegistrations)
                  .filter(([key]) => !selectedEvent || key.startsWith(selectedEvent))
                  .map(([key, data]) => (
                    <div key={key} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-pink-500 to-orange-500 px-6 py-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-bold text-white">{data.event?.eventName}</h3>
                            <p className="text-white/80">Competition: {data.competition?.name}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => exportToExcel('events', data.students, `${data.event?.eventName}_${data.competition?.name}_students`)}
                              className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
                            >
                              📊 Export List
                            </button>
                            <div className="bg-white/20 px-4 py-2 rounded-xl">
                              <p className="text-2xl font-bold text-white">{data.count}</p>
                              <p className="text-xs text-white/80">Students</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="mb-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl p-4">
                          <div className="flex gap-4">
                            {data.competition?.image && (
                              <img
                                src={data.competition.image}
                                alt={data.competition.name}
                                className="w-32 h-20 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <p className="text-sm text-gray-600">{data.competition?.description}</p>
                              <p className="text-sm font-semibold text-pink-600 mt-1">🏆 Prize: {data.competition?.prize}</p>
                            </div>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Register No</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Class</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CGPA</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Backlogs</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.students.map(reg => (
                                <tr key={reg.id} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.name}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.registerNumber}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.email}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.phone}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.class}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.department}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800 font-bold text-blue-600">{reg.studentDetails.cgpa || '-'}</td>
                                  <td className="py-3 px-4 text-sm text-gray-800">{reg.studentDetails.backlogs || '0'}</td>
                                  <td className="py-3 px-4 text-sm">
                                    <button
                                      onClick={() => handleDeleteEventRegistration(reg.id, reg.studentDetails.name)}
                                      className="text-red-500 hover:text-red-700 transition-colors"
                                      title="Delete Registration"
                                    >
                                      🗑️
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Add Placement Tab */}
        {activeTab === 'add-placement' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">➕ Add New Placement</h2>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <form onSubmit={handleAddPlacement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={newPlacement.companyName}
                    onChange={(e) => setNewPlacement({ ...newPlacement, companyName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label>
                  <input
                    type="url"
                    value={newPlacement.logo}
                    onChange={(e) => setNewPlacement({ ...newPlacement, logo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={newPlacement.description}
                    onChange={(e) => setNewPlacement({ ...newPlacement, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    rows={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={newPlacement.date}
                      onChange={(e) => setNewPlacement({ ...newPlacement, date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <input
                      type="time"
                      value={newPlacement.time}
                      onChange={(e) => setNewPlacement({ ...newPlacement, time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
                  <input
                    type="text"
                    value={newPlacement.venue}
                    onChange={(e) => setNewPlacement({ ...newPlacement, venue: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roles (comma separated) *</label>
                  <input
                    type="text"
                    value={newPlacement.roles}
                    onChange={(e) => setNewPlacement({ ...newPlacement, roles: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Software Engineer, Data Analyst, Frontend Developer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility *</label>
                  <input
                    type="text"
                    value={newPlacement.eligibility}
                    onChange={(e) => setNewPlacement({ ...newPlacement, eligibility: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package *</label>
                  <input
                    type="text"
                    value={newPlacement.package}
                    onChange={(e) => setNewPlacement({ ...newPlacement, package: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="₹8-15 LPA"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('placements')}
                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg"
                  >
                    Add Placement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Event Tab */}
        {activeTab === 'add-event' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">➕ Add New Event</h2>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <form onSubmit={handleAddEvent} className="space-y-6">
                {/* Event Details */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800 border-b pb-2">📋 Event Details</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                    <input
                      type="text"
                      value={newEvent.eventName}
                      onChange={(e) => setNewEvent({ ...newEvent, eventName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                      placeholder="e.g., Annual Cultural Fest"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Image URL (optional)</label>
                    <input
                      type="url"
                      value={newEvent.image}
                      onChange={(e) => setNewEvent({ ...newEvent, image: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                      placeholder="https://example.com/event-image.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                      rows={3}
                      placeholder="Describe the event..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <input
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                      <input
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
                    <input
                      type="text"
                      value={newEvent.venue}
                      onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                      placeholder="e.g., College Auditorium"
                      required
                    />
                  </div>
                </div>

                {/* Competitions Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-xl font-bold text-gray-800">🎯 Competitions</h3>
                    <button
                      type="button"
                      onClick={handleAddCompetition}
                      className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      + Add Another Competition
                    </button>
                  </div>

                  {competitions.map((competition, index) => (
                    <div key={competition.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 relative">
                      {competitions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCompetition(index)}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-700 font-bold"
                          title="Remove Competition"
                        >
                          ✕
                        </button>
                      )}

                      <h4 className="font-semibold text-gray-700 mb-4">Competition {index + 1}</h4>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input
                              type="text"
                              value={competition.name}
                              onChange={(e) => handleCompetitionChange(index, 'name', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                              placeholder="e.g., Coding Contest"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prize *</label>
                            <input
                              type="text"
                              value={competition.prize}
                              onChange={(e) => handleCompetitionChange(index, 'prize', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                              placeholder="e.g., ₹5000"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                          <input
                            type="url"
                            value={competition.image}
                            onChange={(e) => handleCompetitionChange(index, 'image', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                            placeholder="https://example.com/competition.jpg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                          <textarea
                            value={competition.description}
                            onChange={(e) => handleCompetitionChange(index, 'description', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                            rows={2}
                            placeholder="Brief details about the competition..."
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Team Size (optional)</label>
                            <input
                              type="text"
                              value={competition.teamSize || ''}
                              onChange={(e) => handleCompetitionChange(index, 'teamSize', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                              placeholder="e.g., 2-4"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                              value={competition.type || 'Individual'}
                              onChange={(e) => handleCompetitionChange(index, 'type', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                            >
                              <option value="Individual">Individual</option>
                              <option value="Team">Team</option>
                              <option value="Individual/Team">Individual/Team</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Event Details */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">📝 Rules & Contact Info</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rules & Regulations (optional)</label>
                      <textarea
                        value={newEvent.rules}
                        onChange={(e) => setNewEvent({ ...newEvent, rules: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                        rows={4}
                        placeholder="Enter rules and regulations..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person (optional)</label>
                        <input
                          type="text"
                          value={newEvent.contactPerson}
                          onChange={(e) => setNewEvent({ ...newEvent, contactPerson: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                          placeholder="Coordinator Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number (optional)</label>
                        <input
                          type="text"
                          value={newEvent.contactNumber}
                          onChange={(e) => setNewEvent({ ...newEvent, contactNumber: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                          placeholder="Coordinator Number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('events');
                      setCompetitions([{ id: 'temp-1', name: '', image: '', description: '', prize: '', teamSize: '', type: 'Individual' }]);
                    }}
                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg"
                  >
                    Add Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
