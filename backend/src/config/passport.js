const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User, UserProgress } = require('../db');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://magicminds.up.railway.app/api/auth/google/callback",
  proxy: true
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ where: { googleId: profile.id } });

      if (user) {
        return done(null, user);
      }

      // Check if user exists by email (to link accounts)
      const email = profile.emails[0].value;
      user = await User.findOne({ where: { email } });

      if (user) {
        // Link googleId to existing user
        user.googleId = profile.id;
        await user.save();
        return done(null, user);
      }

      // Create new user
      user = await User.create({
        googleId: profile.id,
        email: email,
        name: profile.displayName,
        country: 'US', // Default or try to parse from profile
        password_hash: null // No password for OAuth users
      });

      // Create initial progress
      await UserProgress.create({ user_id: user.id });

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

module.exports = passport;
