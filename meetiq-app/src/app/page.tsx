'use client';

import React from 'react';
import { Navbar } from '@/features/landing/components/navbar';
import { HeroSection } from '@/features/landing/components/hero-section';
import { DemoPlayground } from '@/features/landing/components/demo-playground';
import { BenefitsGrid } from '@/features/landing/components/benefits-grid';
import { PricingSection } from '@/features/landing/components/pricing-section';
import { FaqSection } from '@/features/landing/components/faq-section';
import { CtaSection } from '@/features/landing/components/cta-section';
import { Footer } from '@/features/landing/components/footer';
import { DEMO_SAMPLES } from '@/features/landing/data/demo-samples';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-body selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <HeroSection />
      <DemoPlayground samples={DEMO_SAMPLES} />
      <BenefitsGrid />
      <PricingSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
