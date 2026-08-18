import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import ManualClient from './ManualClient';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export default function Page() {
  return (
    <div
      className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}
      style={{ display: 'contents' }}
    >
      <ManualClient />
    </div>
  );
}
