import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description?: string;
  canonical?: string;
  keywords?: string;
  image?: string;
}

const Seo = ({ title, description, canonical, keywords, image }: SeoProps) => {
  const fullTitle = title.length > 0 ? `${title} | MATRATV CARE` : "MATRATV CARE - Premium Feminine Hygiene Products";
  const metaDescription = description || "Premium sanitary pads with SAP gel technology for 15 hours stain-free protection. Anti-bacterial, rash-free feminine hygiene products by MATRATV CARE.";
  const canonicalHref = canonical || window.location.href;
  const defaultImage = "https://cdn.builder.io/api/v1/image/assets%2Fa1ebc5b67aec4d009962145ee3462ec2%2Fd920d98653d84a75a667603b0f9136f5?format=webp&width=800";
  const metaImage = image || defaultImage;
  const metaKeywords = keywords || "sanitary pads, feminine hygiene, matratv care, periods, women health, india, stain-free protection";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content="MATRATV CARE" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={canonicalHref} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalHref} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content="MATRATV CARE" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalHref} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={metaImage} />
      <meta property="twitter:site" content="@matratvcare" />

      {/* Additional SEO */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#8B5CF6" />
    </Helmet>
  );
};
Seo.displayName = "Seo";

export default Seo;
