// @ts-check
const assert = require("assert");
const candyget = require("candyget");
const spotifyUrlInfo = (() => {
  try{
    return require("spotify-url-info");
  }
  catch{
    return null;
  }
})();

if(spotifyUrlInfo && !process.env.CI){
  const spotifyClient = spotifyUrlInfo((url, init) => candyget(url, "string", init).then(r => ({text: () => r.body})));

  describe("#Spotify Playlist", function(){
    it("#0,1,2 is ok", async function(){
      const [zero, one, two] = await spotifyClient.getTracks("https://open.spotify.com/playlist/37i9dQZF1DX10JY0qJoWDu");
      assert.equal(zero.artist, "Kristen Bell, Agatha Lee Monn, Katie Lopez");
      assert.equal(zero.duration, 206506);
      assert.equal(zero.name, "Do You Want to Build a Snowman? - From \"Frozen\"/Soundtrack Version");
      assert.equal(zero.uri, "spotify:track:2yi7HZrBOC4bMUSTcs4VK6");
      assert.equal(one.artist, "DCappella");
      assert.equal(one.duration, 97573);
      assert.equal(one.name, "Deck the Halls");
      assert.equal(one.uri, "spotify:track:5jtvS4uu9odCpRC4XvI29B");
      assert.equal(two.artist, "Josh Gad");
      assert.equal(two.duration, 110986);
      assert.equal(two.name, "In Summer - From \"Frozen\"/Soundtrack Version");
      assert.equal(two.uri, "spotify:track:7bG6SQBGZthPDG5QJL5Gf7");
    });
  });

  describe("#Spotify Track", function(){
    it("Track info is ok", async function(){
      const data = await spotifyClient.getData("https://open.spotify.com/track/04l3avgEnp0ZfuYbbA6FRD");
      assert.equal(data.type, "track");
      assert.equal(data.name, "ジャックポットチャンス");
      assert.equal(data.uri, "spotify:track:04l3avgEnp0ZfuYbbA6FRD");
      assert.equal(data.id, "04l3avgEnp0ZfuYbbA6FRD");
      assert.equal(data.title, "ジャックポットチャンス");
      assert.deepEqual(data.artists, [
        {
          name: "をとは",
          uri: "spotify:artist:4vFZAUVnDZBvqR4mIJF26K",
        },
        {
          name: "Neko Hacker",
          uri: "spotify:artist:2aQ9IoRPwXEhhBVj4wbS46"
        }
      ]);
      var _a;
      assert.equal(typeof ((_a = data.coverArt.sources[0]) ? _a.url : void 0), "string");
      assert.equal(data.duration, 187000);
      assert.equal(data.maxDuration, 187000);
    });
  });
}
