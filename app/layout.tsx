import { Metadata } from "next";
import { ClientLayout } from '../app/components/layout/ClientLayout';
import "./globals.css";
import { WebSocketConnection } from "./components/WebSocketConnection";

export const metadata: Metadata = {
  title: "Trading Dashboard",
  description: "Trading dashboard application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientLayout>
      <WebSocketConnection />
      {children}
    </ClientLayout>
  );
}