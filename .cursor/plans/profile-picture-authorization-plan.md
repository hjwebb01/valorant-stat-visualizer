# Plan: Restrict Profile Picture Changes to Authenticated Users

## Overview
Allow authenticated map users to change profile pictures only for their respective statistical row in the `player_stats` table.

## Current State Analysis

### Database Schema
- `player_stats` table exists with player statistics
- No `profile_picture_url` column currently exists
- No mapping between Auth0 users and player names
- RLS policies exist but only allow service_role writes

### Authentication
- Auth0 integration exists (`@auth0/auth0-spa-js`)
- User authentication state managed in `$lib/stores/auth.ts`
- User object contains: `id`, `name`, `email`, `picture` (from Auth0)

### Frontend
- Profile pictures currently hardcoded to `fatpig.jpg`
- Displayed in leaderboard and main page
- No UI for uploading/changing profile pictures

## Implementation Plan

### Phase 1: Database Schema Changes

#### 1.1 Add Profile Picture Column
**Migration: `0004_add_profile_pictures.sql`**
- Add `profile_picture_url` column to `player_stats` table (nullable text)
- Default to NULL (existing rows keep NULL)
- Add index on `profile_picture_url` for performance

#### 1.2 Create User-Player Mapping Table
**Migration: `0005_user_player_mappings.sql`**
- Create `user_player_mappings` table:
  - `id` (serial primary key)
  - `auth0_user_id` (text, unique, indexed) - Auth0 user identifier
  - `player_name` (text, references player_stats.player) - Maps to player_stats.player
  - `created_at` (timestamptz)
  - Unique constraint on `auth0_user_id`
  - Index on `player_name` for lookups

**Rationale:** 
- Separates authentication concerns from player data
- Allows one-to-one mapping: one Auth0 user → one player name
- Enables future expansion (e.g., multiple players per user)

#### 1.3 Update RLS Policies
**Migration: `0006_profile_picture_rls.sql`**
- Enable RLS on `user_player_mappings` table
- Allow authenticated users to:
  - **SELECT**: Read their own mapping (where `auth0_user_id = auth.uid()`)
  - **INSERT**: Create their own mapping (with check: `auth0_user_id = auth.uid()`)
  - **UPDATE**: Update their own mapping (using: `auth0_user_id = auth.uid()`)
- Allow service_role full access for admin operations

- Update `player_stats` RLS:
  - Keep existing read policies (public read)
  - Add new policy for authenticated users to **UPDATE** `profile_picture_url`:
    - Using: `EXISTS (SELECT 1 FROM user_player_mappings WHERE auth0_user_id = auth.uid() AND player_name = player_stats.player)`
    - With check: Same condition
  - Keep service_role full access

**Note:** Since Auth0 is used (not Supabase Auth), we'll need to:
- Use a custom JWT claim or store Auth0 user ID in Supabase
- OR use a server-side API endpoint that validates Auth0 tokens

### Phase 2: Backend API Endpoints

#### 2.1 Create Profile Picture Update Endpoint
**File: `src/routes/api/profile-picture/+server.ts`**

**POST `/api/profile-picture`**
- **Request Body:**
  ```typescript
  {
    playerName: string;
    profilePictureUrl: string; // URL to uploaded image
  }
  ```
- **Authentication:** Validate Auth0 JWT token
- **Authorization:** 
  - Verify user is authenticated
  - Verify `auth0_user_id` maps to `playerName` in `user_player_mappings`
  - If mapping doesn't exist, create it (first-time setup)
- **Action:** Update `player_stats.profile_picture_url` WHERE `player = playerName`
- **Response:** Success/error status

**Alternative:** Use Supabase Storage for image uploads
- **POST `/api/profile-picture/upload`** - Upload image, return URL
- **POST `/api/profile-picture`** - Update database with URL

#### 2.2 Create User-Player Mapping Endpoint (Optional)
**File: `src/routes/api/user-player-mapping/+server.ts`**

**POST `/api/user-player-mapping`**
- Allow users to claim/update their player name mapping
- Validate player name exists in `player_stats`
- Create or update mapping

**GET `/api/user-player-mapping`**
- Return current user's mapped player name

### Phase 3: Frontend Changes

#### 3.1 Update Schema Types
**File: `src/lib/server/db/schema.ts`**
- Add `profilePictureUrl` field to `player_stats` schema
- Add `user_player_mappings` table schema

#### 3.2 Create Profile Picture Component
**File: `src/lib/components/PlayerProfilePicture.svelte`**
- Props: `playerName`, `profilePictureUrl`, `isEditable` (boolean)
- Display profile picture (fallback to default if null)
- If `isEditable` and user is authenticated:
  - Show edit button/icon
  - On click: Open upload modal/dialog
  - Handle image upload
  - Call API to update profile picture

#### 3.3 Update Pages to Use Dynamic Profile Pictures
**Files:**
- `src/routes/+page.svelte`
- `src/routes/leaderboard/+page.svelte`

**Changes:**
- Fetch `profile_picture_url` from database (via server load)
- Pass to `PlayerProfilePicture` component
- Determine `isEditable` based on:
  - User is authenticated
  - Current user's mapped player name matches displayed player

#### 3.4 Create Upload Modal Component
**File: `src/lib/components/ProfilePictureUploadModal.svelte`**
- File input for image selection
- Image preview
- Upload button
- Handle upload to storage (Supabase Storage or external)
- Call update API endpoint
- Show loading/error states

### Phase 4: Authentication Integration

#### 4.1 Auth0 Token Validation
**File: `src/lib/server/auth.ts`** (new)
- Function to validate Auth0 JWT tokens
- Extract `sub` (user ID) from token
- Use Auth0 Management API or JWT verification

#### 4.2 Server-Side Auth Helper
**File: `src/lib/server/auth-helpers.ts`** (new)
- `getAuthenticatedUser(request)` - Extract and validate Auth0 user from request
- `getUserPlayerMapping(auth0UserId)` - Get player name for user
- `canEditPlayerProfile(auth0UserId, playerName)` - Check authorization

### Phase 5: Storage Solution

#### Option A: Supabase Storage
- Create `profile-pictures` bucket
- Public read access
- Authenticated write access (with RLS)
- Store URLs in database

#### Option B: External Storage (S3, Cloudinary, etc.)
- Upload via API endpoint
- Store URLs in database
- Handle CORS if needed

**Recommendation:** Use Supabase Storage for simplicity and integration

## Security Considerations

1. **Authorization Checks:**
   - Always verify Auth0 token on server-side
   - Never trust client-side authentication state alone
   - Validate user-player mapping before allowing updates

2. **Image Validation:**
   - Validate file type (only images: jpg, png, webp)
   - Validate file size (e.g., max 5MB)
   - Sanitize file names
   - Consider image processing/resizing

3. **Rate Limiting:**
   - Limit profile picture updates per user
   - Prevent abuse/spam

4. **RLS Policies:**
   - Ensure RLS policies are correctly configured
   - Test edge cases (user trying to update other's picture)

## Testing Plan

1. **Unit Tests:**
   - Auth helper functions
   - Authorization logic
   - API endpoint handlers

2. **Integration Tests:**
   - End-to-end profile picture update flow
   - Authorization checks
   - Error handling

3. **Manual Testing:**
   - Authenticated user can update own profile picture
   - Authenticated user cannot update other's profile picture
   - Unauthenticated user cannot update any profile picture
   - Profile pictures display correctly
   - Fallback to default image works

## Migration Strategy

1. **Backward Compatibility:**
   - `profile_picture_url` is nullable
   - Existing code continues to work with default image
   - Gradual rollout possible

2. **Data Migration:**
   - No existing profile pictures to migrate
   - Users can set their profile pictures after deployment

3. **Rollout:**
   - Deploy database migrations first
   - Deploy backend API endpoints
   - Deploy frontend changes
   - Monitor for errors

## Future Enhancements

1. **Image Optimization:**
   - Automatic resizing/compression
   - Multiple sizes (thumbnail, medium, large)
   - WebP format support

2. **Profile Management:**
   - Allow users to change their player name mapping
   - Admin interface for managing mappings
   - Bulk operations

3. **Additional Profile Fields:**
   - Bio/description
   - Social links
   - Custom themes

## Implementation Order

1. ✅ Database migrations (schema + RLS)
2. ✅ Backend API endpoints
3. ✅ Auth helpers and token validation
4. ✅ Frontend components
5. ✅ Update existing pages
6. ✅ Testing
7. ✅ Deployment

## Notes

- Auth0 uses `sub` claim as unique user identifier
- Consider using Supabase Auth instead of Auth0 for better RLS integration (future consideration)
- Profile picture URLs can be external (e.g., from Auth0 profile) or stored in Supabase Storage
- The mapping table allows flexibility for future features (e.g., team management)
