# Workflow: New API Route

Checklist for adding a new backend endpoint.

1. **Define contract**: What does it do? Request method, path, body shape, response shape.
2. **Create Zod schema** for request validation in `src/lib/schemas/`.
3. **Create route file** using `api-route-scaffolder` skill.
4. **Auth**: Ensure Supabase auth check. Use `cookies` for server client.
5. **Input validation**: Parse and validate with Zod, return 400 on failure.
6. **Business logic**:
   - Fetch relevant data from DB respecting RLS (user scoped queries).
   - For mutations, wrap in transaction if multiple writes (use `supabase.rpc()` or `supabase.from()...` with chaining, but careful with RLS).
   - If calling Edge Function (AI), use `fetch` with proper secret.
7. **Error handling**: Catch all exceptions, log (server side), return 500 `{ error: "Internal server error" }`.
8. **Rate limiting**: Add a rate‑limit check if the endpoint is resource‑intensive.
9. **Test**: Ensure it works with Postman/curl; test auth failure, validation errors, success.