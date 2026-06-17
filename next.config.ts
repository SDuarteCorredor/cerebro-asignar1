import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mover el indicador de desarrollo de Next.js a la esquina inferior-derecha
  // para que no tape el badge de version del sidebar
  devIndicators: {
    position: 'bottom-right',
  },
};

export default nextConfig;
