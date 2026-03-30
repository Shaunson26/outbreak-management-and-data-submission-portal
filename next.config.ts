import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {

    // For general file tracing (affects "next build")
  outputFileTracingRoot: path.join(__dirname, '../../'), // Adjust the path as necessary for your structure

  // Specifically for Turbopack (affects "next dev --turbo" or "next build --turbo")
  turbopack: {
    root: path.join(__dirname, '../../'), // Adjust the path as necessary
  },
  
  reactCompiler: true,
};

export default nextConfig;
