import type { Metadata } from "next";

import { siteConfig } from "@/lib/constants/site";

type BuildMetadataOptions = {
  title: string;
  description: string;
  path: string;
};

export function buildMetadata({
  title,
  description,
  path,
}: BuildMetadataOptions): Metadata {
  const canonicalPath = path === "/" ? "" : path;
  const url = `https://ai-finance-manager.vercel.app${canonicalPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath || "/",
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url,
      siteName: siteConfig.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
    },
  };
}
