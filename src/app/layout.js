import './globals.css'

export const metadata = {
  title: 'Attendance Dashboard',
  description: 'Employee attendance tracker',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
