/**
 * Euro Spa & Salon Dhaka - Supabase Client Module
 * Provides unified client initialization, authentication, storage, and real-time helpers.
 * Fully compatible with the fallback architecture so Firebase remains 100% functional.
 */
import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { Database } from '../supabase/types';

const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta && (import.meta as any).env) {
      const val = (import.meta as any).env[key];
      if (val) return String(val);
    }
  } catch (_) {}
  try {
    if (typeof process !== 'undefined' && process && process.env) {
      const val = process.env[key];
      if (val) return String(val);
    }
  } catch (_) {}
  return '';
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

let supabaseInstance: SupabaseClient<Database> | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('placeholder') &&
    SUPABASE_URL.startsWith('http')
  );
}

/**
 * Returns the initialized Supabase client singleton, or a fallback client if keys are not yet provided.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    if (!isSupabaseConfigured()) {
      supabaseInstance = createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } else {
      supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    }
  }
  return supabaseInstance;
}

export const supabase = getSupabase();

/**
 * Universal timeout wrapper to prevent any hanging queries or authentication locks
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallbackValue: T
): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      resolve(fallbackValue);
    }, timeoutMs);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise
  ]);
}

/**
 * Admin check: returns true if the email matches the primary administrator or exists in the admins table
 */
export async function checkIsAdmin(user: SupabaseUser | null | { email?: string | null }): Promise<boolean> {
  if (!user || !user.email) return false;
  
  // Fast-path check for primary owner email
  if (user.email.toLowerCase() === 'mdalahi10000@gmail.com') {
    return true;
  }

  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { data, error } = await withTimeout(
      Promise.resolve(
        getSupabase()
          .from('admins')
          .select('id, role')
          .eq('email', user.email.toLowerCase())
          .maybeSingle()
      ),
      2500,
      { data: null, error: null } as any
    );

    if (error || !data) return false;
    return data.role === 'admin';
  } catch (err) {
    console.warn('[Supabase] checkIsAdmin error:', err);
    return false;
  }
}

/**
 * Supabase Email + Password Authentication for Admin Portal
 */
export async function loginWithPassword(email: string, password: string): Promise<{ data?: any; error?: any }> {
  try {
    if (!isSupabaseConfigured()) {
      return { 
        error: new Error('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.') 
      };
    }
    const client = getSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { error };
    return { data };
  } catch (error: any) {
    console.error('[Supabase] Email sign-in error:', error);
    return { error };
  }
}

export async function signUpWithPassword(
  email: string,
  password: string,
  fullName?: string
): Promise<{ data?: any; error?: any }> {
  try {
    if (!isSupabaseConfigured()) {
      return { 
        error: new Error('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.') 
      };
    }
    const client = getSupabase();
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName?.trim() || undefined,
        },
      },
    });
    if (error) return { error };
    return { data };
  } catch (error: any) {
    console.error('[Supabase] Sign-up error:', error);
    return { error };
  }
}

export async function resetPasswordForEmail(email: string): Promise<{ data?: any; error?: any }> {
  try {
    if (!isSupabaseConfigured()) {
      return { 
        error: new Error('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.') 
      };
    }
    const client = getSupabase();
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined;
    const { data, error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    if (error) return { error };
    return { data };
  } catch (error: any) {
    console.error('[Supabase] Reset password error:', error);
    return { error };
  }
}

export interface AdminAuthUser {
  uid: string;
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerData: Array<{ providerId: string }>;
}

export type User = AdminAuthUser;

export interface StoredAppointment {
  id?: string;
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
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: any;
}

export interface StoredReview {
  id?: string;
  userId?: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  serviceTag?: string;
  status?: 'approved' | 'hidden';
  adminResponse?: string;
  dateString?: string;
  verified?: boolean;
  createdAt?: any;
}

export function formatSupabaseUser(user: any): AdminAuthUser {
  if (!user) {
    return {
      uid: '',
      id: '',
      email: null,
      displayName: null,
      photoURL: null,
      providerData: [],
    };
  }
  return {
    uid: user.id || '',
    id: user.id || '',
    email: user.email || null,
    displayName:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.display_name ||
      (user.email ? user.email.split('@')[0] : 'Administrator'),
    photoURL:
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      user.user_metadata?.photo_url ||
      null,
    providerData: [
      {
        providerId: user.app_metadata?.provider || 'email',
      },
    ],
  };
}

/**
 * Sign Out
 */
export async function logoutUser(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      await getSupabase().auth.signOut();
    }
  } catch (err) {
    console.error('[Supabase] SignOut error:', err);
  }
}

/**
 * Google Auth fallback: Google OAuth is disabled per specification (email/password only)
 */
export async function loginWithGoogle(): Promise<AdminAuthUser | null> {
  console.info('[Auth] Google OAuth is disabled. Use email and password.');
  return null;
}

/**
 * Sync user profile to Supabase users and admins tables
 */
export async function syncUserProfile(user: AdminAuthUser | SupabaseUser | { id: string; email?: string | null; displayName?: string | null; photoURL?: string | null }): Promise<void> {
  if (!isSupabaseConfigured() || !user || !user.id) return;
  try {
    const email = (user.email || '').toLowerCase().trim();
    const isAdminEmail = email === 'mdalahi10000@gmail.com';
    const client = getSupabase();
    await (client.from('users') as any).upsert({
      id: user.id,
      email: user.email || '',
      display_name: ('displayName' in user ? user.displayName : '') || '',
      photo_url: ('photoURL' in user ? user.photoURL : '') || '',
      role: isAdminEmail ? 'admin' : 'client',
      updated_at: new Date().toISOString()
    });
    if (isAdminEmail) {
      await (client.from('admins') as any).upsert({
        id: user.id,
        email: user.email,
        role: 'admin',
        updated_at: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('[Supabase] syncUserProfile error:', err);
  }
}

/**
 * Save customer appointment into Supabase
 */
export async function saveAppointment(appointmentData: Omit<StoredAppointment, 'id' | 'createdAt'>): Promise<string> {
  const client = getSupabase();
  const id = `apt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const row = {
    id,
    user_id: appointmentData.userId || null,
    user_name: appointmentData.userName,
    user_email: appointmentData.userEmail || null,
    phone: appointmentData.phone,
    service_id: appointmentData.serviceId || null,
    service_name: appointmentData.serviceName,
    duration: appointmentData.duration,
    price: appointmentData.price,
    preferred_date: appointmentData.preferredDate,
    preferred_time: appointmentData.preferredTime,
    status: appointmentData.status || 'pending',
    notes: appointmentData.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await (client.from('appointments') as any).insert(row);
  if (error) {
    console.error('[Supabase] Error saving appointment:', error);
    throw new Error(error.message || 'Failed to save appointment');
  }
  return id;
}

/**
 * Fetch appointments for a specific user from Supabase
 */
export async function fetchUserAppointments(userId: string): Promise<StoredAppointment[]> {
  if (!isSupabaseConfigured() || !userId) return [];
  try {
    const { data, error } = await (getSupabase().from('appointments') as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      phone: row.phone,
      serviceId: row.service_id,
      serviceName: row.service_name,
      duration: row.duration,
      price: row.price,
      preferredDate: row.preferred_date,
      preferredTime: row.preferred_time,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at
    }));
  } catch (err) {
    console.warn('[Supabase] fetchUserAppointments error:', err);
    return [];
  }
}

/**
 * Submit user review into Supabase
 */
export async function submitReview(reviewData: Omit<StoredReview, 'id' | 'createdAt'>): Promise<string> {
  const client = getSupabase();
  const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const row = {
    id,
    user_id: reviewData.userId || null,
    user_name: reviewData.userName,
    user_photo: reviewData.userPhoto || 'https://lh3.googleusercontent.com/a/default-user',
    rating: reviewData.rating || 5,
    comment: reviewData.comment || '',
    service_tag: reviewData.serviceTag || 'Signature Therapy',
    status: reviewData.status || 'approved',
    admin_response: reviewData.adminResponse || null,
    date_str: reviewData.dateString || 'Recent Visit',
    verified: reviewData.verified !== false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await (client.from('reviews') as any).insert(row);
  if (error) {
    console.error('[Supabase] submitReview error:', error);
    throw new Error(error.message || 'Failed to submit review');
  }
  return id;
}

/**
 * Real-time subscription to community reviews in Supabase
 */
export function subscribeToReviews(callback: (reviews: StoredReview[]) => void): () => void {
  if (!isSupabaseConfigured()) {
    callback([]);
    return () => {};
  }

  const loadReviews = async () => {
    try {
      const { data, error } = await (getSupabase().from('reviews') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const list: StoredReview[] = data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          userName: r.user_name || r.name,
          userPhoto: r.user_photo || r.avatar || 'https://lh3.googleusercontent.com/a/default-user',
          rating: Number(r.rating) || 5,
          comment: r.comment || r.review_text || '',
          serviceTag: r.service_tag || r.service_used || 'Signature Therapy',
          status: r.status || 'approved',
          adminResponse: r.admin_response,
          dateString: r.date_str || r.date || 'Recent Visit',
          verified: r.verified !== false,
          createdAt: r.created_at
        }));
        callback(list);
      }
    } catch (e) {
      console.warn('[Supabase] loadReviews error:', e);
    }
  };

  loadReviews();
  return subscribeToSupabaseTable('reviews', loadReviews);
}

/**
 * Upload image to Supabase Storage bucket 'spa-assets'
 */
export async function uploadToSupabaseStorage(
  folder: 'services' | 'articles' | 'gallery' | string,
  fileName: string,
  file: File | Blob,
  bucketName: string = 'spa-assets'
): Promise<{ url: string | null; path: string | null; error: any }> {
  try {
    if (!isSupabaseConfigured()) {
      return { url: null, path: null, error: new Error('Supabase not configured') };
    }
    const client = getSupabase();
    const cleanFileName = fileName.replace(/[^\w.-]/g, '_');
    const filePath = `${folder}/${Date.now()}_${cleanFileName}`;

    const { data, error: uploadError } = await client.storage
      .from('spa-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = client.storage
      .from('spa-assets')
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, path: filePath, error: null };
  } catch (err: any) {
    console.error('[Supabase Storage] Upload error:', err);
    return { url: null, path: null, error: err };
  }
}

/**
 * Upload gallery photo directly to the 'spa-assets' Supabase Storage bucket
 */
export async function uploadGalleryToSupabaseStorage(
  fileName: string,
  file: File | Blob,
  subFolder: string = 'gallery'
): Promise<{ url: string | null; path: string | null; error: any }> {
  try {
    if (!isSupabaseConfigured()) {
      return { 
        url: null, 
        path: null, 
        error: new Error('Supabase Storage is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.') 
      };
    }
    const client = getSupabase();
    const cleanFileName = fileName.replace(/[^\w.-]/g, '_');
    const filePath = `${subFolder}/${Date.now()}_${cleanFileName}`;

    const { data, error: uploadError } = await client.storage
      .from('spa-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = client.storage
      .from('spa-assets')
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, path: filePath, error: null };
  } catch (err: any) {
    console.error('[Supabase Storage] Gallery upload error:', err);
    return { url: null, path: null, error: err };
  }
}

/**
 * Delete an object from Supabase Storage bucket 'spa-assets'
 */
export async function deleteFromSupabaseStorage(
  bucketName: string = 'spa-assets',
  filePath: string
): Promise<{ error: any }> {
  try {
    if (!isSupabaseConfigured()) return { error: null };
    const client = getSupabase();
    const { data, error } = await client.storage.from(bucketName).remove([filePath]);
    if (error) {
      console.warn('[Supabase Storage] Delete error:', error);
      return { error };
    }
    return { error: null };
  } catch (err) {
    console.warn('[Supabase Storage] Delete error:', err);
    return { error: err };
  }
}

interface TableSubscription {
  channel: any;
  callbacks: Set<() => void>;
}

const activeTableSubscriptions = new Map<keyof Database['public']['Tables'], TableSubscription>();
let subscriptionCounter = 0;

/**
 * Generic Realtime Table Subscription Helper with listener multiplexing.
 * Multiplexes multiple subscribers on a single channel per table to prevent
 * "cannot add postgres_changes callbacks after subscribe()" errors.
 */
export function subscribeToSupabaseTable(
  tableName: keyof Database['public']['Tables'],
  onChange: () => void
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  try {
    let sub = activeTableSubscriptions.get(tableName);

    if (!sub) {
      const callbacks = new Set<() => void>();
      callbacks.add(onChange);

      const uniqueSuffix = `${Date.now()}_${++subscriptionCounter}_${Math.random().toString(36).substring(2, 7)}`;
      const channelName = `rt_${tableName}_${uniqueSuffix}`;
      const client = getSupabase();

      const channel = client
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName as string },
          () => {
            const currentSub = activeTableSubscriptions.get(tableName);
            if (currentSub) {
              currentSub.callbacks.forEach((cb) => {
                try {
                  cb();
                } catch (err) {
                  console.error(`[Supabase Realtime] Callback execution error for ${tableName}:`, err);
                }
              });
            }
          }
        )
        .subscribe((status, err) => {
          if (err) {
            console.warn(`[Supabase Realtime] Channel subscription status [${status}] error for ${tableName}:`, err);
          }
        });

      sub = { channel, callbacks };
      activeTableSubscriptions.set(tableName, sub);
    } else {
      // Channel is already created or subscribed; simply register this callback to the multiplexer
      sub.callbacks.add(onChange);
    }

    return () => {
      try {
        const existingSub = activeTableSubscriptions.get(tableName);
        if (!existingSub) return;

        existingSub.callbacks.delete(onChange);

        // When no active listeners remain for this table, cleanly remove the channel
        if (existingSub.callbacks.size === 0) {
          activeTableSubscriptions.delete(tableName);
          try {
            getSupabase().removeChannel(existingSub.channel);
          } catch (e) {
            console.warn(`[Supabase Realtime] Failed to remove channel for ${tableName}:`, e);
          }
        }
      } catch (cleanupErr) {
        console.warn(`[Supabase Realtime] Cleanup error for ${tableName}:`, cleanupErr);
      }
    };
  } catch (err) {
    console.error(`[Supabase Realtime] Failed to setup subscription for ${tableName}:`, err);
    return () => {};
  }
}

