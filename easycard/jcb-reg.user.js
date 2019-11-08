// ==UserScript==
// @name         [EasyCard] JCB campaign helper
// @namespace    https://pingu.moe/
// @version      0.1.2
// @description  Help to half-automatic the register process
// @author       PinGu
// @homepage     https://pingu.moe/
// @icon         https://www.easycard.com.tw/styles/images/common/easycard.png
// @match        https://ezweb.easycard.com.tw/Event01/JCBLoginRecordServlet
// @grant        none
// ==/UserScript==
"use strict";

let cardpool = [];
let keypool = [];
let url;
let method;

const useReg = () => {
	url = "https://ezweb.easycard.com.tw/Event01/JCBLoginServlet";
	method = "loginAccept";
};
const useQry = () => {
	url = "https://ezweb.easycard.com.tw/Event01/JCBLoginRecordServlet";
	method = "queryLoginDate";
};

const cb_captcha_success = (response) => {
	let card = cardpool.shift(); // remove first
	if (card === undefined) return;
	jworker(response, card);
	cardpool.push(card); // add to end
	grecaptcha.reset();
};

function jworker(key, card) {
	$.ajax({
		"url": url,
		"data": Object.assign({
			"method": method,
			"accept": "",
			"g-recaptcha-response": key
		}, card.d),
		"success": cb_xhr_done,
		"error": cb_xhr_error,
		"type": "POST",
		"timeout": 20000,
		"cache": false,
		"retry": 6,
		"cn": card.n,
		"cf": card.d.txtEasyCard4
	});
}

function cb_xhr_done(body) {
	if (method == "queryLoginDate")
		return cb_xhr_done_query.call(this, body);
	if (/驗證碼錯誤/.test(body))
		return; // drop this session
	let found = /\<div.*(開放|成功|已經|已滿).*\<\/div\>/.exec(body);
	if (found !== null && found.length > 1) {
		let msg;
		switch (found[1]) {
			case '開放':
				msg = '本月份尚未開始註冊'; break;
			case '成功':
				msg = this.cn + this.cf + '註冊成功'; break;
			case '已經':
				msg = this.cn + this.cf + '註冊成功(重複)'; break;
			case '已滿':
				msg = this.cn + this.cf + '註冊失敗(額滿)'; break;
			default:
				msg = 'ERROR'; break;
		}
		console.log('ec: ' + msg);
		$("#card_" + this.cf).text(msg);
		cardpool = cardpool.filter(function (card) { return card.n != this.cn }, this);
	}
}

function cb_xhr_done_query(body) {
	var ctx = $(body);
	ctx.find("table#search_tb tr:has(td)").each((idx, elem) => {
		var e = $(elem).find("td");
		console.log(this.cn + this.cf + ': ' + $.trim(e.eq(0).text()) + ' => ' + $.trim(e.eq(1).text()));
	});
	cardpool = cardpool.filter(function (card) { return card.n != this.cn }, this);
}

function cb_xhr_error() {
	if ((this.retry--) > 0) $.ajax(this);
	return;
}

let dom;
useReg();
console.log('ec: initializing...');
window.cb_captcha_success = cb_captcha_success;
window.useReg = useReg;
window.useQry = useQry;

dom = document.querySelector("div.step1").appendChild(document.querySelector(".g-recaptcha"));
dom.setAttribute("data-theme", "dark");
dom.setAttribute("data-callback", "cb_captcha_success");

dom = document.querySelectorAll("div.nav, div.step2, #form1");
dom.forEach(e => e.remove());

dom = document.querySelector("div.step1");
dom.setAttribute("align", "center");

cardpool.forEach(card => {
	let e = dom.appendChild(document.createElement("div"));
	e.setAttribute("id", "card_" + card.d.txtEasyCard4);
});