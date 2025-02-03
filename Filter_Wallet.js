import {appendToJsonFile} from './Filter_Whole.js';

function compareDecimalPart(numberStr1, numberStr2) {
    try {
        const decimalpart = '.' + numberStr1.split('.')[1].substring(0, 2);
        return numberStr2.indexOf(decimalpart) > -1;
    } catch (e) {
        return false;
    }
}

async function fetchData(url) {
    
    const requestOptions = {
        method: "get",
        headers: {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3MzAxMzM2MTMwMDAsImVtYWlsIjoidGhlZGF2aWRwaGVsYW5AZ21haWwuY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiYXBpVmVyc2lvbiI6InYyIiwiaWF0IjoxNzMwMTMzNjEzfQ.XeqZ18fV87M9PLzULrij7XJduCDE4vImQCV1zMSnNtk"}
        }
        
        return fetch(url, requestOptions)
        .then(response => response.json())
        .then(response => response.success ? response.data : []);
}     

export default function WalletFilter(walletData, bot, chatId){
    
    try {
        console.log("Wallet Tracking...");
        Promise.all(walletData.map((wallet) => {
            
            if (wallet.style === "Both"){
                
                return fetchData(`https://pro-api.solscan.io/v2.0/account/transfer?address=${wallet.address}&activity_type[]=ACTIVITY_SPL_TRANSFER&token=So11111111111111111111111111111111111111111&exclude_amount_zero=true&page=1&page_size=20&sort_by=block_time&sort_order=desc`);
            }
    
            if (wallet.style === "Receiver"){
                return fetchData(`https://pro-api.solscan.io/v2.0/account/transfer?address=${wallet.address}&activity_type[]=ACTIVITY_SPL_TRANSFER&token=So11111111111111111111111111111111111111111&exclude_amount_zero=true&flow=in&page=1&page_size=20&sort_by=block_time&sort_order=desc`);
            }
    
            if (wallet.style === "Sender"){
                return fetchData(`https://pro-api.solscan.io/v2.0/account/transfer?address=${wallet.address}&activity_type[]=ACTIVITY_SPL_TRANSFER&token=So11111111111111111111111111111111111111111&exclude_amount_zero=true&flow=out&page=1&page_size=20&sort_by=block_time&sort_order=desc`);
            }
        }))
        .then(results => {
            let greenList = [];
            let blackList = [];
            results.forEach((data, index) => {
                
                const filtered = data.filter((tran)=>{
                    if (parseFloat(tran.amount)/1e9 > 0.0000001 && walletData[index].action === "Active" && !walletData[index].latest.find(l => JSON.stringify(l) === JSON.stringify(tran))){

                        if (
                            (walletData[index].style === "Receiver" && walletData[index].address === tran.to_address) ||
                            (walletData[index].style === "Sender" && walletData[index].address === tran.from_address) ||
                            (walletData[index].style === "Both" && (walletData[index].address === tran.to_address || walletData[index].address === tran.from_address))
                        ) {
                            if (
                                (walletData[index].threshold === "Greater" && parseFloat(tran.amount)/1e9 > parseFloat(walletData[index].amount)) ||
                                (walletData[index].threshold === "Less" && parseFloat(tran.amount)/1e9 < parseFloat(walletData[index].amount)) ||
                                (walletData[index].threshold === "Same" && parseFloat(tran.amount)/1e9 === parseFloat(walletData[index].amount)) ||
                                (walletData[index].threshold === "Decimal" && compareDecimalPart(walletData[index].amount.toString(), (parseFloat(tran.amount)/1e9).toString()))
                            ) {
                                return true;
                            }
                        }
                    }
                    return false;
                });
                
                if (walletData[index].list === './Blacklist.json') {
                    blackList = [...blackList, ...filtered];
                } else {
                    greenList = [...greenList, ...filtered];
                }
                walletData[index].latest = data;
                walletData[index].alert += filtered.length;
            })

            appendToJsonFile("./Blacklist.json", blackList);
            appendToJsonFile("./Greenlist.json", greenList);
        })
        .catch(err => {});
        return walletData;
        
    } catch (error) {}
};


