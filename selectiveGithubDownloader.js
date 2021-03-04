const axios = require("axios");
const fs = require("fs");

let url = process.argv[2];

let arr = url.split("/");

let apiUrl = "https://api.github.com/repos/" + arr[3] + "/" + arr[4];
let repo = "./" + arr[4];
let branch = arr[6];
let path = "";

for (let i = 7; i < arr.length; i++) {
  path = path + arr[i];
  if (i != arr.length - 1) {
    path += "/";
  }
}

const getRepoDetail = async (url, path, branch, repo) => {
  try {
    const response = await axios.get(url);
    const data = response.data;

    if (!fs.existsSync(repo)) {
      fs.mkdirSync(repo);
    }

    url = url + "/contents";
    if (path) {
      url = url + "/" + path;
    }

    getRepoContents(url, branch, repo);
  } catch (error) {
    console.log(error);
  }
};

const getRepoContents = async (url, branch, repo) => {
  try {
    let callUrl = url + (branch ? "?ref=" + branch : "");
    const response = await axios.get(callUrl);
    let data = response.data;
    if (!data.length) data = [data];
    data.forEach(async (ele) => {
      if (ele.type == "dir") {
        const newDirName = repo + "/" + ele.name;
        const newUrl = url + "/" + ele.name;
        if (!fs.existsSync(newDirName)) {
          fs.mkdirSync(newDirName);
        }
        getRepoContents(newUrl, branch, newDirName);
      } else {
        axios({
          url: ele.download_url,
          responseType: "stream",
        }).then(
          (response) =>
            new Promise((resolve, reject) => {
              response.data
                .pipe(fs.createWriteStream(repo + "/" + ele.name))
                .on("finish", () => resolve())
                .on("error", (e) => reject(e));
            })
        );
      }
    });
  } catch (error) {
    console.log(error);
  }
};

getRepoDetail(apiUrl, path, branch, repo);
