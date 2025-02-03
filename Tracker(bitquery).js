import Transaction_Tracking from './Monitor.js'
import {Chain_Tracking} from './Monitor.js'
import { WebSocket } from "ws";
import TelegramBot from 'node-telegram-bot-api';
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import WholeFilter from './Filter_Whole.js';

const token = "ory_at_HyuvzeWWWjIFVqEEPnyGOZHnH5zuYfHvL918baZ-_Vg.aX4hh3UVbfE_GjrPWc5rYE07ymqhbryW5CQkVv3fFIQ";
// ory_at_P5vMRXX5eyo8sKTasnriRfBWej1sFm6vp7WkbhDGNRc.rELpxe-fLTwoePDy3vP3m1aGBy5pXJ9N1D2Wb_xLZYQ
// const telegramToken = '7922615303:AAGFEkTyapyTP_sxz-8lXsTISoL7LMV_qrE';
const telegramToken = '7589474786:AAHxpC31IRiZqDnqSQ2H7SRaF4AK0YFeLhc';
const bot = new TelegramBot(telegramToken, { polling: true });

let chatId = '';
let subscriptionMessage;
let queryMessage;
let subscriptionMessage_whole;
let subscriptionMessage_whole2;
let bitqueryConnection;
let stopAddress = '';
let walletAddresses = [];
let filter_walletAddresses = [];
let walletData = [];
let walletAddressesString = [];
let walletProperties = {
    address: "",
    tag: "",
    amount: "",
    threshold: "",
    action: "",
    style: "",
    list: ""
}

let sameAddressIndex = {
    address: "",
    index: []
};
let sameAddressIndexList = []
let cnt=-1;
let check_transaction = {};
let chainAlert = {
    way: "",
    amount: "",
    amount2: "",
    transfer: "",
    equal: "",
    json: ""
};

let chainAlertList = [];
let transfer = [];
let signatures = [];
let taglist = [];
let length_Chain = 0;
let length_Wallet = 0;
let hotwallet_status;
let timeperiod;
function handleBitqueryResponse(data, walletAddresses, chainAlertList) {
    
    try{

        let response = JSON.parse(data);

        if (response.type === "connection_ack") {
            console.log("Connection acknowledged by server.");
            if (walletData.length >= 1) {        
                walletAddressesString = walletAddresses.map(address => `"${address}"`).join(", ");
                sendSubscriptionMessage_wallet(walletAddressesString);
            }

            // if (chainAlertList.length >= 1) {
            //     sendSubscriptionMessage_wholechain();
            // }
        }

        if (response.type === "data") {
            try{
                if (walletData.length >= 1) {

                    let transactions = response.payload.data.Solana.Transfers;                                            
                    Transaction_Tracking(transactions, walletData, bot, chatId);            
                   
                }  
    
                // if (chainAlertList.length >= 1) {
                //     transfer = response.payload.data.Solana.Transfers;
                //     transfer.forEach((tx) => {                
                //         signatures.push(tx.Transaction.Signature);
                //     });
                //     Chain_Tracking(bot, chatId, transfer, signatures, chainAlertList);
                //     signatures = [];                    
                // }

            } catch (err) {
                console.error(err)
            }
                
        }

        if (response.type === "ka") {
            console.log("Keep-alive message received.");
        }

        if (response.type === "error") {
            console.error("Error message received:", response.payload.errors);
        }
    } catch(err){
        console.log("Error");
    }
    
         
}

function sendSubscriptionMessage_wallet(walletAddresses) {

    let subscriptionQuery = '';
    let Query = '';

    subscriptionQuery = `
        subscription Myquery {
            Solana {
                Transfers(where: {any: [{Transfer: {Sender: {Address: {in: [${walletAddresses}]}}}}, {Transfer: {Receiver: {Address: {in: [${walletAddresses}]}}}}], Transfer: {Currency: {Native: true}}, Transaction: {Result: {Success: true}}} 
                limit: {count: 1}) {
                    Transaction {
                        Signature
                    }
                    Transfer {
                        Amount
                        AmountInUSD
                        Sender {
                            Address
                        }
                        Receiver {
                            Address
                        }
                        Currency {
                            Symbol
                        }
                    }

                    Block {
                        Time
                    }
                }
            }
        }
    `;

    Query = `
        query MyQuery {
            Solana {
            Transfers(
                where: {any: [{Transfer: {Sender: {Address: {in: [${walletAddresses}]}}}}, {Transfer: {Receiver: {Address: {in: [${walletAddresses}]}}}}], Transfer: {Currency: {Native: true}}, Transaction: {Result: {Success: true}}}
                limit: {count: 100}
                orderBy: {descending: Block_Slot}
            ) {
                Transaction {
                Signature
                }
                Transfer {
                Amount
                AmountInUSD
                Sender {
                    Address
                }
                Receiver {
                    Address
                }
                Currency {
                    Symbol
                }
                }
                Block {
                Time
                }
            }
            }
        }         
    `;

    
    try {

        if(walletData.length >= 1) {

            if (hotwallet_status === "No"){

                subscriptionMessage = JSON.stringify({
                    type: "start",
                    id: "1",
                    payload: { query: subscriptionQuery }
                });  
        
                bitqueryConnection.send(subscriptionMessage);
            }

            if (hotwallet_status === "Yes"){
                setInterval(()=> {

                    queryMessage = JSON.stringify({
                        type: "start",
                        id: "1",
                        payload: { query: Query }
                    });  
            
                    bitqueryConnection.send(queryMessage);
                    console.log("Hotwallet Yes");

                }, parseFloat(timeperiod)*1000);
            }
            
        }
        
        console.log("Subscription_wallet message sent.");

    } catch(err){
        bot.sendMessage(chatId, "There is no wallet address to track")
    }
}

// function sendSubscriptionMessage_wholechain() {

//     let subscriptionQuery_whole = '';
//     let subscriptionQuery_whole2 = '';
//     subscriptionQuery_whole = `
//         subscription Myquery {
//             Solana {
//             Transfers(
//                 where: {Transfer: {Currency: {Native: true}, Amount:{ge: "${chainAlert.amount}"}}, Transaction: {Result: {Success: true}}}
//             ) {
//                 Block {
//                 Slot
//                 }
//                 Transaction {
//                 Signature
//                 Result {
//                     Success
//                 }
//                 }
//                 Transfer {
//                 Amount
//                 Receiver {
//                     Address
//                 }
//                 Sender {
//                     Address
//                 }
//                 Currency {
//                     Symbol
//                 }
//                 }
//             }
//             }
//         }
//     `;

//     subscriptionQuery_whole2 = `
//         subscription Myquery {
//             Solana {
//             Transfers(
//                 where: {Transfer: {Currency: {Native: true}, Amount: {ge: "${chainAlert.amount}", le: "${chainAlert.amount2}"}}, Transaction: {Result: {Success: true}}}
//             ) {
//                 Block {
//                 Slot
//                 }
//                 Transaction {
//                 Signature
//                 Result {
//                     Success
//                 }
//                 }
//                 Transfer {
//                 Amount
//                 Receiver {
//                     Address
//                 }
//                 Sender {
//                     Address
//                 }
//                 Currency {
//                     Symbol
//                 }
//                 }
//             }
//             }
//         }
//     `;
    
//     try {
        
//         subscriptionMessage_whole = JSON.stringify({
//             type: "start",
//             id: "1",
//             payload: { query: subscriptionQuery_whole }
//         }); 
        
//         subscriptionMessage_whole2 = JSON.stringify({
//             type: "start",
//             id: "1",
//             payload: { query: subscriptionQuery_whole2 }
//         });
//         chainAlertList.forEach((alert) => {
//             if(alert.way === "Minimum"){
//                 bitqueryConnection.send(subscriptionMessage_whole);  

//             }

//             if(alert.way === "Between"){              

//                 bitqueryConnection.send(subscriptionMessage_whole2);  
//             }

//         })

//         console.log("Subscription_whole message sent.");

//     } catch(err){
//         bot.sendMessage(chatId, "There is no wallet address to track")
//     }
// }

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

function Tracking(walletAddresses) {

    try {
        bitqueryConnection = new WebSocket(
            "wss://streaming.bitquery.io/eap?token=" + token,
            ["graphql-ws"]
        );
        
        bitqueryConnection.on("open", () => {
            console.log("Connected to Bitquery.");
    
            const initMessage = JSON.stringify({ type: "connection_init", payload: {} });
            bitqueryConnection.send(initMessage);
        });
        
        bitqueryConnection.on("message", (data) => {
            handleBitqueryResponse(data, walletAddresses, chainAlertList);           
        });
    
        bitqueryConnection.on("close", () => {
            console.log("Disconnected from Bitquery.");
        });
    
        bitqueryConnection.on("error", (error) => {
            console.error("WebSocket Error:", error);
        });
    
    } catch (error) {
        console.error("Connection error:", error);
    }
}

function closeConnection(bitqueryConnection){
    
    if (bitqueryConnection){
        try{
            bitqueryConnection.close();
            console.log("closed bitqueryconnection");
        } catch(err){
            console.log(err);
        }
    } 
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

    console.log("same", sameAddressIndexList);
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

    timeperiod = match[1];
    listSelection();

});

bot.onText(/\/continue/, (msg) => {
    chatId = msg.chat.id;   
    
    bot.sendMessage(chatId, `Start tracking`);
    if (walletData.length >= 1){

        walletAddresses = walletData.map((data) => data.address);        
    }
    // Tracking(walletAddresses);
    if(chainAlertList.length >= 1){

        WholeFilter(chainAlertList, bot, chatId);     
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

// bot.onText(/\/pausewholechain (.+)/, async (msg, match) => {
//     chatId = msg.chat.id;
//     const stopchain = match[1];

   

//         let filter_action;
        
//         filter_action = walletData.find((data) => data.tag === tagName);
//         const targetIndex = walletData.indexOf(filter_action);
//         console.log("index", targetIndex);
//         if(filter_action){
//             filter_action.action = "Pause";
//             console.log("OK");
//         }
            
//         sameAddressIndexList.forEach((item, listIndex) => {
//             if (targetIndex < item.index.length && targetIndex >= 0) { // Check if targetIndex is valid
//                 console.log(`Removing element at index ${targetIndex} in list ${listIndex}`);
//                 item.index.splice(targetIndex, 1); // Remove one element at targetIndex
//             } else {
//                 console.log(`Invalid index for removal: ${targetIndex} in list ${listIndex}`);
//             }
//         }); 
        
//         filter_walletAddresses = walletData.filter((address) => address.tag !== tagName).map((data) => data.address);
//         console.log("filterAddress====>", filter_walletAddresses);
        
//         // closeConnection(bitqueryConnection);
//         Tracking(filter_walletAddresses);

//         bot.sendMessage(chatId, `Paused "${stopAddress}" successfully.\nPlease check using /taglist`);
    

// });

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
            hotwallet_status = "Yes";
            bot.sendMessage(chatId, "Please enter time period(seconds) to track. /timeperiod number");
            break;
        case "Hotwallet No":
            hotwallet_status = "No";
            bot.sendMessage(chatId, "Please enter time period(seconds) to track. /timeperiod number");
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
