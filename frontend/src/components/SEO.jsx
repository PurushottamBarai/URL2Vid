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

const SEO = ({ title, description, schema }) => {
  useEffect(() => {
    if (title) document.title = title;

    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.href = window.location.href.split('?')[0];
    }

    document.getElementById('dynamic-schema')?.remove();

    if (schema) {
      const script = document.createElement('script');
      script.id = 'dynamic-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => document.getElementById('dynamic-schema')?.remove();
  }, [title, description, schema]);

  return null;
};

SEO.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  schema: PropTypes.object,
};

export default SEO;
