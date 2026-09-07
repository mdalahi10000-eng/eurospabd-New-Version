import { useState, useEffect, useMemo, FormEvent } from 'react';
import { User } from 'firebase/auth';
import { 
  CalendarDays, 
  Search, 
  Filter, 
  Phone, 
  MessageCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  User as UserIcon, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Plus, 
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react';
import { 
  AdminAppointment, 
  AppointmentStatus, 
  subscribeToAdminAppointments, 
  updateAppointmentStatus, 
  deleteAppointment,
  createAdminAppointment 
} from '../../../services/appointmentsService';
import { SERVICES_DATA } from '../../../data/spaData';

interface AdminAppointmentsSectionProps {
  currentUser: User | null;
}

export function AdminAppointmentsSection({ currentUser }: AdminAppointmentsSectionProps) {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [activeNotesModal, setActiveNotesModal] = useState<AdminAppointment | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // New manual booking form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newService, setNewService] = useState(SERVICES_DATA[0].name);
  const [newDuration, setNewDuration] = useState('60 min');
  const [newPrice, setNewPrice] = useState('BDT 3,500');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('14:00');
  const [newStatus, setNewStatus] = useState<AppointmentStatus>('confirmed');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAdminAppointments((data) => {
      setAppointments(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showNotification = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    setIsUpdatingStatus(id);
    try {
      await updateAppointmentStatus(id, newStatus);
      showNotification(`Appointment marked as ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Could not update appointment status. Please check permissions.');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeNotesModal) return;
    try {
      await updateAppointmentStatus(activeNotesModal.id, activeNotesModal.status, noteText);
      showNotification('Appointment notes saved');
      setActiveNotesModal(null);
    } catch (err) {
      console.error('Failed to save notes:', err);
      alert('Failed to save notes.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the booking for ${name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteAppointment(id);
      showNotification(`Booking for ${name} removed`);
    } catch (err) {
      console.error('Delete appointment error:', err);
      alert('Could not delete appointment.');
    }
  };

  const handleCreateManualBooking = async (e: FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone) {
      alert('Client Name and Phone number are required.');
      return;
    }
    setIsSubmittingNew(true);
    try {
      await createAdminAppointment({
        userId: currentUser?.uid || 'admin-manual',
        userName: newClientName.trim(),
        userEmail: newClientEmail.trim(),
        phone: newClientPhone.trim(),
        serviceName: newService,
        duration: newDuration,
        price: newPrice,
        preferredDate: newDate,
        preferredTime: newTime,
        status: newStatus,
        notes: newNotes.trim()
      });
      showNotification('Manual booking logged successfully');
      setShowAddModal(false);
      // Reset
      setNewClientName('');
      setNewClientPhone('');
      setNewClientEmail('');
      setNewNotes('');
    } catch (err) {
      console.error('Error adding booking:', err);
      alert('Could not create appointment.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Filter calculations
  const todayStr = new Date().toISOString().split('T')[0];

  const counts = useMemo(() => {
    const res = {
      total: appointments.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };
    appointments.forEach((a) => {
      if (a.status === 'pending') res.pending++;
      else if (a.status === 'confirmed') res.confirmed++;
      else if (a.status === 'completed') res.completed++;
      else if (a.status === 'cancelled') res.cancelled++;
    });
    return res;
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.userName.toLowerCase().includes(q);
        const matchesPhone = item.phone.toLowerCase().includes(q);
        const matchesEmail = (item.userEmail || '').toLowerCase().includes(q);
        const matchesService = item.serviceName.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesService) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Service filter
      if (serviceFilter !== 'all' && item.serviceName !== serviceFilter) {
        return false;
      }

      // Date filter
      if (dateFilter === 'today' && item.preferredDate !== todayStr) {
        return false;
      } else if (dateFilter === 'upcoming' && item.preferredDate < todayStr) {
        return false;
      } else if (dateFilter === 'past' && item.preferredDate >= todayStr) {
        return false;
      }

      return true;
    });
  }, [appointments, searchQuery, statusFilter, serviceFilter, dateFilter, todayStr]);

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3 h-3" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Header & New Booking Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Appointments & Bookings
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {counts.total} Total
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Manage incoming online reservations, walk-ins, phone bookings, and client status.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Manual Booking</span>
        </button>
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] font-semibold opacity-75">All Bookings</div>
          <div className="text-xl font-extrabold mt-0.5">{counts.total}</div>
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50/50'
          }`}
        >
          <div className="text-[11px] font-semibold flex items-center justify-between">
            <span>Pending</span>
            {counts.pending > 0 && (
              <span className={`w-2 h-2 rounded-full ${statusFilter === 'pending' ? 'bg-white' : 'bg-amber-500 animate-pulse'}`} />
            )}
          </div>
          <div className="text-xl font-extrabold mt-0.5">{counts.pending}</div>
        </button>

        <button
          onClick={() => setStatusFilter('confirmed')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'confirmed'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50/50'
          }`}
        >
          <div className="text-[11px] font-semibold">Confirmed</div>
          <div className="text-xl font-extrabold mt-0.5">{counts.confirmed}</div>
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'completed'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50/50'
          }`}
        >
          <div className="text-[11px] font-semibold">Completed</div>
          <div className="text-xl font-extrabold mt-0.5">{counts.completed}</div>
        </button>

        <button
          onClick={() => setStatusFilter('cancelled')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === 'cancelled'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50/50'
          }`}
        >
          <div className="text-[11px] font-semibold">Cancelled</div>
          <div className="text-xl font-extrabold mt-0.5">{counts.cancelled}</div>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client name, phone, email, or treatment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today's Bookings</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past History</option>
            </select>
          </div>

          {/* Service Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[200px] truncate"
            >
              <option value="all">All Treatments</option>
              {SERVICES_DATA.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List / Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading appointments from Firestore...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <CalendarDays className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No appointments found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || dateFilter !== 'all' || serviceFilter !== 'all'
              ? 'Try adjusting your search criteria or filter tags.'
              : 'There are currently no online booking reservations.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((item) => {
            const cleanPhone = item.phone.replace(/[^0-9]/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`}?text=${encodeURIComponent(
              `Hello ${item.userName}, thank you for booking at Euro Spa Center Banani. Regarding your ${item.serviceName} appointment on ${item.preferredDate} at ${item.preferredTime}:`
            )}`;

            return (
              <div
                key={item.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Client & Service Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 mt-0.5">
                    <UserIcon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {item.userName}
                      </h3>
                      {getStatusBadge(item.status)}
                    </div>

                    <div className="text-xs font-semibold text-blue-700 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{item.serviceName}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 font-normal">{item.duration}</span>
                      {item.price && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-700 font-semibold">{item.price}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">{item.preferredDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">{item.preferredTime}</span>
                      </div>
                      {item.userEmail && (
                        <span className="text-slate-400 truncate max-w-[180px]">
                          {item.userEmail}
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <div className="mt-2 p-2 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] text-slate-600 flex items-start gap-1.5 max-w-xl">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{item.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Actions & Status Management */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                  {/* WhatsApp Quick Message */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                    title={`Message ${item.userName} on WhatsApp`}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  {/* Direct Phone Call */}
                  <a
                    href={`tel:${item.phone}`}
                    className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                    title={`Call ${item.phone}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  {/* Notes Modal Toggle */}
                  <button
                    onClick={() => {
                      setActiveNotesModal(item);
                      setNoteText(item.notes || '');
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                    title="Add or Edit Internal Notes"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Status Dropdown */}
                  <select
                    disabled={isUpdatingStatus === item.id}
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value as AppointmentStatus)}
                    className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(item.id, item.userName)}
                    className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete appointment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Internal Notes Modal */}
      {activeNotesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Internal Booking Notes</h3>
                <p className="text-xs text-slate-500">For {activeNotesModal.userName}</p>
              </div>
              <button
                onClick={() => setActiveNotesModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Notes & Therapist Requests
              </label>
              <textarea
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. VIP Room assigned, customer prefers medium pressure, deposit paid via bKash..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveNotesModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Booking Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Create Manual Booking</h3>
                <p className="text-xs text-slate-500">Log walk-in guest or phone reservation</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. Shakib Al Hasan"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="e.g. 01842-658423"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Spa Treatment
                </label>
                <select
                  value={newService}
                  onChange={(e) => {
                    setNewService(e.target.value);
                    const s = SERVICES_DATA.find(x => x.name === e.target.value);
                    if (s && s.priceOptions?.[0]) {
                      setNewDuration(s.priceOptions[0].duration);
                      setNewPrice(s.priceOptions[0].price);
                    }
                  }}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {SERVICES_DATA.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="60 min"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price (BDT)
                  </label>
                  <input
                    type="text"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="BDT 3,500"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Time Slot
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as AppointmentStatus)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Internal Notes
                  </label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Walk-in guest, etc."
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingNew ? 'Saving...' : 'Save Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
