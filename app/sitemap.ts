import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://alverse.app'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/city`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/districts`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/creator`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]

  try {
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get districts
    const { data: districts } = await supabase
      .from('districts')
      .select('slug, updated_at')
      .not('slug', 'is', null)

    // Get products
    const { data: products } = await supabase
      .from('products')
      .select('id, updated_at')
      .eq('status', 'approved')
      .not('id', 'is', null)

    // Get creators (users with creator role)
    const { data: creators } = await supabase
      .from('profiles')
      .select('username, updated_at')
      .not('username', 'is', null)
      .eq('role', 'creator')

    // Get halls
    const { data: halls } = await supabase
      .from('halls')
      .select('id, updated_at')
      .not('id', 'is', null)

    // Get streets
    const { data: streets } = await supabase
      .from('streets')
      .select('slug, updated_at')
      .not('slug', 'is', null)

    // Get chapels
    const { data: chapels } = await supabase
      .from('chapels')
      .select('id, updated_at')
      .not('id', 'is', null)

    // Build dynamic URLs
    const dynamicUrls: MetadataRoute.Sitemap = []

    // Add districts
    districts?.forEach(district => {
      dynamicUrls.push({
        url: `${baseUrl}/districts/${district.slug}`,
        lastModified: new Date(district.updated_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    })

    // Add products
    products?.forEach(product => {
      dynamicUrls.push({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: new Date(product.updated_at || Date.now()),
        changeFrequency: 'daily',
        priority: 0.6,
      })
    })

    // Add creators
    creators?.forEach(creator => {
      dynamicUrls.push({
        url: `${baseUrl}/creators/${creator.username}`,
        lastModified: new Date(creator.updated_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    })

    // Add halls
    halls?.forEach(hall => {
      dynamicUrls.push({
        url: `${baseUrl}/halls/${hall.id}`,
        lastModified: new Date(hall.updated_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    })

    // Add streets
    streets?.forEach(street => {
      dynamicUrls.push({
        url: `${baseUrl}/streets/${street.slug}`,
        lastModified: new Date(street.updated_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    })

    // Add chapels
    chapels?.forEach(chapel => {
      dynamicUrls.push({
        url: `${baseUrl}/chapels/${chapel.id}`,
        lastModified: new Date(chapel.updated_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    })

    return [...staticPages, ...dynamicUrls]

  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static pages only if database query fails
    return staticPages
  }
}