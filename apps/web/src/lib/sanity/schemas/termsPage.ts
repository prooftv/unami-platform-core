import { defineType, defineField } from 'sanity'
import { seoFields, portableText } from './_shared'

export const termsPage = defineType({
  name: 'termsPage',
  title: 'Terms of Service',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
    portableText,
    defineField({ name: 'lastUpdated', title: 'Last Updated', type: 'date' }),
    defineField({ name: 'seo', title: 'SEO', type: 'object', fields: seoFields }),
  ],
})
