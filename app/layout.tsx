import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const requestHost = forwardedHost ?? requestHeaders.get("host") ?? "localhost:3000";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const requestProtocol = forwardedProtocol ?? (requestHost.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${requestProtocol}://${requestHost}`);
  const socialImage = new URL("/og.png", metadataBase).toString();

  return {
    metadataBase,
    title: "Student Recruitment Portal",
    description: "A verified student profile for campus recruitment and placements.",
    icons: {
      icon: "/ccd-logo-light.png",
      shortcut: "/ccd-logo-light.png",
    },
    openGraph: {
      title: "Student Recruitment Portal",
      description: "One verified profile. Every opportunity.",
      images: [{ url: socialImage, width: 1734, height: 907 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Student Recruitment Portal",
      description: "One verified profile. Every opportunity.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
