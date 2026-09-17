import { useEffect } from 'react';
import PropTypes from 'prop-types';

const setMetaTag = (attr, name, content) => {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const SEO = ({ title, description, schema, canonicalPath }) => {
  useEffect(() => {
    if (title) document.title = title;

    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', 'https://url2vid.codedeck.me/logo.png');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', 'https://url2vid.codedeck.me/logo.png');

    const path = canonicalPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const canonicalUrl = `https://url2vid.codedeck.me${cleanPath === '/' ? '/' : cleanPath}`;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
    setMetaTag('property', 'og:url', canonicalUrl);

    document.getElementById('dynamic-schema')?.remove();

    if (schema) {
      const script = document.createElement('script');
      script.id = 'dynamic-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => document.getElementById('dynamic-schema')?.remove();
  }, [title, description, schema, canonicalPath]);

  return null;
};

SEO.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  schema: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  canonicalPath: PropTypes.string,
};

export default SEO;
