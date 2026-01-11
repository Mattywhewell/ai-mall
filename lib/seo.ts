/**
 * SEO and Metadata Utilities
 * Provides consistent metadata generation for pages and structured data
 */

export interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export interface StructuredDataProps {
  type: 'WebSite' | 'Article' | 'Product' | 'Person' | 'Organization' | 'BreadcrumbList';
  data: any;
}

/**
 * Generate comprehensive meta tags for SEO
 */
export function generateMetaTags(props: SEOProps) {
  const {
    title,
    description,
    keywords = [],
    image = '/og-image.jpg',
    url,
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    section,
    tags = []
  } = props;

  const siteName = 'Aiverse';
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const canonicalUrl = url ? `https://alverse.app${url}` : 'https://alverse.app';
  const imageUrl = image.startsWith('http') ? image : `https://alverse.app${image}`;

  return {
    title: fullTitle,
    description,
    keywords: [...keywords, 'AI', 'ecommerce', 'autonomous', 'creator economy'].join(', '),
    canonical: canonicalUrl,
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { author }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    other: {
      'article:author': author,
      'article:section': section,
      'article:tag': tags,
      'article:published_time': publishedTime,
      'article:modified_time': modifiedTime,
    },
  };
}

/**
 * Generate structured data (JSON-LD) for rich snippets
 */
export function generateStructuredData(props: StructuredDataProps) {
  const { type, data } = props;

  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  // Add site-specific structured data
  if (type === 'WebSite') {
    return {
      ...baseData,
      name: 'Aiverse',
      description: 'Autonomous AI-native e-commerce platform',
      url: 'https://alverse.app',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://alverse.app/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    };
  }

  if (type === 'Product') {
    return {
      ...baseData,
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/InStock',
        priceCurrency: 'USD',
        ...data.offers,
      },
    };
  }

  if (type === 'Person') {
    return {
      ...baseData,
      sameAs: data.socialLinks || [],
    };
  }

  return baseData;
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbData(items: Array<{ name: string; url: string }>) {
  return generateStructuredData({
    type: 'BreadcrumbList',
    data: {
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `https://alverse.app${item.url}`,
      })),
    },
  });
}

/**
 * Common SEO configurations for different page types
 */
export const SEO_CONFIGS = {
  home: {
    title: 'Aiverse - Autonomous AI-Native E-commerce',
    description: 'Discover unique products in an autonomous AI-powered marketplace. Connect with creators, explore districts, and experience the future of shopping.',
    keywords: ['AI marketplace', 'autonomous commerce', 'creator economy', 'AI shopping'],
    image: '/og-home.jpg',
  },

  district: (name: string, description: string) => ({
    title: `${name} District - Aiverse`,
    description: description || `Explore the ${name} district in Aiverse. Discover unique products and connect with local creators.`,
    keywords: ['district', 'marketplace', name.toLowerCase(), 'shopping'],
    type: 'website' as const,
  }),

  product: (name: string, description: string, price?: number, image?: string) => ({
    title: `${name} - Aiverse Marketplace`,
    description: description || `Discover ${name} in the Aiverse marketplace.`,
    keywords: ['product', 'shopping', name.toLowerCase()],
    image: image || '/og-product.jpg',
    type: 'product' as const,
  }),

  creator: (username: string, bio?: string) => ({
    title: `${username} - Creator on Aiverse`,
    description: bio || `Discover products and creations by ${username} on Aiverse.`,
    keywords: ['creator', 'artist', username.toLowerCase()],
    type: 'profile' as const,
  }),

  hall: (name: string, description: string) => ({
    title: `${name} Hall - Aiverse City`,
    description: description || `Explore ${name} Hall in the Aiverse city.`,
    keywords: ['hall', 'city', name.toLowerCase()],
    type: 'website' as const,
  }),

  street: (name: string, description: string) => ({
    title: `${name} Street - Aiverse City`,
    description: description || `Walk down ${name} Street in the Aiverse city.`,
    keywords: ['street', 'city', name.toLowerCase()],
    type: 'website' as const,
  }),
};