#!/bin/bash

# ============================================
# DevConsul Project Initialization Script
# ============================================
# This script sets up and validates the DevConsul development environment

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Flags
START_DEV=false
RUN_TESTS=false
SKIP_CHECKS=false

# ============================================
# Helper Functions
# ============================================

print_header() {
    echo -e "${CYAN}${BOLD}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           DevConsul Initialization Script                  ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}▶${NC} ${BOLD}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

show_help() {
    echo -e "${BOLD}Usage:${NC} ./init.sh [OPTIONS]"
    echo ""
    echo -e "${BOLD}Options:${NC}"
    echo "  -h, --help          Show this help message"
    echo "  -d, --dev           Start development server after initialization"
    echo "  -t, --test          Run tests after initialization"
    echo "  -s, --skip-checks   Skip dependency checks (faster, use with caution)"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo "  ./init.sh                    # Standard initialization"
    echo "  ./init.sh --dev              # Initialize and start dev server"
    echo "  ./init.sh --test             # Initialize and run tests"
    echo "  ./init.sh --dev --test       # Initialize, run tests, then start dev server"
    echo ""
}

check_command() {
    if command -v "$1" &> /dev/null; then
        print_success "$1 is installed ($(command -v "$1"))"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

check_version() {
    local cmd=$1
    local version_flag=$2
    local min_version=$3

    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd $version_flag 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        print_info "$cmd version: $version"
    fi
}

# ============================================
# Main Functions
# ============================================

check_dependencies() {
    print_step "Checking dependencies..."
    echo ""

    local all_deps_ok=true

    # Check Node.js
    if check_command "node"; then
        check_version "node" "--version"
        local node_version=$(node --version | grep -oE '[0-9]+' | head -1)
        if [ "$node_version" -lt 18 ]; then
            print_warning "Node.js version should be 18 or higher (detected: $(node --version))"
        fi
    else
        all_deps_ok=false
        print_error "Node.js is required. Install from https://nodejs.org"
    fi

    # Check npm
    if check_command "npm"; then
        check_version "npm" "--version"
    else
        all_deps_ok=false
        print_error "npm is required (usually comes with Node.js)"
    fi

    # Check git
    if check_command "git"; then
        check_version "git" "--version"
    else
        print_warning "git is recommended but not required"
    fi

    echo ""

    if [ "$all_deps_ok" = false ]; then
        print_error "Missing required dependencies. Please install them and try again."
        exit 1
    fi

    print_success "All required dependencies are installed"
    echo ""
}

install_npm_dependencies() {
    print_step "Installing npm dependencies..."
    echo ""

    if [ ! -f "package.json" ]; then
        print_error "package.json not found! Are you in the correct directory?"
        exit 1
    fi

    print_info "Running: npm install"
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
    echo ""
}

check_env_file() {
    print_step "Checking environment configuration..."
    echo ""

    if [ -f ".env.local" ]; then
        print_success ".env.local file exists"
    else
        print_warning ".env.local file not found"
        print_info "Create a .env.local file for environment-specific configuration"

        if [ -f ".env.example" ]; then
            print_info "You can copy .env.example as a starting point:"
            echo -e "  ${CYAN}cp .env.example .env.local${NC}"
        fi
    fi
    echo ""
}

run_linter() {
    print_step "Running linter..."
    echo ""

    print_info "Running: npm run lint"
    if npm run lint; then
        print_success "Linting passed"
    else
        print_error "Linting failed"
        print_info "Fix linting errors or run: npm run lint -- --fix"
        exit 1
    fi
    echo ""
}

run_type_check() {
    print_step "Running TypeScript type check..."
    echo ""

    print_info "Running: npx tsc --noEmit"
    if npx tsc --noEmit; then
        print_success "Type check passed"
    else
        print_error "Type check failed"
        print_info "Fix TypeScript errors before proceeding"
        exit 1
    fi
    echo ""
}

run_tests() {
    print_step "Running tests..."
    echo ""

    if grep -q '"test"' package.json; then
        print_info "Running: npm test"
        if npm test; then
            print_success "All tests passed"
        else
            print_error "Tests failed"
            exit 1
        fi
    else
        print_warning "No test script found in package.json"
        print_info "Add tests to ensure code quality"
    fi
    echo ""
}

start_dev_server() {
    print_step "Starting development server..."
    echo ""

    print_info "Running: npm run dev"
    print_info "Press Ctrl+C to stop the server"
    echo ""

    npm run dev
}

show_summary() {
    echo -e "${GREEN}${BOLD}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║          Initialization Complete! ✓                        ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${BOLD}Next steps:${NC}"
    echo "  • Start development server: ${CYAN}npm run dev${NC}"
    echo "  • Build for production:     ${CYAN}npm run build${NC}"
    echo "  • Run linter:               ${CYAN}npm run lint${NC}"
    echo "  • Run type check:           ${CYAN}npx tsc --noEmit${NC}"
    echo ""
    echo -e "${BOLD}Project Information:${NC}"
    print_info "Branch: $(git branch --show-current 2>/dev/null || echo 'N/A')"
    print_info "Node.js: $(node --version)"
    print_info "npm: $(npm --version)"
    echo ""
}

# ============================================
# Parse Command Line Arguments
# ============================================

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--dev)
            START_DEV=true
            shift
            ;;
        -t|--test)
            RUN_TESTS=true
            shift
            ;;
        -s|--skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
done

# ============================================
# Main Execution
# ============================================

print_header

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found!"
    print_info "Please run this script from the project root directory"
    exit 1
fi

# Run initialization steps
if [ "$SKIP_CHECKS" = false ]; then
    check_dependencies
fi

install_npm_dependencies
check_env_file
run_linter
run_type_check

# Optional: Run tests
if [ "$RUN_TESTS" = true ]; then
    run_tests
fi

# Show summary if not starting dev server
if [ "$START_DEV" = false ]; then
    show_summary
fi

# Optional: Start dev server
if [ "$START_DEV" = true ]; then
    start_dev_server
fi

exit 0
