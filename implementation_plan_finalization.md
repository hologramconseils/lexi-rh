# Implementation Plan - Finalizing Resource Isolation

This plan addresses the current issues (including potential 500 errors) following the multi-tenant migration, ensuring every user and document is correctly isolated into a workspace.

## User Review Required

> [!IMPORTANT]
> - **Registration**: New "Employer" accounts will now fail if I don't fix the missing import in `auth.py`.
> - **Legacy Data**: I will perform a final data cleanup to ensure no documents are "orphaned" (without a workspace) which would make them invisible to everyone except admins.
> - **Admin Visibility**: Admins will continue to have "Super-View" (access to all documents) while normal users will only see their own workspace.

## Proposed Changes

### Backend / Core Fixes

#### [MODIFY] [auth.py](file:///Users/hologramconseils/.gemini/antigravity/scratch/lexi-rh/backend/app/routes/auth.py)
 - Add `from app.models.workspace import Workspace` to resolve the `NameError` in the `register` route.
 - Update `register`: Ensure default workspace name is user-friendly if not provided.

#### [MODIFY] [documents.py](file:///Users/hologramconseils/.gemini/antigravity/scratch/lexi-rh/backend/app/routes/documents.py)
 - Add extra safety checks to ensure `current_user.workspace_id` is always valid before database operations.

### Data Management & Migration

#### [NEW] [migrate_final.py](file:///Users/hologramconseils/.gemini/antigravity/scratch/lexi-rh/backend/migrate_final.py)
 - Script to:
   1. Create missing workspaces for existing users.
   2. Link all existing `documents` to the uploader's workspace.
   3. Index any documents that might have been skipped during previous partial migrations.

## Open Questions

> [!QUESTION]
> - Should I create a **System Workspace** for "Code du travail" (common documents)? Currently, each account is fully isolated. If you want common documents, I should create a read-only workspace that everyone can access. Please confirm.

## Verification Plan

### Automated Tests
 - Run `backend/tests/test_auth_flow.py` (needs to be updated or created if not exists) to verify registration and isolation.
 - Execute `migrate_final.py` and verify counts using `diagnose_workspaces.py`.

### Manual Verification
 1. Create a new "Employer" account via the frontend.
 2. Upload a single document.
 3. Perform a search: verify only that document appears.
 4. Login as Admin: verify visibility of all documents.
