import { ShieldCheck, UserCheck, Sparkles, Lock, Award, CheckCircle2 } from 'lucide-react';
import { SPA_INFO } from '../data/spaData';
import { AboutContent, DEFAULT_ABOUT_CONTENT } from '../services/aboutService';
import { BusinessInfo } from '../types';

interface AboutSectionProps {
  aboutContent?: AboutContent;
  businessInfo?: BusinessInfo;
}

const DEFAULT_ICONS = [ShieldCheck, UserCheck, Sparkles, Lock, Award, CheckCircle2];

export function AboutSection({ aboutContent, businessInfo }: AboutSectionProps) {
  const content = aboutContent || DEFAULT_ABOUT_CONTENT;
  const name = businessInfo?.businessName || SPA_INFO.name;
  const heading = content.heading || `About ${name}`;
  const description = content.description || SPA_INFO.description;
  const highlights = content.highlights && content.highlights.length > 0 ? content.highlights : DEFAULT_ABOUT_CONTENT.highlights;

  return (
    <section id="section-overview" className="px-4 py-6 border-b border-gray-100 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Headings, Narrative Description, & Credentials */}
        <div className="md:col-span-6 lg:col-span-7 space-y-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
              {heading}
            </h2>
            {content.subheading && (
              <p className="text-xs sm:text-sm font-semibold text-blue-600 mt-0.5">
                {content.subheading}
              </p>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
            {description}
          </p>

          {content.secondaryText && (
            <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
              {content.secondaryText}
            </p>
          )}

          {/* Stats Badges if provided */}
          {(content.yearsOfExperience || content.clientsServed) && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {content.yearsOfExperience && (
                <div className="px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-900 text-xs font-bold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  <span>{content.yearsOfExperience} Excellence</span>
                </div>
              )}
              {content.clientsServed && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{content.clientsServed} Satisfied Guests</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Highlights Card matching Clean Minimalism */}
        <div className="md:col-span-6 lg:col-span-5 bg-gray-50/70 rounded-2xl border border-gray-200/90 p-4 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
            Why Choose Euro Spa Center
          </span>

          <div className="space-y-3">
            {highlights.map((item, idx) => {
              const Icon = DEFAULT_ICONS[idx % DEFAULT_ICONS.length];
              return (
                <div key={item.id || idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-800 block">
                      {item.title}
                    </span>
                    {item.description && (
                      <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
