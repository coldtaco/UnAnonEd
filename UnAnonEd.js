// ==UserScript==
// @name         UnAnonEd
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://edstem.org/au/courses/10360/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=edstem.org
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var xtoken = '';
    var options = {
        headers: {
            'X-Token': xtoken,
        },
    }

    async function requestJSON(url){
        // var request = new Request(url, options);
        /*fetch(request).then((response) => response.json()).then((res) => {
            return res;
        });*/
        const req = await fetch(url, options);
        return req.json();
    };

    async function getAuthorDetails(author){
        var url = `https://edstem.org/api/courses/10360/users/${author}?emails=true`
        return requestJSON(url).then((res) => {
            return res.user.name;
        })

    };
    async function getPostAuthor(post){
        var url = `https://edstem.org/api/threads/${post}`
        return requestJSON(url).then((res) => {
            return res.thread.user_id;
        })
    };

    async function fixAnon(ele){
        var href = ele.getElementsByTagName('a')[0].href;
        var name_element = ele.getElementsByClassName('dft-user')[0];

        if (name_element.innerHTML.localeCompare('Anonymous') != 0) {return;}

        var post_id = href.split('/').pop();
        var author_id = await getPostAuthor(post_id)
        var author_name = await getAuthorDetails(author_id)

        name_element.innerHTML = `${author_name} (Anonymous)`;
    };

    async function fixWrapper(event){
        var ele = event.target;
        if (ele.nodeName.localeCompare('#text') == 0){return;}
        if (ele.className.localeCompare('dlv-item') != 0){return;}
        await fixAnon(ele);
    };


    function waitForElm(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    function fixExisting(elements){
        for (let i = 0; i < elements.length; i++){
            fixAnon(elements[i]);
        }
    };

    waitForElm('.dtl-group-heading').then((elm) => {
        console.log('Element is ready');
        console.log(elm.textContent);
        const ele = document.getElementById('x7-option-1283739');
        const discussion_list = document.getElementsByClassName('discuss-thread-list')[0];
        discussion_list.addEventListener("DOMNodeInserted", fixWrapper);
        fixExisting(discussion_list.getElementsByClassName('dlv-item'));
    });

})();