import fs, { write } from 'fs';
import json from 'big-json';
import lockfile from 'proper-lockfile';

// Function to read, modify, and save JSON data
export function appendToJsonFile(filePath, newData) {
    
    if (newData.length === 0) return;
    
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '[]');
        }
        function writeFile () {
            lockfile.lock(filePath)
            .then((release) => {
                const readStream = fs.createReadStream(filePath);
                const parseStream = json.createParseStream();
    
                parseStream.on('data', function(data) {
                    let jsonData = '';
                    const stringifyStream = json.createStringifyStream({
                        body: [...data, ...newData]
                    });
                
                    stringifyStream.on('data', function(strChunk) {
                        jsonData += strChunk;
                    });
                    stringifyStream.on("end", () => {
                        fs.writeFile(filePath, jsonData, (e) => {
                            release();
                        });
                    });
                });
    
                readStream.pipe(parseStream);
            })
            .catch((err) => {
                setTimeout(() => writeFile(), 500)
            }); 
        }
        writeFile();
        
    } catch(err){() =>{
        // cleanUp && cleanUp();
    }}
}


async function fetchData(amount1, amount2) {
    const requestOptions = {
        method: "GET",
        headers: {
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3MzAxMzM2MTMwMDAsImVtYWlsIjoidGhlZGF2aWRwaGVsYW5AZ21haWwuY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiYXBpVmVyc2lvbiI6InYyIiwiaWF0IjoxNzMwMTMzNjEzfQ.XeqZ18fV87M9PLzULrij7XJduCDE4vImQCV1zMSnNtk"
        }
      };
      
    return fetch(`https://pro-api.solscan.io/v2.0/token/transfer?address=So11111111111111111111111111111111111111111&activity_type[]=ACTIVITY_SPL_TRANSFER&amount[]=${amount1}&amount[]=${amount2}&exclude_amount_zero=true&page=1&page_size=100&sort_by=block_time&sort_order=desc`, requestOptions)
      .then(response => response.json())
      .then(res => res.success ? res.data : [])
      .catch(e => {});
}

export default function WholeFilter(chainAlertList, bot, chatId) {
    try {
        console.log("Chain Tracking...");
        Promise.all(chainAlertList.map((chainAlert) => {
            return fetchData(chainAlert.amount, chainAlert.amount2 || 1000000)
        }))
        .then(results => {
            // console.log("fetched data!", results);
            let greenList = [];
            let blackList = [];
            results.forEach((result, index) => {
                let filtered = [];
                if(chainAlertList[index].way === "Between") {
                    filtered = result.filter(e => !chainAlertList[index].latest.find(list => JSON.stringify(list) === JSON.stringify(e)));
                } else {
                    const stat = {};
                    result.forEach((e) => {
                        if (parseFloat(chainAlertList[index].amount) <= parseFloat(e.amount)/1e9 && !chainAlertList[index].latest.find(list => JSON.stringify(list) === JSON.stringify(e))) {
                            if (!stat[e.trans_id]) stat[e.trans_id] = {};
                            if (chainAlertList[index].equal === "Yes") {
                                if (!stat[e.trans_id][e.from_address]) stat[e.trans_id][e.from_address] = {};
                                if (stat[e.trans_id][e.from_address][e.amount] === undefined) {
                                    stat[e.trans_id][e.from_address][e.amount] = 0;
                                } else {
                                    stat[e.trans_id][e.from_address][e.amount] = stat[e.trans_id][e.from_address][e.amount] + 1;
                                }
                            } else {
                                if (stat[e.trans_id][e.from_address] === undefined) {
                                    stat[e.trans_id][e.from_address] = 0;
                                } else {
                                    stat[e.trans_id][e.from_address] = stat[e.trans_id][e.from_address] + 1;
                                }
                            }
                            
                        }
                    })
                    
                    filtered = result.filter((e) => {
                        if (chainAlertList[index].equal === "Yes")
                            return stat[e.trans_id][e.from_address][e.amount] >= chainAlertList[index].transfer;
                        else return stat[e.trans_id][e.from_address] >= chainAlertList[index].transfer;
                    })
                }
                
                if (chainAlertList[index].json === './Greenlist.json') {
                    greenList = [...greenList, ...filtered]
                } else {
                    blackList = [...blackList, ...filtered]
                }
                chainAlertList[index].latest = result;
                chainAlertList[index].alert += filtered.length;
            })

            appendToJsonFile("./Greenlist.json", greenList);
            appendToJsonFile("./Blacklist.json", blackList);
        })
        .catch(err => {});
        return chainAlertList;
        
    } catch (error) {};
}

