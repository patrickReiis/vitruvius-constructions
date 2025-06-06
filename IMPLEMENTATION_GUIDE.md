# Architecture Project State Persistence Documentation

## Overview

I've implemented a comprehensive solution for saving architecture project changes in memory when users navigate between the simulator and gallery pages. The solution includes:

1. **Automatic State Persistence**: Project changes are automatically saved to browser sessionStorage
2. **Working State Indicators**: Visual indicators show when users have unsaved changes
3. **Recovery Dialog**: Helpful prompts when navigating away from unsaved work
4. **Seamless Navigation**: State persists across page navigation within the same browser session

## Key Components

### 1. Enhanced Project Manager (`/src/hooks/useProjectManager.ts`)

**New Functions Added:**
- `hasWorkingProject()` - Checks if there's unsaved work
- `getWorkingProjectLastModified()` - Gets timestamp of last modification
- Enhanced `saveWorkingProject()` - Now includes timestamps

### 2. Working State Indicator (`/src/components/architecture/WorkingStateIndicator.tsx`)

**Features:**
- Shows when project has unsaved changes
- Displays relative time since last modification ("5m ago", "2h ago")
- Provides quick save and discard options
- Auto-updates to stay current

**Usage:**
```tsx
<WorkingStateIndicator 
  onSaveRequested={() => saveToNostr(project)}
  onDiscardRequested={() => setProject(defaultProject)}
/>
```

### 3. Project Recovery Dialog (`/src/components/architecture/ProjectRecoveryDialog.tsx`)

**Features:**
- Automatically detects when user navigates away from unsaved work
- Shows project details and last modification time
- Offers options to continue editing, save & continue, or discard
- Only appears when there's actually unsaved work

### 4. Project Recovery Hook (`/src/hooks/useProjectRecovery.ts`)

**Functionality:**
- Monitors route changes
- Triggers recovery dialog when appropriate
- Integrates with React Router

## How It Works

### 1. Auto-Save Behavior in Simulator

The `ArchitectureSimulator` component automatically saves project state whenever:
- Elements are added/removed/modified
- Project properties are changed
- Any structural changes occur

```typescript
// Auto-save working state whenever project changes
useEffect(() => {
  const hasBeenModified = project.id !== defaultProject.id || 
                         project.elements.length !== defaultProject.elements.length ||
                         project.name !== defaultProject.name ||
                         JSON.stringify(project.elements) !== JSON.stringify(defaultProject.elements);
  
  if (hasBeenModified) {
    saveWorkingProject(project);
  }
}, [project]);
```

### 2. State Loading Priority

When the simulator loads, it follows this priority:
1. **Transferred Project** (from gallery selection) - Takes precedence
2. **Working Project** (from sessionStorage) - Restores unsaved work
3. **Default Project** (fallback) - Clean slate

### 3. Navigation Flow

**When navigating FROM simulator TO gallery:**
1. Working state is preserved in sessionStorage
2. Gallery shows `WorkingStateIndicator` if unsaved work exists
3. User can save, continue editing, or discard changes

**When navigating FROM gallery TO simulator:**
1. `ProjectRecoveryDialog` appears if unsaved work exists
2. User can choose to continue with unsaved work or start fresh
3. Working state is restored seamlessly

## User Experience

### Scenario 1: User creates something, then clicks Gallery
1. ✅ Changes auto-saved to memory
2. ✅ Gallery shows "Unsaved Changes" indicator
3. ✅ User can click "Save" to publish or "Back to Simulator" to continue

### Scenario 2: User has unsaved work and loads a gallery project
1. ✅ Recovery dialog appears asking what to do with current work
2. ✅ User can save current work, discard it, or cancel the action
3. ✅ No work is lost accidentally

### Scenario 3: User refreshes the page
1. ✅ Working state persists (sessionStorage survives refresh)
2. ✅ User continues exactly where they left off

### Scenario 4: User closes and reopens browser tab
1. ❌ Working state is lost (sessionStorage is tab-specific)
2. ✅ This is expected behavior - prevents stale state accumulation

## Browser Storage Used

- **sessionStorage.workingProject** - The project data
- **sessionStorage.workingProjectLastModified** - Timestamp for UI display
- **Temporary memory transfer** - For gallery→simulator project loading

## Benefits

✅ **Zero Data Loss**: User work is never lost during navigation  
✅ **Seamless UX**: Natural workflow between simulator and gallery  
✅ **Clear Indicators**: User always knows when they have unsaved work  
✅ **Choice & Control**: User decides how to handle unsaved changes  
✅ **Performance**: Uses efficient sessionStorage, not heavy databases  
✅ **Privacy**: Everything stays in user's browser  

## Implementation Notes

- Uses React hooks and sessionStorage for lightweight persistence
- Integrates smoothly with existing Nostr-based project saving
- Follows React best practices with proper state management
- TypeScript ensures type safety throughout
- Components are modular and reusable

The implementation successfully solves the original requirement: users can navigate between the simulator and gallery without losing their work, with clear indicators and recovery options when needed.