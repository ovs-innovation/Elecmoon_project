import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);

    // Default SEO settings - API call removed to prevent blocking errors
    const setting = {
      favicon: "/favicon.png",
      meta_title: "Elecmoon – Creating Better Products For Life",
      meta_description: "Precision in every Voltage",
      meta_keywords: "ecommerce online store",
      meta_url: "https://elecmoon.com/",
      meta_img: "/favicon.png",
    };

    return { ...initialProps, setting };
  }

  render() {
    const setting = this.props.setting;
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href={setting?.favicon || "/favicon.png"} />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
            rel="stylesheet"
          />
          <meta
            property="og:title"
            content={
              setting?.meta_title ||
              "Elecmoon – Creating Better Products For Life"
            }
          />
          <meta property="og:type" content="eCommerce Website" />
          <meta
            property="og:description"
            content={
              setting?.meta_description ||
              "Precision in every Voltage"
            }
          />
          <meta
            name="keywords"
            content={setting?.meta_keywords || "ecommenrce online store"}
          />
          <meta
            property="og:url"
            content={
              setting?.meta_url || "https://elecmoon.com//"
            }
          />
          <meta
            property="og:image"
            content={
              setting?.meta_img ||
              "/favicon.png"
              // "https://res.cloudinary.com/dhqcwkpzp/image/upload/v1750844959/download_wfxk5k.webp"
            }
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
