const { OAuth2Client } = require('google-auth-library');

// Keep the client instance private to this file
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);

class GoogleAuth {
  
  static async verifyCode(authorizationCode) {

    const { tokens } = await oAuth2Client.getToken(authorizationCode);
    
    // 2. Verify the ID Token integrity
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    // 3. Return a clean profile object
    return {
      googleId: payload['sub'],
      email: payload['email'],
      name: payload['name'],
      picture: payload['picture']
    };
  }
}

module.exports = GoogleAuth;
