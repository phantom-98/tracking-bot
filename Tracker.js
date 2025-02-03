import WalletFilter from './Filter_Wallet.js'
import { WebSocket } from "ws";
import TelegramBot from 'node-telegram-bot-api';
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import WholeFilter from './Filter_Whole.js';

const telegramToken = '7589474786:AAHxpC31IRiZqDnqSQ2H7SRaF4AK0YFeLhc';
// const telegramToken = '7922615303:AAGFEkTyapyTP_sxz-8lXsTISoL7LMV_qrE';

const bot = new TelegramBot(telegramToken, { polling: true });

// import Telegraf from 'telegraf';
// const bot = new Telegraf(telegramToken);

// bot.telegram.setWebhook('https://yourserver.com/telegram-bot-webhook');


let chatId = '';
let stopAddress = '';
let filter_walletAddresses = [];
let walletData = [];
let walletProperties = {
    address: "",
    tag: "",
    amount: "",
    threshold: "",
    action: "",
    style: "",
    list: "",
    timeperiod: "",
    alert: 0,
    latest: []
}

let sameAddressIndex = {
    address: "",
    index: []
};
let sameAddressIndexList = []
let cnt=-1;
let chainAlert = {
    way: "",
    amount: "",
    amount2: "",
    transfer: "",
    equal: "",
    json: "",
    alert: 0,
    latest: []
};

let chainAlertList = [];
let taglist = [];
let length_Chain = 0;
let length_Wallet = 0;
let ccnt=0;

try {
    function verifySolanaAddress(address) {
    
        let connection = new Connection(clusterApiUrl("mainnet-beta"), 'confirmed');
        const getData = (address) => {
            try {
                const data = connection.getAccountInfo(new PublicKey(address), "finalized");
                if (!data) {
                    throw new Error('Account not found');
                  }
                return data !== null; // Return true if data exists, otherwise false
            } catch (err) {
                console.log("This address isn't a valid address");
                return false; // Return false if there's an error
            }
        };
        
        const isValidAccount = getData(address);
        
        return isValidAccount;
    }
    
    function Transfer(){    
        
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'InFlow', callback_data: 'InFlow' }],
                    [{ text: 'OutFlow', callback_data: 'OutFlow' }],
                    [{ text: 'Both', callback_data: 'Both' }]
                ]
            }
        };
    
        bot.sendMessage(chatId, "Select an option from the table:", options);
     
    }
    
    function listSelection(){
        
        const option = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Greenlist', callback_data: 'Greenlist' }],
                    [{ text: 'Blacklist', callback_data: 'Blacklist' }]
                ]
            }
        };
        
        bot.sendMessage(chatId, "Please select the type of list:", option); 
    }
    
    function hotWallet(){
    
        const option = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Hotwallet Yes', callback_data: 'Hotwallet Yes' }],
                    [{ text: 'Hotwallet No', callback_data: 'Hotwallet No' }]
                ]
            }
        };
        
        bot.sendMessage(chatId, "Please select the type of wallet:", option); 
    }
    
    bot.onText(/\/start/, (msg) => {
        chatId = msg.chat.id;
    
       bot.sendPhoto(chatId, "logo.png", {
        caption: "What can this bot do?\n\nThis bot has the potential to assist you in hunting for alpha by providing notifications for any transaction made by a wallet you're tracking, among many other features.\n\n/wholechainalert : Monitor solana chain\n/pause wallet address : Pause the entered wallet address from the tracking list.\n/active wallet address : Resume the paused wallet address from the tracking list.\n/taglist : Displays a list of tag names and wallet addresses.\n/delete wallet name tag name : Delete the wallet address from the tracking list\n/stop : The bot stops tracking wallets.\nPlease enter the minimum amount you want to filter to start tracking.(/wallet ....)"
        });
        
    });
    
    bot.onText(/\/wallet (.+)/, async (msg, match) => {
        chatId = msg.chat.id;
        walletProperties.address = match[1];        
        walletProperties.action = "Active";
        cnt++;
        length_Wallet++;
        for (let i=0; i < walletProperties.length; i++)
        {        
            if (!verifySolanaAddress(walletProperties.address)) {
                
                bot.sendMessage(chatId, `Please provide a valid wallet address. ${i+1}th wallet address is wrong`);
                return;
            }
        }
        let existingEntry = sameAddressIndexList.find(entry => entry.address == walletProperties.address);
    
        if(existingEntry){
            existingEntry.index.push(cnt);
        } else {
            sameAddressIndex = {
                address: walletProperties.address,
                index: [cnt]
            }; 
            
            sameAddressIndexList.push(sameAddressIndex)
        }
    
        bot.sendMessage(chatId, "Please choose the name of wallet address using /name ...");
    
    });
    
    bot.onText(/\/name (.+)/, async (msg, match) => {
    
        const chatId = msg.chat.id;       
        walletProperties.tag = match[1];
        bot.sendMessage(chatId, "Please choose the amount range of wallet address. /amount ...");
    
    });
    
    bot.onText(/\/amount (.+)/, async (msg, match) => {
        chatId = msg.chat.id;
        walletProperties.amount = match[1];    
    
        const option = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Greater than', callback_data: 'Greater_than' }],
                    [{ text: 'Less than', callback_data: 'Less_than' }],
                    [{ text: 'Same', callback_data: 'Same' }],
                    [{ text: 'Decimal', callback_data: 'Decimal' }]
                ]
            }
        };
        
        bot.sendMessage(chatId, "Please choose the range of amount:", option);   
    });
    
    bot.onText(/\/timeperiod (.+)/, async (msg, match) => {
    
        walletProperties.timeperiod = match[1];
        listSelection();
    
    });
    
    bot.onText(/\/continue/, (msg) => {
        chatId = msg.chat.id;   
        ccnt++;

        bot.sendMessage(chatId, `Start tracking`);
    
        // Tracking(chain);
        if(chainAlertList.length >= 1){
            chainAlertList = WholeFilter(chainAlertList, bot, chatId); 
            setInterval(() => WholeFilter(chainAlertList, bot, chatId), 10000);
        } 
        
        if (walletData.length >= 1){
            walletData = WalletFilter(walletData, bot, chatId);
            setInterval(() => WalletFilter(walletData, bot, chatId), 10000);
        }

        if (ccnt === 1){

            function MessageAlert(){
                let messages = [];
                if(walletData.length>=1){
    
                    walletData.forEach((item) => {
                        let message = `${item.alert} alerts in "${item.address}"`
                        messages.push(message);                
                    });
                }
    
                if(chainAlertList.length>=1){
    
                    chainAlertList.forEach((item) => {
                        let message;
                        if (item.way == "Between"){
        
                            message = `${item.alert} alerts in Between ${item.amount} sol ${item.amount2} sol`
                        }
        
                        if (item.way == "Minimum"){
        
                            message = `${item.alert} alerts in Minimum ${item.amount} sol ${item.transfer} transfers`
                        }
                        messages.push(message);                
                    });
                }
    
                if (messages != []){
    
                    bot.sendMessage(chatId, messages.join('\n'));
                }
            }
    
            setInterval(MessageAlert, 30000);
        }
                  
    });
    
    bot.onText(/\/wholechainalert/, (msg) => {
        chatId = msg.chat.id;    
    
        const option = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Minimum X Sol in Y Transfers', callback_data: 'Minimum' }],
                    [{ text: 'Between X & Y Sol in One Transfer', callback_data: 'Between' }]
                ]
            }
        };
        bot.sendMessage(chatId, `Please choose the way to monitor: `, option);  
        
    });
    
    bot.onText(/\/wholeamount (.+)/, async (msg, match) => {
    
        const chatId = msg.chat.id;
        length_Chain++;
        if (chainAlert.way === "Minimum"){
    
            chainAlert.amount = match[1].split(" ")[0];
            chainAlert.transfer = match[1].split(" ")[2];
    
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Yes', callback_data: 'Yes' }],
                        [{ text: 'No', callback_data: 'No' }]
                    ]
                }
            };
        
            bot.sendMessage(chatId, "X Transfers must be equal = ? :", options);
        }
        
        if (chainAlert.way === "Between"){
    
            chainAlert.amount = match[1].split(" ")[0];
            chainAlert.amount2 = match[1].split(" ")[2];
    
            listSelection();
        }
    
    });
    
    bot.onText(/\/pause (.+)/, async (msg, match) => {
        chatId = msg.chat.id;
        const prompt = match[1];
        stopAddress = prompt.split(" ")[0];
        const tagName = prompt.split(" ")[1];
        console.log(tagName);
        if (!verifySolanaAddress(stopAddress)) {
            
            bot.sendMessage(chatId, "Please provide a valid wallet address.");
            return;
        } else{
    
            let filter_action;
            
            filter_action = walletData.find((data) => data.tag === tagName);
            const targetIndex = walletData.indexOf(filter_action);
            console.log("index", targetIndex);
            if(filter_action){
                filter_action.action = "Pause";
                console.log("OK");
            }
                
            sameAddressIndexList.forEach((item, listIndex) => {
                if (targetIndex < item.index.length && targetIndex >= 0) { // Check if targetIndex is valid
                    console.log(`Removing element at index ${targetIndex} in list ${listIndex}`);
                    item.index.splice(targetIndex, 1); // Remove one element at targetIndex
                } else {
                    console.log(`Invalid index for removal: ${targetIndex} in list ${listIndex}`);
                }
            }); 
            
            filter_walletAddresses = walletData.filter((address) => address.tag !== tagName).map((data) => data.address);
            console.log("filterAddress====>", filter_walletAddresses);
            
            // closeConnection(bitqueryConnection);
            Tracking(filter_walletAddresses);
    
            bot.sendMessage(chatId, `Paused "${stopAddress}" successfully.\nPlease check using /taglist`);
        }
    
    });
    
    bot.onText(/\/active (.+)/, async (msg, match) => {
        chatId = msg.chat.id;
        const prompt = match[1];
        stopAddress = prompt.split(" ")[0];
        const tagName = prompt.split(" ")[1];
        console.log(tagName);
        if (!verifySolanaAddress(stopAddress)) {
            
            bot.sendMessage(chatId, "Please provide a valid wallet address.");
            return;
        } else{
    
            let filter_action;
            
            filter_action = walletData.find((data) => data.tag === tagName);
            const targetIndex = walletData.indexOf(filter_action);
            console.log("index", targetIndex);
            if(filter_action){
                filter_action.action = "Active";
                console.log("OK");
            }
    
            sameAddressIndexList.forEach((item, listIndex) => {
                if (item.address == stopAddress) { // Check if position is valid
                    console.log(`Adding element ${targetIndex} at index ${1} in list ${listIndex}`);
                    item.index.splice(1, 0, targetIndex); // Insert element at the specified position
                } else {
                    console.log(`Invalid position for addition: ${1} in list ${listIndex}`);
                }
            });
    
            console.log("Addlist", sameAddressIndexList);
            filter_walletAddresses.push(stopAddress);        
            console.log("===>", filter_walletAddresses);
            
            // closeConnection(bitqueryConnection);
            Tracking(filter_walletAddresses);
    
            bot.sendMessage(chatId, `Resumed "${stopAddress}" successfully.\nPlease check using /taglist`);
        }
    
    });
    
    bot.onText(/\/delete (.+)/, async (msg, match) => {
        chatId = msg.chat.id;
        const prompt = match[1];
        const deleteAddress = prompt.split(" ")[0];
        const tagName = prompt.split(" ")[1];
        console.log(tagName);
        if (!verifySolanaAddress(deleteAddress)) {
            
            bot.sendMessage(chatId, "Please provide a valid wallet address.");
            return;
        } else{
    
            let filter_action;
    
            filter_action = walletData.find((data) => data.tag === tagName);
            const targetIndex = walletData.indexOf(filter_action);
                
            sameAddressIndexList.forEach((item, listIndex) => {
                if (targetIndex < item.index.length && targetIndex >= 0) { // Check if targetIndex is valid
                    console.log(`Removing element at index ${targetIndex} in list ${listIndex}`);
                    item.index.splice(targetIndex, 1); // Remove one element at targetIndex
                } else {
                    console.log(`Invalid index for removal: ${targetIndex} in list ${listIndex}`);
                }
            }); 
            
            walletData = walletData.filter((address) => address.tag !== tagName);
            filter_walletAddresses = walletData.map((data) => data.address);
            console.log("filterAddress====>", filter_walletAddresses);
            
            // closeConnection(bitqueryConnection);
           Tracking(filter_walletAddresses);
    
            bot.sendMessage(chatId, `Deleted "${deleteAddress}" successfully.\nPlease check using /taglist`);
        }
    
    });
    
    bot.onText(/\/stop/, (msg) => {
        chatId = msg.chat.id;
        closeConnection(bitqueryConnection);
        bot.sendMessage(chatId, "The bot is stopped tracking");       
    });
    
    
    bot.onText(/\/taglist/, (msg) => {
        chatId = msg.chat.id;
        const marks = {
            "Greater": ">",
            "Less": "<",
            "Same": "=",
            "Decimal": "="
        }
    
        taglist = [];
    
        if (walletData.length != 0){
    
            walletData.map((data, index) => taglist.push([{
                text: data.tag + ":" + data.address +", "+marks[data.threshold] + data.amount + " " + data.action,
                callback_data: "tag_" + index}]))
        }
    
        if (chainAlertList.length != 0){
    
            chainAlertList.map((data, index) => taglist.push([{ text: `Whole Chain : ${data.way}`, callback_data: 'Criteria_' + index }]));
        }    
        
        const options = {
            reply_markup: {
                inline_keyboard:                     
                       taglist 
            }
        };
    
        // Sending the formatted message
        bot.sendMessage(chatId, "Wallet addresses and Tag names:", options);
    
    });
    
    bot.on('callback_query', (query) => {
        chatId = query.message.chat.id;
        const type = query.data; 
    
        switch (type) {
            case "Greater_than":
                walletProperties.threshold = "Greater";
                Transfer();
                break;
            case "Less_than":
                walletProperties.threshold = "Less";
                Transfer();
                break;
            case "Same":
                walletProperties.threshold = "Same";
                Transfer();
                break;
            case "Decimal":
                walletProperties.threshold = "Decimal";
                Transfer();
                break;
            case "InFlow":
                walletProperties.style = "Receiver";
                hotWallet();    
                break;
            case "OutFlow":
                walletProperties.style = "Sender";
                hotWallet();
                break;
            case "Both":
                walletProperties.style = "Both"; 
                hotWallet();        
                break;
            case "Hotwallet Yes":
                bot.sendMessage(chatId, "Please enter time period(seconds) to track. /timeperiod number");
                break;
            case "Hotwallet No":
                listSelection();
                break;
            case "Yes":
                chainAlert.equal = "Yes";
                listSelection();
                break;
            case "No":
                chainAlert.equal = "No"; 
                listSelection();            
                break;
            case "Greenlist":
                walletProperties.list = "./Greenlist.json";
                chainAlert.json = "./Greenlist.json";
                
                if (length_Chain > chainAlertList.length){
                    chainAlertList.push({...chainAlert});
                } 
                if (length_Wallet > walletData.length) {
                    walletData.push({...walletProperties});
                }
                
                bot.sendMessage(chatId, "Please enter other wallet addresses to track if you want. Or please select whole chain tracking method\n\nIf not, /continue");
                
                break;
            case "Blacklist":
                walletProperties.list = "./Blacklist.json";
                chainAlert.json = "./Blacklist.json";
    
                if (length_Chain > chainAlertList.length){
                    chainAlertList.push({...chainAlert});
                } 
                if (length_Wallet > walletData.length) {
                    walletData.push({...walletProperties});
    
                }
    
                bot.sendMessage(chatId, "Please enter other wallet addresses to track if you want. Or please select whole chain tracking method\n\nIf not, /continue");
                
                break;
            case "Minimum":
                chainAlert.way = "Minimum";
                bot.sendMessage(chatId, "Please enter the conditions to monitor. /wholeamount X sol Y transfers");
                break;
            case "Between":
                chainAlert.way = "Between";
                bot.sendMessage(chatId, "Please enter the conditions to monitor. /wholeamount X sol Y sol");
                break;
            default:
                break;
        }    
    
    });
} catch(err){
    console.log("Error");
}

