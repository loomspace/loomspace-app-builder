import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsArticle } from "@/components/docs/docs-site";
import { docsPages, getDocsPage } from "@/lib/docs-data";

export function generateStaticParams() {
  return docsPages.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocsPage(slug);
  return page ? { title: `${page.title} — Loomspace manual`, description: page.summary } : {};
}

export default async function DocsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getDocsPage(slug);
  if (!page) notFound();
  return <DocsArticle page={page} />;
}
