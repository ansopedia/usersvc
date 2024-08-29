import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { envConstants } from '../constants';

export const signInWithGoogle = (req: Request, res: Response, next: NextFunction) => {
  const redirectUrl = req.query.redirectUrl;

  const state =
    typeof redirectUrl === 'string' && redirectUrl.length > 0 ? Buffer.from(redirectUrl).toString('base64') : undefined;

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state,
  })(req, res, next);
};

export const signInWithGoogleCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${envConstants.CLIENT_URL}/login?error=failed`,
  })(req, res, next);
};