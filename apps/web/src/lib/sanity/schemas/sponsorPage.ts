import { defineType, defineField } from 'sanity'
import { seoFields, portableText } from './_shared'

export const sponsorPage = defineType({
  name: 'sponsorPage',
  title: 'Sponsor Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: r => r.required() }),
    defineField({ name: 'supabaseId', title: 'Supabase ID', type: 'string', description: 'Links to operational sponsors table — read only' }),
    defineField({ name: 'logo', title: 'Logo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'coverImage', title: 'Cover Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
    portableText,
    defineField({ name: 'website', title: 'Website URL', type: 'url' }),
    defineField({ name: 'seo', title: 'SEO', type: 'object', fields: seoFields }),
  ],
})
