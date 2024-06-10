const axios = require("axios");
const { Telegraf, Markup } = require("telegraf");

// BOT TOKEN
const BOT_TOKEN = 'telegram token '; // Replace this with your actual bot token


const bot = new Telegraf(BOT_TOKEN);


const userCooldowns = {};
const adminIds = [123456, 123456];  // Replace with your admin IDs

function onCooldown(userId) {
    const cooldownTime = 600;  // 10 minutes in seconds
    if (userCooldowns[userId]) {
        const lastUsedTime = userCooldowns[userId];
        return Date.now() - lastUsedTime < cooldownTime;
    }
    return false;
}

// Google search configuration
const GOOGLE_API_KEY = 'your key '; 
const GOOGLE_CSE_ID = 'your cse '; 
const RESULTS_PER_PAGE = 5;

async function sendSearchResults(ctx, query, startIdx, searchType = 'text') {
    let searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${query}&start=${startIdx}&num=${RESULTS_PER_PAGE}`;
    
    if (searchType === 'image') {
        searchUrl += "&searchType=image";
    }

    try {
        const response = await axios.get(searchUrl);
        const searchResults = response.data;

        if (searchResults.items) {
            if (searchType === 'image') {
                const mediaGroup = [];
                searchResults.items.forEach((item, i) => {
                    try {
                        const media = {
                            type: 'photo',
                            media: item.link,
                            caption: `${i}. [Image](${item.link})`,
                            parse_mode: 'Markdown'
                        };
                        mediaGroup.push(media);
                    } catch (error) {
                       
                    }
                });

                if (mediaGroup.length > 0) {
                    await ctx.replyWithMediaGroup(mediaGroup);
                } else {
                    await ctx.reply("No images found.");
                }
            } else {
                let resultMessage = "<b>Your Search results:</b>\n\n";
                searchResults.items.forEach((item, i) => {
                    const description = item.snippet || 'No description available.';
                    resultMessage += `${i}. <b>[${item.title}]</b>${item.link}\n${description}\n\n`;
                });

                const keyboard = Markup.inlineKeyboard([
                    Markup.button.callback('Previous', `prev_${query}_${startIdx}_${searchType}`),
                    Markup.button.callback('Next', `next_${query}_${startIdx}_${searchType}`)
                ]);

                await ctx.replyWithHTML(resultMessage, { reply_markup: keyboard });
            }
        } else {
            await ctx.reply("No results found.");
        }
    } catch (error) {
        console.error("Error fetching search results:", error);
        await ctx.reply("An error occurred while fetching search results.");
    }
}

bot.command('search', async (ctx) => {
    const { message } = ctx;
    const args = message.text.split(' ').slice(1);
    const query = args.join(' ');
    if (!query) {
        return ctx.reply("Please provide a search query after the command.");
    }

    await sendSearchResults(ctx, query, 1);
});

bot.command('image', async (ctx) => {
    const { message } = ctx;
    const args = message.text.split(' ').slice(1);
    const query = args.join(' ');
    if (!query) {
        return ctx.reply("Please provide a search query after the command.");
    }

    await sendSearchResults(ctx, query, 1, 'image');
});

bot.launch();
