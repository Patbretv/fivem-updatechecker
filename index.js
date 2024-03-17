const fs = require('fs');
const axios = require("axios")
const { ServerCFGPath, CheckInterval, ServerPort, DiscordWebhook } = require("./config.json");
const { resolve } = require('path');

async function GetNewestServerBuild() {
  return new Promise(async (resolve, reject) => {
  const response = await axios.request({
    method: "GET",
    url: "https://docs.fivem.net/docs/server-manual/server-commands/",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    }
  })

  const regex = /<h3 id="sv_enforcegamebuild-build">[\s\S]*?<table>[\s\S]*?<\/table>/g
  const matches = response.data.match(regex)
  const table = matches[0]
  const regex2 = /<td>(.*?)<\/td>/g
  const matches2 = table.match(regex2)
  const last3 = matches2.slice(-3)
  const gamebuildstring = last3[0].replace(/<td>/g, "").replace(/<\/td>/g, "")
  const gamebuild = parseInt(gamebuildstring)

  if (isNaN(gamebuild)) {
    reject("Failed to get gamebuild")
  }

  resolve(gamebuild)
  })
}

async function GetServerCFG() {
  return new Promise((resolve, reject) => {
    fs.readFile(ServerCFGPath, "utf8", (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
} 

async function UpdateServer() {
  await GetServerCFG().then(async (serverCFG) => {
    const newGameBuild = await GetNewestServerBuild().catch((err) => {
      console.log(err)
    })
    const regex = /set sv_enforceGameBuild "(.*?)"/g
    if (!serverCFG.match(regex)) {
      fs.appendFile(ServerCFGPath, "\nset sv_enforceGameBuild \"" + newGameBuild + "\"", (err) => {
        if (err) {
          console.log(err)
        }
      })
    } else {
      const newCFG = serverCFG.replace(regex, "set sv_enforceGameBuild \"" + newGameBuild + "\"")
      fs.writeFile(ServerCFGPath, newCFG, (err) => {
        if (err) {
          console.log(err)
        }
      })
    }
  }).catch((err) => {
  console.log(err)
  })
}

async function GetServerGameBuild() {
  return new Promise(async (resolve, reject) => {
    await GetServerCFG().then((serverCFG) => {
      const regex = /set sv_enforceGameBuild "(.*?)"/g
      const matches = serverCFG.match(regex)
      const match = matches[0]
      const gamebuild = match.replace(/set sv_enforceGameBuild "/g, "").replace(/"/g, "")
      resolve(gamebuild)
    }).catch((err) => {
      reject(err)
    })
  })
}

async function UpdateChecker() {
  const currentGameBuild = await GetServerGameBuild().catch((err) => {
    console.error(err)
  })
  await GetNewestServerBuild().then(async (gamebuild) => {
    console.log(Array.from({ length: 15 }, (_, i) => `^1-^5-^1`).join('') + "^0")
    console.log("Current Gamebuild: " + currentGameBuild)
    console.log("Newest Gamebuild: " + gamebuild)
    if (gamebuild > currentGameBuild) {
      console.log("New version available")
      await UpdateServer()
      console.log("Gamebuild updated")
    } else {
      console.log("Your Gamebuild is up to date")
    }
    console.log(Array.from({ length: 15 }, (_, i) => `^1-^5-^1`).join('') + "^0")
  }).catch((err) => {
    console.error(err)
  })
}

on('onResourceStart', async (resourceName) => {
  if (GetCurrentResourceName() == resourceName) {
    UpdateChecker()
    IsArtifactsOutdated()
  }
})

setInterval(() => {
  UpdateChecker()
}, 1000 * 60 * 60 * CheckInterval) 

const os = require('os').platform()

async function GetNewestArtifactsVersion() {
  return new Promise(async (resolve, reject) => {
    if (os == "win32") {
      const url = "https://runtime.fivem.net/artifacts/fivem/build_server_windows/master/"

      await axios.get(url).then((response) => {
        const html = response.data
        const regex = /<a class="panel-block  is-active" href="\.\/(.*?)\/server\.7z"/g
        const matches = html.match(regex)
        const match = matches[0]
        const href = match.replace(/<a class="panel-block  is-active" href="/g, "").replace(/"/g, "")
        const regex2 = /\d+/g
        const matches2 = match.match(regex2)
        const version = matches2[0]
        const downloadurl = "https://runtime.fivem.net/artifacts/fivem/build_server_windows/master/" + href
        resolve({ version: version, downloadurl: downloadurl })
      }).catch((err) => {
        reject(err)
      })
    } else if (os == "linux") {
      const url = "https://runtime.fivem.net/artifacts/fivem/build_proot_linux/master/"
      await axios.get(url).then((response) => {
        const html = response.data
        const regex = /<a class="panel-block  is-active" href="\.\/(.*?)\/server\.7z"/g
        const matches = html.match(regex)
        const match = matches[0]
        const href = match.replace(/<a class="panel-block  is-active" href="/g, "").replace(/"/g, "")
        const regex2 = /\d+/g
        const matches2 = match.match(regex2)
        const version = matches2[0]
        const downloadurl = "https://runtime.fivem.net/artifacts/fivem/build_proot_linux/master/" + href
        resolve({ version: version, downloadurl: downloadurl })
      }).catch((err) => {
        reject(err)
      })
    } else {
      console.error("Unsupported OS your OS is: " + os)
    }
  })
}

async function GetCurrentArtifactsVersion() {
  return new Promise(async (resolve, reject) => {
    const url = "http://localhost:" + ServerPort + "/info.json"
    await axios.get(url).then((response) => {
      const version = response.data.server
      const regex = /v\d+\.\d+\.\d+\.\d+/g
      const matches = version.match(regex)
      const match = matches[0]

      const regex2 = /\.\d+$/g
      const matches2 = match.match(regex2)
      const match2 = matches2[0]
      const versionNumber = match2.replace(".", "")

      resolve(versionNumber)
    }).catch((err) => {
      reject(err)
    })
  })
}

async function SendDiscordWebhook(title, message, color, fields) {
  try {
      const data = {
          embeds: [{
              title: title,
              description: message,
              color: color,
              fields: fields
          }]
      };

      await axios.post(DiscordWebhook, data);
  } catch (error) {
      console.error('Error sending Discord webhook:', error.message);
  }
}

async function IsArtifactsOutdated() {
  await GetCurrentArtifactsVersion().then(async (version) => {
    await GetNewestArtifactsVersion().then(async (newestVersion) => {
      if (version < newestVersion) {
        console.log(Array.from({ length: 15 }, (_, i) => `^1-^4-^1`).join('') + "^0")
        console.log("Artifacts outdated")
        console.log("Current Version: ^3" + version + "^0")
        console.log("Newest Version: ^2" + newestVersion.version + "^0")
        console.log(Array.from({ length: 15 }, (_, i) => `^1-^4-^1`).join('') + "^0")
        await SendDiscordWebhook("Artifacts Outdated", "Your artifacts are outdated, please update your artifacts", 1752220, [
          {
            name: "Current Version",
            value: version,
            inline: false
          },
          {
            name: "Newest Version",
            value: newestVersion.version,
            inline: false
          },
          {
            name: "Download URL",
            value: "[Download](" + newestVersion.downloadurl + ")",
            inline: false
          }
        ])
      }
    })
  })
}

setInterval(() => {
  IsArtifactsOutdated()
}, 1000 * 60 * 60 * CheckInterval)
