import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

// POST /api/revalidate
// Called by Sanity webhook on document publish/unpublish.
// Body: { _type: string; slug?: { current: string } }
// Header: Authorization: Bearer <SANITY_REVALIDATE_SECRET>

const TYPE_TO_PATHS: Record<string, string[]> = {
  homePage: ['/'],
  featuredStory: ['/', '/feed'],
  sponsorPage: ['/sponsors'],
  campaignPage: ['/campaigns'],
  aboutPage: ['/about'],
  helpArticle: ['/help'],
  privacyPage: ['/privacy'],
  termsPage: ['/terms'],
  authorityPage: ['/authority'],
  siteSettings: ['/'],
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let body: { _type?: string; slug?: { current?: string } }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const { _type, slug } = body

  if (!_type) {
    return NextResponse.json({ message: 'Missing _type' }, { status: 400 })
  }

  const paths = TYPE_TO_PATHS[_type] ?? []

  for (const path of paths) {
    revalidatePath(path)
  }

  // Revalidate the specific slug path if present
  if (slug?.current) {
    if (_type === 'featuredStory') revalidatePath(`/stories/${slug.current}`)
    if (_type === 'sponsorPage') revalidatePath(`/sponsors/${slug.current}`)
    if (_type === 'campaignPage') revalidatePath(`/campaigns/${slug.current}`)
    if (_type === 'helpArticle') revalidatePath(`/help/${slug.current}`)
    if (_type === 'authorityPage') revalidatePath(`/authority/${slug.current}`)
  }

  return NextResponse.json({
    revalidated: true,
    type: _type,
    slug: slug?.current ?? null,
    paths,
  })
}
