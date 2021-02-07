chrome.runtime.onInstalled.addListener(()=>{
    chrome.browserAction.setIcon({ path: 'img/icon-inactive.png' });
    chrome.storage.local.set({active:false},()=>{});
});

var sendResponseKanji = function(page, svg) {
    var tempDom = $('<output>').append($.parseHTML(page, keepScripts = true));
    var y = $('.kanji.details', tempDom);
    var res = '';
    if (y.length) {
        $(">.row", y[0])[2].remove();
        var row1 = $(">.row", y[0])[0];
        var row2 = $(">.row", y[0])[1];
        $("ul", row1).remove();
        $(".large-2", row2).remove();
        res = y[0].innerHTML;
    } else {
        res = "No Results";
    }
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var activeTab = tabs[0];
        if (svg)
            svg = (new XMLSerializer()).serializeToString(svg);
        chrome.tabs.sendMessage(activeTab.id, { "message": "show-kanji", "results": res, "svg": svg });
    });
}

var HandleSearch = function(request){
    $.ajax({
        type: 'GET',
        url: 'https://jisho.org/search/' + request.query,
        dataType: 'html',
        success: function(data) {
            var tempDom = $('<output>').append($.parseHTML(data));
            var y = $('.clearfix.concept_light', tempDom);
            var res = new Array();
            if (y.length) {
                var i;
                for (i = 0; i < y.length; i++) {
                    $(".concept_light-status>a", y[i]).remove();
                    res[i] = y[i].innerHTML;
                }
            } else {
                res = "No Results";
            }
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                var activeTab = tabs[0];
                chrome.tabs.sendMessage(activeTab.id, { "message": "show", "results": res });
            });
        }
    })
}

var HandleSearchKanji = function(request){
    $.ajax({
        type: 'GET',
        url: 'https://jisho.org/search/' + request.query + '%23kanji',
        dataType: 'text',
        success: function(data) {
            var svg_url = data.match("var url = " + "(.*?)" + ";");
            if (svg_url) {
                svg_url = svg_url[0].match("\'" + "(.*?)" + "\'")[0];
                svg_url = "https://" + svg_url.substring(3, svg_url.length - 1);
                var svg = null;
                $.ajax({
                    type: 'GET',
                    dataType: 'xml',
                    url: svg_url,
                    success: function(response) {
                        svg = response;
                        sendResponseKanji(data, svg);
                    },
                    error: function(jqXHR, exception, c) {
                        sendResponseKanji(data, svg);
                    }
                });
            } else {
                sendResponseKanji(data, null);
            }

        }
    })
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.message == "search") {
            HandleSearch(request);
        }
        if (request.message == "search-kanji") {    
            HandleSearchKanji(request);
        }
        if (request.message == "open-jisho") {
            chrome.tabs.create({ url: "https://jisho.org/search/" + request.query });
        }
        if (request.message == "open-jisho-kanji") {
            chrome.tabs.create({ url: "https://jisho.org/search/" + request.query + '%23kanji' });
        }
        if(request.message == "update_status"){
            chrome.storage.local.set({active:(request.status=='active')},()=>{
                chrome.runtime.sendMessage({message:"set_status",status:request.status});
                chrome.tabs.query({}, function(tabs) {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, {message:"set_status",status:request.status});
                    });
                });
                if (request.status == "active") chrome.browserAction.setIcon({ path: 'img/icon-active.png' });
                else chrome.browserAction.setIcon({ path: 'img/icon-inactive.png' });
            })
        }
        if(request.message == "get_status"){
            console.log(sender, "asking for status")
            chrome.storage.local.get("active",(res)=>{
                chrome.runtime.sendMessage({message:"set_status",status:res.active?"active":"inactive"});
                chrome.tabs.query({}, function(tabs) {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, {message:"set_status",status:res.active?"active":"inactive"});
                    });
                });
            })
        }
    }
);