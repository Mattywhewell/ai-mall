# Shaders & Visual Layers — Quick Start 🚀

This folder contains the canonical `TAXONOMY.md` reference that defines naming conventions, metadata, and authoring guidelines for shaders, LUTs, and visual layer assets used across the Aiverse.

Quick links:
- TAXONOMY: `docs/shaders/TAXONOMY.md` — canonical taxonomy, parameter schema, GLSL guidance, and contributor checklist.

How to contribute a layer (short):
1. Follow the slug format and metadata schema in `TAXONOMY.md`.
2. Add shader source to `/assets/shaders/` and a small preview to `/public/shader-previews/`.
3. Add or update `visual_layers` metadata (we will add DB migrations and API endpoints in follow-ups).
4. Open a PR with: description, preview screenshots, parameter list, and performance notes.

Local testing tips:
- Use WebGL-compatible browsers (Chrome/Edge) with hardware acceleration enabled for authoring and testing.
- For quick previews, a simple local Three.js/fragment shader runner is sufficient; we plan to add a PoC demo page under `app/visual-layers/demo`.

Accessibility & performance:
- Provide a reduced-motion param and a CSS fallback for non-WebGL environments.
- Keep shaders simple (avoid large loops) and document expected frame cost.

**Upload & cleanup tokens (security)** 🔐
- Purpose: prevent unauthorised uploads and allow CI tests to clean up test artifacts.
- Env variables: **`UPLOAD_SECRET_TOKEN`** (production/staging upload guard) and **`TEST_CLEANUP_TOKEN`** (CI-only token used by tests).
- How to send tokens:
  - Upload endpoint: include header `x-upload-token` or body field `uploadToken` when POSTing to `/api/visual-layers/upload`.
  - Cleanup endpoint: include header `x-cleanup-token` or body field `token` when POSTing to `/api/visual-layers/cleanup` (or supply a `storageKey` to delete from storage).
- Recommendations for production:
  - Store tokens as repository or environment secrets (do not hardcode in code).
  - Prefer **per-user signed upload URLs** or role-based checks (Supabase Auth) over shared tokens for higher security.
  - Use a dedicated Supabase storage bucket (set via `SUPABASE_STORAGE_BUCKET`) and decide on ACLs: *public* for thumbnails/previews; *private + signed URLs* for raw shader/LUT sources unless vetted.
  - Rotate tokens periodically and restrict scope where possible.

Examples (curl)

- Upload a shader using header auth:

```bash
curl -X POST "http://localhost:3000/api/visual-layers/upload" \
  -H "Content-Type: application/json" \
  -H "x-upload-token: $UPLOAD_SECRET_TOKEN" \
  -d '{"filename":"test-shader.glsl","contentBase64":"<BASE64>","kind":"shader"}'
```

- Upload a shader using body token (alternate):

```bash
curl -X POST "http://localhost:3000/api/visual-layers/upload" \
  -H "Content-Type: application/json" \
  -d '{"filename":"test-shader.glsl","contentBase64":"<BASE64>","kind":"shader","uploadToken":"'$UPLOAD_SECRET_TOKEN'"}'
```

- Cleanup by filename (local fallback):

```bash
curl -X POST "http://localhost:3000/api/visual-layers/cleanup" \
  -H "Content-Type: application/json" \
  -H "x-cleanup-token: $TEST_CLEANUP_TOKEN" \
  -d '{"filename":"test-shader.glsl"}'
```

- Cleanup by storage key (Supabase storage):

```bash
curl -X POST "http://localhost:3000/api/visual-layers/cleanup" \
  -H "Content-Type: application/json" \
  -d '{"storageKey":"shaders/1670000000000-test-shader.glsl","token":"'$UPLOAD_SECRET_TOKEN'"}'
```

Thanks — follow `CONTRIBUTING.md` for PR and review guidance. If you want, I can also scaffold the PoC demo and an e2e test next.