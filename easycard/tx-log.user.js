// ==UserScript==
// @name         [EasyCard] Transaction querying utils
// @namespace    https://pingu.moe/script/easycard
// @version      1.1.0
// @description  Some shortcut to simplify the query steps
// @author       PinGu
// @homepage     https://pingu.moe/
// @icon         easycard.png
// @match        https://ezweb.easycard.com.tw/search/CardSearch.php
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @grant        none
// @inject-into  page
// ==/UserScript==
'use strict';

const $ = jQuery.noConflict(true);

// available date-range options
const date_opts = [
	{ t: "近一週", v: "-1w" },
	{ t: "近二週", v: "-2w" },
	{ t: "近一月", v: "-1m" },
	{ t: "近三月", v: "-3m" },
	{ t: "近半年", v: "-6m" },
	{ t: "近一年", v: "-1y" },
];

// prevent hiding rows automatically
document.body.onload = null;

// add button to show all rows
$("<button>").attr("type", "button").text("全部顯示")
	.on("click", e => $("div[id^=pg]").show())
	.appendTo("#txRecTop");

// move all rows to heading table which never hidden
$("div[id^=pg] tr.r1").appendTo("#pgh tbody");

// custom card selector
$(window).on("easycard_ready", function (e) {
	let elem = $("<select>").attr("name_picker", "card_id").on("change", e => {
		if (typeof (e.target.selectedIndex) !== "number" || e.target.selectedIndex < 0) {
			if ($("input[name=card_id]").val() == "")
				e.target.selectedIndex = 0;
			else
				e.target.selectedIndex = -1;
		}
		if (e.target.selectedIndex > -1) {
			$("input[name=card_id]").val($(e.target).val());
			$("input[name=birthday").val($(e.target).find("option:selected").data("birth"));
		}
	});
	e.detail.forEach(card => {
		$("<option>").text(card.toString()).val(card.id).data("birth", card.birth).appendTo(elem);
	});
	elem.val($("input[name=card_id]").val()).insertAfter("input[name=card_id]").trigger("change");
});

// custom date-range selector
if (date_opts && Array.isArray(date_opts) && date_opts.length > 0) {
	let date_picker = $("<div>")
		.append(date_opts.map(i => $("<button>").val(i.v).text(i.t)))
		.children().attr("type", "button").on("click", e => {
			$("#START_DATE").datepicker("setDate", e.target.value);
			$("#END_DATE").datepicker("setDate", "0");
		}).end().append("<br />");
	$("#START_DATE").parent().replaceWith(date_picker).contents()
		.filter("#START_DATE").appendTo(date_picker).before("<label>From</label>").end().end()
		.filter("#END_DATE").appendTo(date_picker).before("<label>To</label>").end().end();
}