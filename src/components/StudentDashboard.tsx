import { useState, useEffect, SyntheticEvent } from 'react';
import { Student, Placement, Event, PlacementRegistration, EventRegistration, AdminPlacement, AdminEvent } from '../types';
import { apiClient } from '../api/client';
import { storage } from '../utils/storage';

interface StudentDashboardProps {
  student: Student;
  onLogout: () => void;
}

export function StudentDashboard({ student, onLogout }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'placements' | 'events' | 'profile' | 'registrations'>('placements');
  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [myPlacements, setMyPlacements] = useState<PlacementRegistration[]>([]);
  const [myEvents, setMyEvents] = useState<EventRegistration[]>([]);
  const [showPlacementForm, setShowPlacementForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [notification, setNotification] = useState('');

  const [allPlacements, setAllPlacements] = useState<Placement[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);

  // Event Details Modal State
  const [showEventDetails, setShowEventDetails] = useState(false);

  // Profile Alert State
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    class: '',
    department: '',
    year: '',
    college: '',
    cgpa: '',
    backlogs: '',
    historyOfArrears: '',
    tenthMarks: '',
    twelfthMarks: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [placementsData, eventsData, myPlacementsData, myEventsData] = await Promise.all([
          apiClient.getPlacements(),
          apiClient.getEvents(),
          apiClient.getStudentPlacementRegistrations(student.id),
          apiClient.getStudentEventRegistrations(student.id)
        ]);

        setAllPlacements(placementsData);
        setAllEvents(eventsData);
        setMyPlacements(myPlacementsData);
        setMyEvents(myEventsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [student.id, activeTab]);

  useEffect(() => {
    checkUpcomingEvents();
  }, [allPlacements, allEvents]);

  const checkUpcomingEvents = () => {
    const today = new Date();

    const upcomingPlacements = allPlacements.filter(p => {
      const eventDate = new Date(p.date);
      const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    });

    const upcomingEvents = allEvents.filter(e => {
      const eventDate = new Date(e.date);
      const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    });

    if (upcomingPlacements.length > 0 || upcomingEvents.length > 0) {
      let message = '🔔 Upcoming: ';
      const items = [...upcomingPlacements.map(p => p.companyName), ...upcomingEvents.map(e => e.eventName)];
      message += items.join(', ');
      setNotification(message);
      setTimeout(() => setNotification(''), 8000);
    }
  };

  const handlePlacementApply = (placement: Placement | AdminPlacement) => {
    // Check for missing academic details
    const requiredFields = [
      { key: 'cgpa', label: 'CGPA' },
      { key: 'tenthMarks', label: '10th Marks' },
      { key: 'twelfthMarks', label: '12th Marks' },
      { key: 'year', label: 'Current Year' },
      { key: 'college', label: 'College' }
    ];

    const missing = requiredFields.filter(field => {
      const val = (student as any)[field.key];
      return !val || val.toString().trim() === '';
    });

    if (missing.length > 0) {
      setMissingFields(missing.map(f => f.label));
      setShowProfileAlert(true);
      return;
    }

    setSelectedPlacement(placement);
    setSelectedRole('');
    setResumeFile(null);
    setShowPlacementForm(true);
  };

  const handleEventRegister = (event: Event | AdminEvent) => {
    setSelectedEvent(event);
    setSelectedCompetition('');
    setShowEventDetails(false);
    setShowEventForm(true);
  };

  const handleViewEventDetails = (event: Event | AdminEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleCompetitionRegister = (event: Event | AdminEvent, competitionId: string) => {
    setSelectedEvent(event);
    setSelectedCompetition(competitionId);
    setShowEventDetails(false); // Close details modal to show registration form
    setShowEventForm(true);
  };



  const submitPlacementApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlacement || !selectedRole) return;

    const existingReg = myPlacements.find(r => r.studentId === student.id && r.placementId === selectedPlacement.id && r.roleName === selectedRole);
    if (existingReg) {
      alert('You have already registered for this role!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('student', student.id.toString());
      formData.append('placement', selectedPlacement.id.toString());
      formData.append('role_name', selectedRole);
      formData.append('resume_name', resumeFile?.name || '');

      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      await apiClient.registerPlacement(formData);

      setShowPlacementForm(false);
      setNotification('✅ Successfully applied for ' + selectedRole + ' at ' + selectedPlacement.companyName);
      setTimeout(() => setNotification(''), 5000);

      const newRegs = await apiClient.getStudentPlacementRegistrations(student.id);
      setMyPlacements(newRegs);

    } catch (error) {
      console.error(error);
      alert('Failed to register. Please try again.');
    }
  };

  const submitEventRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEvent || !selectedCompetition) return;

    const existingReg = myEvents.find(r => r.studentId === student.id && r.competitionId === selectedCompetition);
    if (existingReg) {
      alert('You have already registered for this competition!');
      return;
    }

    try {
      await apiClient.registerEvent({
        studentId: student.id,
        eventId: selectedEvent.id,
        competitionId: selectedCompetition
      });

      setShowEventForm(false);
      const competition = selectedEvent.competitions.find(c => c.id === selectedCompetition);
      setNotification('✅ Successfully registered for ' + (competition?.name || 'competition'));
      setTimeout(() => setNotification(''), 5000);

      const newRegs = await apiClient.getStudentEventRegistrations(student.id);
      setMyEvents(newRegs);
    } catch (error) {
      console.error(error);
      alert('Failed to register.');
    }
  };

  const handleRedirectToProfile = () => {
    setShowProfileAlert(false);
    setActiveTab('profile');
    handleEditProfile();
  };

  const handleEditProfile = () => {
    setProfileForm({
      name: student.name,
      phone: student.phone,
      class: student.class,
      department: student.department,
      year: student.year,
      college: student.college,
      cgpa: student.cgpa || '',
      backlogs: student.backlogs || '',
      historyOfArrears: student.historyOfArrears || '',
      tenthMarks: student.tenthMarks || '',
      twelfthMarks: student.twelfthMarks || ''
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileForm.phone && profileForm.phone.replace(/\s/g, '').length !== 10) {
      alert('Mobile number must be 10 digits');
      return;
    }

    setIsSaving(true);
    try {
      console.log('Attempting to save profile:', profileForm);
      const updateData = { ...profileForm };

      // Add a minimum delay of 1.5 seconds so the loading animation is visible
      const [updatedStudent] = await Promise.all([
        apiClient.updateStudent(student.id, updateData),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);

      if (updatedStudent) {
        console.log('Profile saved successfully:', updatedStudent);
        storage.setCurrentUser(updatedStudent);
        setIsEditingProfile(false);
        setNotification('✅ Profile updated successfully!');

        // Hide loading spinner before showing success animation
        setIsSaving(false);

        // Trigger Success Animation (manual refresh button is now in the UI)
        setShowSuccessAnimation(true);
      } else {
        setIsSaving(false);
        alert('Failed to update profile: Server returned an error.');
      }
    } catch (error: any) {
      setIsSaving(false);
      console.error('Profile update catch error:', error);
      alert(`Failed to update profile: ${error.message || 'Unknown error'}`);
    }
  };

  const getPlacementDetails = (placementId: string) => {
    return allPlacements.find(p => p.id === placementId);
  };

  const getEventDetails = (eventId: string) => {
    return allEvents.find(e => e.id === eventId);
  };

  const getCompetitionDetails = (eventId: string, competitionId: string) => {
    const event = allEvents.find(e => e.id === eventId);
    return event?.competitions.find(c => c.id === competitionId);
  };

  const handleImageError = (e: SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://placehold.co/400x300/e0e0e0/808080?text=Image+Not+Found';
  };

  return (
    <div className="min-h-screen app-background">
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-pulse">
          {notification}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Campus Connect
              </h1>
              <p className="text-sm text-gray-600">Welcome, {student.name}!</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('profile')}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                My Profile
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {[
              { id: 'placements', label: '🏢 Placements', icon: '🏢' },
              { id: 'events', label: '🎉 Events', icon: '🎉' },
              { id: 'registrations', label: '📋 My Registrations', icon: '📋' },
              { id: 'profile', label: '👤 Profile', icon: '👤' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Placements Tab */}
        {activeTab === 'placements' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">🏢 Placement Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allPlacements.map(placement => (
                <div
                  key={placement.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <div className="relative h-48">
                    <img
                      src={placement.logo}
                      alt={placement.companyName}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white">{placement.companyName}</h3>
                      <p className="text-white/80 text-sm">{placement.package}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-gray-600 text-sm mb-3">{placement.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-semibold">📅</span>
                        <span>{placement.date} at {placement.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-semibold">📍</span>
                        <span>{placement.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-semibold">🎓</span>
                        <span>{placement.eligibility}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePlacementApply(placement)}
                      className="w-full mt-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">🎉 Event Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allEvents.map(event => (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
                  onClick={() => handleViewEventDetails(event)}
                >
                  {/* Event Card Content (Streamlined) */}
                  <div className="relative h-48">
                    <img
                      src={event.image}
                      alt={event.eventName}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-bold">{event.eventName}</h3>
                      <p className="text-sm opacity-90">{event.date} • {event.venue}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">{event.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {event.competitions.length} Competitions
                      </span>
                      <button
                        className="text-pink-600 font-semibold text-sm hover:underline"
                      >
                        View Details &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Registrations Tab */}
        {activeTab === 'registrations' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">📋 My Registrations</h2>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">🏢 Placement Applications ({myPlacements.length})</h3>
              {myPlacements.length === 0 ? (
                <p className="text-gray-500">No placement applications yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myPlacements.map(reg => {
                    const placement = getPlacementDetails(reg.placementId);
                    return (
                      <div key={reg.id} className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500">
                        <h4 className="font-bold text-gray-800">{placement?.companyName}</h4>
                        <p className="text-gray-600 text-sm">Role: {reg.roleName}</p>
                        <div className="mt-2 pt-2 border-t flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500">
                          <span>CGPA: <span className="font-semibold">{reg.studentDetails.cgpa || '-'}</span></span>
                          <span>Backlogs: <span className="font-semibold">{reg.studentDetails.backlogs || '0'}</span></span>
                        </div>
                        <p className="text-gray-500 text-[10px] mt-2">Applied: {new Date(reg.registeredAt).toLocaleDateString()}</p>
                        {reg.resumeName && <p className="text-blue-600 text-[10px] font-medium">📄 {reg.resumeName}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">🎉 Event Registrations ({myEvents.length})</h3>
              {myEvents.length === 0 ? (
                <p className="text-gray-500">No event registrations yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myEvents.map(reg => {
                    const event = getEventDetails(reg.eventId);
                    const competition = getCompetitionDetails(reg.eventId, reg.competitionId);
                    return (
                      <div key={reg.id} className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-pink-500">
                        <h4 className="font-bold text-gray-800">{event?.eventName}</h4>
                        <p className="text-gray-600 text-sm">Competition: {competition?.name}</p>
                        <div className="mt-2 pt-2 border-t flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500">
                          <span>CGPA: <span className="font-semibold">{reg.studentDetails.cgpa || '-'}</span></span>
                          <span>Backlogs: <span className="font-semibold">{reg.studentDetails.backlogs || '0'}</span></span>
                        </div>
                        <p className="text-gray-500 text-[10px] mt-2">Registered: {new Date(reg.registeredAt).toLocaleDateString()}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">👤 My Profile</h2>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{student.name}</h3>
                    <p className="text-gray-600">{student.registerNumber}</p>
                  </div>
                </div>
                {!isEditingProfile && (
                  <button
                    onClick={handleEditProfile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md"
                  >
                    ✏️ Edit Profile
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                      <input
                        type="text"
                        value={profileForm.class}
                        onChange={(e) => setProfileForm({ ...profileForm, class: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={profileForm.department}
                        onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <select
                        value={profileForm.year}
                        onChange={(e) => setProfileForm({ ...profileForm, year: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        required
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                      <input
                        type="text"
                        value={profileForm.college}
                        onChange={(e) => setProfileForm({ ...profileForm, college: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CGPA</label>
                      <input
                        type="text"
                        step="0.01"
                        value={profileForm.cgpa}
                        onChange={(e) => setProfileForm({ ...profileForm, cgpa: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        placeholder="e.g. 8.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Backlogs</label>
                      <input
                        type="number"
                        value={profileForm.backlogs}
                        onChange={(e) => setProfileForm({ ...profileForm, backlogs: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">History of Arrears</label>
                      <select
                        value={profileForm.historyOfArrears}
                        onChange={(e) => setProfileForm({ ...profileForm, historyOfArrears: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">10th Marks (%)</label>
                      <input
                        type="text"
                        value={profileForm.tenthMarks}
                        onChange={(e) => setProfileForm({ ...profileForm, tenthMarks: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        placeholder="e.g. 90"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">12th Marks (%)</label>
                      <input
                        type="text"
                        value={profileForm.twelfthMarks}
                        onChange={(e) => setProfileForm({ ...profileForm, twelfthMarks: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        placeholder="e.g. 85"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className={`flex-1 py-3 ${isSaving ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-purple-600'} text-white rounded-xl font-semibold hover:shadow-lg transition-all`}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Email', value: student.email },
                      { label: 'Phone', value: student.phone },
                      { label: 'Class', value: student.class },
                      { label: 'Department', value: student.department },
                      { label: 'Year', value: `${student.year}${['st', 'nd', 'rd', 'th'][parseInt(student.year) - 1] || 'th'} Year` },
                      { label: 'College', value: student.college },
                      { label: 'CGPA', value: student.cgpa || 'Not set' },
                      { label: 'Backlogs', value: student.backlogs || '0' },
                      { label: 'History of Arrears', value: student.historyOfArrears || 'No' },
                      { label: '10th Marks', value: student.tenthMarks ? `${student.tenthMarks}%` : 'Not set' },
                      { label: '12th Marks', value: student.twelfthMarks ? `${student.twelfthMarks}%` : 'Not set' }
                    ].map(item => (
                      <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                        <p className="text-gray-500 text-sm">{item.label}</p>
                        <p className="text-gray-800 font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold text-gray-700 mb-3">Registration Summary</h4>
                    <div className="flex gap-4">
                      <div className="flex-1 bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-blue-600">{myPlacements.length}</p>
                        <p className="text-gray-600 text-sm">Placement Applications</p>
                      </div>
                      <div className="flex-1 bg-pink-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-pink-600">{myEvents.length}</p>
                        <p className="text-gray-600 text-sm">Event Registrations</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Placement Application Modal */}
      {showPlacementForm && selectedPlacement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Apply for {selectedPlacement.companyName}</h3>
            <form onSubmit={submitPlacementApplication} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Role *</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                >
                  <option value="">Choose a role</option>
                  {selectedPlacement.roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="font-semibold text-gray-700">Your Details</h4>
                <p className="text-sm text-gray-600">Name: {student.name}</p>
                <p className="text-sm text-gray-600">Register No: {student.registerNumber}</p>
                <p className="text-sm text-gray-600">Email: {student.email}</p>
                <p className="text-sm text-gray-600">Phone: {student.phone}</p>
                <p className="text-sm text-gray-600">Class: {student.class} - {student.department}</p>
                <div className="pt-2 mt-2 border-t border-gray-200 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-blue-700 font-medium">
                  <span>CGPA: {student.cgpa || (student as any).cgpa || 'N/A'}</span>
                  <span>Backlogs: {student.backlogs ?? (student as any).backlogs ?? '0'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Resume *</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX</p>
              </div>

              {/* Academic Details Confirmation */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="text-sm font-bold text-blue-900 mb-2">📋 Confirm Academic Details</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/70 p-2.5 rounded-lg border border-blue-100 shadow-sm">
                    <span className="text-gray-600 font-medium block mb-1">CGPA</span>
                    <span className="font-bold text-blue-900 text-sm">
                      {student.cgpa || (student as any).cgpa || (student as any).student_details?.cgpa || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white/70 p-2.5 rounded-lg border border-blue-100 shadow-sm">
                    <span className="text-gray-600 font-medium block mb-1">Backlogs</span>
                    <span className="font-bold text-blue-900 text-sm">
                      {student.backlogs ?? (student as any).backlogs ?? (student as any).student_details?.backlogs ?? '0'}
                    </span>
                  </div>
                  <div className="bg-white/70 p-2.5 rounded-lg border border-blue-100 shadow-sm">
                    <span className="text-gray-600 font-medium block mb-1">Hist. Arrears</span>
                    <span className="font-bold text-blue-900 text-sm">
                      {student.historyOfArrears || (student as any).history_of_arrears || (student as any).student_details?.history_of_arrears || 'No'}
                    </span>
                  </div>
                  <div className="bg-white/70 p-2.5 rounded-lg border border-blue-100 shadow-sm">
                    <span className="text-gray-600 font-medium block mb-1">10th / 12th</span>
                    <span className="font-bold text-blue-900 text-sm">
                      {student.tenthMarks || (student as any).tenth_marks || (student as any).student_details?.tenth_marks || 'N/A'}% / {student.twelfthMarks || (student as any).twelfth_marks || (student as any).student_details?.twelfth_marks || 'N/A'}%
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-blue-700 mt-3 font-medium italic">* If any details are incorrect, please update them in your Profile tab before applying.</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPlacementForm(false)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header with Image */}
            <div className="relative h-64 md:h-80">
              <img
                src={selectedEvent.image}
                alt={selectedEvent.eventName}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <button
                onClick={() => setShowEventDetails(false)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
              >
                ✕
              </button>
              <div className="absolute bottom-6 left-6 md:left-10 text-white">
                <h2 className="text-4xl font-bold mb-2">{selectedEvent.eventName}</h2>
                <div className="flex flex-wrap gap-4 text-sm md:text-base opacity-90">
                  <span className="flex items-center gap-1">📅 {selectedEvent.date} at {selectedEvent.time}</span>
                  <span className="flex items-center gap-1">📍 {selectedEvent.venue}</span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10">
              {/* Event Description & Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <div className="md:col-span-2">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">About the Event</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>

                  {selectedEvent.rules && (
                    <div className="mt-6 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                      <h4 className="font-semibold text-yellow-800 mb-2">📜 Rules & Regulations</h4>
                      <p className="text-yellow-700 text-sm whitespace-pre-wrap">{selectedEvent.rules}</p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-1 space-y-4">
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <h4 className="font-semibold text-gray-800 mb-3">📞 Contact Info</h4>
                    {selectedEvent.contactPerson ? (
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><span className="font-medium">Coordinator:</span></p>
                        <p>{selectedEvent.contactPerson}</p>
                        {selectedEvent.contactNumber && (
                          <p>📱 {selectedEvent.contactNumber}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No contact info available.</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleEventRegister(selectedEvent)}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg transition-transform transform hover:scale-105"
                  >
                    Register for Event
                  </button>
                </div>
              </div>

              {/* Competitions Grid */}
              <h3 className="text-2xl font-bold text-gray-800 mb-6">🏆 Featured Competitions</h3>
              {selectedEvent.competitions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedEvent.competitions.map(comp => (
                    <div
                      key={comp.id}
                      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      <div className="h-48 relative overflow-hidden">
                        <img
                          src={comp.image}
                          alt={comp.name}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                          onError={handleImageError}
                        />
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                          {comp.type || 'Competition'}
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-gray-800 group-hover:text-pink-600 transition-colors">
                            {comp.name}
                          </h4>
                        </div>
                        <p className="text-sm text-pink-600 font-semibold mb-2">🥇 Prize: {comp.prize}</p>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{comp.description}</p>

                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                          {comp.teamSize && <span>👥 {comp.teamSize}</span>}
                        </div>

                        <button
                          onClick={() => handleCompetitionRegister(selectedEvent, comp.id)}
                          className="w-full py-2 border border-pink-500 text-pink-600 rounded-lg font-semibold hover:bg-pink-50 transition-colors"
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">No competitions listed for this event yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Registration Modal */}
      {showEventForm && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Register for {selectedEvent.eventName}</h3>
            <form onSubmit={submitEventRegistration} className="space-y-4">
              {(selectedEvent.rules || selectedEvent.contactPerson || selectedEvent.contactNumber) && (
                <div className="bg-blue-50 p-4 rounded-xl text-sm">
                  <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Event Details</h4>
                  {selectedEvent.rules && (
                    <div className="mb-2">
                      <p className="font-semibold text-blue-800">Rules & Regulations:</p>
                      <p className="text-blue-700 whitespace-pre-wrap">{selectedEvent.rules}</p>
                    </div>
                  )}
                  {(selectedEvent.contactPerson || selectedEvent.contactNumber) && (
                    <div className="mt-2 text-blue-700 border-t border-blue-200 pt-2">
                      <p><span className="font-semibold">📞 Contact:</span> {selectedEvent.contactPerson} {selectedEvent.contactNumber && `(${selectedEvent.contactNumber})`}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Competition *</label>
                <select
                  value={selectedCompetition}
                  onChange={(e) => setSelectedCompetition(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                  required
                >
                  <option value="">Choose a competition</option>
                  {selectedEvent.competitions.map(comp => (
                    <option key={comp.id} value={comp.id}>{comp.name} - Prize: {comp.prize}</option>
                  ))}
                </select>
              </div>

              {selectedCompetition && (
                <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl p-4">
                  {(() => {
                    const comp = selectedEvent.competitions.find(c => c.id === selectedCompetition);
                    return comp && (
                      <div>
                        <img src={comp.image} alt={comp.name} className="w-full h-64 object-cover rounded-lg mb-3 shadow-md" onError={handleImageError} />
                        <h4 className="font-semibold text-gray-800">{comp.name}</h4>
                        <p className="text-sm text-gray-600">{comp.description}</p>
                        <p className="text-sm font-semibold text-pink-600 mt-2">🏆 Prize: {comp.prize}</p>
                        <div className="flex gap-4 mt-1 text-sm text-gray-600">
                          {comp.teamSize && <p>👥 Team: {comp.teamSize}</p>}
                          {comp.type && <p>🎭 Type: {comp.type}</p>}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="font-semibold text-gray-700">Your Details</h4>
                <p className="text-sm text-gray-600">Name: {student.name}</p>
                <p className="text-sm text-gray-600">Register No: {student.registerNumber}</p>
                <p className="text-sm text-gray-600">Email: {student.email}</p>
                <p className="text-sm text-gray-600">Phone: {student.phone}</p>
                <p className="text-sm text-gray-600">Class: {student.class} - {student.department}</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEventForm(false)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg"
                >
                  Register Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-[100] animate-in fade-in duration-500">
          <div className="success-checkmark">
            <div className="check-icon">
              <span className="icon-line line-tip"></span>
              <span className="icon-line line-long"></span>
              <div className="icon-circle"></div>
              <div className="icon-fix"></div>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mt-8">
            Profile Saved!
          </h2>
          <p className="text-gray-600 mt-2 font-medium">Your academic details have been updated.</p>

          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all animate-bounce"
          >
            OK / Refresh Dashboard
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center z-[100] animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center">
            <div className="loading-spinner mb-4"></div>
            <p className="text-gray-700 font-bold text-lg">Saving your changes...</p>
            <p className="text-gray-500 text-sm mt-1">Please wait a moment</p>
          </div>
        </div>
      )}

      {/* Missing Profile Details Alert Modal */}
      {showProfileAlert && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Complete Your Profile</h3>
            <p className="text-center text-gray-600 mb-6">
              To apply for placements, you must provide your academic details.
              <br />
              <span className="text-xs text-red-500 mt-2 block">
                Missing: {missingFields.join(', ')}
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowProfileAlert(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRedirectToProfile}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Update Profile Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
