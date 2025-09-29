import { API_CONFIG } from '../../../utils/config';

export async function GET() {
  try {
    const res = await fetch(`${API_CONFIG.getBaseUrl()}/api/categories`);
    const data = await res.json();
    return Response.json(data.data || data);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return Response.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const categoryData = await request.json();

    const res = await fetch(`${API_CONFIG.getBaseUrl()}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });

    const data = await res.json();
    return Response.json(data.data || data);
  } catch (error) {
    console.error("POST error:", error);
    return Response.json({ error: "Failed to create category" }, { status: 500 });
  }
} 