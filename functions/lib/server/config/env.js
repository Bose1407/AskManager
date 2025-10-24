"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = validateEnvironment;
// Environment variable validation
function validateEnvironment() {
    var _a;
    const required = [
        'MONGODB_URI',
        'SESSION_SECRET',
    ];
    const missing = [];
    for (const key of required) {
        if (!process.env[key] || ((_a = process.env[key]) === null || _a === void 0 ? void 0 : _a.trim()) === '') {
            missing.push(key);
        }
    }
    // Warn if OAuth is not configured (but don't fail)
    const oauthVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
    const missingOAuth = oauthVars.filter(key => { var _a; return !process.env[key] || ((_a = process.env[key]) === null || _a === void 0 ? void 0 : _a.trim()) === ''; });
    if (missingOAuth.length > 0) {
        console.warn('⚠️  Warning: Google OAuth is not configured. Only email/password login will work.');
        console.warn(`   Missing: ${missingOAuth.join(', ')}`);
    }
    if (missing.length > 0) {
        console.error('❌ Environment validation failed!');
        console.error(`   Missing required variables: ${missing.join(', ')}`);
        console.error('   Please create a .env file with all required variables.');
        process.exit(1);
    }
    // Validate MongoDB URI format
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
        console.error('❌ Invalid MONGODB_URI format. Must start with mongodb:// or mongodb+srv://');
        process.exit(1);
    }
    // Warn if SESSION_SECRET is weak
    const sessionSecret = process.env.SESSION_SECRET;
    if (sessionSecret.length < 32) {
        console.warn('⚠️  Warning: SESSION_SECRET is too short. Use at least 32 characters for production.');
    }
    console.log('✅ Environment variables validated successfully');
}
//# sourceMappingURL=env.js.map