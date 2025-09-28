import "./App.css";
import {
  FormControl,
  InputGroup,
  Container,
  Button,
  Card,
  Row,
} from "react-bootstrap";
import { useState, useEffect } from "react";

const clientId = import.meta.env.VITE_CLIENT_ID;
const clientSecret = import.meta.env.VITE_CLIENT_SECRET;

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    let authParams = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body:
        "grant_type=client_credentials&client_id=" +
        clientId +
        "&client_secret=" +
        clientSecret,
    };

    fetch("https://accounts.spotify.com/api/token", authParams)
      .then((result) => result.json())
      .then((data) => {
        setAccessToken(data.access_token);
      });
  }, []);

  async function search() {
    if (!searchInput) return;

    let artistParams = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };

    const artistID = await fetch(
      `https://api.spotify.com/v1/search?q=${searchInput}&type=artist`,
      artistParams
    )
      .then((result) => result.json())
      .then((data) => data.artists.items[0].id);

    const albumData = await fetch(
      `https://api.spotify.com/v1/artists/${artistID}/albums?include_groups=album&market=US&limit=50`,
      artistParams
    )
      .then((result) => result.json())
      .then((data) => data.items);

    const albumsWithPlaytime = await Promise.all(
      albumData.map(async (album) => {
        const tracksData = await fetch(
          `https://api.spotify.com/v1/albums/${album.id}/tracks?market=US&limit=50`,
          artistParams
        ).then((res) => res.json());

        const totalMs = tracksData.items.reduce(
          (sum, track) => sum + track.duration_ms,
          0
        );
        const minutes = Math.floor(totalMs / 60000);
        const seconds = Math.floor((totalMs % 60000) / 1000);
        return { ...album, playtime: `${minutes}m ${seconds}s` };
      })
    );

    setAlbums(albumsWithPlaytime);
  }

  return (
    <>
      <Container>
        <InputGroup>
          <FormControl
            placeholder="Search For Artist"
            type="input"
            aria-label="Search for an Artist"
            onKeyDown={(event) => {
              if (event.key === "Enter") search();
            }}
            onChange={(event) => setSearchInput(event.target.value)}
            style={{
              width: "300px",
              height: "35px",
              borderWidth: "0px",
              borderStyle: "solid",
              borderRadius: "5px",
              marginRight: "10px",
              paddingLeft: "10px",
            }}
          />
          <Button
            onClick={search}
            style={{
              backgroundColor: "#1DB954",
              color: "white",
              fontWeight: "bold",
              fontSize: "15px",
              borderRadius: "5px",
              padding: "10px",
            }}
          >
            Search
          </Button>
        </InputGroup>
      </Container>

      <Container>
        <Row
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-around",
            alignContent: "center",
          }}
        >
          {albums.map((album, index) => (
            <Card
              key={album.id}
              className="album-card show"
              style={{
                backgroundColor: "#1e1e1e",
                color: "white",
                margin: "10px",
                borderRadius: "5px",
                marginBottom: "30px",
                transitionDelay: `${index * 0.05}s`, // smooth stagger
              }}
            >
              <Card.Img
                width={200}
                src={album.images[0].url}
                style={{ borderRadius: "4%" }}
              />
              <Card.Body>
                <Card.Title
                  style={{
                    whiteSpace: "wrap",
                    fontWeight: "bold",
                    maxWidth: "200px",
                    fontSize: "18px",
                    marginTop: "10px",
                    color: "white",
                  }}
                >
                  {album.name}
                </Card.Title>
                <Card.Text style={{ color: "#ccc" }}>
                  Playtime: {album.playtime} <br />
                  Release Date: {album.release_date}
                </Card.Text>
                <Button
                  href={album.external_urls.spotify}
                  style={{
                    backgroundColor: "#1DB954",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "15px",
                    borderRadius: "5px",
                    padding: "10px",
                  }}
                >
                  Album Link
                </Button>
              </Card.Body>
            </Card>
          ))}
        </Row>
      </Container>
    </>
  );
}

export default App;