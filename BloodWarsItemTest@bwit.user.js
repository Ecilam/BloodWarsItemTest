(function(){
// coding: utf-8
// ==UserScript==
// @author		Ecilam
// @name		Blood Wars Item Test
// @version		2014.08.08
// @namespace	BWIT
// @description	Ce script calcule la facilité liée au niveau sur la page Item Test de BloodWars.
// @copyright   2011-2014, Ecilam
// @license     GPL version 3 ou suivantes; http://www.gnu.org/copyleft/gpl.html
// @homepageURL https://github.com/Ecilam/BloodWarsItemTest
// @supportURL  https://github.com/Ecilam/BloodWarsItemTest/issues
// @include		/^http:\/\/r[0-9]*\.fr\.bloodwars\.net\/test_items.php.*$/
// @grant       none
// ==/UserScript==
"use strict";

function _Type(value){
	var type = Object.prototype.toString.call(value);
	return type.slice(8,type.length-1);
	}

function _Exist(value){
	return _Type(value)!='Undefined';
	}

/****************************************************
* OBJET DOM - Fonctions DOM & QueryString           *
* -  DOM : fonctions d'accès aux noeuds du document *
****************************************************/
var DOM = (function(){
	return {
		_GetNodes: function(path,root){
			var contextNode=(_Exist(root)&&root!=null)?root:document;
			var result=document.evaluate(path, contextNode, null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			return result;
			},
		_GetFirstNode: function(path,root){
			var result = this._GetNodes(path,root);
			return ((result.snapshotLength >= 1)?result.snapshotItem(0):null);
			}
		};
	})();

/**********************************
* OBJET IU - Interface Utilsateur *
**********************************/
var IU = (function(){
	return {
		_CreateElements: function(list){
			var result = {};
			for (var key in list){
				var type = _Exist(list[key][0])?list[key][0]:null,
					attributes = _Exist(list[key][1])?list[key][1]:{},
					content = _Exist(list[key][2])?list[key][2]:[],
					events = _Exist(list[key][3])?list[key][3]:{},
					node = _Exist(result[list[key][4]])?result[list[key][4]]:(_Exist(list[key][4])?list[key][4]:null);
				if (type!=null) result[key] = this._CreateElement(type,attributes,content,events,node);
				}
			return result;
			},
		_CreateElement: function(type,attributes,content,events,node){
			if (_Exist(type)&&type!=null){
				attributes = _Exist(attributes)?attributes:{};
				content = _Exist(content)?content:[];
				events = _Exist(events)?events:{};
				node = _Exist(node)?node:null;
				var result = document.createElement(type);
				for (var key in attributes){
					if (_Type(attributes[key])!='Boolean') result.setAttribute(key,attributes[key]);
					else if (attributes[key]==true) result.setAttribute(key,key.toString());
					}
				for (var key in events){
					this._addEvent(result,key,events[key][0],events[key][1]);
					}
				for (var i=0; i<content.length; i++){
					if (_Type(content[i])==='Object') result.appendChild(content[i]);
					else result.textContent+= content[i];
					}
				if (node!=null) node.appendChild(result);
				return result;
				}
			else return null;
			},
		_addEvent: function(obj,type,fn,par){
			var funcName = function(event){return fn.call(obj,event,par);};
			obj.addEventListener(type,funcName,false);
			if (!obj.BWITListeners) {obj.BWITListeners = {};}
			if (!obj.BWITListeners[type]) obj.BWITListeners[type]={};
			obj.BWITListeners[type][fn.name]=funcName;
			}
		};
	})();

/********
* START *
********/
function checkAbso(e){
	LS.setItem('BWIT:ABSO',(e.target.checked==true?'1':'0'));
	location.reload();
}
console.debug('BWIT start');
if (!window.localStorage) throw new Error("Erreur : le service localStorage n\'est pas disponible.");
var LS = window.localStorage,
	lvl = DOM._GetFirstNode("//input[@id='setLvl']"),
	last = DOM._GetFirstNode("//input[last()]");
if (lvl!=null&&last!=null){
	var ilvl = parseInt(lvl.value),
		abso = LS.getItem('BWIT:ABSO','0')=='1',
		faci = Math.min(((ilvl<71?Math.ceil((ilvl-60)/2):ilvl-70+5)+(abso?5:0)),50),
		node = IU._CreateElements({'span':['span',{'style':'text-align:middle'}],
			'span1':['span',,[' Facilité: '+faci+'% - Absorbeur:'],,'span'],
			'input':['input',{'type':'checkbox','style':'vertical-align:bottom','checked':abso},,{'change':[checkAbso]},'span']});
	last.parentNode.insertBefore(node['span'],last.nextSibling);
	var exi = DOM._GetNodes("//span[@class='error']");
	for (var i=0;i<exi.snapshotLength;i++){
		var val = new RegExp("^(.*: )([0-9]+)$").exec(exi.snapshotItem(i).textContent),
			result = Math.ceil(val[2]*(1-(faci/100)));
		if (val&&val[1]!='Le personnage doit être dans l`acte: '&&val[2]!=result) exi.snapshotItem(i).textContent = val[1]+result+" ("+val[2]+")";
		}
	}
console.debug('BWIT end');
})();
