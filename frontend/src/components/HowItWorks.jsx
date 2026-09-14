import React from 'react';

const HowItWorks = () => {
  return (
    <section className="w-full max-w-4xl mx-auto py-12 px-4 border-t border-border mt-8">
      <h2 className="text-3xl font-bold text-text-primary text-center mb-10">How URL2Vid Works</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center p-6 bg-surface rounded-lg border border-border">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xl font-bold mb-4">1</div>
          <h3 className="text-xl font-semibold mb-3">Copy the video link</h3>
          <p className="text-text-secondary text-sm leading-relaxed">
            Find the video you want on YouTube, Instagram, TikTok, or any supported platform, and copy its URL from the address bar or share menu.
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-6 bg-surface rounded-lg border border-border">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xl font-bold mb-4">2</div>
          <h3 className="text-xl font-semibold mb-3">Paste it into URL2Vid</h3>
          <p className="text-text-secondary text-sm leading-relaxed">
            Drop the link into the input box above and hit "Extract." No account, no app install required.
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-6 bg-surface rounded-lg border border-border">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xl font-bold mb-4">3</div>
          <h3 className="text-xl font-semibold mb-3">Choose your quality</h3>
          <p className="text-text-secondary text-sm leading-relaxed">
            Pick your preferred resolution or format, and save the video directly to your device in seconds.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
