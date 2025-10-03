#!/bin/bash

# Script to update auth imports from old NextAuth/Clerk patterns to new Supabase auth

echo "Updating auth imports to use Supabase..."

# Find all TypeScript files in app/api
find app/api -name "*.ts" -type f | while read -r file; do
  echo "Processing: $file"

  # Replace old auth imports with new ones
  sed -i.bak \
    -e 's/import { auth } from "@\/lib\/auth"/import { getSession } from "@\/lib\/auth-helpers"/g' \
    -e 's/import { getServerSession } from "@\/lib\/auth"/import { getSession } from "@\/lib\/auth-helpers"/g' \
    -e 's/import { authOptions } from "@\/lib\/auth"//g' \
    -e 's/const session = await auth()/const session = await getSession()/g' \
    -e 's/const session = await getServerSession(authOptions)/const session = await getSession()/g' \
    -e 's/from '\''@\/lib\/auth'\''/from '\''@\/lib\/auth-helpers'\''/g' \
    -e 's/from "@\/auth"/from "@\/lib\/auth-helpers"/g' \
    "$file"

  # Remove backup file
  rm -f "${file}.bak"
done

echo "Auth imports updated successfully!"
echo "Note: Please review changes and test thoroughly."
