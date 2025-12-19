import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function verifySettings() {
    const required = [
        'LINE_CHANNEL_ID',
        'LINE_CHANNEL_SECRET',
        'GOOGLE_SERVICE_ACCOUNT_EMAIL',
        'GOOGLE_PRIVATE_KEY',
        'GOOGLE_SHEET_ID',
        'NEXT_PUBLIC_ADMIN_LINE_IDS',
    ];

    const optional = [
        'NEXT_PUBLIC_LINE_LIFF_ID', // Optional for development
    ];

    const missing: string[] = [];
    const warnings: string[] = [];

    // Check for missing required variables
    required.forEach((varName) => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach((varName) => {
            console.error(`   - ${varName}`);
        });
        process.exit(1);
    }

    // Check optional variables
    optional.forEach((varName) => {
        if (!process.env[varName]) {
            warnings.push(`${varName} is not set (optional for development)`);
        }
    });

    // Validate GOOGLE_PRIVATE_KEY format
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (privateKey && !privateKey.includes('BEGIN PRIVATE KEY')) {
        warnings.push('GOOGLE_PRIVATE_KEY appears malformed (missing BEGIN PRIVATE KEY header)');
    }

    // Validate admin IDs format
    const adminIds = process.env.NEXT_PUBLIC_ADMIN_LINE_IDS;
    if (adminIds) {
        const ids = adminIds.split(',').map(id => id.trim()).filter(Boolean);
        if (ids.length === 0) {
            warnings.push('NEXT_PUBLIC_ADMIN_LINE_IDS is empty');
        } else {
            console.log(`✅ Found ${ids.length} admin ID(s)`);
        }
    }

    // Display warnings
    if (warnings.length > 0) {
        console.warn('\n⚠️  Warnings:');
        warnings.forEach((warning) => {
            console.warn(`   - ${warning}`);
        });
    }

    // Success message
    if (missing.length === 0 && warnings.length === 0) {
        console.log('✅ All required environment variables are present and valid!');
    } else if (missing.length === 0) {
        console.log('\n✅ All required environment variables are present (with warnings)');
    }
}

verifySettings();
