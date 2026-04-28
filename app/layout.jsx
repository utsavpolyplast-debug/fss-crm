import './globals.css'

export const metadata = {
  title: 'FSS CRM',
  description: 'FSS Field Sales CRM',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
