#!/usr/bin/env tsx
/**
 * Test Validation Script
 * Validates test configuration and structure
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface TestFile {
  path: string;
  lines: number;
  tests: number;
}

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalFiles: number;
    totalLines: number;
    totalTests: number;
  };
}

async function validateTestStructure(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats = {
    totalFiles: 0,
    totalLines: 0,
    totalTests: 0,
  };

  const testDir = join(process.cwd(), '__tests__/integration');

  // Check if test directory exists
  if (!existsSync(testDir)) {
    errors.push('Integration test directory not found');
    return { success: false, errors, warnings, stats };
  }

  console.log('🔍 Validating test structure...\n');

  // Check required directories
  const requiredDirs = ['api', 'utils'];
  for (const dir of requiredDirs) {
    const dirPath = join(testDir, dir);
    if (!existsSync(dirPath)) {
      errors.push(`Required directory missing: ${dir}`);
    } else {
      console.log(`✅ Directory found: ${dir}/`);
    }
  }

  // Check required files
  const requiredFiles = [
    'utils/test-helpers.ts',
    'jest.setup.ts',
    'README.md',
    'TEST_SUMMARY.md',
  ];

  for (const file of requiredFiles) {
    const filePath = join(testDir, file);
    if (!existsSync(filePath)) {
      errors.push(`Required file missing: ${file}`);
    } else {
      console.log(`✅ File found: ${file}`);
    }
  }

  console.log('\n📊 Analyzing test files...\n');

  // Analyze API test files
  const apiDir = join(testDir, 'api');
  if (existsSync(apiDir)) {
    const files = readdirSync(apiDir).filter((f) => f.endsWith('.test.ts'));

    for (const file of files) {
      const filePath = join(apiDir, file);
      const content = require('fs').readFileSync(filePath, 'utf-8');

      // Count lines
      const lines = content.split('\n').length;

      // Count test cases (rough estimate)
      const itMatches = content.match(/it\(/g) || [];
      const testMatches = content.match(/test\(/g) || [];
      const tests = itMatches.length + testMatches.length;

      stats.totalFiles++;
      stats.totalLines += lines;
      stats.totalTests += tests;

      console.log(`📝 ${file}`);
      console.log(`   Lines: ${lines}`);
      console.log(`   Tests: ${tests}`);

      // Validation checks
      if (tests === 0) {
        warnings.push(`No tests found in ${file}`);
      }

      if (!content.includes('describe(')) {
        warnings.push(`No describe blocks found in ${file}`);
      }

      if (!content.includes('beforeEach(')) {
        warnings.push(`No beforeEach setup in ${file}`);
      }
    }
  }

  console.log('\n📈 Test Coverage Summary\n');
  console.log(`Total Files: ${stats.totalFiles}`);
  console.log(`Total Lines: ${stats.totalLines}`);
  console.log(`Total Tests: ${stats.totalTests}`);

  // Check test helpers
  const helpersPath = join(testDir, 'utils/test-helpers.ts');
  if (existsSync(helpersPath)) {
    const helpersContent = require('fs').readFileSync(helpersPath, 'utf-8');

    const exports = [
      'mockPrisma',
      'mockSession',
      'createMockRequest',
      'createUnauthenticatedRequest',
      'createGitHubWebhookRequest',
      'testDataFactories',
    ];

    console.log('\n🔧 Validating test helpers...\n');

    for (const exp of exports) {
      if (helpersContent.includes(`export const ${exp}`) ||
          helpersContent.includes(`export function ${exp}`)) {
        console.log(`✅ Helper exported: ${exp}`);
      } else {
        warnings.push(`Helper not found: ${exp}`);
      }
    }
  }

  // Check package.json scripts
  const packageJsonPath = join(process.cwd(), 'package.json');
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(
      require('fs').readFileSync(packageJsonPath, 'utf-8')
    );

    console.log('\n🚀 Validating test scripts...\n');

    const requiredScripts = [
      'test',
      'test:integration',
      'test:coverage',
    ];

    for (const script of requiredScripts) {
      if (packageJson.scripts[script]) {
        console.log(`✅ Script found: ${script}`);
      } else {
        warnings.push(`Test script missing: ${script}`);
      }
    }
  }

  // Print results
  console.log('\n' + '='.repeat(60) + '\n');

  if (errors.length > 0) {
    console.log('❌ ERRORS:\n');
    errors.forEach((err) => console.log(`   - ${err}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    warnings.forEach((warn) => console.log(`   - ${warn}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All validations passed!\n');
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}

// Run validation
validateTestStructure()
  .then((result) => {
    if (!result.success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
