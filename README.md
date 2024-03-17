# FiveM Server Update Checker

This is a FiveM server update checker. It checks for updates to the game build and server artifacts, and sends a notification to a Discord server if updates are available.

## Prerequisites

- Node.js installed on your machine
- A FiveM server
- A Discord server with a webhook

## Configuration

Open the `config.json` file and update the following fields:

- `ServerCFGPath`: The path to your server.cfg file.
- `CheckInterval`: The interval (in hours) at which the update checker should check for updates.
- `ServerPort`: The port your FiveM server is running on.
- `DiscordWebhook`: The URL of your Discord webhook.

## Usage

1. Upload the Resource to your Server
2. Start your FiveM server.
3. Wait for the resource to be build
4. If it updated your gamebuild restart the server

The update checker will now check for updates at the interval specified in the configuration file. If updates are available, it will send a notification to your Discord server.

## Functions

- `GetNewestServerBuild`: Fetches the latest game build version from the FiveM documentation page.
- `GetServerCFG`: Reads the server configuration file.
- `UpdateServer`: Updates the game build version in the server configuration file if a newer version is available.
- `GetServerGameBuild`: Retrieves the current game build version from the server configuration file.
- `UpdateChecker`: Checks if the current game build version is outdated and calls `UpdateServer` if it is.
- `GetNewestArtifactsVersion`: Fetches the latest server artifacts version from the FiveM artifacts page.
- `GetCurrentArtifactsVersion`: Retrieves the current server artifacts version from the server's info.json file.
- `SendDiscordWebhook`: Sends a message to a Discord server via a webhook.
- `IsArtifactsOutdated`: Checks if the current server artifacts version is outdated and sends a Discord notification if it is.

## License

This project is licensed under the MIT License.
