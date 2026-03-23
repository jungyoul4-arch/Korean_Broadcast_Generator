import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Math Broadcast Generator",
  description: "수학 문제 이미지를 방송용 투명 PNG로 변환",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
