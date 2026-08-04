/**
 * Sanity seed script — populates all editorial documents from hardcoded page content.
 * Run once: node apps/web/scripts/seed-sanity.mjs
 * Requires SANITY_API_TOKEN in environment (write token from sanity.io/manage → API → Tokens).
 */

import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'g4t7r2a1',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const documents = [
  // ─── siteSettings ────────────────────────────────────────────────────────
  {
    _id: 'siteSettings',
    _type: 'siteSettings',
    siteName: 'Moments',
    siteDescription: 'Community information platform for South Africa. Delivered via WhatsApp.',
    featuredCategories: ['Community', 'Safety', 'Education', 'Health', 'Opportunity'],
    footerLinks: [
      { label: 'About', url: '/about' },
      { label: 'Help', url: '/help' },
      { label: 'Sponsors', url: '/sponsors' },
      { label: 'Campaigns', url: '/campaigns' },
      { label: 'Authority', url: '/authority' },
      { label: 'Privacy', url: '/privacy' },
      { label: 'Terms', url: '/terms' },
    ],
    socialLinks: [],
  },

  // ─── homePage ────────────────────────────────────────────────────────────
  {
    _id: 'homePage',
    _type: 'homePage',
    hero: {
      heading: 'Community Moments',
      subheading: 'Local news and updates from across South Africa.',
      ctaLabel: 'Subscribe via WhatsApp',
      ctaUrl: '/subscribe',
    },
    featuredStories: [],
    seo: {
      metaTitle: 'Moments — Community Information Platform',
      metaDescription:
        'Local news, community updates, and announcements from across South Africa. Delivered via WhatsApp.',
    },
  },

  // ─── aboutPage ───────────────────────────────────────────────────────────
  {
    _id: 'aboutPage',
    _type: 'aboutPage',
    title: 'About Moments',
    body: [
      block('What is Moments?',
        'Moments connects communities with the information that matters to them. From safety alerts and health updates to local events and educational opportunities — Moments brings it all together in one trusted channel.'),
      block('How it works',
        'Subscribe via WhatsApp by sending START. Choose your region and topics of interest. Receive curated community updates on your schedule. Reply with commands to manage your preferences.'),
      block('Who publishes Moments?',
        'Content is published by verified community administrators, authority figures, and trusted local organisations. All content is reviewed before broadcast to ensure accuracy and community standards.'),
      block('Community authorities',
        'Moments works with traditional authorities, community leaders, and local government to surface official notices and community governance updates. Authority-verified content is clearly marked.'),
    ],
    seo: {
      metaTitle: 'About',
      metaDescription: 'About Moments — the community information platform for South Africa.',
    },
  },

  // ─── helpArticles ────────────────────────────────────────────────────────
  {
    _id: 'help-whatsapp-commands',
    _type: 'helpArticle',
    title: 'WhatsApp Commands',
    slug: { _type: 'slug', current: 'whatsapp-commands' },
    category: 'Getting started',
    excerpt: 'All commands you can send to Moments on WhatsApp.',
    order: 1,
    body: [
      bodyBlock('Send any of these commands to the Moments WhatsApp number:'),
      bodyBlock('START — Subscribe to Moments'),
      bodyBlock('STOP — Unsubscribe from all updates'),
      bodyBlock('HELP — Show available commands'),
      bodyBlock('STATUS — View your current subscription settings'),
      bodyBlock('REGIONS — Update your region preferences'),
      bodyBlock('RECENT — Receive the latest 5 moments'),
      bodyBlock('MYAUTHORITY — Get updates from your local authority'),
      bodyBlock('PAUSE — Pause updates for 24 hours'),
    ],
    seo: { metaTitle: 'WhatsApp Commands', metaDescription: 'All commands you can send to Moments on WhatsApp.' },
  },
  {
    _id: 'help-how-to-subscribe',
    _type: 'helpArticle',
    title: 'How to subscribe',
    slug: { _type: 'slug', current: 'how-to-subscribe' },
    category: 'Getting started',
    excerpt: 'Subscribe to Moments in four steps.',
    order: 2,
    body: [
      bodyBlock('Open WhatsApp on your phone.'),
      bodyBlock('Send START to our number.'),
      bodyBlock('Follow the prompts to choose your region and interests.'),
      bodyBlock('You will receive a confirmation message.'),
    ],
    seo: { metaTitle: 'How to subscribe', metaDescription: 'Subscribe to Moments in four steps.' },
  },
  {
    _id: 'help-how-to-unsubscribe',
    _type: 'helpArticle',
    title: 'How to unsubscribe',
    slug: { _type: 'slug', current: 'how-to-unsubscribe' },
    category: 'Account',
    excerpt: 'Send STOP at any time to unsubscribe.',
    order: 3,
    body: [
      bodyBlock('Send STOP at any time to unsubscribe from all Moments updates. You will receive a confirmation and no further messages will be sent. This is POPIA compliant.'),
    ],
    seo: { metaTitle: 'How to unsubscribe', metaDescription: 'Send STOP at any time to unsubscribe from Moments.' },
  },
  {
    _id: 'help-delivery-schedules',
    _type: 'helpArticle',
    title: 'Delivery schedules',
    slug: { _type: 'slug', current: 'delivery-schedules' },
    category: 'Preferences',
    excerpt: 'Choose when you receive your Moments updates.',
    order: 4,
    body: [
      bodyBlock('Instant — Receive moments as they are published.'),
      bodyBlock('Morning — Daily digest at 7:00 AM.'),
      bodyBlock('Evening — Daily digest at 6:00 PM.'),
      bodyBlock('Weekly — Weekly summary every Monday.'),
    ],
    seo: { metaTitle: 'Delivery schedules', metaDescription: 'Choose when you receive your Moments updates.' },
  },
  {
    _id: 'help-privacy-and-data',
    _type: 'helpArticle',
    title: 'Privacy and data',
    slug: { _type: 'slug', current: 'privacy-and-data' },
    category: 'Privacy',
    excerpt: 'How Moments handles your personal information.',
    order: 5,
    body: [
      bodyBlock('Moments only stores your phone number and preferences. We never share your data with third parties. All processing is POPIA compliant.'),
    ],
    seo: { metaTitle: 'Privacy and data', metaDescription: 'How Moments handles your personal information.' },
  },

  // ─── privacyPage ─────────────────────────────────────────────────────────
  {
    _id: 'privacyPage',
    _type: 'privacyPage',
    title: 'Privacy Policy',
    lastUpdated: new Date().toISOString().split('T')[0],
    body: [
      block('Information we collect',
        'When you subscribe to Moments via WhatsApp, we collect your phone number and the preferences you provide (region, categories, delivery schedule). We do not collect your name, email address, or any other personal information unless you voluntarily provide it.'),
      block('How we use your information',
        'Your phone number is used solely to deliver Moments updates to you via WhatsApp. Your preferences are used to filter and personalise the content you receive. We do not use your information for advertising, profiling, or any purpose other than delivering the service you subscribed to.'),
      block('Data sharing',
        'We do not sell, rent, or share your personal information with third parties. Sponsored content is delivered through our platform — sponsors do not receive subscriber data.'),
      block('Your rights (POPIA)',
        'Under the Protection of Personal Information Act (POPIA), you have the right to access, correct, or delete your personal information. You may unsubscribe at any time by sending STOP to our WhatsApp number. To request deletion of your data, contact us directly.'),
      block('Data retention',
        'We retain your subscription data for as long as you are subscribed. Upon unsubscription, your data is retained for 30 days for compliance purposes, then permanently deleted.'),
      block('Contact',
        'For privacy-related enquiries, contact us via WhatsApp or through the Help page.'),
    ],
    seo: {
      metaTitle: 'Privacy Policy',
      metaDescription: 'How Moments collects, uses, and protects your personal information.',
    },
  },

  // ─── termsPage ───────────────────────────────────────────────────────────
  {
    _id: 'termsPage',
    _type: 'termsPage',
    title: 'Terms of Service',
    lastUpdated: new Date().toISOString().split('T')[0],
    body: [
      block('Acceptance of terms',
        'By subscribing to Moments or using this website, you agree to these terms. If you do not agree, please do not use the service.'),
      block('The service',
        'Moments is a community information platform that delivers local news and updates via WhatsApp. The service is provided free of charge to subscribers. Standard WhatsApp data rates may apply.'),
      block('Content',
        'Content published on Moments is provided by verified administrators and community authorities. While we review content before broadcast, we do not guarantee the accuracy of all information. Always verify critical information through official sources.'),
      block('Acceptable use',
        'You may not use Moments to distribute spam, misinformation, or harmful content. Abuse of the WhatsApp command system may result in suspension of your subscription.'),
      block('Sponsored content',
        'Some Moments are sponsored by community partners. Sponsored content is clearly labelled. Sponsors do not influence editorial decisions or have access to subscriber data.'),
      block('Changes to terms',
        'We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.'),
    ],
    seo: {
      metaTitle: 'Terms of Service',
      metaDescription: 'Terms and conditions for using the Moments community platform.',
    },
  },

  // ─── authorityPages ──────────────────────────────────────────────────────
  {
    _id: 'authority-community-leader',
    _type: 'authorityPage',
    title: 'Community Leader',
    slug: { _type: 'slug', current: 'community-leader' },
    description: 'Ward-level community representatives and neighbourhood leaders.',
    body: [bodyBlock('Ward-level community representatives and neighbourhood leaders. Community Leaders publish local notices, safety alerts, and neighbourhood updates.')],
    seo: { metaTitle: 'Community Leader', metaDescription: 'Ward-level community representatives and neighbourhood leaders.' },
  },
  {
    _id: 'authority-local-authority',
    _type: 'authorityPage',
    title: 'Local Authority',
    slug: { _type: 'slug', current: 'local-authority' },
    description: 'Municipal officials and local government representatives.',
    body: [bodyBlock('Municipal officials and local government representatives. Local Authorities publish official municipal notices, service delivery updates, and public participation announcements.')],
    seo: { metaTitle: 'Local Authority', metaDescription: 'Municipal officials and local government representatives.' },
  },
  {
    _id: 'authority-traditional-authority',
    _type: 'authorityPage',
    title: 'Traditional Authority',
    slug: { _type: 'slug', current: 'traditional-authority' },
    description: 'Traditional leaders and councils with community governance roles.',
    body: [bodyBlock('Traditional leaders and councils with community governance roles. Traditional Authorities publish community governance notices, cultural announcements, and traditional council decisions.')],
    seo: { metaTitle: 'Traditional Authority', metaDescription: 'Traditional leaders and councils with community governance roles.' },
  },
  {
    _id: 'authority-provincial-authority',
    _type: 'authorityPage',
    title: 'Provincial Authority',
    slug: { _type: 'slug', current: 'provincial-authority' },
    description: 'Provincial government and regional governance bodies.',
    body: [bodyBlock('Provincial government and regional governance bodies. Provincial Authorities publish regional policy updates, provincial programme announcements, and cross-municipal notices.')],
    seo: { metaTitle: 'Provincial Authority', metaDescription: 'Provincial government and regional governance bodies.' },
  },
  {
    _id: 'authority-national-authority',
    _type: 'authorityPage',
    title: 'National Authority',
    slug: { _type: 'slug', current: 'national-authority' },
    description: 'National government departments and agencies.',
    body: [bodyBlock('National government departments and agencies. National Authorities publish national policy notices, government programme updates, and statutory public participation announcements.')],
    seo: { metaTitle: 'National Authority', metaDescription: 'National government departments and agencies.' },
  },
]

// ─── Portable Text helpers ────────────────────────────────────────────────────

function bodyBlock(text) {
  return {
    _type: 'block',
    _key: Math.random().toString(36).slice(2),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text, marks: [] }],
  }
}

function block(heading, text) {
  return [
    {
      _type: 'block',
      _key: Math.random().toString(36).slice(2),
      style: 'h2',
      markDefs: [],
      children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text: heading, marks: [] }],
    },
    bodyBlock(text),
  ]
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function seed() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('Missing SANITY_API_TOKEN. Get a write token from sanity.io/manage → API → Tokens.')
    process.exit(1)
  }

  console.log(`Seeding ${documents.length} documents to g4t7r2a1/production...`)

  const transaction = client.transaction()

  for (const doc of documents.flat()) {
    transaction.createOrReplace(doc)
  }

  const result = await transaction.commit()
  console.log(`✅ Done. ${result.results.length} documents created/replaced.`)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
