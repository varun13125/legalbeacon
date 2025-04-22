// src/app/layout.tsx
import './globals.css'  // optional, create this next if you want styles

export const metadata = {
  title: 'LegalBeacon',
  description: 'AI‑powered case management portal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
