// Test environment variables
console.log('=== Environment Variables Test ===');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('NEXT_PUBLIC_API_URL_2:', process.env.NEXT_PUBLIC_API_URL_2);
console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET');

export async function GET() {
  return Response.json({
    message: 'Environment Variables Debug',
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
      NEXT_PUBLIC_API_URL_2: process.env.NEXT_PUBLIC_API_URL_2 || 'NOT SET',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET'
    },
    fallback_urls: {
      api_url: process.env.NEXT_PUBLIC_API_URL || 'https://best-wishes-final-production-e20b.up.railway.app/api',
      base_url: process.env.NEXT_PUBLIC_API_URL_2 || 'https://best-wishes-final-production-e20b.up.railway.app'
    }
  });
}