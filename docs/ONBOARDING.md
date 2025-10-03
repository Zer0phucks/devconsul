# Onboarding System Documentation

## Overview

The Full Self Publishing platform includes a comprehensive onboarding wizard that guides new users through initial setup in 8 sequential steps. The system includes progress tracking, resume capability, and an interactive dashboard tour.

## Architecture

### Core Components

1. **Database Model** (`OnboardingProgress`)
   - Tracks user progress through all 8 steps
   - Stores step-specific data
   - Manages tour progress
   - Supports resume functionality

2. **State Management** (`/lib/onboarding/state.ts`)
   - `OnboardingState` class with utility methods
   - Progress calculation
   - Step validation
   - Welcome back messaging

3. **Type Definitions** (`/lib/onboarding/types.ts`)
   - TypeScript interfaces for all onboarding data
   - Step definitions and metadata
   - Tour configuration types

4. **API Routes** (`/app/api/onboarding/route.ts`)
   - GET: Fetch current progress
   - POST: Update step progress
   - PATCH: Update tour progress

5. **UI Components** (`/components/onboarding/`)
   - `wizard-container.tsx`: Main wizard shell with stepper and navigation
   - `steps/step-*.tsx`: Individual step components

6. **Tour System** (`/lib/tour/`)
   - Tour configuration and steps
   - Tour provider for state management
   - Dashboard feature highlights

## 8-Step Wizard Flow

### Step 1: Welcome
- **Purpose**: Introduction to platform features
- **Features**:
  - Platform overview video/animation
  - Feature highlight cards (6 key features)
  - Quick statistics
- **Data Collected**: `videoWatched` (boolean)
- **Skippable**: No

### Step 2: Connect GitHub Repository
- **Purpose**: Link GitHub repository for content generation
- **Features**:
  - GitHub OAuth integration
  - Repository selection (when implemented)
  - Benefits explanation
- **Data Collected**:
  - `repoId`: Repository ID
  - `repoName`: Repository name
  - `repoOwner`: Repository owner
  - `skipped`: Boolean flag
- **Skippable**: Yes
- **Optional**: Yes

### Step 3: Select Content Types
- **Purpose**: Choose which content types to publish
- **Features**:
  - Multi-select content type cards
  - 6 content types: Blog, Newsletter, Twitter, LinkedIn, Facebook, RSS
  - Visual selection feedback
- **Data Collected**:
  - `selectedTypes`: Array of content type IDs
- **Validation**: At least one type required
- **Skippable**: No

### Step 4: Set Brand Voice (3-Question Quiz)
- **Purpose**: Define brand voice and content preferences
- **Features**:
  - Tone selector (4 options)
  - Target audience textarea
  - Key themes textarea
- **Data Collected**:
  - `tone`: professional | casual | technical | friendly
  - `audience`: String description
  - `themes`: String description
  - `generatedVoice`: AI-generated voice summary (future)
- **Validation**: All three fields required
- **Skippable**: No

### Step 5: Connect 1-2 Platforms
- **Purpose**: Link publishing platforms
- **Features**:
  - Platform selection cards
  - OAuth connection flows
  - Connection status display
- **Data Collected**:
  - `platforms`: Array of {type, connected}
  - `skipped`: Boolean flag
- **Skippable**: Yes
- **Optional**: Yes
- **Status**: Placeholder (implementation pending)

### Step 6: Generate Test Content
- **Purpose**: Demonstrate content generation
- **Features**:
  - Trigger test generation
  - Real-time progress indicator
  - Preview generated content
  - Edit/regenerate options
- **Data Collected**:
  - `contentId`: Generated content ID
  - `accepted`: Boolean flag
  - `regenerated`: Number of regenerations
- **Skippable**: Yes
- **Status**: Placeholder (implementation pending)

### Step 7: Review & Customize
- **Purpose**: Finalize settings and schedule
- **Features**:
  - Settings summary
  - Edit any step option
  - Cron schedule configuration
  - Publishing frequency selection
- **Data Collected**:
  - `cronSchedule`: Cron expression
  - `frequency`: daily | weekly | monthly
  - `timezone`: IANA timezone string
- **Skippable**: No
- **Status**: Placeholder (implementation pending)

### Step 8: Complete Setup
- **Purpose**: Celebrate completion and offer tour
- **Features**:
  - Success celebration screen
  - Quick feature links
  - Optional dashboard tour
  - Direct dashboard access
- **Data Collected**:
  - `tourStarted`: Boolean flag
  - `completedAt`: ISO timestamp
- **Skippable**: No

## Progress Tracking

### OnboardingProgress Model Fields

```typescript
interface OnboardingProgress {
  // Metadata
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  // Overall progress
  currentStep: number;           // 1-8
  completedSteps: number[];      // Array of completed step numbers
  isCompleted: boolean;
  completedAt?: Date;

  // Step completion flags
  step1Completed: boolean;
  step2Completed: boolean;
  // ... through step8Completed

  // Step data (JSON)
  step1Data?: unknown;
  step2Data?: unknown;
  // ... through step8Data

  // Session management
  lastActiveStep: number;
  lastActiveAt: Date;
  canResume: boolean;
  skippedSteps: number[];

  // Tour tracking
  tourCompleted: boolean;
  tourStartedAt?: Date;
  tourCompletedAt?: Date;
  tourSkippedAt?: Date;
  tourProgress?: unknown;
}
```

### State Utilities

**OnboardingState Class Methods:**

- `getCompletionPercentage(progress)`: Calculate 0-100% completion
- `isStepCompleted(progress, step)`: Check if step is complete
- `isStepAccessible(progress, step)`: Check if user can access step
- `getNextStep(progress)`: Get next step number
- `getPreviousStep(progress)`: Get previous step number
- `canProceedToNext(progress)`: Check if can move forward
- `getWelcomeBackMessage(progress)`: Contextual greeting
- `validateStepData(step, data)`: Validate before saving
- `getEstimatedTimeRemaining(progress)`: Time estimate
- `shouldShowOnboarding(progress)`: Auto-show logic

## Interactive Tour System

### Tour Configuration

Located in `/lib/tour/config.ts`:

```typescript
const dashboardTourSteps = [
  {
    element: "#project-selector",
    title: "Projects",
    description: "...",
    position: "bottom",
  },
  // ... 7 total steps
];
```

### Tour Steps

1. **Project Selector**: Switching between projects
2. **Content Library**: Viewing and managing content
3. **Generate Content Button**: Manual content generation
4. **Platforms Section**: Managing connected platforms
5. **Scheduling Section**: Publishing schedule
6. **Analytics Card**: Performance tracking
7. **Settings Link**: Project configuration

### Tour Provider

Context-based tour management:

```typescript
const { isActive, currentStep, start, next, previous, skip } = useTour();
```

## API Endpoints

### GET /api/onboarding
Fetch current user's onboarding progress. Creates new progress record if none exists.

**Response:**
```json
{
  "id": "clx...",
  "userId": "user_id",
  "currentStep": 3,
  "completedSteps": [1, 2],
  "isCompleted": false,
  ...
}
```

### POST /api/onboarding
Update onboarding progress for a specific step.

**Request Body:**
```json
{
  "step": 3,
  "data": { "selectedTypes": ["blog", "newsletter"] },
  "completed": true,
  "skipped": false
}
```

**Behavior:**
- Updates `stepNData` with provided data
- Marks `stepNCompleted` if `completed: true`
- Adds step to `completedSteps` array
- Moves to next step automatically
- Marks onboarding complete when step 8 is completed

### PATCH /api/onboarding
Update tour-specific progress.

**Request Body:**
```json
{
  "tourStarted": true,
  "tourCompleted": false,
  "tourProgress": { "viewedSteps": [0, 1, 2] }
}
```

## Integration Points

### Dashboard Integration

1. **Auto-redirect for new users**: Check `isCompleted` flag
2. **Tour auto-start**: Check URL param `?tour=start`
3. **Resume onboarding**: Show banner if incomplete
4. **Feature highlights**: Use tour elements as IDs

### Project Creation

When first project is created during onboarding:
- Auto-link to onboarding progress
- Populate with onboarding data
- Apply brand voice settings
- Configure selected platforms

### Content Generation

First content generation in Step 6:
- Use onboarding brand voice
- Apply selected content types
- Generate sample based on GitHub activity (if connected)

## User Experience Flow

### New User Journey

1. **Sign Up** → Create account
2. **Auto-redirect** → `/onboarding` page
3. **Welcome Screen** → Watch intro, see features
4. **Configuration** → Complete 8 steps
5. **Tour Option** → Choose guided tour or skip
6. **Dashboard** → Start using platform

### Returning Incomplete User

1. **Login** → Authenticate
2. **Check Progress** → API fetches status
3. **Resume Banner** → "You're 60% complete! Continue setup?"
4. **Resume** → Jump to last incomplete step
5. **Complete** → Finish remaining steps

### Completed User

1. **Login** → No onboarding redirect
2. **Dashboard** → Normal access
3. **Tour** → Can manually restart from settings

## Best Practices

### For Developers

1. **Always validate step data** before marking complete
2. **Handle skip functionality** appropriately
3. **Maintain backward compatibility** when adding new steps
4. **Test resume flow** after interruptions
5. **Ensure tour IDs** match actual DOM elements

### For Users

1. **Take the tour** for best experience
2. **Connect GitHub early** for better content
3. **Be specific in brand voice** for quality content
4. **Start with 1-2 platforms** to avoid overwhelm
5. **Review generated content** before accepting

## Future Enhancements

### Planned Features

1. **Step 5-7 Implementation**
   - Platform OAuth connections
   - Live content generation
   - Advanced scheduling UI

2. **Progress Indicators**
   - Visual progress tracking
   - Achievement badges
   - Completion certificates

3. **Smart Recommendations**
   - AI-suggested content types
   - Platform recommendations
   - Optimal scheduling times

4. **A/B Testing**
   - Test different onboarding flows
   - Measure completion rates
   - Optimize step order

5. **Personalization**
   - Skip irrelevant steps
   - Customize wizard theme
   - Industry-specific templates

6. **Analytics**
   - Track step completion times
   - Identify drop-off points
   - Measure feature adoption

## Troubleshooting

### Common Issues

**Issue**: Progress not saving
- **Cause**: Authentication session expired
- **Fix**: Re-login and resume

**Issue**: Cannot proceed to next step
- **Cause**: Required fields not filled
- **Fix**: Check validation errors

**Issue**: Tour not starting
- **Cause**: DOM elements not rendered
- **Fix**: Ensure dashboard fully loaded

**Issue**: GitHub connection fails
- **Cause**: OAuth redirect misconfigured
- **Fix**: Check environment variables

## Testing

### Test Scenarios

1. **New user complete flow**: Full 8-step completion
2. **Resume after interrupt**: Close browser mid-flow
3. **Skip optional steps**: Test skip functionality
4. **Invalid data submission**: Trigger validation
5. **Tour interaction**: Complete full tour
6. **Multiple projects**: Create project during onboarding

### API Testing

```bash
# Fetch progress
curl -X GET http://localhost:3000/api/onboarding \
  -H "Cookie: next-auth.session-token=..."

# Update step
curl -X POST http://localhost:3000/api/onboarding \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"step": 3, "data": {...}, "completed": true}'

# Update tour
curl -X PATCH http://localhost:3000/api/onboarding \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"tourStarted": true}'
```

## Migration

To apply the database schema:

```bash
npx prisma migrate dev --name add_onboarding_progress
npx prisma generate
```

## Support

For issues or questions:
- **Documentation**: `/docs/ONBOARDING.md`
- **API Reference**: `/docs/API.md`
- **Support Email**: support@fullselfpublishing.com
