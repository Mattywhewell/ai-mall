import { test, expect } from '@playwright/test';

// This test uploads a small shader file, creates a visual_layers record, and verifies it appears in the listing.
test.describe('Visual Layers API integration', () => {
  test('upload asset and create metadata', async ({ request }) => {
    // small shader source
    const shader = 'void main() { gl_FragColor = vec4(1.0); }';
    const contentBase64 = Buffer.from(shader).toString('base64');

    // Upload
    const uploadResp = await request.post('/api/visual-layers/upload', {
      data: {
        filename: `test-shader-${Date.now()}.glsl`,
        contentBase64,
        kind: 'shader',
      },
    });

    expect(uploadResp.ok()).toBeTruthy();
    const uploadJson = await uploadResp.json();
    expect(uploadJson.ok).toBeTruthy();
    const uploadedPath = uploadJson.path;
    expect(typeof uploadedPath).toBe('string');

    // Create metadata
    const slug = `test-shader-${Date.now()}`;
    const createResp = await request.post('/api/visual-layers', {
      data: {
        name: 'Test Shader Upload',
        slug,
        type: 'elemental',
        shader_file: uploadedPath,
        description: 'Integration test shader',
      },
    });

    expect(createResp.ok()).toBeTruthy();
    const createJson = await createResp.json();
    expect(createJson.ok).toBeTruthy();
    expect(createJson.data.slug).toBe(slug);

    // Verify listing includes the slug
    const listResp = await request.get('/api/visual-layers');
    expect(listResp.ok()).toBeTruthy();
    const listJson = await listResp.json();
    const found = (listJson.data || []).some((item: any) => item.slug === slug);
    expect(found).toBeTruthy();

    // Cleanup uploaded file via test-only cleanup endpoint
    const uploadedFilename = (uploadJson.path || '').split('/').pop();
    if (uploadedFilename) {
      const cleanupResp = await request.post('/api/visual-layers/cleanup', {
        data: { filename: uploadedFilename, token: process.env.TEST_CLEANUP_TOKEN || '' },
      });
      expect(cleanupResp.ok()).toBeTruthy();
      const cleanupJson = await cleanupResp.json();
      expect(cleanupJson.ok).toBeTruthy();
    }
  });
});