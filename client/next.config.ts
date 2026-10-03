import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL doit etre configuree dans les variables Vercel.",
  );
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Fait transiter les appels API par le domaine Vercel au lieu d'attaquer
  // Render directement. Sans ça, le Set-Cookie du backend appartient au
  // domaine onrender.com : le navigateur le stocke, mais ni proxy.ts ni
  // getSession() ne peuvent le lire, puisqu'ils tournent sur vercel.app.
  // Effet de bord bienvenu : tout devient same-origin, donc plus de CORS.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
