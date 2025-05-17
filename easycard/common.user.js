// ==UserScript==
// @name         [EasyCard] CardData
// @namespace    https://pingu.moe/script/easycard
// @version      1.3
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
	 * @param {any} raw
	 */
	constructor(raw) {

		if (typeof (raw["_vendor"]) !== "string")
			throw new Error("incorrect card vendor");
		else switch (raw["_vendor"].trim()) {
			case "":
			case "Visa":
			case "MasterCard":
			case "JCB":
				this.vendor = raw["_vendor"].trim();
				break;
			default:
				throw new Error("invalid card vendor");
		}

		if (typeof (raw["_birth"]) == "undefined")
			this.birth = ""; // optional
		else if (typeof (raw["_birth"]) !== "string" || raw["_birth"].length !== 4)
			throw new Error("incorrect card holder birth");
		else this.birth = raw["_birth"];

		if (typeof (raw["_ecid"]) !== "string" || raw["_ecid"].length !== 16)
			throw new Error("incorrect easycard id");
		else this.ecid = raw["_ecid"];

		if (typeof (raw["_prefix"]) !== "string" || raw["_prefix"].length !== 6)
			throw new Error("incorrect creditcard prefix");
		else this.prefix = raw["_prefix"];

		if (typeof (raw["_surfix"]) !== "string" || raw["_surfix"].length !== 4)
			throw new Error("incorrect creditcard surfix");
		else this.surfix = raw["_surfix"];

		if (typeof (raw["_name"]) == "undefined")
			this.name = `${this.vendor} ${this.surfix.padStart(16, this.prefix.padEnd(16, "x"))}`;
		else if (typeof (raw["_name"]) !== "string" || raw["_name"].length == 0)
			throw new Error("card name incorrect");
		else this.name = raw["_name"];
	}

	/**
	 * @returns {string}
	 */
	get id() { return this.ecid; }

	/**
	 * @returns {string}
	 */
	toCardShort() {
		return `${this.vendor}${this.surfix}`;
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return `${this.name} (${this.surfix})`;
	}

	/**
	 * 
	 * @param {*[]} raw
	 * @returns {Card[]} parsed Card array
	 */
	static install(raw) {
		if (Array.isArray(raw)) {
			let wallet = raw.map(c => new Card(c));
			window.cards = wallet;
			window.dispatchEvent(new CustomEvent("easycard_ready", { detail: wallet }));
			return wallet;
		} else {
			return [];
		}
	}
}

const examples = [
	{
		"_name": "永豐DAWHO", // Optional
		"_vendor": "Visa", // Visa MasterCard JCB
		"_prefix": "469656",
		"_surfix": "0000",
		"_ecid": "1234567812345678",
		"_birth": "0401" // MMDD
	}
];

const wallet = GM_getValue("user_cards", examples);

window.eval(`${Card.toString()};window.Card=Card;window.cards=[]`);
window.eval(`Card.install(${JSON.stringify(wallet)})`);