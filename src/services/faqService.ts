import { isSupabaseConfigured, getSupabase, subscribeToSupabaseTable } from '../supabase';
import { mapSupabaseFaqToFAQItem, mapFaqToSupabaseRow } from './unifiedBackend';
import { FAQItem } from '../types';
import { getCachedData, setCachedData, CACHE_KEYS } from './cacheService';

export const INITIAL_FAQS: Omit<FAQItem, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'faq-1',
    question: 'Where is Euro Spa Center located in Banani?',
    answer: 'We are conveniently located at 73 Road No. 6, Banani, Dhaka 1213, Bangladesh. We are easily accessible from Gulshan, Baridhara, and Mohakhali with dedicated valet and private entrance parking.',
    category: 'Location & Arrival',
    displayOrder: 1,
    status: 'active'
  },
  {
    id: 'faq-2',
    question: 'Do I need an advance appointment or do you accept walk-ins?',
    answer: 'While we welcome walk-ins based on therapist availability, we strongly recommend booking in advance via our website, direct phone call (01842-658423), or WhatsApp to ensure your preferred suite and therapist are ready upon arrival.',
    category: 'Bookings',
    displayOrder: 2,
    status: 'active'
  },
  {
    id: 'faq-3',
    question: 'What types of massage therapy do you offer?',
    answer: 'We specialize in Dry Massage, Relaxing Oil Massage, Swedish Massage, Deep Tissue Therapy, Aromatherapy, Hot Stone Massage, Four-Hand Synchronized Massage, and specialized Herbal Body Scrubs.',
    category: 'Services',
    displayOrder: 3,
    status: 'active'
  },
  {
    id: 'faq-4',
    question: 'What hygiene and sanitization standards do you follow?',
    answer: 'Cleanliness is our highest priority. All treatment suites undergo medical-grade sanitization between clients. We use 100% fresh, single-use sterilized linen, disposable slippers, and hypoallergenic organic oils.',
    category: 'Hygiene & Safety',
    displayOrder: 4,
    status: 'active'
  },
  {
    id: 'faq-5',
    question: 'Are private showers and changing rooms available?',
    answer: 'Yes. Every VIP therapy suite includes a private hot-water rain shower, dressing mirror, clean towels, and premium organic body wash and shampoo.',
    category: 'Facilities',
    displayOrder: 5,
    status: 'active'
  },
  {
    id: 'faq-6',
    question: 'What are your daily operating hours?',
    answer: 'Euro Spa Center is open 7 days a week, Monday through Sunday, from 10:00 AM to 10:00 PM, including most public holidays.',
    category: 'General',
    displayOrder: 6,
    status: 'active'
  },
  {
    id: 'faq-7',
    question: 'What payment methods do you accept?',
    answer: 'We accept Cash (BDT), bKash, Nagad, and all major Credit and Debit Cards (Visa, Mastercard, American Express).',
    category: 'Pricing & Payment',
    displayOrder: 7,
    status: 'active'
  }
];

export function getInitialFAQs(): FAQItem[] {
  const cached = getCachedData<FAQItem[]>(CACHE_KEYS.FAQS);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  return INITIAL_FAQS as FAQItem[];
}

export async function fetchAllFAQs(): Promise<FAQItem[]> {
  if (!isSupabaseConfigured()) {
    return INITIAL_FAQS as FAQItem[];
  }

  try {
    const { data, error } = await (getSupabase().from('faqs') as any)
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map(mapSupabaseFaqToFAQItem);
    }
  } catch (err) {
    console.warn('[Supabase] fetchAllFAQs error:', err);
  }

  return INITIAL_FAQS as FAQItem[];
}

export async function fetchPublicFAQs(): Promise<FAQItem[]> {
  return await fetchActiveFAQs();
}

export async function fetchActiveFAQs(): Promise<FAQItem[]> {
  if (!isSupabaseConfigured()) {
    return (INITIAL_FAQS as FAQItem[]).filter(f => f.status === 'active');
  }

  try {
    const { data, error } = await (getSupabase().from('faqs') as any)
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const list = data.map(mapSupabaseFaqToFAQItem);
      setCachedData(CACHE_KEYS.FAQS, list);
      return list;
    }
  } catch (err) {
    console.warn('[Supabase] fetchActiveFAQs error:', err);
  }

  return (INITIAL_FAQS as FAQItem[]).filter(f => f.status === 'active');
}

export function subscribeToActiveFAQs(callback: (items: FAQItem[]) => void): () => void {
  fetchActiveFAQs().then(callback);
  return subscribeToSupabaseTable('faqs', async () => {
    const updated = await fetchActiveFAQs();
    callback(updated);
  });
}

export function subscribeToAllFAQs(callback: (items: FAQItem[]) => void): () => void {
  fetchAllFAQs().then(callback);
  return subscribeToSupabaseTable('faqs', async () => {
    const updated = await fetchAllFAQs();
    callback(updated);
  });
}

export async function createFAQ(faq: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = `faq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const newFaq: FAQItem = {
    ...faq,
    id,
    displayOrder: faq.displayOrder ?? 99,
    status: faq.status || 'active',
    createdAt: now,
    updatedAt: now
  };

  const client = getSupabase();
  const supaRow = mapFaqToSupabaseRow(newFaq);
  const { error } = await (client.from('faqs') as any).upsert(supaRow);
  if (error) {
    console.error('[Supabase] createFAQ error:', error);
    throw new Error(error.message || 'Failed to create FAQ.');
  }

  const current = getInitialFAQs();
  setCachedData(CACHE_KEYS.FAQS, [...current, newFaq]);
  return id;
}

export async function updateFAQ(id: string, updates: Partial<Omit<FAQItem, 'id' | 'createdAt'>>): Promise<void> {
  const client = getSupabase();
  const supaRow = mapFaqToSupabaseRow({ ...updates, id } as any);
  const { error } = await (client.from('faqs') as any).update(supaRow).eq('id', id);
  if (error) {
    console.error('[Supabase] updateFAQ error:', error);
    throw new Error(error.message || 'Failed to update FAQ.');
  }

  const current = getInitialFAQs();
  const updatedList = current.map(f => f.id === id ? { ...f, ...updates } : f);
  setCachedData(CACHE_KEYS.FAQS, updatedList);
}

export async function deleteFAQ(id: string): Promise<void> {
  const client = getSupabase();
  const { error } = await (client.from('faqs') as any).delete().eq('id', id);
  if (error) {
    console.error('[Supabase] deleteFAQ error:', error);
    throw new Error(error.message || 'Failed to delete FAQ.');
  }

  const current = getInitialFAQs();
  setCachedData(CACHE_KEYS.FAQS, current.filter(f => f.id !== id));
}

export async function toggleFAQStatus(id: string, currentStatus: 'active' | 'inactive'): Promise<void> {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  await updateFAQ(id, { status: newStatus });
}

export async function reorderFAQs(orderedItems: { id: string; displayOrder: number }[]): Promise<void> {
  const client = getSupabase();
  const now = new Date().toISOString();
  await Promise.all(
    orderedItems.map(item =>
      (client.from('faqs') as any)
        .update({ sort_order: item.displayOrder, updated_at: now })
        .eq('id', item.id)
    )
  );
}

export async function seedInitialFAQsIfEmpty(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const client = getSupabase();
    const { data: existing } = await (client.from('faqs') as any).select('id').limit(1);
    if (existing && existing.length > 0) {
      return false;
    }

    const rows = INITIAL_FAQS.map(faq => mapFaqToSupabaseRow({
      ...faq,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    await (client.from('faqs') as any).upsert(rows);
    return true;
  } catch (err) {
    console.warn('Error seeding initial FAQs into Supabase:', err);
    return false;
  }
}
