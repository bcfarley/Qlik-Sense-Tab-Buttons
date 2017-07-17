define("extensions/tabbuttons/util", ["qlik"], function (e) {
	"use strict";
	
	function createElement(tag, cls, html) { 
		var el = document.createElement(tag);
		if (cls) {
			el.className = cls;
		}
		if (html !== undefined) {
			el.innerHTML = html;
		}
		return el;
	}

	function setChild(el, ch) { 
		if (el.childNodes.length === 0) {
			el.appendChild(ch);
		} else {
			el.replaceChild(ch, el.childNodes[0]);
		}
	}

	function addStyleSheet(href) { 
		var link = createElement('link');
		link.rel = "stylesheet";
		link.type = "text/css";
		link.href = require.toUrl(href);
		document.head.appendChild(link);
	}

	return { 
		createElement: createElement,
		setChild: setChild,
		addStyleSheet: addStyleSheet
	};
}), define("extensions/tabbuttons/properties", ["./util", 
		'./sense-extension-utils/pp-helper'], 
	function (e, 
		ppHelper) {
	"use strict";

	return {
		initialProperties: {
			navigationheading: "",
			sheets: []
		},
		definition: {
			type: "items",
			component: "accordion",
			items: {
				settings: {
					uses: "settings",
					items: {
						general: {
 						  items: {
							showTitles: {
							  defaultValue: false
							}
						  }
						},
						navigation: {
							type: "items",
							label: "Sheets",
							items: {
								heading: {
									ref: "navigationheading",
									label: "Title",
									type: "string",
									defaultValue: "",
									expression: "optional"
								},																
								toptabcolour: {
									ref: "toptabcolour",
									label: "Top Tab Colour Not-selected",
									type: "string",
									defaultValue: "#0093C3",
									expression: "optional"
								},	
								toptabcolourselected: {
									ref: "toptabcolourselected",
									label: "Top Tab Colour Selected",
									type: "string",
									defaultValue: "#075676",
									expression: "optional"
								},	
								sheets: {
									type: "array",
									ref: "sheets",
									label: "Item List",
									itemTitleRef: "label",
									allowAdd: !0,
									allowRemove: !0,
									addTranslation: "Add Sheet",
									items: {
										label: {
											type: "string",
											ref: "label",
											label: "Label",
											expression: "optional"
										},
										group: {
											type: "string",
											ref: "group",
											label: "Group",
											defaultValue: "Group",
											expression: "optional"
										},
										value: {
											type: "string",
											ref: "value",
											component: "dropdown",
											options: ppHelper.getSheetList(),
											label: "Sheet ID"
										},
										status: {
											type: "string",
											ref: "status",
											defaultValue: "0",
											label: "Status (0=Active, 1=Disabled, 2=Hidden)",
											expression: "optional"
										}											
									}
								
								},	
							}
						}
					}
				}
			}
		}
	}
}), define(["qlik", "./util", "./properties", "client.utils/state", './sense-extension-utils/pp-helper'], function (qlik, util, prop, clientState, ppHelper) { 
	"use strict";
	function setStyle(qlik, util, prop, state, tabtype) {
		if ("S" == tabtype) {
			if (state) { 
				return "qv-object-button-subtab qv-object-button-subtab-disabled";
			}
			return prop ? "qv-object-button-subtab qv-object-button-subtab-selected" : "qv-object-button-subtab qv-object-button-subtab-notselected"; 
		} else {
			if (state) { 
				return "qv-object-button-maintab qv-object-button-maintab-disabled";
			}					
			return prop ? "qv-object-button-maintab qv-object-button-maintab-selected" : "qv-object-button-maintab qv-object-button-maintab-notselected"; 
		}
	}
	
	return util.addStyleSheet("extensions/tabbuttons/tabbuttons.css"), {
		initialProperties: prop.initialProperties,
		definition: prop.definition,
		paint: function ($element, layout) { 
			var wrapper = util.createElement("div", "qlik"),
			wdth = "98%";
			wrapper.className = "qlik qv-object-buttondiv";
			
			// Header
			if(layout.navigationheading.length != null) {
				var varheader = util.createElement("h1", void 0, layout.navigationheading);
				varheader.className = "qv-object-title qvt-visualization-title qv-object-navigation-header";
				wrapper.appendChild(varheader); }

			var activeSheetID = clientState.getModel().id;
				
			var sheetList = {};
			var thisGroup = "";
			var ShValue, ShLabel, ShActive;
			layout.sheets.forEach(function (item) {
				if(!(item.group in sheetList) && (item.status == 0 || item.value === activeSheetID)) {
					sheetList[item.group] = {};
					sheetList[item.group]["label"] = item.group;
					sheetList[item.group]["value"] = item.value;
					sheetList[item.group]["status"] = item.status;
					sheetList[item.group]["active"] = 0;
				};
				if(item.value === activeSheetID && (item.status != 2 || item.value === activeSheetID)){
					sheetList[item.group]["active"] = 1;
					thisGroup = item.group;
				};
			});
			
			// Top Tabs
			var toptabs = util.createElement("div", "qv-object-buttongroupdiv", " ");
			Object.keys(sheetList).forEach(function (sheet) {
				var bttn = util.createElement("button", setStyle("qlik", "button", sheetList[sheet].active === 1, false, "M"), sheetList[sheet].label);
					bttn.onclick = function () {
						qlik.navigation.gotoSheet(sheetList[sheet].value)
					}
				bttn.style.width = wdth;
				bttn.style.backgroundColor = sheetList[sheet].active === 1 ? layout.toptabcolourselected : layout.toptabcolour;
				toptabs.appendChild(bttn)
			});
			wrapper.appendChild(toptabs);		

			// Sub Tabs
			var subtabs = util.createElement("div", "qv-object-buttongroupdiv", " ");

			// Dummy subtab Button Fill to Right
			var bttn = util.createElement("button", setStyle("qlik", "button", false, "S"), " ");
			bttn.className = "qv-object-buttonrightdiv",
				subtabs.appendChild(bttn);
				
			layout.sheets.forEach(function (prop) {
				if(prop.group == thisGroup && (prop.status != 2 || prop.value === activeSheetID)) {
					var bttn = util.createElement("button", setStyle("qlik", "button", prop.value === activeSheetID, (prop.status == 1 || (prop.status == 2 && prop.value === activeSheetID)), "S"), prop.label);
					if(prop.status == 0) {
						bttn.onclick = function () {
							qlik.navigation.gotoSheet(prop.value)
						}
					}
					bttn.style.width = wdth,
					subtabs.appendChild(bttn)
				};
			});

			// Dummy subtab Button Fill to Right
			var bttn = util.createElement("button", setStyle("qlik", "button", false, "S"), " ");
			bttn.className = "qv-object-buttonrightdiv",
				subtabs.appendChild(bttn);
				
			wrapper.appendChild(subtabs);		
			util.setChild($element[0], wrapper)
		}
	}
});
