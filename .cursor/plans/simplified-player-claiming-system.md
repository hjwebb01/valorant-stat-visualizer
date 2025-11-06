# Simplified Player Claiming System (No Auth0)

## Overview
Allow users to claim a player on the leaderboard without authentication. Use a simple claim code/password system with admin dashboard for oversight and fixing issues.

## Architecture

### Core Concept
- Users claim a player by providing a **claim code** (like a password)
- Each player can have a claim code set (initially empty/unclaimed)
- Once claimed, only someone with the claim code can edit that player's profile picture
- Admin dashboard allows overriding claims and managing all players

## Database Schema

### 1. Player Claims Table
```sql
CREATE TABLE player_claims (
  id serial PRIMARY KEY,
  player_name text NOT NULL UNIQUE REFERENCES player_stats(player),
  claim_code_hash text NOT NULL, -- Hashed claim code (bcrypt/argon2)
  claimed_by_email text, -- Optional: email of claimer
  claimed_at timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now(),
  is_locked boolean DEFAULT false, -- Admin can lock claims
  admin_notes text -- Admin notes about the claim
);

CREATE INDEX idx_player_claims_player ON player_claims(player_name);
CREATE INDEX idx_player_claims_email ON player_claims(claimed_by_email);
```

### 2. Profile Pictures Column
```sql
ALTER TABLE player_stats 
ADD COLUMN profile_picture_url text;

CREATE INDEX idx_player_stats_profile_picture ON player_stats(profile_picture_url) WHERE profile_picture_url IS NOT NULL;
```

### 3. Admin Users Table (Simple)
```sql
CREATE TABLE admin_users (
  id serial PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL, -- Hashed admin password
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Simple admin table, can expand later
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', '$2b$10$...'); -- Set via environment or migration script
```

### 4. Activity Log (Optional but Recommended)
```sql
CREATE TABLE claim_activity_log (
  id serial PRIMARY KEY,
  player_name text NOT NULL,
  action text NOT NULL, -- 'claimed', 'updated_picture', 'admin_override', 'unclaimed'
  ip_address text,
  user_agent text,
  admin_username text, -- If admin action
  details jsonb, -- Additional context
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_claim_activity_player ON claim_activity_log(player_name);
CREATE INDEX idx_claim_activity_created ON claim_activity_log(created_at DESC);
```

## User Flow

### Claiming a Player

1. **User visits leaderboard** → Sees player they want to claim
2. **Clicks "Claim this player"** → Modal opens
3. **Enters claim code** (e.g., "MySecretCode123")
4. **Optionally enters email** (for recovery/admin contact)
5. **Submits** → System:
   - Checks if player already claimed
   - If unclaimed: Creates claim with hashed code
   - If claimed: Verifies code matches
   - If code matches: Allows editing
   - If code wrong: Shows error

### Editing Profile Picture

1. **User clicks edit on their claimed player**
2. **Enters claim code** (or uses stored session)
3. **Uploads/changes profile picture**
4. **Saves** → Updates `player_stats.profile_picture_url`

### Session Management

- Store claim session in **localStorage** or **cookies**
- Key: `claimed_players` → `{ playerName: string, claimCode: string (encrypted?), expiresAt: timestamp }`
- Or simpler: Just require code entry each time (more secure, less convenient)

## API Endpoints

### Public Endpoints

#### POST `/api/player/claim`
**Body:**
```typescript
{
  playerName: string;
  claimCode: string;
  email?: string; // Optional
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  sessionToken?: string; // For maintaining claim session
}
```

**Logic:**
- If player not claimed: Create new claim
- If player claimed: Verify code matches
- Hash and store claim code
- Log activity
- Return success/error

#### POST `/api/player/verify-claim`
**Body:**
```typescript
{
  playerName: string;
  claimCode: string;
}
```

**Response:**
```typescript
{
  verified: boolean;
  sessionToken?: string; // Temporary token for this session
}
```

#### POST `/api/player/update-picture`
**Body:**
```typescript
{
  playerName: string;
  claimCode: string;
  profilePictureUrl: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Logic:**
- Verify claim code
- Update `player_stats.profile_picture_url`
- Log activity

#### GET `/api/player/claim-status/:playerName`
**Response:**
```typescript
{
  isClaimed: boolean;
  canEdit: boolean; // If current session has access
}
```

### Admin Endpoints (Protected)

#### POST `/api/admin/login`
**Body:**
```typescript
{
  username: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  adminToken?: string; // JWT or session token
}
```

#### GET `/api/admin/claims`
**Query params:** `?page=1&limit=50&search=playerName`
**Response:**
```typescript
{
  claims: Array<{
    playerName: string;
    claimedAt: string;
    claimedByEmail?: string;
    isLocked: boolean;
    lastUpdated: string;
    adminNotes?: string;
  }>;
  total: number;
}
```

#### POST `/api/admin/claims/:playerName/unclaim`
**Body:** (none, uses admin auth)
**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Logic:**
- Remove claim from database
- Clear profile picture (optional)
- Log admin action

#### POST `/api/admin/claims/:playerName/reset-code`
**Body:**
```typescript
{
  newClaimCode: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  newClaimCode: string; // Return for admin to share
}
```

**Logic:**
- Update claim code hash
- Log admin action

#### POST `/api/admin/claims/:playerName/lock`
**Body:**
```typescript
{
  locked: boolean;
  reason?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

#### POST `/api/admin/claims/:playerName/update-picture`
**Body:**
```typescript
{
  profilePictureUrl: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Logic:**
- Admin can override and update any player's picture
- Log admin action

#### GET `/api/admin/activity-log`
**Query params:** `?playerName=xxx&limit=100`
**Response:**
```typescript
{
  activities: Array<{
    id: number;
    playerName: string;
    action: string;
    ipAddress?: string;
    adminUsername?: string;
    details: object;
    createdAt: string;
  }>;
}
```

## Security Measures

### 1. Rate Limiting
- Limit claim attempts per IP: Max 5 attempts per hour per player
- Limit profile picture updates: Max 10 per hour per player
- Use IP-based rate limiting (can be bypassed with VPN, but helps)

### 2. Claim Code Requirements
- Minimum length: 8 characters
- Require mix of letters/numbers (optional)
- Hash with bcrypt (cost factor 10-12)

### 3. Input Validation
- Validate player name exists in database
- Validate profile picture URL format
- Sanitize all inputs
- Prevent SQL injection (use parameterized queries)

### 4. Session Security
- If using sessions: Use secure, httpOnly cookies
- Set expiration: 7-30 days
- Encrypt claim codes in storage (if storing)

### 5. Admin Security
- Strong password requirements
- Rate limit admin login attempts
- Use JWT or secure session tokens
- Log all admin actions

### 6. Abuse Prevention
- Track IP addresses for claims
- Flag suspicious patterns (many claims from same IP)
- Admin dashboard shows claim statistics
- Allow admin to ban IPs (optional)

## Frontend Components

### 1. Claim Player Modal
**File:** `src/lib/components/ClaimPlayerModal.svelte`

**Features:**
- Input: Claim code
- Input: Email (optional)
- "Claim Player" button
- Error messages
- Success confirmation

### 2. Edit Profile Picture Modal
**File:** `src/lib/components/EditProfilePictureModal.svelte`

**Features:**
- Claim code input (if not in session)
- File upload or URL input
- Image preview
- "Update Picture" button
- Success/error feedback

### 3. Player Claim Status Badge
**File:** `src/lib/components/PlayerClaimBadge.svelte`

**Features:**
- Shows "Claimed" or "Unclaimed" badge
- If claimed by current session: Shows "Edit" button
- If unclaimed: Shows "Claim" button

### 4. Admin Dashboard
**File:** `src/routes/admin/+page.svelte`

**Sections:**
- **Login** (if not authenticated)
- **Claims Overview** - List all claims with search/filter
- **Player Management** - View/edit individual players
- **Activity Log** - View recent activity
- **Statistics** - Claim stats, abuse detection

**Features:**
- Search players
- Filter by claimed/unclaimed
- Bulk actions (unclaim multiple)
- Export claims list
- View activity history

## Implementation Steps

### Phase 1: Database Setup
1. ✅ Create migration for `player_claims` table
2. ✅ Add `profile_picture_url` to `player_stats`
3. ✅ Create `admin_users` table
4. ✅ Create `claim_activity_log` table (optional)

### Phase 2: Backend API
1. ✅ Implement claim endpoints (claim, verify, update-picture)
2. ✅ Implement admin endpoints (login, manage claims)
3. ✅ Add rate limiting middleware
4. ✅ Add activity logging

### Phase 3: Frontend - User Features
1. ✅ Create claim modal component
2. ✅ Create edit picture modal component
3. ✅ Add claim/edit buttons to leaderboard
4. ✅ Add session management (localStorage)

### Phase 4: Frontend - Admin Dashboard
1. ✅ Create admin login page
2. ✅ Create claims management page
3. ✅ Create activity log viewer
4. ✅ Add admin navigation/routing

### Phase 5: Security & Polish
1. ✅ Add rate limiting
2. ✅ Add input validation
3. ✅ Add error handling
4. ✅ Add loading states
5. ✅ Test abuse scenarios

## Example User Flow

### First-Time Claim
```
User sees player "JohnDoe" on leaderboard
  ↓
Clicks "Claim this player"
  ↓
Modal opens: "Enter a claim code (min 8 characters)"
  ↓
User enters: "MySecret123"
  ↓
Optionally enters email: "john@example.com"
  ↓
Clicks "Claim"
  ↓
Backend: Hashes code, creates claim record
  ↓
Success: "Player claimed! You can now edit your profile picture."
  ↓
"Edit Profile Picture" button appears
```

### Editing Profile Picture
```
User clicks "Edit Profile Picture" on their claimed player
  ↓
Modal opens: "Enter your claim code"
  ↓
User enters: "MySecret123"
  ↓
Clicks "Verify"
  ↓
Backend: Verifies code matches
  ↓
Shows image upload/URL input
  ↓
User uploads image or enters URL
  ↓
Clicks "Update"
  ↓
Backend: Updates player_stats.profile_picture_url
  ↓
Success: Profile picture updated!
```

### Admin Fixing Mistake
```
Admin logs into dashboard
  ↓
Searches for player "JohnDoe"
  ↓
Sees claim details: Claimed by email "john@example.com" on 2024-01-15
  ↓
Clicks "Unclaim Player"
  ↓
Confirms: "Are you sure? This will remove the claim."
  ↓
Backend: Removes claim, logs admin action
  ↓
Success: Player unclaimed. User will need to reclaim with correct code.
```

## Alternative: Simpler Claim Code System

If even claim codes are too complex, consider:

### Option A: Email-Only Claiming
- User enters email
- System sends verification link
- Clicking link claims the player
- No password needed, but requires email access

### Option B: One-Time Codes
- Admin generates one-time codes per player
- User enters code to claim
- Code becomes invalid after use
- Admin distributes codes to players

### Option C: Open Claiming with Admin Oversight
- Anyone can claim any player (no code)
- Rate limiting prevents spam
- Admin reviews and approves/rejects claims
- Email notification to admin on new claims

**Recommendation:** Stick with claim codes - simple, secure enough for small scale, gives users control.

## Environment Variables

```env
# Admin credentials (or use database)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=... # Set via script

# Rate limiting
RATE_LIMIT_CLAIMS_PER_HOUR=5
RATE_LIMIT_UPDATES_PER_HOUR=10

# Session
SESSION_SECRET=... # For admin sessions
SESSION_EXPIRY_DAYS=30

# Optional: Email service for notifications
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
```

## Migration Strategy

1. **Deploy database migrations** (add tables, columns)
2. **Deploy backend API** (endpoints, logic)
3. **Deploy frontend components** (modals, buttons)
4. **Deploy admin dashboard** (admin routes)
5. **Test thoroughly** (claiming, editing, admin actions)
6. **Monitor** (watch activity log for issues)

## Future Enhancements

1. **Email notifications** - Notify admin on claims
2. **Claim expiration** - Auto-unclaim after inactivity
3. **Multiple admins** - Admin roles/permissions
4. **Bulk operations** - Admin can bulk unclaim/reset
5. **Analytics** - Claim statistics, popular players
6. **Player verification** - Require proof of identity (optional)
