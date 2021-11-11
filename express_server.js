const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { generateRandomString, verifyNewEmail, getUserByEmail, filterURLsByID, addProtocol } = require('./helpers');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['1L0V3C00K135'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.set('view engine', 'ejs');
/*
=================================================================================
************************************Databases************************************
=================================================================================
*/
/*
Initial entries for test users
and the database for shortened URLs
*/
const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "userRandomID"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "user2RandomID"
  }
};
/*
Password hashes for test users
*/
const user1Pass = bcrypt.hashSync('123', 10)
const user2Pass = bcrypt.hashSync('asd', 10)
/*
Database for registered users including test
users
*/
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: user1Pass,
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: user2Pass,
  }
}
/*
=================================================================================
**************************************GET****************************************
=================================================================================
*/
/*
Route for root
*/
app.get('/', (req, res) => {
  const { user_id } = req.session;
  if (!user_id) {
    res.redirect('/login');
  } else if (user_id) {
    res.redirect('/urls');
  }
});
/*
Route urls_index --- Lists all shortened urls
by the currently logged in user
*/
app.get('/urls', (req, res) => {
  const { user_id } = req.session;
  if (user_id === undefined) {
    res.redirect('/no_cred');
  } else if (user_id) {
    const templateVars = { 
      userObj: users[user_id],
      urls: filterURLsByID(urlDatabase, user_id),
    };
    res.render('urls_index', templateVars);
  }
});


app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls/new', (req, res) => {
  const { user_id } = req.session;
  if (user_id === undefined) {
    res.redirect('/login');
  } else if (user_id) {
    const templateVars = {userObj: users[user_id],};
    res.render('urls_new', templateVars);
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const { user_id } = req.session;
  const { shortURL } = req.params;
  const entryURL = urlDatabase[shortURL];
  if (!user_id) {
    res.redirect('/no_cred')
  } else if (!entryURL) {
    res.redirect('/not_found');
  } else if (user_id !== entryURL.userID) {
    res.redirect('/not_auth');
  } else if (user_id === entryURL.userID) {
    const templateVars = {
      shortURL,
      longURL: urlDatabase[shortURL].longURL,
      userObj: users[user_id],
    };
    res.render('urls_show', templateVars);
  }
});

app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.redirect('/not_found');
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(addProtocol(longURL));
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/register', (req, res) => {
  const { user_id } = req.session;
  if (user_id) {
    res.redirect('/urls')
  } else if (!user_id) {
    const templateVars = {
      userObj: users[user_id],
    };
    res.render('register', templateVars);
  }
});

app.get('/login', (req, res) => {
  const { user_id } = req.session;
  if (user_id) {
    res.redirect('/urls')
  } else if (!user_id) {
    const templateVars = {
      userObj: users[user_id],
    };
    res.render('login', templateVars);
  }
});

app.get('/no_cred', (req, res) => {
  const { user_id } = req.session;
  const templateVars = {
    userObj: users[user_id],
  };
  res.render('no_cred', templateVars);
});

app.get('/not_auth', (req, res) => {
  const { user_id } = req.session;
  const templateVars = {userObj: users[user_id]};
  res.render('not_auth', templateVars);
});

app.get('/not_found', (req, res) => {
  const { user_id } = req.session;
  const templateVars = {userObj: users[user_id]};
  res.render('shortURL_not_found', templateVars)
});

/*
=================================================================================
**1************************************POST***************************************
=================================================================================
*/
app.post('/urls', (req, res) => {
  const { user_id } = req.session;
  const { longURL } = req.body;
  if (user_id === undefined) {
    res.redirect(403, '/login');
  } else if (user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL,
      userID: user_id
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const { user_id } = req.session;
  const { shortURL } = req.params;
  if (urlDatabase[shortURL] === undefined) {
    res.redirect(404, '/urls');
  } else if (user_id !== urlDatabase[shortURL].userID) {
    res.sendStatus(403);
  } else if (user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }
});

app.post('/urls/:shortURL/edit', (req, res) => {
  const { user_id } = req.session;
  const { shortURL } = req.params;
  if (urlDatabase[shortURL] === undefined) {
    res.redirect(404, '/urls');
  } else if (user_id !== urlDatabase[shortURL].userID) {
    res.redirect(403, '/urls');
  } else if (user_id === urlDatabase[shortURL].userID) {
    res.redirect(`/urls/${shortURL}`);
  }
});
/*
The longURL edit form on urls_show POSTs to this branch
*/
app.post('/urls/:shortURL', (req, res) => {
  const { user_id } = req.session;
  const { shortURL } = req.params;
  if (urlDatabase[shortURL] === undefined) {
    res.redirect(404, '/urls');
  } else if (user_id !== urlDatabase[shortURL].userID) {
    res.redirect(403, '/urls');
  } else if (user_id === urlDatabase[shortURL].userID) {
    const newLongURL = req.body.longURL;
    urlDatabase[shortURL].longURL = newLongURL;
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.redirect(400, '/login');
  } else if (!verifyNewEmail(users, email)) {
    const userID = getUserByEmail(users, email);
    const hashMatch = bcrypt.compareSync(password, users[userID].password);
    if (hashMatch) {
      req.session.user_id = userID;
      res.redirect('/urls');
    } else if (!hashMatch) {
      res.redirect(403, '/login');
    }
  } else if (verifyNewEmail(users, email)) {
    res.redirect(403, '/login');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  const { email, password} = req.body;
  if (!email || !password) {
    res.redirect(400, '/register');
  } else if (verifyNewEmail(users, email)) {
    const userEmail = email.toLowerCase();
    const userPassword = bcrypt.hashSync(password, 10);
    const userID = generateRandomString();
    const userObj = {
      id: userID,
      email: userEmail,
      password: userPassword,
    };
    users[userID] = userObj;
    req.session.user_id = userID;
    res.redirect('/urls');
  } else if (!verifyNewEmail(users, email)) {
    res.redirect(400, '/register');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});