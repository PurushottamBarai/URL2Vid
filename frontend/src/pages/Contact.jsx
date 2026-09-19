import React from 'react';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

const CONTACT_TITLE = 'Contact Us - URL2Vid';
const CONTACT_DESCRIPTION = 'Have questions or need help? Contact us via contact@codedeck.me or purushottamx.in@gmail.com.';

export default function Contact() {
  const { t } = useLanguage();

  return (
    <main className="flex-1 flex flex-col w-full bg-white">
      <SEO
        title={CONTACT_TITLE}
        description={CONTACT_DESCRIPTION}
        canonicalPath="/contact"
      />

      {/* Top Banner with site greenish theme and bottom curve */}
      <div className="relative w-full bg-gradient-to-r from-[#0a5f5e] via-[#0E7C7B] to-[#129493] py-20 sm:py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-wide">
          {t('contactPageTitle', 'Contact')}
        </h1>

        {/* Bottom subtle wave curve */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none">
          <svg
            className="relative block w-full h-5 sm:h-6 text-white fill-current"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M0,0 C200,60 400,20 600,50 C800,80 1000,30 1200,45 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </div>

      {/* Simple content area matching reference image */}
      <div className="w-full max-w-3xl mx-auto px-6 py-14 sm:py-16 text-gray-800 text-base sm:text-lg leading-relaxed">
        <p className="mb-6 text-gray-800">
          {t('contactHelpText', 'Have questions or need help with your purchase or our services? Use email:')}{' '}
          <a
            href="mailto:contact@codedeck.me"
            className="text-[#0E7C7B] hover:underline font-medium"
          >
            contact@codedeck.me
          </a>{' '}
          /{' '}
          <a
            href="mailto:purushottamx.in@gmail.com"
            className="text-[#0E7C7B] hover:underline font-medium"
          >
            purushottamx.in@gmail.com
          </a>
        </p>

        <p className="text-gray-800">
          {t('contactReachOutText', 'to reach out and we will be in touch with you as quickly as possible. For specific issues, make use of the following POCs for faster redressal.')}
        </p>
      </div>
    </main>
  );
}
