// api global variables
let client_id = '';
let client_secret = '';
let url = 'https://accounts.spotify.com/api/token'
let token = '';
//game global variables
let currentArtist1 = '';
let currentArtist2 = '';
let globalGameType = 0;
let score = 0;

async function authorizeAttempt () {
    token = await acquireToken();
    if (!token) {
        return;
    }
    localStorage.setItem("token", token);
    location.href = "game.html";
}

const acquireToken = async function () {
    client_id = document.getElementById("clientId").value
    client_secret = document.getElementById("clientSecret").value
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Authorization' : 'Basic ' + btoa(client_id +':' + client_secret)
        },
        body: 'grant_type=client_credentials'
    });
    if (res.ok) {
        console.log('success')
    } else {
        console.log('fail')
        alert("Invalid Credentials")
        return false;
    }
    const data = await res.json()
    console.log(data)
    return data.access_token
}

async function getCategories () {
    let token = getTokenFromLocalStorage();
    try {
        const res = await fetch('https://api.spotify.com/v1/browse/categories?limit=50&',  {
            method: 'GET',
            headers: {
                'Authorization' : 'Bearer ' + token
            }
         });
        const data = await res.json();
        return data.categories.items;
    } catch (err) {
        console.log(err);
    }
}

async function getGenrePlaylists (genreId) {
    let token = getTokenFromLocalStorage();
    try {
        const res = await fetch('https://api.spotify.com/v1/browse/categories/' + genreId + '/playlists?limit=50&', {
            method: 'GET',
            headers: {
                'Authorization' : 'Bearer ' + token
            }
        });
        const data = await res.json();
        //console.log(data);
        return data.playlists.items;
    } catch(err) {
        console.log(err);
    }
}

async function getPlaylistTracks(playlistId) {
    let token = getTokenFromLocalStorage();
    try {
        const res = await fetch('https://api.spotify.com/v1/playlists/' + playlistId + '/tracks?limit=50&', {
            method: 'GET',
            headers: {
                'Authorization' : 'Bearer ' + token
            }
        });
        const data = await res.json();
        //console.log(data);
        return data.items;
    } catch(err) {
        console.log(err);
    }
}

async function getArtist(artistId) {
    let token = getTokenFromLocalStorage();
    try {
        const res = await fetch('https://api.spotify.com/v1/artists/' + artistId, {
            method: 'GET',
            headers: {
                'Authorization' : 'Bearer ' + token
            }
        });
        const data = await res.json();
        //console.log(data);
        return data;
    } catch(err) {
        console.log(err);
    }
}

async function getARandomArtistHelper (gameType) { //1 - top hits 2 - singe random 3 -- all genres
    let token = getTokenFromLocalStorage();
    try {
        let genres = await getCategories();
        let genreIndex = 1;
        if (gameType == 1) {
            genreIndex = 0;
        } else if (gameType == 2) {
            if (localStorage.getItem("oneRandomGenre") === null) {
                genreIndex = randomIntFromInterval(0, 49);
                localStorage.setItem("oneRandomGenre", genreIndex);
                localStorage.setItem("randomGenreType", genres[genreIndex].name);
            } else {
                genreIndex = (localStorage.getItem("oneRandomGenre"));
            }
        } else if (gameType == 3) {
            genreIndex = randomIntFromInterval(0, 49); //0 to 49
        }
        console.log('genreIndex ' + genreIndex);
        console.log(genres[genreIndex]);
        let currGenreId = genres[genreIndex].id;

        let playlists = await getGenrePlaylists(currGenreId); // size of playlists may not necessarily be 49.. could be less //[array].length
        let playlistIndex = randomIntFromInterval(0, playlists.length-1);
        //console.log('playlistindex ' + playlistIndex);
        //console.log(playlists[playlistIndex]);
        if (playlists.length == 0) {
            console.log('hi');
            return;
        }
        let currPlaylistId = playlists[playlistIndex].id;

        let tracks = await getPlaylistTracks(currPlaylistId);
        let trackIndex = randomIntFromInterval(0, tracks.length-1);
        //console.log('trackindex ' + trackIndex);
        //console.log(tracks[trackIndex]);
        let artistId = tracks[trackIndex].track.artists[0].id;

        let artist = await getArtist(artistId);
        return artist;
    } catch (err) {
        console.log(err);
    }
}

async function getARandomArtist(gameType) {
    let x = 0;
    let found = false;
    while (!found) {
        try {
            if (x > 10) {
                alert("Error: Token Expired. Please Log-in Again");
                break;
            }
            let artist = await getARandomArtistHelper(gameType);
            //console.log(artist.name + " " + artist.popularity);
            if (artist != null) {
                found = true;
                return artist;   
            }  
        } catch (err) {
            console.log('error in here! ' + found);
            console.log(err);
        } finally {
            x++;
        }
    }
}

// note - hip hop index is 10, pop is 2
async function start (gameType) {
    score = 0;
    globalGameType = gameType;
    if (gameType == 2) {
        localStorage.removeItem("oneRandomGenre");
    }
    hideStartMenu();
    let artist1 = await getARandomArtist(gameType);
    let artist2 = await getARandomArtist(gameType);
    while (artist1.id == artist2.id) {
        artist2 = await getARandomArtist(gameType);
    }
    const gameInterfaceDiv = document.getElementById("gamePlaying").style;
    gameInterfaceDiv.display ="flex";
    currentArtist1 = artist1;
    currentArtist2 = artist2;
    if (gameType == 1) {
        document.getElementById("currentGenre").innerHTML = "Genre: Top Hits";
    } else if (gameType == 2) {
        let randGenre = localStorage.getItem("randomGenreType")
        document.getElementById("currentGenre").innerHTML = "Genre: " + randGenre;
    } else if (gameType == 3) {
         document.getElementById("currentGenre").innerHTML = "Genre: All!";
    }
    //console.log(artist1.name + " " + artist1.popularity);
    //console.log(artist2.name + " " + artist2.popularity);
    //console.log(artist1.popularity > artist2.popularity);
    document.getElementById("artist1Image").src = artist1.images[0].url;
    document.getElementById("artist2Image").src = artist2.images[0].url;
    document.getElementById("artist1Name").value = artist1.name;
    document.getElementById("artist2Name").value = artist2.name;
    document.getElementById("artist1Popularity").innerHTML = "Popularity: " + artist1.popularity;
    document.getElementById("gameScore").innerHTML = "Score: " + score;
}

async function userGuessedArtist1 () {
    animatePopularityHelper();
    setTimeout(userGuessedArtist1Aux, 1250);
}

async function userGuessedArtist1Aux () {
    if (currentArtist1.popularity >= currentArtist2.popularity) {
        console.log('Correct!')
        await userGuessedCorrect();
    } else {
        console.log('Wrong!');
        await userGuessedWrong();
    }
}

async function userGuessedArtist2 () {
    animatePopularityHelper();
    setTimeout(userGuessedArtist2Aux, 1250);
}

async function userGuessedArtist2Aux () {
    if (currentArtist2.popularity >= currentArtist1.popularity) {
        console.log('Correct!')
        await userGuessedCorrect();
    } else {
        console.log('Wrong!');
        await userGuessedWrong();
    }
}

async function userGuessedCorrect() {
    document.getElementById("artist2Popularity").style.color = "green";
    score++;

    //make artist 2 artist 1, get new artist 2
    currentArtist1 = currentArtist2;
    let newArtist2 = await getARandomArtist(globalGameType);
    while (currentArtist1.id == newArtist2.id) {
        newArtist2 = await getARandomArtist(globalGameType);
    }
    currentArtist2 = newArtist2;

    // change artist 1 attributes to those of artist 2
    document.getElementById("artist1Image").src = currentArtist1.images[0].url;
    document.getElementById("artist1Name").value = currentArtist1.name;
    document.getElementById("artist1Popularity").innerHTML = "Popularity: " + currentArtist1.popularity;

    // change artist 2 attributes to new artist
    document.getElementById("artist2Image").src = currentArtist2.images[0].url;
    document.getElementById("artist2Name").value = currentArtist2.name;
    document.getElementById("artist2Popularity").innerHTML = "Popularity: " + currentArtist2.popularity;

    //update game score and make artist 2 popularity invisible
    document.getElementById("gameScore").innerHTML = "Score: " + score;
    document.getElementById("artist2Popularity").style.display = "none";
    document.getElementById("artist2Popularity").style.color = "white";
}

async function userGuessedWrong() {
    document.getElementById("artist2Popularity").style.color = "red";
    setTimeout(userGuessedWrongAux, 250);
}

async function userGuessedWrongAux() {
    if (score == 0) {
        document.getElementById("scoreCommentary").innerHTML = "Yikes.";
        document.getElementById("scoreCommentary").style.color = "darkred";
    } else if (score <= 4) {
        document.getElementById("scoreCommentary").innerHTML = "Meh. You can do better.";
        document.getElementById("scoreCommentary").style.color = "orangered";
    } else if (score <= 8) {
        document.getElementById("scoreCommentary").innerHTML = "Pretty Good.";
        document.getElementById("scoreCommentary").style.color = "darkblue";
    } else if (score <= 12) {
        document.getElementById("scoreCommentary").innerHTML = "Nice Job!";
        document.getElementById("scoreCommentary").style.color = "indigo";
    } else {
        document.getElementById("scoreCommentary").innerHTML = "Master!";
        document.getElementById("scoreCommentary").style.color = "gold";
    }
    const scoreDiv = document.getElementById("menuTitle").innerHTML = "Score: " + score;
    const gameInterfaceDiv = document.getElementById("gamePlaying").style;
    gameInterfaceDiv.display ="none";
    const targetDiv = document.getElementById("gameMenu").style;
    targetDiv.opacity = 1;
    targetDiv.display = "flex";
    document.getElementById("artist2Popularity").style.display = "none";
    document.getElementById("artist2Popularity").style.color = "white";
}

function animatePopularityHelper() {
    document.getElementById("artist2Popularity").style.display = "block";
    animatePopularity(document.getElementById("artist2Popularity"), 0, currentArtist2.popularity, 1000);
}

function animatePopularity(obj, start, end, duration) {
    let startTime = null;
    const step = timestamp =>{
        if(!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        obj.innerHTML = "Popularity: " + Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

function getTokenFromLocalStorage () {
    return (localStorage.getItem("token"));
}

function hideStartMenu() {
    const targetDiv = document.getElementById("gameMenu").style;
    targetDiv.opacity = 1;
   (function fade(){(targetDiv.opacity-=.1)<0?targetDiv.display="none":setTimeout(fade,40)})();
    console.log("try");
}