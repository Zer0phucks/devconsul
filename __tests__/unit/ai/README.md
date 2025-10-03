# AI Content Generation Unit Tests

Comprehensive unit tests for the AI content generation module covering OpenAI, Anthropic providers, content generation, and multi-platform content adaptation.

## Test Coverage Summary

### Overall AI Module Coverage
- **lib/ai/**: 12.72% statements, 7.69% branches, 18.1% functions
- **lib/ai/prompts/**: 32.2% statements, 33.7% branches, 33.33% functions
- **lib/ai/providers/**: 97.64% statements, 95.55% branches, 100% functions

### Covered Files (High Coverage)
- ✅ **lib/ai/providers/openai.ts**: 97.43% coverage
- ✅ **lib/ai/providers/anthropic.ts**: 97.82% coverage
- ✅ **lib/ai/content-generator.ts**: 100% coverage
- ✅ **lib/ai/generate-content.ts**: 100% coverage
- ✅ **lib/ai/prompts/blog.ts**: 100% coverage
- ✅ **lib/ai/prompts/twitter.ts**: 100% coverage

### Test Files

#### Provider Tests
**`providers/openai.test.ts`** (60+ tests)
- ✅ Content generation with GPT-4 and GPT-3.5-turbo
- ✅ Token counting and cost estimation
- ✅ Error handling (rate limits, auth errors, server errors, network errors)
- ✅ Model override and configuration
- ✅ Connection testing
- ✅ Provider factory function

**`providers/anthropic.test.ts`** (55+ tests)
- ✅ Content generation with Claude models (Opus, Sonnet, Haiku)
- ✅ Cost calculation for different Claude models
- ✅ Error handling (rate limits, authentication, overloaded, server errors)
- ✅ Non-text content handling
- ✅ Connection testing
- ✅ Environment variable configuration

#### Content Generator Tests
**`content-generator.test.ts`** (35+ tests)
- ✅ Blog post generation from GitHub activities
- ✅ Newsletter generation with custom styling
- ✅ Activity context building (commits, PRs, issues, releases)
- ✅ Custom config options (model, temperature, style, audience)
- ✅ JSON and plain text response parsing
- ✅ Automated content generation workflow
- ✅ Significance-based content triggering
- ✅ KV storage integration
- ✅ Metadata handling

#### Multi-Platform Tests
**`generate-content.test.ts`** (45+ tests)
- ✅ Platform-specific content generation (Twitter, LinkedIn, Medium, Dev.to, Hashnode)
- ✅ Model selection (GPT-4, GPT-3.5, Claude Sonnet)
- ✅ Cost estimation per model
- ✅ Content refinement functionality
- ✅ Error handling and logging
- ✅ System prompt customization per platform

#### Prompt Template Tests
**`prompts/blog.test.ts`** (20+ tests)
- ✅ System prompt structure and requirements
- ✅ User prompt with activity context
- ✅ Brand voice integration (tone, audience, themes)
- ✅ Keyword inclusion
- ✅ Title suggestions
- ✅ Complex context handling

**`prompts/twitter.test.ts`** (25+ tests)
- ✅ System prompt with Twitter requirements
- ✅ Character limit enforcement (280 chars)
- ✅ Thread structure and numbering
- ✅ Brand voice customization
- ✅ Hashtag inclusion/exclusion
- ✅ Thread length configuration

## Test Features

### Mocking Strategy
- **AI SDK Mocking**: Complete mocking of Vercel AI SDK `generateText` function
- **Provider Mocking**: Individual provider mocking for OpenAI and Anthropic
- **KV Store Mocking**: Supabase KV operations mocked for storage testing
- **GitHub Activities**: Comprehensive mock data for all activity types

### Test Categories

#### 1. Happy Path Testing
- Successful content generation
- Proper configuration handling
- Correct model selection
- Accurate cost calculation

#### 2. Error Scenarios
- API rate limiting
- Authentication failures
- Server errors (5xx)
- Network errors
- Invalid responses

#### 3. Edge Cases
- Empty content handling
- Non-JSON responses
- Missing configuration
- Fallback behavior
- Provider failover logic

#### 4. Configuration Testing
- Model overrides
- Temperature and token limits
- Style and audience targeting
- Platform-specific requirements

### Mock Files

Located in `__tests__/unit/ai/__mocks__/`:
- **ai-sdk.mock.ts**: Vercel AI SDK mocks and utilities
- **github-activities.mock.ts**: GitHub activity test data
- **kv.mock.ts**: Supabase KV store mocks

## Running Tests

```bash
# Run all AI tests
npm run test:unit -- __tests__/unit/ai

# Run specific test suite
npm run test:unit -- __tests__/unit/ai/providers/openai.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch -- __tests__/unit/ai
```

## Test Utilities

### Setup Requirements
- Jest configuration with TypeScript support
- Anthropic SDK shims for Node.js environment
- Mock implementations for all external dependencies

### Environment Variables
Tests use mocked environment variables:
- `OPENAI_API_KEY`: Mocked for OpenAI tests
- `ANTHROPIC_API_KEY`: Mocked for Anthropic tests
- All API keys use test values

## Coverage Goals

The tests achieve:
- ✅ **97%+ coverage** for AI provider modules
- ✅ **100% coverage** for core content generation logic
- ✅ **100% coverage** for tested prompt templates
- ✅ **Comprehensive error handling** coverage
- ✅ **All critical paths** tested

## Adding New Tests

When adding new tests:
1. Place provider tests in `providers/` directory
2. Place prompt tests in `prompts/` directory
3. Use existing mock files in `__mocks__/` directory
4. Follow naming convention: `*.test.ts`
5. Group tests by functionality using `describe` blocks
6. Include both success and failure scenarios
7. Mock all external dependencies
8. Test error handling paths

## Test Quality Standards

All tests follow:
- **Arrange-Act-Assert** pattern
- **Clear test descriptions** explaining what is tested
- **Isolated test cases** with no interdependencies
- **Comprehensive mocking** of external services
- **Type safety** with TypeScript throughout
- **Edge case coverage** for boundary conditions
