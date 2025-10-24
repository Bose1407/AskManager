"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck - Mongoose type inference issues
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const User_1 = __importDefault(require("../models/User"));
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/api/auth/google/callback';
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth credentials not configured');
}
passport_1.default.serializeUser((user, done) => {
    done(null, user._id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await User_1.default.findById(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        // Check if user already exists by googleId or email
        let user = (await User_1.default.findOne({ googleId: profile.id }));
        if (!user) {
            const email = ((_c = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) === null || _c === void 0 ? void 0 : _c.toLowerCase()) || '';
            if (email) {
                user = (await User_1.default.findOne({ email }));
            }
        }
        if (user) {
            // If linking Google to existing local account
            if (!user.googleId) {
                user.googleId = profile.id;
                user.profilePhoto = user.profilePhoto || ((_e = (_d = profile.photos) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.value) || '';
                await user.save();
            }
            return done(null, user);
        }
        // Create new user with role from session (set in /google route)
        const roleFromSession = ((_f = req.session) === null || _f === void 0 ? void 0 : _f.oauthRole) || 'employee';
        user = (await User_1.default.create({
            googleId: profile.id,
            email: ((_h = (_g = profile.emails) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.value) || '',
            name: profile.displayName || 'User',
            profilePhoto: ((_k = (_j = profile.photos) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.value) || '',
            role: ['manager', 'employee', 'admin'].includes(roleFromSession) ? roleFromSession : 'employee',
        }));
        done(null, user);
    }
    catch (error) {
        done(error, undefined);
    }
}));
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map