import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "발주 관리",
  description: "거래처별 재고 체크와 발주 관리",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-[#f5f6f8] text-[#1a1d23] antialiased">{children}</body>
    </html>
  );
}
