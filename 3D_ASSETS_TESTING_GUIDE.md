# 🧪 3D Assets Creation System - End-to-End Testing Guide

## Prerequisites
1. ✅ Development server running: `npm run dev`
2. ✅ Database migration applied (see below)
3. ✅ Supabase credentials configured in `.env.local`

## Database Setup (REQUIRED FIRST)

### Step 1: Apply Migration
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase-3d-assets-creation-migration.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

### Step 2: Verify Tables Created
The migration creates these tables:
- `assets` - Main 3D assets table
- `user_avatars` - User avatar generation tracking
- `uploads` - File upload processing

## Testing Workflow

### Phase 1: Admin 3D Generation (Mythic Forge)

#### Test 1.1: Access Admin Assets Page
```
URL: http://localhost:3000/admin/assets
Expected: Page loads with "The Mythic Forge" section
```

#### Test 1.2: Upload Image for 3D Generation
1. In the Mythic Forge section, click the upload area
2. Select a PNG/JPG image file (max 10MB)
3. Enter a name and description
4. Click "Generate 3D Model"
5. Expected: Progress indicator shows mythic messages
6. Expected: After ~30-60 seconds, 3D model appears in assets grid

#### Test 1.3: View Generated Asset
1. Click the eye icon on a generated asset
2. Expected: 3D model viewer opens with the generated model

#### Test 1.4: Scene Editor Integration
1. Click the edit icon on a generated asset
2. Expected: Scene editor modal opens with 3D model loaded

### Phase 2: User Avatar Generation (Arrival Ritual)

#### Test 2.1: Access Avatar Page
```
URL: http://localhost:3000/profile/avatar
Expected: Page loads with "Your Reflection" header and upload component
```

#### Test 2.2: Upload Selfie
1. Click "Choose Selfie" button
2. Select a clear selfie photo
3. Expected: Image preview shows with mythic styling
4. Click "Generate 3D Avatar"
5. Expected: Progress shows "The city shapes your reflection..."

#### Test 2.3: Avatar Generation Complete
1. Wait for generation to complete (~30-60 seconds)
2. Expected: Avatar status shows "completed"
3. Expected: 3D avatar viewer appears

#### Test 2.4: View Avatar
1. Click "View Full Size" button
2. Expected: Full-screen 3D avatar viewer opens

### Phase 3: API Endpoint Testing

#### Test 3.1: Admin Assets API
```bash
curl -X GET "http://localhost:3000/api/admin/assets"
Expected: {"assets": []} or array of assets
```

#### Test 3.2: User Avatar API
```bash
curl -X GET "http://localhost:3000/api/user/avatar"
Expected: Avatar status object
```

#### Test 3.3: Image Upload API (Admin)
```bash
curl -X POST "http://localhost:3000/api/admin/upload-image" \
  -F "image=@test-image.jpg" \
  -F "name=Test Asset" \
  -F "description=Test mythic asset"
Expected: Success response with asset data
```

#### Test 3.4: Selfie Upload API (User)
```bash
curl -X POST "http://localhost:3000/api/user/upload-selfie" \
  -F "selfie=@selfie.jpg"
Expected: Success response with avatar generation started
```

## Expected Behaviors

### Mythic UI Elements
- ✅ Seven Mythic Tones color scheme (#ffd700, #c0c0c0, etc.)
- ✅ "Mythos Sans" font family
- ✅ Gentle, magical messaging
- ✅ Progress indicators with city-themed messages

### Error Handling
- ✅ File size validation (10MB limit)
- ✅ Image format validation
- ✅ Network error recovery
- ✅ Graceful degradation

### Performance
- ✅ Async processing for 3D generation
- ✅ Progress polling for status updates
- ✅ File upload with progress indication

## Troubleshooting

### Issue: "Table doesn't exist"
**Solution**: Apply the database migration in Supabase SQL Editor

### Issue: "API endpoint not found"
**Solution**: Check that the dev server is running on port 3000

### Issue: "Upload fails"
**Solution**: Check Supabase storage bucket permissions and API keys

### Issue: "3D generation fails"
**Solution**: Check Tripo3D API key and network connectivity

## Success Criteria

✅ **Admin Workflow**: Can upload image → generates 3D model → appears in assets grid
✅ **User Workflow**: Can upload selfie → generates avatar → displays in profile
✅ **API Endpoints**: All endpoints respond correctly
✅ **UI/UX**: Mythic design elements present and functional
✅ **Error Handling**: Graceful failure recovery
✅ **Performance**: Reasonable generation times (< 2 minutes)

---

## Quick Test Commands

```bash
# Check server health
curl http://localhost:3000/api/health

# Test admin assets API
curl http://localhost:3000/api/admin/assets

# Test user avatar API
curl http://localhost:3000/api/user/avatar
```

🎉 **Once all tests pass, the 3D Assets Creation System is fully operational!**