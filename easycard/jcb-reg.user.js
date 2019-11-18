// ==UserScript==
// @name         [EasyCard] JCB campaign helper
// @namespace    https://pingu.moe/
// @version      1.0.0
// @description  Help to half-automatic the register process
// @author       PinGu
// @homepage     https://pingu.moe/
// @icon         easycard.png
// @match        https://ezweb.easycard.com.tw/Event01/JCBLoginRecordServlet
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @grant        none
// @inject-into  page
// ==/UserScript==
'use strict';

const $ = jQuery.noConflict(true);

/**
 * @type {Card[]}
 */
let cardpool;

/**
 * @type {Function}
 */
let operation;

/**
 * Clear log and reload card pool
 * @returns {Card[]} Refreshed card pool
 */
const reset_cards = window.reset_cards = () => {
	cardpool = window.cards.filter(i => "J" === i.vendor);
	$("#log_area").empty();
	console.log(`ec: card pool reloaded, ${cardpool.length} cards in pool`);
	return cardpool;
}

/**
 * Refresh card pool and hook corresponding worker onto callback
 * @returns {Card[]} Refreshed card pool
 */
const use_profile = window.use_profile = profile => {
	switch (profile.toLowerCase()) {
		case "r":
		case "reg":
		case "register":
			operation = do_reg;
			console.log("ec: use registering profile");
			break;
		case "q":
		case "qry":
		case "query":
		default:
			operation = do_qry;
			console.log("ec: use querying profile");
			break;
	}
	return reset_cards();
}

/**
 * Get next available Card from card pool
 * @param {boolean} Also include Card that already finished
 * @returns {Card} Next available Card, or undefined if nothing left.
 */
const getNext = all => {
	let times = 0;
	while (times < cardpool.length) {
		const card = cardpool.shift();
		cardpool.push(card);
		if (!card.done || all) return card;
		times++;
	}
	return undefined;
}

/**
 * Convert Card to register form
 * @param {Card} card 
 */
const toForm = card => ({
	"txtEasyCard1": card.ec[0],
	"txtEasyCard2": card.ec[1],
	"txtEasyCard3": card.ec[2],
	"txtEasyCard4": card.ec[3],
	"txtCreditCard1": card.cc[0],
	"txtCreditCard2": card.cc[1].substr(0, 2),
	"txtCreditCard4": card.cc[3],
});

/**
 * Callback function on reCAPTCHA completed
 * @param {string} key 
 */
const job_dispatcher = window.dispatcher = key => {
	grecaptcha.reset();
	operation(key);
};

/**
 * Main procedure to register cards
 * @param {string} key 
 */
const do_reg = async key => {
	const card = getNext(false);
	if (!card) return;

	const payload = {
		"url": "/Event01/JCBLoginServlet",
		"data": Object.assign({
			"method": "loginAccept",
			"accept": "",
			"g-recaptcha-response": key,
		}, toForm(card)),
		"type": "POST",
		"timeout": 20000,
		"cache": false
	};

	let coin = 6;
	while (coin-- > 0) {
		let body;
		try { body = await $.ajax(payload); } catch (error) { continue; }
		// Check if reCAPTCHA test successed
		if (/驗證碼錯誤/.test(body)) return;
		const found = /\<div.*(開放|成功|已經|已滿).*\<\/div\>/.exec(body);
		if (!found) return;
		let msg = card.toString() + "-";
		switch (found[1]) {
			case '開放': msg += '尚未開放'; break;
			case '成功': msg += '註冊成功'; break;
			case '已經': msg += '註冊重複成功'; card.done = true; break;
			case '已滿': msg += '註冊額滿失敗'; card.done = true; break;
			default: msg += 'ERROR'; break;
		}
		console.log("ec: " + msg);
		$("#log_area").prepend($("<p>").text(msg));
		return;
	}
}

/**
 * Main procedure to query register-records
 * @param {string} key 
 */
const do_qry = async key => {
	const card = getNext(true);
	if (!card) return;

	const payload = {
		"url": "/Event01/JCBLoginRecordServlet",
		"data": Object.assign({
			"method": "queryLoginDate",
			"accept": "",
			"g-recaptcha-response": key,
		}, toForm(card)),
		"type": "POST",
		"timeout": 20000,
		"cache": false
	};

	let coin = 6;
	while (coin-- > 0) {
		let ctx;
		try { ctx = $(await $.ajax(payload)); } catch (error) { continue; }
		const log_area = $("#log_area").empty();
		$("<p>").text("Registering history of " + card.toString()).appendTo(log_area);
		ctx.find("table#search_tb tr:has(td)").each((idx, elem) => {
			let e = $(elem).find("td");
			let msg = `${e.eq(0).text().trim()} => ${e.eq(1).text().trim()}`;
			console.log(`ec: ${card.toString()} ${msg}`);
			$("<p>").text(msg).appendTo(log_area);
		});
		return;
	}
}

// configure recaptcha
$(".g-recaptcha").attr({
	"data-theme": "dark",
	"data-callback": "dispatcher"
}).appendTo("div.step1");

// remove unnecessary elements
$("div.nav, div.step2, #form1").remove();

// add display window
$("div.step1").attr("align", "center").css({
	"margin": "auto",
	"width": "300px",
	"min-width": "300px"
}).append($("<div>").attr("id", "log_area"));

$(window).on("easycard_ready", function (e) {
	console.log('ec: initializing...');
	use_profile(new Date().getDate() == 1 ? "reg" : "qry");
});