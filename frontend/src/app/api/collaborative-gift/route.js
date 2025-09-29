const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_2 || 'https://best-wishes-final-production-e20b.up.railway.app';

export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(`${API_BASE_URL}/api/collaborative-gift`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return Response.json(data.data || data, { status: res.status });
  } catch (error) {
    console.error('POST /api/collaborative-gift error:', error);
    return Response.json({ error: 'Failed to create collaborative gift' }, { status: 500 });
  }
} 