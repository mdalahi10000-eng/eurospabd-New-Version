import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
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

const FAQS_COLLECTION = 'faqs';

/**
 * Returns the latest synchronously available active FAQs (from cache if available)
 */
export function getInitialFAQs(): FAQItem[] {
  const cached = getCachedData<FAQItem[]>(CACHE_KEYS.FAQS);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  return INITIAL_FAQS as FAQItem[];
}

export async function fetchAllFAQs(): Promise<FAQItem[]> {
  try {
    const q = query(collection(db, FAQS_COLLECTION), orderBy('displayOrder', 'asc'));
    const snap = await getDocs(q);

    if (snap.empty) {
      return INITIAL_FAQS as FAQItem[];
    }

    const list: FAQItem[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        question: data.question || '',
        answer: data.answer || '',
        category: data.category || 'General',
        displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : list.length + 1,
        status: data.status || 'active',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    return list.sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (err) {
    console.warn('Error fetching all FAQs from Firestore:', err);
    return INITIAL_FAQS as FAQItem[];
  }
}

export async function fetchPublicFAQs(): Promise<FAQItem[]> {
  try {
    const all = await fetchAllFAQs();
    const active = all.filter(f => f.status === 'active');
    if (active.length > 0) {
      setCachedData(CACHE_KEYS.FAQS, active);
    }
    return active;
  } catch (err) {
    console.warn('Error fetching public FAQs:', err);
    return getInitialFAQs();
  }
}

export async function fetchActiveFAQs(): Promise<FAQItem[]> {
  if (isSupabaseConfigured()) {
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
      console.warn('[Supabase] fetchActiveFAQs fallback to Firestore:', err);
    }
  }

  try {
    const q = query(collection(db, FAQS_COLLECTION), orderBy('displayOrder', 'asc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const list: FAQItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.status !== 'inactive') {
          list.push({
            id: d.id,
            question: data.question || '',
            answer: data.answer || '',
            category: data.category || 'General',
            displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : list.length + 1,
            status: data.status || 'active',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        }
      });
      const sorted = list.sort((a, b) => a.displayOrder - b.displayOrder);
      setCachedData(CACHE_KEYS.FAQS, sorted);
      return sorted;
    }
  } catch (err) {
    console.warn('fetchActiveFAQs Firestore error:', err);
  }

  return getInitialFAQs();
}

export function subscribeToActiveFAQs(callback: (items: FAQItem[]) => void): () => void {
  if (isSupabaseConfigured()) {
    fetchActiveFAQs().then(callback);
    return subscribeToSupabaseTable('faqs', async () => {
      const updated = await fetchActiveFAQs();
      callback(updated);
    });
  }

  const q = query(collection(db, FAQS_COLLECTION), orderBy('displayOrder', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        const initial = getInitialFAQs();
        callback(initial);
        return;
      }
      const list: FAQItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.status !== 'inactive') {
          list.push({
            id: d.id,
            question: data.question || '',
            answer: data.answer || '',
            category: data.category || 'General',
            displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : list.length + 1,
            status: data.status || 'active',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        }
      });
      const sorted = list.sort((a, b) => a.displayOrder - b.displayOrder);
      setCachedData(CACHE_KEYS.FAQS, sorted);
      callback(sorted);
    },
    (error) => {
      console.warn('Firestore onSnapshot error in subscribeToActiveFAQs:', error);
      callback(getInitialFAQs());
    }
  );
}

export function subscribeToAllFAQs(callback: (items: FAQItem[]) => void): () => void {
  if (isSupabaseConfigured()) {
    (async () => {
      try {
        const { data, error } = await (getSupabase().from('faqs') as any)
          .select('*')
          .order('sort_order', { ascending: true });
        if (!error && data) {
          callback(data.map(mapSupabaseFaqToFAQItem));
        }
      } catch (err) {
        console.warn('[Supabase] subscribeToAllFAQs initial fetch error:', err);
      }
    })();

    return subscribeToSupabaseTable('faqs', async () => {
      try {
        const { data, error } = await (getSupabase().from('faqs') as any)
          .select('*')
          .order('sort_order', { ascending: true });
        if (!error && data) {
          callback(data.map(mapSupabaseFaqToFAQItem));
        }
      } catch (err) {
        console.warn('[Supabase] subscribeToAllFAQs update error:', err);
      }
    });
  }

  const q = query(collection(db, FAQS_COLLECTION), orderBy('displayOrder', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(INITIAL_FAQS as FAQItem[]);
        return;
      }
      const list: FAQItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          question: data.question || '',
          answer: data.answer || '',
          category: data.category || 'General',
          displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : list.length + 1,
          status: data.status || 'active',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      callback(list.sort((a, b) => a.displayOrder - b.displayOrder));
    },
    (error) => {
      console.warn('Firestore onSnapshot error in subscribeToAllFAQs:', error);
      callback(INITIAL_FAQS as FAQItem[]);
    }
  );
}

export async function createFAQ(faq: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = `faq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const ref = doc(db, FAQS_COLLECTION, id);
  const newFaq: FAQItem = {
    ...faq,
    id,
    displayOrder: faq.displayOrder ?? 99,
    status: faq.status || 'active'
  };
  await setDoc(ref, {
    ...newFaq,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  if (isSupabaseConfigured()) {
    try {
      const supaRow = mapFaqToSupabaseRow(newFaq);
      await (getSupabase().from('faqs') as any).upsert(supaRow);
    } catch (err) {
      console.warn('[Supabase] createFAQ sync error:', err);
    }
  }

  const current = getInitialFAQs();
  setCachedData(CACHE_KEYS.FAQS, [...current, newFaq]);
  return id;
}

export async function updateFAQ(id: string, updates: Partial<Omit<FAQItem, 'id' | 'createdAt'>>): Promise<void> {
  const ref = doc(db, FAQS_COLLECTION, id);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp()
  });

  if (isSupabaseConfigured()) {
    try {
      const supaRow = mapFaqToSupabaseRow({ ...updates, id } as any);
      await (getSupabase().from('faqs') as any).update(supaRow).eq('id', id);
    } catch (err) {
      console.warn('[Supabase] updateFAQ sync error:', err);
    }
  }

  const current = getInitialFAQs();
  const updatedList = current.map(f => f.id === id ? { ...f, ...updates } : f);
  setCachedData(CACHE_KEYS.FAQS, updatedList);
}

export async function deleteFAQ(id: string): Promise<void> {
  const ref = doc(db, FAQS_COLLECTION, id);
  await deleteDoc(ref);

  if (isSupabaseConfigured()) {
    try {
      await (getSupabase().from('faqs') as any).delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase] deleteFAQ sync error:', err);
    }
  }

  const current = getInitialFAQs();
  setCachedData(CACHE_KEYS.FAQS, current.filter(f => f.id !== id));
}

export async function toggleFAQStatus(id: string, currentStatus: 'active' | 'inactive'): Promise<void> {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  await updateFAQ(id, { status: newStatus });
}

export async function reorderFAQs(orderedItems: { id: string; displayOrder: number }[]): Promise<void> {
  const batch = writeBatch(db);
  orderedItems.forEach(item => {
    const ref = doc(db, FAQS_COLLECTION, item.id);
    batch.update(ref, {
      displayOrder: item.displayOrder,
      updatedAt: serverTimestamp()
    });
  });
  await batch.commit();
}

export async function seedInitialFAQsIfEmpty(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, FAQS_COLLECTION));
    if (!snap.empty) {
      return false; // Already has items
    }

    const batch = writeBatch(db);
    INITIAL_FAQS.forEach(faq => {
      const ref = doc(db, FAQS_COLLECTION, faq.id);
      batch.set(ref, {
        ...faq,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.warn('Error seeding initial FAQs:', err);
    return false;
  }
}
