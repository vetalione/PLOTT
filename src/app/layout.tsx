import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PLOTT — кнопка желаний",
  description: "Загадай желание, нажми на кнопку и поддержи желания других.",
  applicationName: "PLOTT",
  appleWebApp: { capable: true, title: "PLOTT — кнопка желаний", statusBarStyle: "default" },
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
