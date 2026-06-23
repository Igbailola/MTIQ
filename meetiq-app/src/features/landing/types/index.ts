export interface DemoSample {
  title: string;
  transcript: string;
  summaryBullets: string[];
  decision: string;
  commitments: {
    title: string;
    owner: string;
    due: string;
    priority: 'low' | 'medium' | 'high';
    confidence: 'high' | 'medium' | 'low';
  }[];
}

export interface Benefit {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export interface PricingPlan {
  name: string;
  description: string;
  price: string;
  priceLabel?: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}
