/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'vybhjcnyaxapjcgofiri.supabase.co'],
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 轉譯特定套件
  transpilePackages: ['@imgly/background-removal'],
  webpack: (config, { isServer, webpack }) => {
    // 在服務端完全排除客戶端專用套件
    if (isServer) {
      // 使用 NormalModuleReplacementPlugin 替換模組
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /@imgly\/background-removal/,
          require.resolve('./lib/noop.js')
        )
      );
    }
    
    // 處理 Node.js 模組
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      canvas: false,
    };
    
    return config;
  },
}

module.exports = nextConfig
