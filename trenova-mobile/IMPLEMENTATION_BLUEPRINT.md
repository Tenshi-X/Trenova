# Trenova Mobile Implementation Blueprint

## 1. Overview
This React Native application (built with Expo) serves as the mobile companion to the Trenova web terminal. Its primary focus is the **Smart Alert System**, allowing users to set sophisticated conditional alerts ("Good for Buy", "Take Profit") that monitor market conditions relative to their targets.

## 2. Technical Stack
- **Framework**: React Native (Expo SDK 50+)
- **Routing**: Expo Router (File-based routing similar to Next.js)
- **Authentication**: Supabase Auth (Shared with Web)
- **State Management**: React Context (for MVP) / Zustand (Scalable)
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS for RN) or StyleSheet

## 3. Architecture & Folder Structure
```
trenova-mobile/
├── app/                  # Application Routes
│   ├── (auth)/           # Authentication Routes (Login)
│   ├── (tabs)/           # Main App Tabs
│   │   ├── index.tsx     # Home/Dashboard
│   │   ├── alerts.tsx    # Alerts List
│   │   └── profile.tsx   # User Settings
│   └── _layout.tsx       # Root Layout & Auth Provider Injection
├── components/           # Reusable UI Components
├── lib/                  # Utilities
│   └── supabase.ts       # Supabase Client Configuration
├── tasks/                # Background Tasks (Fetch prices)
└── constants/            # App Constants (Colors, Config)
```

## 4. Feature Specifications

### A. Authentication
- **Goal**: Allow existing web users to log in.
- **Implementation**:
  - `lib/supabase.ts`: Configured with `AsyncStorage` to persist sessions on mobile.
  - `AuthContext`: Wraps the app to handle session state (loading, signed-in, signed-out).
  - **Login Screen**: Email/Password inputs.

### B. Smart Trading Alerts (Core Feature)
- **Concept**: A "Wait-and-Trigger" multi-stage alert system.
- **Data Model**:
  ```typescript
  interface SmartAlert {
    id: string;
    asset_symbol: string;      // e.g., 'BTC'
    market_price_at_creation: number;
    
    // Stage 1: Entry
    good_for_buy_price: number; // Target price to wait for
    entry_triggered: boolean;   // True if price <= good_for_buy_price
    
    // Stage 2: Exit
    take_profit_price: number;  // Target price to sell at
    exit_triggered: boolean;    // True if price >= take_profit_price (after entry)
    
    status: 'WAITING_ENTRY' | 'READY_TO_BUY' | 'WAITING_EXIT' | 'TAKE_PROFIT_HIT';
  }
  ```
- **UI Workflow**:
  1. **New Alert**: User selects Asset, sets "Good for Buy" price (lower than current), sets "Take Profit" price (higher than Buy).
  2. **Dashboard**: Shows cards for each alert with a visual progress bar indicating how close current price is to the next target.
  3. **Notification**: (Future) Push notification when status changes.

## 5. Required Dependencies
Run the following to set up the environment:
```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

## 6. Environment Setup
Create a `.env` file in `trenova-mobile/`:
```
EXPO_PUBLIC_SUPABASE_URL=your_project_url (Match Web)
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key (Match Web)
```

## 7. Development Plan
1. **Initialize**: Scaffold App & Install Dependencies.
2. **Auth Integration**: Build Login Screen & Connect Supabase.
3. **Core UI**: Build Dashboard & Alert Creation Form.
4. **Logic**: Implement the "Smart Alert" state machine logic.
