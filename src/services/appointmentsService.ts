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
}

export async function deleteAppointment(id: string): Promise<void> {
  const appointmentDoc = doc(db, 'appointments', id);
  await deleteDoc(appointmentDoc);
}

export async function createAdminAppointment(
  data: Omit<AdminAppointment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(APPOINTMENTS_COLLECTION, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}
