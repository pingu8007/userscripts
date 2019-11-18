// ==UserScript==
// @name         [EasyCard] Transaction querying utils
// @namespace    https://pingu.moe/script/easycard
// @version      1.1.0
// @description  Some shortcut to simplify the query steps
// @author       PinGu
// @homepage     https://pingu.moe/
// @icon         easycard.png
// @match        https://ezweb.easycard.com.tw/search/CardSearch.php
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.slim.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.8.16/dayjs.min.js
// @grant        none
// @inject-into  page
// ==/UserScript==
'use strict';

const $ = jQuery.noConflict(true);

// available date-range options
const date_opts = [
	{ t: "近一週", v: ["-7", "d"] },
	{ t: "近二週", v: ["-14", "d"] },
	{ t: "近一月", v: ["-1", "M"] },
	{ t: "近三月", v: ["-3", "M"] },
	{ t: "近半年", v: ["-6", "M"] },
	{ t: "近一年", v: ["-1", "y"] },
];

// prevent hiding rows automatically
document.body.onload = null;
document.body.onkeydown = null;

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
	let date_picker = $("<div>").append(date_opts.map(i => $("<button>").text(i.t).on("click", e => {
		const start = dayjs().add(-1, "d");
		$("#START_DATE").val(start.add(i.v[0], i.v[1]).format("YYYY-MM-DD"));
		$("#END_DATE").val(start.format("YYYY-MM-DD"));
	}))).children().attr("type", "button").end().append("<br />");
	$("#START_DATE").parent().replaceWith(date_picker).contents()
		.filter("#START_DATE").appendTo(date_picker).before("<label>From</label>").end().end()
		.filter("#END_DATE").appendTo(date_picker).before("<label>To</label>").end().end();
}