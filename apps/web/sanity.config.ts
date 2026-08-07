import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'

import { homePage } from './src/lib/sanity/schemas/homePage'
import { featuredStory } from './src/lib/sanity/schemas/featuredStory'
import { sponsorPage } from './src/lib/sanity/schemas/sponsorPage'
import { campaignPage } from './src/lib/sanity/schemas/campaignPage'
import { aboutPage } from './src/lib/sanity/schemas/aboutPage'
import { helpArticle } from './src/lib/sanity/schemas/helpArticle'
import { privacyPage } from './src/lib/sanity/schemas/privacyPage'
import { termsPage } from './src/lib/sanity/schemas/termsPage'
import { authorityPage } from './src/lib/sanity/schemas/authorityPage'
import { siteSettings } from './src/lib/sanity/schemas/siteSettings'

export default defineConfig({
  name: 'moments',
  title: 'Moments CMS',
  projectId: 'g4t7r2a1',
  dataset: 'production',
  basePath: '/studio',
  plugins: [
    structureTool(),
    visionTool(),
  ],
  schema: {
    types: [
      siteSettings,
      homePage,
      featuredStory,
      sponsorPage,
      campaignPage,
      aboutPage,
      helpArticle,
      privacyPage,
      termsPage,
      authorityPage,
    ],
  },
})
