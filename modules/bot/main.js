// Import everything.
const Discord = require("discord.js");
const config = require("./botConfig.json");
const util = require("./util.js");
global.operatingSystem = require("os");
// Create the bot.
const bot = new Discord.Client();
bot.database = require("./database.js");
bot.Discord = Discord;
// When our bot is online, we set it's activity.
bot.on("ready", async function() {
    bot.user.setActivity(`for commands (${config.prefix}prefix)`, {
        type: "WATCHING"
    });
    // Now we log that we started up in our logs channel.
    bot.active = true;
    util.log(bot, "status", "Discord bot active.");
    let intervalID = -1;
    // deactivated
    global.updateStatusMessage = async function(closed) {
        return;
        if (closed) {
            clearInterval(intervalID);
        }
        const channel = await bot.channels.fetch("895619392400916560");
        if (channel) {
            const statusMessage = await channel.messages.fetch(global.fingerPrint.statusID);
            if (statusMessage) {
                const fields = (closed ? [{
                    name: "Server closed to the public",
                    value: closed
                }] : [{
                    name: "Players:",
                    value: `${views.length}/${c.maxPlayers}`
                }, {
                    name: "Uptime:",
                    value: global.util.formatTime(global.util.time())
                }, {
                    name: "Last Updated:",
                    value: new Date()
                }]);
                if (global.botScoreboard && !closed) {
                    for (const key in global.botScoreboard) {
                        fields.push({
                            name: key,
                            value: global.botScoreboard[key]
                        });
                    }
                }
                const embed = new Discord.MessageEmbed()
                    .setTitle(c.gameModeName)
                    .setColor(0xDD0000)
                    .setDescription(`URL: http://woomy.surge.sh/#${global.fingerPrint.prefix}`)
                    .addFields(...fields)
                    .setFooter('Powered by Discord.js', 'https://i.imgur.com/wSTFkRM.png');
                statusMessage.edit(embed);
            }
        }
    }
    //setTimeout(global.updateStatusMessage, 3000);
    //intervalID = setInterval(global.updateStatusMessage, 30000);
});
// We use folders for our commands so that it is all simple and split up.
let commands = {};
for (let command of [
    "ping",
    "players",
    "bots",
    "say",
    "claim",
    "achievements",
    "prize",
    "cip",
    "kick",
    "ban",
    "unban",
    "eval",
    "incogeval",
    "exit",
    "update"
]) {
    let module = require(`./commands/${command}.js`);
    commands[command.toLowerCase()] = module;
}
commands.help = (function() {
    let fields = [];
    for (let name in commands) {
        let command = commands[name];
        fields.push({
            name: name,
            value: `Description: **${command.description}**\nUsage: \`${`${config.prefix}${global.fingerPrint.prefix} ${command.usage}`}\``
        });
    }
    return {
        run: function(bot, message, args) {
            const embed = new Discord.MessageEmbed().setTitle("Help:").setColor(0xDD0000).addFields(...fields).setDescription("Here is a list of all commands that are usable:");
            message.channel.send(embed);
        },
        description: "Lists commands.",
        usage: config.prefix + global.fingerPrint.prefix + " help"
    }
})();
const whitelistedChannels = [
    "874395524894187531", // Bot Commands
    "925770287230890046", // Beta Tester Commands
    "874413621206212668", // Staff Chat
    "874446523059044452" // Admin Chat
];
async function messageEvent(message) {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return util.error(message, "You cannot use commands in a DM channel!");
    if (message.guild.id === "874377758007001099" && !whitelistedChannels.includes(message.channel.id) && (message.content === config.prefix + "prefix" || message.content.startsWith(config.prefix + global.fingerPrint.prefix)) && util.checkPermissions(message) !== 3) return util.error(message, `Please go to <#874395524894187531> to use commands.`).then(function(sent) {
        setTimeout(function() {
            message.delete();
            sent.delete();
        }, 5000);
    });
    if (util.checkPermissions(message) === -1) return util.error(message, "You are blacklisted from using the bot.");
    if (message.content === config.prefix + "prefix") return util.info(message, `The prefix for the ${global.fingerPrint.prefix} server is \`${config.prefix + global.fingerPrint.prefix}\`. Run \`${config.prefix + global.fingerPrint.prefix} help\` for more commands.`)
    if (!message.content.startsWith(config.prefix + global.fingerPrint.prefix + " ") && !(util.checkPermissions(message) === 3 && message.content.startsWith(config.prefix + "global "))) return;
    message.content = message.content.replace(message.content.split(" ").shift() + " ", "");
    let args = message.content.split(" ");
    let command = args.shift().toLowerCase();
    try {
        if (commands[command]) return commands[command].run(bot, message, args);
    } catch(e) {}
    util.error(message, "That command doesn't exist!");
};
bot.on("message", messageEvent);
bot.on("error", async error => {
    console.log(`Uncaught Discord Bot Error:\n${error.toString()}`);
    await util.log(bot, "error", `Uncaught Discord Bot Error:\n${error.toString()}`);
});
bot.logRecord = function(data) {
    const channel = bot.channels.cache.get("895793977868058674");
    console.log(channel);
    for (const channel of ["895793977868058674", "929731137331413052"].map(id => bot.channels.cache.get(id))) {
        if (channel) {
            const embed = new Discord.MessageEmbed()
                .setTitle("Record ticket (run `$wr submit <message link of this embed>` to submit it as a record)")
                .setColor(0xDD0000)
                .setDescription(`Mode: **${c.secondaryGameMode}**`)
                .addFields({
                    name: "Player Name",
                    value: data.name,
                    inline: true
                }, {
                    name: "Player Discord",
                    value: (data.discordID != null) ? `<@!${data.discordID}>` : "N/A",
                    inline: true
                }, {
                    name: "Final Score",
                    value: global.util.formatLargeNumber(data.score),
                    inline: true
                }, {
                    name: "Tank",
                    value: data.tank,
                    inline: true
                }, {
                    name: "Total Kills",
                    value: Math.round(data.kills + (data.assists / 2) + (data.bosses * 2)),
                    inline: true
                }, {
                    name: "Kills",
                    value: data.kills,
                    inline: true
                }, {
                    name: "Assists",
                    value: data.assists,
                    inline: true
                }, {
                    name: "Bosses",
                    value: data.bosses,
                    inline: true
                }, {
                    name: "Time Alive",
                    value: global.util.timeForHumans(data.timeAlive),
                    inline: true
                })
                .setFooter("Powered by Discord.js", "https://i.imgur.com/wSTFkRM.png");
            channel.send(embed);
        }
    }
}
process.on("unhandledRejection", async (reason, p) => {
    console.log(`Unhandled Promise rejection! \n**Reason:**\n${reason.toString()}\n**Data:**\n${p.toString()}`);
    await util.log(bot, "error", `Unhandled Promise rejection! \n**Reason:**\n${reason.toString()}\n**Data:**\n${p.toString()}`);
});
process.on("uncaughtException", async error => {
    console.log(`Uncaught Error:\n**Message:** ${error.toString()}\n**Stack:**\n${(error.stack || null).toString()}`);
    await util.log(bot, "error", `Uncaught Error:\n**Message:** ${error.toString()}\n**Stack:**\n${(error.stack || null).toString()}`);
    process.exit(1);
});
bot.login(config.token);
bot.util = util;
bot.config = config;
bot.getUserFromToken = async function(token) {
    const beta = c.TOKENS.findIndex(entry => entry[0] === token);
    if (beta > -1) {
        return c.TOKENS[beta];
    }
    const decoded = accountEncryption.decode(token);
    if (decoded.startsWith("PASSWORD_") && decoded.endsWith("_PASSWORD")) {
        const [discordID, nameColor] = decoded.replace("PASSWORD_", "").replace("_PASSWORD", "").split("-");
        let guild, member, canJoin = 0;
        try {
            guild = await bot.guilds.fetch("874377758007001099");
        } catch(e) {
            console.log(e);
            return null;
        }
        try {
            member = await guild.members.fetch(discordID);
        } catch(e) {
            console.log(e);
            return null;
        }
        for (const id of member._roles) {
            if (config.rolesThatCanJoinBeta[id] != null) {
                canJoin = 1;
            }
        }
        console.log(token, discordID, nameColor, canJoin, `${member.user.username}#${member.user.discriminator}`);
        return [token, discordID, nameColor, canJoin, `${member.user.username}#${member.user.discriminator}`];
    }
    return null;
}
module.exports = {
    bot
};
