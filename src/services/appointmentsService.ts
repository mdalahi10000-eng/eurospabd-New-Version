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

export async function fetchAdminAppointments(): Promise<AdminAppointment[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await (getSupabase().from('appointments') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map(mapSupabaseAppointmentToAdminAppointment);
    }
    if (error) {
      console.warn('[Supabase] fetchAdminAppointments error:', error);
    }
  } catch (supaErr) {
    console.warn('[Supabase] fetchAdminAppointments exception:', supaErr);
  }

  return [];
}

export function subscribeToAdminAppointments(
  callback: (appointments: AdminAppointment[]) => void
): () => void {
  fetchAdminAppointments().then(callback);
  return subscribeToSupabaseTable('appointments', async () => {
    const updated = await fetchAdminAppointments();
    callback(updated);
  });
}

export async function updateAppointmentStatus(
  id: string, 
  status: AppointmentStatus, 
  notes?: string
): Promise<void> {
  const supaUpdates: any = { status, updated_at: new Date().toISOString() };
  if (notes !== undefined) supaUpdates.notes = notes;

  const { error } = await (getSupabase().from('appointments') as any)
    .update(supaUpdates)
    .eq('id', id);

  if (error) {
    console.error('[Supabase] updateAppointmentStatus error:', error);
    throw new Error(error.message || 'Failed to update appointment status.');
  }
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await (getSupabase().from('appointments') as any)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] deleteAppointment error:', error);
    throw new Error(error.message || 'Failed to delete appointment.');
  }
}

export async function createAdminAppointment(
  data: Omit<AdminAppointment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = `apt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullAppointment: AdminAppointment = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const supaRow = mapAppointmentToSupabaseRow(fullAppointment);
  const { error } = await (getSupabase().from('appointments') as any).upsert(supaRow);

  if (error) {
    console.error('[Supabase] createAdminAppointment error:', error);
    throw new Error(error.message || 'Failed to create appointment.');
  }

  return id;
}
