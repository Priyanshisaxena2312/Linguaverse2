import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-tabs',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dropdown-menu',
    ],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Ensure heavy server-only packages are not parsed/bundled by Webpack
  serverExternalPackages: [
    '@genkit-ai/google-genai',
    '@genkit-ai/googleai',
    '@genkit-ai/next',
    '@genkit-ai/core',
    '@genkit-ai/flow',
    '@google/genai',
    'genkit',
    'handlebars',
    'dotprompt',
    'isomorphic-dompurify',
    'jsdom',
    'html-encoding-sniffer',
    'encoding',
    '@exodus/bytes',
    'crypto-js',
    'wav',
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'encoding': false,
      '@exodus/bytes/encoding-lite': false,
      '@exodus/bytes': false,
    };
    return config;
  },
};

export default nextConfig;
