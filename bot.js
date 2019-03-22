var Yobit = require('yobit');
var request = require('request');
var colors = require('colors/safe');
var fs = require('fs');
APIKEY = "";
SECRET = "";
// Test public data APIs
var info = {};
var publicClient = new Yobit();
var privateClient = new Yobit(APIKEY,SECRET)
var buy = 1 ;

/////////////////////ЛОГИ////////////////////../
const log4js = require('log4js');
log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
  categories: { default: { appenders: ['cheese'], level: 'debug' } }
});

const logger = log4js.getLogger();
///////////////////////////////////////////////
var options = {
  url: 'https://yobit.net/api/3/ticker/eth_btc',
  headers: {
    'User-Agent': 'request'
  }
};
 
function callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    info = JSON.parse(body);
    logger.debug(colors.magenta.bold("[КУРС ETH/BTC]"));
    logger.debug(colors.magenta.bold("[Покупка]:"+info.eth_btc.sell));
    logger.debug(colors.magenta.bold("[Продажа]:"+info.eth_btc.buy));
    var timeupdate = new Date(info.eth_btc.updated*1000);
    logger.debug(colors.magenta.bold("[Данные на]:"+timeupdate)); 
    status_trade = fs.readFileSync("orderid.txt", "utf8");
    if(status_trade == 0){
    	analyze();
    }else{
    privateClient.getOrderInfo(function(err,data){
         var myArray = JSON.stringify(data.return);  
         myArray = myArray.replace(status_trade,"id");
         myArray = JSON.parse(myArray);
         logger.debug("Статус продажи: "+myArray.id.status);
         if(myArray.id.status == 1 || myArray.id.status == 2 ){
         fs.writeFileSync("orderid.txt",0);	
         }else{
         	logger.debug("Похоже мы еще не продали старое!Подождите!");
         }
    	return true},"eth_btc",status_trade)
         }
  }
}
function analyze(){
///////////Запрос данных пользователя/////////////////////////
privateClient.getInfo(function(err,data){
	var b_btc = Number(data.return.funds_incl_orders.btc);
    logger.debug(colors.green.bold("[Ваш баланс]BTC:"+b_btc.toFixed(8)));
    var b_eth = Number(data.return.funds_incl_orders.eth);
     logger.debug(colors.green.bold("[Ваш баланс]ETH:"+b_eth.toFixed(8)));
    //////////РАСЧЕТ ПОКУПКИ///////////////////
     if(buy == 1){
     buy_w_percent = data.return.funds_incl_orders.btc*998/1000;
     buy_w = buy_w_percent.toFixed(8)/info.eth_btc.sell.toFixed(8);
     buy_w_nopercent = data.return.funds_incl_orders.btc/info.eth_btc.sell;
     raz = (buy_w_nopercent.toFixed(8)-buy_w.toFixed(8))*2;
     var summ = Number(buy_w.toFixed(8))+Number(raz.toFixed(8));
     logger.debug("Я получу:"+buy_w.toFixed(8)+"[ETH] с учетом процентов и потрачу- "+(buy_w.toFixed(8)*info.eth_btc.sell).toFixed(8));
     logger.debug("Я получу:"+buy_w_nopercent.toFixed(8)+"[ETH] без процентов - "+(buy_w_nopercent.toFixed(8)*info.eth_btc.sell).toFixed(8));
     //logger.debug(summ);
     var sovet = buy_w_percent.toFixed(8)/summ.toFixed(8);
     logger.debug("Я советую купить "+ summ +" по курсу "+ sovet.toFixed(8));
     logger.debug("Покупаю.......");
     ///////////////////////////////////////////
     privateClient.addTrade(function(err,data){
     if(data.success == 0){
     	logger.debug("Продажа/Покупка пошла по пезде")
     }else{
     	//logger.debug(data);
     	logger.debug("Я купил!Ждем дальнейших действий");
     	var int = (buy_w.toFixed(8)*info.eth_btc.sell).toFixed(8);
     	fs.writeFileSync("old.txt", int);
     	fs.writeFileSync("orderid.txt", data.return.order_id);
     	buy = 0;
     }
    return true},'eth_btc','buy',summ.toFixed(8),sovet.toFixed(8))
     ///////////////////////////////////////////////////////////////
         }else{
     var summ = Number(b_eth.toFixed(8));
     var old_buy = fs.readFileSync("old.txt", "utf8");
     var sell_w_percent = ((old_buy*2/1000)*2);
     sell_w_percent = Number(sell_w_percent);
     old_buy = Number(old_buy);
     logger.debug(sell_w_percent.toFixed(8));
     var sovet= (sell_w_percent+old_buy);
     sovet = (sovet/summ).toFixed(8);
     //logger.debug(summ);
     logger.debug("Я советую купить "+ summ +" по курсу "+ sovet);
     logger.debug("Покупаю.......");
      ///////////////////////////////////////////
     privateClient.addTrade(function(err,data){
     if(data.success == 0){
     	logger.debug("Продажа/Покупка пошла по пезде")
     }else{
     	logger.debug(data);
     	logger.debug("Я купил!Ждем дальнейших действий");
     	fs.writeFileSync("orderid.txt", data.return.order_id);
     	buy = 1
     }
    return true},'eth_btc','sell',summ.toFixed(8),sovet)
 }
         
    //////////////////////////////////////////
    return true}, {})
}

var timerId = setInterval(function() {
  request(options, callback);
}, 10000);

/*var optionsx = {
  url: 'https://api.coinmarketcap.com/v1/ticker/bitcoin/?convert=RUB',
  headers: {
    'User-Agent': 'request'
  }
};
 
function callbackx(error, response, body) {
  if (!error && response.statusCode == 200) {
    var info = JSON.parse(body);
    logger.debug(colors.magenta.bold("[КУРС RUB/BTC]"+info[0].price_rub+"RUB"));
  }
}
request(optionsx, callbackx);*/
/*publicClient.getTrades(logger.debug, 'eth_btc', 1);*/