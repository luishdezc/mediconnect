import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email: string, password: string, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          return done(null, false, { message: 'Correo no registrado' });
        }
        if (user.authType !== 'local') {
          return done(null, false, { message: 'Usa Google para iniciar sesión' });
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash || '');
        if (!isMatch) {
          return done(null, false, { message: 'Contraseña incorrecta' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.findOne({ email: profile.emails?.[0].value });
          if (user) {
            user.googleId = profile.id;
            user.authType = 'google';
            await user.save();
          } else {
            user = await User.create({
              name: profile.displayName,
              email: profile.emails?.[0].value,
              googleId: profile.id,
              authType: 'google',
              role: 'patient',
              avatar: profile.photos?.[0].value,
            });
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
