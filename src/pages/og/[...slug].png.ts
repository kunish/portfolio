import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateOgImage } from '../../utils/og-image';
import { SITE_TITLE } from '../../consts';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: {
      title: post.data.title,
      description: post.data.description,
      lang: post.data.lang,
    },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title, description, lang } = props as {
    title: string;
    description: string;
    lang: 'zh' | 'en';
  };

  const png = await generateOgImage({
    title,
    description,
    siteName: SITE_TITLE,
    lang,
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
