import type { Metadata } from 'next';
import { getHelpArticles } from '@/lib/sanity/queries';
import { PortableText } from '@/components/PortableText';

export const metadata: Metadata = {
  title: 'Help',
  description: 'How to use Moments — commands, preferences, and support.',
};

export default async function HelpPage() {
  const articles = await getHelpArticles().catch(() => []);

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Everything you need to know about using Moments.
        </p>
      </div>

      {articles.length > 0 ? (
        <div className="space-y-6">
          {articles.map((article) => (
            <div key={article._id} className="rounded-xl border bg-card p-6">
              <h2 className="font-semibold mb-3">{article.title}</h2>
              {article.body && <PortableText value={article.body} />}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">Help articles coming soon.</p>
        </div>
      )}
    </div>
  );
}
