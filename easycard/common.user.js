// ==UserScript==
// @name         [EasyCard] CardData
// @namespace    https://pingu.moe/script/easycard
// @version      1.1.0
// @description  PUT ON THE END. Read cards and dispatch event.
// @author       PinGu
// @homepage     https://pingu.moe/
// @icon         easycard.png
// @match        https://ezweb.easycard.com.tw/*
// @grant        GM_getValue
// @inject-into  page
// ==/UserScript==
'use strict';

class Card {
	/**
	 * @param {string} name
	 * @param {string[]} ec
	 * @param {string[]} cc
	 * @param {string} vendor
	 * @param {string} birth
	 */
	constructor(name, ec, cc, vendor, birth) {
		if (typeof (name) !== "string" || name.length == 0)
			throw new Error("name incorrect");

		if (typeof (vendor) !== "string")
			throw new Error("vendor incorrect");
		else
			switch (vendor) {
				case "V":
				case "M":
				case "J":
					break;
				default:
					throw new Error("unknown vendor");
			}

		if (typeof (birth) !== "string" || birth.length !== 4)
			throw new Error("birth incorrect");

		if (!Array.isArray(ec) || ec.length !== 4)
			throw new Error("easy card format incorrect");

		if (!Array.isArray(cc) || cc.length !== 4)
			throw new Error("credit card format incorrect");

		this.name = name;
		this.birth = birth;
		this.vendor = vendor;
		this.ec = Object.freeze(ec);
		this.cc = Object.freeze(cc);
	}

	/**
	 * @returns {string}
	 */
	get id() { return this.ec.join(""); }

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.name}(${this.vendor}${this.ec[this.ec.length - 1]})`;
	}

	/**
	 * 
	 * @param {*[]} raw
	 * @returns {Card[]} parsed Card array
	 */
	static install(raw) {
		if (Array.isArray(raw)) {
			let wallet = raw.map(c => new Card(c[0], c[1], c[2], c[3], c[4]));
			window.cards = wallet;
			window.dispatchEvent(new CustomEvent("easycard_ready", { detail: wallet }));
			return wallet;
		} else {
			return [];
		}
	}
}

const examples = [
	[
		"(例)台新黑狗", // display name
		["1203", "0000", "0123", "4567"], // easy card number
		["4147", "63--", "----", "8888"], // credit card number
		"V", // vendor: (V)isa / (M)asterCard / (J)CB
		"1031" // birth: MMDD
	]
];

const wallet = GM_getValue("user_cards", examples);

window.eval(`${Card.toString()};window.Card=Card;window.cards=[]`);
window.eval(`Card.install(${JSON.stringify(wallet)})`);