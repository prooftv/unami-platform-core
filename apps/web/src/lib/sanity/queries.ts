import { sanityClient } from './client'
import type {
  HomePage,
  FeaturedStory,
  SponsorPage,
  CampaignPage,
  AboutPage,
  HelpArticle,
  PrivacyPage,
  TermsPage,
  AuthorityPage,
  SiteSettings,
} from './types'

// ─── homePage ────────────────────────────────────────────────────────────────

export async function getHomePage(): Promise<HomePage | null> {
  return sanityClient.fetch(
    `*[_type == "homePage"][0]{
      _type, _id,
      hero{ heading, subheading, image{ asset, alt, caption }, ctaLabel, ctaUrl },
      featuredStories[]->{ _type, _id, title, slug, excerpt, coverImage{ asset, alt }, publishedAt },
      seo{ metaTitle, metaDescription, ogImage{ asset, alt }, noIndex }
    }`,
    {},
    { next: { tags: ['homePage'] } }
  )
}

// ─── featuredStory ────────────────────────────────────────────────────────────

export async function getFeaturedStories(): Promise<FeaturedStory[]> {
  return sanityClient.fetch(
    `*[_type == "featuredStory"] | order(publishedAt desc){
      _type, _id, title, slug, excerpt, coverImage{ asset, alt }, publishedAt,
      seo{ metaTitle, metaDescription, ogImage{ asset, alt }, noIndex }
    }`,
    {},
    { next: { tags: ['featuredStory'] } }
  )
}

export async function getFeaturedStoryBySlug(slug: string): Promise<FeaturedStory | null> {
  return sanityClient.fetch(
    `*[_type == "featuredStory" && slug.current == $slug][0]{
      _type, _id, title, slug, excerpt, coverImage{ asset, alt }, body, publishedAt,
      seo{ metaTitle, metaDescription, ogImage{ asset, alt }, noIndex }
    }`,
    { slug },
    { next: { tags: [`featuredStory:${slug}`] } }
  )
}

// ─── sponsorPage ─────────────────────────────────────────────────────────────

export async function getSponsorPages(): Promise<SponsorPage[]> {
  return sanityClient.fetch(
    `*[_type == "sponsorPage"] | order(title asc){
      _type, _id, title, slug, supabaseId, logo{ asset, alt }, coverImage{ asset, alt },
      description,
      seo{ metaTitle, metaDescription, ogImage{ asset, alt }, noIndex }
    }`,
    {},
    { next: { tags: ['sponsorPage'] } }
  )
}

export async function getSponsorPageBySlug(slug: string): Promise<SponsorPage | null> {
  return sanityClient.fetch(
    `*[_type == "sponsorPage" && slug.current == $slug][0]{
      _type, _id, title, slug, supabaseId, logo{ asset, alt }, coverImage{ asset, alt },
      description, body, website,
      seo{ metaTitle, metaDescription, ogImage{ asset, alt }, noIndex }
    }`,
    { slug },
    { next: { tags: [`sponsorPage:${slug}`] } }
  )
}

// ─── campaignPage ─────────────────────────────────────────────────────────────

export async function getCampaignPages(): Promise<CampaignPage[]> {
  return sanityClient.fetch(
    `*[_type == "campaignPage"] | order(title asc){
      _type, _id, title, slug, supabaseId, coverImage{ asset, alt }, summary,
      seo{ metaTitle, metaDescription, ogImage{ asset, alt }, noIndex }
    }`,
    {},
    { next: { tags: ['campaignPage'] } }
  )
}

export async function getCampaignPageBySlug(slug: string): Promise<CampaignPage | null> {
  return sanityClient.fetch(
    `*[_type == "campaignPage" && slug.current == $slug][0]{
      _type, _id, title, slug, supabaseId, coverImage{ asset, alt }, summary, body,
      seo{ metaTitle, metaDescription, ogImage{ asset, alt }, noIndex }
    }`,
    { slug },
    { next: { tags: [`campaignPage:${slug}`] } }
  )
}

// ─── aboutPage ────────────────────────────────────────────────────────────────

export async function getAboutPage(): Promise<AboutPage | null> {
  return sanityClient.fetch(
    `*[_type == "aboutPage"][0]{
      _type, _id, title, body,
      seo{ metaTitle, metaDescription, ogImage{ asset, alt }, noIndex }
    }`,
    {},
    { next: { tags: ['aboutPage'] } }
  )
}

// ─── helpArticle ──────────────────────────────────────────────────────────────

export async function getHelpArticles(): Promise<HelpArticle[]> {
  return sanityClient.fetch(
    `*[_type == "helpArticle"] | order(order asc, title asc){
      _type, _id, title, slug, category, excerpt, order,
      seo{ metaTitle, metaDescription, ogImage{ asset, alt }, noIndex }
    }`,
    {},
    { next: { tags: ['helpArticle'] } }
  )
}

export async function getHelpArticleBySlug(slug: string): Promise<HelpArticle | null> {
  return sanityClient.fetch(
    `*[_type == "helpArticle" && slug.current == $slug][0]{
      _type, _id, title, slug, category, excerpt, body, order,
      seo{ metaTitle, metaDescription, ogImage{ asset, alt }, noIndex }
    }`,
    { slug },
    { next: { tags: [`helpArticle:${slug}`] } }
  )
}

// ─── privacyPage ──────────────────────────────────────────────────────────────

export async function getPrivacyPage(): Promise<PrivacyPage | null> {
  return sanityClient.fetch(
    `*[_type == "privacyPage"][0]{
      _type, _id, title, body, lastUpdated,
      seo{ metaTitle, metaDescription, ogImage{ asset, alt }, noIndex }
    }`,
    {},
    { next: { tags: ['privacyPage'] } }
  )
}

// ─── termsPage ────────────────────────────────────────────────────────────────

export async function getTermsPage(): Promise<TermsPage | null> {
  return sanityClient.fetch(
    `*[_type == "termsPage"][0]{
      _type, _id, title, body, lastUpdated,
      seo{ metaTitle, metaDescription, ogImage{ asset, alt }, noIndex }
    }`,
    {},
    { next: { tags: ['termsPage'] } }
  )
}

// ─── authorityPage ────────────────────────────────────────────────────────────

export async function getAuthorityPages(): Promise<AuthorityPage[]> {
  return sanityClient.fetch(
    `*[_type == "authorityPage"] | order(title asc){
      _type, _id, title, slug, supabaseId, coverImage{ asset, alt }, description, region,
      seo{ metaTitle, metaDescription, ogImage{ asset, alt }, noIndex }
    }`,
    {},
    { next: { tags: ['authorityPage'] } }
  )
}

export async function getAuthorityPageBySlug(slug: string): Promise<AuthorityPage | null> {
  return sanityClient.fetch(
    `*[_type == "authorityPage" && slug.current == $slug][0]{
      _type, _id, title, slug, supabaseId, coverImage{ asset, alt }, description, body, region,
      seo{ metaTitle, metaDescription, ogImage{ asset, alt }, noIndex }
    }`,
    { slug },
    { next: { tags: [`authorityPage:${slug}`] } }
  )
}

// ─── siteSettings ─────────────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return sanityClient.fetch(
    `*[_type == "siteSettings"][0]{
      _type, _id, siteName, siteDescription,
      featuredCategories, footerLinks, socialLinks
    }`,
    {},
    { next: { tags: ['siteSettings'] } }
  )
}
