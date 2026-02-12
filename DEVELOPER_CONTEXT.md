# Daily Forge App - Developer Context

## **Quick Start Prompt for AI Assistant**

```
I'm working on the Daily Forge app. Here's the full context:

**Architecture:**
- Frontend: React + Vite + TypeScript + Tailwind + Zustand stores + Framer Motion
- Backend: Node.js/Express API with serverless functions
- Database: Neon PostgreSQL
- Deployment: Vercel (frontend) + Vercel serverless functions (backend)
- Authentication: JWT tokens with bcrypt password hashing

**Key Features:**
- Daily SOAP journaling (Scripture, Observation, Application, Prayer)
- Reading plans with progress tracking (Warrior Psalms, etc.) via API.Bible integration
- Goals management (daily/weekly/monthly) with auto-save
- Check-in with emotions and feelings
- Leadership ratings (wisdom, courage, patience, integrity)
- Auto-save functionality throughout the app

**Current Users:**
- marty@dailydavid.com (admin)
- brandon@dailydavid.com 
- brennan@dailydavid.com

**Database Structure:**
- `users` table: user authentication and profiles
- `daily_forge_entries` table: main entry data with `data_content` JSONB field
- `reading_plans` table: dedicated reading plan progress storage
- `goals` table: user goals (daily/weekly/monthly)

**Key Files & Locations:**
- `/src/components/daily/DailyEntry.tsx` - Main daily entry component
- `/src/components/daily/ReadingPlanProgress.tsx` - Reading plan interface
- `/src/components/daily/SOAPSection.tsx` - SOAP journaling section
- `/src/components/daily/BibleIntegration.tsx` - Bible version selection & plan choice
- `/src/stores/dailyStore.ts` - Zustand store for daily data
- `/src/stores/authStore.ts` - Zustand store for authentication
- `/server/index.js` - Main API endpoints
- `/src/lib/bibleService.ts` - API.Bible integration

**Recent Fixes Applied:**
- Fixed reading plan persistence (data stays in state when closing)
- Fixed "Load Today's Devotion" to only update scripture field
- Fixed cache issues with automatic retry logic in authStore
- Fixed page reload issues with preventDefault/stopPropagation
- Fixed button responsiveness with z-index and pointer-events
- Fixed reading plan not showing when reopening after close

**Development Workflow:**
1. Make changes in `/daily-forge/` directory
2. Test locally with `npm run dev` (frontend) and `cd server && npm run dev` (backend)
3. Commit changes: `git add . && git commit -m "description" && git push origin main`
4. Vercel automatically deploys on git push to main branch
5. Check deployment at: https://the-daily-forge.vercel.app

**Common Issues & Solutions:**
- Button unresponsiveness: Check z-index and pointer-events CSS
- Data not persisting: Check auto-save functions and database queries
- Cache issues: Auth store has automatic retry with cache-busting
- Page reloads: Add preventDefault/stopPropagation to event handlers
- Reading plan issues: Check both reading_plans table and data_content field

**API Endpoints:**
- POST `/api/entries` - Create/update daily entry
- GET `/api/entries/:date` - Get entry by date
- POST `/api/auth/login` - User authentication
- GET `/api/auth/verify` - Verify JWT token

**Environment Variables (Vercel):**
- DATABASE_URL (Neon connection string)
- JWT_SECRET (for token signing)
- API_BIBLE_KEY (for Bible API integration)

Continue working on [specific issue/feature you need help with].
```

## **Detailed Technical Context**

### **Project Structure**
```
daily-forge/
├── src/
│   ├── components/
│   │   ├── daily/
│   │   │   ├── DailyEntry.tsx          # Main component
│   │   │   ├── ReadingPlanProgress.tsx # Reading plan UI
│   │   │   ├── SOAPSection.tsx         # SOAP journaling
│   │   │   ├── BibleIntegration.tsx    # Bible/plan selection
│   │   │   ├── CheckInSection.tsx      # Emotions/feelings
│   │   │   └── GratitudeSection.tsx    # Gratitude entries
│   │   ├── auth/
│   │   │   └── LoginForm.tsx           # Login interface
│   │   └── ui/
│   │       ├── Button.tsx              # Custom button component
│   │       └── Textarea.tsx            # Custom textarea
│   ├── stores/
│   │   ├── dailyStore.ts               # Daily data management
│   │   └── authStore.ts                # Authentication state
│   ├── lib/
│   │   ├── bibleService.ts             # API.Bible integration
│   │   └── api.ts                      # API configuration
│   └── types/
│       └── index.ts                    # TypeScript definitions
├── server/
│   ├── index.js                        # Main API server
│   └── package.json                    # Backend dependencies
├── vercel.json                         # Vercel configuration
└── package.json                        # Frontend dependencies
```

### **State Management (Zustand)**
- **dailyStore**: Manages daily entries, goals, reading plans
- **authStore**: Handles login/logout, JWT tokens, user data
- Both stores use `persist` middleware for localStorage

### **Database Schema (Neon PostgreSQL)**
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily entries table
CREATE TABLE daily_forge_entries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  data_content JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reading plans table
CREATE TABLE reading_plans (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_id VARCHAR(255) NOT NULL,
  current_day INTEGER NOT NULL,
  total_days INTEGER NOT NULL,
  completed_days INTEGER[] DEFAULT '{}',
  start_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);
```

### **Key Functions & Patterns**

#### **Auto-Save Pattern**
```typescript
// Used throughout the app for real-time saving
const autoSaveToAPI = async (entryData: any) => {
  // Saves to /api/entries endpoint
  // Includes reading plan data in data_content
  // Handles both create and update operations
}
```

#### **Reading Plan Management**
```typescript
// Reading plan data structure
interface ReadingPlan {
  planId: string
  planName: string
  currentDay: number
  totalDays: number
  startDate: string
  completedDays: number[]
}

// Stored in both:
// 1. reading_plans table (dedicated storage)
// 2. daily_forge_entries.data_content (backup)
```

#### **Event Handling Pattern**
```typescript
// Prevent page reloads and unwanted behavior
const handleClick = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  // Handle click logic
}
```

### **Common Debugging Steps**

1. **Check Console Logs**: Look for 🔥 prefixed logs (reading plan), Store logs (data flow)
2. **Network Tab**: Verify API calls are successful (200 status)
3. **Database Queries**: Use direct API calls to test endpoints
4. **State Inspection**: Check Zustand store state in React DevTools
5. **Cache Issues**: Clear browser cache or use incognito mode

### **Deployment Process**
1. Make changes in `/daily-forge/`
2. Test locally: `npm run dev` + `cd server && npm run dev`
3. Commit: `git add . && git commit -m "description" && git push origin main`
4. Vercel auto-deploys from main branch
5. Check: https://the-daily-forge.vercel.app

### **Troubleshooting Checklist**

#### **Button Issues**
- [ ] Check z-index and pointer-events CSS
- [ ] Verify event handlers have preventDefault/stopPropagation
- [ ] Ensure buttons are using custom Button component

#### **Data Persistence Issues**
- [ ] Check auto-save functions are being called
- [ ] Verify API endpoints return success
- [ ] Check both reading_plans table and data_content field
- [ ] Ensure JWT token is valid

#### **UI/UX Issues**
- [ ] Check conditional rendering logic
- [ ] Verify state updates are triggering re-renders
- [ ] Look for missing setShowReadingPlan(true) calls

#### **Cache/Auth Issues**
- [ ] Auth store has automatic retry with cache-busting
- [ ] Check if JWT token is expired
- [ ] Verify API_BASE_URL is correct

### **API.Bible Integration**
- Uses API.Bible for reading plan content
- Key: Stored in Vercel environment variables
- Service: `/src/lib/bibleService.ts`
- Plans: Warrior Psalms (30 days), etc.

### **Performance Notes**
- Auto-save has 100ms debounce to prevent excessive API calls
- Reading plan data is cached in Zustand store
- Database queries use proper indexing on user_id and date

---

**Last Updated**: December 2024
**Maintainer**: Marty St. John
**Repository**: https://github.com/martyacryl/the-daily-forge
