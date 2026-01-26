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
  webpack: (config, { isServer }) => {
    // MediaPipe 和 background-removal 套件只在客戶端使用
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@mediapipe/pose': 'commonjs @mediapipe/pose',
        '@imgly/background-removal': 'commonjs @imgly/background-removal',
        'onnxruntime-node': 'commonjs onnxruntime-node',
        'onnxruntime-web': 'commonjs onnxruntime-web',
        'onnxruntime-common': 'commonjs onnxruntime-common',
        'sharp': 'commonjs sharp',
      });
    }
    
    // 處理 Node.js 模組和客戶端專用模組
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      '@imgly/background-removal': false,
      'onnxruntime-node': false,
      'onnxruntime-web': false,
    };
    
    return config;
  },
}

module.exports = nextConfig
