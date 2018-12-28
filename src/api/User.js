const request = require('request-promise-native');

/**
 * Class for using the user profile API of Spotify
 */
class User {
  constructor(client) {
    this._client = client;
  }

  async get(userid) {
    if (!this._client.Session) {
      throw new Error('No Session has been initialized');
    }

    const url = `${this._client.baseURL}/users/${userid}`;
    const options = {
      url,
      method: 'GET',
      auth: this._client.Session.getClientAuthDetails()
    };

    try {
      const response = await request(options);
      return Promise.resolve(JSON.parse(response));
    } catch (err) {
      return this._client.Session.refreshedRetryClient(options);
    }
  }

  async current() {
    if (!this._client.Session) {
      throw new Error('No Session has been initialized');
    }

    const url = `${this._client.baseURL}/me`;
    const options = {
      url,
      method: 'GET',
      auth: this._client.Session.getUserAuthDetails()
    };

    try {
      const response = await request(options);
      return Promise.resolve(JSON.parse(response));
    } catch (err) {
      return this._client.Session.refreshedRetryUser(options);
    }
  }
}

module.exports = User;
