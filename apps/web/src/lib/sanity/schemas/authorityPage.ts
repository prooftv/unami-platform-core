import { defineType, defineField } from 'sanity'
import { seoFields, portableText } from './_shared'

export const authorityPage = defineType({
  name: 'authorityPage',
  title: 'Authority Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: r => r.required() }),
    defineField({ name: 'supabaseId', title: 'Supabase ID', type: 'string', description: 'Links to operational authority_profiles table — read only' }),
    defineField({ name: 'coverImage', title: 'Cover Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
    portableText,
    defineField({
      name: 'region',
      title: 'Region',
      type: 'string',
      options: { list: ['KZN', 'WC', 'GP', 'EC', 'FS', 'LP', 'MP', 'NC', 'NW', 'National'] },
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'object', fields: seoFields }),
  ],
})
