import { defineType, defineField } from 'sanity'

export const seoFields = [
  defineField({ name: 'metaTitle', title: 'Meta Title', type: 'string' }),
  defineField({ name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 2 }),
  defineField({ name: 'ogImage', title: 'OG Image', type: 'image' }),
  defineField({ name: 'noIndex', title: 'No Index', type: 'boolean', initialValue: false }),
]

export const portableText = defineField({
  name: 'body',
  title: 'Body',
  type: 'array',
  of: [
    {
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [
          { name: 'link', type: 'object', title: 'Link', fields: [{ name: 'href', type: 'url', title: 'URL' }] },
        ],
      },
    },
    { type: 'image', options: { hotspot: true } },
  ],
})
