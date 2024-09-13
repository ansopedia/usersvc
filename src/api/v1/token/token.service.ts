import { generateTokenForAction, verifyJWTToken } from '@/utils';
import { TokenDAL } from './token.dal';
import { CreateToken, Token, TokenAction } from './token.validation';
import { ErrorTypeEnum, FIVE_MINUTES_IN_MS } from '@/constants';
import { isPast } from 'date-fns';

export class TokenService {
  private tokenDAL: TokenDAL;

  constructor() {
    this.tokenDAL = new TokenDAL();
  }

  async createActionToken(userId: string, action: TokenAction) {
    const token = generateTokenForAction({ userId, action });

    const tokenPayload: CreateToken = {
      userId,
      action,
      token,
      expiryTime: new Date(Date.now() + FIVE_MINUTES_IN_MS),
    };

    await this.tokenDAL.replaceTokenForUser(tokenPayload);
    return token;
  }

  async verifyActionToken(token: string, action: TokenAction): Promise<Token> {
    const verifiedToken = await verifyJWTToken<Token>(token, 'action');

    // Check if the token is valid for the intended action
    // e.g. if the token is for changing subscription, then the action must be changeSubscription
    if (verifiedToken.action !== action) {
      throw new Error(ErrorTypeEnum.enum.INVALID_TOKEN_TYPE);
    }

    const storedToken = await this.tokenDAL.getToken(token);

    if (!storedToken) {
      throw new Error(ErrorTypeEnum.enum.INVALID_ACCESS);
    }

    if (storedToken.isUsed || isPast(storedToken.expiryTime)) {
      throw new Error(ErrorTypeEnum.enum.TOKEN_EXPIRED);
    }

    return verifiedToken;
  }

  async markTokenAsUsed(token: string) {
    const storedToken = await this.tokenDAL.getToken(token);

    if (!storedToken) {
      throw new Error(ErrorTypeEnum.enum.INVALID_ACCESS);
    }

    storedToken.isUsed = true;
    await this.tokenDAL.updateToken(storedToken.id as string, storedToken);
  }

  // Method to handle rate-limiting and request attempts
  // async handleRateLimiting(userId: string, tokenType: Token['tokenType']) {
  //   const tokens = await this.tokenDAL.getTokensByUserId(userId);

  //   const relevantTokens = tokens?.filter((token) => token.tokenType === tokenType);

  //   if (relevantTokens?.length && relevantTokens.length > 5) {
  //     // For example, max 5 attempts
  //     throw new Error(ErrorTypeEnum.enum.RATE_LIMIT_EXCEEDED);
  //   }

  //   // You can also set a specific timeframe for the token requests (e.g., 5 tokens in 1 hour)
  // }
}