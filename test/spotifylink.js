async function expandSpotify(url) {
  const UA =  {
    "mode": "cors",
    "headers": {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.104 Safari/537.36"
    }
  };
  /**
   * 1段階目のリダイレクトを取得
   */
  const firstRedirect = await fetch(url, UA);
  /**
   * 2段階目のリダイレクトを取得
   */
  const spotifyPage = await fetch(firstRedirect.url, UA);
  console.log("Console: " + spotifyPage.url);
  return spotifyPage.url;
}

const result = expandSpotify("https://spotify.link/hOw0HcMUXyb");

console.log("Result: " + result);
