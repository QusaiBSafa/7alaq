import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Barber Booking App",
  description: "Book your next barber appointment",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* <AuthProvider> */}
          <Layout>{children}</Layout>
        {/* </AuthProvider> */}
      </body>
    </html>
  );
}

