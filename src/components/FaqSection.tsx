import { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle, MessageSquare, Phone } from 'lucide-react';
import { subscribeToActiveFAQs, INITIAL_FAQS } from '../services/faqService';
import { FAQItem } from '../types';

interface FaqSectionProps {
  onWhatsAppClick?: () => void;
  onCallClick?: () => void;
}

export function FaqSection({ onWhatsAppClick, onCallClick }: FaqSectionProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToActiveFAQs((items) => {
      if (items.length > 0) {
        setFaqs(items);
        if (!openId) {
          setOpenId(items[0].id);
        }
      } else {
        // Fallback to initial standard spa FAQs
        setFaqs(INITIAL_FAQS.map(f => ({ ...f, id: f.id })));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleAccordion = (id: string) => {
    setOpenId(prev => prev === id ? null : id);
  };

  const activeFaqs = faqs.filter(f => f.status !== 'inactive');

  return (
    <section id="section-faq" className="px-4 py-6 border-b border-gray-100 bg-white">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Everything you need to know about our wellness therapies, hygiene, and booking policies.
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading FAQs...
          </div>
        ) : (
          <div className="space-y-2.5 pt-1">
            {activeFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-gray-200/90 overflow-hidden transition-all bg-gray-50/50 hover:bg-white"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-2.5 flex-1 pr-2">
                      <span className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                        {faq.question}
                      </span>
                      {faq.category && (
                        <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold border border-blue-100 shrink-0">
                          {faq.category}
                        </span>
                      )}
                    </div>
                    <div className={`w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600 border-blue-200' : ''}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-white">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Assistance Callout */}
        <div className="mt-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-blue-950">Have another question?</p>
            <p className="text-[11px] text-blue-800">Our reception team is available 10:00 AM – 10:00 PM daily to assist you.</p>
          </div>
          <div className="flex items-center gap-2">
            {onWhatsAppClick && (
              <button
                type="button"
                onClick={onWhatsAppClick}
                className="px-3.5 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            )}
            {onCallClick && (
              <button
                type="button"
                onClick={onCallClick}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-blue-900 border border-blue-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Call Us</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
