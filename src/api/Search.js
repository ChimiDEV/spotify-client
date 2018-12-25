const request = require('request-promise-native');

/**
 * Utilizes the Search API of Spotify to search for tracks, artists, albums, playlists, ...
 */
class Search {
  constructor(client, locale) {
    this._client = client;
    this.locale = locale;
    this.baseURL = 'https://api.spotify.com/v1';
  }

  async query(q, types, limit = 20, offset = 0) {
    const url = `${this.baseURL}/search?q=${encodeURIComponent(q)}&type=${types.join('%2C')}&market=${this.locale}&limit=${limit}&offset=${offset}`;
    const options = {
      url,
      method: 'GET',
      auth: {
        bearer: this._client.Session.clientAccessToken
      }
    };
    try {
      const response = await request(options);
      return Promise.resolve(JSON.parse(response));
    } catch (err) {
      return this._client.Session.refreshedRetryClient(options);
    }
  }
}

module.exports = Search;