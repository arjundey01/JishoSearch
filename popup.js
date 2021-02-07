var active;
document.addEventListener('DOMContentLoaded', function() {
    var toggleButton = document.getElementById('toggle');
    chrome.runtime.sendMessage({ message : "get_status" });
  
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.message = "set_status") {
                console.log("setting " + request.status )
                if (request.status == "active") {
                    toggleButton.innerHTML = "Deactivate";
                    active = true;
                    toggleButton.style.background = "rgb(206, 121, 121)";
                } else {
                    toggleButton.innerHTML = "Activate";
                    active = false;
                    toggleButton.style.background = "rgb(141, 208, 135)";
                }
            }

        }
    );

    toggleButton.addEventListener('click', function() {
        if (!active) {
            chrome.runtime.sendMessage({message:"update_status", status: "active"});
        } else {
            chrome.runtime.sendMessage({message:"update_status", status: "inactive"});
        }
    }, false);

}, false);