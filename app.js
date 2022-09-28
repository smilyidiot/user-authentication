const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
const bcrypt = require("bcrypt");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API1
app.post("/register/", async (request, response) => {
  const { name, username, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);

  const selectUserQuery = `
  SELECT * 
  FROM user
  WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
      user(username, name, password, gender, location)
      VALUES(
          '${username}',
          '${name}',
          '${password}',
          '${gender}',
          '${location}' );`;
    if (password.length > 5) {
      const dbUserResponse = await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const getUserQuery = `
    SELECT * 
    FROM user
    WHERE username = '${username}';`;
  const dbUser = await db.get(getUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const getCurrentPassword = `
  SELECT *
  FROM user
  WHERE username = '${username}';`;
  const dbUser = await db.get(getCurrentPassword);

  const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
  if (isValidPassword) {
    if (newPassword.length >= 5) {
      const hashedPass = await bcrypt.hash(newPassword, 10);
      const updatePassQuery = `
                UPDATE user
                SET password = '${hashedPass}'
                WHERE username = '${username}';`;
      await db.run(updatePassQuery);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
