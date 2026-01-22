export function parseProductsQuery(url: URL) {
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
  const is_activeParam = url.searchParams.get("is_active");

  const is_active =
    is_activeParam === null ? undefined : is_activeParam === "true" ? true : is_activeParam === "false" ? false : undefined;

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? Math.min(100, pageSize) : 20,
    is_active
  };
}

