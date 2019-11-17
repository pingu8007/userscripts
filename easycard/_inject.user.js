// ==UserScript==
// @name         [EasyCard] Injector (execute last)
// @namespace    https://pingu.moe/script/easycard
// @version      0.0.1
// @description  Inject data into window
// @author       PinGu
// @homepage     https://pingu.moe/
// @icon         https://www.easycard.com.tw/styles/images/common/easycard.png
// @match        https://ezweb.easycard.com.tw/search/CardSearch.php
// @match        https://ezweb.easycard.com.tw/Event01/JCBLoginRecordServlet
// @grant        GM_getValue
// @inject-into  page
// ==/UserScript==

const raw = GM_getValue("user_cards", [[
	"(例)台新黑狗", // display name
	["1203", "0000", "0123", "4567"], // easy card number
	["4147", "63--", "----", "8888"], // credit card number
	"V", // vendor: (V)isa / (M)asterCard / (J)CB
	"1031" // birth: MMDD
]]);
window.eval(`Card.install(${JSON.stringify(raw)})`);