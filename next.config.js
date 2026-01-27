/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'vybhjcnyaxapjcqofiri.supabase.co'],
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
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // 使用 IgnorePlugin 來忽略可選的客戶端套件
    // 這些套件只在客戶端動態 import 時使用，不影響 SSR
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@imgly\/background-removal$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^onnxruntime-node$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^onnxruntime-web$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^onnxruntime-common$/,
      })
    );
    
    // 處理 Node.js 模組
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
    };
    
    // MediaPipe 在服務器端外部化
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@mediapipe/pose': 'commonjs @mediapipe/pose',
        'sharp': 'commonjs sharp',
      });
    }
    
    return config;
  },
}

module.exports = nextConfig
