import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KHADE for Business',
  description: 'Manage bookings, staff, services and growth',
};

const NAV = [
  ['/', 'Dashboard'],
  ['/bookings', 'Appointments'],
  ['/services', 'Services'],
  ['/staff', 'Staff'],
  ['/customers', 'Customers'],
  ['/analytics', 'Analytics'],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <h1>KHADE</h1>
            <div className="sub">for Business</div>
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
