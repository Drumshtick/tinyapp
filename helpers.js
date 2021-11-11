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
module.exports = { generateRandomString, verifyNewEmail, getUserByEmail, filterURLsByID };