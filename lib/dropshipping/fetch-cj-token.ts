// Usage example for CJdropshipping access token
import { getCJAccessToken } from '../lib/dropshipping/cj-auth';

export async function fetchCJToken() {
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) {
    throw new Error('CJ_API_KEY is not set in environment variables');
  }
  const token = await getCJAccessToken(apiKey);
  if (!token) {
    throw new Error('Failed to retrieve CJdropshipping access token');
  }
  return token;
}
