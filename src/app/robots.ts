import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Admin dan jalur analitik bukan untuk mesin pencari (admin juga bertanda noindex).
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/u/"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
