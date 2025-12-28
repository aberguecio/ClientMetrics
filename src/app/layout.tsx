import type { Metadata } from "next"
import "./globals.css"
import styles from "./layout.module.css"
import { initializeApp } from "@/lib/init"

// Initialize app services (auto-processor, etc.)
initializeApp()

export const metadata: Metadata = {
  title: "Client Metrics - Sales Analytics",
  description: "Automated sales meeting analysis and metrics dashboard",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>
        <div className={styles.wrapper}>
          <nav className={styles.navbar}>
            <div className="container">
              <div className={styles.navContent}>
                <h1 className={styles.logo}>Client Metrics</h1>
                <div className={styles.navLinks}>
                  <a href="/">Dashboard</a>
                  <a href="/upload">Upload</a>
                  <a href="/meetings">Meetings</a>
                </div>
              </div>
            </div>
          </nav>
          <main className={styles.main}>{children}</main>
        </div>
      </body>
    </html>
  )
}
