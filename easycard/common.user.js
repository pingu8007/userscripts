// ==UserScript==
// @name         [EasyCard] CardData
// @namespace    https://pingu.moe/script/easycard
// @version      1.1.0
// @description  Shared components
// @author       PinGu
// @homepage     https://pingu.moe/
// @icon         https://www.easycard.com.tw/styles/images/common/easycard.png
// @match        https://ezweb.easycard.com.tw/*
// @grant        none
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
		Object.freeze(this);
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
			$(window).trigger("easycard.ready", [wallet]);
			return wallet;
		} else {
			return [];
		}
	}
}

window.Card = Card;
window.cards = [];