# Import Conventions Standard

This document defines standardized import patterns for consistent and maintainable code.

## ✅ STANDARDIZED PATTERNS

### 1. Type-Only Imports
```typescript
// ✅ CORRECT: Use 'import type' for types
import type { IJobData, JobStatus } from '../types/job.ts';
import type { FormSubmissionResult } from '../interfaces/forms.ts';

// ❌ INCORRECT: Don't import types as values
import { IJobData, JobStatus } from '../types/job.ts';
```

### 2. File Extensions
```typescript
// ✅ CORRECT: Use .ts/.tsx extensions for TypeScript files
import { getApiBaseUrl } from '../constants/api.ts';
import { formatErrorMessage } from '../utils/api-utils.ts';
import { BaseForm } from './BaseForm.tsx';

// ❌ INCORRECT: Don't omit extensions
import { getApiBaseUrl } from '../constants/api';
import { formatErrorMessage } from '../utils/api-utils';
```

### 3. Centralized vs Relative Imports
```typescript
// ✅ CORRECT: Use centralized imports for utilities
import { formatFileSize, calculateJobProgress } from '../utils/index.ts';

// ✅ CORRECT: Use relative imports for closely related files
import { BaseForm } from './BaseForm.tsx';
import type { FormProps } from './types.ts';

// ❌ INCORRECT: Deep relative paths
import { formatFileSize } from '../../../utils/formatting.ts';
```

### 4. React Imports
```typescript
// ✅ CORRECT: Destructured React imports
import React, { useState, useEffect, useCallback } from 'react';

// ✅ CORRECT: Type-only React imports when needed
import type { FC, ReactNode } from 'react';
```

### 5. Import Grouping and Order
```typescript
// ✅ CORRECT: Group imports logically
// 1. External libraries
import React, { useState } from 'react';
import DOMPurify from 'dompurify';

// 2. Internal types (type-only)
import type { IJobData } from '../types/job.ts';
import type { FormSubmissionResult } from '../interfaces/forms.ts';

// 3. Internal utilities/components
import { getApiBaseUrl } from '../constants/api.ts';
import { formatErrorMessage } from '../utils/api-utils.ts';
import { BaseForm } from './BaseForm.tsx';
```

### 6. Barrel Exports Usage
```typescript
// ✅ CORRECT: Use barrel exports for utilities
import {
  formatFileSize,
  calculateJobProgress,
  EnhancedApiError
} from '../utils/index.ts';

// ❌ INCORRECT: Multiple individual imports
import { formatFileSize } from '../utils/formatting.ts';
import { calculateJobProgress } from '../utils/calculations.ts';
import { EnhancedApiError } from '../utils/api-utils.ts';
```

## 🎯 IMPLEMENTATION GUIDELINES

### For New Files
1. Always use type-only imports for TypeScript types
2. Use `.ts`/`.tsx` extensions for all TypeScript imports
3. Group imports logically (external → types → internal)
4. Prefer centralized imports via barrel exports
5. Use relative imports only for closely related files

### For Existing Files
1. Gradually migrate to standardized patterns during maintenance
2. Update imports when touching related code
3. Ensure all new imports follow the standard

### Tools Integration
1. ESLint rules enforce import conventions
2. TypeScript compiler settings require explicit extensions
3. IDE configuration supports auto-import with correct patterns

## 📋 CHECKLIST

Before committing code, ensure:
- [ ] All type imports use `import type`
- [ ] All imports include `.ts`/`.tsx` extensions
- [ ] Imports are grouped logically
- [ ] No deep relative import paths (max 2 levels: `../utils/`)
- [ ] Barrel exports used for utilities where available
- [ ] No unused imports remaining

This standard ensures consistent, maintainable, and TypeScript-compliant import patterns across the entire codebase.