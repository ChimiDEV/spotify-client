const Session = require('./api/Session');
const Search = require('./api/Search');
const User = require('./api/User');
const Playlist = require('./api/Playlist');

class SpotifyClient {
  constructor(clientID, clientSecret, locale, scopes, redirectURL) {
    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.baseURL = 'https://api.spotify.com/v1';
    if (scopes && redirectURL) {
      this.Session = new Session(this, clientID, clientSecret, scopes, redirectURL);
    }
    this.Search = new Search(this, locale);
    this.User = new User(this);
    this.Playlist = new Playlist(this, locale);
  }

  initSession(scopes, redirectURL) {
    this.Session = new Session(this, clientID, clientSecret, scopes, redirectURL);
  }
}

module.exports = SpotifyClient;
