// ==UserScript==
// @name         Crowdin Translate Script
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Script to help translating
// @author       Ricardo Henrique
// @require https://code.jquery.com/jquery-3.3.1.js
// @match        https://crowdin.com/translate/codeorg/*
// ==/UserScript==

// Enter an API key from the Google API Console:
//https://console.developers.google.com/apis/credentials
const apiKey = "XXXXXXXXXXX_YYYYYYYYY";

// Set endpoints
const endpoints = {
  translate: "",
  detect: "detect",
  languages: "languages"
};

$(function() {
  setTimeout(function(){ mountFeatureIcon(); makeUsabilityChanges();}, 2000);
  var translationObj = {};

  // Popuplate source and target language dropdowns
  //getLanguages();
  $(document)
    // Bind translate function to translate button (#translation_text_container .editor-pane-title)
    .on("click", "#translateAcLink", function() {
      translationObj = {
        sourceLang: "en",
        targetLang: "pt",
        textToTranslate: $("#source_phrase_container .singular").text()
      };

      if (translationObj.targetLang !== null) {
        translate(translationObj);
      } else {
        alert("Please select a target language");
      }
    })
    // Bind detect function to detect button
    .on("click", "button.detect", function() {
      translationObj = {
        textToTranslate: $("textarea").val()
      };

      detect(translationObj);
    });
});

var mountFeatureIcon = function(){
    var htmlLink = '<a class="featureIcons" id="translateAcLink" href="#"><img src="https://static.getjar.com/icon-50x50/c3/923189_thm.png" alt="Smiley face" height="25" width="25"></a>&nbsp;&nbsp;';
    var imgLoadingAjax = '<img class="featureIcons" style="display: none;" id="linkLoadingAjax" src="https://loading.io/spinners/spin/lg.ajax-spinner-gif.gif" alt="Smiley face" height="30" width="30">&nbsp;&nbsp;';
    $("#suggest_translation").before(htmlLink).before(imgLoadingAjax);
};

// Abstract API request function
function makeApiRequest(endpoint, data, type, authNeeded) {
  var url = "https://www.googleapis.com/language/translate/v2/" + endpoint;
  url += "?key=" + apiKey;
  url += "&format=text";

  // If not listing languages, send text to translate
  if (endpoint !== endpoints.languages) {
    url += "&q=" + encodeURI(data.textToTranslate);
  }

  // If translating, send target and source languages
  if (endpoint === endpoints.translate) {
    url += "&target=" + data.targetLang;
    url += "&source=" + data.sourceLang;
  }

    $.ajax({
    url: url,
    //type: type || "GET",
    type: "POST",
    data: data ? JSON.stringify(data) : "",
    dataType: "json",
    beforeSend: function() {
       $('.featureIcons').toggle();
    },
    success: function (resp) {
        $("#translation").val(resp.data.translations[0].translatedText).focus();
        $("#suggest_translation").prop(`disabled`, false);
    },
    complete: function() {
      $('.featureIcons').toggle();
    },
    error: function (error) {
       alert("Error During Google API Call");
    },
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    }
  });
}

// Translate
function translate(data) {
  makeApiRequest(endpoints.translate, data, "GET", false);
}

var makeUsabilityChanges = function(){
    applyShortcut();

    var $toolBarElement = $('#prev_translation').parent();
    $toolBarElement.removeClass('pull-left').addClass('pull-right');
};

var applyShortcut = function(){
    $(document).keydown(function(evt){
        if (evt.keyCode==18){
            //evt.preventDefault();
            eventFire(document.getElementById('translateAcLink'), 'click')
        }
    });
};

// Detect language
function detect(data) {
  makeApiRequest(endpoints.detect, data, "GET", false).success(function(resp) {
    var source = resp.data.detections[0][0].language;
    var conf = resp.data.detections[0][0].confidence.toFixed(2) * 100;

    $(".source-lang option")
      .filter(function() {
        return $(this).val() === source; //To select Blue
      })
      .prop("selected", true);
    $.when(getLanguageNames()).then(function(data) {
      $("p.target").text(data[source] + " with " + conf + "% confidence");
    });
    $("h2.translation-heading").hide();
    $("h2.detection-heading, p").show();
  });
}

// Get languages
function getLanguages() {
  makeApiRequest(endpoints.languages, null, "GET", false).success(function(
    resp
  ) {
    $.when(getLanguageNames()).then(function(data) {
      $.each(resp.data.languages, function(i, obj) {
        $(".source-lang, .target-lang").append(
          '<option value="' +
            obj.language +
            '">' +
            data[obj.language] +
            "</option>"
        );
      });
    });
  });
}

// Convert country code to country name
function getLanguageNames() {
  return $.getJSON("https://api.myjson.com/bins/155kj1");
}

var eventFire = function (el, etype){
  if (el.fireEvent) {
    el.fireEvent('on' + etype);
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
};

var buildHtmlInText = function(tagName, tagConteudo, tagClasses, tagOutros){
    return `<${tagName} class="${returnIfVal(tagClasses)}" ${returnIfVal(tagOutros)}>
               ${returnIfVal(tagConteudo)}
            </${tagName}>`;
};

var returnIfVal = function(prop){
    return prop ? prop : "";
};

var selectText = function (node) {
    node = document.getElementById(node);

    if (document.body.createTextRange) {
        const range = document.body.createTextRange();
        range.moveToElementText(node);
        range.select();
    } else if (window.getSelection) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        console.warn("Could not select text in node: Unsupported browser.");
    }
};

var buildAndAddCssClassInDOM = function(nomeClasse, propriedadesClasse){
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = '.cssClass { color: #F00; }';
    style.innerHTML = `.${nomeClasse} { ${propriedadesClasse} }`;
    document.getElementsByTagName('head')[0].appendChild(style);
};

/* Useful

    //eventFire(document.getElementById('gtx-trans'), 'click');
    document.querySelector('#source_phrase_container .singular').textContent;
    document.querySelector('#translation').value = "aaaa";
    //setTimeout(function(){ console.log(document.querySelector('.gtx-body')); }, 7000);
*/

