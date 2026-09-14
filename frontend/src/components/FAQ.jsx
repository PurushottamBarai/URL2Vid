import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Is URL2Vid free to use?',
    answer: 'Yes. URL2Vid is completely free — just paste a URL and download your video.'
  },
  {
    question: 'Do I need to create an account?',
    answer: "No. There's no sign-up required. Paste your link and download instantly."
  },
  {
    question: 'Is it legal to download videos with URL2Vid?',
    answer: "You should only download videos you own, have permission to use, or that are shared under a license allowing reuse. Downloading copyrighted content without permission may violate the original platform's terms of service."
  },
  {
    question: 'What video quality can I download?',
    answer: 'Quality depends on what the original platform provides — most videos are available in the highest resolution offered by the source.'
  },
  {
    question: 'Can I download videos on my phone?',
    answer: 'Yes. URL2Vid works on any device with a browser — mobile, tablet, or desktop.'
  },
  {
    question: "Why isn't a video downloading?",
    answer: 'Some videos may be private, age-restricted, or removed by the uploader, which can prevent downloading. Try a different public video link, or check that the URL was copied correctly.'
  },
  {
    question: 'Does URL2Vid add a watermark to downloaded videos?',
    answer: 'No. Videos are downloaded as close to the original as the source platform provides — no added watermark.'
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full max-w-4xl mx-auto py-12 px-4 border-t border-border mb-8">
      <h2 className="text-3xl font-bold text-text-primary text-center mb-10">Frequently Asked Questions</h2>
      
      <div className="flex flex-col gap-4">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="border border-border rounded-lg bg-surface overflow-hidden transition-all"
          >
            <button
              onClick={() => toggleFaq(index)}
              className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:bg-base/50"
              aria-expanded={openIndex === index}
            >
              <span className="font-semibold text-text-primary">{faq.question}</span>
              <ChevronDown 
                className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`}
              />
            </button>
            
            <div 
              className={`px-5 text-text-secondary text-sm overflow-hidden transition-all duration-200 ease-in-out ${openIndex === index ? 'pb-5 max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQ;
