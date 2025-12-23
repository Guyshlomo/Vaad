# Vaad App - MVP Checklist

## Setup & Config
- [x] Expo SDK 54 Project Initialized
- [x] Dependencies Installed (Navigation, Supabase, UI)
- [x] RTL Layout Enabled (`I18nManager`)
- [x] Theme System (Day/Night)

## Backend (Supabase)
- [x] Schema Definition (`supabase_schema.sql`)
- [x] Tables: buildings, units, profiles, invited_residents, issues, issue_updates, issue_media, announcements, user_settings, push_tokens
- [x] RLS Policies Defined
- [x] Supabase Client Initialized
- [x] Applied `supabase_schema.sql` via MCP.
- [x] Created Storage Bucket named `issue-images` (public).
- [ ] **Action Required**: Set environment variables or update `src/lib/supabase.ts`.

## Flows

### 1. Onboarding (Flow 0)
- [x] 3 Slides (Value prop)
- [x] Only shown once (AsyncStorage persistence)

### 2. Auth & Conditional Access (Flow 1)
- [x] Phone Login UI
- [x] `check_is_invited` RPC check before OTP
- [x] OTP Verification
- [x] Session persistence

### 3. Profile Setup (Flow 2)
- [x] Screen for Floor/Apartment
- [x] Auto-link to building from invitation
- [x] Save to `profiles` table

### 4. Dashboard (Flow 3)
- [x] Header with Greeting
- [x] Issues List (Tabs: Open, In Progress, Resolved)
- [x] Navigation to Details

### 5. Create Issue (Flow 4)
- [x] Form: Category, Description, Location
- [x] Image Picker & Upload
- [x] Database Insert

### 6. Issue Details (Flow 5)
- [x] View Details & Status
- [x] Timeline (History)
- [x] Admin: Change Status buttons

### 7. People Directory (Flow 6)
- [x] List residents with Role & Unit info

### 8. Announcements (Flow 7)
- [x] View List (Pinned support)
- [x] Admin: Create Announcement

### 9. Profile (Flow 8)
- [x] Theme Toggle
- [x] Logout
- [x] Link to Committee Panel (Admin only)

### 10. Committee Panel (Flow 9)
- [x] Add new resident (Invite) form

## Notifications
- [x] Token Registration logic
- [x] Database table `push_tokens`
- [ ] **Action Required**: Set up Supabase Edge Functions or Triggers to send actual push messages using the tokens.

## Running the App
1. Run `npm install`
2. Create Supabase project & apply schema.
3. Update `src/lib/supabase.ts` with your URL and Key (or use `.env`).
4. Run `npx expo start --clear`

