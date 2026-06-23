import Link from 'next/link';
import { Check } from 'lucide-react';

const PLANS = [
  {
    name: 'Sandbox',
    description: 'For testing MeetIQ on basic syncs',
    price: '$0',
    priceLabel: '/ forever',
    features: ['3 meeting uploads / mo', 'Basic transcript extraction', '1 Workspace', 'In-app notifications', 'Standard search'],
    ctaText: 'Get Started',
    ctaHref: '/register',
  },
  {
    name: 'Pro Team',
    description: 'For growing teams tracking execution',
    price: '$29',
    priceLabel: '/ month',
    highlighted: true,
    badge: 'Most Popular',
    features: [
      'Unlimited meeting uploads',
      'GPT-4 precision extraction',
      'Escalation pathway setup',
      'Email & Slack notifications',
      'Advanced accountability stats',
      'Priority processing queue',
    ],
    ctaText: 'Start Free Trial',
    ctaHref: '/register',
  },
  {
    name: 'Enterprise Scale',
    description: 'For secure, high-compliance corps',
    price: 'Custom',
    features: [
      'Dedicated API node instances',
      'Automated PII scrubbing scripts',
      'SAML SSO & Okta integration',
      '99.9% uptime SLA guarantee',
      'Custom DB migration assistance',
      'Dedicated support manager',
    ],
    ctaText: 'Contact Sales',
    ctaHref: '/register',
  },
];

export function PricingSection() {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-100">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            Simple Pricing
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 font-heading sm:text-4xl mt-4">
            Designed for teams of all sizes
          </h2>
          <p className="mt-3 text-slate-500 text-sm sm:text-base">
            Get started with our free tier, and upgrade to unlock advanced AI models and integrations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan, idx) => (
            <div
              key={idx}
              className={`flex flex-col bg-white rounded-2xl p-8 relative ${
                plan.highlighted
                  ? 'border-2 border-blue-600 shadow-meetiq-sm'
                  : 'border border-slate-200 shadow-meetiq-xs'
              }`}
            >
              {plan.badge && (
                <span className="absolute top-0 right-6 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {plan.badge}
                </span>
              )}
              <div className="mb-6">
                <h3 className="font-heading font-extrabold text-lg text-slate-900">{plan.name}</h3>
                <p className="text-slate-400 text-xs mt-1">{plan.description}</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-950">{plan.price}</span>
                  {plan.priceLabel && <span className="text-slate-400 text-sm ml-1">{plan.priceLabel}</span>}
                </div>
              </div>
              <ul className="space-y-3 mb-8 text-xs sm:text-sm text-slate-600 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className={`h-4 w-4 shrink-0 ${plan.highlighted ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className={plan.highlighted ? 'font-semibold text-slate-700' : ''}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.ctaHref}
                className={`w-full h-11 inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-meetiq-sm'
                    : 'border border-slate-200 bg-background text-slate-700 hover:bg-slate-50 shadow-meetiq-xs'
                }`}
              >
                {plan.ctaText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
