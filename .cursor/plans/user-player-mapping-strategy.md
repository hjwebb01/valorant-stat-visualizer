# User-Player Mapping Strategy

## Problem Statement
When a user authenticates via Auth0, we need to determine which of the 156 different players in the `player_stats` table they correspond to, so they can only edit their own profile picture.

## Available Data

### From Auth0 User Object
- `sub` - Unique user identifier (e.g., `auth0|1234567890`)
- `email` - User's email address
- `name` - User's full name
- `nickname` - User's nickname/username
- `picture` - User's profile picture URL

### From Database
- `player_stats.player` - Player name (text field, 156 unique values)
- No existing mapping or relationship

## Mapping Approaches

### Option 1: User Self-Selection (Recommended)
**How it works:**
- When user first authenticates, show an onboarding flow
- Display a searchable list of all 156 players
- User selects their player name
- Store mapping in `user_player_mappings` table

**Pros:**
- ✅ Most accurate (user knows their own player name)
- ✅ No guessing or matching logic needed
- ✅ Works even if names don't match exactly
- ✅ User has control

**Cons:**
- ❌ Requires user interaction
- ❌ Need to handle case where user doesn't select (optional mapping)

**Implementation:**
1. On first login, check if mapping exists
2. If no mapping, show modal/page with player search
3. User searches/selects their player name
4. Save mapping to database
5. Allow user to change mapping later in settings

### Option 2: Automatic Name Matching
**How it works:**
- Try to match Auth0 `name` or `nickname` to `player_stats.player`
- Use fuzzy matching or exact matching
- If match found, auto-create mapping
- If no match, fall back to Option 1

**Pros:**
- ✅ Seamless for users with matching names
- ✅ No user interaction needed if match found

**Cons:**
- ❌ Unreliable (names might not match)
- ❌ False positives possible
- ❌ Still need fallback for unmatched users

**Matching Strategies:**
- Exact match: `user.name === player_stats.player`
- Case-insensitive: `user.name.toLowerCase() === player_stats.player.toLowerCase()`
- Fuzzy match: Use string similarity (Levenshtein distance)
- Partial match: Check if player name contains user name or vice versa

### Option 3: Email Domain Matching
**How it works:**
- If all players are from same organization/team
- Match email domain to organization
- Still need name matching within organization

**Pros:**
- ✅ Can narrow down search space

**Cons:**
- ❌ Only works if players share domain
- ❌ Still need name matching

### Option 4: Admin Assignment
**How it works:**
- Admin manually assigns players to Auth0 users
- Admin interface to manage mappings
- Users cannot change their own mapping

**Pros:**
- ✅ Most control
- ✅ Prevents incorrect mappings

**Cons:**
- ❌ Requires admin work
- ❌ Doesn't scale well
- ❌ Users can't self-service

## Recommended Hybrid Approach

Combine **Option 1 (Self-Selection)** with **Option 2 (Auto-Matching)**:

### Flow:
1. **User authenticates** → Check for existing mapping
2. **If mapping exists** → Use it, allow editing profile picture
3. **If no mapping exists:**
   - Try automatic matching:
     - Check if `user.nickname` exactly matches any `player_stats.player`
     - Check if `user.name` exactly matches any `player_stats.player`
     - Check case-insensitive matches
   - **If match found with high confidence:**
     - Auto-create mapping
     - Show confirmation: "We matched you to [Player Name]. Is this correct?"
     - User can confirm or select different player
   - **If no match or low confidence:**
     - Show player selection interface
     - User searches/selects their player name
     - Save mapping

### Player Selection Interface Design

**Component: `PlayerClaimModal.svelte`**

Features:
- Searchable dropdown/list of all 156 players
- Search by player name (fuzzy search)
- Show player stats preview (ACS, K/D, etc.) to help identify
- "Claim this player" button
- "Skip for now" option (mapping optional, but required for profile picture editing)
- One-time onboarding or accessible via settings

**Search Implementation:**
```typescript
// Client-side search
function searchPlayers(query: string, players: Player[]): Player[] {
  const lowerQuery = query.toLowerCase();
  return players.filter(p => 
    p.player.toLowerCase().includes(lowerQuery) ||
    // Fuzzy matching could be added here
  );
}
```

## Implementation Details

### Database Schema
```sql
CREATE TABLE user_player_mappings (
  id serial PRIMARY KEY,
  auth0_user_id text NOT NULL UNIQUE, -- Auth0 'sub' claim
  player_name text NOT NULL REFERENCES player_stats(player),
  matched_method text, -- 'manual', 'auto_exact', 'auto_fuzzy', 'admin'
  matched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_player_mappings_auth0 ON user_player_mappings(auth0_user_id);
CREATE INDEX idx_user_player_mappings_player ON user_player_mappings(player_name);
```

### API Endpoints

#### GET `/api/user-player-mapping`
- Returns current user's mapped player name (if exists)
- Returns `null` if no mapping

#### POST `/api/user-player-mapping`
- Create or update user's player mapping
- Validate:
  - User is authenticated
  - Player name exists in `player_stats`
  - Player name not already claimed by another user (optional: allow multiple users?)
- Body: `{ playerName: string, matchedMethod?: string }`

#### GET `/api/players/search?q=query`
- Search players by name
- Returns list of matching players
- Used for player selection interface

### Frontend Flow

#### On Authentication
```typescript
// In auth store or page load
async function checkPlayerMapping() {
  const token = await getToken();
  if (!token) return;
  
  // Check if mapping exists
  const mapping = await fetch('/api/user-player-mapping').then(r => r.json());
  
  if (!mapping) {
    // Try auto-matching
    const autoMatch = await tryAutoMatch();
    
    if (autoMatch) {
      // Show confirmation modal
      showConfirmMappingModal(autoMatch);
    } else {
      // Show player selection modal
      showPlayerSelectionModal();
    }
  }
}
```

#### Auto-Matching Logic
```typescript
async function tryAutoMatch(): Promise<Player | null> {
  const user = get(user); // Auth0 user object
  if (!user) return null;
  
  // Get all players
  const players = await fetch('/api/players').then(r => r.json());
  
  // Try exact match on nickname
  if (user.nickname) {
    const match = players.find(p => 
      p.player.toLowerCase() === user.nickname.toLowerCase()
    );
    if (match) return match;
  }
  
  // Try exact match on name
  if (user.name) {
    const match = players.find(p => 
      p.player.toLowerCase() === user.name.toLowerCase()
    );
    if (match) return match;
  }
  
  // Try partial match
  if (user.nickname) {
    const match = players.find(p => 
      p.player.toLowerCase().includes(user.nickname.toLowerCase()) ||
      user.nickname.toLowerCase().includes(p.player.toLowerCase())
    );
    if (match) return match;
  }
  
  return null;
}
```

## Edge Cases & Considerations

### 1. Multiple Users, Same Player Name
**Scenario:** Two Auth0 users claim the same player name

**Options:**
- **A)** Allow only one user per player (enforce uniqueness)
- **B)** Allow multiple users per player (team account scenario)

**Recommendation:** Option A (one-to-one mapping) for profile picture editing. If team accounts needed, create separate feature.

### 2. Player Name Changes
**Scenario:** Player name in database changes

**Handling:**
- Keep mapping but mark as stale
- Show warning if player name no longer exists
- Allow user to re-select

### 3. User Never Selects Player
**Scenario:** User authenticates but never claims a player

**Handling:**
- Profile picture editing disabled
- Show persistent banner/button: "Claim your player to customize your profile"
- Mapping is optional but required for editing

### 4. User Wants to Change Mapping
**Scenario:** User selected wrong player or wants to switch

**Handling:**
- Settings page: "Change Player Mapping"
- Show current mapping
- Allow re-selection
- Update mapping in database

### 5. Player Doesn't Exist Yet
**Scenario:** New player added to database, user wants to claim them

**Handling:**
- Only allow claiming existing players
- New players added via admin/data import
- Users can claim after player appears in database

## UI/UX Considerations

### Onboarding Flow
1. **First Login:**
   - Welcome message: "Welcome! Let's connect your account to your player stats"
   - Show player search/selection
   - Optional: "Skip for now" button

2. **Auto-Match Found:**
   - Show: "We found a player named '[Player Name]'. Is this you?"
   - "Yes, that's me" button → Create mapping
   - "No, let me search" button → Show full selection

3. **No Match:**
   - Show: "Which player are you?"
   - Searchable list of all players
   - "Skip for now" option

### Settings Page
- Show current mapping (if exists)
- "Change Player" button
- "Claim Player" button (if no mapping)
- Show player stats preview

### Profile Picture Editing
- Only show edit button if:
  - User is authenticated
  - User has a player mapping
  - Current displayed player matches user's mapped player
- If no mapping: Show tooltip "Claim your player to edit profile picture"

## Security Considerations

1. **Mapping Validation:**
   - Server-side: Verify Auth0 token
   - Server-side: Verify player name exists
   - Server-side: Prevent duplicate mappings (if enforcing one-to-one)

2. **Player Selection:**
   - Rate limit player selection attempts
   - Log mapping changes for audit

3. **Authorization:**
   - Always verify mapping on server-side before allowing profile picture update
   - Never trust client-side mapping state

## Implementation Priority

1. ✅ **Phase 1:** Database schema + basic mapping API
2. ✅ **Phase 2:** Player selection UI component
3. ✅ **Phase 3:** Auto-matching logic
4. ✅ **Phase 4:** Onboarding flow integration
5. ✅ **Phase 5:** Settings page for changing mapping
6. ✅ **Phase 6:** Profile picture editing with authorization

## Example User Flow

```
User logs in with Auth0
  ↓
Check for existing mapping
  ↓
No mapping found
  ↓
Try auto-match: user.nickname = "JohnDoe"
  ↓
Found player "JohnDoe" in database
  ↓
Show: "We matched you to 'JohnDoe'. Is this correct?"
  ↓
User clicks "Yes, that's me"
  ↓
Mapping saved: auth0_user_id → "JohnDoe"
  ↓
User can now edit profile picture for "JohnDoe" row
```

## Alternative: Simpler Approach

If auto-matching is too complex, start with **pure self-selection**:

1. User authenticates
2. If no mapping → Show player selection modal
3. User selects their player
4. Mapping saved
5. Done

This is simpler and more reliable, just requires one extra step for users.
