<<<<<<< HEAD
require('dotenv').config();

module.exports = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT_STRING || process.env.ORACLE_CONNECTION_STRING
};
=======
require('dotenv').config();

module.exports = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT_STRING || process.env.ORACLE_CONNECTION_STRING
};
>>>>>>> c195d0aa8a889d50a50c8f7584d6506df29e01f5
