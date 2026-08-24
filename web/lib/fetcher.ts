export async function fetcher<T = any>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || "An error occurred while fetching data.");
    (error as any).status = res.status;
    (error as any).info = errorData;
    throw error;
  }
  return res.json();
}
