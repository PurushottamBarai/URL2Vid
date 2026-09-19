import React, { useState } from 'react';
import SEO from '../components/SEO';
import { API_BASE_URL } from '../config';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const FEEDBACK_TITLE = 'Feedback - URL2Vid';
const FEEDBACK_DESCRIPTION = 'Share your thoughts, feedback, or report issues to help us improve URL2Vid.';

export default function Feedback() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setLoading(true);
    setStatus(null);
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setName('');
        setMessage('');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to submit feedback. Please try again later.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col w-full bg-white">
      <SEO
        title={FEEDBACK_TITLE}
        description={FEEDBACK_DESCRIPTION}
        canonicalPath="/feedback"
      />

      {/* Top Banner with site greenish theme */}
      <div className="relative w-full bg-gradient-to-r from-[#0a5f5e] via-[#0E7C7B] to-[#129493] py-16 sm:py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-wide">
          Feedback
        </h1>
        <p className="mt-3 text-white/80 text-sm sm:text-base max-w-lg mx-auto px-4">
          We’d love to hear your thoughts, suggestions, or reports to make URL2Vid even better.
        </p>

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

      {/* Feedback Form Card */}
      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {status === 'success' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center animate-fade-in shadow-sm">
            <div className="w-14 h-14 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thanks for your feedback!
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Your message has been sent successfully. We appreciate you taking the time to help improve URL2Vid.
            </p>
            <button
              type="button"
              onClick={() => setStatus(null)}
              className="px-6 py-2.5 rounded-lg bg-[#0E7C7B] text-white font-medium text-sm hover:bg-[#0a5f5e] transition-colors cursor-pointer"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {status === 'error' && (
                <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="feedback-name"
                  className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2"
                >
                  Your Name
                </label>
                <input
                  id="feedback-name"
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="input-field w-full px-4 py-3 text-text-primary rounded-lg border border-border focus:outline-none focus:border-[#0E7C7B]"
                />
              </div>

              <div>
                <label
                  htmlFor="feedback-message"
                  className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2"
                >
                  Your Message / Feedback
                </label>
                <textarea
                  id="feedback-message"
                  required
                  rows={5}
                  placeholder="Tell us what you like, what is broken, or features you would like to see..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                  className="input-field w-full px-4 py-3 text-text-primary rounded-lg border border-border focus:outline-none focus:border-[#0E7C7B] resize-y min-h-[120px]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim() || !message.trim()}
                className="btn-primary w-full py-3.5 px-6 rounded-lg text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
