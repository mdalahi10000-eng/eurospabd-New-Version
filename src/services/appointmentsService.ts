import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { isSupabaseConfigured, getSupabase, subscribeToSupabaseTable } from '../supabase';
import { mapSupabaseAppointmentToAdminAppointment, mapAppointmentToSupabaseRow } from './unifiedBackend';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface AdminAppointment {
  id: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  phone: string;
  serviceId?: string;
  serviceName: string;
  duration: string;
  price: string;
  preferredDate: string;
  preferredTime: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

const APPOINTMENTS_COLLECTION = collection(db, 'appointments');

export async function fetchAdminAppointments(): Promise<AdminAppointment[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (getSupabase().from('appointments') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapSupabaseAppointmentToAdminAppointment);
      }
    } catch (supaErr) {
      console.warn('[Supabase] fetchAdminAppointments fallback to Firestore:', supaErr);
    }
  }

  try {
    const q = query(APPOINTMENTS_COLLECTION, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId || '',
        userName: data.userName || 'Guest Client',
        userEmail: data.userEmail || '',
        phone: data.phone || '',
        serviceId: data.serviceId || '',
        serviceName: data.serviceName || 'Signature Massage Therapy',
        duration: data.duration || '60 min',
        price: data.price || '',
        preferredDate: data.preferredDate || '',
        preferredTime: data.preferredTime || '',
        status: (data.status as AppointmentStatus) || 'pending',
        notes: data.notes || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    });
  } catch (error) {
    console.warn('Error fetching admin appointments:', error);
    // Fallback if index on createdAt is still building
    try {
      const snapshot = await getDocs(APPOINTMENTS_COLLECTION);
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId || '',
          userName: data.userName || 'Guest Client',
          userEmail: data.userEmail || '',
          phone: data.phone || '',
          serviceId: data.serviceId || '',
          serviceName: data.serviceName || 'Signature Massage Therapy',
          duration: data.duration || '60 min',
          price: data.price || '',
          preferredDate: data.preferredDate || '',
          preferredTime: data.preferredTime || '',
          status: (data.status as AppointmentStatus) || 'pending',
          notes: data.notes || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      });
    } catch (fallbackErr) {
      console.error('Appointments fallback fetch failed:', fallbackErr);
      return [];
    }
  }
}

export function subscribeToAdminAppointments(
  callback: (appointments: AdminAppointment[]) => void
): () => void {
  if (isSupabaseConfigured()) {
    fetchAdminAppointments().then(callback);
    return subscribeToSupabaseTable('appointments', async () => {
      const updated = await fetchAdminAppointments();
      callback(updated);
    });
  }

  try {
    const q = query(APPOINTMENTS_COLLECTION, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId || '',
          userName: data.userName || 'Guest Client',
          userEmail: data.userEmail || '',
          phone: data.phone || '',
          serviceId: data.serviceId || '',
          serviceName: data.serviceName || 'Signature Massage Therapy',
          duration: data.duration || '60 min',
          price: data.price || '',
          preferredDate: data.preferredDate || '',
          preferredTime: data.preferredTime || '',
          status: (data.status as AppointmentStatus) || 'pending',
          notes: data.notes || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      });
      callback(list);
    }, (err) => {
      console.warn('Appointments snapshot error, falling back to unordered:', err);
      // Fallback without ordering
      const unsubFallback = onSnapshot(APPOINTMENTS_COLLECTION, (fallbackSnap) => {
        const list = fallbackSnap.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId: data.userId || '',
            userName: data.userName || 'Guest Client',
            userEmail: data.userEmail || '',
            phone: data.phone || '',
            serviceId: data.serviceId || '',
            serviceName: data.serviceName || 'Signature Massage Therapy',
            duration: data.duration || '60 min',
            price: data.price || '',
            preferredDate: data.preferredDate || '',
            preferredTime: data.preferredTime || '',
            status: (data.status as AppointmentStatus) || 'pending',
            notes: data.notes || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
        });
        callback(list);
      });
      return unsubFallback;
    });
  } catch (e) {
    console.error('Could not subscribe to appointments:', e);
    return () => {};
  }
}

export async function updateAppointmentStatus(
  id: string, 
  status: AppointmentStatus, 
  notes?: string
): Promise<void> {
  const appointmentDoc = doc(db, 'appointments', id);
  const updatePayload: Record<string, any> = {
    status,
    updatedAt: serverTimestamp()
  };
  if (notes !== undefined) {
    updatePayload.notes = notes;
  }
  await updateDoc(appointmentDoc, updatePayload);

  if (isSupabaseConfigured()) {
    try {
      const supaUpdates: any = { status, updated_at: new Date().toISOString() };
      if (notes !== undefined) supaUpdates.notes = notes;
      await (getSupabase().from('appointments') as any).update(supaUpdates).eq('id', id);
    } catch (supaErr) {
      console.warn('[Supabase] updateAppointmentStatus sync error:', supaErr);
    }
  }
}

export async function deleteAppointment(id: string): Promise<void> {
  const appointmentDoc = doc(db, 'appointments', id);
  await deleteDoc(appointmentDoc);

  if (isSupabaseConfigured()) {
    try {
      await (getSupabase().from('appointments') as any).delete().eq('id', id);
    } catch (supaErr) {
      console.warn('[Supabase] deleteAppointment sync error:', supaErr);
    }
  }
}

export async function createAdminAppointment(
  data: Omit<AdminAppointment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(APPOINTMENTS_COLLECTION, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  if (isSupabaseConfigured()) {
    try {
      const supaRow = mapAppointmentToSupabaseRow({ ...data, id: docRef.id });
      await (getSupabase().from('appointments') as any).upsert(supaRow);
    } catch (supaErr) {
      console.warn('[Supabase] createAdminAppointment sync error:', supaErr);
    }
  }

  return docRef.id;
}
