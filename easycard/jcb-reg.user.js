// ==UserScript==
// @name         [EasyCard] JCB campaign helper
// @namespace    https://pingu.moe/
// @version      1.1.1
// @description  Help to half-automatic the register process
// @author       PinGu
// @homepage     https://pingu.moe/
// @icon         easycard.png
// @match        https://ezweb.easycard.com.tw/Event01/JCBLoginRecordServlet
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @grant        none
// @inject-into  page
// ==/UserScript==
'use strict';

const $ = jQuery.noConflict(true);

let cardmap = {};

/**
 * @type {Function}
 */
let operation;

/**
 * Clear log and reload card pool
 * @returns {Card[]} Refreshed card pool
 */
const resetCards = window.resetCards = () => {
	console.log('ec: initializing...');
	optCard.empty();
	cardmap = {};

	let cardpool = window.cards.filter(i => "JCB" === i.vendor).map(c => {
		delete c.done;
		cardmap[c.toCardShort()] = c;
		optCard.append($("<option>").attr("value", c.toCardShort()).text(c.toString()));
		return c;
	});
	optCard.prop("selectedIndex", 0);

	logArea.empty();
	console.log(`ec: card pool reloaded, ${cardpool.length} cards in pool`);
	return cardpool;
}

/**
 * Get selected card from cardpool, and set \<select\> to next possible Card.
 * @param {boolean} all Also include Card that already finished
 * @returns {Card} Selected card, or undefined if nothing selected.
 */
const getNext = all => {
	const last = optCard.val();
	const opts = optCard.children("option");
	let cur = optCard.prop("selectedIndex");
	cur = cur < 0 ? 0 : cur;

	let times = 0;
	while (times < opts.length) {
		cur = cur < opts.length - 1 ? cur + 1 : 0;
		if (!cardmap[opts.eq(cur).val()].done || all) {
			optCard.prop("selectedIndex", cur);
			break;
		}
		times++;
	}
	return last == null ? undefined : cardmap[last];
}

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
const doReg = async key => {
	const card = getNext(false);
	if (!card) return;

	const logEntry = $("<p>");
	logArea.prepend(logEntry.text(`${card.toString()} is starting`));

	const payload = {
		"url": "/Event01/JCBLoginServlet",
		"data": {
			"method": "loginAccept",
			"accept": "",
			"g-recaptcha-response": key,
			"txtEasyCard1": card.ecid.slice(0, 4),
			"txtEasyCard2": card.ecid.slice(4, 8),
			"txtEasyCard3": card.ecid.slice(8, 12),
			"txtEasyCard4": card.ecid.slice(12, 16),
			"txtCreditCard1": card.prefix.slice(0, 4),
			"txtCreditCard2": card.prefix.slice(4, 6),
			"txtCreditCard4": card.surfix.slice(0, 4),
		},
		"type": "POST",
		"timeout": 20000,
		"cache": false
	};

	let times = 0;
	const maxTimes = 3;
	while (times++ < maxTimes) {
		let body;
		try {
			logEntry.text(`${card.toString()} is running (${times}/${maxTimes})`);
			body = await $.ajax(payload);
		} catch (error) {
			logEntry.text(`${card.toString()} request failed (${times}/${maxTimes})`);
			continue;
		}
		// Check reCAPTCHA result
		if (/驗證碼錯誤/.test(body)) {
			logEntry.text(`${card.toString()} reCaptcha expired`);
			return;
		}
		// Check register result
		const found = /\<div.*(開放|成功|已登錄|已滿|上限).*\<\/div\>/.exec(body);
		if (!found) {
			logEntry.text(`${card.toString()} failed`);
			return;
		}
		switch (found[1]) {
			case '開放':
				logEntry.text(`${card.toString()} 未開放`);
				break;
			case '成功':
				logEntry.text(`${card.toString()} 登錄成功`);
				break;
			case '已登錄': // 已登錄過本月活動
				logEntry.text(`${card.toString()} 登錄重複`);
				card.done = true;
				break;
			case '已滿': // 很抱歉，本月份登錄名額已滿
				logEntry.text(`${card.toString()} 已額滿`);
				card.done = true;
				break;
			case '上限': // 本年度登錄次數超過上限
				logEntry.text(`${card.toString()} 已達上限`);
				card.done = true;
				break;
			default:
				logEntry.text(`${card.toString()} requested but failed`);
				break;
		}
		return;
	}
}

/**
 * Main procedure to query register-records
 * @param {string} key 
 */
const doQry = async key => {
	const card = getNext(true);
	if (!card) return;

	const payload = {
		"url": "/Event01/JCBLoginRecordServlet",
		"data": {
			"method": "queryLoginDate",
			"accept": "",
			"g-recaptcha-response": key,
			"txtEasyCard1": card.ecid.slice(0, 4),
			"txtEasyCard2": card.ecid.slice(4, 8),
			"txtEasyCard3": card.ecid.slice(8, 12),
			"txtEasyCard4": card.ecid.slice(12, 16),
			"txtCreditCard1": card.prefix.slice(0, 4),
			"txtCreditCard2": card.prefix.slice(4, 6),
			"txtCreditCard4": card.surfix.slice(0, 4),
		},
		"type": "POST",
		"timeout": 20000,
		"cache": false
	};

	let coin = 6;
	while (coin-- > 0) {
		let ctx;
		try { ctx = $(await $.ajax(payload)); } catch (error) { continue; }
		logArea.empty()
		$("<p>").text("History of " + card.toString()).appendTo(logArea);
		ctx.find("table#search_tb tr:has(td)").each((idx, elem) => {
			let e = $(elem).find("td");
			let msg = `${e.eq(0).text().trim()} => ${e.eq(1).text().trim()}`;
			console.log(`ec: ${card.toString()} ${msg}`);
			$("<p>").text(msg).appendTo(logArea);
		});
		return;
	}
}

const panel = $("div.step1");

// setup recaptcha
grecaptcha.render($("<div>").attr({
	"data-sitekey": $(".g-recaptcha").remove().attr("data-sitekey"),
	"data-theme": "dark",
	"data-callback": "dispatcher"
}).appendTo(panel).get(0));

// remove unnecessary elements
$("div.nav, div.step2, #form1").remove();

// adjust view
$(panel).attr("align", "center").css({
	"margin": "auto",
	"width": "300px",
	"min-width": "300px"
});

// add log view
const logArea = $("<div>").appendTo(panel);

// add card selector
const optCard = $("<select>").prependTo(panel);

// add clear button
$("<button>")
	.text("Clear")
	.on("click", function () {
		logArea.empty();
	})
	.prependTo(panel);

// add reset button
$("<button>")
	.text("Reset")
	.attr("id", "btn_reset")
	.on("click", resetCards)
	.prependTo(panel);

// add operation switch
$("<input>")
	.attr("type", "checkbox")
	.prop("checked", new Date().getDate() != 1)
	.on("change", function () {
		if ($(this).prop("checked")) {
			operation = doQry;
			console.log("ec: use querying profile");
		} else {
			operation = doReg;
			console.log("ec: use register profile");
		}
	})
	.trigger("change")
	.prependTo($("<label>").text("Query").prependTo(panel));

//  listen on broadcast from data initializer
$(window).on("easycard_ready", resetCards);