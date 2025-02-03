import fs from 'fs';

let Black_result = [];
let Green_result = [];
let Yes_result = [];
let No_result = [];
let jsonData = [];
let filePath;
let between_result = [];
let timestamp;


function isArrayUniform(arr) {
    // Check if array is not empty
    if (arr.length === 0) return false; 

    // Get the first element
    const firstElement = arr[0];

    // Compare every element in the array with the first element
    return arr.every(element => element === firstElement);
}

function JsonData(transactions, timestamp, bot, chatId, message){
    let data = {
        "amount" : transactions.Amount,
        "sender" : transactions.Sender.Address,
        "receiver" : transactions.Receiver.Address,
        "timestamp" : timestamp
    };
    if (filePath === "./Greenlist.json"){
        let check = Green_result.filter((e) => e === data) || "";
        
        if (check == ""){
            bot.sendMessage(chatId, message);
            Green_result.push({...data});
            const jsonData = JSON.stringify(Green_result, null, 2);    
        
            // Write the JSON data to a file
            fs.writeFile(filePath, jsonData, 'utf8', (err) => {
                if (err) {
                console.error("An error occurred while writing the JSON file:", err);
                } else {
                console.log(`JSON file has been saved at GreenList`);
                }
            });
        }
    }

    if (filePath === "./Blacklist.json"){

        let check = Black_result.filter((e) => e === data) || "";
        if (check == ""){
            bot.sendMessage(chatId, message);
            Black_result.push({...data});
            const jsonData = JSON.stringify(Black_result, null, 2);    
        
            // Write the JSON data to a file
            fs.writeFile(filePath, jsonData, 'utf8', (err) => {
                if (err) {
                console.error("An error occurred while writing the JSON file:", err);
                } else {
                console.log(`JSON file has been saved at BlackList`);
                }
            });
        }
    }    
}

function formatTransactionMessage(tag, transactions) {
    return `Transaction Detected:
        - Amount: ${transactions.Amount} ${transactions.Currency.Symbol}
        - Sender: ${transactions.Sender.Address}
        - Receiver: ${transactions.Receiver.Address}\n
        Transaction Tracking from ${tag}`;
}

function sendTelegramAlert(tag, bot, chatId, transactions, timestamp) {
    const message = formatTransactionMessage(tag, transactions);
    
    JsonData(transactions, timestamp, bot, chatId, message);
}

function getDecimalPart(numberStr) {
    const parts = numberStr.toString();
    const decimalPoint = 2;

    return parts.substring(0, decimalPoint);

}

export function Chain_Tracking(bot, chatId, transfers, signatures, chainAlertList){

    let filter_signature = []
    let filtersignature_length;
    let filteramount_length;
    
    chainAlertList.forEach((alert) => {

        if (alert.way === "Minimum"){
            signatures = [...new Set(signatures)]; 
            
            signatures.forEach((i) => {            
                
                console.log(getTransactionDetails(connection, i)+"\n");
                filter_signature = transfers.filter(entry => entry.Transaction.Signature === i);
                
                if (filter_signature){
    
                    filtersignature_length = filter_signature?.length || 1;
                }
                
    
                    if (filtersignature_length >= parseInt(alert.transfer)){
            
                        if (alert.equal === "Yes"){
            
                            let filter_sender = {}
                            filter_signature.forEach((e) => {
                                
                                if (!filter_sender[e.Transfer.Sender.Address]) {
                                    filter_sender[e.Transfer.Sender.Address] = 0;
                                }
                                filter_sender[e.Transfer.Sender.Address]++;
                            });
            
                            let result = Object.keys(filter_sender).forEach(e => {
                                return { address: e, count: filter_sender[e] };
                            });
            
                            result.forEach(data => {
                                if(data.count >= parseInt(alert.transfer)){
                                    const filter_same = filter_signature.filter(e => e.Transfer.Sender.Address === data.address);
                                    const filteramount = filter_same.filter(data => parseFloat(data.Transfer.Amount) >= parseFloat(alert.amount));
                                    // const filteramount = filter_same.filter(data => parseFloat(data.Transfer.Amount) >= parseFloat(chainAlert.amount) && data.Transaction.Result === true);
                                    if (filteramount){
                                        filteramount_length = filteramount?.length || 1;
                                    }
            
                                    if (filteramount_length >= parseInt(alert.transfer)){
                                        let amount_array = [];
                                        filteramount.forEach(item => {
                                            amount_array.push(item.Transfer.Amount)
                                        })
                                        
                                        if(isArrayUniform(amount_array)){
                                            let jsonData;
                                            filteramount.forEach(item => {
                
                                                let message =  `Transaction Detected:
                                                - Amount: ${item.Transfer.Amount} ${item.Transfer.Currency.Symbol}
                                                - Sender: ${item.Transfer.Sender.Address}
                                                - Receiver: ${item.Transfer.Receiver.Address}\n`
                                                bot.sendMessage(chatId, message);
                            
                                                Yes_result.push({...item});
                                                jsonData = JSON.stringify(Yes_result, null, 2);
                
                                            });
                                            // Write the JSON data to a file
                                            fs.writeFile(alert.json, jsonData, 'utf8', (err) => {
                                                if (err) {
                                                console.error("An error occurred while writing the JSON file:", err);
                                                } else {
                                                console.log(`JSON file has been saved`);
                                                }
                                            });
            
                                        }
                                    }
                                }
                            })
                            
                        }
            
                        if (alert.equal === "No"){    
                            
                            console.log("No");
                            let filter_sender = {}
                            filter_signature.forEach((e) => {
                                
                                if (!filter_sender[e.Transfer.Sender.Address]) {
                                    filter_sender[e.Transfer.Sender.Address] = 0;
                                }
                                filter_sender[e.Transfer.Sender.Address]++;
                            });
            
                            let result = Object.keys(filter_sender).forEach(e => {
                                return { address: e, count: filter_sender[e] };
                            });
                            console.log(result);
                            result.forEach(data => {
                                if(data.count >= parseInt(alert.transfer)){
                                    const filter_same = filter_signature.filter(e => e.Transfer.Sender.Address === data.address);
                                    // const filteramount = filter_same.filter(data => parseFloat(data.Transfer.Amount) >= parseFloat(chainAlert.amount) && data.Transaction.Result === true);
                                    const filteramount = filter_same.filter(data => parseFloat(data.Transfer.Amount) >= parseFloat(alert.amount));
                                    if (filteramount){
                                        filteramount_length = filteramount?.length || 1;
                                    }
            
                                    if (filteramount_length >= parseInt(alert.transfer)){
                                        let receiver = [];
                                        filteramount.forEach(e => {
                                            receiver.push(e.Transfer.Receiver.Address)
            
                                        })
                                        let unique = [...new Set(receiver)];
                                        if( JSON.stringify(receiver) === JSON.stringify(unique) ){
                                            
                                            let jsonData;
                                            filteramount.forEach(item => {
                
                                                let message =  `Transaction Detected:
                                                - Amount: ${item.Transfer.Amount} ${item.Transfer.Currency.Symbol}
                                                - Sender: ${item.Transfer.Sender.Address}
                                                - Receiver: ${item.Transfer.Receiver.Address}\n`
                                                bot.sendMessage(chatId, message);
                            
                                                No_result.push({...item});
                                                jsonData = JSON.stringify(No_result, null, 2);
                
                                            });
                                            // Write the JSON data to a file
                                            fs.writeFile(alert.json, jsonData, 'utf8', (err) => {
                                                if (err) {
                                                console.error("An error occurred while writing the JSON file:", err);
                                                } else {
                                                console.log(`JSON file has been saved`);
                                                }
                                            });
                                        }
            
                                    }
                                }
                            })
                            
                                                
                        }
                    }   
                
    
            });
        }
    
        if (alert.way === "Between"){
    
            transfers.forEach(e => {
                if (parseFloat(e.Transfer.Amount) >= parseFloat(alert.amount) && parseFloat(e.Transfer.Amount) <= parseFloat(alert.amount2)){
                    let message =  `Transaction Detected:
                        - Amount: ${e.Transfer.Amount} ${e.Transfer.Currency.Symbol}
                        - Sender: ${e.Transfer.Sender.Address}
                        - Receiver: ${e.Transfer.Receiver.Address}\n`
                    bot.sendMessage(chatId, message);
            
                    between_result.push({...e});
                    jsonData = JSON.stringify(between_result, null, 2);
    
                    // Write the JSON data to a file
                    fs.writeFile(alert.json, jsonData, 'utf8', (err) => {
                        if (err) {
                        console.error("An error occurred while writing the JSON file:", err);
                        } else {
                        console.log(`JSON file has been saved`);
                        }
                    });
                }
            });
        }
    })
}

export default function Transaction_Tracking(transaction, walletData, bot, chatId){
    let transactions;
    // transactions = transactions.map(e => `"${e}"`).join(", ");
    
    transaction.forEach((tran)=>{

        transactions = tran.Transfer;
        timestamp = tran.Block.Time;
        walletData.forEach(item => {
            
            if (parseFloat(transactions.Amount) > 0.0000001){
                
                if (item.style === "Receiver") {
                    filePath = item.list;
                    if ( item.address === transactions.Receiver.Address && item.threshold === "Greater" && item.action === "Active"){
                        
                        if (parseFloat(transactions.Amount) > parseFloat(item.amount)){
                        
                            sendTelegramAlert(item.tag, bot, chatId, transactions, timestamp);
                    }        
                    }
            
                    if (item.address === transactions.Receiver.Address && item.threshold === "Less" && item.action === "Active"){
                        
                        if (parseFloat(transactions.Amount) < parseFloat(item.amount)){
                            
                            sendTelegramAlert(item.tag, bot, chatId, transactions, timestamp);
                        }        
                    }
            
                    if (item.address === transactions.Receiver.Address && item.threshold === "Same" && item.action === "Active"){
                        
                        if (parseFloat(transactions.Amount) === parseFloat(item.amount)){
                            
                            sendTelegramAlert(item.tag, bot, chatId, transactions, timestamp);
                        }        
                    }
    
                    if (item.address === transactions.Receiver.Address && item.threshold === "Decimal" && item.action === "Active"){
                        const transactionsAmount = transactions.Amount.toString().split('.')[1];
                        const filterDataAmount = item.amount.toString().split('.')[1];
    
                        const transactionsDecimalPart = getDecimalPart(transactionsAmount);
                        const filterDataDecimalPart = getDecimalPart(filterDataAmount);
    
                        if (transactionsDecimalPart === filterDataDecimalPart){
                            
                            sendTelegramAlert(item.tag, bot, chatId, transactions, timestamp);
                            
                        }        
                    }
                }
    
                if (item.style === "Sender") {
                    filePath = item.list;
                    if ( item.address === transactions.Sender.Address && item.threshold === "Greater" && item.action === "Active"){
                    
                        if (parseFloat(transactions.Amount) > parseFloat(item.amount)){
                        
                            sendTelegramAlert(item.tag, bot, chatId, transactions, timestamp);
                        }        
                    }
            
                    if (item.address === transactions.Sender.Address && item.threshold === "Less" && item.action === "Active"){
                        
                        if (parseFloat(transactions.Amount) < parseFloat(item.amount)){
                            
                            sendTelegramAlert(item.tag, bot, chatId, transactions, timestamp);
                        }        
                    }
            
                    if (item.address === transactions.Sender.Address && item.threshold === "Same" && item.action === "Active"){
                        
                        if (parseFloat(transactions.Amount) === parseFloat(item.amount)){
                            
                            sendTelegramAlert(item.tag, bot, chatId, transactions, timestamp);
                        }        
                    }
    
                    if (item.address === transactions.Sender.Address && item.threshold === "Decimal" && item.action === "Active"){
                        const transactionsAmount = transactions.Amount.toString().split('.')[1];
                        const filterDataAmount = item.amount.toString().split('.')[1];
    
                        const transactionsDecimalPart = getDecimalPart(transactionsAmount);
                        const filterDataDecimalPart = getDecimalPart(filterDataAmount);
    
                        if (transactionsDecimalPart === filterDataDecimalPart){
                            
                            sendTelegramAlert(item.tag, bot, chatId, transactions, timestamp);
                            
                        }        
                    }
                }
    
                if (item.style === "Both") {
                    filePath = item.list;
                    if ( (item.address === transactions.Receiver.Address || item.address === transactions.Sender.Address) && item.threshold === "Greater" && item.action === "Active"){
                    
                        if (parseFloat(transactions.Amount) > parseFloat(item.amount)){
                        
                            sendTelegramAlert(item.tag, bot, chatId, transactions, timestamp);
                    }        
                    }
            
                    if ( (item.address === transactions.Receiver.Address || item.address === transactions.Sender.Address) && item.threshold === "Less" && item.action === "Active"){
                        
                        if (parseFloat(transactions.Amount) < parseFloat(item.amount)){
                            
                            sendTelegramAlert(item.tag, bot, chatId, transactions, timestamp);
                        }        
                    }
            
                    if ( (item.address === transactions.Receiver.Address || item.address === transactions.Sender.Address) && item.threshold === "Same" && item.action === "Active"){
                        
                        if (parseFloat(transactions.Amount) === parseFloat(item.amount)){
                            
                            sendTelegramAlert(item.tag, bot, chatId, transactions, timestamp);
                        }        
                    }
    
                    if ( (item.address === transactions.Receiver.Address || item.address === transactions.Sender.Address) && item.threshold === "Decimal" && item.action === "Active"){
                        const transactionsAmount = transactions.Amount.toString().split('.')[1];
                        const filterDataAmount = item.amount.toString().split('.')[1];
    
                        const transactionsDecimalPart = getDecimalPart(transactionsAmount);
                        const filterDataDecimalPart = getDecimalPart(filterDataAmount);
    
                        if (transactionsDecimalPart === filterDataDecimalPart){
                            
                            sendTelegramAlert(item.tag, bot, chatId, transactions, timestamp);
                            
                        }        
                    }
                }
            }
        });
    })

}