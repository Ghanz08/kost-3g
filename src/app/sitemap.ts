import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/lokasi`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${site.url}/tata-tertib`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${site.url}/faq`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
