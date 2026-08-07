import { defineType, defineField } from 'sanity'
import { seoFields, portableText } from './_shared'

export const featuredStory = defineType({
  name: 'featuredStory',
  title: 'Featured Story',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: r => r.required() }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 }),
    defineField({ name: 'coverImage', title: 'Cover Image', type: 'image', options: { hotspot: true } }),
    portableText,
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
    defineField({ name: 'seo', title: 'SEO', type: 'object', fields: seoFields }),
  ],
})
