// Sanity document types — aligned with CONTENT_OWNERSHIP.md schema definitions.
// These are editorial types only. Operational types live in Supabase.

export type SanityImage = {
  _type: 'image'
  asset: { _ref: string; _type: 'reference' }
  alt?: string
  caption?: string
}

export type SanitySlug = {
  _type: 'slug'
  current: string
}

export type SanityBlock = {
  _type: 'block'
  _key: string
  children: Array<{ _type: 'span'; _key: string; text: string; marks: string[] }>
  markDefs: unknown[]
  style: string
}

export type SeoFields = {
  metaTitle?: string
  metaDescription?: string
  ogImage?: SanityImage
  noIndex?: boolean
}

// homePage — homepage composition
export type HomePage = {
  _type: 'homePage'
  _id: string
  hero: {
    heading: string
    subheading?: string
    image?: SanityImage
    ctaLabel?: string
    ctaUrl?: string
  }
  featuredStories: FeaturedStory[]
  seo?: SeoFields
}

// featuredStory — editorial long-form content
export type FeaturedStory = {
  _type: 'featuredStory'
  _id: string
  title: string
  slug: SanitySlug
  excerpt?: string
  coverImage?: SanityImage
  body?: SanityBlock[]
  publishedAt?: string
  seo?: SeoFields
}

// sponsorPage — sponsor editorial profile and landing page
export type SponsorPage = {
  _type: 'sponsorPage'
  _id: string
  title: string
  slug: SanitySlug
  // supabaseId links to the operational sponsors table — read-only reference
  supabaseId?: string
  logo?: SanityImage
  coverImage?: SanityImage
  description?: string
  body?: SanityBlock[]
  website?: string
  seo?: SeoFields
}

// campaignPage — editorial campaign presentation
export type CampaignPage = {
  _type: 'campaignPage'
  _id: string
  title: string
  slug: SanitySlug
  // supabaseId links to the operational campaigns table — read-only reference
  supabaseId?: string
  coverImage?: SanityImage
  summary?: string
  body?: SanityBlock[]
  seo?: SeoFields
}

// aboutPage — platform and organisation story
export type AboutPage = {
  _type: 'aboutPage'
  _id: string
  title: string
  body?: SanityBlock[]
  seo?: SeoFields
}

// helpArticle — user guidance and FAQs
export type HelpArticle = {
  _type: 'helpArticle'
  _id: string
  title: string
  slug: SanitySlug
  category?: string
  excerpt?: string
  body?: SanityBlock[]
  order?: number
  seo?: SeoFields
}

// privacyPage — privacy policy content
export type PrivacyPage = {
  _type: 'privacyPage'
  _id: string
  title: string
  body?: SanityBlock[]
  lastUpdated?: string
  seo?: SeoFields
}

// termsPage — terms of service content
export type TermsPage = {
  _type: 'termsPage'
  _id: string
  title: string
  body?: SanityBlock[]
  lastUpdated?: string
  seo?: SeoFields
}

// authorityPage — editorial profile of a governance authority
export type AuthorityPage = {
  _type: 'authorityPage'
  _id: string
  title: string
  slug: SanitySlug
  // supabaseId links to the operational authority_profiles table — read-only reference
  supabaseId?: string
  coverImage?: SanityImage
  description?: string
  body?: SanityBlock[]
  region?: string
  seo?: SeoFields
}

// siteSettings — navigation structure, featured categories, footer
export type SiteSettings = {
  _type: 'siteSettings'
  _id: string
  siteName?: string
  siteDescription?: string
  featuredCategories?: string[]
  footerLinks?: Array<{ label: string; url: string }>
  socialLinks?: Array<{ platform: string; url: string }>
}
