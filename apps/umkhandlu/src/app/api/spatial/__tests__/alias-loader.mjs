import { fileURLToPath } from 'node:url';
import path from 'node:path';

const appSource = fileURLToPath(new URL('../../../../', import.meta.url));

export async function resolve(specifier, context, nextResolve) {
  const mocks = {
    'next/server': './mocks/next-server.mjs',
    '@/lib/supabase/server': './mocks/supabase.mjs',
    '@/lib/gis/spatial-public-access': './mocks/spatial-public-access.mjs',
    '@/app/(umkhandlu)/notices/[id]/_components/notice-layer-config':
      './mocks/notice-layer-config.mjs',
  };
  if (mocks[specifier]) {
    return {
      url: new URL(mocks[specifier], import.meta.url).href,
      shortCircuit: true,
    };
  }
  if (specifier.startsWith('@/')) {
    const aliasPath = path.resolve(appSource, `${specifier.slice(2)}.ts`);
    return nextResolve(new URL(`file://${aliasPath}`).href, context);
  }
  return nextResolve(specifier, context);
}
