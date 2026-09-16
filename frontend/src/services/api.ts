import type {
  TokenResponse,
  User,
  FarmerDashboardSummary,
  ScanSummary,
  CropScanResult,
  ApiError,
} from '../types/api';

// In dev, Vite proxies /api/* → http://localhost:8000. In production, same-origin is assumed.
const API_BASE_URL = '/api/v1';

export function getStoredToken(): string | null {
  return localStorage.getItem('agri_auth_token');
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('agri_auth_token', token);
  } else {
    localStorage.removeItem('agri_auth_token');
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiError = {
      error_code: 'HTTP_ERROR',
      message: `Request failed with status ${response.status}`,
    };
    try {
      const json = await response.json();
      if (json.error_code && json.message) {
        errorData = json;
      } else if (json.detail) {
        errorData = {
          error_code: typeof json.detail === 'object' ? json.detail.error_code || 'ERROR' : 'ERROR',
          message: typeof json.detail === 'object' ? json.detail.message || 'Error occurred' : json.detail,
        };
      }
    } catch (e) {
      // fallback
    }
    throw errorData;
  }
  return response.json();
}

function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginUser(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse<TokenResponse>(res);
  setStoredToken(data.access_token);
  return data;
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  language = 'en'
): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, language }),
  });
  const data = await handleResponse<TokenResponse>(res);
  setStoredToken(data.access_token);
  return data;
}

export async function getMe(): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<User>(res);
}

export async function getDashboardSummary(): Promise<FarmerDashboardSummary> {
  const res = await fetch(`${API_BASE_URL}/dashboard/summary`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<FarmerDashboardSummary>(res);
}

export async function listScans(
  page = 1,
  pageSize = 20,
  status?: string,
  crop?: string
): Promise<ScanSummary[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (status) params.append('status', status);
  if (crop) params.append('crop', crop);

  const res = await fetch(`${API_BASE_URL}/scans?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<ScanSummary[]>(res);
}

export async function getScanDetail(scanId: string): Promise<CropScanResult> {
  const res = await fetch(`${API_BASE_URL}/scans/${scanId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<CropScanResult>(res);
}

export async function uploadScan(
  imageFile: File,
  location?: {
    country?: string;
    state?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
  }
): Promise<CropScanResult> {
  const formData = new FormData();
  formData.append('image', imageFile);

  if (location?.country) formData.append('country', location.country);
  if (location?.state) formData.append('state', location.state);
  if (location?.district) formData.append('district', location.district);
  if (location?.latitude !== undefined) formData.append('latitude', location.latitude.toString());
  if (location?.longitude !== undefined) formData.append('longitude', location.longitude.toString());

  const res = await fetch(`${API_BASE_URL}/scans`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  return handleResponse<CropScanResult>(res);
}
