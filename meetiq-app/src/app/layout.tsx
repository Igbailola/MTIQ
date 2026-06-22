import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "MeetIQ — AI Execution Accountability",
  description: "Transform meeting conversations into confirmed commitments and track ownership.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <AuthProvider>
            <WorkspaceProvider>
              {children}
              <Toaster position="top-right" richColors />
            </WorkspaceProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}


