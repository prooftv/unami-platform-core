import { defineType, defineField } from 'sanity'
import { seoFields, portableText } from './_shared'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
    portableText,
    defineField({ name: 'seo', title: 'SEO', type: 'object', fields: seoFields }),
  ],
})
