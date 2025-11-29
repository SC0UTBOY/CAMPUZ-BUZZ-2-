# Debug Join Community Issue

## The Problem

The error message shows:
```
insert or update on table "community_members" violates foreign key constraint 
"community_members_community_id_fkey"
```

This means the `community_id` being passed doesn't exist in the table that the foreign key references.

## Root Cause

There are **TWO community tables** in your database:
1. `communities` (legacy table)
2. `communities_enhanced` (new table)

The foreign key constraint could be pointing to either table, but the UI is loading from one table while trying to insert with an ID from the other.

## Migrations Show Conflicting Constraints

- Migration `20250815084801` sets: `community_members.community_id` → `communities.id`
- Migration `20250919_04` sets: `community_members.community_id` → `communities_enhanced.id`

## Current Fix Applied

Updated `communityActions.ts` to check **BOTH** tables before attempting to join.

## Next Steps to Verify

### 1. Check which table has the CSE community

Run this query in your Supabase SQL editor:

```sql
-- Check communities table
SELECT id, name FROM public.communities WHERE name = 'CSE';

-- Check communities_enhanced table  
SELECT id, name FROM public.communities_enhanced WHERE name = 'CSE';
```

### 2. Check which foreign key constraint is active

```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'community_members'
  AND kcu.column_name = 'community_id';
```

### 3. Check what the UI is loading

Open browser console and look for the fetch request to see which table it's querying.

## Temporary Solution

The updated `communityActions.ts` now:
1. First checks `communities` table for the community
2. If not found, checks `communities_enhanced` table
3. Only throws error if not found in either table

This should work regardless of which table your communities are actually in.

## Permanent Solution

You need to:
1. Decide on ONE table for communities
2. Migrate all data to that table
3. Update all code to use only that table
4. Drop or deprecate the other table

