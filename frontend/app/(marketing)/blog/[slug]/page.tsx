import { notFound } from 'next/navigation';
import { getAllSlugs, getPostBySlug, fetchPostBySlug, fetchPosts } from '@/lib/blog';
import BlogPostContent from './BlogPostContent';
import type { Metadata } from 'next';

export const revalidate = 3600;

export async function generateStaticParams() {
  const apiPosts = await fetchPosts();
  const slugs = apiPosts.length > 0
    ? apiPosts.map((p) => p.slug)
    : getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = (await fetchPostBySlug(slug)) ?? getPostBySlug(slug) ?? null;
  if (!post) return {};
  return {
    title:       `${post.title} — VibeScout`,
    description: post.excerpt,
    openGraph: {
      title:         post.title,
      description:   post.excerpt,
      type:          'article',
      publishedTime: post.date,
      tags:          post.tags,
    },
    twitter: {
      card:        'summary_large_image',
      title:       post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = (await fetchPostBySlug(slug)) ?? getPostBySlug(slug) ?? null;
  if (!post) notFound();

  return <BlogPostContent post={post} />;
}
