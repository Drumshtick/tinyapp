const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.set('view engine', 'ejs');
const lengthOfMiniURL = 6;
/*
=================================================================================
************************************Databases************************************
=================================================================================
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

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "123"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "asd"
  }
}
/*
=================================================================================
**************************************GET****************************************
=================================================================================
*/
app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls', (req, res) => {
  const userID = req.cookies.user_id;
  if (userID === undefined) {
    res.redirect('/no_cred');
  } else if (userID) {
    const templateVars = { 
      userObj: users[userID],
      urls: filterURLsByID(urlDatabase, userID),
    };
    res.render('urls_index', templateVars);
  }
});


app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls/new', (req, res) => {
  if (req.cookies.user_id === undefined) {
    res.redirect('/login');
  } else if (req.cookies.user_id) {
    const templateVars = {userObj: users[req.cookies.user_id],};
    res.render('urls_new', templateVars);
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const userCookie = req.cookies.user_id;
  if (!userCookie) {
    res.redirect('/no_cred')
  } else if (userCookie !== urlDatabase[req.params.shortURL].userID) {
    res.redirect('/not_auth');
  } else if (userCookie === urlDatabase[req.params.shortURL].userID) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      userObj: users[userCookie],
    };
    res.render('urls_show', templateVars);
  }
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.get('/register', (req, res) => {
  const templateVars = {
    userObj: users[req.cookies.user_id],
  };
  res.render('register', templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = {
    userObj: users[req.cookies.user_id],
  };
  res.render('login', templateVars);
});

app.get('/no_cred', (req, res) => {
  const userID = req.cookies.user_id;
  const templateVars = {
    userObj: users[userID],
  };
  res.render('no_cred', templateVars);
});

app.get('/not_auth', (req, res) => {
  const userCookie = req.cookies.user_id;
  const templateVars = {userObj: users[userCookie]};
  res.render('not_auth', templateVars);
});

/*
=================================================================================
**1************************************POST***************************************
=================================================================================
*/
app.post('/urls', (req, res) => {
  if (req.cookies.user_id === undefined) {
    res.sendStatus(403);
  } else if (req.cookies.user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.cookies.user_id
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const userCookie = req.cookies.user_id;
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.sendStatus(404);
    res.redirect('/urls');
  } else if (userCookie !== urlDatabase[req.params.shortURL].userID) {
    res.sendStatus(403);
    res.redirect('/urls');
  } else if (userCookie === urlDatabase[req.params.shortURL].userID) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }
});

app.post('/urls/:shortURL/edit', (req, res) => {
  const userCookie = req.cookies.user_id;
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.sendStatus(404);
    res.redirect('/urls');
  } else if (userCookie !== urlDatabase[req.params.shortURL].userID) {
    res.sendStatus(403);
    res.redirect('/urls');
  } else if (userCookie === urlDatabase[req.params.shortURL].userID) {
    const shortURL = req.params.shortURL;
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post('/urls/:shortURL/updated', (req, res) => {
  const userCookie = req.cookies.user_id;
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.sendStatus(404);
    res.redirect('/urls');
  } else if (userCookie !== urlDatabase[req.params.shortURL].userID) {
    res.sendStatus(403);
    res.redirect('/urls');
  } else if (userCookie === urlDatabase[req.params.shortURL].userID) {
    const newLongURL = req.body.longURL;
    const shortURL = req.params.shortURL;
    urlDatabase[shortURL].longURL = newLongURL;
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.sendStatus(400);
  } else if (!verifyNewEmail(users, email)) {
    const userID = getUserID(users, email);
    if (users[userID].password === password) {  // users[userID] === undefined ERROR
      res.cookie('user_id', userID);
      res.redirect('/urls');
    } else if (users[userID].password !== password) {
      res.sendStatus(403);
    }
  } else if (verifyNewEmail(users, email)) {
    res.sendStatus(403);
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.sendStatus(400);
  } else if (verifyNewEmail(users, email)) {
    const userEmail = email.toLowerCase();
    const userPassword = password;
    const userId = generateRandomString();
    const userObj = {
      id: userId,
      email: userEmail,
      password: userPassword,
    };
    users[userId] = userObj;
    res.cookie('user_id', userId);
    res.redirect('/urls');
  } else if (!verifyNewEmail(users, email)) {
    res.sendStatus(400);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
/*
=================================================================================
********************************Helper Functions*********************************
=================================================================================
*/
const generateRandomString = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let miniURL = '';
  for (let i = 0; i < lengthOfMiniURL; i++) {
    miniURL += chars[Math.floor(Math.random() * chars.length)];
  }
  return miniURL;
};

const verifyNewEmail = (database, email) => {
  for (const user in database) {
    if (database[user]['email'] === email.toLowerCase()) {
      return false;
    }
  }
  return true;
};

const getUserID = (database, email) => {
  for (const user in database) {
    if (database[user].email === email.toLowerCase()) {
      return user;
    }
  }
  return null;
};

const filterURLsByID = (database, id) => {
  const filtered = {};
  for (const url in database) {
    if (database[url].userID === id) {
      filtered[url] = database[url];
    }
  }
  return filtered;
};