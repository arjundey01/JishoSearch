var displaying = false;
var curr_ind = 0;
var curr_results = null;
var kanji = false;

var box = document.createElement('div');

var active = false;
box.id = 'box-jp';
document.body.appendChild(box);

var template = `
                <div id="primary" class="large-8 columns" >
                <div class="concepts" id="container-jp">
                </div>
                </div>
                <div id="scroll-jp">
                <div id="scroll-cursor"></div>
                </div>
                `
box.innerHTML = template;
var scrollbar = document.getElementById("scroll-jp");
var scrollcursor = document.getElementById("scroll-cursor");


//Update active status with background script when loaded
window.onload=function(e){
    chrome.runtime.sendMessage({message:"get_status"});
};

document.addEventListener('mouseup', e => {
    if (!active) return;
    if ($('#box-jp').is(":visible")) return;
    handleSelectedText(e);
});

//Keyboard shortcut ctrl + alt + J for toggling the extension
window.onkeydown= function(e){
    if(e.key == 'j' && e.ctrlKey && e.altKey){
        if (!active) {
            chrome.runtime.sendMessage({message:"update_status", status: "active"});
        } else {
            chrome.runtime.sendMessage({message:"update_status", status: "inactive"});
        }
    }
}


//Adding Message Listener(s)
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        //Update the active status in the content script when the status is changed
        if (request.message == 'set_status') {
            active = (request.status=='active');
        }

        //Show the results of search query
        if (request.message == "show") {
            curr_results = request.results;
            document.getElementById("container-jp").innerHTML = request.results[0];
            box.style.display = 'block';
            scrollbar.style.display = 'block';
            displaying = true;
        }

        //Show the results of kanji search query
        if (request.message == "show-kanji") {
            box.style.display = 'block';
            displaying = true;
            document.getElementById("container-jp").innerHTML = request.results;
            kanji = true;
            initStrokeDiagram($.parseXML(request.svg));
        }
    }
);


//The box is not hidden if there is a click inside the box
$('#box-jp').click(function(event) {
    event.stopPropagation();
});

//Hide the box if clicked outside the box
$(document).click(function(event) {
    if (displaying) {
        $('#box-jp').css("display", "none");
        scrollbar.style.display = 'none';
        curr_results = null;
        curr_ind = 0;
        displaying = false;
        kanji = false;
        scrollcursor.style.left = "0px";
    }
});

//Horizontal scroll for results
document.getElementById("box-jp").addEventListener("wheel", function(event) {
    if (!displaying || kanji) return;
    event.preventDefault();
    if (event.deltaY > 0) {
        curr_ind = (curr_ind + 1) % curr_results.length;
    } else {
        curr_ind = ((curr_ind - 1) % curr_results.length + curr_results.length) % curr_results.length;
    }
    scrollcursor.style.left = ((scrollbar.clientWidth) * curr_ind / curr_results.length).toString() + "px";
    document.getElementById("container-jp").innerHTML = curr_results[curr_ind];
});


function handleSelectedText(e) {
    const sel = window.getSelection();

    if (typeof sel != "undefined" && sel.toString()!="") {

        var selectedText = sel.toString();
        console.log(selectedText + " : is selected");
        var msg ;

        if(e.ctrlKey && e.altKey)
            msg = "open-jisho-kanji";
        else if(e.ctrlKey)
            msg = "open-jisho";
        else if(e.altKey)
            msg = "search-kanji";
        else 
            msg = "search";

        if (msg == "search" || msg == "search-kanji") {
            box.style.display = 'block';
            var loading_img = chrome.runtime.getURL('/img/loading.gif')
            document.getElementById("container-jp").innerHTML = "<img src=\"" + loading_img + "\" style=\"width:150px; margin:auto; display:block\">";
            positionBoxToSel(sel);
            box.scrollIntoView({behavior: "smooth", block: "center"});
        }else{
            sel.removeAllRanges();
        }
        chrome.runtime.sendMessage({ "query": selectedText, "message": msg });
    }
}

function positionBoxToSel(sel){
    sel = window.getSelection();
    range = sel.getRangeAt(0).cloneRange();
    range.collapse(false);
    markerEl = document.createElement("span");
    markerEl.id = "&%ufgr";
    markerEl.appendChild(document.createTextNode("&%tyur"));
    range.insertNode(markerEl);
    var obj = markerEl;
    var left = 0,
        top = 0;
    do {
        left += obj.offsetLeft;
        top += obj.offsetTop;
    } while (obj = obj.offsetParent);
    left += 10;
    top += 10;
    box.style.left = left + "px";
    box.style.top = top + "px";
    markerEl.parentNode.removeChild(markerEl);
}


// The following functions have been extracted from the Jisho website
// They use the Snap library to draw the kanji stroke order diagrams from a
// svg image

var strokeOrderDiagram = function(element, svgDocument) {
    var s = Snap(element);
    var diagramSize = 200;
    var coordRe = '(?:\\d+(?:\\.\\d+)?)';
    var strokeRe = new RegExp('^[LMT]\\s*(' + coordRe + ')[,\\s](' + coordRe + ')', 'i');
    var f = Snap(svgDocument.getElementsByTagName('svg')[0]);
    var allPaths = f.selectAll("path");
    var drawnPaths = [];
    var canvasWidth = (allPaths.length * diagramSize) / 2;
    var canvasHeight = diagramSize / 2;
    var frameSize = diagramSize / 2;
    var frameOffsetMatrix = new Snap.Matrix()
    frameOffsetMatrix.translate((-frameSize / 16) + 2, (-frameSize / 16) + 2);

    // Set drawing area
    s.node.style.width = canvasWidth + "px";
    s.node.style.height = canvasHeight + "px";
    s.node.setAttribute("viewBox", "0 0 " + canvasWidth + " " + canvasHeight);

    // Draw global guides
    var boundingBoxTop = s.line(1, 1, canvasWidth - 1, 1);
    var boundingBoxLeft = s.line(1, 1, 1, canvasHeight - 1);
    var boundingBoxBottom = s.line(1, canvasHeight - 1, canvasWidth - 1, canvasHeight - 1);
    var horizontalGuide = s.line(0, canvasHeight / 2, canvasWidth, canvasHeight / 2);
    boundingBoxTop.attr({ "class": "stroke_order_diagram--bounding_box" });
    boundingBoxLeft.attr({ "class": "stroke_order_diagram--bounding_box" });
    boundingBoxBottom.attr({ "class": "stroke_order_diagram--bounding_box" });
    horizontalGuide.attr({ "class": "stroke_order_diagram--guide_line" });

    // Draw strokes
    var pathNumber = 1;
    allPaths.forEach(function(currentPath) {
        var moveFrameMatrix = new Snap.Matrix()
        moveFrameMatrix.translate((frameSize * (pathNumber - 1)) - 4, -4);

        // Draw frame guides
        var verticalGuide = s.line((frameSize * pathNumber) - (frameSize / 2), 1, (frameSize * pathNumber) - (frameSize / 2), canvasHeight - 1);
        var frameBoxRight = s.line((frameSize * pathNumber) - 1, 1, (frameSize * pathNumber) - 1, canvasHeight - 1);
        verticalGuide.attr({ "class": "stroke_order_diagram--guide_line" });
        frameBoxRight.attr({ "class": "stroke_order_diagram--bounding_box" });

        // Draw previous strokes
        drawnPaths.forEach(function(existingPath) {
            var localPath = existingPath.clone();
            localPath.transform(moveFrameMatrix);
            localPath.attr({ "class": "stroke_order_diagram--existing_path" })
            s.append(localPath);
        });

        // Draw current stroke
        currentPath.transform(frameOffsetMatrix);
        currentPath.transform(moveFrameMatrix);
        currentPath.attr({ "class": "stroke_order_diagram--current_path" })
        s.append(currentPath);

        // Draw stroke start point
        var match = strokeRe.exec(currentPath.node.getAttribute('d'));
        var pathStartX = match[1];
        var pathStartY = match[2];
        var strokeStart = s.circle(pathStartX, pathStartY, 4);
        strokeStart.attr({ "class": "stroke_order_diagram--path_start" });
        strokeStart.transform(moveFrameMatrix);

        pathNumber++;
        drawnPaths.push(currentPath.clone());
    });
};

var initStrokeDiagram = function(svg) {
    var el = $('.stroke_order_diagram--outer_container svg');
    el.css('display', 'block');
    strokeOrderDiagram(el.get(0), svg);
}