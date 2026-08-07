import { defineType, defineField } from 'sanity'
import { seoFields, portableText } from './_shared'

export const campaignPage = defineType({
  name: 'campaignPage',
  title: 'Campaign Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: r => r.required() }),
    defineField({ name: 'supabaseId', title: 'Supabase ID', type: 'string', description: 'Links to operational campaigns table — read only' }),
    defineField({ name: 'coverImage', title: 'Cover Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 3 }),
    portableText,
    defineField({ name: 'seo', title: 'SEO', type: 'object', fields: seoFields }),
  ],
})
