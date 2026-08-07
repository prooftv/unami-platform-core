import { defineType, defineField } from 'sanity'
import { seoFields, portableText } from './_shared'

export const helpArticle = defineType({
  name: 'helpArticle',
  title: 'Help Article',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: r => r.required() }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: { list: ['Getting Started', 'Subscriptions', 'Privacy', 'Technical', 'Community'] },
    }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 2 }),
    portableText,
    defineField({ name: 'order', title: 'Display Order', type: 'number', initialValue: 0 }),
    defineField({ name: 'seo', title: 'SEO', type: 'object', fields: seoFields }),
  ],
})
