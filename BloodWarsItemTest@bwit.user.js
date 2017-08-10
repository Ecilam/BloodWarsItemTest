(function(){
// coding: utf-8
// ==UserScript==
// @author		Ecilam
// @name		Blood Wars Item Test
// @version		2017.08.10
// @namespace	BWIT
// @description	Ce script calcule la facilité liée au niveau sur la page Item Test de BloodWars.
// @copyright   2011-2014, Ecilam
// @license     GPL version 3 ou suivantes; http://www.gnu.org/copyleft/gpl.html
// @homepageURL https://github.com/Ecilam/BloodWarsItemTest
// @supportURL  https://github.com/Ecilam/BloodWarsItemTest/issues
// @include		/^https:\/\/r[0-9]*\.fr\.bloodwars\.net\/test_items.php.*$/
// @grant       none
// ==/UserScript==
"use strict";

function _Type(v){
	var type = Object.prototype.toString.call(v);
	return type.slice(8,type.length-1);
	}
function _Exist(v){
	return _Type(v)!='Undefined';
	}

/******************************************************
* DEBUG
******************************************************/
var debug = false,
	debug_time = Date.now();

/******************************************************
* OBJET LS - Datas Storage
******************************************************/
var LS = (function(){
	var LS = window.localStorage;
	return {
		_GetVar: function(key,defaut){
			var v = LS.getItem(key);
			return ((v!=null)?v:defaut);
			},
		_SetVar: function(key,v){
			LS.setItem(key,v);
			return v;
			}
		};
	})();

/****************************************************
* OBJET DOM - Fonctions DOM & QueryString           *
* -  DOM : fonctions d'accès aux noeuds du document *
****************************************************/
var DOM = (function(){
	return {
		_GetNodes: function(path,root){
			return (_Exist(root)&&root==null)?null:document.evaluate(path,(_Exist(root)?root:document), null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			},
		_GetFirstNode: function(path,root){
			var r = this._GetNodes(path,root);
			return (r!=null&&r.snapshotLength>=1?r.snapshotItem(0):null);
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

/******************************************************
* FUNCTIONS
******************************************************/
function checkRace(e){
	LS._SetVar('BWIT:ABSO',(e.target.value));
	location.reload();
}
function checkTatou(e){
	LS._SetVar('BWIT:TATOU',(e.target.value));
	location.reload();
}
function checkEvo(e){
	LS._SetVar('BWIT:EVO',(e.target.value));
	location.reload();
}
/******************************************************
* START
******************************************************/
if (debug) console.debug('BWITstart');
if (!window.localStorage) throw new Error("Erreur : le service localStorage n\'est pas disponible.");
var lvl = DOM._GetFirstNode("//input[@id='setLvl']");
var	last = DOM._GetFirstNode("(//input)[last()]");
if (lvl!=null && last!=null) {
	var ilvl = parseInt(lvl.value);
  var abso = LS._GetVar('BWIT:ABSO','0')=='1';
	var	tatou = LS._GetVar('BWIT:TATOU','0');
	var	evo = LS._GetVar('BWIT:EVO','0');
	var	faci = Math.min(((ilvl<71?Math.ceil((ilvl-60)/2):ilvl-70+5)+(abso?5:0)+(tatou=='1'?7:tatou=='2'?10:0)+Number(evo)),50);
	var	node = IU._CreateElements({'span':['span',{'style':'text-align:middle'}],
			'span1':['span',,[' Facilité: '+faci+'%'],,'span'],
			'div1':['div',{'style':'vertical-align:middle'},,,'span'],
			'b1':['b',,['Race: '],,'div1'],
			'input11':['input',{'type':'radio','name':'race','value':'0','checked':!abso},,{'change':[checkRace]},'div1'],
			'span11':['span',,['Autres'],,'div1'],
			'input12':['input',{'type':'radio','name':'race','value':'1','checked':abso},,{'change':[checkRace]},'div1'],
			'span12':['span',,['Absorbeur'],,'div1'],
			'div2':['div',{'style':'vertical-align:middle'},,,'span'],
			'b2':['b',,['Tatouage (niv 5): '],,'div2'],
			'input21':['input',{'type':'radio','name':'tatou','value':'0','checked':(tatou=='0')},,{'change':[checkTatou]},'div2'],
			'span21':['span',,['Autres'],,'div2'],
			'input22':['input',{'type':'radio','name':'tatou','value':'1','checked':(tatou=='1')},,{'change':[checkTatou]},'div2'],
			'span22':['span',,['Moine'],,'div2'],
			'input23':['input',{'type':'radio','name':'tatou','value':'2','checked':(tatou=='2')},,{'change':[checkTatou]},'div2'],
			'span23':['span',,['Maître des démons'],,'div2'],
			'div3':['div',{'style':'vertical-align:middle'},,,'span'],
			'b3':['b',,['Evo "Légèreté de l`être" : '],,'div3'],
			'input31':['input',{'type':'radio','name':'evo','value':'0','checked':(evo=='0')},,{'change':[checkEvo]},'div3'],
			'span31':['span',,['0'],,'div3'],
			'input32':['input',{'type':'radio','name':'evo','value':'1','checked':(evo=='1')},,{'change':[checkEvo]},'div3'],
			'span32':['span',,['1'],,'div3'],
			'input33':['input',{'type':'radio','name':'evo','value':'2','checked':(evo=='2')},,{'change':[checkEvo]},'div3'],
			'span33':['span',,['2'],,'div3'],
			'input34':['input',{'type':'radio','name':'evo','value':'4','checked':(evo=='4')},,{'change':[checkEvo]},'div3'],
			'span34':['span',,['3'],,'div3'],
			'input35':['input',{'type':'radio','name':'evo','value':'7','checked':(evo=='7')},,{'change':[checkEvo]},'div3'],
			'span35':['span',,['4'],,'div3']});
	last.parentNode.insertBefore(node['span'],last.nextSibling);
	var exi = DOM._GetNodes("//span[@class='disabled']");
	for (var i=0;i<exi.snapshotLength;i++) {
		var val = new RegExp("^(.*: )([0-9]+)$").exec(exi.snapshotItem(i).textContent);
		var result = Math.ceil(val[2]*(1-(faci/100)));
		if (val && val[1] != 'Le personnage doit être dans l`acte: ' && val[2] != result) {
      exi.snapshotItem(i).textContent = val[1]+result+" ("+val[2]+")";
    }
	}
}
if (debug) console.debug('BWITend - time %oms',Date.now()-debug_time);
})();
