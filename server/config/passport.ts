// @ts-nocheck - Mongoose type inference issues
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/api/auth/google/callback';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️  Google OAuth credentials not configured');
}

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id) as any;
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists by googleId or email
        let user = (await User.findOne({ googleId: profile.id })) as any;

        if (!user) {
          const email = profile.emails?.[0]?.value?.toLowerCase() || '';
          if (email) {
            user = (await User.findOne({ email })) as any;
          }
        }

        if (user) {
          // If linking Google to existing local account
          if (!user.googleId) {
            user.googleId = profile.id;
            user.profilePhoto = user.profilePhoto || profile.photos?.[0]?.value || '';
            await user.save();
          }
          return done(null, user);
        }

        // Create new user with role from session (set in /google route)
        const roleFromSession = req.session?.oauthRole || 'employee';
        user = (await User.create({
          googleId: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || 'User',
          profilePhoto: profile.photos?.[0]?.value || '',
          role: ['manager', 'employee', 'admin'].includes(roleFromSession) ? roleFromSession : 'employee',
        })) as any;

        done(null, user);
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  )
);

export default passport;
