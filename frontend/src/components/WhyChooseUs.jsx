import React from 'react';
import { Shield, Zap, Download, MonitorPlay, Infinity, Lock } from 'lucide-react';

const features = [
  {
    title: 'No watermarks',
    description: 'Downloads are clean, exactly as posted.',
    icon: <Shield className="w-6 h-6" />
  },
  {
    title: 'No installation',
    description: 'Works entirely in your browser, on any device.',
    icon: <MonitorPlay className="w-6 h-6" />
  },
  {
    title: 'Fast processing',
    description: 'Most downloads are ready in under 10 seconds.',
    icon: <Zap className="w-6 h-6" />
  },
  {
    title: 'Multiple formats',
    description: 'Choose MP4, or extract audio only, depending on the platform.',
    icon: <Download className="w-6 h-6" />
  },
  {
    title: 'Free to use',
    description: 'No hidden fees, no premium paywall for core downloads.',
    icon: <Infinity className="w-6 h-6" />
  },
  {
    title: 'Privacy-first',
    description: "We don't store your videos or track what you download.",
    icon: <Lock className="w-6 h-6" />
  }
];

const WhyChooseUs = () => {
  return (
    <section className="w-full max-w-4xl mx-auto py-12 px-4 border-t border-border">
      <h2 className="text-3xl font-bold text-text-primary text-center mb-10">Why Choose URL2Vid</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-surface border border-border rounded-lg flex items-center justify-center text-accent">
              {feature.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-1">{feature.title}</h3>
              <p className="text-text-secondary text-sm">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseUs;
