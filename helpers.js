/*
=================================================================================
********************************Helper Functions*********************************
=================================================================================
*/
const lengthOfMiniURL = 6;

const addProtocol= (url) => {
  if (url.substr(0,7) === 'http://') {
    return url;
  } else if (url.substr(0,8) === 'https://') {
    return url;
  }
  return `https://${url}`;
};

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

const getUserByEmail = (database, email) => {
  for (const user in database) {
    if (database[user].email === email.toLowerCase()) {
      return user;
    }
  }
  return undefined;
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
module.exports = { generateRandomString, verifyNewEmail, getUserByEmail, filterURLsByID, addProtocol };