import "./globals.css";

export const metadata = {
  title: "Boarding House Management System",
  description: "Manage rooms, tenants, bills, and payments for a boarding house.",
};

// The root layout wraps every page in the app.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
