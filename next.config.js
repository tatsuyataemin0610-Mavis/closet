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
  // 忽略構建錯誤（僅用於客戶端套件）
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // 完全忽略客戶端專用套件在服務端的處理
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@mediapipe/pose': 'commonjs @mediapipe/pose',
        '@imgly/background-removal': 'self @imgly/background-removal',
        'sharp': 'commonjs sharp',
        'canvas': 'commonjs canvas',
      });
      
      // 完全忽略這些模組
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /@imgly\/background-removal/,
        })
      );
    }
    
    // 處理 ES Module 和 Node.js 模組
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      canvas: false,
    };
    
    // 處理 WASM 和其他特殊資源
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    
    return config;
  },
}

module.exports = nextConfig
