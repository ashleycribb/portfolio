
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect } from 'react';
import { PortfolioConfig } from './Editor';

interface MetadataHandlerProps {
  config: PortfolioConfig;
}

export const MetadataHandler: React.FC<MetadataHandlerProps> = ({ config }) => {
  useEffect(() => {
    // Helper function to create or update meta tags
    const updateMeta = (selector: string, attribute: string, attrValue: string, content: string) => {
        let element = document.querySelector(selector);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute(attribute, attrValue);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    // 1. Update Basic Title
    document.title = `${config.name} | ${config.title}`;

    // 2. Update Meta Description
    updateMeta('meta[name="description"]', 'name', 'description', config.bio);

    // 3. Update Open Graph Tags
    updateMeta('meta[property="og:title"]', 'property', 'og:title', `${config.name} | ${config.title}`);
    updateMeta('meta[property="og:description"]', 'property', 'og:description', config.bio);
    updateMeta('meta[property="og:url"]', 'property', 'og:url', window.location.href);
    updateMeta('meta[property="og:type"]', 'property', 'og:type', 'website');

    // Attempt to find a representative image (first non-data-uri project image)
    const ogImage = config.projects.find(p => p.imageUrl && !p.imageUrl.startsWith('data:'))?.imageUrl;
    if (ogImage) {
        updateMeta('meta[property="og:image"]', 'property', 'og:image', ogImage);
    }

    // 4. Inject/Update Schema.org JSON-LD
    const scriptId = 'academic-json-ld';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement;

    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    // Construct the Schema
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "mainEntity": {
        "@type": "Person",
        "name": config.name,
        "description": config.bio,
        "jobTitle": config.title,
        "url": window.location.href,
        "sameAs": [
          config.linkedin,
          config.github,
          config.email ? `mailto:${config.email}` : null
        ].filter(Boolean),
        "identifier": config.orcid ? {
            "@type": "PropertyValue",
            "propertyID": "ORCID",
            "value": config.orcid
        } : undefined,
        "knowsAbout": config.keywords
      },
      "hasPart": [
        ...config.projects.map(p => ({
            "@type": "CreativeWork",
            "name": p.title,
            "description": p.description,
            "thumbnailUrl": p.imageUrl,
            "url": p.projectUrl
        })),
        ...(config.publications || []).map(pub => ({
            "@type": "ScholarlyArticle",
            "headline": pub.title,
            "author": pub.authors,
            "datePublished": pub.year,
            "publication": {
                "@type": "Periodical",
                "name": pub.journal
            },
            "sameAs": pub.doi ? `https://doi.org/${pub.doi}` : pub.url,
            "identifier": pub.doi ? {
                "@type": "PropertyValue",
                "propertyID": "DOI",
                "value": pub.doi
            } : undefined
        }))
      ]
    };

    scriptTag.text = JSON.stringify(schemaData);

  }, [config]);

  return null; // This component does not render UI
};
