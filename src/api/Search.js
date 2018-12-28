const request = require('request-promise-native');

/**
 * Utilizes the Search API of Spotify to search for tracks, artists, albums, playlists, ...
 */
class Search {
  constructor(client, locale) {
    this._client = client;
    this.locale = locale;
  }

  async query(q, types, limit = 20, offset = 0) {
    if (!this._client.Session) {
      throw new Error('No Session has been initialized');
    }

    const url = `${this._client.baseURL}/search?q=${encodeURIComponent(q)}&type=${types.join(
      '%2C'
    )}&market=${this.locale}&limit=${limit}&offset=${offset}`;
    const options = {
      url,
      method: 'GET',
      auth: this._client.Session.getClientAuthDetails()
    };
    try {
      const response = await request(options);
      const { tracks, artists, albums, playlists } = JSON.parse(response);
      return Promise.resolve({ tracks, artists, albums, playlists });
    } catch (err) {
      return this._client.Session.refreshedRetryClient(options);
    }
  }
}

module.exports = Search;
