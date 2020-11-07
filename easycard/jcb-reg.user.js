// ==UserScript==
// @name         [EasyCard] JCB campaign helper
// @namespace    https://pingu.moe/
// @version      1.0.4
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

let cardmap = {};

/**
 * @type {Function}
 */
let operation;

/**
 * Clear log and reload card pool
 * @returns {Card[]} Refreshed card pool
 */
const reset_cards = window.reset_cards = () => {
	console.log('ec: initializing...');
	opt_card.empty();
	cardmap = {};

	let cardpool = window.cards.filter(i => "J" === i.vendor).map(c => {
		delete c.done;
		cardmap[c.toCardShort()] = c;
		opt_card.append($("<option>").attr("value", c.toCardShort()).text(c.toString()));
		return c;
	});
	opt_card.prop("selectedIndex", 0);

	log_area.empty();
	console.log(`ec: card pool reloaded, ${cardpool.length} cards in pool`);
	return cardpool;
}

/**
 * Get selected card from cardpool, and set \<select\> to next possible Card.
 * @param {boolean} all Also include Card that already finished
 * @returns {Card} Selected card, or undefined if nothing selected.
 */
const getNext = all => {
	const last = opt_card.val();
	const opts = opt_card.children("option");
	let cur = opt_card.prop("selectedIndex");
	cur = cur < 0 ? 0 : cur;

	let times = 0;
	while (times < opts.length) {
		cur = cur < opts.length - 1 ? cur + 1 : 0;
		if (!cardmap[opts.eq(cur).val()].done || all) {
			opt_card.prop("selectedIndex", cur);
			break;
		}
		times++;
	}
	return last == null ? undefined : cardmap[last];
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
		log_area.prepend($("<p>").text(msg));
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
		log_area.empty()
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

const panel = $("div.step1");

// setup recaptcha
$(".g-recaptcha").attr({
	"data-theme": "dark",
	"data-callback": "dispatcher"
}).appendTo(panel);

// remove unnecessary elements
$("div.nav, div.step2, #form1").remove();

// adjust view
$(panel).attr("align", "center").css({
	"margin": "auto",
	"width": "300px",
	"min-width": "300px"
});

// add log view
const log_area = $("<div>").appendTo(panel);

// add card selector
const opt_card = $("<select>").prependTo(panel);

// add clear button
$("<button>")
	.text("Clear")
	.on("click", function () {
		log_area.empty();
	})
	.prependTo(panel);

// add reset button
$("<button>")
	.text("Reset")
	.attr("id", "btn_reset")
	.on("click", reset_cards)
	.prependTo(panel);

// add operation switch
$("<input>")
	.attr("type", "checkbox")
	.prop("checked", new Date().getDate() != 1)
	.on("change", function () {
		if ($(this).prop("checked")) {
			operation = do_qry;
			console.log("ec: use querying profile");
		} else {
			operation = do_reg;
			console.log("ec: use registering profile");
		}
	})
	.trigger("change")
	.prependTo($("<label>").text("Query").prependTo(panel));

//  listen on broadcast from data initializer
$(window).on("easycard_ready", function () {
	$("#btn_reset").click();
});