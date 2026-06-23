'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FAQS } from '../data/faqs';

export function FaqSection() {
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-white border-t border-slate-100">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-16">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            FAQ
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 font-heading sm:text-4xl mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="border-t border-slate-100 divide-y divide-slate-100">
          {FAQS.map((faq, idx) => {
            const isOpen = faqOpenIndex === idx;
            return (
              <div key={idx} className="py-5">
                <button
                  onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between text-left font-heading font-bold text-base text-slate-900 hover:text-blue-600 transition-colors"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-400 shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400 shrink-0 ml-4" />
                  )}
                </button>
                <div
                  className={`transition-all duration-300 overflow-hidden ${
                    isOpen ? 'max-h-[200px] mt-3' : 'max-h-0'
                  }`}
                >
                  <p className="text-sm text-slate-500 leading-relaxed font-body">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
