/**
 * Permission enforcement tests — spatial source governance
 *
 * Run with: node --experimental-strip-types src/lib/gis/__tests__/permission-enforcement.test.ts
 * Or: npx tsx src/lib/gis/__tests__/permission-enforcement.test.ts
 *
 * No test framework required. Exits 0 on pass, 1 on failure.
 */

// ---------------------------------------------------------------------------
// Inline the enforcement logic (mirrors _actions.ts — kept in sync manually)
// ---------------------------------------------------------------------------

type PermissionClassification =
  | 'reference' | 'display' | 'internal' | 'download'
  | 'redistribute' | 'restricted' | 'prohibited' | 'pending';

const PERMITTED_OPS: Record<PermissionClassification, string[]> = {
  reference:    [],
  display:      ['display'],
  internal:     ['display', 'ingest', 'process'],
  download:     ['display', 'ingest', 'process', 'download'],
  redistribute: ['display', 'ingest', 'process', 'download', 'publish', 'redistribute'],
  restricted:   [],
  prohibited:   [],
  pending:      [],
};

function canPerform(cls: PermissionClassification, op: string): boolean {
  return PERMITTED_OPS[cls]?.includes(op) ?? false;
}

interface MockSource {
  id: string;
  name: string;
  permission_classification: PermissionClassification;
  restriction_authority?: string | null;
  restriction_basis?: string | null;
}

interface MockDataset {
  id: string;
  name: string;
  permission_classification: PermissionClassification;
  source_id: string;
}

function checkIngestion(source: MockSource, dataset: MockDataset): string | null {
  if (source.permission_classification === 'restricted') {
    return `Ingestion blocked: source "${source.name}" is restricted. Authority: ${source.restriction_authority ?? 'not recorded'}.`;
  }
  if (source.permission_classification === 'prohibited') {
    return `Ingestion blocked: source "${source.name}" is prohibited.`;
  }
  if (!canPerform(dataset.permission_classification, 'ingest')) {
    return `Ingestion blocked: dataset permission classification is "${dataset.permission_classification}".`;
  }
  if (!canPerform(source.permission_classification, 'ingest')) {
    return `Ingestion blocked: source permission classification is "${source.permission_classification}".`;
  }
  return null;
}

function checkPublication(source: MockSource, dataset: MockDataset): string | null {
  if (source.permission_classification === 'restricted') {
    return `Publication blocked: source "${source.name}" is restricted. Authority: ${source.restriction_authority ?? 'not recorded'}.`;
  }
  if (source.permission_classification === 'prohibited') {
    return `Publication blocked: source "${source.name}" is prohibited.`;
  }
  if (!canPerform(source.permission_classification, 'publish')) {
    return `Publication blocked: source permission classification is "${source.permission_classification}".`;
  }
  if (!canPerform(dataset.permission_classification, 'publish')) {
    return `Publication blocked: dataset permission classification is "${dataset.permission_classification}".`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e instanceof Error ? e.message : String(e)}`);
    failed++;
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
      }
    },
    toContain(substr: string) {
      if (typeof actual !== 'string' || !actual.includes(substr)) {
        throw new Error(`Expected "${actual}" to contain "${substr}"`);
      }
    },
    not: {
      toBeNull() {
        if (actual === null) {
          throw new Error('Expected non-null value');
        }
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const restrictedSource: MockSource = {
  id: 'c8532e74',
  name: 'KZN COGTA Spatial Dashboard — Infrastructure 2022',
  permission_classification: 'restricted',
  restriction_authority: 'Amajuba District Municipality — Mr Udiv Budhal',
};

const prohibitedSource: MockSource = {
  id: 'prohibited-1',
  name: 'Prohibited Source',
  permission_classification: 'prohibited',
};

const pendingSource: MockSource = {
  id: 'pending-1',
  name: 'Pending Source',
  permission_classification: 'pending',
};

const referenceSource: MockSource = {
  id: 'ref-1',
  name: 'NGI Static Maps',
  permission_classification: 'reference',
};

const displaySource: MockSource = {
  id: 'display-1',
  name: 'Display Source',
  permission_classification: 'display',
};

const internalSource: MockSource = {
  id: 'internal-1',
  name: 'Internal Source',
  permission_classification: 'internal',
};

const downloadSource: MockSource = {
  id: 'download-1',
  name: 'Download Source',
  permission_classification: 'download',
};

const redistributeSource: MockSource = {
  id: 'redistribute-1',
  name: 'Redistribute Source',
  permission_classification: 'redistribute',
};

function dataset(cls: PermissionClassification, sourceId = 'src-1'): MockDataset {
  return { id: 'ds-1', name: 'Test Dataset', permission_classification: cls, source_id: sourceId };
}

// ---------------------------------------------------------------------------
// Tests: source-level restrictions
// ---------------------------------------------------------------------------

console.log('\nSource-level restrictions');

test('restricted source blocks ingestion regardless of dataset classification', () => {
  expect(checkIngestion(restrictedSource, dataset('redistribute'))).not.toBeNull();
  expect(checkIngestion(restrictedSource, dataset('download'))).not.toBeNull();
  expect(checkIngestion(restrictedSource, dataset('internal'))).not.toBeNull();
});

test('restricted source block message includes restriction authority', () => {
  const result = checkIngestion(restrictedSource, dataset('redistribute'));
  expect(result).toContain('Amajuba District Municipality');
});

test('prohibited source blocks ingestion', () => {
  expect(checkIngestion(prohibitedSource, dataset('redistribute'))).not.toBeNull();
});

test('restricted source blocks publication regardless of dataset classification', () => {
  expect(checkPublication(restrictedSource, dataset('redistribute'))).not.toBeNull();
});

test('prohibited source blocks publication', () => {
  expect(checkPublication(prohibitedSource, dataset('redistribute'))).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Tests: dataset-level restrictions
// ---------------------------------------------------------------------------

console.log('\nDataset-level restrictions');

test('pending dataset blocks ingestion', () => {
  expect(checkIngestion(downloadSource, dataset('pending'))).not.toBeNull();
});

test('reference dataset blocks ingestion', () => {
  expect(checkIngestion(downloadSource, dataset('reference'))).not.toBeNull();
});

test('display dataset blocks ingestion', () => {
  expect(checkIngestion(downloadSource, dataset('display'))).not.toBeNull();
});

test('restricted dataset blocks ingestion', () => {
  expect(checkIngestion(downloadSource, dataset('restricted'))).not.toBeNull();
});

test('prohibited dataset blocks ingestion', () => {
  expect(checkIngestion(downloadSource, dataset('prohibited'))).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Tests: permitted operations
// ---------------------------------------------------------------------------

console.log('\nPermitted operations');

test('internal source + internal dataset permits ingestion', () => {
  expect(checkIngestion(internalSource, dataset('internal'))).toBeNull();
});

test('download source + download dataset permits ingestion', () => {
  expect(checkIngestion(downloadSource, dataset('download'))).toBeNull();
});

test('redistribute source + redistribute dataset permits ingestion and publication', () => {
  expect(checkIngestion(redistributeSource, dataset('redistribute'))).toBeNull();
  expect(checkPublication(redistributeSource, dataset('redistribute'))).toBeNull();
});

test('internal source does not permit publication', () => {
  expect(checkPublication(internalSource, dataset('internal'))).not.toBeNull();
});

test('download source does not permit publication', () => {
  expect(checkPublication(downloadSource, dataset('download'))).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Tests: conflicting permissions — most restrictive prevails
// ---------------------------------------------------------------------------

console.log('\nConflicting permissions — most restrictive prevails');

test('restricted source + redistribute dataset: source restriction prevails', () => {
  const result = checkIngestion(restrictedSource, dataset('redistribute'));
  expect(result).not.toBeNull();
  expect(result).toContain('restricted');
});

test('redistribute source + pending dataset: dataset restriction prevails', () => {
  const result = checkIngestion(redistributeSource, dataset('pending'));
  expect(result).not.toBeNull();
  expect(result).toContain('pending');
});

test('redistribute source + reference dataset: dataset restriction prevails', () => {
  const result = checkIngestion(redistributeSource, dataset('reference'));
  expect(result).not.toBeNull();
  expect(result).toContain('reference');
});

test('download source + internal dataset: both permit ingestion', () => {
  expect(checkIngestion(downloadSource, dataset('internal'))).toBeNull();
});

test('internal source + download dataset: source blocks publication', () => {
  expect(checkPublication(internalSource, dataset('download'))).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Tests: pending permission blocks all operations
// ---------------------------------------------------------------------------

console.log('\nPending permission');

test('pending source blocks ingestion', () => {
  expect(checkIngestion(pendingSource, dataset('redistribute'))).not.toBeNull();
});

test('pending source blocks publication', () => {
  expect(checkPublication(pendingSource, dataset('redistribute'))).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Tests: staged datasets whose permissions change
// ---------------------------------------------------------------------------

console.log('\nStaged datasets — permission change before publication');

test('dataset staged under download, source changed to restricted: publication blocked', () => {
  // Simulates: dataset was staged when source was download, source is now restricted
  const sourceNowRestricted: MockSource = { ...downloadSource, permission_classification: 'restricted', restriction_authority: 'Custodian X' };
  expect(checkPublication(sourceNowRestricted, dataset('download'))).not.toBeNull();
});

test('dataset staged under redistribute, dataset changed to pending: publication blocked', () => {
  const datasetNowPending = dataset('pending');
  expect(checkPublication(redistributeSource, datasetNowPending)).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Tests: reference and display do not authorise ingestion
// ---------------------------------------------------------------------------

console.log('\nReference and display do not authorise ingestion');

test('reference source does not permit ingestion', () => {
  expect(checkIngestion(referenceSource, dataset('redistribute'))).not.toBeNull();
});

test('display source does not permit ingestion', () => {
  expect(checkIngestion(displaySource, dataset('redistribute'))).not.toBeNull();
});

test('reference source does not permit publication', () => {
  expect(checkPublication(referenceSource, dataset('redistribute'))).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Tests: Amajuba water/sanitation hard restriction
// ---------------------------------------------------------------------------

console.log('\nAmajuba water/sanitation hard restriction');

test('COGTA Infrastructure 2022 (restricted) blocks ingestion of any dataset', () => {
  const classifications: PermissionClassification[] = ['internal', 'download', 'redistribute'];
  for (const cls of classifications) {
    const result = checkIngestion(restrictedSource, dataset(cls));
    if (result === null) throw new Error(`Expected block for dataset classification "${cls}"`);
  }
});

test('COGTA Infrastructure 2022 restriction authority is preserved in block message', () => {
  const result = checkIngestion(restrictedSource, dataset('redistribute'));
  expect(result).toContain('Amajuba District Municipality');
  expect(result).toContain('Mr Udiv Budhal');
});

test('COGTA Infrastructure 2022 blocks publication', () => {
  expect(checkPublication(restrictedSource, dataset('redistribute'))).not.toBeNull();
});

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
