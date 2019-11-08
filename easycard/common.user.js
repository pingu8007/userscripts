// ==UserScript==
// @name         [EasyCard] CardData
// @namespace    https://pingu.moe/script/easycard
// @version      1.0.1
// @description  Inject shared card data into window
// @author       PinGu
// @homepage     https://pingu.moe/
// @icon         https://www.easycard.com.tw/styles/images/common/easycard.png
// @grant        none
// @inject-into  page
// ==/UserScript==
'use strict';

class Card {
	name; ec; cc; vendor; birth;

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

	get id() { return this.ec.join(""); }

	toString() {
		return `${this.name}(${this.vendor}${this.ec[this.ec.length - 1]})`;
	}
}

class Visa extends Card {
	constructor(name, ec, cc, birth) { super(name, ec, cc, "V", birth); }
}

class MasterCard extends Card {
	constructor(name, ec, cc, birth) { super(name, ec, cc, "M", birth); }
}

class JCB extends Card {
	constructor(name, ec, cc, birth) { super(name, ec, cc, "J", birth); }
}

const wallet = [];

Object.assign(window, {
	"cards": wallet,
});