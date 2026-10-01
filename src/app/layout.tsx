import "./globals.css";
import React from 'react';

export const metadata = {
  title: "Auto-Apply Agent | Multi-User Job Hunter Dashboard",
  description: "Autonomous Job Auto-Apply Agent Dashboard with Human-in-the-Loop Approval",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-slate-200">
        {children}
      </body>
    </html>
  );
}
