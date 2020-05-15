// required variables
const inquirer = require("inquirer");
const fs = require("fs");
const util = require("util");
const axios = require("axios");
const puppeteer = require("puppeteer");
const generateHTML = require("./htmlTemplate");

// Promisified variables
const writeFileAsync = util.promisify(fs.writeFile);

function promptUser() {
  return inquirer
    .prompt([
      {
        type: "list",
        name: "favoriteColor",
        message: "What is your favorite color?",
        choices: ["Red", "Green", "Blue", "Pink"]
      },
      {
        type: "input",
        name: "username",
        message: "What is your github username?"
      }
    ])

    .then(function({ username, favoriteColor }) {
      const queryUrl = `https://api.github.com/users/${username}`;

      axios.get(queryUrl).then(function(res) {
        //   console.log(res);
        var userObj = {
          userColor: favoriteColor,
          profileImgURL: res.data.avatar_url,
          login: res.data.login,
          userLocation: res.data.location,
          githubURL: res.data.html_url,
          userBlog: res.data.blog,
          userBio: res.data.bio,
          numRepos: res.data.public_repos,
          followerNum: res.data.followers,
          followingNum: res.data.following,
          githubStars: res.data.starred_url,
          name: res.data.name
        };

        const starredURL = `https://api.github.com/users/${username}/starred`;

        axios.get(starredURL).then(function(res) {
          let starObj = {
            stars: res.data.length
          };
          var html = generateHTML(userObj, starObj);

          generatePDF(html);

          return writeFileAsync("index.html", html);
        });
      });
    })
    .catch(err => {
      console.log(err);
    });
}
promptUser()
  .then(function() {
    console.log("Successfully wrote to index.html");
  })
  .catch(function(err) {
    console.log(err);
  });

async function generatePDF(html) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(`${html}`);
    await page.pdf({
      path: `${html.name}.pdf`,
      pageRanges: "1",
      format: "A4",
      printBackground: true
    });

    console.log("PDF created");
    await browser.close();
    process.exit();
  } catch (err) {
    console.log(err);
  }
}
