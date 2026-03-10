import axios, { type AxiosError } from 'axios';

export function createApiInstance(siteUrl: string) {
  const baseURL = siteUrl.replace(/\/?$/, '/');
  return axios.create({ baseURL });
}

interface ApiErrorResponse {
  message?: string;
}

export function extractErrorMessage(error: unknown, fallback = 'An unknown error occurred'): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.data) {
      return JSON.stringify(axiosError.response.data);
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
