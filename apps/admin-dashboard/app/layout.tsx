import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KHADE Admin',
  description: 'KHADE platform operations console',
};

const NAV = [
  ['/', 'Overview'],
  ['/businesses', 'Verification queue'],
  ['/users', 'Users'],
  ['/bookings', 'Bookings'],
  ['/moderation', 'Moderation'],
  ['/promotions', 'Promotions'],
  ['/reports', 'Reports'],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <h1>KHADE · ADMIN</h1>
            <nav>
              {NAV.map(([href, label]) => (
                <a key={href} href={href}>
                  {label}
                </a>
              ))}
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
