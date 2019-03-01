// coding: utf-8 (sans BOM)
// ==UserScript==
// @author      Ecilam
// @name        Blood Wars Item Test
// @version     2019.03.01
// @namespace   BWIT
// @description Ce script calcule la facilité liée au niveau sur la page Item Test de BloodWars.
// @copyright   2011-2018, Ecilam
// @license     GPL version 3 ou suivantes; http://www.gnu.org/copyleft/gpl.html
// @homepageURL https://github.com/Ecilam/BloodWarsItemTest
// @supportURL  https://github.com/Ecilam/BloodWarsItemTest/issues
// @include     /^https:\/\/r[0-9]*\.fr\.bloodwars\.net\/test_items.php.*$/
// @grant       none
// ==/UserScript==
(function()
{
  "use strict";
  var debugTime = Date.now();
  var debug = false;
  
  /**
   * @method exist
   * Test l'existence d'une valeur
   * @param {*} v la valeur à tester
   * @return {Boolean} faux si 'undefined'
   */
  function exist(v)
  {
    return (v !== undefined && typeof v !== 'undefined');
  }
  /**
   * @method isNull
   * Test si une valeur est Null
   * @param {*} v la valeur à tester
   * @return {Boolean} vrai si Null
   */
  function isNull(v)
  {
    return (v === null && typeof v === 'object');
  }
  /******************************************************
   * OBJET Jsons - JSON
   * - stringification des données
   ******************************************************/
  var Jsons = (function ()
  {
    function reviver(key, v)
    {
      if (typeof v === 'string')
      {
        var a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(v);
        if (!isNull(a)) return new Date(Date.UTC(Number(a[1]), Number(a[2]) - 1, Number(a[3]), Number(a[4]), Number(a[5]), Number(a[6])));
      }
      return v;
    }
    return {
      init: function ()
      {
        if (!JSON) throw new Error("Erreur : le service JSON n\'est pas disponible.");
        else return this;
      },
      /**
       * @method decode
       * Désérialise une chaîne JSON.
       * @param {JSON} v - chaîne JSON à décoder.
       * @return {?*} r la valeur décodée sinon null.
       */
      decode: function (v)
      {
        var r = null;
        try
        {
          r = JSON.parse(v, reviver);
        }
        catch (e)
        {
          console.error('Jsons.decode error :', v, e);
        }
        return r;
      },
      /**
       * @method encode
       * Sérialise un objet au format JSON.
       * @param {*} v - la valeur à encoder.
       * @return {JSON} une chaîne au format JSON.
       */
      encode: function (v)
      {
        return JSON.stringify(v);
      }
    };
  })().init();
  /******************************************************
   * OBJET LS - Local Storage - basé sur localStorage
   * Note : localStorage est lié au domaine
   ******************************************************/
  var LS = (function ()
  {
    return {
      init: function ()
      {
        if (!window.localStorage) throw new Error("Erreur : le service localStorage n\'est pas disponible.");
        else return this;
      },
      /**
       * @method get
       * Retourne la valeur de key ou sinon la valeur par défaut.
       * @param {String} key - la clé recherchée.
       * @param {*} defVal - valeur par défaut.
       * @return {*} val|defVal
       */
      get: function (key, defVal)
      {
        var val = window.localStorage.getItem(key); // return null if no key
        return (!isNull(val) ? Jsons.decode(val) : defVal);
      },
      /**
       * @method set
       * Ajoute/remplace la valeur de la clé concernée.
       * @param {String} key - la clé.
       * @param {*} val
       * @return {*} val
       */
      set: function (key, val)
      {
        window.localStorage.setItem(key, Jsons.encode(val));
        return val;
      }
    };
  })().init();
  /******************************************************
   * OBJET DOM - Fonctions DOM
   * - fonctions d'accès aux noeuds basées sur Xpath
   * - fonctions de création de noeuds et event
   ******************************************************/
  var DOM = (function ()
  {
    return {
      /**
       * @method getNodes
       * Cherche un ensemble de noeuds correspondant à la recherche
       * @param {xpathExpression} path - chemin au format Xpath
       * @param {contextNode} [root=document] - noeud servant de base à la recherche
       * @return {?XPathResult} null si aucun noeud trouvé ou root incorrect
       */
      getNodes: function (path, root)
      {
        return (exist(root) && isNull(root)) ? null : document.evaluate(path, (exist(root) ? root :
          document), null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      },
      /**
       * @method getFirstNode
       * Retourne le 1er noeud correspondant à la recherche
       * @param {xpathExpression} path - chemin au format Xpath
       * @param {contextNode} [root=document] - noeud servant de base à la recherche
       * @return {?Element=null} noeud ou null si aucun résultat
       */
      getFirstNode: function (path, root)
      {
        var r = this.getNodes(path, root);
        return (!isNull(r) && r.snapshotLength >= 1 ? r.snapshotItem(0) : null);
      },
      /**
       * @method getFirstNodeTextContent
       * Retourne et modifie le textContent du 1er noeud correspondant à la recherche
       * @param {xpathExpression} path - chemin au format Xpath
       * @param {String} defVal - valeur par défaut
       * @param {contextNode} [root=document] - noeud servant de base à la recherche
       * @return {textContent=defVal}
       */
      getFirstNodeTextContent: function (path, defVal, root)
      {
        var r = this.getFirstNode(path, root);
        return (!isNull(r) && !isNull(r.textContent) ? r.textContent : defVal);
      },
      /**
       * @method getLastNodeInnerHTML
       * Retourne le InnerHTML du dernier noeud correspondant à la recherche
       * @param {xpathExpression} path - chemin au format Xpath
       * @param {String} defVal - valeur par défaut
       * @param {contextNode} [root=document] - noeud servant de base à la recherche
       * @return {textContent=defVal}
       */
      getLastNodeInnerHTML: function (path, defVal, root)
      {
        var r = this.getLastNode(path, root);
        return (!isNull(r) && !isNull(r.innerHTML) ? r.innerHTML : defVal);
      },
      /**
       * @method addEvent
       * Assigne un gestionnaire d'évènement à un noeud
       * @example call
       * DOM.addEvent(result,'click',fn,'2');
       * @example listener 
       * // this = node, e = event
       * function fn(e,par) {alert('Event : ' + this.value + e.type + par);}
       * @param {contextNode} node - noeud utilisé
       * @param {String} type - type d'évènement à enregistrer
       * @param {Function} fn - fonction recevant la notification
       * @param {*} par - paramètres à passer
       */
      addEvent: function (node, type, fn, par)
      {
        var funcName = function (e)
        {
          return fn.call(node, e, par);
        };
        node.addEventListener(type, funcName, false);
        if (!node.BWMListeners) { node.BWMListeners = {}; }
        if (!node.BWMListeners[type]) node.BWMListeners[type] = {};
        node.BWMListeners[type][fn.name] = funcName;
      },
      /**
       * @method newNode
       * Créé un noeud à partir d'une description
       * @example
       * DOM.newNode('input', { 'type': 'checkbox', 'checked': true }, ['texte'], {'click': [funcname, param]}, parentNode);
       * @param {String} type - balise html
       * @param {{...Objet}} attributes - liste des attributs
       * @param {String[]} content - texte
       * @param {{...[funcname, param]}} events - événements attachés à ce noeud
       * @param {Node} parent - noeud parent
       * @return {Node} node
       */
      newNode: function (type, attributes, content, events, parent)
      {
        var node = document.createElement(type);
        for (var key in attributes)
        {
          if (attributes.hasOwnProperty(key))
          {
            if (typeof attributes[key] !== 'boolean') node.setAttribute(key, attributes[key]);
            else if (attributes[key] === true) node.setAttribute(key, key.toString());
          }
        }
        for (key in events)
        {
          if (events.hasOwnProperty(key))
          {
            this.addEvent(node, key, events[key][0], events[key][1]);
          }
        }
        for (var i = 0; i < content.length; i++)
        {
          node.textContent += content[i];
        }
        if (!isNull(parent)) parent.appendChild(node);
        return node;
      },
      /**
       * @method newNodes
       * Créé en ensemble de noeuds à partir d'une liste descriptive
       * @param {[...Array]} list - décrit un ensemble de noeuds (cf newNode)
       * @param {{...Objet}} [base] - précédent ensemble
       * @return {{...Objet}} nodes - liste des noeuds
       */
      newNodes: function (list, base)
      {
        var nodes = exist(base) ? base : {};
        for (var i = 0; i < list.length; i++)
        {
          var node = exist(nodes[list[i][5]]) ? nodes[list[i][5]] : list[i][5];
          nodes[list[i][0]] = this.newNode(list[i][1], list[i][2], list[i][3], list[i][4], node);
        }
        return nodes;
      }
    };
  })();
  /******************************************************
  * FUNCTIONS
  ******************************************************/
  function checkRace(e)
  {
    LS.set('BWIT:ABSO', (e.target.value));
    location.reload();
  }
  function checkTatou(e)
  {
    LS.set('BWIT:TATOU', (e.target.value));
    location.reload();
  }
  function checkEvo(e)
  {
    LS.set('BWIT:EVO', (e.target.value));
    location.reload();
  }
  /******************************************************
  * START
  ******************************************************/
if (debug) console.debug('BWITstart');
  var lvl = DOM.getFirstNode("//input[@id='setLvl']");
  var	last = DOM.getFirstNode("(//input)[last()]");
  if (lvl !== null && last !== null)
  {
    var ilvl = parseInt(lvl.value);
    var abso = LS.get('BWIT:ABSO','0')=='1';
    var	tatou = LS.get('BWIT:TATOU','0');
    var	evo = LS.get('BWIT:EVO','0');
    var	faci = Math.min((((ilvl < 60 ? 0 : ilvl < 71 ? Math.ceil((ilvl - 60)/2) : ilvl -70 + 5)) + (abso ? 5 : 0) + (tatou === '1' ? 7 : tatou === '2' ? 15 : 0) + Number(evo)), (tatou === '2' ? 55 : 50));
    var rootIU = DOM.newNodes([
        ['span', 'span', {'style': 'text-align:middle'}, [], {}, null],
        ['span1', 'span', {}, [' Facilité: '+faci+'%'], {}, 'span'],
        ['div1', 'div', {'style': 'vertical-align:middle'}, [], {},'span'],
        ['b1', 'b', {}, ['Race: '], {}, 'div1'],
        ['input11', 'input', {'type': 'radio', 'name': 'race', 'value': '0', 'checked': !abso}, [], {'change': [checkRace]}, 'div1'],
        ['span11', 'span', {}, ['Autres'], {}, 'div1'],
        ['input12', 'input', {'type': 'radio', 'name': 'race','value': '1','checked': abso}, [], {'change': [checkRace]}, 'div1'],
        ['span12', 'span', {}, ['Absorbeur'], {}, 'div1'],
        ['div2', 'div', {'style':'vertical-align:middle'}, [], {}, 'span'],
        ['b2', 'b', {}, ['Tatouage (niv 5): '], {}, 'div2'],
        ['input21', 'input', {'type':'radio', 'name':'tatou', 'value':'0', 'checked':(tatou=='0')}, [], {'change': [checkTatou]}, 'div2'],
        ['span21', 'span', {}, ['Autres'], {}, 'div2'],
        ['input22', 'input', {'type': 'radio', 'name': 'tatou', 'value': '1', 'checked': (tatou=='1')}, [], {'change': [checkTatou]}, 'div2'],
        ['span22', 'span', {}, ['Moine'], {}, 'div2'],
        ['input23', 'input', {'type': 'radio', 'name': 'tatou', 'value': '2', 'checked': (tatou=='2')}, [], {'change': [checkTatou]}, 'div2'],
        ['span23', 'span', {}, ['Maître des démons'], {}, 'div2'],
        ['div3', 'div', {'style':'vertical-align:middle'}, [], {}, 'span'],
        ['b3', 'b', {}, ['Evo "Légèreté de l’être" : '], {}, 'div3'],
        ['input31', 'input', {'type': 'radio', 'name': 'evo', 'value': '0', 'checked': (evo=='0')}, [], {'change': [checkEvo]}, 'div3'],
        ['span31', 'span', {}, ['0'], {}, 'div3'],
        ['input32', 'input', {'type': 'radio', 'name': 'evo', 'value': '1', 'checked': (evo=='1')}, [], {'change': [checkEvo]}, 'div3'],
        ['span32', 'span', {}, ['1'], {}, 'div3'],
        ['input33', 'input', {'type': 'radio', 'name': 'evo', 'value': '2', 'checked': (evo=='2')}, [], {'change': [checkEvo]}, 'div3'],
        ['span33', 'span', {}, ['2'], {}, 'div3'],
        ['input34', 'input', {'type': 'radio', 'name': 'evo', 'value': '4', 'checked': (evo=='4')}, [], {'change': [checkEvo]},'div3'],
        ['span34', 'span',{}, ['3'], {}, 'div3'],
        ['input35', 'input',{'type': 'radio', 'name': 'evo', 'value': '7', 'checked': (evo=='7')}, [], {'change': [checkEvo]},'div3'],
        ['span35', 'span', {}, ['4'], {}, 'div3'],
        ['input36', 'input',{'type': 'radio', 'name': 'evo', 'value': '10', 'checked': (evo=='10')}, [], {'change': [checkEvo]},'div3'],
        ['span36', 'span', {}, ['5'], {}, 'div3']
        ]);
    last.parentNode.insertBefore(rootIU.span, last.nextSibling);
    var exiNode = DOM.getFirstNode("//b[contains(., 'Exigences:')]/following::node()");
    if (faci > 0 && !isNull(exiNode))
    {
      var stats = ["NIVEAU", "FORCE", "AGILITÉ", "RÉSISTANCE", "APPARENCE", "CHARISME", "RÉPUTATION", "PERCEPTION", "INTELLIGENCE", "SAVOIR"];
      var exiText = exiNode.textContent;
      for (var i = 0; i < stats.length; i++)
      {
        var val = new RegExp(stats[i] + ": ([0-9]+)").exec(exiText);
        if (!isNull(val))
        {
          var result = Math.ceil(val[1]*(1-(faci/100)));
          exiText = exiText.replace(val[0], stats[i] + ": " + result + " (" + val[1] + ")");
        }
      }
      exiNode.textContent = exiText;
    }
  }
if (debug) console.debug('BWITend - time %oms', Date.now() - debugTime);
})();
