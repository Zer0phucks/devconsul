#!/bin/bash

# Social Media Platform Integration Setup Verification Script
# Verifies all components are properly configured

set -e

echo "🔍 Social Media Platform Integration - Setup Verification"
echo "=========================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verification function
verify_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        return 1
    fi
}

verify_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (MISSING)"
        return 1
    fi
}

ERRORS=0

# 1. Core Infrastructure Files
echo "📦 Core Infrastructure:"
verify_file "lib/platforms/limits.ts" || ((ERRORS++))
verify_file "lib/platforms/encryption.ts" || ((ERRORS++))
verify_file "lib/platforms/formatters/social.ts" || ((ERRORS++))
echo ""

# 2. Platform Client Files
echo "🔌 Platform Clients:"
verify_file "lib/platforms/twitter.ts" || ((ERRORS++))
verify_file "lib/platforms/linkedin.ts" || ((ERRORS++))
verify_file "lib/platforms/facebook.ts" || ((ERRORS++))
verify_file "lib/platforms/reddit.ts" || ((ERRORS++))
echo ""

# 3. API Endpoints
echo "🌐 API Endpoints:"
verify_dir "app/api/platforms/social/twitter" || ((ERRORS++))
verify_file "app/api/platforms/social/twitter/connect/route.ts" || ((ERRORS++))
verify_file "app/api/platforms/social/twitter/callback/route.ts" || ((ERRORS++))
verify_file "app/api/platforms/social/twitter/post/route.ts" || ((ERRORS++))

verify_dir "app/api/platforms/social/linkedin" || ((ERRORS++))
verify_file "app/api/platforms/social/linkedin/connect/route.ts" || ((ERRORS++))
verify_file "app/api/platforms/social/linkedin/callback/route.ts" || ((ERRORS++))
verify_file "app/api/platforms/social/linkedin/post/route.ts" || ((ERRORS++))

verify_dir "app/api/platforms/social/facebook" || ((ERRORS++))
verify_file "app/api/platforms/social/facebook/connect/route.ts" || ((ERRORS++))
verify_file "app/api/platforms/social/facebook/callback/route.ts" || ((ERRORS++))
verify_file "app/api/platforms/social/facebook/post/route.ts" || ((ERRORS++))

verify_dir "app/api/platforms/social/reddit" || ((ERRORS++))
verify_file "app/api/platforms/social/reddit/connect/route.ts" || ((ERRORS++))
verify_file "app/api/platforms/social/reddit/callback/route.ts" || ((ERRORS++))
verify_file "app/api/platforms/social/reddit/post/route.ts" || ((ERRORS++))
echo ""

# 4. Validation and Documentation
echo "📚 Validation & Documentation:"
verify_file "lib/validations/social-platforms.ts" || ((ERRORS++))
verify_file "lib/platforms/SOCIAL_README.md" || ((ERRORS++))
verify_file ".env.example.social" || ((ERRORS++))
echo ""

# 5. Database Schema
echo "🗄️  Database Schema:"
verify_file "prisma/schema.prisma" || ((ERRORS++))

# Check for FACEBOOK and REDDIT in PlatformType enum
if grep -q "FACEBOOK" prisma/schema.prisma && grep -q "REDDIT" prisma/schema.prisma; then
    echo -e "${GREEN}✓${NC} PlatformType enum includes FACEBOOK and REDDIT"
else
    echo -e "${RED}✗${NC} PlatformType enum missing FACEBOOK or REDDIT"
    ((ERRORS++))
fi
echo ""

# 6. Environment Variables Check
echo "🔐 Environment Variables:"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"

    # Check for required encryption key
    if grep -q "ENCRYPTION_KEY=" .env; then
        echo -e "${GREEN}✓${NC} ENCRYPTION_KEY configured"
    else
        echo -e "${YELLOW}⚠${NC}  ENCRYPTION_KEY not found in .env"
        echo "   Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    fi

    # Check for platform credentials
    platforms=("TWITTER" "LINKEDIN" "FACEBOOK" "REDDIT")
    for platform in "${platforms[@]}"; do
        if grep -q "${platform}_CLIENT_ID=" .env || grep -q "${platform}_APP_ID=" .env; then
            echo -e "${GREEN}✓${NC} ${platform} credentials configured"
        else
            echo -e "${YELLOW}⚠${NC}  ${platform} credentials not found"
        fi
    done
else
    echo -e "${YELLOW}⚠${NC}  .env file not found"
    echo "   Copy .env.example.social to .env and configure credentials"
fi
echo ""

# 7. Dependencies Check
echo "📦 Dependencies:"
if [ -f "package.json" ]; then
    deps=("axios" "zod" "@prisma/client")
    for dep in "${deps[@]}"; do
        if grep -q "\"$dep\"" package.json; then
            echo -e "${GREEN}✓${NC} $dep"
        else
            echo -e "${RED}✗${NC} $dep (MISSING)"
            ((ERRORS++))
        fi
    done
else
    echo -e "${RED}✗${NC} package.json not found"
    ((ERRORS++))
fi
echo ""

# 8. TypeScript Check
echo "🔧 TypeScript Configuration:"
if [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✓${NC} tsconfig.json exists"
else
    echo -e "${RED}✗${NC} tsconfig.json (MISSING)"
    ((ERRORS++))
fi
echo ""

# Summary
echo "=========================================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure environment variables in .env"
    echo "2. Run: npm install (if not done)"
    echo "3. Run: npx prisma migrate dev"
    echo "4. Run: npx prisma generate"
    echo "5. Test OAuth flows for each platform"
    echo ""
    echo "See lib/platforms/SOCIAL_README.md for detailed setup instructions."
else
    echo -e "${RED}❌ Found $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
fi
echo ""

exit $ERRORS
