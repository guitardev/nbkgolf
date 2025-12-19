#!/bin/bash

# Migration script to restructure app directory for i18n support
# This script moves existing pages to the [locale] directory structure

echo "🚀 Starting i18n migration..."

# Create [locale] directory structure
mkdir -p src/app/\[locale\]/dashboard/players
mkdir -p src/app/\[locale\]/dashboard/courses
mkdir -p src/app/\[locale\]/dashboard/tournaments
mkdir -p src/app/\[locale\]/register

# Move existing pages (keeping API routes at root)
echo "📦 Moving pages to [locale] directory..."

# Move root page
if [ -f "src/app/page.tsx" ]; then
  mv src/app/page.tsx src/app/\[locale\]/page.tsx
  echo "✅ Moved page.tsx"
fi

# Move dashboard pages
if [ -f "src/app/dashboard/page.tsx" ]; then
  mv src/app/dashboard/page.tsx src/app/\[locale\]/dashboard/page.tsx
  echo "✅ Moved dashboard/page.tsx"
fi

if [ -f "src/app/dashboard/players/page.tsx" ]; then
  mv src/app/dashboard/players/page.tsx src/app/\[locale\]/dashboard/players/page.tsx
  echo "✅ Moved dashboard/players/page.tsx"
fi

if [ -f "src/app/dashboard/courses/page.tsx" ]; then
  mv src/app/dashboard/courses/page.tsx src/app/\[locale\]/dashboard/courses/page.tsx
  echo "✅ Moved dashboard/courses/page.tsx"
fi

if [ -f "src/app/dashboard/tournaments/page.tsx" ]; then
  mv src/app/dashboard/tournaments/page.tsx src/app/\[locale\]/dashboard/tournaments/page.tsx
  echo "✅ Moved dashboard/tournaments/page.tsx"
fi

# Move register page
if [ -f "src/app/register/page.tsx" ]; then
  mv src/app/register/page.tsx src/app/\[locale\]/register/page.tsx
  echo "✅ Moved register/page.tsx"
fi

# Clean up empty directories
echo "🧹 Cleaning up empty directories..."
rmdir src/app/dashboard/players 2>/dev/null || true
rmdir src/app/dashboard/courses 2>/dev/null || true
rmdir src/app/dashboard/tournaments 2>/dev/null || true
rmdir src/app/dashboard 2>/dev/null || true
rmdir src/app/register 2>/dev/null || true

echo "✨ Migration complete!"
echo ""
echo "⚠️  IMPORTANT: You need to update imports in the moved files:"
echo "   - Add 'use client' if using hooks"
echo "   - Import useTranslations from 'next-intl'"
echo "   - Replace hardcoded strings with translation keys"
echo ""
echo "📝 Next steps:"
echo "   1. Update each page with translations"
echo "   2. Test routing: /en/dashboard, /th/dashboard"
echo "   3. Add LanguageSwitcher component"
