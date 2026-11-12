import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Кнопка Желаний",
  description: "Загадай желание, нажми на кнопку и поддержи желания других.",
  applicationName: "Кнопка Желаний",
  appleWebApp: { capable: true, title: "Кнопка Желаний", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fbfbfa",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
