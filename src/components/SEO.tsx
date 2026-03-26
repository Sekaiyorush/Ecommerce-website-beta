import { useEffect } from 'react';

interface SEOProps {
    title: string;
    description?: string;
    ogImage?: string;
    canonical?: string;
    jsonLd?: Record<string, unknown>;
}

function setMetaTag(property: string, content: string, isOg = false) {
    const attr = isOg ? 'property' : 'name';
    let tag = document.querySelector(`meta[${attr}="${property}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, property);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

export function SEO({ title, description, ogImage, canonical, jsonLd }: SEOProps) {
    useEffect(() => {
        const fullTitle = `${title} | Golden Tier Peptide`;
        document.title = fullTitle;

        // Meta description
        if (description) {
            setMetaTag('description', description);
        }

        // Open Graph tags
        setMetaTag('og:title', fullTitle, true);
        setMetaTag('og:type', 'website', true);
        if (description) setMetaTag('og:description', description, true);
        if (ogImage) setMetaTag('og:image', ogImage, true);
        if (canonical) setMetaTag('og:url', canonical, true);

        // Canonical link
        if (canonical) {
            let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', 'canonical');
                document.head.appendChild(link);
            }
            link.setAttribute('href', canonical);
        }

        // JSON-LD structured data
        let scriptTag: HTMLScriptElement | null = null;
        if (jsonLd) {
            scriptTag = document.createElement('script');
            scriptTag.setAttribute('type', 'application/ld+json');
            scriptTag.textContent = JSON.stringify(jsonLd);
            document.head.appendChild(scriptTag);
        }

        // Cleanup
        return () => {
            document.title = 'Golden Tier Peptide | Premium Research Supplies';
            if (scriptTag) scriptTag.remove();
        };
    }, [title, description, ogImage, canonical, jsonLd]);

    return null;
}
