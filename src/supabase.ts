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
    await client.storage.from(bucketName).remove([filePath]);
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

