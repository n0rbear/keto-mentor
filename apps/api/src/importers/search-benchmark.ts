const apiUrl = process.env.API_URL; const token = process.env.ACCESS_TOKEN;
if (!apiUrl || !token) throw new Error("API_URL and ACCESS_TOKEN are required");
const queries = ["tojás", "tojas", "csirkemell", "käse", "kase", "Hähnchen", "butter", "egg", "chicken", "cheese", "avocado", "spin", "beef", "pork", "salmon", "oil", "nut", "seed", "apple", "definitely-no-such-food"];
for (const query of queries) {
  const start = performance.now(); const response = await fetch(`${apiUrl}/foods?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` } }); const body = await response.json() as { foods?: unknown[] };
  console.log(JSON.stringify({ query, status: response.status, results: body.foods?.length ?? 0, ms: Number((performance.now() - start).toFixed(1)) }));
}
