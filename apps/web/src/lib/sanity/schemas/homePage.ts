import { defineType, defineField } from 'sanity'
import { seoFields } from './_shared'

export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string', validation: r => r.required() }),
        defineField({ name: 'subheading', title: 'Subheading', type: 'string' }),
        defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true } }),
        defineField({ name: 'ctaLabel', title: 'CTA Label', type: 'string' }),
        defineField({ name: 'ctaUrl', title: 'CTA URL', type: 'string' }),
      ],
    }),
    defineField({
      name: 'featuredStories',
      title: 'Featured Stories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'featuredStory' }] }],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'object', fields: seoFields }),
  ],
})
