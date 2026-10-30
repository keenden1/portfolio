import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jimmy Bautista | Full-Stack Web Developer",
  description: "Crafting exceptional digital experiences with code.",
  icons: { icon: "/logo.svg" },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
              var theme = "dark";
              try {
                var saved = localStorage.getItem("portfolio-theme");
                if (["light", "dark", "amoled"].includes(saved)) theme = saved;
              } catch (_) {}
              document.documentElement.dataset.theme = theme;
              document.documentElement.classList.toggle("dark", theme !== "light");
            })();`,
          }}
        />
      </head>
      <body className={`${inter.className} bg-zinc-950 text-white`}>
        {children}
      </body>
    </html>
  );
}
