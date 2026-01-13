# Testing Patterns

**Analysis Date:** 2026-01-13

## Test Framework

**Runner:**
- Jest 29.7.0 (`package.json`)
- Preset: `jest-expo` for Expo/React Native support

**Configuration:**
- Config: `jest.config.js` in project root
- Setup: `jest-setup.js` for mock configuration

**Assertion Library:**
- Jest built-in expect
- @testing-library/jest-native for React Native matchers

**Run Commands:**
```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- path/to/file    # Single file
npm run test:coverage       # Coverage report
```

## Test File Organization

**Location:**
- `__tests__/` directories alongside source code
- Co-located with modules being tested

**Naming:**
- `*.test.js` for test files
- Matches source file names (e.g., `authStore.test.js`)

**Structure:**
```
components/
  __tests__/
    App.test.js
stores/
  __tests__/
    authStore.test.js
utils/
  __tests__/
    featureGates.test.js
    logger.test.js
helpers/
  __tests__/
    common.test.js
```

## Test Structure

**Suite Organization:**
```javascript
import { renderHook, act } from '@testing-library/react-native';

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset state before each test
    useAuthStore.getState().logout();
  });

  it('should update user and authentication status', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = { id: '123', email: 'test@example.com' };

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

**Patterns:**
- Use `beforeEach` for per-test setup
- Use `act()` for state updates
- Explicit arrange/act/assert structure
- One assertion focus per test

## Mocking

**Framework:**
- Jest built-in mocking
- Module mocking via `jest.mock()`

**Native Module Mocks (`jest-setup.js`):**
```javascript
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
}));
```

**External Service Mocks:**
```javascript
jest.mock('@sentry/react-native', () => ({
  captureMessage: jest.fn(),
  captureException: jest.fn(),
}));
```

**Console Mocks:**
```javascript
global.console = {
  ...global.console,
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
```

**What to Mock:**
- Native modules (reanimated, gesture-handler, async-storage)
- External services (Sentry, Supabase)
- Console methods for log verification

**What NOT to Mock:**
- Pure functions and utilities
- Business logic under test
- Simple state management

## Fixtures and Factories

**Test Data Pattern:**
```javascript
const mockUser = { id: '123', email: 'test@example.com' };
const mockSession = { access_token: 'token', user: mockUser };
```

**Hook Testing:**
```javascript
import { renderHook, act } from '@testing-library/react-native';

const { result } = renderHook(() => useAuthStore());

act(() => {
  result.current.setUser(mockUser);
});
```

## Coverage

**Requirements:**
- No enforced coverage target
- Coverage tracked for awareness
- Focus on critical paths

**Configuration:**
- Jest built-in coverage
- Excludes: test files, config files

**View Coverage:**
```bash
npm run test:coverage
```

## Test Types

**Unit Tests (Current):**
- Store state management (`stores/__tests__/authStore.test.js`)
- Utility functions (`utils/__tests__/featureGates.test.js`)
- Logger service (`utils/__tests__/logger.test.js`)
- Helper functions (`helpers/__tests__/common.test.js`)
- Component smoke tests (`components/__tests__/App.test.js`)

**Integration Tests:**
- Not currently implemented
- Would test hook + Supabase interactions

**E2E Tests:**
- Not currently configured
- Could use Detox or Maestro

## Common Patterns

**Component Testing:**
```javascript
import { render } from '@testing-library/react-native';

describe('Smoke Test', () => {
  it('renders correctly', () => {
    const { getByText } = render(<TestComponent />);
    expect(getByText('Hello Testing')).toBeTruthy();
  });
});
```

**Hook Testing:**
```javascript
import { renderHook, act } from '@testing-library/react-native';

it('should update state', () => {
  const { result } = renderHook(() => useAuthStore());

  act(() => {
    result.current.setUser(mockUser);
  });

  expect(result.current.user).toEqual(mockUser);
});
```

**Async Testing:**
```javascript
it('should handle async logout', async () => {
  const { result } = renderHook(() => useAuthStore());

  await act(async () => {
    await result.current.logout();
  });

  expect(result.current.user).toBeNull();
});
```

**Environment-Based Testing:**
```javascript
describe('in Development (isDev = true)', () => {
  const Logger = new LoggerService({ isDev: true });

  it('should log debug messages', () => {
    Logger.debug('test debug');
    expect(console.debug).toHaveBeenCalledWith('[DEBUG]', 'test debug');
  });

  it('should NOT send errors to Sentry', () => {
    const err = new Error('test error');
    Logger.error(err);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});

describe('in Production (isDev = false)', () => {
  const Logger = new LoggerService({ isDev: false });

  it('should send errors to Sentry', () => {
    const err = new Error('test error');
    Logger.error(err);
    expect(Sentry.captureException).toHaveBeenCalledWith(err, expect.any(Object));
  });
});
```

## Testing Gaps

**Missing Tests For:**
- Critical hooks: `useCreatePost`, `useFriends`, `useMessages`
- API functions: `createEvent`
- Event/forum creation flows
- Authentication flows
- Onboarding process
- Complex component interactions

**Test Coverage Status:**
- 5 test files implemented
- Foundational patterns established
- Significant room for improvement

---

*Testing analysis: 2026-01-13*
*Update when test patterns change*
