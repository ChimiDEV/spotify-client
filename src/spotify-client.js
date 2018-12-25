const request = require('request-promise-native');

const Session = require('./api/Session');
const Search = require('./api/Search');

class SpotifyClient {
  constructor(clientID, clientSecret, scopes, redirectURL, locale) {
    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.Session = new Session(this, clientID, clientSecret, scopes, redirectURL);
    this.Search = new Search(this, locale);
    this.baseURL = 'https://api.spotify.com/v1';
  }

  async userProfile() {
    const options = {
      method: 'GET',
      url: `${this.baseURL}/me`
    };
    try {
      const response = await request(options);
      return Promise.resolve(JSON.parse(response));
    } catch (err) {
      return this.refreshedRetryUser(options);
    }
  }

  async createPlaylist() {}
}

module.exports = SpotifyClient;