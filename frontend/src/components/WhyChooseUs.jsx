import React from 'react';
import { Shield, Zap, Download, MonitorPlay, Infinity, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const featureItems = [
  {
    titleKey: 'whyNoWatermarks',
    titleFallback: 'No watermarks',
    descKey: 'whyNoWatermarksDesc',
    descFallback: 'Downloads are clean, exactly as posted.',
    icon: <Shield className="w-6 h-6" aria-hidden="true" />
  },
  {
    titleKey: 'whyNoInstall',
    titleFallback: 'No installation',
    descKey: 'whyNoInstallDesc',
    descFallback: 'Works entirely in your browser, on any device.',
    icon: <MonitorPlay className="w-6 h-6" aria-hidden="true" />
  },
  {
    titleKey: 'whyFastProcessing',
    titleFallback: 'Fast processing',
    descKey: 'whyFastProcessingDesc',
    descFallback: 'Most downloads are ready in under 10 seconds.',
    icon: <Zap className="w-6 h-6" aria-hidden="true" />
  },
  {
    titleKey: 'whyMultipleFormats',
    titleFallback: 'Multiple formats',
    descKey: 'whyMultipleFormatsDesc',
    descFallback: 'Choose MP4, or extract audio only, depending on the platform.',
    icon: <Download className="w-6 h-6" aria-hidden="true" />
  },
  {
    titleKey: 'whyFree',
    titleFallback: 'Free to use',
    descKey: 'whyFreeDesc',
    descFallback: 'No hidden fees, no premium paywall for core downloads.',
    icon: <Infinity className="w-6 h-6" aria-hidden="true" />
  },
  {
    titleKey: 'whyPrivacy',
    titleFallback: 'Privacy-first',
    descKey: 'whyPrivacyDesc',
    descFallback: "We don't store your videos or track what you download.",
    icon: <Lock className="w-6 h-6" aria-hidden="true" />
  }
];

const WhyChooseUs = () => {
  const { t } = useLanguage();

  return (
    <section id="features" className="w-full max-w-4xl mx-auto py-12 px-4 border-t border-border">
      <h2 className="text-3xl font-bold text-text-primary text-center mb-10">{t('whyChooseTitle', 'Why Choose URL2Vid')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        {featureItems.map((feature) => (
          <div key={feature.titleKey} className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-surface border border-border rounded-lg flex items-center justify-center text-accent">
              {feature.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-1">{t(feature.titleKey, feature.titleFallback)}</h3>
              <p className="text-text-secondary text-sm">{t(feature.descKey, feature.descFallback)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseUs;
