import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '../context/AuthContext';

export const metadata: Metadata = {
  title: "NexusHub - Manage Your Community",
  description: "Streamline your organization with powerful tools for task management, scheduling, and team collaboration.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}