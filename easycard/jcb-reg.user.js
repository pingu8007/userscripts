// ==UserScript==
// @name         [EasyCard] JCB campaign helper
// @namespace    https://pingu.moe/
// @version      0.9.1
// @description  Help to half-automatic the register process
// @author       PinGu
// @homepage     https://pingu.moe/
// @icon         https://www.easycard.com.tw/styles/images/common/easycard.png
// @match        https://ezweb.easycard.com.tw/Event01/JCBLoginRecordServlet
// @grant        none
// @inject-into  page
// ==/UserScript==
'use strict';

let cardpool;
let op;

const captcha_matcher = /驗證碼錯誤/;
const keyword_matcher = /\<div.*(開放|成功|已經|已滿).*\<\/div\>/;

const reset_cards = window.reset_cards = () => {
	cardpool = window.cards.filter(i => "J" === i.vendor);
	console.log("ec: card_pool is reseted");
	return cardpool;
}

const use_profile = window.use_profile = profile => {
	switch (profile.toLowerCase()) {
		case "reg":
			op = {
				"url": "/Event01/JCBLoginServlet",
				"method": "loginAccept",
				"success_handler": cb_reg_done,
				"error_handler": cb_error,
			};
			console.log("ec: use registering profile");
			break;
		case "qry":
		default:
			op = {
				"url": "/Event01/JCBLoginRecordServlet",
				"method": "queryLoginDate",
				"success_handler": cb_qry_done,
				"error_handler": cb_error,
			};
			console.log("ec: use querying profile");
			break;
	}
	return reset_cards();
}

const toForm = card => ({
	"txtEasyCard1": card.ec[0],
	"txtEasyCard2": card.ec[1],
	"txtEasyCard3": card.ec[2],
	"txtEasyCard4": card.ec[3],
	"txtCreditCard1": card.cc[0],
	"txtCreditCard2": card.cc[1].substr(0, 2),
	"txtCreditCard4": card.cc[3],
});

// will be invoked once recaptcha complete
const job_dispatcher = window.dispatcher = key => {
	let card = cardpool.shift(); // remove first
	if (card !== undefined) {
		job_runner(key, card);
		cardpool.push(card); // append to end
	}
	grecaptcha.reset();
};

const job_runner = (key, card) => $.ajax({
	"url": op.url,
	"data": Object.assign({
		"method": op.method,
		"accept": "",
		"g-recaptcha-response": key,
	}, toForm(card)),
	"success": op.success_handler,
	"error": op.error_handler,
	"type": "POST",
	"timeout": 20000,
	"cache": false,
	"retry": 6,
	"card": card,
});

function cb_reg_done(body) {
	// captcha failed or expired
	if (captcha_matcher.test(body))
		return; // drop this session

	let found = keyword_matcher.exec(body);
	if (found !== null && found.length > 1) {
		let msg;
		switch (found[1]) {
			case '開放': msg = '本月份尚未開始註冊';
				break;
			case '成功': msg = '註冊成功';
				break;
			case '已經': msg = '註冊成功(重複)';
				break;
			case '已滿': msg = '註冊失敗(額滿)';
				break;
			default: msg = 'ERROR';
				break;
		}
		console.log(`ec: ${this.card.toString()}${msg}`);
		cardpool = cardpool.filter(card => card.id != this.card.id);
	}
}

function cb_qry_done(body) {
	let ctx = $(body);
	let card = this.card;
	let log_area = $("#log_area").empty();
	$("<p>").text("Registering history of " + card.name).addClass("log_" + card.ec[3]).appendTo(log_area);
	ctx.find("table#search_tb tr:has(td)").each((idx, elem) => {
		let e = $(elem).find("td");
		let msg = `${e[0].innerText.trim()} => ${e[1].innerText.trim()}`;
		$("<p>").text(msg).addClass("log_" + card.ec[3]).appendTo(log_area);
		console.log(`ec: ${this.card.toString()} ${msg}`);
	});
	cardpool = cardpool.filter(card => card.id != this.card.id);
}

function cb_error() {
	if ((this.retry--) > 0) $.ajax(this);
}

// JCBLoginRecordServlet comes with jq 1.6, .on() unavailable.
$(window).bind("easycard.ready", function (e, cards) {
	console.log('ec: initializing...');
	use_profile(new Date().getDate() == 1 ? "reg" : "qry");
	window.cards.forEach(card => {
		let e = document.querySelector("div.step1").appendChild(document.createElement("div"));
		e.setAttribute("id", "card_" + card.ec[3]);
	});
});

let dom;

// configure recaptcha
dom = document.querySelector("div.step1").appendChild(document.querySelector(".g-recaptcha"));
dom.setAttribute("data-theme", "dark");
dom.setAttribute("data-callback", "dispatcher");

// remove unnecessary elements
dom = document.querySelectorAll("div.nav, div.step2, #form1");
dom.forEach(e => e.remove());

// add display window
dom = document.querySelector("div.step1");
dom.setAttribute("align", "center");
dom.style.margin = "auto";
dom.style.width = "300px";
dom.style.minWidth = "300px";
dom.appendChild(document.createElement("div")).setAttribute("id", "log_area");